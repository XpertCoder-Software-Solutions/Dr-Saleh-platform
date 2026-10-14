import { Link } from 'react-router-dom'
import { useMyConsultations, type MyConsultation } from '@/api/account'
import { routes } from '@/app/routes'
import { useCopy, useGender } from '@/auth/hooks'
import { AccountShell, Panel, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { CONTACT } from '@/content/contact'
import { CONSULT_STATUS, PREFERRED_TIME, SESSION_TYPE, dateTile, nextSession } from '@/lib/consult-status'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'

/** Google Calendar "add event" link for a scheduled session (45 minutes). */
function calendarLink(c: MyConsultation) {
  const start = new Date(c.scheduledAt!)
  const end = new Date(start.getTime() + 45 * 60_000)
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `استشارة ${c.category?.nameAr ?? ''} مع د. صالح عبد الكريم`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: c.consultationTopic,
  })
  return `https://calendar.google.com/calendar/render?${q}`
}

export function MyConsultationsPage() {
  const g = useGender()
  const t = useCopy()
  const consults = useMyConsultations()
  const list = consults.data?.items ?? []
  const next = nextSession(list)

  return (
    <AccountShell
      active="consults"
      pageTitle="استشاراتي"
      title={<span className="text-sheen">استشاراتي</span>}
      body="مواعيد استشاراتك مع الدكتور صالح وحالة كل طلب."
    >
      {next?.scheduledAt && <NextCard c={next} />}

      <Panel className="flex flex-col gap-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">كل استشاراتي</h2>
          <Link to={routes.consultRequest} className="flex items-center gap-1 text-sm font-bold">
            {g('اطلب استشارة جديدة', 'اطلبي استشارة جديدة', 'طلب استشارة جديدة')}{' '}
            <Icon name="arrowLeft" size={14} />
          </Link>
        </div>
        {consults.isError ? (
          <ErrorState onRetry={() => consults.refetch()} />
        ) : consults.isLoading ? (
          <div className="flex justify-center py-12 text-blue-600">
            <Spinner />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon="chat"
            title="لسه مفيش استشارات"
            body="اكتب الموقف اللي محتاج فيه رأي متخصص، وهنكلمك على واتساب نحدد ميعاد."
            action={
              <Link to={routes.consultRequest} className={buttonClass({ variant: 'gold' })}>
                {t('cta.book')}
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col">
            {list.map((c) => {
              const st = CONSULT_STATUS[c.status]
              const when =
                c.scheduledAt && c.status !== 'NEW'
                  ? `${dateTile(c.scheduledAt).weekday} ${formatDate(c.scheduledAt)} · ${dateTile(c.scheduledAt).time}`
                  : `طلب جديد · ${formatDate(c.createdAt)}`
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-4 border-t border-divider py-4 first:border-t-0 max-sm:flex-wrap"
                >
                  <span
                    className={cn(
                      'flex size-11 flex-none items-center justify-center rounded-xl',
                      c.status === 'COMPLETED'
                        ? 'bg-[#E7F6EC] text-success'
                        : c.status === 'NEW'
                          ? 'bg-gold-soft text-gold-ink'
                          : 'bg-surface-blue text-blue-600',
                    )}
                  >
                    <Icon name="chat" size={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="text-ink">استشارة {c.category?.nameAr}</b>
                    <span className="text-sm text-muted">{when}</span>
                    <span className="truncate text-sm text-text-2">الموضوع: {c.consultationTopic}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1.5 max-sm:w-full max-sm:flex-row max-sm:justify-between">
                    <StatusPill tone={st.tone}>{st.label}</StatusPill>
                    {c.status === 'NEW' && <span className="text-xs text-muted">هنكلمك على واتساب</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </AccountShell>
  )
}

function NextCard({ c }: { c: MyConsultation }) {
  const g = useGender()
  const d = dateTile(c.scheduledAt!)
  const type = SESSION_TYPE[c.sessionType ?? ''] ?? 'أونلاين'
  return (
    <div className="relative flex bg-navy flex-wrap items-center gap-5 overflow-hidden rounded-card p-6 text-white max-sm:p-5">
      <div className="absolute inset-0 dots opacity-40" aria-hidden="true" />
      <span className="relative flex w-20 flex-none flex-col items-center rounded-2xl bg-white py-2.5 text-ink">
        <span className="text-xs text-muted">{d.month}</span>
        <b className="font-head text-3xl leading-tight">{d.day}</b>
        <span className="text-xs text-muted">{d.weekday}</span>
      </span>
      <span className="relative flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-bold text-gold">استشارتك القادمة</span>
        <b className="text-xl">استشارة {c.category?.nameAr} مع د. صالح</b>
        <span className="flex flex-wrap items-center gap-x-3 text-sm text-on-dark">
          <span className="flex items-center gap-1">
            <Icon name="clock" size={14} /> {d.time}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="video" size={14} /> {type}، اللينك هيوصلك على واتساب
          </span>
        </span>
        {c.preferredTime && PREFERRED_TIME[c.preferredTime] && (
          <span className="text-xs text-on-dark-muted">الوقت المفضّل: {PREFERRED_TIME[c.preferredTime]}</span>
        )}
      </span>
      <span className="relative flex flex-wrap gap-2.5">
        <a
          href={calendarLink(c)}
          target="_blank"
          rel="noreferrer"
          className={buttonClass({ variant: 'gold', size: 'sm' })}
        >
          <Icon name="calendar" size={15} /> {g('ضيفها للتقويم', 'ضيفيها للتقويم', 'إضافة للتقويم')}
        </a>
        <a
          href={CONTACT.whatsapp.href}
          target="_blank"
          rel="noreferrer"
          className={buttonClass({ variant: 'glass', size: 'sm' })}
        >
          <Icon name="whatsapp" size={15} /> تعديل الميعاد
        </a>
      </span>
    </div>
  )
}
