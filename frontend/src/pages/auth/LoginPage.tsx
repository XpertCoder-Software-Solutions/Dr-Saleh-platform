import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiClientError } from '@/api/client'
import { authApi } from '@/api/endpoints'
import { useAuth, useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { Spinner } from '@/components/ui/States'
import { usePageTitle } from '@/lib/usePageTitle'
import { AuthShell, AuthSwitch } from './AuthShell'
import { buttonClass } from '@/components/ui/button'
import { Alert } from '@/components/ui/States'
import { PasswordField, TextField } from '@/components/ui/fields'
import { pendingSignup } from './pending'

export function LoginPage() {
  usePageTitle('تسجيل الدخول')
  const { login } = useAuth()
  const t = useCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as { from?: string; email?: string } | null
  const from = navState?.from ?? routes.home

  const [email, setEmail] = useState(navState?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const user = await login(email.trim(), password)
      navigate(user.role === 'Admin' && from === routes.home ? routes.admin : from, { replace: true })
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 403 && /verif/i.test(err.rawMessage)) {
        // Account exists but email isn't verified yet: send a fresh code and go verify.
        pendingSignup.set({ email: email.trim(), password })
        authApi.resendVerification(email.trim()).catch(() => undefined)
        navigate(routes.verifyEmail, { state: { email: email.trim(), from } })
        return
      }
      setError(
        err instanceof ApiClientError && err.statusCode === 401
          ? 'البريد الإلكتروني أو كلمة المرور غلط.'
          : err instanceof ApiClientError && err.statusCode === 403
            ? 'الحساب ده موقوف. تواصل معانا لو محتاج مساعدة.'
            : err instanceof Error
              ? err.message
              : 'حصلت مشكلة، حاول تاني.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="مرحبًا بعودتك" sub={t('auth.login.sub')}>
      <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
        {error && <Alert tone="error">{error}</Alert>}
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
        <PasswordField
          label="كلمة المرور"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelAside={<Link to={routes.forgotPassword}>نسيت كلمة المرور؟</Link>}
        />
        <button
          type="submit"
          className={buttonClass({ variant: 'navy', size: 'lg', block: true })}
          disabled={busy || !email || !password}
        >
          {busy ? <Spinner label="جاري تسجيل الدخول" /> : 'تسجيل الدخول'}
        </button>
      </form>
      <AuthSwitch>
        ليس لديك حساب؟{' '}
        <Link to={routes.register} state={location.state}>
          سجّل الآن
        </Link>
      </AuthSwitch>
    </AuthShell>
  )
}
