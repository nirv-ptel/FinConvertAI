import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
    HttpException,
    HttpStatus,
    Delete,
    Put,
    Res,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { IStatement } from '../interface/statement.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProcessStatementDto } from '../dto/process.statement.dto';
import { StatementService } from '../services/statement.service';
import { AuthJwtAccessProtected, AuthJwtPayload } from '../../../common/auth/decorators/auth.jwt.decorator';
import { ISession } from '../../../common/auth/interface/auth.interface';
import { DocAuth, DocQueryList } from '../../../common/doc/decorators/doc.decorator';
import { AdminPaginationQuery } from '../../../common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '../../../common/pagination/dto/pagination.list.dto';
import { STATEMENT_DEFAULT_AVAILABLE_LIST, STATEMENT_DEFAULT_AVAILABLE_SEARCH } from '../constant/statement.list.constant';
import { Response } from '../../../common/response/decorators/response.decorator';
import { QueriesDatabaseService } from '../../../common/database/services/queries.database.service';
import { STATEMENT } from '../../../common/database/constants/collection.constant';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('statement')
@Controller('statement')
export class StatementController {
    constructor(
        private readonly statementService: StatementService,
        private readonly _queriesDatabaseService: QueriesDatabaseService,
    ) {
        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Statement uploaded successfully' })
    @AuthJwtAccessProtected()
    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                bank: {
                    type: 'string',
                    example: 'HDFC'
                }
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    return cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.originalname.match(/\.(pdf)$/)) {
                    return cb(new Error('Only PDF files are allowed!'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('bank') bank: string,
        @AuthJwtPayload() session: ISession,
    ) {
        if (!file) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }
        const absolutePath = path.resolve(file.path);

        const statement = await this.statementService.createStatement(
            session,
            file.originalname,
            absolutePath,
            bank,
        );

        return {
            message: 'File uploaded successfully',
            data: statement,
        };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Process statement successfully' })
    @ApiParam({ name: 'id', description: 'Statement ID' })
    @AuthJwtAccessProtected()
    @Post(':id/process')
    async processStatement(
        @Param('id') id: string,
        @Body() body: ProcessStatementDto,
        @AuthJwtPayload() session: ISession,
    ): Promise<{ message: string; data: IStatement }> {
        const data = await this.statementService.processStatement(session, id, body?.password);
        return {
            message: 'Statement processed successfully',
            data,
        };
    }

    @DocAuth()
    @DocQueryList()
    @ApiCreatedResponse({ description: 'Statement list retrieved successfully' })
    @Response('Statement list retrieved successfully')
    @AuthJwtAccessProtected()
    @Get('list')
    async listStatements(
        @AuthJwtPayload() session: ISession,
        @AdminPaginationQuery({
            availableSearch: STATEMENT_DEFAULT_AVAILABLE_SEARCH,
            availableList: STATEMENT_DEFAULT_AVAILABLE_LIST,
        })
        { _search, _limit, _offset, _order, _project, _page, _where }: PaginationListDto,
    ) {
        let query = [
            {
                $match: {
                    ..._search,
                    ownerId: session.ownerId,
                    ..._where,
                },
            },
            {
                $project: _project,
            },
            {
                $sort: _order,
            },
            {
                $skip: _offset,
            },
            {
                $limit: _limit,
            },
        ];

        const statements = await this._queriesDatabaseService.aggregation(
            session.tenantId,
            STATEMENT,
            query,
        );

        const countQuery = [query[0]];
        const countResult = await this._queriesDatabaseService.aggregation(
            session.tenantId,
            STATEMENT,
            countQuery,
        );

        const pagination = {
            total: countResult.length,
            page: _page - 1,
            limit: _limit,
        };

        return { data: statements, pagination };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Get statement statistics' })
    @AuthJwtAccessProtected()
    @Get('stats')
    async getStatementStats(
        @AuthJwtPayload() session: ISession,
    ) {
        const stats = await this.statementService.getStatementStats(session);
        return { data: stats };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Get statement details' })
    @ApiParam({ name: 'id', description: 'Statement ID' })
    @AuthJwtAccessProtected()
    @Get(':id')
    async getStatementDetails(
        @Param('id') id: string,
        @AuthJwtPayload() session: ISession,
    ) {
        const statement = await this.statementService.getStatementById(session, id);
        return { data: statement };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Delete statement successfully' })
    @ApiParam({ name: 'id', description: 'Statement ID' })
    @AuthJwtAccessProtected()
    @Delete(':id')
    async deleteStatement(
        @Param('id') id: string,
        @AuthJwtPayload() session: ISession,
    ) {
        await this.statementService.deleteStatement(session, id);
        return { message: 'Statement deleted successfully' };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Update transaction successfully' })
    @ApiParam({ name: 'id', description: 'Statement ID' })
    @ApiParam({ name: 'index', description: 'Transaction Index' })
    @AuthJwtAccessProtected()
    @Put(':id/transactions/:index')
    async updateTransaction(
        @Param('id') id: string,
        @Param('index') index: string,
        @Body() data: any,
        @AuthJwtPayload() session: ISession,
    ) {
        const updated = await this.statementService.updateTransaction(session, id, parseInt(index), data);
        return { data: updated };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Add transaction successfully' })
    @ApiParam({ name: 'id', description: 'Statement ID' })
    @AuthJwtAccessProtected()
    @Post(':id/transactions')
    async addTransaction(
        @Param('id') id: string,
        @Body() data: any,
        @AuthJwtPayload() session: ISession,
    ) {
        const updated = await this.statementService.addTransaction(session, id, data);
        return { data: updated };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Update all transactions successfully' })
    @ApiParam({ name: 'id', description: 'Statement ID' })
    @AuthJwtAccessProtected()
    @Put(':id/transactions-bulk')
    async updateAllTransactions(
        @Param('id') id: string,
        @Body() body: { transactions: any[], accountInfo?: any },
        @AuthJwtPayload() session: ISession,
    ) {
        const updated = await this.statementService.updateAllTransactions(session, id, body.transactions, body.accountInfo);
        return { data: updated };
    }

    @DocAuth()
    @ApiCreatedResponse({ description: 'Export statement successfully' })
    @ApiParam({ name: 'id', description: 'Statement ID' })
    @ApiParam({ name: 'format', description: 'Export format (csv, json, tally-xml)' })
    @AuthJwtAccessProtected()
    @Get(':id/export/:format')
    async exportStatement(
        @Param('id') id: string,
        @Param('format') format: string,
        @AuthJwtPayload() session: ISession,
        @Res() res,
    ) {
        const { buffer, fileName, mimeType } = await this.statementService.exportStatement(session, id, format);

        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length,
        });

        return res.send(buffer);
    }
}
