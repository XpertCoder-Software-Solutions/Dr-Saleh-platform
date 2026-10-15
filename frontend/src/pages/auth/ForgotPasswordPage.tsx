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

type Step = 'email' | 'otp' | 'password'

const RESEND_SECONDS = 60
const STEPS: { id: Step; label: string }[] = [
  { id: 'email', label: 'البريد' },
  { id: 'otp', label: 'الكود' },
  { id: 'password', label: 'كلمة المرور' },
]

function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
}

/**
 * Forgot password in three steps: email → 6-digit code (checked on its own) →
 * new password + confirmation.
 */
export function ForgotPasswordPage() {
  usePageTitle('نسيت كلمة المرور')
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
      toast.error(errorText(err, 'مقدرناش نبعت الكود. حاول تاني.'))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.warning('اكتب بريد إلكتروني صحيح.')
      return
    }
    await sendCode()
  }

  async function onResend() {
    if (await sendCode()) toast.success('بعتنالك كود جديد.')
  }

  async function onOtp(e: FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.warning('الكود لازم يكون 6 أرقام.')
      return
    }
    setBusy(true)
    try {
      const res = await authApi.verifyResetOtp({ email: email.trim(), otp })
      setResetToken(res.resetToken)
      clearToasts()
      setStep('password')
    } catch (err) {
      toast.error(errorText(err, 'الكود مش صحيح.'))
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
      setConfirmError('كلمتين المرور مش متطابقين.')
      toast.warning('تأكيد كلمة المرور مش زي كلمة المرور الجديدة.')
      return
    }
    setBusy(true)
    try {
      await authApi.resetPassword({ email: email.trim(), resetToken, newPassword: password })
      clearToasts()
      toast.success('تم تغيير كلمة المرور. سجّل دخول بكلمة المرور الجديدة.')
      navigate(routes.login, { replace: true, state: { email: email.trim() } })
    } catch (err) {
      const message = errorText(err, 'مقدرناش نغيّر كلمة المرور. حاول تاني.')
      toast.error(message)
      // The 15-minute window ran out: start again from the code.
      if (message.includes('ابدأ من الأول')) {
        setResetToken('')
        setStep('email')
      }
    } finally {
      setBusy(false)
    }
  }

  const title =
    step === 'email' ? 'نسيت كلمة المرور؟' : step === 'otp' ? 'اكتب الكود' : 'كلمة مرور جديدة'
  const sub =
    step === 'email' ? (
      'اكتب بريدك الإلكتروني وهنبعتلك كود تغيّر بيه كلمة المرور.'
    ) : step === 'otp' ? (
      <>
        لو البريد <b dir="ltr">{email.trim()}</b> مسجّل عندنا، هيوصلك كود من 6 أرقام. الكود صالح 10
        دقايق.
      </>
    ) : (
      'الكود صحيح. اختار كلمة مرور جديدة واكتبها مرتين.'
    )
  const stepIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <AuthShell title={title} sub={sub}>
      <ol className="flex items-center gap-2" aria-label="خطوات تغيير كلمة المرور">
        {STEPS.map((s, i) => {
          const done = i < stepIndex
          const current = i === stepIndex
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
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
            label="البريد الإلكتروني"
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
            {busy ? <Spinner label="جاري الإرسال" /> : 'ابعت الكود'}
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
            {busy ? <Spinner label="جاري التأكد" /> : 'تأكيد الكود'}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-blue-500 disabled:cursor-default disabled:text-muted-2"
              disabled={wait > 0 || busy}
              onClick={onResend}
            >
              {wait > 0 ? `ابعت الكود تاني بعد ${wait} ثانية` : 'ابعت الكود تاني'}
            </button>
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-semibold text-muted hover:text-ink"
              onClick={() => setStep('email')}
            >
              غيّر البريد
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form className="flex flex-col gap-4.5" onSubmit={onPassword} noValidate>
          <PasswordField
            label="كلمة المرور الجديدة"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordRules password={password} />
          <PasswordField
            label="تأكيد كلمة المرور الجديدة"
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
            {busy ? <Spinner label="جاري الحفظ" /> : 'حفظ كلمة المرور'}
          </button>
        </form>
      )}

      <AuthSwitch>
        افتكرتها؟ <Link to={routes.login}>سجّل دخول</Link>
      </AuthSwitch>
    </AuthShell>
  )
}
