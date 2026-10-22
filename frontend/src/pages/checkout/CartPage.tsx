import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi, lineNeedsShipping, type CartLine } from '@/api/shop'
import { useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { QuantityStepper } from '@/components/catalog/QuantityStepper'
import { PageHero } from '@/components/layout/PageHero'
import { LineThumb } from '@/components/shop/LineThumb'
import { FORMAT_TYPE_LABEL, TYPE_LABEL } from '@/lib/shop-labels'
import { PaymentLogos } from '@/components/shop/PaymentLogos'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRegion } from '@/lib/region'
import { confirmAction } from '@/lib/confirm'
import { loc, tx } from '@/lib/i18n'

const CART_KEY = ['me', 'cart'] as const

export function CartPage() {
  const { currency } = useRegion()
  usePageTitle(tx('السلة', 'Cart'))
  const t = useCopy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // Always read the cart fresh when the page opens, so items added a moment ago show up.
  const cart = useQuery({
    queryKey: [...CART_KEY, currency],
    queryFn: () => cartApi.get(currency),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CART_KEY })
    queryClient.invalidateQueries({ queryKey: ['me', 'cart-summary'] })
  }
  const setQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => cartApi.setQuantity(id, quantity),
    onSettled: refresh,
  })
  const remove = useMutation({ mutationFn: (id: string) => cartApi.remove(id), onSettled: refresh })
  const clear = useMutation({ mutationFn: () => cartApi.clear(), onSettled: refresh })

  const lines = cart.data?.cart.items ?? []
  const summary = cart.data?.summary
  const needsShipping = lines.some(lineNeedsShipping)
  const unavailable = lines.some((l) => !l.item || !l.item.isActive)

  return (
    <>
      <PageHero
        portrait={false}
        crumbs={[{ label: tx('الرئيسية', 'Home'), to: routes.home }, { label: tx('السلة', 'Cart') }]}
        title={
          <>
            {tx('سلة', 'Your')} <span className="text-sheen">{tx('مشترياتك', 'cart')}</span>
          </>
        }
        body={tx(
          'راجع اللي اخترته قبل الدفع. الدورات والنسخ الرقمية بتتفتح لك فورًا، والمنتجات الورقية بتوصلك لحد البيت.',
          'Review your items before paying. Courses and digital editions open right away; physical items are delivered to your door.',
        )}
      />

      <section className={cn(sectionClass, 'relative z-2 -mt-14')}>
        <div className={innerClass}>
          {cart.isError ? (
            <ErrorState onRetry={() => cart.refetch()} />
          ) : cart.isLoading || (cart.isFetching && lines.length === 0) ? (
            <div className="flex justify-center rounded-card bg-white py-20 text-blue-600">
              <Spinner />
            </div>
          ) : lines.length === 0 ? (
            <div className="rounded-card bg-white shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)]">
              <EmptyState
                icon="bag"
                title={t('cart.empty')}
                body={tx(
                  'تصفّح الدورات والكتب والمنتجات، وأي حاجة تضيفها هتلاقيها هنا.',
                  'Browse courses, books and products — anything you add will be here.',
                )}
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to={routes.courses} className={buttonClass({ variant: 'gold' })}>
                      {tx('تصفّح الدورات', 'Browse courses')}
                    </Link>
                    <Link to={routes.library} className={buttonClass({ variant: 'outline' })}>
                      {tx('المكتبة', 'Library')}
                    </Link>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_340px] items-start gap-6 max-lg:grid-cols-1">
              <div className="rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-2xl">
                    {tx('في السلة', 'In your cart')}{' '}
                    <span className="text-base font-medium text-muted">
                      ({tx(`${summary?.itemsCount} عناصر`, `${summary?.itemsCount} items`)})
                    </span>
                  </h2>
                  <button
                    type="button"
                    className="border-0 bg-transparent font-bold text-danger disabled:opacity-50"
                    disabled={clear.isPending}
                    onClick={async () => {
                      if (
                        await confirmAction({
                          title: tx('تفضّي السلة؟', 'Empty your cart?'),
                          body: tx(
                            'كل الحاجات اللي في السلة هتتشال.',
                            'Everything in your cart will be removed.',
                          ),
                          confirmLabel: tx('أيوه، فضّيها', 'Yes, empty it'),
                          icon: 'trash',
                        })
                      )
                        clear.mutate()
                    }}
                  >
                    {tx('فضّي السلة', 'Empty cart')}
                  </button>
                </div>
                <ul>
                  {lines.map((line) => (
                    <CartRow
                      key={line.id}
                      line={line}
                      busy={
                        (setQty.isPending && setQty.variables?.id === line.id) ||
                        (remove.isPending && remove.variables === line.id)
                      }
                      onQty={(quantity) => setQty.mutate({ id: line.id, quantity })}
                      onRemove={() => remove.mutate(line.id)}
                    />
                  ))}
                </ul>
                {(setQty.isError || remove.isError) && (
                  <p className="mt-3 text-sm text-danger">
                    {((setQty.error ?? remove.error) as Error).message}
                  </p>
                )}
                {needsShipping && (
                  <p className="mt-4 flex items-center gap-3 rounded-tile bg-surface-blue px-4 py-3 text-sm text-text-2">
                    <Icon name="truck" size={18} className="flex-none text-blue-600" />
                    {tx(
                      'فيه منتجات ورقية في سلتك، هتوصلك خلال 2 لـ 4 أيام عمل. الدورات والنسخ الرقمية بتتفتح فورًا.',
                      'Your cart has physical items, delivered within 2–4 business days. Courses and digital editions open right away.',
                    )}
                  </p>
                )}
              </div>

              <aside className="sticky top-27 flex flex-col gap-4 max-lg:static">
                <div className="flex flex-col gap-3 rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)]">
                  <h2 className="text-xl">{tx('ملخّص الطلب', 'Order summary')}</h2>
                  <Row
                    label={tx('المجموع', 'Subtotal')}
                    value={formatMoney(summary?.subtotal ?? 0, currency)}
                  />
                  {!!summary?.discount && (
                    <Row
                      label={tx('الخصم', 'Discount')}
                      value={`− ${formatMoney(summary.discount, currency)}`}
                      accent
                    />
                  )}
                  {needsShipping && (
                    <Row
                      label={tx('الشحن', 'Shipping')}
                      value={tx('بيتحسب حسب المحافظة', 'Calculated by governorate')}
                    />
                  )}
                  <div className="mt-1 flex items-baseline justify-between border-t border-divider pt-3">
                    <b className="text-ink">{tx('الإجمالي', 'Total')}</b>
                    <b className="font-head text-[28px] text-ink">
                      {formatMoney(summary?.total ?? 0, currency)}
                    </b>
                  </div>
                  <p className="text-xs text-muted">
                    {tx(
                      'عندك كوبون خصم؟ هتكتبه في خطوة الدفع.',
                      'Have a coupon? You can enter it at payment.',
                    )}
                  </p>
                  <button
                    type="button"
                    className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
                    disabled={unavailable}
                    onClick={() => navigate(routes.checkout)}
                  >
                    <Icon name="lock" size={18} /> {tx('كمّل للدفع', 'Proceed to payment')}
                  </button>
                  {unavailable && (
                    <p className="text-sm text-danger">
                      {tx(
                        'فيه عنصر مبقاش متاح، شيله الأول.',
                        'An item is no longer available. Remove it first.',
                      )}
                    </p>
                  )}
                  <PaymentLogos
                    names={['applePay', 'visa', 'mastercard', 'meeza', 'vodafone', 'paypal']}
                    className="justify-center"
                  />
                </div>
                <ul className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 text-sm text-text-2">
                  {(
                    [
                      ['shield', tx('دفع آمن ومشفّر', 'Secure, encrypted payment')],
                      ['play', tx('الدورات بتتفتح فورًا بعد الدفع', 'Courses open right after payment')],
                      ['refresh', 'refunds'],
                    ] as [IconName, string][]
                  ).map(([icon, text]) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-surface-blue text-blue-600">
                        <Icon name={icon} size={15} />
                      </span>
                      {text === 'refunds' ? (
                        <span>
                          {tx('استرجاع حسب', 'Refunds per our')}{' '}
                          <Link to={routes.refunds}>
                            {tx('سياسة الاستبدال والاسترجاع', 'returns & refunds policy')}
                          </Link>
                        </span>
                      ) : (
                        text
                      )}
                    </li>
                  ))}
                </ul>
                <Link to={routes.courses} className="text-center font-bold">
                  {tx('كمّل تسوّق', 'Continue shopping')}{' '}
                  <Icon name="chevLeft" size={14} className="inline" />
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-[15px]">
      <span className="text-muted">{label}</span>
      <b className={accent ? 'text-success' : 'text-ink'}>{value}</b>
    </div>
  )
}

function CartRow({
  line,
  busy,
  onQty,
  onRemove,
}: {
  line: CartLine
  busy: boolean
  onQty: (q: number) => void
  onRemove: () => void
}) {
  const { currency } = useRegion()
  const item = line.item
  const label =
    line.itemType === 'BOOK' && item?.formatType
      ? FORMAT_TYPE_LABEL[item.formatType]
      : TYPE_LABEL[line.itemType]
  const href = !item
    ? undefined
    : line.itemType === 'COURSE'
      ? routes.course(item.id)
      : line.itemType === 'BOOK'
        ? routes.book(item.slug ?? '')
        : routes.product(item.slug ?? '')
  const canChangeQty = lineNeedsShipping(line)
  return (
    <li
      className={cn(
        'flex items-center gap-4 border-t border-divider py-4 first:border-t-0 max-sm:flex-wrap',
        busy && 'opacity-60',
      )}
    >
      <LineThumb id={line.itemId} type={line.itemType} image={item?.image} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="self-start rounded-full bg-surface-blue px-2.5 py-0.5 text-xs font-bold text-blue-600">
          {label}
        </span>
        {href ? (
          <Link to={href} className="font-bold text-ink">
            {loc(item?.nameAr, item?.nameEn)}
          </Link>
        ) : (
          <b className="text-muted">{tx('عنصر مبقاش متاح', 'Item no longer available')}</b>
        )}
        {item && !item.isActive && (
          <span className="text-xs text-danger">{tx('مبقاش متاح للشراء', 'No longer available')}</span>
        )}
      </div>
      {canChangeQty && <QuantityStepper value={line.quantity} max={item?.stock ?? 99} onChange={onQty} />}
      <span className="flex w-24 flex-col items-end">
        <b className="text-lg text-ink">{formatMoney(line.lineTotal, currency)}</b>
        {line.lineDiscount > 0 && (
          <s className="text-xs text-muted-2">{formatMoney(line.lineSubtotal, currency)}</s>
        )}
      </span>
      <button
        type="button"
        aria-label={`شيل ${loc(item?.nameAr, item?.nameEn) ?? 'العنصر'}`}
        onClick={onRemove}
        className="flex size-10 flex-none items-center justify-center rounded-xl border border-red-200 bg-red-50 text-danger hover:bg-red-100"
      >
        <Icon name="trash" size={17} />
      </button>
    </li>
  )
}
