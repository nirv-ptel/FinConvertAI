import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, HttpStatus, ForbiddenException, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_META_KEY, ROLE_PERMISSION_META_KEY, } from '../../constants/role.permission.constants';

@Injectable()
export class RolePermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.modules) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    }

    const role = this.reflector.get<string>(ROLE_META_KEY, context.getHandler(),);
    const permissions = this.reflector.get<string[]>(ROLE_PERMISSION_META_KEY, context.getHandler());

    if (!role || !permissions) {
      return true;
    }

    const checkAccess = user.modules.find((m: any) => m.name === 'all' || m.name === role);
    if (checkAccess) {
      if (permissions.includes(checkAccess.grantPermission)) {
        return true;
      } else {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          message: `you don't have permission of role`,
        });
      }
    } else {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `you don't have permission of role`,
      });
    }
  }
}
