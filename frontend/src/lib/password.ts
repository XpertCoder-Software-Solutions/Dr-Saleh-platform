import { tx } from '@/lib/i18n'
/** Password rules for new passwords (sign-up, reset, change). Kept in sync with the API. */
export const PASSWORD_MIN_LENGTH = 12

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: tx(`${PASSWORD_MIN_LENGTH} حرف على الأقل`, `At least ${PASSWORD_MIN_LENGTH} characters`),
    test: (p: string) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'upper',
    label: tx('حرف كابيتال (A-Z)', 'A capital letter (A-Z)'),
    test: (p: string) => /[A-Z]/.test(p),
  },
  { id: 'digit', label: tx('رقم (0-9)', 'A number (0-9)'), test: (p: string) => /[0-9]/.test(p) },
  {
    id: 'symbol',
    label: tx('رمز زي ! @ # $ %', 'A symbol like ! @ # $ %'),
    test: (p: string) => /[^A-Za-z0-9\s]/.test(p),
  },
] as const

export function passwordIssues(password: string) {
  return PASSWORD_RULES.filter((r) => !r.test(password))
}

export function isStrongPassword(password: string) {
  return passwordIssues(password).length === 0
}

export const PASSWORD_POLICY_TEXT = tx(
  'كلمة المرور لازم تكون 12 حرف على الأقل وفيها حرف كابيتال ورقم ورمز.',
  'Password must be at least 12 characters with a capital letter, a number and a symbol.',
)
