export interface IStatement {
    _id?: string;
    userId?: string;
    ownerId?: string;
    tenantId?: string;
    fileName?: string;
    localPath?: string;
    status?: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'PASSWORD_REQUIRED' | 'FAILED';
    errorMessage?: string;
    bank?: string;
    accountInfo?: Record<string, any>;
    transactions?: Record<string, any>[];
    totalTransactions?: number;
    source?: string;
    created?: Date;
    modified?: Date;
}
