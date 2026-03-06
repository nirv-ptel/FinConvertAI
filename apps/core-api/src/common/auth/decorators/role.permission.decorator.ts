import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ROLE_META_KEY, ROLE_PERMISSION_META_KEY } from '../constants/role.permission.constants';
import { RolePermissionGuard } from '../guards/role-permission/role.permission.guard';

export function RolePermission(roleName: string, rolePermission: string[]): MethodDecorator {
    return applyDecorators(
        UseGuards(RolePermissionGuard),
        SetMetadata(ROLE_META_KEY, roleName),
        SetMetadata(ROLE_PERMISSION_META_KEY, rolePermission)
    );
}