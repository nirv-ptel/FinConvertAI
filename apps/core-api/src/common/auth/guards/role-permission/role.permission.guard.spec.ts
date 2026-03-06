import { RolePermissionGuard } from "./role.permission.guard";



describe('RolePermissionGuard', () => {
  it('should be defined', () => {
    expect(new RolePermissionGuard()).toBeDefined();
  });
});
