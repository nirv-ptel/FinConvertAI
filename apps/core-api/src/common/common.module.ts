import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppMiddlewareModule } from './middlewares/app.middleware.module';
import { AuthModule } from './auth/auth.module';
import { HelperModule } from './helper/helper.module';
import { ErrorModule } from './error/error.module';
import { ResponseModule } from './response/response.module';
import { PaginationModule } from './pagination/pagination.module';
import { MailModule } from './mail/mail.module';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from './activity-log/activity-log';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ENUM_APP_ENVIROMENT } from 'src/app/constants/app.enum.constant';

@Module({
    controllers: [],
    providers: [],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: ['.env'],
            expandVariables: false,
        }),
        ...(process.env.APP_ENV.trim() !== ENUM_APP_ENVIROMENT.DEVELOPMENT ? [LoggerModule.forRoot(pinoConfig)] : []),
        DatabaseModule,
        AppMiddlewareModule,
        AuthModule.forRoot(),
        HelperModule,
        ErrorModule,
        ResponseModule,
        PaginationModule,
        MailModule,
        EventEmitterModule.forRoot()
    ],
})
export class CommonModule { }
