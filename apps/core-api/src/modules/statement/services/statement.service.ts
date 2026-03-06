import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { QueriesDatabaseService } from '../../../common/database/services/queries.database.service';
import { HelperDateService } from '../../../common/helper/services/helper.date.service';
import { IStatement } from '../interface/statement.interface';
import { lastValueFrom } from 'rxjs';
import { ISession } from '../../../common/auth/interface/auth.interface';
import { STATEMENT } from '../../../common/database/constants/collection.constant';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StatementService {
    private readonly logger = new Logger(StatementService.name);

    constructor(
        private readonly _queriesDatabaseService: QueriesDatabaseService,
        private readonly _helperDateService: HelperDateService,
        private readonly httpService: HttpService,
        private configService: ConfigService,
    ) { }

    async createStatement(
        session: ISession,
        fileName: string,
        localPath: string,
        bank?: string,
    ): Promise<IStatement> {
        const newStatement: IStatement = {
            userId: session.userId,
            ownerId: session.ownerId,
            tenantId: session.tenantId,
            fileName,
            localPath,
            bank,
            status: 'UPLOADED',
            created: this._helperDateService.dbDate(),
            modified: this._helperDateService.dbDate(),
        };

        const result = await this._queriesDatabaseService.insert(
            session.tenantId,
            STATEMENT,
            newStatement,
        );

        // Add _id back to object based on what insert() usually does (we'll fetch it fully)
        const statementId = (result.insertedId || newStatement['_id']).toString();
        return this.getStatementById(session, statementId);
    }

    async getStatementById(session: ISession, id: string): Promise<IStatement> {
        const statements = await this._queriesDatabaseService.findOne(
            session.tenantId,
            STATEMENT,
            { _id: id, ownerId: session.ownerId },
        );

        if (!statements || statements.length === 0) {
            throw new HttpException('Statement not found', HttpStatus.NOT_FOUND);
        }
        return statements[0];
    }

    async processStatement(
        session: ISession,
        id: string,
        password?: string,
    ): Promise<IStatement> {
        const statement = await this.getStatementById(session, id);
        const processorUrl = this.configService.get<string>('PROCESSOR_SVC_URL', 'http://localhost:8000');

        try {
            // Update status to processing
            await this.updateStatementStatus(session, id, 'PROCESSING');

            // Call Python Microservice
            const response = await lastValueFrom(
                this.httpService.post(`${processorUrl}/api/parse`, {
                    file_path: statement.localPath,
                    password: password || null,
                    bank: statement.bank || null,
                }),
            );

            const parsedData = response.data;

            // Update statement with success data
            const updateData = {
                status: 'PROCESSED',
                bank: parsedData.bank,
                accountInfo: parsedData.account_info,
                transactions: parsedData.transactions,
                totalTransactions: parsedData.total_transactions,
                source: parsedData.source,
                errorMessage: null,
            };

            await this._queriesDatabaseService.update(
                session.tenantId,
                STATEMENT,
                { _id: id },
                updateData,
            );

            return this.getStatementById(session, id);

        } catch (error: any) {
            this.logger.error('Error parsing statement', error);

            let newStatus = 'FAILED';
            let errorMessage = 'Failed to parse document';

            // Axios error handling
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail || error.response.data?.message;

                if (status === 400 && detail?.includes('password')) {
                    newStatus = 'PASSWORD_REQUIRED';
                    errorMessage = 'Document is password protected';
                } else if (status === 422) {
                    newStatus = 'NOT_SUPPORTED';
                    errorMessage = detail || 'Bank format not supported or no transactions found';
                } else {
                    errorMessage = detail || errorMessage;
                }

                await this.updateStatementStatus(session, id, newStatus, errorMessage);

                throw new HttpException({
                    status: status,
                    error: newStatus,
                    message: errorMessage,
                }, status);
            }

            await this.updateStatementStatus(session, id, newStatus, error.message || errorMessage);
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'PARSING_FAILED',
                message: error.message || errorMessage
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteStatement(session: ISession, id: string): Promise<any> {
        const statement = await this.getStatementById(session, id);

        // Delete from DB
        await this._queriesDatabaseService.delete(session.tenantId, STATEMENT, { _id: id });

        // Delete File
        if (statement.localPath && fs.existsSync(statement.localPath)) {
            try {
                fs.unlinkSync(statement.localPath);
            } catch (err) {
                this.logger.error(`Failed to delete file: ${statement.localPath}`, err);
            }
        }
    }

    async updateStatementStatus(
        session: ISession,
        id: string,
        status: string,
        errorMessage: string | null = null,
    ) {
        const updatePayload: any = {
            status,
            modified: this._helperDateService.dbDate(),
        };
        if (errorMessage !== null) {
            updatePayload.errorMessage = errorMessage;
        }

        return this._queriesDatabaseService.update(
            session.tenantId,
            STATEMENT,
            { _id: id },
            updatePayload,
        );
    }
    async updateTransaction(
        session: ISession,
        id: string,
        index: number,
        data: any,
    ): Promise<any> {
        const statement = await this.getStatementById(session, id);
        if (!statement.transactions) {
            throw new HttpException('No transactions found', HttpStatus.BAD_REQUEST);
        }

        const transactions = [...statement.transactions];
        if (index < 0 || index >= transactions.length) {
            throw new HttpException('Invalid transaction index', HttpStatus.BAD_REQUEST);
        }

        // Update specific transaction
        transactions[index] = { ...transactions[index], ...data };

        await this._queriesDatabaseService.update(
            session.tenantId,
            STATEMENT,
            { _id: id },
            { transactions },
        );

        return transactions[index];
    }

    async addTransaction(
        session: ISession,
        id: string,
        data: any,
    ): Promise<any> {
        const statement = await this.getStatementById(session, id);
        const transactions = [...(statement.transactions || [])];

        transactions.push(data);

        await this._queriesDatabaseService.update(
            session.tenantId,
            STATEMENT,
            { _id: id },
            {
                transactions,
                totalTransactions: transactions.length,
                modified: this._helperDateService.dbDate(),
            },
        );

        return transactions[transactions.length - 1];
    }

    async updateAllTransactions(
        session: ISession,
        id: string,
        transactions: any[],
        accountInfo?: any,
    ): Promise<any> {
        const updateData: any = {
            transactions,
            totalTransactions: transactions.length,
            modified: this._helperDateService.dbDate(),
        };

        if (accountInfo) {
            updateData.accountInfo = accountInfo;
        }

        await this._queriesDatabaseService.update(
            session.tenantId,
            STATEMENT,
            { _id: id },
            updateData,
        );

        return { transactions, accountInfo };
    }

    async exportStatement(
        session: ISession,
        id: string,
        format: string,
    ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
        const statement = await this.getStatementById(session, id);
        const txns = statement.transactions || [];
        const baseFileName = statement.fileName.replace(/\.[^/.]+$/, "");

        if (format === 'csv') {
            const headers = ['date', 'Particulars', 'Chq./Ref.No.', 'Withdrawl', 'Deposit', 'Balance'];
            const rows = txns.map(t => [
                t.date || '',
                t.Particulars || '',
                t['Chq./Ref.No.'] || '',
                t.Withdrawl || '',
                t.Deposit || '',
                t.Balance || '',
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            return {
                buffer: Buffer.from(csvContent),
                fileName: `${baseFileName}_export.csv`,
                mimeType: 'text/csv',
            };
        } else if (format === 'json') {
            return {
                buffer: Buffer.from(JSON.stringify(txns, null, 2)),
                fileName: `${baseFileName}_export.json`,
                mimeType: 'application/json',
            };
        } else if (format === 'tally-xml') {
            // Very basic Tally-style XML
            let xml = '<?xml version="1.0"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>Vouchers</REPORTNAME>\n      </REQUESTDESC>\n      <REQUESTDATA>\n';

            txns.forEach((t: any) => {
                xml += '        <VOUCHER>\n';
                xml += `          <DATE>${t.date?.replace(/\//g, '') || ''}</DATE>\n`;
                xml += `          <NARRATION>${t.Particulars || ''}</NARRATION>\n`;
                xml += `          <VOUCHERNUMBER>${t['Chq./Ref.No.'] || ''}</VOUCHERNUMBER>\n`;
                xml += '        </VOUCHER>\n';
            });

            xml += '      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>';

            return {
                buffer: Buffer.from(xml),
                fileName: `${baseFileName}_tally.xml`,
                mimeType: 'application/xml',
            };
        }

        throw new HttpException('Unsupported export format', HttpStatus.BAD_REQUEST);
    }
    async getStatementStats(session: ISession): Promise<any> {
        const stats = await this._queriesDatabaseService.aggregation(
            session.tenantId,
            STATEMENT,
            [
                { $match: { ownerId: session.ownerId } },
                {
                    $group: {
                        _id: null,
                        totalUploads: { $sum: 1 },
                        totalConversions: { $sum: 1 }, // Treat upload attempt as a conversion for this metric
                        completedConversions: {
                            $sum: { $cond: [{ $eq: ['$status', 'PROCESSED'] }, 1, 0] },
                        },
                        failedConversions: {
                            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalUploads: 1,
                        totalConversions: 1,
                        completedConversions: 1,
                        failedConversions: 1,
                        successRate: {
                            $cond: [
                                { $eq: ['$totalConversions', 0] },
                                0,
                                { $multiply: [{ $divide: ['$completedConversions', '$totalConversions'] }, 100] }
                            ]
                        }
                    }
                }
            ]
        );

        return stats[0] || {
            totalUploads: 0,
            totalConversions: 0,
            completedConversions: 0,
            failedConversions: 0,
            successRate: 0,
        };
    }
}
