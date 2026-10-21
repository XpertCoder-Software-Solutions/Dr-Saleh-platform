import type { Currency, Money } from '@/types/api'

const egp = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0, numberingSystem: 'latn' })
const usd = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

/** "450 ج.م" */
export function formatEGP(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return `${egp.format(value)} ج.م`
}

/** "450 ج.م" or "$9.99" */
export function formatMoney(value: number | null | undefined, currency: Currency = 'EGP'): string {
  if (value === null || value === undefined) return ''
  return currency === 'USD' ? `$${usd.format(value)}` : formatEGP(value)
}

/** Anything priced in both currencies (courses, books, products, cart items). */
export interface Priced {
  priceEGP?: Money | null
  discountPriceEGP?: Money | null
  priceUSD?: Money | null
  discountPriceUSD?: Money | null
}

/** List and discount price in one currency. */
export function pricesIn(item: Priced, currency: Currency = 'EGP') {
  return currency === 'USD'
    ? { list: item.priceUSD ?? null, discount: item.discountPriceUSD ?? null }
    : { list: item.priceEGP ?? null, discount: item.discountPriceEGP ?? null }
}

export function coursePrice(course: Priced, currency: Currency = 'EGP') {
  const { list, discount } = pricesIn(course, currency)
  const base = list ?? 0
  const hasDiscount = discount !== null && discount < base
  const current = hasDiscount ? (discount as number) : base
  return {
    current,
    old: hasDiscount ? base : null,
    discountPercent: hasDiscount && base > 0 ? Math.round((1 - current / base) * 100) : 0,
    isFree: current === 0,
  }
}

/** "24 محاضرة" — Arabic counted-noun agreement for the common cases. */
export function lessonsLabel(n: number): string {
  if (n === 1) return 'محاضرة واحدة'
  if (n === 2) return 'محاضرتين'
  if (n >= 3 && n <= 10) return `${n} محاضرات`
  return `${n} محاضرة`
}

/** "3 ساعات و20 دقيقة" or "45 دقيقة" */
export function durationLabel(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const h = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : hours <= 10 ? `${hours} ساعات` : `${hours} ساعة`
  return rest ? `${h} و${rest} دقيقة` : h
}

const dateFmt = new Intl.DateTimeFormat('ar-EG', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  numberingSystem: 'latn',
})

export function formatDate(value: string | Date): string {
  return dateFmt.format(typeof value === 'string' ? new Date(value) : value)
}

/** Rough reading time for article teasers. */
export function readingMinutes(text: string | null | undefined): number {
  const words = (text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 180))
}

/** "دقيقة واحدة" / "5 دقائق" / "12 دقيقة" */
export function minutesLabel(n: number): string {
  if (n <= 1) return 'دقيقة واحدة'
  if (n === 2) return 'دقيقتين'
  if (n <= 10) return `${n} دقائق`
  return `${n} دقيقة`
}

/** "النهارده" / "من 4 أيام" / "من أسبوعين" */
export function sinceLabel(iso: string | null | undefined) {
  if (!iso) return null
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'النهارده'
  if (days === 1) return 'امبارح'
  if (days < 7) return `من ${days} أيام`
  if (days < 14) return 'من أسبوع'
  if (days < 30) return 'من أسبوعين'
  const months = Math.round(days / 30)
  if (months <= 1) return 'من شهر'
  if (months === 2) return 'من شهرين'
  if (months <= 10) return `من ${months} شهور`
  return `من ${months} شهر`
}
