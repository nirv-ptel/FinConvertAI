import { CanActivate, ExecutionContext, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ACCESSTOKEN } from 'src/common/database/constants/collection.constant';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';

@Injectable()
export class AccesstokenGuard implements CanActivate {
  constructor(
    private readonly _queriesDatabaseService: QueriesDatabaseService
  ) {

  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const { user, tenantId } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "Unauthorized",
      });
    }
    return this._queriesDatabaseService.findOne(tenantId, ACCESSTOKEN, { _id: user.tokenId })
      .then((token) => {
        if (!token.length) {
          return Promise.reject(0);
        }
        return true;
      }).catch((error) => {
        if (error == 0) {
          throw new UnauthorizedException({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: "invalid token",
          });
        }
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: "Something went wrong on server"
        });
        return false;
      })
  }
}
