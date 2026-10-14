import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ConsultStatus } from '@/api/account'
import { adminConsultApi, adminKeys, type ConsultRequest } from '@/api/admin'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { FilterTabs, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, inputClass } from '@/components/ui/button'
import { SelectField, TextAreaField } from '@/components/ui/fields'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { CONSULT_STATUS, PREFERRED_TIME, SESSION_TYPE } from '@/lib/consult-status'
import { formatDate, sinceLabel } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'

type Tab = 'all' | ConsultStatus

/** Admin labels: the client-facing ones are worded for the client. */
const ADMIN_STATUS: Record<ConsultStatus, string> = {
  NEW: 'جديد',
  CONTACTED: 'اتواصلنا',
  SCHEDULED: 'اتحدد ميعاد',
  COMPLETED: 'تمّت',
  CANCELLED: 'ملغي',
}

const digits = (p: string) => p.replace(/\D/g, '')

/** Local "YYYY-MM-DD" and "HH:MM" for date/time inputs. */
function splitLocal(iso: string | null) {
  if (!iso) return { date: '', time: '19:00' }
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export function AdminConsultRequestsPage() {
  usePageTitle('طلبات الاستشارة')
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const requests = useQuery({
    queryKey: [...adminKeys.consultations, 'list', search],
    queryFn: () => adminConsultApi.list({ limit: 100, search: search.trim() || undefined }),
  })
  const all = requests.data?.requests ?? []
  const count = (s: ConsultStatus) => all.filter((r) => r.status === s).length
  const list = all.filter((r) => tab === 'all' || r.status === tab)
  const current = list.find((r) => r.id === selected) ?? list[0]

  return (
    <>
      <AdminHeader
        title="طلبات الاستشارة"
        sub="الطلبات اللي جت من فورم الاستشارة. كلّم العميل وحدد معاه الميعاد من هنا."
      />
      <div className="mb-6 grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        {(
          [
            ['NEW', 'mail', 'bg-red-50 text-danger', 'طلبات جديدة'],
            ['CONTACTED', 'chat', 'bg-gold-soft text-gold-ink', 'اتواصلنا ومستنيين رد'],
            ['SCHEDULED', 'calendar', 'bg-[#E7F6EC] text-success', 'اتحدد ميعادها'],
            ['COMPLETED', 'check', 'bg-surface-blue text-blue-600', 'جلسات تمّت'],
          ] as const
        ).map(([s, icon, tint, label]) => (
          <AdminCard key={s} className="flex items-center gap-3.5 p-4">
            <span className={cn('flex size-11 items-center justify-center rounded-xl', tint)}>
              <Icon name={icon} size={18} />
            </span>
            <span className="flex flex-col">
              <b className="font-head text-2xl leading-none text-ink">{count(s)}</b>
              <span className="text-sm text-muted">{label}</span>
            </span>
          </AdminCard>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_400px] items-start gap-6 max-xl:grid-cols-1">
        <AdminCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider p-4">
            <FilterTabs
              value={tab}
              onChange={(t) => {
                setTab(t)
                setSelected(null)
              }}
              tabs={[
                { id: 'all', label: 'الكل', count: all.length },
                ...(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as ConsultStatus[]).map(
                  (s) => ({
                    id: s,
                    label: ADMIN_STATUS[s],
                    count: count(s),
                  }),
                ),
              ]}
            />
            <label className="relative w-56 max-sm:w-full">
              <span className="sr-only">بحث</span>
              <Icon
                name="search"
                size={15}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
              />
              <input
                className={cn(inputClass, 'h-10 pr-10 text-sm')}
                placeholder="اسم، موبايل أو إيميل…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {requests.isError ? (
            <ErrorState onRetry={() => requests.refetch()} />
          ) : requests.isLoading ? (
            <div className="flex justify-center py-16 text-blue-600">
              <Spinner />
            </div>
          ) : list.length === 0 ? (
            <EmptyState compact icon="mail" title="مفيش طلبات هنا" />
          ) : (
            <ul>
              {list.map((r) => {
                const on = r.id === current?.id
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r.id)}
                      aria-pressed={on}
                      className={cn(
                        'flex w-full items-start gap-3.5 border-0 border-t border-divider bg-transparent p-4 text-right first:border-t-0 hover:bg-hover',
                        on && 'bg-surface-blue shadow-[inset_-3px_0_0_var(--color-blue-400)]',
                      )}
                    >
                      <span className="flex size-11 flex-none bg-navy items-center justify-center rounded-full font-bold text-white">
                        {r.fullName.charAt(0)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <b className="text-ink">{r.fullName}</b>
                          <span className="rounded-full bg-surface-blue px-2 py-0.5 text-[11px] font-bold text-blue-600">
                            {r.category?.nameAr}
                          </span>
                          <StatusPill tone={CONSULT_STATUS[r.status].tone}>
                            {ADMIN_STATUS[r.status]}
                          </StatusPill>
                        </span>
                        <span className="line-clamp-1 text-sm text-text-2">{r.consultationTopic}</span>
                      </span>
                      <span className="flex-none text-xs text-muted">{sinceLabel(r.createdAt)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </AdminCard>

        {current && <RequestPanel key={current.id} r={current} />}
      </div>
    </>
  )
}

function RequestPanel({ r }: { r: ConsultRequest }) {
  const queryClient = useQueryClient()
  const initial = splitLocal(r.scheduledAt)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [notes, setNotes] = useState(r.adminNotes ?? '')
  const [status, setStatus] = useState<ConsultStatus>(r.status)

  const save = useMutation({
    mutationFn: (body: Parameters<typeof adminConsultApi.update>[1]) => adminConsultApi.update(r.id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.consultations }),
  })

  const info: [string, string | null | undefined][] = [
    ['الواتساب', r.whatsApp],
    ['البلد', r.country],
    ['النوع', r.category?.nameAr],
    ['سن الطفل', r.childAge ?? (r.age ? String(r.age) : null)],
    ['صلة القرابة', r.relation],
    ['الجلسة المفضلة', SESSION_TYPE[r.sessionType ?? ''] ?? r.sessionType],
    ['أنسب وقت', PREFERRED_TIME[r.preferredTime ?? ''] ?? r.preferredTime],
    ['الإيميل', r.email],
  ]

  return (
    <AdminCard className="sticky top-6 flex flex-col gap-4 p-5 max-xl:static">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl">{r.fullName}</h2>
          <p className="text-xs text-muted">
            {sinceLabel(r.createdAt)} · {formatDate(r.createdAt)}
          </p>
        </div>
        <StatusPill tone={CONSULT_STATUS[r.status].tone}>{ADMIN_STATUS[r.status]}</StatusPill>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={`https://wa.me/${digits(r.whatsApp)}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClass({ variant: 'whatsapp', size: 'sm' })}
        >
          <Icon name="whatsapp" size={15} /> واتساب
        </a>
        <a href={`tel:${r.phone}`} className={buttonClass({ variant: 'outline', size: 'sm' })}>
          <Icon name="phone" size={15} /> اتصال
        </a>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {info
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs text-muted">{k}</dt>
              <dd
                className="truncate font-bold text-ink"
                dir={k === 'الواتساب' || k === 'الإيميل' ? 'ltr' : undefined}
              >
                {v}
              </dd>
            </div>
          ))}
      </dl>
      <blockquote className="rounded-tile bg-surface p-4 text-sm leading-loose text-text-2">
        «{r.consultationTopic}»{r.notes && <span className="mt-2 block text-muted">{r.notes}</span>}
      </blockquote>

      <TextAreaField
        label="ملاحظات الفريق (مش بتظهر للعميل)"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <fieldset className="flex flex-col gap-3 rounded-tile border border-blue-300/50 bg-surface-blue/50 p-4">
        <legend className="flex items-center gap-2 px-1 font-bold text-ink">
          <Icon name="calendar" size={16} /> حدد الميعاد
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-bold text-ink">
            اليوم
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-ink">
            الساعة
            <input
              type="time"
              className={inputClass}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className={buttonClass({ variant: 'navy', block: true })}
          disabled={!date || save.isPending}
          onClick={() =>
            save.mutate({
              status: 'SCHEDULED',
              scheduledAt: new Date(`${date}T${time || '19:00'}`).toISOString(),
              adminNotes: notes.trim() || null,
            })
          }
        >
          <Icon name="check" size={16} /> {r.scheduledAt ? 'تحديث الميعاد' : 'تأكيد الميعاد'}
        </button>
        <p className="text-xs text-muted">
          الميعاد بيظهر للعميل في صفحة «استشاراتي». ابعتله اللينك على واتساب.
        </p>
      </fieldset>

      <div className="flex items-end gap-2.5">
        <div className="flex-1">
          <SelectField
            label="الحالة"
            value={status}
            onChange={(e) => setStatus(e.target.value as ConsultStatus)}
            options={(Object.keys(ADMIN_STATUS) as ConsultStatus[]).map((s) => ({
              value: s,
              label: ADMIN_STATUS[s],
            }))}
          />
        </div>
        <button
          type="button"
          className={buttonClass({ variant: 'gold' })}
          disabled={save.isPending || (status === r.status && notes === (r.adminNotes ?? ''))}
          onClick={() => save.mutate({ status, adminNotes: notes.trim() || null })}
        >
          حفظ
        </button>
      </div>
      {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
      {save.isSuccess && <Alert tone="success">اتحفظ.</Alert>}
    </AdminCard>
  )
}
