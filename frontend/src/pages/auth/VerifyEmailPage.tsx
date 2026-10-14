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

const RESEND_SECONDS = 60

export function VerifyEmailPage() {
  usePageTitle('تفعيل الحساب')
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
      setError(err instanceof Error ? err.message : 'الكود مش صحيح.')
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
      setNotice('بعتنالك كود جديد.')
      setWait(RESEND_SECONDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مقدرناش نبعت الكود.')
    }
  }

  return (
    <AuthShell
      title="فعّل حسابك"
      sub={
        <>
          بعتنا كود من 6 أرقام على <b dir="ltr">{email}</b>. اكتبه هنا عشان تفعّل حسابك.
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
          {busy ? <Spinner label="جاري التفعيل" /> : 'تفعيل الحساب'}
        </button>
      </form>
      <AuthSwitch>
        موصلكش الكود؟{' '}
        <button
          type="button"
          className="border-0 bg-transparent p-0 font-bold text-blue-500 disabled:cursor-default disabled:text-muted-2"
          disabled={wait > 0}
          onClick={resend}
        >
          {wait > 0 ? `ابعته تاني بعد ${wait} ثانية` : 'ابعته تاني'}
        </button>
      </AuthSwitch>
      <AuthSwitch>
        <Link to={routes.register}>غيّر البريد الإلكتروني</Link>
      </AuthSwitch>
    </AuthShell>
  )
}
