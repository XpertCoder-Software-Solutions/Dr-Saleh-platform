import type { ConsultStatus } from '@/api/account'
import type { Tone } from './order-status'

export const CONSULT_STATUS: Record<ConsultStatus, { label: string; tone: Tone }> = {
  NEW: { label: 'في انتظار التأكيد', tone: 'warning' },
  CONTACTED: { label: 'اتواصلنا معاك', tone: 'info' },
  SCHEDULED: { label: 'مؤكدة', tone: 'info' },
  COMPLETED: { label: 'تمّت', tone: 'success' },
  CANCELLED: { label: 'ملغية', tone: 'muted' },
}

// Values sent by the consultation request form.
export const SESSION_TYPE: Record<string, string> = {
  video: 'مكالمة فيديو',
  voice: 'مكالمة صوتية',
  any: 'مكالمة',
}

export const PREFERRED_TIME: Record<string, string> = {
  morning: 'الصبح',
  afternoon: 'بعد الضهر',
  evening: 'بالليل',
}

const dayFmt = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', numberingSystem: 'latn' })
const monthFmt = new Intl.DateTimeFormat('ar-EG', { month: 'long', numberingSystem: 'latn' })
const timeFmt = new Intl.DateTimeFormat('ar-EG', {
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
