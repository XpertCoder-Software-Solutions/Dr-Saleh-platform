import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  it('rejects normal users from admin-only routes', () => {
    const guard = new AdminGuard();
    const context = createExecutionContext({ role: RoleName.User });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows super admins everywhere', () => {
    const guard = new AdminGuard();
    const context = createExecutionContext({
      role: RoleName.Admin,
      isSuperAdmin: true,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows staff admins only into their sections', () => {
    const guard = new AdminGuard();
    const staff = {
      role: RoleName.Admin,
      isSuperAdmin: false,
      adminPermissions: ['courses'],
    };

    expect(guard.canActivate(createExecutionContext(staff, ['courses']))).toBe(
      true,
    );
    expect(() =>
      guard.canActivate(createExecutionContext(staff, ['orders'])),
    ).toThrow(ForbiddenException);
    expect(guard.canActivate(createExecutionContext(staff, ['any']))).toBe(
      true,
    );
    // No decorator: super admins only.
    expect(() => guard.canActivate(createExecutionContext(staff))).toThrow(
      ForbiddenException,
    );
  });
});

function createExecutionContext(
  user: {
    role: RoleName;
    isSuperAdmin?: boolean;
    adminPermissions?: string[];
  },
  required?: string[],
): ExecutionContext {
  const handler = () => undefined;
  if (required) Reflect.defineMetadata('adminPermissions', required, handler);
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => handler,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}
