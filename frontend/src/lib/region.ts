import { useSyncExternalStore } from 'react'

/**
 * Where the visitor is, for pricing and payment options:
 *  - Egypt: prices in EGP; Apple Pay, cards, mobile wallets and PayPal.
 *  - Anywhere else: prices in USD; Apple Pay, cards and PayPal (no Egyptian wallets).
 *
 * The country comes from the CDN (`GET /geo`, see infra/aws/platform.yml). When that isn't
 * available (local dev, network error) the browser's time zone is used. `?country=US` (or EG)
 * in any URL overrides it for testing and is remembered for the session.
 */
export type Currency = 'EGP' | 'USD'

export interface Region {
  country: string
  isEgypt: boolean
  currency: Currency
  /** False until the country is known; prices render in EGP meanwhile. */
  ready: boolean
}

const SESSION_KEY = 'drs.region.country'
const OVERRIDE_KEY = 'drs.region.override'

function toRegion(country: string, ready: boolean): Region {
  const c = country.toUpperCase()
  const isEgypt = c === 'EG'
  return { country: c, isEgypt, currency: isEgypt ? 'EGP' : 'USD', ready }
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* storage blocked: detect again next time */
  }
}

function guessFromTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz === 'Africa/Cairo' ? 'EG' : 'XX'
  } catch {
    return 'EG'
  }
}

function initialRegion(): Region {
  if (typeof window === 'undefined') return toRegion('EG', false)
  const fromUrl = new URLSearchParams(window.location.search).get('country')
  if (fromUrl && /^[a-z]{2}$/i.test(fromUrl)) {
    writeSession(OVERRIDE_KEY, fromUrl.toUpperCase())
  }
  const override = readSession(OVERRIDE_KEY)
  if (override) return toRegion(override, true)
  const cached = readSession(SESSION_KEY)
  if (cached) return toRegion(cached, true)
  return toRegion(guessFromTimeZone(), false)
}

let region: Region = initialRegion()
const listeners = new Set<() => void>()

function set(next: Region) {
  region = next
  listeners.forEach((l) => l())
}

async function detect() {
  if (region.ready) return
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch('/geo', { cache: 'no-store', signal: controller.signal })
    const type = res.headers.get('content-type') ?? ''
    if (res.ok && type.includes('application/json')) {
      const body = (await res.json()) as { country?: string }
      if (body.country && /^[A-Z]{2}$/i.test(body.country)) {
        writeSession(SESSION_KEY, body.country.toUpperCase())
        set(toRegion(body.country, true))
        return
      }
    }
  } catch {
    /* fall through to the time-zone guess */
  } finally {
    clearTimeout(timer)
  }
  set({ ...region, ready: true })
}

if (typeof window !== 'undefined') void detect()

export function getRegion(): Region {
  return region
}

export function useRegion(): Region {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => region,
    () => region,
  )
}
