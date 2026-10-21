import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { routes } from '@/app/routes'

/** Dashboard sections a staff admin can be given (same keys as the API). */
export const ADMIN_PERMISSIONS = [
  'courses',
  'catalog',
  'blog',
  'orders',
  'consultations',
  'students',
  'reviews',
  'settings',
] as const
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

export const PERMISSION_INFO: Record<AdminPermission, { label: string; note: string }> = {
  courses: { label: 'الدورات', note: 'إضافة وتعديل الدورات والدروس' },
  catalog: { label: 'الكتب والمنتجات', note: 'الكتب ونسخها والمنتجات' },
  blog: { label: 'المقالات', note: 'كتابة ونشر المقالات' },
  orders: { label: 'الطلبات', note: 'متابعة الطلبات والشحن' },
  consultations: { label: 'الاستشارات', note: 'طلبات ومواعيد الاستشارات' },
  students: { label: 'المستخدمين', note: 'حسابات الطلاب وإضافة دورات لهم' },
  reviews: { label: 'التقييمات', note: 'مراجعة تقييمات الدورات' },
  settings: { label: 'الإعدادات', note: 'الأقسام والشحن والكوبونات' },
}

/** Which permission each dashboard page needs (null = any admin, 'super' = full access only). */
export const PAGE_PERMISSION: { path: string; permission: AdminPermission | null | 'super' }[] = [
  { path: routes.adminCourses, permission: 'courses' },
  { path: routes.adminOrders, permission: 'orders' },
  { path: routes.adminConsultRequests, permission: 'consultations' },
  { path: routes.adminSchedule, permission: 'consultations' },
  { path: routes.adminUsers, permission: 'students' },
  { path: routes.adminCatalog, permission: 'catalog' },
  { path: routes.adminBlog, permission: 'blog' },
  { path: routes.adminReviews, permission: 'reviews' },
  { path: routes.adminSettings, permission: 'settings' },
  { path: routes.adminStaff, permission: 'super' },
]

export interface AdminAccess {
  isSuperAdmin: boolean
  permissions: AdminPermission[]
}

export function useAdminAccess() {
  const query = useQuery({
    queryKey: ['admin', 'me', 'access'],
    queryFn: () => api.get<AdminAccess>('/admin/admins/me/access'),
    staleTime: 5 * 60_000,
  })
  const access = query.data
  const can = (permission: AdminPermission | null | 'super') =>
    Boolean(
      access &&
        (permission === null ||
          access.isSuperAdmin ||
          (permission !== 'super' && access.permissions.includes(permission))),
    )
  return { ...query, access, can }
}
