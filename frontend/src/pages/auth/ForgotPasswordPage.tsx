import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { authApi } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { Spinner } from '@/components/ui/States'
import { usePageTitle } from '@/lib/usePageTitle'
import { AuthShell, AuthSwitch } from './AuthShell'
import { buttonClass } from '@/components/ui/button'
import { Alert } from '@/components/ui/States'
import { OtpInput, PasswordField, TextField } from '@/components/ui/fields'

/** Two steps on one page: request a code by email, then set a new password with it. */
export function ForgotPasswordPage() {
  usePageTitle('نسيت كلمة المرور')
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function requestCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await authApi.forgotPassword(email.trim())
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حصلت مشكلة، حاول تاني.')
    } finally {
      setBusy(false)
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('كلمة المرور لازم تكون 8 حروف على الأقل.')
      return
    }
    setBusy(true)
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp, newPassword: password })
      setDone(true)
      setTimeout(() => navigate(routes.login, { replace: true }), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'الكود مش صحيح.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={step === 'email' ? 'نسيت كلمة المرور؟' : 'كلمة مرور جديدة'}
      sub={
        step === 'email' ? (
          'اكتب بريدك الإلكتروني وهنبعتلك كود تغيّر بيه كلمة المرور.'
        ) : (
          <>
            لو البريد <b dir="ltr">{email}</b> مسجّل عندنا، هيوصلك كود من 6 أرقام.
          </>
        )
      }
    >
      {error && <Alert tone="error">{error}</Alert>}
      {done && <Alert tone="success">تم تغيير كلمة المرور. بنحوّلك لتسجيل الدخول…</Alert>}
      {step === 'email' ? (
        <form className="flex flex-col gap-4.5" onSubmit={requestCode}>
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
            disabled={busy || !email}
          >
            {busy ? <Spinner /> : 'ابعت الكود'}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4.5" onSubmit={reset}>
          <OtpInput value={otp} onChange={setOtp} />
          <PasswordField
            label="كلمة المرور الجديدة"
            autoComplete="new-password"
            hint="8 حروف على الأقل"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className={buttonClass({ variant: 'navy', size: 'lg', block: true })}
            disabled={busy || otp.length !== 6 || done}
          >
            {busy ? <Spinner /> : 'حفظ كلمة المرور'}
          </button>
        </form>
      )}
      <AuthSwitch>
        افتكرتها؟ <Link to={routes.login}>سجّل دخول</Link>
      </AuthSwitch>
    </AuthShell>
  )
}
