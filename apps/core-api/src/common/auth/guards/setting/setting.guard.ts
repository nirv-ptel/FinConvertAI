import { CanActivate, ExecutionContext, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SETTING } from 'src/common/database/constants/collection.constant';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';

@Injectable()
export class SettingGuard implements CanActivate {

  constructor(
    private readonly _queriesDatabaseService: QueriesDatabaseService
  ) {

  }
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const { user } = context.switchToHttp().getRequest();
    return this._queriesDatabaseService.findOne(user.tenantId, SETTING, { customerId: user.ownerId })
      .then((_setting) => {
        if (_setting.length) {
          user.setting = _setting[0];
          return true
        }
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: "Unauthorized",
        });
        return false
      })
  }
}

