import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/api/client'
import { authApi } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { Spinner } from '@/components/ui/States'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Gender } from '@/types/api'
import { AuthShell, AuthSwitch } from './AuthShell'
import { buttonClass } from '@/components/ui/button'
import { Alert } from '@/components/ui/States'
import { PasswordField, TextField } from '@/components/ui/fields'
import { pendingSignup } from './pending'

type Errors = Partial<
  Record<'fullName' | 'email' | 'phoneNumber' | 'password' | 'confirm' | 'gender', string>
>

// Radio styled as a segmented button; state comes from the hidden input via :has().
const segClass =
  'flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-field border-[1.5px] border-line-2 bg-white font-semibold text-text-2 transition-colors ' +
  'has-checked:border-blue-400 has-checked:bg-surface-blue has-checked:text-ink has-focus-visible:shadow-[0_0_0_4px_rgba(61,155,216,.25)]'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s-]{8,16}$/

export function RegisterPage() {
  usePageTitle('إنشاء حساب')
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirm: '',
    gender: '' as Gender | '',
    referralCode: params.get('ref') ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // Copy on this page follows the gender being picked.
  const female = form.gender === 'Female'
  const male = form.gender === 'Male'

  function validate(): Errors {
    const e: Errors = {}
    if (form.fullName.trim().split(/\s+/).length < 2) e.fullName = 'اكتب الاسم الأول واسم العيلة.'
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'البريد الإلكتروني مش صحيح.'
    if (!PHONE_RE.test(form.phoneNumber.trim())) e.phoneNumber = 'رقم الموبايل مش صحيح.'
    if (!form.gender) e.gender = 'اختار النوع عشان نكلمك بالصيغة المناسبة.'
    if (form.password.length < 8) e.password = 'كلمة المرور لازم تكون 8 حروف على الأقل.'
    if (form.confirm !== form.password) e.confirm = 'كلمتين المرور مش متطابقين.'
    return e
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setServerError(null)
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true)
    const email = form.email.trim()
    try {
      await authApi.register({
        fullName: form.fullName.trim(),
        email,
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        gender: form.gender || undefined,
        referralCode: form.referralCode.trim().toUpperCase() || undefined,
      })
      pendingSignup.set({ email, password: form.password })
      navigate(routes.verifyEmail, {
        state: { email, from: (location.state as { from?: string } | null)?.from },
      })
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 409) {
        setServerError('البريد الإلكتروني أو رقم الموبايل ده مسجّل قبل كده. جرّب تسجّل دخول.')
      } else if (err instanceof ApiClientError && err.statusCode === 503) {
        // Account was created but the email failed; the verify page can resend.
        pendingSignup.set({ email, password: form.password })
        navigate(routes.verifyEmail, { state: { email, resend: true } })
      } else {
        setServerError(err instanceof Error ? err.message : 'حصلت مشكلة، حاول تاني.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="إنشاء حساب جديد" sub="حساب واحد لدوراتك وكتبك وشهاداتك.">
      <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <TextField
          label="الاسم بالكامل"
          autoComplete="name"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          required
        />

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-[15px] font-semibold text-ink">النوع</legend>
          <div className="grid grid-cols-2 gap-2.5">
            <label className={segClass}>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={male}
                onChange={set('gender')}
                className="sr-only"
              />
              ذكر
            </label>
            <label className={segClass}>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={female}
                onChange={set('gender')}
                className="sr-only"
              />
              أنثى
            </label>
          </div>
          {errors.gender && <span className="text-sm text-danger">{errors.gender}</span>}
        </fieldset>

        <div className="grid grid-cols-2 gap-3.5 max-[480px]:grid-cols-1">
          <TextField
            label="البريد الإلكتروني"
            type="email"
            ltr
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
          />
          <TextField
            label="رقم الموبايل"
            type="tel"
            ltr
            autoComplete="tel"
            placeholder="+20 10 0000 0000"
            value={form.phoneNumber}
            onChange={set('phoneNumber')}
            error={errors.phoneNumber}
            required
          />
        </div>
        <PasswordField
          label="كلمة المرور"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="8 حروف على الأقل"
          required
        />
        <PasswordField
          label={female ? 'اكتبيها تاني' : male ? 'اكتبها تاني' : 'تأكيد كلمة المرور'}
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />
        <TextField
          label="كود الدعوة (اختياري)"
          ltr
          value={form.referralCode}
          onChange={set('referralCode')}
          autoCapitalize="characters"
        />
        <p className="text-[13px] text-muted">
          بإنشاء الحساب {female ? 'إنتي موافقة' : 'إنت موافق'} على{' '}
          <Link to={routes.terms}>الشروط والأحكام</Link> و<Link to={routes.privacy}>سياسة الخصوصية</Link>.
        </p>
        <button
          type="submit"
          className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
          disabled={busy}
        >
          {busy ? <Spinner label="جاري إنشاء الحساب" /> : female ? 'ابدئي دلوقتي' : 'ابدأ دلوقتي'}
        </button>
      </form>
      <AuthSwitch>
        عندك حساب؟{' '}
        <Link to={routes.login} state={location.state}>
          سجّل دخول
        </Link>
      </AuthSwitch>
    </AuthShell>
  )
}
