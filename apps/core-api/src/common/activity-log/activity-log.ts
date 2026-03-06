import moment from "moment";
import { JwtService } from '@nestjs/jwt';
import pino from 'pino';
import { config } from 'dotenv';
import { HelperDateService } from "../helper/services/helper.date.service";
import { AuthService } from "../auth/auth.service";
import { ConfigService } from "@nestjs/config";
import { ENUM_APP_ENVIROMENT } from "src/app/constants/app.enum.constant";
config();
export const pinoConfig = {

    pinoHttp: {
        // level: process.env.LOG_LEVEL || (process.env.APP_ENV.trim() === ENUM_APP_ENVIROMENT.PRODUCTION ? 'info' : 'info'),
        levels: 'info',
        transport:
            ![ENUM_APP_ENVIROMENT.DEVELOPMENT].includes(process.env.APP_ENV.trim() as ENUM_APP_ENVIROMENT)
                ? {
                    target: 'pino-mongodb',
                    level: 'info',
                    options: {
                        uri: process.env.DATABASE_HOST,//process.env.DATABASE_HOST,
                        database: "XpandMaster_log", //process.env.DATABASE_NAME + "_log",
                        collection: `req_log_${moment().utc().format('YYYY_WW')}`,
                        mongoOptions: {
                            auth: {
                                username: process.env.DATABASE_USER,
                                password: process.env.DATABASE_PASSWORD,
                            }
                        }
                    }
                }
                : {
                    target: 'pino-pretty',
                    level: 'info',
                    options: {
                        colorize: true,
                        singleLine: false,
                        translateTime: 'SYS:standard',
                    },
                },
        base: ![ENUM_APP_ENVIROMENT.DEVELOPMENT].includes(process.env.APP_ENV.trim() as ENUM_APP_ENVIROMENT) ? { app: 'repotics', env: process.env.APP_ENV.trim() } : null,
        timestamp: ![ENUM_APP_ENVIROMENT.DEVELOPMENT].includes(process.env.APP_ENV.trim() as ENUM_APP_ENVIROMENT) ? pino.stdTimeFunctions.isoTime : true,
        serializers: {
            req: (req) => {
                const { headers } = req;
                if (headers && headers['authorization']) {
                    const bearerToken = headers['authorization'].split(' ')[1];
                    if (bearerToken) {
                        let decoded = new JwtService().decode(bearerToken);
                        let authService = new AuthService(new JwtService(), new ConfigService());
                        if (authService.isPayloadEncrypt) {
                            decoded = authService.aes256Decrypt(decoded.token)
                        }
                        return ({
                            id: req.id,
                            method: req.method,
                            url: req.url,
                            tenant: req.headers['x-tenant-id'] || 'default',
                            name: decoded["name"] || "",
                            email: decoded["email"] || "",
                            userId: decoded["userId"] || "",
                            customerId: decoded["ownerId"] || "",
                            body: req.raw.body,
                            created: new HelperDateService().dbDate(),
                            modified: new HelperDateService().dbDate()
                        })
                    }
                }
            },
            res: (res) => ({
                statusCode: res.statusCode,
                data: res.raw.data,
            }),
        }
    },
}