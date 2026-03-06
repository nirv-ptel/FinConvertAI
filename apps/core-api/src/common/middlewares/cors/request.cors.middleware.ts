import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
// import { ENUM_APP_ENVIRONMENT } from 'src/app/constants/app.enum.constant';

@Injectable()
export class RequestCorsMiddleware implements NestMiddleware {
    // private readonly appEnv: ENUM_APP_ENVIRONMENT;
    private readonly allowOrigin: string | boolean | string[];
    private readonly allowMethod: string[];
    private readonly allowHeader: string[];

    constructor() {
        // this.appEnv = this.configService.get<ENUM_APP_ENVIRONMENT>('app.env');
        // this.allowOrigin = this.configService.get<string | boolean | string[]>(
        //     'request.cors.allowOrigin'
        // );
        // this.allowMethod = this.configService.get<string[]>(
        //     'request.cors.allowMethod'
        // );
        // this.allowHeader = this.configService.get<string[]>(
        //     'request.cors.allowHeader'
        // );
    }

    use(req: Request, res: Response, next: NextFunction): void {
        // const allowOrigin =
        //     this.appEnv === ENUM_APP_ENVIRONMENT.PRODUCTION
        //         ? this.allowOrigin
        //         : '*';

        const corsOptions: cors.CorsOptions = {
            // origin: allowOrigin,
            methods: ['GET', 'DELETE', 'PUT', 'PATCH', 'POST'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'x-tenant-id',
                'X-TENANT-ID',
            ],
            preflightContinue: false,
            credentials: true,
            optionsSuccessStatus: HttpStatus.NO_CONTENT,
        };

        cors(corsOptions)(req, res, next);
    }
}
