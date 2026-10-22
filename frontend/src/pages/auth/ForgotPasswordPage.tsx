import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/States'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/cn'
import { isStrongPassword, PASSWORD_POLICY_TEXT } from '@/lib/password'
import { clearToasts, toast } from '@/lib/toast'
import { AuthShell, AuthSwitch } from './AuthShell'
import { buttonClass } from '@/components/ui/button'
import { OtpInput, PasswordField, PasswordRules, TextField } from '@/components/ui/fields'
import { tx } from '@/lib/i18n'

type Step = 'email' | 'otp' | 'password'

const RESEND_SECONDS = 60
const STEPS: { id: Step; label: string }[] = [
  { id: 'email', label: tx('البريد', 'Email') },
  { id: 'otp', label: tx('الكود', 'Code') },
  { id: 'password', label: tx('كلمة المرور', 'Password') },
]

function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
}

/**
 * Forgot password in three steps: email → 6-digit code (checked on its own) →
 * new password + confirmation.
 */
export function ForgotPasswordPage() {
  usePageTitle(tx('نسيت كلمة المرور', 'Forgot password'))
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  async function sendCode() {
    setBusy(true)
    try {
      await authApi.forgotPassword(email.trim())
      clearToasts()
      setOtp('')
      setStep('otp')
      setWait(RESEND_SECONDS)
      return true
    } catch (err) {
      toast.error(
        errorText(err, tx('مقدرناش نبعت الكود. حاول تاني.', "We couldn't send the code. Please try again.")),
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.warning(tx('اكتب بريد إلكتروني صحيح.', 'Enter a valid email address.'))
      return
    }
    await sendCode()
  }

  async function onResend() {
    if (await sendCode()) toast.success(tx('بعتنالك كود جديد.', "We've sent you a new code."))
  }

  async function onOtp(e: FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.warning(tx('الكود لازم يكون 6 أرقام.', 'The code must be 6 digits.'))
      return
    }
    setBusy(true)
    try {
      const res = await authApi.verifyResetOtp({ email: email.trim(), otp })
      setResetToken(res.resetToken)
      clearToasts()
      setStep('password')
    } catch (err) {
      toast.error(errorText(err, tx('الكود مش صحيح.', "That code isn't correct.")))
      setOtp('')
    } finally {
      setBusy(false)
    }
  }

  async function onPassword(e: FormEvent) {
    e.preventDefault()
    setConfirmError(null)
    if (!isStrongPassword(password)) {
      toast.warning(PASSWORD_POLICY_TEXT)
      return
    }
    if (confirm !== password) {
      setConfirmError(tx('كلمتين المرور مش متطابقين.', "The passwords don't match."))
      toast.warning(
        tx(
          'تأكيد كلمة المرور مش زي كلمة المرور الجديدة.',
          "The confirmation doesn't match the new password.",
        ),
      )
      return
    }
    setBusy(true)
    try {
      await authApi.resetPassword({ email: email.trim(), resetToken, newPassword: password })
      clearToasts()
      toast.success(
        tx(
          'تم تغيير كلمة المرور. سجّل دخول بكلمة المرور الجديدة.',
          'Password changed. Sign in with your new password.',
        ),
      )
      navigate(routes.login, { replace: true, state: { email: email.trim() } })
    } catch (err) {
      const message = errorText(
        err,
        tx('مقدرناش نغيّر كلمة المرور. حاول تاني.', "We couldn't change the password. Please try again."),
      )
      toast.error(message)
      // The 15-minute window ran out: start again from the code.
      if (message.includes('ابدأ من الأول') || /expired|invalid/i.test(message)) {
        setResetToken('')
        setStep('email')
      }
    } finally {
      setBusy(false)
    }
  }

  const title =
    step === 'email'
      ? tx('نسيت كلمة المرور؟', 'Forgot your password?')
      : step === 'otp'
        ? tx('اكتب الكود', 'Enter the code')
        : tx('كلمة مرور جديدة', 'New password')
  const sub =
    step === 'email' ? (
      tx(
        'اكتب بريدك الإلكتروني وهنبعتلك كود تغيّر بيه كلمة المرور.',
        "Enter your email and we'll send you a code to reset your password.",
      )
    ) : step === 'otp' ? (
      <>
        {tx('لو البريد', 'If')} <b dir="ltr">{email.trim()}</b>{' '}
        {tx(
          'مسجّل عندنا، هيوصلك كود من 6 أرقام. الكود صالح 10 دقايق.',
          "is registered, you'll receive a 6-digit code. It's valid for 10 minutes.",
        )}
      </>
    ) : (
      tx(
        'الكود صحيح. اختار كلمة مرور جديدة واكتبها مرتين.',
        'Code verified. Choose a new password and enter it twice.',
      )
    )
  const stepIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <AuthShell title={title} sub={sub}>
      <ol
        className="flex items-center gap-2"
        aria-label={tx('خطوات تغيير كلمة المرور', 'Password reset steps')}
      >
        {STEPS.map((s, i) => {
          const done = i < stepIndex
          const current = i === stepIndex
          return (
            <li
              key={s.id}
              className="flex flex-1 items-center gap-2"
              aria-current={current ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex size-8 flex-none items-center justify-center rounded-full text-sm font-bold',
                  done && 'bg-green-100 text-green-700',
                  current && 'bg-navy text-white',
                  !done && !current && 'bg-surface text-muted',
                )}
              >
                {done ? <Icon name="check" size={15} /> : i + 1}
              </span>
              <span className={cn('text-sm font-semibold', current ? 'text-ink' : 'text-muted')}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>

      {step === 'email' && (
        <form className="flex flex-col gap-4.5" onSubmit={onEmail} noValidate>
          <TextField
            label={tx('البريد الإلكتروني', 'Email')}
            type="email"
            ltr
            autoComplete="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className={buttonClass({ variant: 'navy', size: 'lg', block: true })}
            disabled={busy || !email.trim()}
          >
            {busy ? <Spinner label={tx('جاري الإرسال', 'Sending')} /> : tx('ابعت الكود', 'Send code')}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form className="flex flex-col gap-4.5" onSubmit={onOtp}>
          <OtpInput value={otp} onChange={setOtp} />
          <button
            type="submit"
            className={buttonClass({ variant: 'navy', size: 'lg', block: true })}
            disabled={busy || otp.length !== 6}
          >
            {busy ? <Spinner label={tx('جاري التأكد', 'Verifying')} /> : tx('تأكيد الكود', 'Verify code')}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-blue-500 disabled:cursor-default disabled:text-muted-2"
              disabled={wait > 0 || busy}
              onClick={onResend}
            >
              {wait > 0
                ? tx(`ابعت الكود تاني بعد ${wait} ثانية`, `Resend code in ${wait}s`)
                : tx('ابعت الكود تاني', 'Resend code')}
            </button>
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-semibold text-muted hover:text-ink"
              onClick={() => setStep('email')}
            >
              {tx('غيّر البريد', 'Change email')}
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form className="flex flex-col gap-4.5" onSubmit={onPassword} noValidate>
          <PasswordField
            label={tx('كلمة المرور الجديدة', 'New password')}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordRules password={password} />
          <PasswordField
            label={tx('تأكيد كلمة المرور الجديدة', 'Confirm new password')}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setConfirmError(null)
            }}
            error={confirmError}
            required
          />
          <button
            type="submit"
            className={buttonClass({ variant: 'navy', size: 'lg', block: true })}
            disabled={busy || !password || !confirm}
          >
            {busy ? <Spinner label={tx('جاري الحفظ', 'Saving')} /> : tx('حفظ كلمة المرور', 'Save password')}
          </button>
        </form>
      )}

      <AuthSwitch>
        {tx('افتكرتها؟', 'Remembered it?')} <Link to={routes.login}>{tx('سجّل دخول', 'Sign in')}</Link>
      </AuthSwitch>
    </AuthShell>
  )
}
