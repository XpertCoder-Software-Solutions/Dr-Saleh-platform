import type { CartItemType } from '@/api/cart'
import { tx } from '@/lib/i18n'

export const TYPE_LABEL: Record<CartItemType, string> = {
  COURSE: tx('دورة', 'Course'),
  BOOK: tx('كتاب', 'Book'),
  PRODUCT: tx('منتج', 'Product'),
}
export const FORMAT_TYPE_LABEL = {
  Physical: tx('كتاب ورقي', 'Paperback'),
  Digital: tx('كتاب رقمي', 'E-book'),
  Audio: tx('كتاب صوتي', 'Audiobook'),
}
