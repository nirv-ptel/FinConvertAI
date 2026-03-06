import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// import * as speakeasy from "speakeasy";
// import * as qrcode from "qrcode";
import { AES, enc, mode, pad } from 'crypto-js';
import { ISession } from './interface/auth.interface';

@Injectable()
export class AuthService {
    private readonly accessTokenSecretKey: string;
    private readonly accessTokenExpirationTime: number;

    private readonly accessPlayloadEncryptKey: string;
    private readonly accessPlayloadEncryptIv: string;

    private readonly payloadEncrypt: boolean;
    private readonly welcomePassword: string;

    private readonly goolgeAuthKey: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {
        this.goolgeAuthKey = this.configService.get<string>('GOOGLE_AUTH_KEY');
        this.accessTokenSecretKey = this.configService.get<string>('AUTH_JWT_ACCESS_TOKEN_SECRET_KEY');
        this.accessTokenExpirationTime = Number(this.configService.get<number>('AUTH_JWT_ACCESS_TOKEN_EXPIRED'));
        this.accessPlayloadEncryptKey = this.configService.get<string>('AUTH_JWT_PAYLOAD_ACCESS_TOKEN_ENCRYPT_KEY');
        this.accessPlayloadEncryptIv = this.configService.get<string>('AUTH_JWT_PAYLOAD_ACCESS_TOKEN_ENCRYPT_IV');
        this.welcomePassword = this.configService.get<string>('WELCOME_PASSWORD');
        this.payloadEncrypt = this.configService.get<string>('AUTH_JWT_PAYLOAD_ENCRYPT') === 'true' ? true : false;
    }

    get getWelcomePassword(): string {
        return this.welcomePassword.trim() ? this.welcomePassword.trim() : "repotics123";
    }

    get isPayloadEncrypt(): boolean {
        return this.payloadEncrypt;
    }

    get getGoolgeAuthKey(): string {
        return this.goolgeAuthKey;
    }

    createAccessToken(payload: Record<string, any>): string {
        return this.jwtEncrypt(
            { ...payload },
            {
                secretKey: this.configService.get<string>('AUTH_JWT_ACCESS_TOKEN_SECRET_KEY'),
                expiredIn: this.getAccessTokenExpirationTime(),
                audience: this.configService.get<string>('AUTH_JWT_AUDIENCE'),
                issuer: this.configService.get<string>('AUTH_JWT_ISSUER'),
                subject: this.configService.get<string>('AUTH_JWT_SUBJECT'),
            }
        );
    }

    jwtEncrypt(payload: Record<string, any>, options: Record<string, any>): string {
        return this.jwtService.sign(payload, {
            secret: options.secretKey,
            expiresIn: options.expiredIn,
            notBefore: options.notBefore ?? 0,
            audience: options.audience,
            issuer: options.issuer,
            subject: options.subject,
        });
    }

    getAccessTokenExpirationTime(): number {
        // Convert day to millisecond
        return this.accessTokenExpirationTime * 24 * 60 * 60 * 1000;
    }

    // generateSecretKey(email: string): speakeasy.GeneratedSecret {
    //     return speakeasy.generateSecret({ length: 20, name: "repotics " + email });
    // }

    // generateMFAOTP(secretKey: string): string {
    //     return speakeasy.totp({ secret: secretKey, encoding: 'base32' });
    // }

    // generateQRCodeURL(secret: speakeasy.GeneratedSecret): Promise<string> {
    //     return qrcode.toDataURL(secret.otpauth_url);
    // }

    // verifyOTP(secretKey: string, otp: string): boolean {
    //     return speakeasy.totp.verify({ secret: secretKey, token: otp, encoding: "base32" });
    // }

    jwtDecrypt(token: string): Record<string, any> {
        return this.jwtService.decode(token) as Record<string, any>;
    }

    aes256Encrypt(data: string | Record<string, any> | Record<string, any>[]): string {
        const cIv = enc.Utf8.parse(this.accessPlayloadEncryptIv);
        const cipher = AES.encrypt(JSON.stringify(data), this.accessPlayloadEncryptKey, { mode: mode.CBC, padding: pad.Pkcs7, iv: cIv, });

        return cipher.toString();
    }

    aes256Decrypt( encrypted: string): ISession {
        const cIv = enc.Utf8.parse(this.accessPlayloadEncryptIv);
        const cipher = AES.decrypt(encrypted, this.accessPlayloadEncryptKey, { mode: mode.CBC, padding: pad.Pkcs7, iv: cIv, });

        return JSON.parse(cipher.toString(enc.Utf8));
    }
}
