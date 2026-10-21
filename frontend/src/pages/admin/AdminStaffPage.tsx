import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { PhoneField } from '@/components/ui/PhoneField'
import { buttonClass } from '@/components/ui/button'
import { PasswordRules, TextField } from '@/components/ui/fields'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { confirmAction } from '@/lib/confirm'
import { formatDate } from '@/lib/format'
import { warnFormErrors } from '@/lib/formErrors'
import { isStrongPassword } from '@/lib/password'
import { isValidPhone } from '@/lib/phone'
import { toast } from '@/lib/toast'
import { usePageTitle } from '@/lib/usePageTitle'
import { ADMIN_PERMISSIONS, PERMISSION_INFO, type AdminPermission } from '@/lib/adminAccess'

interface StaffMember {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  isActive: boolean
  isSuperAdmin: boolean
  adminPermissions: AdminPermission[]
  lastLoginAt?: string | null
  createdAt: string
}

const KEY = ['admin', 'staff'] as const

const staffApi = {
  list: () => api.get<{ admins: StaffMember[] }>('/admin/admins', { params: { limit: 100 } }),
  create: (body: Record<string, unknown>) => api.post<{ admin: StaffMember }>('/admin/admins', body),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<{ admin: StaffMember }>(`/admin/admins/${id}`, body),
}

/** 16 characters with upper/lower case, digits and a symbol (the password policy). */
function strongPassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?-']
  const all = sets.join('')
  const pick = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length]
  const chars = [...sets.map(pick), ...Array.from({ length: 12 }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/** Super admins only: dashboard team accounts and what each one can open. */
export function AdminStaffPage() {
  usePageTitle('فريق العمل')
  const staff = useQuery({ queryKey: KEY, queryFn: staffApi.list })
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null)

  return (
    <>
      <AdminHeader
        title="فريق العمل"
        sub="حسابات لوحة التحكم، وكل حساب بيشوف الأقسام اللي تحددها له بس."
        actions={
          <button type="button" className={buttonClass({ variant: 'gold' })} onClick={() => setEditing('new')}>
            <Icon name="plus" size={16} /> عضو جديد
          </button>
        }
      />
      <AdminCard>
        {staff.isError ? (
          <ErrorState onRetry={() => staff.refetch()} />
        ) : staff.isLoading ? (
          <div className="flex justify-center py-16 text-blue-600">
            <Spinner />
          </div>
        ) : !staff.data?.admins.length ? (
          <EmptyState icon="user" title="مفيش حسابات" body="ضيف أول عضو في الفريق." />
        ) : (
          <ul>
            {staff.data.admins.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-4 border-t border-divider px-5 py-4 first:border-t-0"
              >
                <span className="flex size-11 flex-none items-center justify-center rounded-full bg-surface-blue font-head font-bold text-blue-600">
                  {m.fullName.charAt(0)}
                </span>
                <span className="flex min-w-48 flex-1 flex-col gap-1">
                  <b className="text-ink">{m.fullName}</b>
                  <span className="text-xs text-muted" dir="ltr">
                    {m.email}
                  </span>
                </span>
                <span className="flex flex-[2_1_260px] flex-wrap gap-1.5">
                  {m.isSuperAdmin ? (
                    <span className="bg-gold rounded-full px-2.5 py-1 text-xs font-bold text-navy">
                      صلاحيات كاملة
                    </span>
                  ) : m.adminPermissions.length ? (
                    m.adminPermissions.map((p) => (
                      <span key={p} className="rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-blue-600">
                        {PERMISSION_INFO[p]?.label ?? p}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted">نظرة عامة بس</span>
                  )}
                </span>
                {m.isActive ? (
                  <StatusPill tone="success">نشط</StatusPill>
                ) : (
                  <StatusPill tone="muted">موقوف</StatusPill>
                )}
                <button
                  type="button"
                  aria-label={`تعديل ${m.fullName}`}
                  className={buttonClass({ variant: 'ghost', size: 'sm' })}
                  onClick={() => setEditing(m)}
                >
                  <Icon name="pen" size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      {editing && (
        <StaffModal
          member={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function StaffModal({ member, onClose }: { member?: StaffMember; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [f, setF] = useState({
    fullName: member?.fullName ?? '',
    email: member?.email ?? '',
    phoneNumber: member?.phoneNumber ?? '+20',
    password: member ? '' : strongPassword(),
    isSuperAdmin: member?.isSuperAdmin ?? false,
    permissions: new Set<AdminPermission>(member?.adminPermissions ?? []),
    isActive: member?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shown, setShown] = useState(!member)

  const save = useMutation({
    mutationFn: () => {
      const body = {
        fullName: f.fullName.trim(),
        phoneNumber: f.phoneNumber,
        isSuperAdmin: f.isSuperAdmin,
        adminPermissions: f.isSuperAdmin ? [] : [...f.permissions],
        ...(member ? { isActive: f.isActive } : { email: f.email.trim() }),
        ...(f.password ? { password: f.password } : {}),
      }
      return member ? staffApi.update(member.id, body) : staffApi.create(body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['admin', 'me', 'access'] })
      toast.success(member ? 'اتحفظت التعديلات.' : 'الحساب اتعمل. ابعت له الإيميل وكلمة السر.')
      onClose()
    },
  })

  function toggle(p: AdminPermission) {
    setF((x) => {
      const next = new Set(x.permissions)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return { ...x, permissions: next }
    })
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (f.fullName.trim().length < 3) er.fullName = 'اكتب الاسم.'
    if (!member && !/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = 'اكتب إيميل صحيح.'
    if (!isValidPhone(f.phoneNumber)) er.phoneNumber = 'اكتب رقم موبايل صحيح.'
    if ((!member || f.password) && !isStrongPassword(f.password))
      er.password = 'كلمة السر لازم 12 حرف على الأقل، فيها حرف كبير ورقم ورمز.'
    if (!f.isSuperAdmin && f.permissions.size === 0) er.permissions = 'اختار قسم واحد على الأقل.'
    setErrors(er)
    warnFormErrors(er)
    if (Object.keys(er).length) return
    if (
      f.isSuperAdmin &&
      !member?.isSuperAdmin &&
      !(await confirmAction({
        title: 'تدّيه صلاحيات كاملة؟',
        body: 'هيقدر يفتح كل الأقسام ويضيف أو يوقف حسابات الفريق.',
        confirmLabel: 'أيوه، صلاحيات كاملة',
        tone: 'warning',
        icon: 'shield',
      }))
    )
      return
    save.mutate()
  }

  return (
    <Modal
      title={member ? 'تعديل عضو الفريق' : 'عضو جديد في الفريق'}
      sub={member?.email ?? 'هيدخل لوحة التحكم بالإيميل وكلمة السر دي.'}
      icon="user"
      onClose={onClose}
      width={760}
      footer={
        <>
          <span className="text-xs text-muted">
            {member?.lastLoginAt ? `آخر دخول: ${formatDate(member.lastLoginAt)}` : ''}
          </span>
          <span className="flex gap-2.5">
            <button type="button" className={buttonClass({ variant: 'outline' })} onClick={onClose}>
              إلغاء
            </button>
            <button
              type="button"
              className={buttonClass({ variant: 'gold' })}
              disabled={save.isPending}
              onClick={() => submit()}
            >
              {save.isPending ? <Spinner /> : member ? 'حفظ' : 'اعمل الحساب'}
            </button>
          </span>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <TextField
            label="الاسم بالكامل"
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
            error={errors.fullName}
          />
          <PhoneField
            label="رقم الموبايل"
            value={f.phoneNumber}
            onChange={(v) => setF({ ...f, phoneNumber: v })}
            error={errors.phoneNumber}
          />
          {!member && (
            <TextField
              label="الإيميل"
              type="email"
              ltr
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              error={errors.email}
            />
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  label={member ? 'كلمة سر جديدة (اختياري)' : 'كلمة السر'}
                  type={shown ? 'text' : 'password'}
                  ltr
                  autoComplete="new-password"
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                  error={errors.password}
                />
              </div>
              <button
                type="button"
                aria-label="اعمل كلمة سر قوية"
                title="اعمل كلمة سر قوية"
                className={buttonClass({ variant: 'outline', className: 'mb-0.5 w-12 px-0' })}
                onClick={() => {
                  setF({ ...f, password: strongPassword() })
                  setShown(true)
                }}
              >
                <Icon name="refresh" size={16} />
              </button>
              {f.password && (
                <button
                  type="button"
                  aria-label="انسخ كلمة السر"
                  title="انسخ كلمة السر"
                  className={buttonClass({ variant: 'outline', className: 'mb-0.5 w-12 px-0' })}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(f.password)
                      toast.success('اتنسخت كلمة السر.')
                    } catch {
                      setShown(true)
                    }
                  }}
                >
                  <Icon name="copy" size={16} />
                </button>
              )}
            </div>
            {f.password && <PasswordRules password={f.password} />}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-divider pt-5">
          <div>
            <h3 className="text-lg">الصلاحيات</h3>
            <p className="text-sm text-muted">«نظرة عامة» متاحة للكل. اختار الأقسام اللي يقدر يفتحها.</p>
          </div>
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-tile border-2 p-4 transition-colors',
              f.isSuperAdmin ? 'border-gold bg-gold-soft' : 'border-line hover:border-blue-300',
            )}
          >
            <input
              type="checkbox"
              className="mt-1 size-4.5 accent-navy"
              checked={f.isSuperAdmin}
              onChange={(e) => setF({ ...f, isSuperAdmin: e.target.checked })}
            />
            <span className="flex flex-col gap-0.5">
              <b className="text-ink">صلاحيات كاملة</b>
              <span className="text-sm text-text-2">كل الأقسام، وكمان إدارة حسابات الفريق.</span>
            </span>
          </label>
          {!f.isSuperAdmin && (
            <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1" role="group" aria-label="الأقسام">
              {ADMIN_PERMISSIONS.map((p) => {
                const on = f.permissions.has(p)
                return (
                  <label
                    key={p}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-tile border-[1.5px] p-3.5 transition-colors',
                      on ? 'border-blue-400 bg-surface-blue' : 'border-line hover:border-blue-300',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4.5 accent-navy"
                      checked={on}
                      onChange={() => toggle(p)}
                    />
                    <span className="flex flex-col gap-0.5">
                      <b className="text-sm text-ink">{PERMISSION_INFO[p].label}</b>
                      <span className="text-xs text-muted">{PERMISSION_INFO[p].note}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          )}
          {errors.permissions && <span className="text-sm text-danger">{errors.permissions}</span>}
        </div>

        {member && (
          <label className="flex items-center gap-3 text-[15px] font-semibold text-ink">
            <input
              type="checkbox"
              className="size-4.5 accent-navy"
              checked={f.isActive}
              onChange={(e) => setF({ ...f, isActive: e.target.checked })}
            />
            الحساب نشط
            <span className="text-sm font-normal text-muted">(لو اتشال، مش هيقدر يدخل)</span>
          </label>
        )}
        {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
      </form>
    </Modal>
  )
}
