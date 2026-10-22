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
import { useRegion } from '@/lib/region'
import { usePageTitle } from '@/lib/usePageTitle'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { confirmAction } from '@/lib/confirm'
import { loc, tx } from '@/lib/i18n'

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
    note: tx(
      'ادفع بلمسة من الآيفون أو الماك، وأكّد بـ Face ID أو Touch ID.',
      'Pay with a tap on iPhone or Mac and confirm with Face ID or Touch ID.',
    ),
    icon: 'phone',
    logos: ['applePay'],
    currency: 'EGP',
  },
  {
    id: 'CARD',
    title: tx('كارت بنكي', 'Bank card'),
    note: tx(
      'فيزا أو ماستركارد أو ميزة. بيانات الكارت بتتكتب في صفحة الدفع الآمنة.',
      'Visa, Mastercard or Meeza. Card details are entered on the secure payment page.',
    ),
    icon: 'card',
    logos: ['visa', 'mastercard', 'meeza', 'amex'],
    currency: 'EGP',
  },
  {
    id: 'WALLET',
    title: tx('محفظة إلكترونية', 'Mobile wallet'),
    note: tx(
      'فودافون كاش أو اتصالات كاش أو أورانج كاش أو WE Pay. هيوصلك كود تأكيد على الموبايل.',
      "Vodafone Cash, Etisalat Cash, Orange Cash or WE Pay. You'll get a confirmation code on your phone.",
    ),
    icon: 'wallet',
    logos: ['vodafone', 'etisalat', 'orange', 'we'],
    currency: 'EGP',
  },
  {
    id: 'PAYPAL',
    title: 'PayPal',
    note: tx(
      'هتتحوّل لـ PayPal تأكد الدفع وترجع هنا تلقائيًا.',
      "You'll go to PayPal to confirm, then come back here automatically.",
    ),
    icon: 'globe',
    logos: ['paypal'],
    currency: 'USD',
  },
]

const card = 'rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-4'

/** Step 2b: pay for an existing pending order (coupon + payment method). */
export function PayPage() {
  const { orderId = '' } = useParams()
  usePageTitle(tx('الدفع', 'Payment'))
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
          { label: tx('الرئيسية', 'Home'), to: routes.home },
          { label: tx('السلة', 'Cart'), to: routes.cart },
          { label: tx('الدفع', 'Payment') },
        ]}
        title={
          <>
            {tx('اختار', 'Choose a')}{' '}
            <span className="text-sheen">{tx('طريقة الدفع', 'payment method')}</span>
          </>
        }
        body={tx(
          'طلبك محفوظ. اختار الطريقة اللي تريحك، والدورات والنسخ الرقمية بتتفتح فور تأكيد الدفع.',
          'Your order is saved. Choose how you’d like to pay — courses and digital editions open as soon as payment is confirmed.',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-white px-6 py-4 shadow-[0_30px_60px_-30px_rgba(5,20,40,.6)]">
          <b className="font-head text-2xl text-ink">
            {tx('طلب رقم', 'Order')} <span dir="ltr">#{order.data?.orderNumber ?? '…'}</span>
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
              {tx('الطلب ده مبقاش متاح للدفع', 'This order can no longer be paid')} (
              {order.data.status === 'CANCELLED' ? tx('اتلغى', 'cancelled') : tx('اتقفل', 'closed')}).
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
  const region = useRegion()
  // Egyptian mobile wallets are only offered in Egypt; physical orders ship in Egypt and are
  // paid in EGP, so PayPal (USD) is left out for them.
  const methods = METHODS.filter(
    (m) => (m.id !== 'WALLET' || region.isEgypt) && (!order.hasPhysicalItems || m.currency === 'EGP'),
  )
  const [method, setMethod] = useState<Method>(
    (methods.find((m) => m.currency === order.currency) ?? methods[0]).id,
  )
  const [code, setCode] = useState('')
  const money = (n: number) => (usd ? `$${n}` : formatEGP(n))
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['me', 'orders', order.id] })

  // Paymob settles in EGP and PayPal in USD, so picking a method in the other currency
  // re-prices the order (taking an applied coupon off and putting it back on).
  const switchCurrency = useMutation({
    mutationFn: async (next: Method) => {
      const target = METHODS.find((m) => m.id === next)!.currency
      if (target === order.currency) return
      const couponCode = hasCoupon ? code.trim().toUpperCase() : ''
      if (couponCode) await couponsApi.remove(order.id)
      const { order: updated } = await ordersApi.setCurrency(order.id, target)
      queryClient.setQueryData(['me', 'orders', order.id], { order: updated })
      if (couponCode) {
        try {
          await couponsApi.apply(order.id, couponCode)
        } catch {
          removeCoupon.reset()
          coupon.reset()
          setCode('')
        }
      }
      await refresh()
    },
  })

  function chooseMethod(next: Method) {
    const previous = method
    setMethod(next)
    switchCurrency.mutate(next, { onError: () => setMethod(previous) })
  }

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
          <h2 className="mb-4 text-2xl">{tx('طريقة الدفع', 'Payment method')}</h2>
          <div
            className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"
            role="radiogroup"
            aria-label={tx('طريقة الدفع', 'Payment method')}
          >
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                onClick={() => chooseMethod(m.id)}
                disabled={switchCurrency.isPending}
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
          <p
            className="mt-4 rounded-tile bg-surface p-4 text-sm leading-relaxed text-text-2"
            aria-live="polite"
          >
            {switchCurrency.isPending
              ? tx('بنحدّث الأسعار…', 'Updating prices…')
              : chosen.currency === 'USD'
                ? `${chosen.note} ${tx('الدفع بالدولار.', 'Paid in US dollars.')}`
                : region.isEgypt
                  ? chosen.note
                  : `${chosen.note} ${tx('المبلغ بيتخصم بالجنيه المصري.', 'Charged in Egyptian pounds.')}`}
          </p>
          {switchCurrency.isError && <Alert tone="error">{(switchCurrency.error as Error).message}</Alert>}
        </div>

        <div className={card}>
          <h2 className="mb-1 text-2xl">{tx('محتوى الطلب', "What's in your order")}</h2>
          <ul>
            {order.items.map((it) => (
              <li
                key={it.id}
                className="flex justify-between gap-3 border-t border-divider py-3 text-[15px] first:border-t-0"
              >
                <span className="text-ink">
                  {loc(it.titleAr, it.titleEn)}
                  {it.quantity > 1 && <span className="text-muted"> × {it.quantity}</span>}
                </span>
                <b className="text-ink">{money(it.totalPrice)}</b>
              </li>
            ))}
          </ul>
          {order.shippingAddress && (
            <p className="mt-2 flex items-start gap-2 rounded-tile bg-surface p-3 text-sm text-text-2">
              <Icon name="mapPin" size={16} className="mt-0.5 flex-none text-blue-600" />
              {tx('هيوصل على:', 'Delivering to:')} {formatAddress(order.shippingAddress)}
            </p>
          )}
        </div>
      </div>

      <aside className={cn(card, 'sticky top-27 flex flex-col gap-3 max-lg:static')}>
        <h2 className="text-xl">{tx('ملخص الطلب', 'Order summary')}</h2>
        {hasCoupon ? (
          <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5 text-sm">
            <span className="font-bold text-green-800">
              <Icon name="check" size={14} className="inline" /> {tx('اتطبق كوبون الخصم', 'Coupon applied')}
            </span>
            <button
              type="button"
              className="border-0 bg-transparent font-bold text-danger"
              onClick={() => removeCoupon.mutate()}
              disabled={removeCoupon.isPending}
            >
              {tx('شيله', 'Remove')}
            </button>
          </div>
        ) : (
          <form onSubmit={applyCoupon} className="flex flex-col gap-2">
            <label className="text-sm font-bold text-ink" htmlFor="coupon">
              {tx('كود الخصم', 'Coupon code')}
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                dir="ltr"
                className={cn(inputClass, 'min-h-11 text-start uppercase')}
                placeholder="WELCOME10"
              />
              <button
                type="submit"
                className={buttonClass({ variant: 'outline', size: 'sm' })}
                disabled={coupon.isPending || !code.trim()}
              >
                {coupon.isPending ? <Spinner /> : tx('تطبيق', 'Apply')}
              </button>
            </div>
            {coupon.isError && <span className="text-sm text-danger">{couponError(coupon.error)}</span>}
          </form>
        )}
        <div className="flex justify-between text-[15px]">
          <span className="text-muted">{tx('المجموع الفرعي', 'Subtotal')}</span>
          <b className="text-ink">{money(order.subtotal)}</b>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-[15px]">
            <span className="text-muted">{tx('الخصم', 'Discount')}</span>
            <b className="text-success">− {money(order.discountAmount)}</b>
          </div>
        )}
        {order.hasPhysicalItems && (
          <div className="flex justify-between text-[15px]">
            <span className="text-muted">{tx('الشحن', 'Shipping')}</span>
            <b className="text-ink">{money(order.shippingCost)}</b>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-divider pt-3">
          <b className="text-ink">{tx('الإجمالي', 'Total')}</b>
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
          disabled={pay.isPending || pay.isSuccess || switchCurrency.isPending}
          onClick={() => pay.mutate()}
        >
          {pay.isPending || pay.isSuccess ? (
            <Spinner label={tx('بنحوّلك لصفحة الدفع', 'Taking you to the payment page')} />
          ) : (
            tx(
              `ادفع ${money(order.totalAmount)} بـ ${chosen.title}`,
              `Pay ${money(order.totalAmount)} with ${chosen.title}`,
            )
          )}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <Icon name="lock" size={13} />{' '}
          {tx(
            'دفع آمن ومشفّر، بيانات الكارت مش بتتحفظ عندنا',
            "Secure, encrypted payment. We don't store card details",
          )}
        </p>
        <button
          type="button"
          className="mt-1 border-0 bg-transparent text-sm text-muted underline disabled:opacity-50"
          disabled={cancel.isPending}
          onClick={async () => {
            if (
              await confirmAction({
                title: tx('تلغي الطلب؟', 'Cancel the order?'),
                body: tx(
                  'الطلب هيتلغي والحاجات هترجع للسلة لو حبيت تطلبها تاني.',
                  'The order will be cancelled; you can add the items to your cart again.',
                ),
                confirmLabel: tx('أيوه، الغيه', 'Yes, cancel it'),
                cancelLabel: tx('لأ، كمّل الدفع', 'No, continue paying'),
              })
            )
              cancel.mutate()
          }}
        >
          {tx('إلغاء الطلب والرجوع للسلة', 'Cancel the order and return to cart')}
        </button>
        <Link to={routes.orders} className="text-center text-sm">
          {tx('ادفع بعدين من «طلباتي»', 'Pay later from “My orders”')}
        </Link>
      </aside>
    </div>
  )
}

function couponError(e: unknown) {
  if (e instanceof ApiClientError) {
    if (e.statusCode === 404) return tx('الكود ده مش موجود.', "That code doesn't exist.")
    if (/expired|not active|inactive|usage limit|minimum/i.test(e.rawMessage))
      return tx('الكود ده مش صالح للطلب ده.', "That code isn't valid for this order.")
  }
  return e instanceof Error ? e.message : tx('مقدرناش نطبّق الكود.', "We couldn't apply the code.")
}

function payError(e: unknown) {
  if (e instanceof ApiClientError && e.statusCode === 503)
    return tx(
      'طريقة الدفع دي مش متاحة دلوقتي. جرّب طريقة تانية.',
      "This payment method isn't available right now. Try another one.",
    )
  return e instanceof Error
    ? e.message
    : tx('حصلت مشكلة، حاول تاني.', 'Something went wrong. Please try again.')
}
