import { api } from './client'
import type { CartItemType } from './cart'

export type Currency = 'EGP' | 'USD'

// ---------- cart ----------

export interface CartLine {
  id: string
  itemType: CartItemType
  itemId: string
  quantity: number
  currency: Currency
  unitPrice: number
  discountUnitPrice: number | null
  lineSubtotal: number
  lineDiscount: number
  lineTotal: number
  item: {
    id: string
    itemType: CartItemType
    slug?: string
    formatType?: 'Physical' | 'Digital' | 'Audio'
    bookId?: string
    nameAr: string
    nameEn?: string
    image: string | null
    stock?: number | null
    isActive: boolean
  } | null
}

export interface CartSummary {
  currency: Currency
  subtotal: number
  discount: number
  total: number
  grandTotal: number
  itemsCount: number
}

export interface CartData {
  cart: { id: string | null; items: CartLine[] }
  summary: CartSummary
}

export const cartApi = {
  get: (currency: Currency = 'EGP') => api.get<CartData>('/cart', { params: { currency } }),
  setQuantity: (id: string, quantity: number) => api.patch(`/cart/items/${id}`, { quantity }),
  remove: (id: string) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart'),
}

/** Courses, digital and audio books need no shipping. */
export function lineNeedsShipping(line: CartLine) {
  return line.itemType === 'PRODUCT' || (line.itemType === 'BOOK' && line.item?.formatType === 'Physical')
}

// ---------- addresses ----------

export interface Governorate {
  id: string
  nameAr: string
  nameEn: string
  shippingCost: number
  isActive?: boolean
}

export interface Address {
  id: string
  fullName: string
  phoneNumber: string
  governorateId: string
  city: string
  street: string
  buildingNumber: string
  floor?: string | null
  apartment?: string | null
  landmark?: string | null
  notes?: string | null
  isActive: boolean
  governorate: Governorate | null
}

export type AddressInput = Omit<Address, 'id' | 'isActive' | 'governorate'>

export const addressesApi = {
  list: () => api.get<{ addresses: Address[] }>('/addresses'),
  create: (input: AddressInput) => api.post<{ address: Address }>('/addresses', input),
  governorates: () => api.get<{ governorates: Governorate[] }>('/governorates'),
}

// ---------- orders ----------

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
export type ShippingStatus = 'PREPARING' | 'SHIPPED' | 'DELIVERED'

export interface OrderItem {
  id: string
  itemType: CartItemType
  itemId: string
  titleAr: string
  titleEn: string
  quantity: number
  unitPrice: number
  discountPrice: number | null
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  currency: Currency
  subtotal: number
  discountAmount: number
  shippingCost: number
  totalAmount: number
  hasPhysicalItems: boolean
  notes?: string | null
  paidAt?: string | null
  shippingStatus?: ShippingStatus | null
  trackingNumber?: string | null
  shippingCarrier?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  createdAt: string
  shippingAddress: Address | null
  items: OrderItem[]
}

export const ordersApi = {
  create: (input: { shippingAddressId?: string; notes?: string; currency?: Currency }) =>
    api.post<{ order: Order }>('/orders', input),
  get: (id: string) => api.get<{ order: Order }>(`/orders/${id}`),
  list: (query: { page?: number; limit?: number } = {}) =>
    api.get<{ items: Order[]; pagination: import('@/types/api').Pagination }>('/orders', { params: query }),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
  /** Re-prices a pending order: EGP for Paymob (cards, Apple Pay, wallets), USD for PayPal. */
  setCurrency: (id: string, currency: Currency) =>
    api.patch<{ order: Order }>(`/orders/${id}/currency`, { currency }),
}

// ---------- coupons ----------

export interface CouponResult {
  couponDiscountAmount: number
  totalAfterDiscount: number
  coupon: { code: string; type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number }
  order?: { id: string; discountAmount: number; totalAmount: number }
}

export const couponsApi = {
  apply: (orderId: string, code: string) => api.post<CouponResult>('/coupons/apply', { orderId, code }),
  remove: (orderId: string) => api.delete(`/coupons/remove/${orderId}`),
}

// ---------- payments ----------

export type PaymobChannel = 'CARD' | 'WALLET' | 'APPLE_PAY'

export interface Payment {
  id: string
  orderId: string
  provider: 'PAYMOB' | 'PAYPAL' | 'FAWRY'
  status: PaymentStatus
  amount: number
  currency: string
  failureReason?: string | null
}

export const paymentsApi = {
  paymob: (orderId: string, channel: PaymobChannel) =>
    api.post<{ payment: Payment; checkoutUrl: string }>('/payments/paymob/create', { orderId, channel }),
  paymobReturn: (query: Record<string, string>) =>
    api.post<{ payment: Payment; orderId: string }>('/payments/paymob/return', query),
  paymobStatus: (orderId: string) => api.get<{ payment: Payment }>(`/payments/paymob/status/${orderId}`),
  paypal: (orderId: string) =>
    api.post<{ payment: Payment; approvalUrl: string }>('/payments/paypal/create', { orderId }),
  paypalStatus: (orderId: string) => api.get<{ payment: Payment }>(`/payments/paypal/status/${orderId}`),
  /** Which providers have their keys set on the server. */
  methods: () =>
    api.get<{ paypal: boolean; paymob: boolean; paymobChannels?: Partial<Record<PaymobChannel, boolean>> }>(
      '/payments/methods',
    ),
}
