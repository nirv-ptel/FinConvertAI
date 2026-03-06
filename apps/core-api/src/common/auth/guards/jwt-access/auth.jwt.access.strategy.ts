import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth.service';
import { ISession } from '../../interface/auth.interface';

@Injectable()
export class AuthJwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly configService: ConfigService,
        private readonly _authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(configService.get<string>('PREFIX_AUTH')),
            ignoreExpiration: false,
            jsonWebTokenOptions: {
                ignoreNotBefore: false,
                audience: configService.get<string>('AUTH_JWT_AUDIENCE'),
                issuer: configService.get<string>('AUTH_JWT_ISSUER'),
                subject: configService.get<string>('AUTH_JWT_SUBJECT'),
            },
            secretOrKey: configService.get<string>('AUTH_JWT_ACCESS_TOKEN_SECRET_KEY'),
        });
    }

    async validate(data: Record<string, any>): Promise<any> {
        if (this._authService.isPayloadEncrypt) {
            return this._authService.aes256Decrypt(data.token);
        }
        return data;
    }
}
