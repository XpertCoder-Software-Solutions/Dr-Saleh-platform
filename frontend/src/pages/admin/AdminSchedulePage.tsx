import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminConsultApi, adminKeys } from '@/api/admin'
import { routes } from '@/app/routes'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { SESSION_TYPE, dateTile } from '@/lib/consult-status'
import { sinceLabel } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'

const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', numberingSystem: 'latn' })
const dayMonth = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', numberingSystem: 'latn' })

/** Saturday that starts the week containing `d` (the Egyptian work week). */
function weekStart(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 1) % 7))
  return x
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

export function AdminSchedulePage() {
  usePageTitle('مواعيد الاستشارات')
  const [offset, setOffset] = useState(0)
  const sessions = useQuery({
    queryKey: [...adminKeys.consultations, 'scheduled-all'],
    queryFn: () => adminConsultApi.list({ status: 'SCHEDULED', limit: 100 }),
  })
  const done = useQuery({
    queryKey: [...adminKeys.consultations, 'completed-all'],
    queryFn: () => adminConsultApi.list({ status: 'COMPLETED', limit: 100 }),
  })
  const pending = useQuery({
    queryKey: [...adminKeys.consultations, 'new'],
    queryFn: () => adminConsultApi.list({ status: 'NEW', limit: 20 }),
  })

  const start = weekStart(new Date())
  start.setDate(start.getDate() + offset * 7)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  const today = new Date()
  const all = [...(sessions.data?.requests ?? []), ...(done.data?.requests ?? [])].filter(
    (r) => r.scheduledAt,
  )
  const end = new Date(days[6])
  end.setDate(end.getDate() + 1)
  const thisWeek = all.filter((r) => {
    const t = new Date(r.scheduledAt!)
    return t >= days[0] && t < end
  })

  return (
    <>
      <AdminHeader
        title="مواعيد الاستشارات"
        sub={`${thisWeek.length} جلسة في الأسبوع ده · ${pending.data?.pagination.total ?? 0} طلب مستني ميعاد`}
        actions={
          <Link to={routes.adminConsultRequests} className={buttonClass({ variant: 'navy' })}>
            <Icon name="calendar" size={16} /> حدد ميعاد لطلب
          </Link>
        }
      />
      <div className="grid grid-cols-[1fr_320px] items-start gap-6 max-xl:grid-cols-1">
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-divider p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="الأسبوع اللي فات"
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'w-10 px-0' })}
                onClick={() => setOffset((o) => o - 1)}
              >
                <Icon name="chevRight" size={16} />
              </button>
              <b className="text-ink">
                {dayMonth.format(days[0])} – {dayMonth.format(days[6])}
              </b>
              <button
                type="button"
                aria-label="الأسبوع الجاي"
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'w-10 px-0' })}
                onClick={() => setOffset((o) => o + 1)}
              >
                <Icon name="chevLeft" size={16} />
              </button>
            </div>
            {offset !== 0 && (
              <button
                type="button"
                className={buttonClass({ variant: 'ghost', size: 'sm' })}
                onClick={() => setOffset(0)}
              >
                الأسبوع ده
              </button>
            )}
          </div>
          {sessions.isLoading ? (
            <div className="flex justify-center py-16 text-blue-600">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-7 max-lg:grid-cols-1">
              {days.map((d) => {
                const items = thisWeek
                  .filter((r) => sameDay(new Date(r.scheduledAt!), d))
                  .sort((a, b) => +new Date(a.scheduledAt!) - +new Date(b.scheduledAt!))
                const isToday = sameDay(d, today)
                return (
                  <div
                    key={d.toISOString()}
                    className="min-h-60 border-l border-divider last:border-l-0 max-lg:min-h-0 max-lg:border-b max-lg:border-l-0"
                  >
                    <div
                      className={cn(
                        'px-2 py-2.5 text-center text-sm',
                        isToday ? 'bg-navy text-white' : 'bg-surface text-muted',
                      )}
                    >
                      <b>{dayName.format(d)}</b> {d.getDate()}
                    </div>
                    <ul className="flex flex-col gap-2 p-2">
                      {items.map((r) => (
                        <li
                          key={r.id}
                          className={cn(
                            'rounded-xl border-r-[3px] p-2 text-xs',
                            r.status === 'COMPLETED'
                              ? 'border-success bg-[#E7F6EC]'
                              : 'border-blue-600 bg-surface-blue',
                          )}
                        >
                          <b className="block text-ink">{dateTile(r.scheduledAt!).time}</b>
                          <span className="block truncate font-bold text-ink">{r.fullName}</span>
                          <span className="block truncate text-muted">
                            {r.category?.nameAr} · {SESSION_TYPE[r.sessionType ?? ''] ?? 'مكالمة'}
                          </span>
                        </li>
                      ))}
                      {items.length === 0 && (
                        <li className="py-2 text-center text-xs text-muted-2 max-lg:hidden">—</li>
                      )}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </AdminCard>

        <AdminCard className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">طلبات مستنية ميعاد</h2>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-danger">
              {pending.data?.pagination.total ?? 0}
            </span>
          </div>
          {(pending.data?.requests ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">مفيش طلبات جديدة.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pending.data!.requests.slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-col gap-2 rounded-tile border border-line p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 bg-gold items-center justify-center rounded-full font-bold text-navy">
                      {r.fullName.charAt(0)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <b className="truncate text-sm text-ink">{r.fullName}</b>
                      <span className="text-xs text-muted">
                        {r.category?.nameAr} · {sinceLabel(r.createdAt)}
                      </span>
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-text-2">«{r.consultationTopic}»</p>
                </li>
              ))}
            </ul>
          )}
          <Link to={routes.adminConsultRequests} className={buttonClass({ variant: 'outline', size: 'sm' })}>
            كل الطلبات
          </Link>
        </AdminCard>
      </div>
    </>
  )
}
