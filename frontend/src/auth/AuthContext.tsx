import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi, usersApi } from '@/api/endpoints'
import { onSessionExpired } from '@/api/client'
import { tokenStore } from '@/api/tokens'
import type { Gender } from '@/types/api'

export interface SessionUser {
  id: string
  fullName: string
  firstName: string
  email: string
  role: string
  gender: Gender | null
  profileImage: string | null
}

export interface AuthState {
  user: SessionUser | null
  /** True until the stored session has been checked on first load. */
  loading: boolean
  login: (email: string, password: string) => Promise<SessionUser>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthState | null>(null)

const USER_KEY = 'drs.user'

function firstNameOf(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? ''
}

function readCachedUser(): SessionUser | null {
  if (!tokenStore.getRefresh()) return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

function cacheUser(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<SessionUser | null>(readCachedUser)
  const [loading, setLoading] = useState<boolean>(() => Boolean(tokenStore.getRefresh()))

  const setUser = useCallback((next: SessionUser | null) => {
    setUserState(next)
    cacheUser(next)
  }, [])

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === 'me' })
  }, [queryClient, setUser])

  const refreshProfile = useCallback(async () => {
    const profile = await usersApi.profile()
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    setUser({
      id: profile.id,
      fullName,
      firstName: profile.firstName || firstNameOf(fullName),
      email: profile.email,
      role: profile.role ?? 'User',
      gender: profile.gender ?? null,
      profileImage: profile.profileImage ?? null,
    })
  }, [setUser])

  // Validate a stored session once on load (the request refreshes the token if needed).
  useEffect(() => {
    if (!tokenStore.getRefresh()) return
    // State is only set after the request resolves, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProfile()
      .catch(() => clearSession())
      .finally(() => setLoading(false))
  }, [refreshProfile, clearSession])

  useEffect(() => onSessionExpired(clearSession), [clearSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password })
      tokenStore.set(data)
      const fullName = data.user.name ?? data.user.fullName ?? ''
      const next: SessionUser = {
        id: data.user.id,
        fullName,
        firstName: firstNameOf(fullName),
        email: data.user.email,
        role: data.user.role,
        gender: data.user.gender ?? null,
        profileImage: data.user.profileImage ?? null,
      }
      setUser(next)
      // Older backends do not return gender on login; the profile has it.
      if (data.user.gender === undefined) refreshProfile().catch(() => undefined)
      return next
    },
    [refreshProfile, setUser],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Log out locally even if the server call fails.
    }
    clearSession()
  }, [clearSession])

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, logout, refreshProfile }),
    [user, loading, login, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
