import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addressesApi, cartApi, lineNeedsShipping, ordersApi, type Currency } from '@/api/shop'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { AddressForm } from '@/components/shop/AddressForm'
import { formatAddress } from '@/lib/address'
import { CheckoutSteps } from '@/components/shop/CheckoutSteps'
import { LineThumb } from '@/components/shop/LineThumb'
import { FORMAT_TYPE_LABEL, TYPE_LABEL } from '@/lib/shop-labels'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { TextAreaField } from '@/components/ui/fields'
import { Alert, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatEGP } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'

const card = 'rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-4'

/**
 * Step 2a: shipping address (only when something ships) and order currency.
 * Creating the order empties the cart and reserves stock, so it happens here,
 * once, and the next step pays for that order.
 */
export function CheckoutPage() {
  usePageTitle('إتمام الطلب')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cart = useQuery({ queryKey: ['me', 'cart'], queryFn: () => cartApi.get('EGP') })
  const addresses = useQuery({ queryKey: ['me', 'addresses'], queryFn: addressesApi.list })
  const [addressId, setAddressId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [currency, setCurrency] = useState<Currency>('EGP')
  const [notes, setNotes] = useState('')

  const lines = cart.data?.cart.items ?? []
  const needsShipping = lines.some(lineNeedsShipping)
  const list = (addresses.data?.addresses ?? []).filter((a) => a.isActive)
  const selected = list.find((a) => a.id === (addressId ?? list[0]?.id))
  const shipping = needsShipping ? (selected?.governorate?.shippingCost ?? 0) : 0
  const subtotal = cart.data?.summary.total ?? 0

  // USD prices for the PayPal option (digital-only carts).
  const usd = useQuery({
    queryKey: ['me', 'cart', 'USD'],
    queryFn: () => cartApi.get('USD'),
    enabled: !needsShipping && lines.length > 0,
  })

  const create = useMutation({
    mutationFn: () =>
      ordersApi.create({
        shippingAddressId: needsShipping ? selected?.id : undefined,
        notes: notes.trim() || undefined,
        currency,
      }),
    onSuccess: ({ order }) => {
      queryClient.removeQueries({ queryKey: ['me', 'cart'] })
      queryClient.invalidateQueries({ queryKey: ['me', 'cart-summary'] })
      navigate(routes.checkoutPay(order.id), { replace: true })
    },
  })

  if (cart.isSuccess && lines.length === 0 && !create.isPending && !create.isSuccess) {
    return <Navigate to={routes.cart} replace />
  }

  return (
    <>
      <PageHero
        portrait={false}
        crumbs={[
          { label: 'الرئيسية', to: routes.home },
          { label: 'السلة', to: routes.cart },
          { label: 'إتمام الطلب' },
        ]}
        title={
          <>
            خطوة أخيرة <span className="text-sheen">وتبدأ رحلتك</span>
          </>
        }
        body="ادفع بأمان بـ Apple Pay أو محفظتك الإلكترونية أو كارتك البنكي أو PayPal، والدورات والنسخ الرقمية بتتفتح لك فورًا بعد الدفع."
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-white px-6 py-4 shadow-[0_30px_60px_-30px_rgba(5,20,40,.6)]">
          <b className="font-head text-2xl text-ink">إتمام الطلب</b>
          <CheckoutSteps current={2} />
        </div>
      </PageHero>

      <section className={cn(sectionClass, 'pt-8')}>
        <div className={cn(innerClass, 'grid grid-cols-[1fr_340px] items-start gap-6 max-lg:grid-cols-1')}>
          {cart.isError ? (
            <ErrorState onRetry={() => cart.refetch()} />
          ) : cart.isLoading ? (
            <div className={cn(card, 'flex justify-center py-16 text-blue-600')}>
              <Spinner />
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-5">
              <div className={card}>
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-2xl">السلة ({lines.length})</h2>
                  <Link to={routes.cart} className="font-bold">
                    تعديل
                  </Link>
                </div>
                <ul>
                  {lines.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-3.5 border-t border-divider py-3.5 first:border-t-0"
                    >
                      <LineThumb id={l.itemId} type={l.itemType} image={l.item?.image} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-xs font-bold text-blue-600">
                          {l.itemType === 'BOOK' && l.item?.formatType
                            ? FORMAT_TYPE_LABEL[l.item.formatType]
                            : TYPE_LABEL[l.itemType]}
                        </span>
                        <b className="truncate text-ink">{l.item?.nameAr}</b>
                      </span>
                      {l.quantity > 1 && <span className="text-sm text-muted">× {l.quantity}</span>}
                      <b className="text-ink">{formatEGP(l.lineTotal)}</b>
                    </li>
                  ))}
                </ul>
              </div>

              {needsShipping && (
                <div className={card}>
                  <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="text-2xl">عنوان الشحن</h2>
                    <span className="text-sm text-muted">مطلوب للكتب الورقية والمنتجات</span>
                  </div>
                  {addresses.isLoading ? (
                    <Spinner />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {list.length > 0 && (
                        <div
                          className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"
                          role="radiogroup"
                          aria-label="العنوان"
                        >
                          {list.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              role="radio"
                              aria-checked={selected?.id === a.id}
                              onClick={() => setAddressId(a.id)}
                              className="flex items-start gap-3 rounded-tile border-2 border-line bg-white p-4 text-start aria-checked:border-navy"
                            >
                              <span
                                className={cn(
                                  'mt-1 flex size-4.5 flex-none items-center justify-center rounded-full border-2',
                                  selected?.id === a.id ? 'border-navy' : 'border-line-2',
                                )}
                              >
                                {selected?.id === a.id && <span className="size-2 bg-navy rounded-full" />}
                              </span>
                              <span className="flex flex-col gap-0.5">
                                <b className="text-ink">{a.fullName}</b>
                                <span className="text-sm text-muted">{formatAddress(a)}</span>
                                {a.governorate && (
                                  <span className="text-xs font-bold text-blue-600">
                                    شحن {formatEGP(a.governorate.shippingCost)}
                                  </span>
                                )}
                              </span>
                            </button>
                          ))}
                          {!adding && (
                            <button
                              type="button"
                              onClick={() => setAdding(true)}
                              className="flex min-h-24 items-center justify-center rounded-tile border-2 border-dashed border-line-2 font-bold text-blue-500 hover:border-blue-300"
                            >
                              + إضافة عنوان جديد
                            </button>
                          )}
                        </div>
                      )}
                      {(adding || list.length === 0) && (
                        <AddressForm
                          onSaved={(a) => {
                            setAddressId(a.id)
                            setAdding(false)
                          }}
                          onCancel={list.length ? () => setAdding(false) : undefined}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {!needsShipping && (
                <div className={card}>
                  <h2 className="mb-1 text-2xl">عملة الدفع</h2>
                  <p className="mb-4 text-sm text-muted">لو هتدفع بـ PayPal اختار الدولار.</p>
                  <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="العملة">
                    {(['EGP', 'USD'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={currency === c}
                        onClick={() => setCurrency(c)}
                        className="flex flex-col items-start gap-1 rounded-tile border-2 border-line bg-white p-4 text-start aria-checked:border-navy aria-checked:bg-surface-blue"
                      >
                        <b className="text-ink">{c === 'EGP' ? 'جنيه مصري' : 'دولار أمريكي'}</b>
                        <span className="text-sm text-muted">
                          {c === 'EGP'
                            ? 'Apple Pay · كروت · محافظ'
                            : `PayPal${usd.data ? ` · $${usd.data.summary.total}` : ''}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={card}>
                <TextAreaField
                  label="ملاحظات على الطلب (اختياري)"
                  rows={2}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={needsShipping ? 'مثال: التوصيل بعد الساعة 5' : ''}
                />
              </div>
            </div>
          )}

          <aside className={cn(card, 'sticky top-27 flex flex-col gap-3 max-lg:static')}>
            <h2 className="text-xl">ملخص الطلب</h2>
            <div className="flex justify-between text-[15px]">
              <span className="text-muted">المجموع الفرعي</span>
              <b className="text-ink">
                {currency === 'USD' && usd.data ? `$${usd.data.summary.total}` : formatEGP(subtotal)}
              </b>
            </div>
            {needsShipping && (
              <div className="flex justify-between text-[15px]">
                <span className="text-muted">الشحن</span>
                <b className="text-ink">{selected ? formatEGP(shipping) : 'اختار العنوان'}</b>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-divider pt-3">
              <b className="text-ink">الإجمالي</b>
              <b className="font-head text-[28px] text-ink">
                {currency === 'USD' && usd.data
                  ? `$${usd.data.summary.total}`
                  : formatEGP(subtotal + shipping)}
              </b>
            </div>
            {create.isError && <Alert tone="error">{(create.error as Error).message}</Alert>}
            <button
              type="button"
              className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
              disabled={create.isPending || cart.isLoading || (needsShipping && !selected)}
              onClick={() => create.mutate()}
            >
              {create.isPending ? (
                <Spinner />
              ) : (
                <>
                  متابعة للدفع <Icon name="arrowLeft" />
                </>
              )}
            </button>
            <p className="text-center text-xs leading-relaxed text-muted">
              كوبون الخصم وطريقة الدفع في الخطوة الجاية.
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}
