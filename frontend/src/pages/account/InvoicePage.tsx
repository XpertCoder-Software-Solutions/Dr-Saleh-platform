import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminOrdersApi } from '@/api/admin'
import { ordersApi, type Order } from '@/api/shop'
import { routes } from '@/app/routes'
import { useAuth } from '@/auth/hooks'
import { CONTACT } from '@/content/contact'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, Spinner } from '@/components/ui/States'
import { formatAddress } from '@/lib/address'
import { formatDate, formatEGP } from '@/lib/format'
import { orderStatus } from '@/lib/order-status'
import { usePageTitle } from '@/lib/usePageTitle'
import { loc, tx } from '@/lib/i18n'

type InvoiceOrder = Order & { user?: { fullName: string; email: string; phoneNumber: string } | null }

/** A4 invoice for one order; "Save as PDF" in the print dialog makes the file. */
export function InvoicePage() {
  const { orderId = '' } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const order = useQuery({
    queryKey: [isAdmin ? 'admin' : 'me', 'invoice', orderId],
    queryFn: async (): Promise<InvoiceOrder> =>
      isAdmin ? (await adminOrdersApi.get(orderId)).order : (await ordersApi.get(orderId)).order,
  })
  const o = order.data
  usePageTitle(o ? `${tx('فاتورة', 'Invoice')} ${o.orderNumber}` : tx('فاتورة', 'Invoice'))
  const money = (v: number) => (o?.currency === 'USD' ? `$${v.toFixed(2)}` : formatEGP(v))
  const customer = o?.user ?? (user ? { fullName: user.fullName, email: user.email, phoneNumber: '' } : null)

  return (
    <div className="min-h-dvh bg-surface print:bg-white">
      <style>{'@page { size: A4; margin: 12mm }'}</style>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3 print:hidden">
        <Link
          to={isAdmin ? routes.adminOrders : routes.orders}
          className={buttonClass({ variant: 'outline', size: 'sm' })}
        >
          <Icon name="chevRight" size={15} /> {isAdmin ? tx('الطلبات', 'Orders') : tx('طلباتي', 'My orders')}
        </Link>
        <span className="text-sm text-muted max-sm:hidden">
          {tx('من نافذة الطباعة اختار «حفظ كـ PDF»', 'In the print dialog, choose “Save as PDF”')}
        </span>
        <button
          type="button"
          className={buttonClass({ variant: 'gold', size: 'sm' })}
          disabled={!o}
          onClick={() => window.print()}
        >
          <Icon name="download" size={15} /> {tx('طباعة / حفظ PDF', 'Print / save PDF')}
        </button>
      </div>
      <main className="mx-auto max-w-[820px] p-8 max-sm:p-3 print:max-w-none print:p-0">
        {order.isLoading ? (
          <div className="flex justify-center py-32 text-blue-600">
            <Spinner />
          </div>
        ) : !o ? (
          <div className="mx-auto max-w-lg rounded-card bg-white p-8">
            <EmptyState icon="receipt" title={tx('الطلب ده مش موجود', "This order doesn't exist")} />
          </div>
        ) : (
          <article className="rounded-card bg-white p-10 shadow-card max-sm:p-5 print:rounded-none print:p-0 print:shadow-none">
            <header className="flex items-start justify-between gap-6 border-b-2 border-navy pb-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl text-ink">{tx('فاتورة', 'Invoice')}</h1>
                <span className="text-sm text-muted">
                  {tx('رقم', 'No.')}{' '}
                  <b dir="ltr" className="text-ink">
                    {o.orderNumber}
                  </b>
                </span>
                <span className="text-sm text-muted">
                  {tx('التاريخ:', 'Date:')} {formatDate(o.createdAt)}
                </span>
                {o.paidAt && (
                  <span className="text-sm text-muted">
                    {tx('تاريخ الدفع:', 'Paid on:')} {formatDate(o.paidAt)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 text-end">
                <img
                  src="/assets/brand/logo-blue.webp"
                  alt={tx('منصة د. صالح عبد الكريم', 'Dr. Saleh Abdelkarim Platform')}
                  className="h-14 w-auto"
                />
                <span className="text-xs text-muted">
                  {tx('منصة د. صالح عبد الكريم للتربية', "Dr. Saleh Abdelkarim's parenting platform")}
                </span>
                <span className="text-xs text-muted" dir="ltr">
                  {CONTACT.phonesEgypt.map((p) => p.label).join(' · ')}
                </span>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-6 py-6 text-sm max-sm:grid-cols-1">
              <div>
                <h2 className="mb-1.5 text-sm text-muted">{tx('العميل', 'Customer')}</h2>
                <b className="block text-ink">{customer?.fullName}</b>
                {customer?.email && (
                  <span className="block text-text-2" dir="ltr">
                    {customer.email}
                  </span>
                )}
                {customer?.phoneNumber && (
                  <span className="block text-text-2" dir="ltr">
                    {customer.phoneNumber}
                  </span>
                )}
              </div>
              {o.shippingAddress && (
                <div>
                  <h2 className="mb-1.5 text-sm text-muted">{tx('عنوان الشحن', 'Shipping address')}</h2>
                  <span className="block text-text-2">{formatAddress(o.shippingAddress)}</span>
                  <span className="block text-text-2" dir="ltr">
                    {o.shippingAddress.phoneNumber}
                  </span>
                </div>
              )}
            </section>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-start text-muted">
                  <th className="px-3 py-2.5 font-bold">{tx('البند', 'Item')}</th>
                  <th className="px-3 py-2.5 text-center font-bold">{tx('الكمية', 'Qty')}</th>
                  <th className="px-3 py-2.5 font-bold whitespace-nowrap">
                    {tx('سعر الوحدة', 'Unit price')}
                  </th>
                  <th className="px-3 py-2.5 text-end font-bold">{tx('الإجمالي', 'Total')}</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id} className="border-b border-divider">
                    <td className="px-3 py-3 text-ink">{loc(i.titleAr, i.titleEn)}</td>
                    <td className="px-3 py-3 text-center">{i.quantity}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{money(i.discountPrice ?? i.unitPrice)}</td>
                    <td className="px-3 py-3 text-end font-bold whitespace-nowrap text-ink">
                      {money(i.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="ms-auto mt-5 flex w-72 flex-col gap-2 text-sm max-sm:w-full">
              <div className="flex justify-between">
                <span className="text-muted">{tx('المجموع', 'Subtotal')}</span>
                <b className="text-ink">{money(o.subtotal)}</b>
              </div>
              {o.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">{tx('الخصم', 'Discount')}</span>
                  <b className="text-success">− {money(o.discountAmount)}</b>
                </div>
              )}
              {o.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">{tx('الشحن', 'Shipping')}</span>
                  <b className="text-ink">{money(o.shippingCost)}</b>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t-2 border-navy pt-2">
                <b className="text-ink">{tx('الإجمالي', 'Total')}</b>
                <b className="font-head text-2xl text-ink">{money(o.totalAmount)}</b>
              </div>
              <span className="text-end text-xs text-muted">
                {tx('الحالة:', 'Status:')} {orderStatus(o).label}
              </span>
            </section>

            <footer className="mt-10 border-t border-divider pt-4 text-center text-xs text-muted">
              {tx(
                'شكرًا لثقتك في منصة د. صالح عبد الكريم.',
                'Thank you for trusting Dr. Saleh Abdelkarim Platform.',
              )}
            </footer>
          </article>
        )}
      </main>
    </div>
  )
}
