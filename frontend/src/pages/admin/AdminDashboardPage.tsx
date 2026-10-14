import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminConsultApi, adminKeys, dashboardApi, type RevenuePeriod } from '@/api/admin'
import { routes } from '@/app/routes'
import { useAuth } from '@/auth/hooks'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { StatusPill } from '@/components/account/AccountShell'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { dateTile, upcomingSessions } from '@/lib/consult-status'
import { formatEGP, sinceLabel } from '@/lib/format'
import { orderStatus } from '@/lib/order-status'
import { usePageTitle } from '@/lib/usePageTitle'

const PERIODS: { id: RevenuePeriod; label: string; buckets: number }[] = [
  { id: 'daily', label: 'يوم', buckets: 14 },
  { id: 'monthly', label: 'شهر', buckets: 12 },
  { id: 'yearly', label: 'سنة', buckets: 5 },
]

const monthShort = new Intl.DateTimeFormat('ar-EG', { month: 'short', numberingSystem: 'latn' })
const dayShort = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', numberingSystem: 'latn' })

/** Fills gaps so the chart always shows the last N days/months/years, oldest first. */
function buckets(period: RevenuePeriod, n: number, items: { date: string; revenue: number }[]) {
  const byKey = new Map(
    items.map((i) => [i.date.slice(0, period === 'yearly' ? 4 : period === 'monthly' ? 7 : 10), i.revenue]),
  )
  const out: { label: string; value: number }[] = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d)
    if (period === 'daily') x.setDate(d.getDate() - i)
    if (period === 'monthly') x.setMonth(d.getMonth() - i, 1)
    if (period === 'yearly') x.setFullYear(d.getFullYear() - i, 0, 1)
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
    const key = iso.slice(0, period === 'yearly' ? 4 : period === 'monthly' ? 7 : 10)
    out.push({
      label:
        period === 'daily'
          ? dayShort.format(x)
          : period === 'monthly'
            ? monthShort.format(x)
            : String(x.getFullYear()),
      value: byKey.get(key) ?? 0,
    })
  }
  return out
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'صباح الخير' : 'مساء الخير'
}

export function AdminDashboardPage() {
  usePageTitle('لوحة الإدارة')
  const { user } = useAuth()
  const [period, setPeriod] = useState<RevenuePeriod>('monthly')
  const overview = useQuery({ queryKey: adminKeys.overview, queryFn: dashboardApi.overview })
  const users = useQuery({ queryKey: adminKeys.dashUsers, queryFn: dashboardApi.users })
  const orders = useQuery({ queryKey: adminKeys.dashOrders, queryFn: dashboardApi.orders })
  const revenue = useQuery({
    queryKey: adminKeys.revenue(period),
    queryFn: () => dashboardApi.revenue(period),
  })
  const sessions = useQuery({
    queryKey: [...adminKeys.consultations, 'scheduled'],
    queryFn: () => adminConsultApi.list({ status: 'SCHEDULED', limit: 50 }),
  })

  const o = overview.data?.overview
  const p = PERIODS.find((x) => x.id === period)!
  const bars = buckets(period, p.buckets, revenue.data?.revenue.items ?? [])
  const max = Math.max(1, ...bars.map((b) => b.value))
  const upcoming = upcomingSessions(sessions.data?.requests ?? [])

  const stats: { icon: IconName; value: string | number; label: string; tint: string; to: string }[] = [
    {
      icon: 'wallet',
      value: formatEGP(o?.totalRevenueEGP ?? 0),
      label: 'إجمالي الإيرادات',
      tint: 'bg-surface-blue text-blue-600',
      to: routes.adminOrders,
    },
    {
      icon: 'bag',
      value: o?.totalOrders ?? 0,
      label: `طلب · ${o?.pendingOrders ?? 0} مستني الدفع`,
      tint: 'bg-[#E7F6EC] text-success',
      to: routes.adminOrders,
    },
    {
      icon: 'user',
      value: users.data?.users.newUsersThisMonth ?? 0,
      label: `مستخدم جديد الشهر ده · ${o?.totalUsers ?? 0} إجمالي`,
      tint: 'bg-[#EEEBFB] text-[#5B47C9]',
      to: routes.adminUsers,
    },
    {
      icon: 'chat',
      value: o?.consultationRequestsCount ?? 0,
      label: 'طلب استشارة',
      tint: 'bg-gold-soft text-gold-ink',
      to: routes.adminConsultRequests,
    },
  ]

  return (
    <>
      <AdminHeader
        title={`${greeting()} يا ${user?.firstName ?? ''} 👋`}
        sub="ده ملخص المنصة النهارده."
        actions={
          <Link to={routes.adminUsers} className={buttonClass({ variant: 'navy' })}>
            <Icon name="plus" size={16} /> إضافة طالب
          </Link>
        }
      />

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="lift rounded-card border border-line bg-white p-5 text-inherit shadow-card"
          >
            <span className={cn('flex size-11 items-center justify-center rounded-xl', s.tint)}>
              <Icon name={s.icon} size={19} />
            </span>
            <b className="mt-4 block font-head text-[28px] leading-none text-ink">
              {overview.isLoading ? '…' : s.value}
            </b>
            <span className="mt-1.5 block text-sm text-muted">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[1.6fr_1fr] gap-6 max-xl:grid-cols-1">
        <AdminCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl">الإيرادات</h2>
              <p className="text-sm text-muted">المدفوع بالجنيه</p>
            </div>
            <div role="tablist" className="flex gap-1 rounded-xl bg-surface p-1">
              {PERIODS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={x.id === period}
                  onClick={() => setPeriod(x.id)}
                  className={cn(
                    'rounded-lg border-0 px-3.5 py-1.5 text-sm font-bold',
                    x.id === period ? 'bg-white text-ink shadow-sm' : 'bg-transparent text-muted',
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex h-56 items-end gap-2 max-sm:gap-1" aria-label="رسم الإيرادات">
            {bars.map((b, i) => (
              <div
                key={i}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[11px] font-bold whitespace-nowrap text-ink opacity-0 transition-opacity group-hover:opacity-100 max-sm:hidden">
                  {formatEGP(b.value)}
                </span>
                <span
                  className={cn(
                    'w-full max-w-10 rounded-t-lg',
                    i === bars.length - 1 ? 'bg-gold' : 'bg-linear-to-t from-blue-600 to-blue-300',
                    b.value === 0 && 'opacity-25',
                  )}
                  style={{ height: `${Math.max(3, (b.value / max) * 100)}%` }}
                  title={`${b.label}: ${formatEGP(b.value)}`}
                />
                <span
                  className={cn(
                    'text-[11px] whitespace-nowrap text-muted',
                    // On phones only every other label fits.
                    (bars.length - 1 - i) % 2 === 1 && 'max-sm:invisible',
                  )}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="flex flex-col gap-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">الاستشارات الجاية</h2>
            <Link to={routes.adminSchedule} className="text-sm font-bold">
              المواعيد
            </Link>
          </div>
          {sessions.isLoading ? (
            <Spinner />
          ) : upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">مفيش جلسات متحددة.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {upcoming.map((r) => {
                const d = dateTile(r.scheduledAt!)
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-tile bg-surface p-3">
                    <span className="w-16 flex-none text-center text-sm font-bold text-blue-600">
                      {d.time}
                      <span className="block text-[11px] font-normal text-muted">
                        {d.day} {d.month}
                      </span>
                    </span>
                    <span className="flex size-9 flex-none bg-gold items-center justify-center rounded-full font-bold text-navy">
                      {r.fullName.charAt(0)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <b className="truncate text-sm text-ink">{r.fullName}</b>
                      <span className="text-xs text-muted">{r.category?.nameAr}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-3">
          <h2 className="text-xl">آخر الطلبات</h2>
          <Link to={routes.adminOrders} className="text-sm font-bold">
            كل الطلبات
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-sm">
            <thead className="bg-surface text-right text-muted">
              <tr>
                <th className="px-6 py-3 font-bold">الطلب</th>
                <th className="px-3 py-3 font-bold">العميل</th>
                <th className="px-3 py-3 font-bold">المبلغ</th>
                <th className="px-3 py-3 font-bold">الحالة</th>
                <th className="px-6 py-3 font-bold">الوقت</th>
              </tr>
            </thead>
            <tbody>
              {(orders.data?.orders.recentOrders ?? []).map((r) => {
                const st = orderStatus(r)
                return (
                  <tr key={r.id} className="border-t border-divider">
                    <td className="px-6 py-3 font-bold text-ink" dir="ltr">
                      #{r.orderNumber}
                    </td>
                    <td className="px-3 py-3">{r.customerName}</td>
                    <td className="px-3 py-3 font-bold text-ink">{formatEGP(r.totalAmount)}</td>
                    <td className="px-3 py-3">
                      <StatusPill tone={st.tone}>{st.label}</StatusPill>
                    </td>
                    <td className="px-6 py-3 text-muted">{sinceLabel(r.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  )
}
