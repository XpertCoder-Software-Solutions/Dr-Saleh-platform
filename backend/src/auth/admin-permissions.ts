import { SetMetadata } from '@nestjs/common';

/**
 * Dashboard sections a staff admin can be given. Super admins have all of them, plus
 * managing staff accounts.
 */
export const ADMIN_PERMISSIONS = [
  'courses',
  'catalog',
  'blog',
  'orders',
  'consultations',
  'students',
  'reviews',
  'settings',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_PERMISSIONS_KEY = 'adminPermissions';
/** Any signed-in admin (e.g. the dashboard overview). */
export const ANY_ADMIN = 'any';

/**
 * Which permission(s) an admin route needs; having any one of them is enough.
 * Admin routes without this decorator are for super admins only.
 */
export const RequireAdminPermission = (
  ...permissions: (AdminPermission | typeof ANY_ADMIN)[]
) => SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);
