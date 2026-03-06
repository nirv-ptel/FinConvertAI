import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as BodyParser from 'body-parser';
// import { ConfigService } from '@nestjs/config';


@Injectable()
export class JsonBodyParserMiddleware implements NestMiddleware {

    constructor() {
    }

    use(req: Request, res: Response, next: NextFunction): void {
        // console.log(BodyParser);
        BodyParser.json({
            limit: 100,
        })(req, res, next);
    }
}
