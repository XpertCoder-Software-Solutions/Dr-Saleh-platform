import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/api/client'
import { couponsApi, ordersApi, paymentsApi, type Order, type PaymobChannel } from '@/api/shop'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { CheckoutSteps } from '@/components/shop/CheckoutSteps'
import { formatAddress } from '@/lib/address'
import { PaymentLogos, type LogoName } from '@/components/shop/PaymentLogos'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, inputClass, innerClass, sectionClass } from '@/components/ui/button'
import { Alert, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatEGP } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { NotFoundPage } from '@/pages/NotFoundPage'

type Method = PaymobChannel | 'PAYPAL'

const METHODS: {
  id: Method
  title: string
  note: string
  icon: IconName
  logos: LogoName[]
  currency: 'EGP' | 'USD'
}[] = [
  {
    id: 'APPLE_PAY',
    title: 'Apple Pay',
    note: 'ادفع بلمسة من الآيفون أو الماك، وأكّد بـ Face ID أو Touch ID.',
    icon: 'phone',
    logos: ['applePay'],
    currency: 'EGP',
  },
  {
    id: 'CARD',
    title: 'كارت بنكي',
    note: 'فيزا أو ماستركارد أو ميزة. بيانات الكارت بتتكتب في صفحة الدفع الآمنة.',
    icon: 'card',
    logos: ['visa', 'mastercard', 'meeza', 'amex'],
    currency: 'EGP',
  },
  {
    id: 'WALLET',
    title: 'محفظة إلكترونية',
    note: 'فودافون كاش أو اتصالات كاش أو أورانج كاش أو WE Pay. هيوصلك كود تأكيد على الموبايل.',
    icon: 'wallet',
    logos: ['vodafone', 'etisalat', 'orange', 'we'],
    currency: 'EGP',
  },
  {
    id: 'PAYPAL',
    title: 'PayPal',
    note: 'هتتحوّل لـ PayPal تأكد الدفع وترجع هنا تلقائيًا.',
    icon: 'globe',
    logos: ['paypal'],
    currency: 'USD',
  },
]

const card = 'rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-4'

/** Step 2b: pay for an existing pending order (coupon + payment method). */
export function PayPage() {
  const { orderId = '' } = useParams()
  usePageTitle('الدفع')
  const order = useQuery({
    queryKey: ['me', 'orders', orderId],
    queryFn: () => ordersApi.get(orderId),
    select: (d) => d.order,
  })

  if (order.error instanceof ApiClientError && order.error.statusCode === 404) return <NotFoundPage />
  if (order.data && order.data.paymentStatus === 'PAID') {
    return <Navigate to={`${routes.checkoutResult}?orderId=${orderId}`} replace />
  }

  return (
    <>
      <PageHero
        portrait={false}
        crumbs={[
          { label: 'الرئيسية', to: routes.home },
          { label: 'السلة', to: routes.cart },
          { label: 'الدفع' },
        ]}
        title={
          <>
            اختار <span className="text-sheen">طريقة الدفع</span>
          </>
        }
        body="طلبك محفوظ. اختار الطريقة اللي تريحك، والدورات والنسخ الرقمية بتتفتح فور تأكيد الدفع."
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-white px-6 py-4 shadow-[0_30px_60px_-30px_rgba(5,20,40,.6)]">
          <b className="font-head text-2xl text-ink">
            طلب رقم <span dir="ltr">#{order.data?.orderNumber ?? '…'}</span>
          </b>
          <CheckoutSteps current={2} />
        </div>
      </PageHero>
      <section className={cn(sectionClass, 'pt-8')}>
        <div className={innerClass}>
          {order.isError ? (
            <ErrorState onRetry={() => order.refetch()} />
          ) : !order.data ? (
            <div className={cn(card, 'flex justify-center py-16 text-blue-600')}>
              <Spinner />
            </div>
          ) : order.data.status !== 'PENDING' ? (
            <Alert tone="error">
              الطلب ده مبقاش متاح للدفع ({order.data.status === 'CANCELLED' ? 'اتلغى' : 'اتقفل'}).
            </Alert>
          ) : (
            <Pay order={order.data} />
          )}
        </div>
      </section>
    </>
  )
}

function Pay({ order }: { order: Order }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const usd = order.currency === 'USD'
  const methods = METHODS.filter((m) => m.currency === order.currency)
  const [method, setMethod] = useState<Method>(methods[0].id)
  const [code, setCode] = useState('')
  const money = (n: number) => (usd ? `$${n}` : formatEGP(n))
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['me', 'orders', order.id] })

  const coupon = useMutation({
    mutationFn: () => couponsApi.apply(order.id, code.trim().toUpperCase()),
    onSuccess: () => {
      removeCoupon.reset()
      refresh()
    },
  })
  const removeCoupon = useMutation({
    mutationFn: () => couponsApi.remove(order.id),
    onSuccess: () => {
      coupon.reset()
      setCode('')
      refresh()
    },
  })
  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(order.id),
    onSuccess: () => navigate(routes.cart, { replace: true }),
  })
  const pay = useMutation({
    mutationFn: async () => {
      if (method === 'PAYPAL') return (await paymentsApi.paypal(order.id)).approvalUrl
      return (await paymentsApi.paymob(order.id, method)).checkoutUrl
    },
    onSuccess: (url) => {
      // Leave the site for the provider's secure page; it sends the buyer back to /checkout/result.
      window.location.assign(url)
    },
  })

  function applyCoupon(e: FormEvent) {
    e.preventDefault()
    if (code.trim()) coupon.mutate()
  }

  const chosen = METHODS.find((m) => m.id === method)!
  // The order response has no coupon id, so this tracks the coupon applied in this visit.
  const hasCoupon = coupon.isSuccess && !removeCoupon.isSuccess

  return (
    <div className="grid grid-cols-[1fr_340px] items-start gap-6 max-lg:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-5">
        <div className={card}>
          <h2 className="mb-4 text-2xl">طريقة الدفع</h2>
          <div
            className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"
            role="radiogroup"
            aria-label="طريقة الدفع"
          >
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                onClick={() => setMethod(m.id)}
                className="flex items-center gap-3 rounded-tile border-2 border-line bg-white p-4 text-start transition-colors hover:border-blue-300 aria-checked:border-blue-400 aria-checked:bg-surface-blue"
              >
                <span
                  className={cn(
                    'flex size-11 flex-none items-center justify-center rounded-xl',
                    m.id === 'APPLE_PAY' ? 'bg-black text-white' : 'bg-navy text-white',
                  )}
                >
                  <Icon name={m.icon} size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <b className="text-ink">{m.title}</b>
                  <PaymentLogos names={m.logos} />
                </span>
                <span
                  className={cn(
                    'flex size-5 flex-none items-center justify-center rounded-full border-2',
                    method === m.id ? 'border-blue-600' : 'border-line-2',
                  )}
                >
                  {method === m.id && <span className="size-2.5 rounded-full bg-blue-600" />}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-tile bg-surface p-4 text-sm leading-relaxed text-text-2">
            {chosen.note}
          </p>
        </div>

        <div className={card}>
          <h2 className="mb-1 text-2xl">محتوى الطلب</h2>
          <ul>
            {order.items.map((it) => (
              <li
                key={it.id}
                className="flex justify-between gap-3 border-t border-divider py-3 text-[15px] first:border-t-0"
              >
                <span className="text-ink">
                  {it.titleAr}
                  {it.quantity > 1 && <span className="text-muted"> × {it.quantity}</span>}
                </span>
                <b className="text-ink">{money(it.totalPrice)}</b>
              </li>
            ))}
          </ul>
          {order.shippingAddress && (
            <p className="mt-2 flex items-start gap-2 rounded-tile bg-surface p-3 text-sm text-text-2">
              <Icon name="mapPin" size={16} className="mt-0.5 flex-none text-blue-600" />
              هيوصل على: {formatAddress(order.shippingAddress)}
            </p>
          )}
        </div>
      </div>

      <aside className={cn(card, 'sticky top-27 flex flex-col gap-3 max-lg:static')}>
        <h2 className="text-xl">ملخص الطلب</h2>
        {hasCoupon ? (
          <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5 text-sm">
            <span className="font-bold text-green-800">
              <Icon name="check" size={14} className="inline" /> اتطبق كوبون الخصم
            </span>
            <button
              type="button"
              className="border-0 bg-transparent font-bold text-danger"
              onClick={() => removeCoupon.mutate()}
              disabled={removeCoupon.isPending}
            >
              شيله
            </button>
          </div>
        ) : (
          <form onSubmit={applyCoupon} className="flex flex-col gap-2">
            <label className="text-sm font-bold text-ink" htmlFor="coupon">
              كود الخصم
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                dir="ltr"
                className={cn(inputClass, 'min-h-11 text-right uppercase')}
                placeholder="WELCOME10"
              />
              <button
                type="submit"
                className={buttonClass({ variant: 'outline', size: 'sm' })}
                disabled={coupon.isPending || !code.trim()}
              >
                {coupon.isPending ? <Spinner /> : 'تطبيق'}
              </button>
            </div>
            {coupon.isError && <span className="text-sm text-danger">{couponError(coupon.error)}</span>}
          </form>
        )}
        <div className="flex justify-between text-[15px]">
          <span className="text-muted">المجموع الفرعي</span>
          <b className="text-ink">{money(order.subtotal)}</b>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-[15px]">
            <span className="text-muted">الخصم</span>
            <b className="text-success">− {money(order.discountAmount)}</b>
          </div>
        )}
        {order.hasPhysicalItems && (
          <div className="flex justify-between text-[15px]">
            <span className="text-muted">الشحن</span>
            <b className="text-ink">{money(order.shippingCost)}</b>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-divider pt-3">
          <b className="text-ink">الإجمالي</b>
          <b className="font-head text-[28px] text-ink">{money(order.totalAmount)}</b>
        </div>
        {pay.isError && <Alert tone="error">{payError(pay.error)}</Alert>}
        <button
          type="button"
          className={buttonClass({
            variant: method === 'APPLE_PAY' ? 'black' : 'gold',
            size: 'lg',
            block: true,
          })}
          disabled={pay.isPending || pay.isSuccess}
          onClick={() => pay.mutate()}
        >
          {pay.isPending || pay.isSuccess ? (
            <Spinner label="بنحوّلك لصفحة الدفع" />
          ) : (
            `ادفع ${money(order.totalAmount)} بـ ${chosen.title}`
          )}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <Icon name="lock" size={13} /> دفع آمن ومشفّر، بيانات الكارت مش بتتحفظ عندنا
        </p>
        <button
          type="button"
          className="mt-1 border-0 bg-transparent text-sm text-muted underline disabled:opacity-50"
          disabled={cancel.isPending}
          onClick={() => cancel.mutate()}
        >
          إلغاء الطلب والرجوع للسلة
        </button>
        <Link to={routes.orders} className="text-center text-sm">
          ادفع بعدين من «طلباتي»
        </Link>
      </aside>
    </div>
  )
}

function couponError(e: unknown) {
  if (e instanceof ApiClientError) {
    if (e.statusCode === 404) return 'الكود ده مش موجود.'
    if (/expired|not active|inactive|usage limit|minimum/i.test(e.rawMessage)) return 'الكود ده مش صالح للطلب ده.'
  }
  return e instanceof Error ? e.message : 'مقدرناش نطبّق الكود.'
}

function payError(e: unknown) {
  if (e instanceof ApiClientError && e.statusCode === 503)
    return 'طريقة الدفع دي مش متاحة دلوقتي. جرّب طريقة تانية.'
  return e instanceof Error ? e.message : 'حصلت مشكلة، حاول تاني.'
}
