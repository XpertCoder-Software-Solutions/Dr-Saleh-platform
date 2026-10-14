import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi, paymentsApi, type Order } from '@/api/shop'
import { useAuth } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { CONTACT } from '@/content/contact'
import { HeroWave } from '@/components/layout/PageHero'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatDate, formatEGP } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'

/**
 * Where Paymob and PayPal send the buyer back. The backend checks the result
 * with the provider (signed redirect / PayPal capture); this page then shows
 * the order as the backend sees it, never the raw query string.
 */
export function ResultPage() {
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const [orderId, setOrderId] = useState(params.get('orderId') ?? '')
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const query = Object.fromEntries(params.entries())

    async function confirm() {
      try {
        if (query.hmac) {
          // Paymob redirect: forward the signed params.
          const res = await paymentsApi.paymobReturn(query)
          setOrderId(res.orderId)
        } else if (query.provider === 'paypal' && query.orderId) {
          // PayPal: asking for the status also captures an approved order.
          await paymentsApi.paypalStatus(query.orderId)
        }
      } catch (e) {
        setConfirmError(e instanceof Error ? e.message : 'تعذّر التحقق من الدفع.')
      } finally {
        queryClient.invalidateQueries({ queryKey: ['me'] })
      }
    }
    void confirm()
  }, [params, queryClient])

  const order = useQuery({
    queryKey: ['me', 'orders', orderId, 'result'],
    queryFn: () => ordersApi.get(orderId),
    select: (d) => d.order,
    enabled: Boolean(orderId),
    // The webhook may land a moment after the redirect; poll briefly while pending.
    refetchInterval: (q) => (q.state.data?.order.paymentStatus === 'PENDING' ? 2500 : false),
  })

  const paid = order.data?.paymentStatus === 'PAID'
  const failed = order.data && ['FAILED', 'CANCELLED'].includes(order.data.paymentStatus)
  const pendingTooLong = useTimeout(order.data?.paymentStatus === 'PENDING', 20_000)
  usePageTitle(paid ? 'تم الطلب بنجاح' : failed ? 'الدفع مكملش' : 'جاري تأكيد الدفع')

  if (!orderId && !confirmError) {
    return <Shell tone="wait" title="جاري تأكيد الدفع…" />
  }
  if (order.isError || (confirmError && !order.data)) {
    return (
      <Shell tone="fail" title="مقدرناش نتأكد من الدفع">
        <div className="mx-auto max-w-140">
          <ErrorState message={confirmError ?? undefined} onRetry={() => order.refetch()} />
        </div>
      </Shell>
    )
  }
  if (!order.data || (order.data.paymentStatus === 'PENDING' && !pendingTooLong)) {
    return <Shell tone="wait" title="جاري تأكيد الدفع…" body="ثواني بنتأكد من البنك. متقفلش الصفحة." />
  }
  if (paid) return <Success order={order.data} />
  return <Failed order={order.data} stillPending={order.data.paymentStatus === 'PENDING'} />
}

function useTimeout(active: boolean, ms: number) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!active) return
    const id = setTimeout(() => setDone(true), ms)
    return () => clearTimeout(id)
  }, [active, ms])
  return done
}

function Shell({
  tone,
  title,
  body,
  meta,
  children,
}: {
  tone: 'ok' | 'fail' | 'wait'
  title: string
  body?: string
  meta?: string
  children?: ReactNode
}) {
  const icon: IconName = tone === 'ok' ? 'check' : tone === 'fail' ? 'close' : 'clock'
  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden px-6 pt-34 pb-40 text-center text-white max-sm:px-4',
          tone === 'fail' ? 'bg-linear-135 from-[#3b1d12] via-[#8a3b12] to-[#e07a3a]' : 'bg-navy',
        )}
      >
        <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-160 flex-col items-center gap-5">
          <span className="flex size-36 items-center justify-center rounded-full bg-white/15 p-4">
            <span
              className={cn(
                'flex size-full animate-pop items-center justify-center rounded-full bg-white',
                tone === 'ok' ? 'text-success' : tone === 'fail' ? 'text-danger' : 'text-blue-600',
              )}
            >
              {tone === 'wait' ? <Spinner /> : <Icon name={icon} size={46} strokeWidth={2.6} />}
            </span>
          </span>
          <h1 className="text-[clamp(32px,5vw,52px)] text-white">{title}</h1>
          {body && <p className="text-lg leading-loose text-on-dark">{body}</p>}
          {meta && <span className="rounded-full px-4 py-1.5 text-sm font-bold glass">{meta}</span>}
        </div>
        <HeroWave />
      </section>
      {children && <section className={cn(sectionClass, 'relative z-2 -mt-24')}>{children}</section>}
    </>
  )
}

const card = 'rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)]'

function Success({ order }: { order: Order }) {
  const { user } = useAuth()
  const money = (n: number) => (order.currency === 'USD' ? `$${n}` : formatEGP(n))
  const digital = order.items.filter((i) => i.itemType === 'COURSE' || i.itemType === 'BOOK')
  return (
    <Shell
      tone="ok"
      title="تم الطلب بنجاح"
      body={`شكرًا${user ? ` يا ${user.firstName}` : ''}! وصلك إيميل فيه تفاصيل الطلب.${digital.length ? ' الدورات والنسخ الرقمية اتفتحت في حسابك دلوقتي.' : ''}`}
      meta={`رقم الطلب: #${order.orderNumber} · ${formatDate(order.paidAt ?? order.createdAt)}`}
    >
      <div className={cn(innerClass, 'grid grid-cols-[1fr_340px] items-start gap-6 max-lg:grid-cols-1')}>
        <div className="flex flex-col gap-5">
          {digital.length > 0 && (
            <div className={card}>
              <h2 className="text-2xl">جاهز دلوقتي</h2>
              <p className="mb-4 text-sm text-muted">اتفتح في حسابك</p>
              <div className="flex flex-col gap-3">
                {digital.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-4 rounded-tile bg-surface-blue p-4 max-sm:flex-wrap"
                  >
                    <span className="flex size-12 bg-navy items-center justify-center rounded-xl text-white">
                      <Icon name={it.itemType === 'COURSE' ? 'video' : 'book'} />
                    </span>
                    <b className="flex-1 text-ink">{it.titleAr}</b>
                    <Link
                      to={it.itemType === 'COURSE' ? routes.myCourses : routes.myBooks}
                      className={buttonClass({ variant: 'gold', size: 'sm' })}
                    >
                      {it.itemType === 'COURSE' ? 'ابدأ أول درس' : 'افتح الكتاب'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {order.hasPhysicalItems && (
            <div className={card}>
              <h2 className="text-2xl">في الطريق ليك</h2>
              <p className="mb-4 text-sm text-muted">الكتب والمنتجات الورقية</p>
              <ol className="grid grid-cols-4 gap-2 text-center text-sm">
                {['اتأكد', 'بيتجهّز', 'اتشحن', 'وصل'].map((s, i) => (
                  <li key={s} className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        'flex size-11 items-center justify-center rounded-full',
                        i === 0 ? 'bg-success text-white' : 'bg-surface text-muted',
                      )}
                    >
                      <Icon
                        name={i === 0 ? 'check' : i === 3 ? 'home' : i === 2 ? 'truck' : 'box'}
                        size={18}
                      />
                    </span>
                    <b className={i === 0 ? 'text-ink' : 'text-muted'}>{s}</b>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-muted">
                هيوصلك خلال 2 لـ 4 أيام عمل، وهنبعتلك رقم التتبّع على واتساب.
              </p>
            </div>
          )}
        </div>
        <aside className={cn(card, 'flex flex-col gap-2.5')}>
          <h2 className="text-xl">الإيصال</h2>
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between gap-3 text-sm">
              <span className="text-text-2">
                {it.titleAr}
                {it.quantity > 1 && ` × ${it.quantity}`}
              </span>
              <b className="text-ink">{money(it.totalPrice)}</b>
            </div>
          ))}
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-2">الخصم</span>
              <b className="text-success">− {money(order.discountAmount)}</b>
            </div>
          )}
          {order.hasPhysicalItems && (
            <div className="flex justify-between text-sm">
              <span className="text-text-2">الشحن</span>
              <b className="text-ink">{money(order.shippingCost)}</b>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-divider pt-3">
            <b>المدفوع</b>
            <b className="font-head text-2xl text-ink">{money(order.totalAmount)}</b>
          </div>
          <Link
            to={routes.dashboard}
            className={buttonClass({ variant: 'navy', block: true, className: 'mt-2' })}
          >
            <Icon name="grid" size={18} /> روح لحسابك
          </Link>
        </aside>
      </div>
    </Shell>
  )
}

function Failed({ order, stillPending }: { order: Order; stillPending: boolean }) {
  const reasons: [IconName, string, string][] = [
    ['card', 'رصيد الكارت أو حدّ الشراء أونلاين', 'اتأكد إن الكارت مفعّل للشراء أونلاين وفيه رصيد كفاية.'],
    ['lock', 'كود التحقق (OTP) ماتكتبش', 'لو الصفحة اتقفلت قبل ما تكتب الكود، جرّب تاني.'],
    ['globe', 'النت فصل أثناء الدفع', 'اتأكد من الاتصال وجرّب مرة كمان.'],
  ]
  return (
    <Shell
      tone="fail"
      title={stillPending ? 'الدفع لسه متأكدش' : 'الدفع مكملش'}
      body={
        stillPending
          ? 'لو اتخصم منك مبلغ، الطلب هيتأكد أول ما يوصلنا تأكيد البنك وهيوصلك إيميل.'
          : 'ما تقلقش، طلبك لسه محفوظ. لو اتخصم منك أي مبلغ هيرجع لحسابك تلقائيًا حسب بنكك.'
      }
      meta={`رقم الطلب: #${order.orderNumber} · ${formatDate(order.createdAt)}`}
    >
      <div
        className={cn(
          innerClass,
          'grid max-w-250 grid-cols-[1fr_300px] items-start gap-6 max-lg:grid-cols-1',
        )}
      >
        <div className={card}>
          <h2 className="text-2xl">إيه اللي ممكن يكون حصل؟</h2>
          <p className="mb-2 text-sm text-muted">أشهر الأسباب وحلها</p>
          {reasons.map(([icon, t, d]) => (
            <div key={t} className="flex gap-3 border-t border-divider py-3.5">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-red-50 text-danger">
                <Icon name={icon} size={18} />
              </span>
              <span className="flex flex-col">
                <b className="text-ink">{t}</b>
                <span className="text-sm text-muted">{d}</span>
              </span>
            </div>
          ))}
          {order.status === 'PENDING' && (
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to={routes.checkoutPay(order.id)} className={buttonClass({ variant: 'gold' })}>
                <Icon name="refresh" size={18} /> جرّب الدفع تاني
              </Link>
              <Link to={routes.checkoutPay(order.id)} className={buttonClass({ variant: 'outline' })}>
                <Icon name="card" size={18} /> اختار طريقة دفع تانية
              </Link>
            </div>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <div className={card}>
            <b className="font-head text-lg text-ink">طلبك محفوظ</b>
            <p className="mb-3 text-sm text-muted">
              {order.items.length} عناصر ·{' '}
              {order.currency === 'USD' ? `$${order.totalAmount}` : formatEGP(order.totalAmount)}
            </p>
            <Link to={routes.orders} className={buttonClass({ variant: 'navy', block: true })}>
              طلباتي
            </Link>
          </div>
          <div className="rounded-card border border-green-200 bg-green-50 p-5">
            <b className="text-ink">لسه المشكلة موجودة؟</b>
            <p className="mb-3 text-sm text-text-2">ابعتلنا رقم الطلب على واتساب وهنساعدك تكمّل.</p>
            <a
              href={CONTACT.whatsapp.href}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ variant: 'whatsapp', size: 'sm' })}
            >
              <Icon name="whatsapp" size={16} /> كلّمنا على واتساب
            </a>
          </div>
        </aside>
      </div>
    </Shell>
  )
}
