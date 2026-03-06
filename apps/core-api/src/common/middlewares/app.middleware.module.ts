import { MiddlewareConsumer, Module, NestModule, } from '@nestjs/common';
import { JsonBodyParserMiddleware, } from 'src/common/middlewares/body-parser/body-parser.middleware';
import { RequestCorsMiddleware } from 'src/common/middlewares/cors/request.cors.middleware';
import { TenantMiddleware } from './tenant/request.tenant.middleware';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
    controllers: [],
    exports: [],
    providers: [JwtService],
    imports: [AuthModule]
})
export class AppMiddlewareModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(
                JsonBodyParserMiddleware,
                RequestCorsMiddleware,
            ).forRoutes('*')
            .apply(TenantMiddleware).exclude(
                { path: 'auth/login', method: 1 },
                { path: 'auth/login/otp', method: 1 },
                { path: 'auth/sso', method: 1 },
                { path: 'admin/auth/login', method: 1 },
                { path: 'auth/forgot-password', method: 1 },
                { path: 'auth/reset-password', method: 1 },
            ).forRoutes('customer', 'role', 'statement', 'auth');
    }
}
