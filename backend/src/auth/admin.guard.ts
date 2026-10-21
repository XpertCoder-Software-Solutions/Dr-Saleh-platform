import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import type { Request } from 'express';
import { ADMIN_PERMISSIONS_KEY, ANY_ADMIN } from './admin-permissions';
import type { AuthenticatedUser } from './jwt.strategy';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

/**
 * Admin routes. Super admins can use everything; staff admins only the sections
 * named by @RequireAdminPermission on the route or its controller.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (user?.role !== RoleName.Admin) {
      throw new ForbiddenException('Admin access is required.');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      ADMIN_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      required?.some(
        (permission) =>
          permission === ANY_ADMIN ||
          (user.adminPermissions ?? []).includes(permission),
      )
    ) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission for this section.',
    );
  }
}
