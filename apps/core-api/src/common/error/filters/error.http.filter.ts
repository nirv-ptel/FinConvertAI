import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Response } from 'express';
import { ENUM_APP_ENVIROMENT } from 'src/app/constants/app.enum.constant';
import { ERRORLOG } from 'src/common/database/constants/collection.constant';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';

// If we throw error with HttpException, there will always return object
// The exception filter only catch HttpException
@Catch()
export class ErrorHttpFilter implements ExceptionFilter {
    constructor(
        private readonly _queriesDatabaseService: QueriesDatabaseService,
        private readonly _masterQueriesService: MasterQueriesDatabaseService
    ) { }

    async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const request = ctx.getRequest();
        const response: Response = ctx.getResponse<Response>();
        let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string = "Internal server error";
        if (exception instanceof HttpException) {
            const responseException = exception.getResponse();
            if (this.isErrorDtoException(responseException)) {

                statusCode = responseException.statusCode;
                message = Array.isArray(responseException.message) ? responseException.message[0] : responseException.message;
            }
            if (this.isErrorException(responseException)) {

                statusCode = responseException.status;
                message = responseException.error;
            }
        }
        else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;;
            message = "Internal server error";
        }
        const { user, url, method, body, params, query, tenantId } = request;

        const error_log: Record<string, any> = {
            originalUrl: url,
            method: method,
            params: JSON.stringify(params),
            query: JSON.stringify(query),
            body: JSON.stringify(body),
            customerId: user?.ownerId || "",
            userId: user?.userId || "",
            email: user?.email || "",
            name: user?.name || "",
            publicIp: request.headers.ip ? request.headers.ip : "",
            statusCode: statusCode,
            message: message,
            exception: exception
        };
        if ( ![ENUM_APP_ENVIROMENT.DEVELOPMENT].includes(process.env.APP_ENV.trim() as ENUM_APP_ENVIROMENT)) {
            if (tenantId)
                await this._queriesDatabaseService.insert(tenantId, ERRORLOG, error_log)
            else
                await this._masterQueriesService.insert(ERRORLOG, error_log);
        }
        const responseBody = {
            statusCode,
            message
        };

        response.status(statusCode).json(responseBody);
        return;
    }

    isErrorDtoException(obj: any): obj is IErrorDtoException {
        return typeof obj === 'object' ? 'statusCode' in obj && 'message' in obj : false;
    }

    isErrorException(obj: any): obj is IErrorException {
        return typeof obj === 'object' ? 'error' in obj && 'status' in obj : false;
    }

}

export interface IErrorDtoException {
    statusCode: number;
    message: string;
    _error?: string;
}

export interface IErrorException {
    error: string;
    status: number;
}