import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/endpoints'
import { useAuth } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { Spinner } from '@/components/ui/States'
import { usePageTitle } from '@/lib/usePageTitle'
import { AuthShell, AuthSwitch } from './AuthShell'
import { buttonClass } from '@/components/ui/button'
import { Alert } from '@/components/ui/States'
import { OtpInput } from '@/components/ui/fields'
import { pendingSignup } from './pending'
import { tx } from '@/lib/i18n'

const RESEND_SECONDS = 60

export function VerifyEmailPage() {
  usePageTitle(tx('تفعيل الحساب', 'Activate account'))
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const state = (location.state as { email?: string; from?: string; resend?: boolean } | null) ?? {}
  const email = state.email ?? ''

  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(state.resend ? 0 : RESEND_SECONDS)

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  if (!email) return <Navigate to={routes.login} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    setError(null)
    setBusy(true)
    try {
      await authApi.verifyEmail({ email, otp })
      const creds = pendingSignup.take(email)
      if (creds) {
        await login(creds.email, creds.password)
        navigate(state.from ?? routes.home, { replace: true })
      } else {
        navigate(routes.login, { replace: true, state: { from: state.from } })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('الكود مش صحيح.', "That code isn't correct."))
      setOtp('')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError(null)
    setNotice(null)
    try {
      await authApi.resendVerification(email)
      setNotice(tx('بعتنالك كود جديد.', "We've sent you a new code."))
      setWait(RESEND_SECONDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('مقدرناش نبعت الكود.', "We couldn't send the code."))
    }
  }

  return (
    <AuthShell
      title={tx('فعّل حسابك', 'Activate your account')}
      sub={
        <>
          {tx('بعتنا كود من 6 أرقام على', 'We sent a 6-digit code to')} <b dir="ltr">{email}</b>.{' '}
          {tx('اكتبه هنا عشان تفعّل حسابك.', 'Enter it here to activate your account.')}
        </>
      }
    >
      <form className="flex flex-col gap-4.5" onSubmit={onSubmit}>
        {error && <Alert tone="error">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        <OtpInput value={otp} onChange={setOtp} />
        <button
          type="submit"
          className={buttonClass({ variant: 'navy', size: 'lg', block: true })}
          disabled={busy || otp.length !== 6}
        >
          {busy ? (
            <Spinner label={tx('جاري التفعيل', 'Activating')} />
          ) : (
            tx('تفعيل الحساب', 'Activate account')
          )}
        </button>
      </form>
      <AuthSwitch>
        {tx('موصلكش الكود؟', "Didn't get the code?")}{' '}
        <button
          type="button"
          className="border-0 bg-transparent p-0 font-bold text-blue-500 disabled:cursor-default disabled:text-muted-2"
          disabled={wait > 0}
          onClick={resend}
        >
          {wait > 0 ? tx(`ابعته تاني بعد ${wait} ثانية`, `Resend in ${wait}s`) : tx('ابعته تاني', 'Resend')}
        </button>
      </AuthSwitch>
      <AuthSwitch>
        <Link to={routes.register}>{tx('غيّر البريد الإلكتروني', 'Change email')}</Link>
      </AuthSwitch>
    </AuthShell>
  )
}
