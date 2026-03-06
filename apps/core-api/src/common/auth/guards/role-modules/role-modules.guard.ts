import { CanActivate, ExecutionContext, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ROLE } from 'src/common/database/constants/collection.constant';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';

@Injectable()
export class RoleModulesGuard implements CanActivate {
  constructor(
    private readonly _queriesDatabaseService: QueriesDatabaseService
  ) {

  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const { user } = context.switchToHttp().getRequest();
    
    return this._queriesDatabaseService.findOne(user.tenantId, ROLE, { _id: user.roleId }, { modules: 1 })
      .then((_role) => {
        if (_role.length) {
          user.modules = _role[0].modules;
          return true;
        }
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: "Unauthorized",
        });
        return false;
      })    
  }
}
