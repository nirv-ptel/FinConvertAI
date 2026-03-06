import { CanActivate, ExecutionContext, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ACCESSTOKEN } from 'src/common/database/constants/collection.constant';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';

@Injectable()
export class AdminAccessTokenGuard implements CanActivate {
  constructor(
    private readonly _masterQueriesService: MasterQueriesDatabaseService
  ) {

  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "invalid token",
      });
    }
    return this._masterQueriesService.findOne(ACCESSTOKEN, { _id: user.tokenId })
      .then((token) => {
        if (token.length == 0) {
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
