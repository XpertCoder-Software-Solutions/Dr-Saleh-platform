import type { Book, BookFormat, BookFormatType } from '@/types/api'

export const FORMAT_LABEL: Record<BookFormatType, string> = {
  Physical: 'ورقي',
  Digital: 'رقمي',
  Audio: 'صوتي',
}
export const FORMAT_ORDER: BookFormatType[] = ['Physical', 'Digital', 'Audio']

/** Price a buyer pays for a format (discount if any, else list price, else the book's price). */
export function formatPrice(format: BookFormat, book?: Pick<Book, 'priceEGP' | 'discountPriceEGP'>) {
  const list = format.priceEGP ?? book?.priceEGP ?? null
  const discounted = format.discountPriceEGP ?? null
  const current = discounted != null && list != null && discounted < list ? discounted : list
  return { current, old: current !== list ? list : null }
}

export function activeFormats(book: Book) {
  return book.formats
    .filter((f) => f.isActive)
    .sort((a, b) => FORMAT_ORDER.indexOf(a.formatType) - FORMAT_ORDER.indexOf(b.formatType))
}

/** Cheapest active format, for "يبدأ من". */
export function bookStartPrice(book: Book): number | null {
  const prices = activeFormats(book)
    .map((f) => formatPrice(f, book).current)
    .filter((p): p is number => typeof p === 'number')
  if (prices.length) return Math.min(...prices)
  return book.discountPriceEGP ?? book.priceEGP ?? null
}

/** "6 س" for audio badges. */
export function audioHours(book: Book): number | null {
  const audio = book.formats.find((f) => f.isActive && f.formatType === 'Audio' && f.audioDuration)
  return audio?.audioDuration ? Math.max(1, Math.round(audio.audioDuration / 3600)) : null
}

export function productPrice(p: { priceEGP: number; discountPriceEGP?: number | null }) {
  const discounted = p.discountPriceEGP != null && p.discountPriceEGP < p.priceEGP
  return { current: discounted ? p.discountPriceEGP! : p.priceEGP, old: discounted ? p.priceEGP : null }
}

/** Stable pick from a list by id, so a card keeps its colors between renders. */
export function pickBySeed<T>(list: T[], seed: string): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return list[h % list.length]
}

export const SHELF_THEMES = [
  { shelf: '#EAF3FA', grad: 'linear-gradient(135deg, #0B2E52 0%, #1E5F96 55%, #3D9BD8 100%)' },
  { shelf: '#FDF3E1', grad: 'linear-gradient(135deg, #E8A33D 0%, #F2B856 50%, #F7CF7E 100%)' },
  { shelf: '#E6F4FC', grad: 'linear-gradient(135deg, #1E5F96 0%, #3D9BD8 50%, #7CD3FF 100%)' },
  { shelf: '#EEEBFB', grad: 'linear-gradient(135deg, #3B3A8F 0%, #5B5BD6 50%, #F2A7C3 100%)' },
]

export const CARD_GRADS = [
  'linear-gradient(135deg, #1E5F96 0%, #3D9BD8 55%, #7CD3FF 100%)',
  'linear-gradient(135deg, #E8A33D 0%, #F2B856 50%, #F7CF7E 100%)',
  'linear-gradient(135deg, #0B2E52 0%, #5B5BD6 60%, #F2A7C3 100%)',
  'linear-gradient(135deg, #0B2E52 0%, #1E5F96 55%, #3D9BD8 100%)',
]
