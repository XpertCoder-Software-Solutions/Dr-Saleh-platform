import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminConsultApi, adminKeys, adminOrdersApi } from '@/api/admin'
import { routes } from '@/app/routes'
import { useAuth } from '@/auth/hooks'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { confirmAction } from '@/lib/confirm'
import { PAGE_PERMISSION, useAdminAccess } from '@/lib/adminAccess'

const NAV: {
  to: string
  label: string
  icon: IconName
  end?: boolean
  badge?: 'orders' | 'requests' | 'schedule'
}[] = [
  { to: routes.admin, label: 'نظرة عامة', icon: 'grid', end: true },
  { to: routes.adminCourses, label: 'الدورات', icon: 'video' },
  { to: routes.adminOrders, label: 'الطلبات', icon: 'bag', badge: 'orders' },
  { to: routes.adminConsultRequests, label: 'طلبات الاستشارة', icon: 'mail', badge: 'requests' },
  { to: routes.adminSchedule, label: 'مواعيد الاستشارات', icon: 'calendar', badge: 'schedule' },
  { to: routes.adminUsers, label: 'المستخدمين', icon: 'user' },
  { to: routes.adminCatalog, label: 'الكتب والمنتجات', icon: 'book' },
  { to: routes.adminBlog, label: 'المقالات', icon: 'pen' },
  { to: routes.adminReviews, label: 'التقييمات', icon: 'star' },
  { to: routes.adminSettings, label: 'الإعدادات', icon: 'sliders' },
  { to: routes.adminStaff, label: 'فريق العمل', icon: 'shield' },
]

/** Permission a dashboard path needs (the overview needs none). */
function permissionFor(path: string) {
  return PAGE_PERMISSION.find((p) => path === p.path || path.startsWith(`${p.path}/`))?.permission ?? null
}

const today = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  numberingSystem: 'latn',
})

/** Counts shown next to sidebar items: pending orders, new requests, upcoming sessions. */
function useBadges() {
  const { can } = useAdminAccess()
  const pending = useQuery({
    enabled: can('orders'),
    queryKey: [...adminKeys.orders, 'badge'],
    queryFn: () => adminOrdersApi.list({ status: 'PENDING', paymentStatus: 'PENDING', limit: 1 }),
    staleTime: 60_000,
  })
  const fresh = useQuery({
    enabled: can('consultations'),
    queryKey: [...adminKeys.consultations, 'badge-new'],
    queryFn: () => adminConsultApi.list({ status: 'NEW', limit: 1 }),
    staleTime: 60_000,
  })
  const scheduled = useQuery({
    enabled: can('consultations'),
    queryKey: [...adminKeys.consultations, 'badge-scheduled'],
    queryFn: () => adminConsultApi.list({ status: 'SCHEDULED', limit: 1 }),
    staleTime: 60_000,
  })
  return {
    orders: pending.data?.pagination.total,
    requests: fresh.data?.pagination.total,
    schedule: scheduled.data?.pagination.total,
  }
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const badges = useBadges()
  const { can, access } = useAdminAccess()
  return (
    <>
      <Link
        to={routes.admin}
        onClick={onNavigate}
        className="flex flex-col items-center gap-1 px-4 pt-6 pb-5"
      >
        <img src="/assets/brand/logo-white.webp" alt="منصة د. صالح عبد الكريم" className="h-16 w-auto" />
        <span className="bg-gold rounded-full px-2.5 py-0.5 text-[11px] font-bold text-navy">
          لوحة الإدارة
        </span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="قائمة الإدارة">
        {NAV.filter((n) => can(permissionFor(n.to))).map((n) => {
          const count = n.badge ? badges[n.badge] : undefined
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 items-center gap-3 rounded-[14px] px-4 text-[15px] transition-colors',
                  isActive ? 'bg-white font-bold text-ink' : 'text-on-dark hover:bg-white/8 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={n.icon} size={19} />
                  <span className="flex-1">{n.label}</span>
                  {!!count && (
                    <span
                      className={cn(
                        'flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                        isActive ? 'bg-gold text-navy' : 'bg-white/15 text-white',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
      <div className="flex flex-col gap-3 p-3">
        <Link
          to={routes.home}
          className="flex items-center gap-3 px-4 py-2 text-sm text-on-dark hover:text-white"
        >
          <Icon name="link" size={16} /> عرض الموقع
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 p-3">
          <span className="flex size-10 flex-none bg-gold items-center justify-center rounded-full font-head font-bold text-navy">
            {user?.fullName.charAt(0)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <b className="truncate text-sm text-white">{user?.fullName}</b>
            <span className="text-xs text-on-dark-muted">
              {access && !access.isSuperAdmin ? 'فريق العمل' : 'مدير'}
            </span>
          </span>
          <button
            type="button"
            aria-label="تسجيل الخروج"
            className="flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-on-dark hover:bg-white/10 hover:text-white"
            onClick={async () => {
              if (
                !(await confirmAction({
                  title: 'تسجّل خروج؟',
                  body: 'هتحتاج تدخل بالإيميل وكلمة السر تاني.',
                  confirmLabel: 'تسجيل الخروج',
                  cancelLabel: 'خليني',
                  tone: 'warning',
                  icon: 'logout',
                }))
              )
                return
              await logout()
              navigate(routes.home)
            }}
          >
            <Icon name="logout" size={17} />
          </button>
        </div>
      </div>
    </>
  )
}

/** Shows the page only when the signed-in admin may open it. */
function Guarded() {
  const { pathname } = useLocation()
  const { can, isLoading, isError, refetch } = useAdminAccess()
  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-blue-600">
        <span className="size-8 animate-spin rounded-full border-3 border-current border-t-transparent" />
      </div>
    )
  }
  if (isError) {
    return (
      <AdminCard className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <b className="text-lg text-ink">مقدرناش نتأكد من صلاحياتك.</b>
        <button type="button" className="font-bold text-blue-600" onClick={() => refetch()}>
          حاول تاني
        </button>
      </AdminCard>
    )
  }
  if (!can(permissionFor(pathname))) {
    return (
      <AdminCard className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex size-15 items-center justify-center rounded-full bg-amber-50 text-warning">
          <Icon name="lock" size={26} />
        </span>
        <b className="text-xl text-ink">القسم ده مش ضمن صلاحياتك</b>
        <p className="max-w-110 text-text-2">لو محتاج تفتحه، اطلب من المدير يضيفه لحسابك.</p>
        <Link to={routes.admin} className="font-bold">
          ارجع للنظرة العامة
        </Link>
      </AdminCard>
    )
  }
  return <Outlet />
}

/** Admin shell: dark sidebar on the right, slim top bar, page content. */
export function AdminLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="sticky top-0 flex h-dvh w-70 flex-none flex-col overflow-y-auto bg-navy-deep max-lg:hidden">
        <SidebarContent />
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="قائمة الإدارة"
        >
          <aside className="flex h-full w-72 flex-col overflow-y-auto bg-navy-deep">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
          <button
            type="button"
            aria-label="إغلاق"
            className="flex-1 border-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-7 py-3.5 max-sm:px-4">
          <button
            type="button"
            aria-label="القائمة"
            className="flex size-10 items-center justify-center rounded-xl border border-line bg-white lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" size={18} />
          </button>
          <span className="text-sm text-muted max-sm:hidden">{today.format(new Date())}</span>
          <Link to={routes.home} className="text-sm font-bold lg:hidden">
            الموقع
          </Link>
        </header>
        <main className="flex-1 px-7 py-7 max-sm:px-4">
          <Guarded />
        </main>
      </div>
    </div>
  )
}

/** Page title row with optional actions on the left. */
export function AdminHeader({
  title,
  sub,
  actions,
}: {
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  )
}

/** White card used across admin pages. */
export function AdminCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-card border border-line bg-white shadow-card', className)}>{children}</div>
  )
}
