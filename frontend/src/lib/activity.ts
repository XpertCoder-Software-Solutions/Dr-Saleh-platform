import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accountKeys, useMyCertificates, useMyConsultations } from '@/api/account'
import { ordersApi } from '@/api/shop'
import { routes } from '@/app/routes'
import { useAuth } from '@/auth/hooks'
import type { IconName } from '@/components/ui/Icon'
import { dateTile } from './consult-status'

export interface ActivityItem {
  id: string
  icon: IconName
  text: string
  to: string
  /** When it happened, for sorting and the unread state. */
  at: string
  tone: 'blue' | 'gold' | 'green' | 'red'
}

/*
 * Read state. There is no notifications API yet, so it lives in this browser:
 * everything up to `allAt` counts as read ("mark all as read"), plus the ids
 * opened one by one after that.
 */
interface ReadState {
  allAt: number
  ids: string[]
}

const stateKey = (userId: string) => `drs.notif.${userId}`
const legacyKey = (userId: string) => `drs.activity-seen.${userId}`
const listeners = new Set<() => void>()

function rawState(userId: string): string {
  try {
    return localStorage.getItem(stateKey(userId)) ?? ''
  } catch {
    return ''
  }
}

function parseState(userId: string, raw: string): ReadState {
  if (raw) {
    try {
      const s = JSON.parse(raw) as Partial<ReadState>
      return { allAt: Number(s.allAt) || 0, ids: Array.isArray(s.ids) ? s.ids : [] }
    } catch {
      // fall through
    }
  }
  // Before per-item reads, opening the bell marked everything up to then as seen.
  let allAt = 0
  try {
    allAt = Number(localStorage.getItem(legacyKey(userId))) || 0
  } catch {
    // ignore
  }
  return { allAt, ids: [] }
}

function writeState(userId: string, s: ReadState) {
  try {
    localStorage.setItem(stateKey(userId), JSON.stringify(s))
  } catch {
    // ignore
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => e.key?.startsWith('drs.notif.') && listener()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Unread state for the current user, shared by the bell and the notifications page. */
export function useReadState() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const raw = useSyncExternalStore(subscribe, () => (userId ? rawState(userId) : ''))
  const state = useMemo(() => parseState(userId, raw), [userId, raw])

  const isUnread = useCallback(
    (item: ActivityItem) => +new Date(item.at) > state.allAt && !state.ids.includes(item.id),
    [state],
  )
  const markRead = useCallback(
    (id: string) => {
      if (!userId || state.ids.includes(id)) return
      // Keep the list short: only ids that are still newer than allAt matter.
      writeState(userId, { ...state, ids: [...state.ids, id].slice(-200) })
    },
    [userId, state],
  )
  const markAllRead = useCallback(() => {
    if (userId) writeState(userId, { allAt: Date.now(), ids: [] })
  }, [userId])

  return { isUnread, markRead, markAllRead }
}

/**
 * Notifications: recent things that happened on the account, built from the
 * user's own orders, certificates and consultations. `limit` caps the list
 * (the bell shows a few, the notifications page shows them all).
 */
export function useActivity(limit = 8) {
  const { user } = useAuth()
  const enabled = Boolean(user) && user?.role !== 'Admin'
  const orders = useQuery({
    queryKey: [...accountKeys.orders, 'activity', limit],
    queryFn: () => ordersApi.list({ limit: Math.max(10, limit) }),
    enabled,
    staleTime: 5 * 60_000,
  })
  const certs = useMyCertificates()
  const consults = useMyConsultations()

  const items: ActivityItem[] = []
  if (enabled) {
    for (const o of orders.data?.items ?? []) {
      const n = `#${o.orderNumber}`
      if (o.status === 'PENDING' && o.paymentStatus !== 'PAID') {
        items.push({
          id: `o-${o.id}`,
          icon: 'card',
          text: o.paymentStatus === 'FAILED' ? `الدفع مكملش لطلب ${n}، جرّب تاني` : `طلب ${n} مستني الدفع`,
          to: routes.checkoutPay(o.id),
          at: o.createdAt,
          tone: o.paymentStatus === 'FAILED' ? 'red' : 'gold',
        })
      } else if (o.status === 'PAID') {
        const shipped = o.shippingStatus === 'SHIPPED'
        const delivered = o.shippingStatus === 'DELIVERED'
        items.push({
          id: `o-${o.id}-${o.shippingStatus ?? 'paid'}`,
          icon: delivered || shipped ? 'truck' : 'check',
          text: delivered
            ? `طلب ${n} اتسلّم`
            : shipped
              ? `طلب ${n} خرج للشحن${o.trackingNumber ? ` · رقم الشحنة ${o.trackingNumber}` : ''}`
              : `تم دفع طلب ${n}`,
          to: routes.orders,
          at: (delivered ? o.deliveredAt : shipped ? o.shippedAt : o.paidAt) ?? o.createdAt,
          tone: 'green',
        })
      }
    }
    for (const c of certs.data ?? []) {
      items.push({
        id: `c-${c.id}`,
        icon: 'award',
        text: `شهادتك في «${c.course.titleAr}» جاهزة`,
        to: routes.certificates,
        at: c.issuedAt,
        tone: 'gold',
      })
    }
    for (const c of consults.data?.items ?? []) {
      if (c.status === 'SCHEDULED' && c.scheduledAt) {
        const d = dateTile(c.scheduledAt)
        items.push({
          id: `s-${c.id}-${c.scheduledAt}`,
          icon: 'calendar',
          text: `ميعاد استشارتك ${d.weekday} ${d.day} ${d.month} الساعة ${d.time}`,
          to: routes.myConsultations,
          at: c.updatedAt ?? c.createdAt,
          tone: 'blue',
        })
      }
    }
  }

  return {
    items: items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, limit),
    isLoading: enabled && (orders.isLoading || certs.isLoading || consults.isLoading),
    isError: orders.isError || certs.isError || consults.isError,
    refetch: () => {
      orders.refetch()
      certs.refetch()
      consults.refetch()
    },
  }
}
