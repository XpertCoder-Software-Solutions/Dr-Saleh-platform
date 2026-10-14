import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountKeys, profileApi } from '@/api/account'
import type { Profile } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { useAuth, useCopy, useGender } from '@/auth/hooks'
import { AccountShell, Avatar, Panel } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { ChoiceChips, PasswordField, TextField } from '@/components/ui/fields'
import { Alert, ErrorState, Spinner } from '@/components/ui/States'
import type { Gender } from '@/types/api'

const MAX_IMAGE_MB = 5

export function ProfilePage() {
  const g = useGender()
  const profile = useQuery({ queryKey: accountKeys.profile, queryFn: profileApi.get })

  return (
    <AccountShell
      active="profile"
      pageTitle="الملف الشخصي"
      title={
        <>
          الملف <span className="text-sheen">الشخصي</span>
        </>
      }
      body={g('عدّل بياناتك وكلمة المرور.', 'عدّلي بياناتك وكلمة المرور.', 'البيانات الشخصية وكلمة المرور.')}
    >
      {profile.isError ? (
        <ErrorState onRetry={() => profile.refetch()} />
      ) : profile.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : (
        <>
          <PhotoCard profile={profile.data!} />
          <DetailsForm profile={profile.data!} />
          <PasswordForm />
          <Panel className="flex flex-wrap items-center gap-4 border-red-100">
            <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-red-50 text-danger">
              <Icon name="trash" size={18} />
            </span>
            <span className="flex flex-1 flex-col">
              <b className="text-ink">حذف الحساب</b>
              <span className="text-sm text-muted">
                {g(
                  'هيتمسح كل محتواك وشهاداتك ومش هتقدر ترجعها. كلّمنا ونساعدك.',
                  'هيتمسح كل محتواكي وشهاداتك ومش هتقدري ترجعيها. كلّمينا ونساعدك.',
                  'الحذف بيمسح كل المحتوى والشهادات نهائيًا. كلّمونا ونساعدكم.',
                )}
              </span>
            </span>
            <Link
              to={routes.contact}
              className={buttonClass({ variant: 'outline', size: 'sm', className: 'text-danger' })}
            >
              طلب حذف الحساب
            </Link>
          </Panel>
        </>
      )}
    </AccountShell>
  )
}

function PhotoCard({ profile }: { profile: Profile }) {
  const { refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')

  const done = async () => {
    await queryClient.invalidateQueries({ queryKey: accountKeys.profile })
    await refreshProfile()
  }
  const upload = useMutation({ mutationFn: profileApi.uploadImage, onSuccess: done })
  const remove = useMutation({ mutationFn: profileApi.removeImage, onSuccess: done })

  return (
    <Panel className="flex flex-wrap items-center gap-5">
      <div className="relative">
        <Avatar name={name} image={profile.profileImage} size={84} />
        <button
          type="button"
          aria-label="غيّر الصورة"
          onClick={() => input.current?.click()}
          className="absolute -bottom-1 -left-1 flex size-9 bg-navy items-center justify-center rounded-full border-[3px] border-white text-white"
        >
          {upload.isPending ? <Spinner /> : <Icon name="pen" size={14} />}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
              setError(`الصورة لازم تكون أقل من ${MAX_IMAGE_MB} ميجا.`)
              return
            }
            setError(null)
            upload.mutate(file)
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <b className="text-xl text-ink">{name}</b>
        <span dir="ltr" className="self-start text-sm text-muted">
          {profile.email}
        </span>
        {profile.emailVerifiedAt && (
          <span className="flex items-center gap-1 text-sm font-bold text-success">
            <Icon name="shield" size={14} /> الإيميل متأكد
          </span>
        )}
      </div>
      {profile.profileImage && (
        <button
          type="button"
          className={buttonClass({ variant: 'ghost', size: 'sm' })}
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          شيل الصورة
        </button>
      )}
      {(error || upload.isError || remove.isError) && (
        <div className="w-full">
          <Alert tone="error">{error ?? ((upload.error ?? remove.error) as Error).message}</Alert>
        </div>
      )}
    </Panel>
  )
}

function DetailsForm({ profile }: { profile: Profile }) {
  const { refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const initial = {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phone: profile.phone ?? '',
    gender: (profile.gender ?? '') as Gender | '',
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
  }
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const dirty = JSON.stringify(f) !== JSON.stringify(initial)

  const save = useMutation({
    mutationFn: () =>
      profileApi.update({
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim() || undefined,
        phone: f.phone.trim(),
        gender: f.gender || undefined,
        dateOfBirth: f.dateOfBirth || undefined,
      }),
    onSuccess: async () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      await queryClient.invalidateQueries({ queryKey: accountKeys.profile })
      await refreshProfile()
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.firstName.trim().length < 2) er.firstName = 'اكتب الاسم الأول.'
    if (f.phone.trim().replace(/\D/g, '').length < 8) er.phone = 'اكتب رقم موبايل صحيح.'
    setErrors(er)
    if (!Object.keys(er).length) save.mutate()
  }

  return (
    <Panel>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <h2 className="text-xl">البيانات الشخصية</h2>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <TextField
            label="الاسم الأول"
            autoComplete="given-name"
            value={f.firstName}
            onChange={(e) => setF({ ...f, firstName: e.target.value })}
            error={errors.firstName}
          />
          <TextField
            label="اسم العيلة"
            autoComplete="family-name"
            value={f.lastName}
            onChange={(e) => setF({ ...f, lastName: e.target.value })}
          />
          <TextField label="البريد الإلكتروني" type="email" ltr value={profile.email} disabled readOnly />
          <TextField
            label="رقم الموبايل"
            type="tel"
            ltr
            autoComplete="tel"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
            error={errors.phone}
          />
          <ChoiceChips<Gender>
            label="النوع"
            value={f.gender}
            onChange={(v) => setF({ ...f, gender: v })}
            options={[
              { value: 'Male', label: 'ذكر' },
              { value: 'Female', label: 'أنثى' },
            ]}
            hint="عشان نكلّمك بالصيغة الصح في المنصة والرسايل"
          />
          <TextField
            label="تاريخ الميلاد (اختياري)"
            type="date"
            ltr
            value={f.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setF({ ...f, dateOfBirth: e.target.value })}
          />
        </div>
        {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="submit"
            className={buttonClass({ variant: 'gold' })}
            disabled={!dirty || save.isPending}
          >
            {save.isPending ? (
              <Spinner />
            ) : (
              <>
                <Icon name="check" size={16} /> حفظ التغييرات
              </>
            )}
          </button>
          {dirty && (
            <button
              type="button"
              className={buttonClass({ variant: 'outline' })}
              onClick={() => setF(initial)}
            >
              إلغاء
            </button>
          )}
          {saved && <span className="text-sm font-bold text-success">اتحفظت</span>}
        </div>
      </form>
    </Panel>
  )
}

function PasswordForm() {
  const t = useCopy()
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const change = useMutation({
    mutationFn: () => profileApi.changePassword({ currentPassword: f.current, newPassword: f.next }),
    onSuccess: () => setF({ current: '', next: '', confirm: '' }),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!f.current) er.current = 'اكتب كلمة المرور الحالية.'
    if (f.next.length < 8) er.next = 'كلمة المرور لازم تكون 8 حروف على الأقل.'
    else if (f.next === f.current) er.next = 'اختار كلمة مرور مختلفة عن الحالية.'
    if (f.confirm !== f.next) er.confirm = 'كلمتين المرور مش زي بعض.'
    setErrors(er)
    if (!Object.keys(er).length) change.mutate()
  }

  return (
    <Panel>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <h2 className="text-xl">تغيير كلمة المرور</h2>
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <PasswordField
            label="كلمة المرور الحالية"
            autoComplete="current-password"
            value={f.current}
            onChange={(e) => setF({ ...f, current: e.target.value })}
            error={errors.current}
          />
          <PasswordField
            label="كلمة المرور الجديدة"
            autoComplete="new-password"
            placeholder="8 أحرف على الأقل"
            value={f.next}
            onChange={(e) => setF({ ...f, next: e.target.value })}
            error={errors.next}
          />
          <PasswordField
            label="تأكيد كلمة المرور"
            autoComplete="new-password"
            placeholder={t('pw.confirm')}
            value={f.confirm}
            onChange={(e) => setF({ ...f, confirm: e.target.value })}
            error={errors.confirm}
          />
        </div>
        {change.isError && <Alert tone="error">{(change.error as Error).message}</Alert>}
        {change.isSuccess && <Alert tone="success">كلمة المرور اتغيّرت.</Alert>}
        <button
          type="submit"
          className={buttonClass({ variant: 'navy', className: 'self-start' })}
          disabled={change.isPending}
        >
          {change.isPending ? (
            <Spinner />
          ) : (
            <>
              <Icon name="lock" size={15} /> تحديث كلمة المرور
            </>
          )}
        </button>
      </form>
    </Panel>
  )
}
