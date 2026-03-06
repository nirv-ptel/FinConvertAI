import { HttpStatus } from '@nestjs/common';
import { IPaginationOptions } from 'src/common/pagination/interface/pagination.interface';

export interface IResponsePropertyMetadata {
    statusCode?: number;
    message?: string;
    httpStatus?: HttpStatus;
}

// type
export interface IResponse {
    data?: Record<string, any> | Record<string, any>[];
    pagination?: IPaginationOptions;
    message?: string;
    status?: number;
    tenantId?: string;
}

export interface IResponseFile {
    data?: any;
    ext?: string;
    fileName?: string;
}