import type { ConsultStatus } from '@/api/account'
import type { Tone } from './order-status'
import { locale, tx } from '@/lib/i18n'

export const CONSULT_STATUS: Record<ConsultStatus, { label: string; tone: Tone }> = {
  NEW: { label: tx('في انتظار التأكيد', 'Awaiting confirmation'), tone: 'warning' },
  CONTACTED: { label: tx('اتواصلنا معاك', 'We contacted you'), tone: 'info' },
  SCHEDULED: { label: tx('مؤكدة', 'Confirmed'), tone: 'info' },
  COMPLETED: { label: tx('تمّت', 'Completed'), tone: 'success' },
  CANCELLED: { label: tx('ملغية', 'Cancelled'), tone: 'muted' },
}

// Values sent by the consultation request form.
export const SESSION_TYPE: Record<string, string> = {
  video: tx('مكالمة فيديو', 'Video call'),
  voice: tx('مكالمة صوتية', 'Voice call'),
  any: tx('مكالمة', 'Call'),
}

export const PREFERRED_TIME: Record<string, string> = {
  morning: tx('الصبح', 'Morning'),
  afternoon: tx('بعد الضهر', 'Afternoon'),
  evening: tx('بالليل', 'Evening'),
}

const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', numberingSystem: 'latn' })
const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', numberingSystem: 'latn' })
const timeFmt = new Intl.DateTimeFormat(locale, {
  hour: 'numeric',
  minute: '2-digit',
  numberingSystem: 'latn',
})

/** Pieces for the calendar tile: { day: 18, month: 'أكتوبر', weekday: 'السبت', time: '7:00 م' } */
export function dateTile(iso: string) {
  const d = new Date(iso)
  return { day: d.getDate(), month: monthFmt.format(d), weekday: dayFmt.format(d), time: timeFmt.format(d) }
}

/** Next scheduled session in the future, if any. */
export function nextSession<T extends { status: ConsultStatus; scheduledAt: string | null }>(list: T[]) {
  const now = Date.now()
  return list
    .filter((c) => c.status === 'SCHEDULED' && c.scheduledAt && new Date(c.scheduledAt).getTime() > now)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0]
}

/** Sessions from an hour ago onward, soonest first. */
export function upcomingSessions<T extends { scheduledAt: string | null }>(list: T[], limit = 4) {
  const from = Date.now() - 3_600_000
  return list
    .filter((r) => r.scheduledAt && new Date(r.scheduledAt).getTime() > from)
    .sort((a, b) => +new Date(a.scheduledAt!) - +new Date(b.scheduledAt!))
    .slice(0, limit)
}
