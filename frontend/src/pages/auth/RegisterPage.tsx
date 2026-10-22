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
import { PasswordField, PasswordRules, TextField } from '@/components/ui/fields'
import { PhoneField } from '@/components/ui/PhoneField'
import { isValidPhone } from '@/lib/phone'
import { isStrongPassword, PASSWORD_POLICY_TEXT } from '@/lib/password'
import { warnFormErrors } from '@/lib/formErrors'
import { pendingSignup } from './pending'
import { isEn, tx } from '@/lib/i18n'

type Errors = Partial<
  Record<'fullName' | 'email' | 'phoneNumber' | 'password' | 'confirm' | 'gender', string>
>

// Radio styled as a segmented button; state comes from the hidden input via :has().
const segClass =
  'flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-field border-[1.5px] border-line-2 bg-white font-semibold text-text-2 transition-colors ' +
  'has-checked:border-blue-400 has-checked:bg-surface-blue has-checked:text-ink has-focus-visible:shadow-[0_0_0_4px_rgba(61,155,216,.25)]'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  usePageTitle(tx('إنشاء حساب', 'Create account'))
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
    if (form.fullName.trim().split(/\s+/).length < 2)
      e.fullName = tx('اكتب الاسم الأول واسم العيلة.', 'Enter your first and last name.')
    if (!EMAIL_RE.test(form.email.trim()))
      e.email = tx('البريد الإلكتروني مش صحيح.', "That email doesn't look right.")
    if (!isValidPhone(form.phoneNumber))
      e.phoneNumber = tx(
        'رقم الموبايل مش صحيح للدولة اللي اخترتها.',
        "That number isn't valid for the selected country.",
      )
    if (!form.gender)
      e.gender = tx(
        'اختار النوع عشان نكلمك بالصيغة المناسبة.',
        'Choose your gender so we address you correctly.',
      )
    if (!isStrongPassword(form.password)) e.password = PASSWORD_POLICY_TEXT
    if (form.confirm !== form.password)
      e.confirm = tx('كلمتين المرور مش متطابقين.', "The passwords don't match.")
    return e
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setServerError(null)
    const e = validate()
    setErrors(e)
    if (warnFormErrors(e)) return

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
        setServerError(
          tx(
            'البريد الإلكتروني أو رقم الموبايل ده مسجّل قبل كده. جرّب تسجّل دخول.',
            'This email or phone number is already registered. Try signing in.',
          ),
        )
      } else if (err instanceof ApiClientError && err.statusCode === 503) {
        // Account was created but the email failed; the verify page can resend.
        pendingSignup.set({ email, password: form.password })
        navigate(routes.verifyEmail, { state: { email, resend: true } })
      } else {
        setServerError(
          err instanceof Error
            ? err.message
            : tx('حصلت مشكلة، حاول تاني.', 'Something went wrong. Please try again.'),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={tx('إنشاء حساب جديد', 'Create a new account')}
      sub={tx('حساب واحد لدوراتك وكتبك وشهاداتك.', 'One account for your courses, books and certificates.')}
    >
      <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <TextField
          label={tx('الاسم بالكامل', 'Full name')}
          autoComplete="name"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          required
        />

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-[15px] font-semibold text-ink">{tx('النوع', 'Gender')}</legend>
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
              {tx('ذكر', 'Male')}
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
              {tx('أنثى', 'Female')}
            </label>
          </div>
          {errors.gender && <span className="text-sm text-danger">{errors.gender}</span>}
        </fieldset>

        <div className="grid gap-3.5">
          <TextField
            label={tx('البريد الإلكتروني', 'Email')}
            type="email"
            ltr
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
          />
        </div>
        <PhoneField
          label={tx('رقم الموبايل', 'Mobile number')}
          value={form.phoneNumber}
          onChange={(phoneNumber) => setForm((f) => ({ ...f, phoneNumber }))}
          error={errors.phoneNumber}
          required
        />
        <PasswordField
          label={tx('كلمة المرور', 'Password')}
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
        />
        <PasswordRules password={form.password} />
        <PasswordField
          label={
            isEn ? 'Confirm password' : female ? 'اكتبيها تاني' : male ? 'اكتبها تاني' : 'تأكيد كلمة المرور'
          }
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />
        <TextField
          label={tx('كود الدعوة (اختياري)', 'Referral code (optional)')}
          ltr
          value={form.referralCode}
          onChange={set('referralCode')}
          autoCapitalize="characters"
        />
        <p className="text-[13px] text-muted">
          {isEn
            ? 'By creating an account you agree to the'
            : `بإنشاء الحساب ${female ? 'إنتي موافقة' : 'إنت موافق'} على`}{' '}
          <Link to={routes.terms}>{tx('الشروط والأحكام', 'terms & conditions')}</Link> {tx('و', 'and')}{' '}
          <Link to={routes.privacy}>{tx('سياسة الخصوصية', 'privacy policy')}</Link>.
        </p>
        <button
          type="submit"
          className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
          disabled={busy}
        >
          {busy ? (
            <Spinner label={tx('جاري إنشاء الحساب', 'Creating account')} />
          ) : isEn ? (
            'Get started'
          ) : female ? (
            'ابدئي دلوقتي'
          ) : (
            'ابدأ دلوقتي'
          )}
        </button>
      </form>
      <AuthSwitch>
        {tx('عندك حساب؟', 'Have an account?')}{' '}
        <Link to={routes.login} state={location.state}>
          {tx('سجّل دخول', 'Sign in')}
        </Link>
      </AuthSwitch>
    </AuthShell>
  )
}
