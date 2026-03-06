import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthJwtAccessGuard extends AuthGuard('jwt') {
    // handleRequest<TUser = any>(err: Error, user: TUser, info: Error): TUser {
    //     if (err || !user) {
    //         throw new UnauthorizedException({
    //             statusCode: 5000,
    //             message: 'The access token is unauthorized.',
    //             _error: err ? err.message : info.message,
    //         });
    //     }
    //     return user;
    // }

    
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    return super.canActivate(context)
  }
}
