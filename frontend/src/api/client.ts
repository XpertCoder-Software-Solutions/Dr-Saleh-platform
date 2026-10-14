import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError, ApiSuccess, RefreshTokenData } from '@/types/api'
import { tokenStore } from './tokens'

export const API_URL: string = import.meta.env.VITE_API_URL || '/api'

/** Error thrown by every API call, with the backend message when there is one. */
export class ApiClientError extends Error {
  readonly statusCode: number
  readonly errors: unknown[]

  constructor(message: string, statusCode: number, errors: unknown[] = []) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

const http = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

http.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- refresh-on-401: one refresh at a time, retry the request once ----

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/verify-email']

let refreshing: Promise<string | null> | null = null
const sessionExpiredListeners = new Set<() => void>()

/** Called when refresh fails and the user has to sign in again. */
export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null
  try {
    const res = await axios.post<ApiSuccess<RefreshTokenData>>(
      `${API_URL}/auth/refresh-token`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )
    tokenStore.set(res.data.data)
    return res.data.data.accessToken
  } catch {
    return null
  }
}

http.interceptors.response.use(undefined, async (error: AxiosError<ApiError>) => {
  const original = error.config as RetriableConfig | undefined
  const isAuthCall = AUTH_PATHS.some((p) => original?.url?.startsWith(p))

  if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
    original._retried = true
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null
    })
    const token = await refreshing
    if (token) {
      original.headers.Authorization = `Bearer ${token}`
      return http(original)
    }
    tokenStore.clear()
    sessionExpiredListeners.forEach((fn) => fn())
  }

  throw toClientError(error)
})

function toClientError(error: AxiosError<ApiError>): ApiClientError {
  if (!error.response) {
    return new ApiClientError('تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول تاني.', 0)
  }
  const body = error.response.data
  const message =
    body && typeof body.message === 'string' && body.message
      ? body.message
      : 'حصلت مشكلة غير متوقعة. حاول تاني بعد شوية.'
  return new ApiClientError(message, error.response.status, body?.errors ?? [])
}

// ---- envelope unwrapping ----

async function unwrap<T>(promise: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const res = await promise
  return res.data.data
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(http.get(url, config)),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.post(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.patch(url, body, config)),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.put(url, body, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(http.delete(url, config)),
}

/** Turns the backend's relative `/uploads/...` paths into absolute URLs. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  const origin = /^https?:\/\//.test(API_URL) ? new URL(API_URL).origin : ''
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`
}
