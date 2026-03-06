import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from '@nestjs/common';
import { AuthJwtAccessGuard } from 'src/common/auth/guards/jwt-access/auth.jwt.access.guard';
import { AccesstokenGuard } from '../guards/accesstoken.guard';
import { AdminAccessTokenGuard } from '../guards/adminAccessToken.guard';



export const AuthJwtPayload = createParamDecorator(
    (data: string, ctx: ExecutionContext): Record<string, any> => {
        const { user } = ctx.switchToHttp().getRequest();
        return data ? user[data] : user;
    }
);

export function AuthJwtAccessProtected(): MethodDecorator {
    return applyDecorators(UseGuards(AuthJwtAccessGuard, AccesstokenGuard));
}

export function AdminAuthJwtAccessProtected(): MethodDecorator {
    return applyDecorators(UseGuards(AuthJwtAccessGuard, AdminAccessTokenGuard));
}

