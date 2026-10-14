import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminCoursesApi, adminKeys, studentsApi, type NewStudent, type Student } from '@/api/admin'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { Avatar, FilterTabs, ProgressBar, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { Pager } from '@/components/ui/Pager'
import { buttonClass, inputClass } from '@/components/ui/button'
import { ChoiceChips, TextField } from '@/components/ui/fields'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { downloadCsv } from '@/lib/csv'
import { formatDate, formatEGP, sinceLabel } from '@/lib/format'
import { orderStatus } from '@/lib/order-status'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Gender } from '@/types/api'

type Tab = 'all' | 'active' | 'suspended'

const monthYear = new Intl.DateTimeFormat('ar-EG', {
  month: 'long',
  year: 'numeric',
  numberingSystem: 'latn',
})
const digits = (p: string) => p.replace(/\D/g, '')

function tempPassword() {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `Saleh-${n}`
}

function blankStudent() {
  return {
    fullName: '',
    phoneNumber: '+20',
    email: '',
    password: tempPassword(),
    gender: '' as Gender | '',
    courseIds: [] as string[],
  }
}

export function AdminUsersPage() {
  usePageTitle('المستخدمين')
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function exportCsv() {
    setExporting(true)
    try {
      const rows: Student[] = []
      for (let p = 1; p <= 50; p++) {
        const res = await studentsApi.list({
          page: p,
          limit: 100,
          search: search.trim() || undefined,
          isActive: tab === 'all' ? undefined : tab === 'active',
        })
        rows.push(...res.items)
        if (p >= res.pagination.totalPages) break
      }
      downloadCsv(
        `students-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'الاسم',
          'الإيميل',
          'الموبايل',
          'النوع',
          'الدورات',
          'الطلبات',
          'إجمالي المدفوع (ج.م)',
          'انضم',
          'آخر دخول',
          'الحالة',
        ],
        rows.map((s) => [
          s.fullName,
          s.email,
          s.phoneNumber,
          s.gender === 'Female' ? 'أنثى' : s.gender === 'Male' ? 'ذكر' : '',
          s.coursesCount,
          s.ordersCount,
          s.totalPaidEGP,
          s.createdAt.slice(0, 10),
          s.lastLoginAt?.slice(0, 10) ?? '',
          s.isActive ? 'نشط' : 'موقوف',
        ]),
      )
    } finally {
      setExporting(false)
    }
  }
  const students = useQuery({
    queryKey: [...adminKeys.students, tab, page, search],
    queryFn: () =>
      studentsApi.list({
        page,
        limit: 20,
        search: search.trim() || undefined,
        isActive: tab === 'all' ? undefined : tab === 'active',
      }),
  })
  const list = students.data?.items ?? []
  const currentId = selected ?? list[0]?.id

  return (
    <>
      <AdminHeader
        title="المستخدمين"
        sub={
          students.data
            ? `${students.data.pagination.total} طالب · ${students.data.newThisMonth} جديد الشهر ده`
            : undefined
        }
        actions={
          <>
            <button
              type="button"
              className={buttonClass({ variant: 'outline' })}
              disabled={exporting}
              onClick={exportCsv}
            >
              {exporting ? (
                <Spinner />
              ) : (
                <>
                  <Icon name="download" size={16} /> تصدير
                </>
              )}
            </button>
            <button
              type="button"
              className={buttonClass({ variant: 'navy' })}
              onClick={() => setAdding(true)}
            >
              <Icon name="plus" size={16} /> إضافة طالب
            </button>
          </>
        }
      />
      <div className="grid grid-cols-[1fr_340px] items-start gap-6 max-xl:grid-cols-1">
        <AdminCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider p-4">
            <FilterTabs
              value={tab}
              onChange={(t) => {
                setTab(t)
                setPage(1)
                setSelected(null)
              }}
              tabs={[
                { id: 'all', label: 'الكل' },
                { id: 'active', label: 'نشط' },
                { id: 'suspended', label: 'موقوف' },
              ]}
            />
            <label className="relative w-60 max-sm:w-full">
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
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </label>
          </div>
          {students.isError ? (
            <ErrorState onRetry={() => students.refetch()} />
          ) : students.isLoading ? (
            <div className="flex justify-center py-16 text-blue-600">
              <Spinner />
            </div>
          ) : list.length === 0 ? (
            <EmptyState compact icon="user" title="مفيش مستخدمين هنا" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-sm">
                <thead className="bg-surface text-right text-muted">
                  <tr>
                    <th className="px-5 py-3 font-bold">المستخدم</th>
                    <th className="px-3 py-3 font-bold">الدورات</th>
                    <th className="px-3 py-3 font-bold">إجمالي المدفوع</th>
                    <th className="px-3 py-3 font-bold">انضم</th>
                    <th className="px-5 py-3 font-bold">آخر دخول</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s.id)}
                      className={cn(
                        'cursor-pointer border-t border-divider hover:bg-hover',
                        s.id === currentId && 'bg-surface-blue',
                      )}
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={s.fullName} image={s.profileImage} size={38} />
                          <span className="flex min-w-0 flex-col">
                            <b className="flex items-center gap-2 text-ink">
                              {s.fullName}
                              {!s.isActive && <StatusPill tone="danger">موقوف</StatusPill>}
                            </b>
                            <span className="text-xs text-muted" dir="ltr">
                              {s.email}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold text-ink">{s.coursesCount}</td>
                      <td className="px-3 py-3 font-bold text-ink">{formatEGP(s.totalPaidEGP)}</td>
                      <td className="px-3 py-3 text-muted">{monthYear.format(new Date(s.createdAt))}</td>
                      <td className="px-5 py-3 text-muted">
                        {s.lastLoginAt ? sinceLabel(s.lastLoginAt) : 'لسه'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {students.data && students.data.pagination.totalPages > 1 && (
            <div className="border-t border-divider p-4">
              <Pager pagination={students.data.pagination} noun="طالب" onChange={setPage} />
            </div>
          )}
        </AdminCard>
        {currentId && <StudentPanel key={currentId} id={currentId} />}
      </div>
      {adding && <AddStudentModal onClose={() => setAdding(false)} />}
    </>
  )
}

function StudentPanel({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const [granting, setGranting] = useState(false)
  const details = useQuery({ queryKey: adminKeys.student(id), queryFn: () => studentsApi.get(id) })
  const toggle = useMutation({
    mutationFn: (isActive: boolean) => studentsApi.setActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.students }),
  })
  const s = details.data?.student

  if (details.isLoading || !s) {
    return (
      <AdminCard className="flex justify-center p-10 text-blue-600">
        <Spinner />
      </AdminCard>
    )
  }

  return (
    <AdminCard className="sticky top-6 overflow-hidden max-xl:static">
      <div className="relative flex bg-navy flex-col items-center gap-1 px-5 pt-6 pb-5 text-center">
        <div className="absolute inset-0 dots opacity-40" aria-hidden="true" />
        <span className="relative">
          <Avatar name={s.fullName} image={s.profileImage} size={72} />
        </span>
        <b className="relative mt-1 text-lg text-white">{s.fullName}</b>
        <span className="relative text-sm text-on-dark" dir="ltr">
          {s.email}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              [s.coursesCount, 'دورات'],
              [s.ordersCount, 'طلبات'],
              [formatEGP(s.totalPaidEGP), 'مدفوع'],
            ] as const
          ).map(([v, l]) => (
            <span key={l} className="rounded-tile bg-surface px-2 py-2.5">
              <b className="block text-ink">{v}</b>
              <span className="text-xs text-muted">{l}</span>
            </span>
          ))}
        </div>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">الموبايل</dt>
            <dd className="font-bold text-ink" dir="ltr">
              {s.phoneNumber}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">انضم</dt>
            <dd className="font-bold text-ink">{formatDate(s.createdAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">النوع</dt>
            <dd className="font-bold text-ink">
              {s.gender === 'Female' ? 'أنثى' : s.gender === 'Male' ? 'ذكر' : '—'}
            </dd>
          </div>
        </dl>
        {s.courses.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <b className="text-sm text-ink">الدورات</b>
            {s.courses.map((c) => (
              <div key={c.courseId} className="flex flex-col gap-1">
                <span className="truncate text-sm text-text-2">{c.titleAr}</span>
                <ProgressBar value={c.completionPercentage} />
              </div>
            ))}
          </div>
        )}
        {s.recentOrders.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <b className="text-sm text-ink">آخر الطلبات</b>
            {s.recentOrders.map((o) => {
              const st = orderStatus(o)
              return (
                <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <span dir="ltr" className="text-text-2">
                    #{o.orderNumber}
                  </span>
                  <StatusPill tone={st.tone}>{st.label}</StatusPill>
                </div>
              )
            })}
          </div>
        )}
        <div className="grid grid-cols-[1fr_auto] gap-2.5">
          <button
            type="button"
            className={buttonClass({ variant: 'navy' })}
            onClick={() => setGranting(true)}
          >
            <Icon name="plus" size={15} /> افتح دورة له
          </button>
          <a
            href={`https://wa.me/${digits(s.phoneNumber)}`}
            target="_blank"
            rel="noreferrer"
            className={buttonClass({ variant: 'outline' })}
            aria-label="رسالة واتساب"
          >
            <Icon name="whatsapp" size={16} />
          </a>
        </div>
        <button
          type="button"
          className={cn(
            'border-0 bg-transparent text-sm font-bold',
            s.isActive ? 'text-danger' : 'text-success',
          )}
          disabled={toggle.isPending}
          onClick={() => {
            if (!s.isActive || window.confirm(`إيقاف حساب ${s.fullName}؟ هيتسجّل خروجه من كل الأجهزة.`))
              toggle.mutate(!s.isActive)
          }}
        >
          {s.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب تاني'}
        </button>
        {toggle.isError && <Alert tone="error">{(toggle.error as Error).message}</Alert>}
      </div>
      {granting && (
        <GrantCoursesModal
          student={s}
          owned={s.courses.map((c) => c.courseId)}
          onClose={() => setGranting(false)}
        />
      )}
    </AdminCard>
  )
}

/** Course checkboxes shared by "add student" and "open a course". */
function CoursePicker({
  value,
  onChange,
  owned = [],
}: {
  value: string[]
  onChange: (ids: string[]) => void
  owned?: string[]
}) {
  const courses = useQuery({ queryKey: adminKeys.courses, queryFn: () => adminCoursesApi.list() })
  if (courses.isLoading) return <Spinner />
  return (
    <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
      {(courses.data?.courses ?? []).map((c) => {
        const has = owned.includes(c.id)
        const on = has || value.includes(c.id)
        return (
          <label
            key={c.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-sm font-semibold',
              on ? 'border-blue-400 bg-surface-blue text-ink' : 'border-line bg-white text-text-2',
              has && 'cursor-default opacity-60',
            )}
          >
            <input
              type="checkbox"
              className="size-4.5 accent-blue-600"
              checked={on}
              disabled={has}
              onChange={(e) =>
                onChange(e.target.checked ? [...value, c.id] : value.filter((x) => x !== c.id))
              }
            />
            <span className="flex-1">{c.titleAr}</span>
            {has && <span className="text-xs text-muted">عنده</span>}
          </label>
        )
      })}
    </div>
  )
}

function GrantCoursesModal({
  student,
  owned,
  onClose,
}: {
  student: Student
  owned: string[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [ids, setIds] = useState<string[]>([])
  const grant = useMutation({
    mutationFn: () => studentsApi.grantCourses(student.id, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.students })
      onClose()
    },
  })
  return (
    <Modal
      title={`افتح دورات لـ ${student.fullName}`}
      sub="الدورة بتتفتح على طول من غير طلب (منحة، هدية، أو دفع خارج المنصة)."
      icon="video"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonClass({ variant: 'outline' })} onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className={buttonClass({ variant: 'gold' })}
            disabled={!ids.length || grant.isPending}
            onClick={() => grant.mutate()}
          >
            {grant.isPending ? <Spinner /> : `افتح ${ids.length || ''} دورة`}
          </button>
        </>
      }
    >
      <CoursePicker value={ids} onChange={setIds} owned={owned} />
      {grant.isError && (
        <div className="mt-4">
          <Alert tone="error">{(grant.error as Error).message}</Alert>
        </div>
      )}
    </Modal>
  )
}

function AddStudentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [f, setF] = useState(blankStudent)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<{ student: Student; temporaryPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const create = useMutation({
    mutationFn: (body: NewStudent) => studentsApi.create(body),
    onSuccess: (res) => {
      setCreated(res)
      queryClient.invalidateQueries({ queryKey: adminKeys.students })
    },
  })

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (f.fullName.trim().split(/\s+/).length < 2) er.fullName = 'اكتب الاسم الأول واسم العيلة.'
    if (digits(f.phoneNumber).length < 10) er.phoneNumber = 'اكتب رقم موبايل صحيح.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = 'اكتب إيميل صحيح.'
    if (f.password.length < 8) er.password = 'كلمة السر 8 حروف على الأقل.'
    setErrors(er)
    if (Object.keys(er).length) return
    create.mutate({
      fullName: f.fullName.trim(),
      phoneNumber: f.phoneNumber.trim(),
      email: f.email.trim(),
      password: f.password,
      gender: f.gender || undefined,
      courseIds: f.courseIds.length ? f.courseIds : undefined,
    })
  }

  if (created) {
    const loginUrl = `${window.location.origin}/login`
    const message = `أهلًا ${created.student.fullName.split(' ')[0]}، اتعملك حساب على منصة د. صالح عبد الكريم.\nالدخول: ${loginUrl}\nالإيميل: ${created.student.email}\nكلمة السر المؤقتة: ${created.temporaryPassword}\nغيّرها من «الملف الشخصي» بعد أول دخول.`
    return (
      <Modal
        title="الحساب اتعمل"
        icon="check"
        onClose={onClose}
        width={520}
        footer={
          <>
            <button
              type="button"
              className={buttonClass({ variant: 'outline' })}
              onClick={() => {
                setCreated(null)
                setF(blankStudent())
              }}
            >
              إضافة طالب تاني
            </button>
            <button type="button" className={buttonClass({ variant: 'navy' })} onClick={onClose}>
              تم
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-text-2">
            حساب <b className="text-ink">{created.student.fullName}</b> جاهز
            {f.courseIds.length ? ` ومعاه ${f.courseIds.length} دورة` : ''}. ابعتله بيانات الدخول:
          </p>
          <pre className="rounded-tile bg-surface p-4 font-[inherit] text-sm leading-loose whitespace-pre-wrap text-ink">
            {message}
          </pre>
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`https://wa.me/${digits(created.student.phoneNumber)}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ variant: 'whatsapp' })}
            >
              <Icon name="whatsapp" size={16} /> ابعت على واتساب
            </a>
            <button
              type="button"
              className={buttonClass({ variant: 'outline' })}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message)
                  setCopied(true)
                } catch {
                  window.prompt('انسخ', message)
                }
              }}
            >
              <Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? 'اتنسخ' : 'نسخ'}
            </button>
          </div>
          <p className="text-xs text-muted">كلمة السر المؤقتة بتظهر مرة واحدة بس.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="إضافة طالب / متدرب"
      sub="الحساب بيتعمل متأكد، وتبعت للطالب بيانات الدخول بعدها"
      icon="user"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonClass({ variant: 'outline' })} onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className={buttonClass({ variant: 'gold' })}
            disabled={create.isPending}
            onClick={() => submit()}
          >
            {create.isPending ? (
              <Spinner />
            ) : (
              <>
                <Icon name="plus" size={16} /> اعمل الحساب
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <TextField
            label="الاسم بالكامل *"
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
            error={errors.fullName}
          />
          <TextField
            label="رقم الموبايل (واتساب) *"
            type="tel"
            ltr
            value={f.phoneNumber}
            onChange={(e) => setF({ ...f, phoneNumber: e.target.value })}
            error={errors.phoneNumber}
          />
          <TextField
            label="الإيميل *"
            type="email"
            ltr
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            error={errors.email}
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label="كلمة سر مؤقتة"
                ltr
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                error={errors.password}
              />
            </div>
            <button
              type="button"
              aria-label="كلمة سر جديدة"
              className={buttonClass({ variant: 'outline', className: 'mb-0.5 w-12 px-0' })}
              onClick={() => setF({ ...f, password: tempPassword() })}
            >
              <Icon name="refresh" size={16} />
            </button>
          </div>
        </div>
        <ChoiceChips<Gender>
          label="النوع"
          hint="المنصة والرسايل هتكلّمه بالصيغة دي"
          value={f.gender}
          onChange={(v) => setF({ ...f, gender: v })}
          options={[
            { value: 'Male', label: 'ذكر' },
            { value: 'Female', label: 'أنثى' },
          ]}
        />
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold text-ink">
            افتح له دورات{' '}
            <span className="text-sm font-normal text-muted">({f.courseIds.length} مختارة)</span>
          </span>
          <CoursePicker value={f.courseIds} onChange={(ids) => setF({ ...f, courseIds: ids })} />
        </div>
        {create.isError && <Alert tone="error">{(create.error as Error).message}</Alert>}
      </form>
    </Modal>
  )
}
