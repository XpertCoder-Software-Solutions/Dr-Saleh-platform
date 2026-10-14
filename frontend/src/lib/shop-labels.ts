import type { CartItemType } from '@/api/cart'

export const TYPE_LABEL: Record<CartItemType, string> = { COURSE: 'دورة', BOOK: 'كتاب', PRODUCT: 'منتج' }
export const FORMAT_TYPE_LABEL = { Physical: 'كتاب ورقي', Digital: 'كتاب رقمي', Audio: 'كتاب صوتي' } as const
