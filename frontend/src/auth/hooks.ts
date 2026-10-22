import { isEn } from '@/lib/i18n'
import { useCallback, useContext } from 'react'
import { AuthContext } from './AuthContext'
import { strings, type Audience, type CopyKey } from '@/copy/strings'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Who the copy is addressed to: guest (neutral), male, or female. */
export function useAudience(): Audience {
  const { user } = useAuth()
  if (user?.gender === 'Male') return 'male'
  if (user?.gender === 'Female') return 'female'
  return 'guest'
}

/** `t('cta.start')` returns the version that matches the current user. */
export function useCopy() {
  const audience = useAudience()
  const { user } = useAuth()
  return useCallback(
    (key: CopyKey) =>
      (isEn ? strings[key].en : strings[key][audience])
        .replace('{name}', user?.firstName ?? '')
        .replace(/,\s*$/, ''),
    [audience, user?.firstName],
  )
}

/**
 * Inline gendered wording for one-off strings: `g('كمّل', 'كمّلي', 'استكمل', 'Continue')`
 * (the last argument is the English wording).
 * Users without a gender get the neutral form (or the masculine one when none is given).
 */
export function useGender() {
  const audience = useAudience()
  return useCallback(
    (male: string, female: string, neutral?: string, en?: string) =>
      isEn && en !== undefined
        ? en
        : audience === 'female'
          ? female
          : audience === 'male'
            ? male
            : (neutral ?? male),
    [audience],
  )
}
