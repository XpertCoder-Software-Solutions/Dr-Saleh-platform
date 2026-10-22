import type { Order } from '@/api/shop'
import { tx } from '@/lib/i18n'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted'

export const SHIPPING_LABEL = {
  PREPARING: tx('بيتجهّز', 'Being prepared'),
  SHIPPED: tx('في الطريق', 'On its way'),
  DELIVERED: tx('اتسلّم', 'Delivered'),
} as const

/** Status pill for an order: payment first, then shipping for paid orders with physical items. */
export function orderStatus(
  order: Pick<Order, 'status' | 'paymentStatus'> &
    Partial<Pick<Order, 'hasPhysicalItems' | 'shippingStatus'>>,
): { label: string; tone: Tone } {
  switch (order.status) {
    case 'PAID':
      if (order.hasPhysicalItems) {
        if (order.shippingStatus === 'DELIVERED') return { label: SHIPPING_LABEL.DELIVERED, tone: 'success' }
        if (order.shippingStatus === 'SHIPPED') return { label: SHIPPING_LABEL.SHIPPED, tone: 'info' }
        return { label: tx('مدفوع · بيتجهّز', 'Paid · being prepared'), tone: 'success' }
      }
      return { label: tx('مدفوع', 'Paid'), tone: 'success' }
    case 'CANCELLED':
      return { label: tx('ملغي', 'Cancelled'), tone: 'muted' }
    case 'REFUNDED':
      return { label: tx('مسترد', 'Refunded'), tone: 'info' }
    default:
      return order.paymentStatus === 'FAILED'
        ? { label: tx('الدفع مكملش', 'Payment failed'), tone: 'danger' }
        : { label: tx('في انتظار الدفع', 'Awaiting payment'), tone: 'warning' }
  }
}

export const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-[#E7F6EC] text-success',
  warning: 'bg-gold-soft text-gold-ink',
  danger: 'bg-red-50 text-danger',
  info: 'bg-surface-blue text-blue-600',
  muted: 'bg-[#EEF1F4] text-muted',
}

/** "دورة + كتاب صوتي" style summary of what an order holds. */
export function orderKinds(order: Pick<Order, 'items'>): string {
  const kinds = new Set(
    order.items.map((i) =>
      i.itemType === 'COURSE'
        ? tx('دورة', 'Course')
        : i.itemType === 'BOOK'
          ? tx('كتاب', 'Book')
          : tx('منتجات', 'Products'),
    ),
  )
  return [...kinds].join(' + ')
}
