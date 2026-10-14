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
import { formatEGP } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'

const CART_KEY = ['me', 'cart'] as const

export function CartPage() {
  usePageTitle('السلة')
  const t = useCopy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cart = useQuery({ queryKey: CART_KEY, queryFn: () => cartApi.get('EGP') })

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
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'السلة' }]}
        title={
          <>
            سلة <span className="text-sheen">مشترياتك</span>
          </>
        }
        body="راجع اللي اخترته قبل الدفع. الدورات والنسخ الرقمية بتتفتح لك فورًا، والمنتجات الورقية بتوصلك لحد البيت."
      />

      <section className={cn(sectionClass, 'relative z-2 -mt-14')}>
        <div className={innerClass}>
          {cart.isError ? (
            <ErrorState onRetry={() => cart.refetch()} />
          ) : cart.isLoading ? (
            <div className="flex justify-center rounded-card bg-white py-20 text-blue-600">
              <Spinner />
            </div>
          ) : lines.length === 0 ? (
            <div className="rounded-card bg-white shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)]">
              <EmptyState
                icon="bag"
                title={t('cart.empty')}
                body="تصفّح الدورات والكتب والمنتجات، وأي حاجة تضيفها هتلاقيها هنا."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to={routes.courses} className={buttonClass({ variant: 'gold' })}>
                      تصفّح الدورات
                    </Link>
                    <Link to={routes.library} className={buttonClass({ variant: 'outline' })}>
                      المكتبة
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
                    في السلة{' '}
                    <span className="text-base font-medium text-muted">({summary?.itemsCount} عناصر)</span>
                  </h2>
                  <button
                    type="button"
                    className="border-0 bg-transparent font-bold text-danger disabled:opacity-50"
                    disabled={clear.isPending}
                    onClick={() => clear.mutate()}
                  >
                    فضّي السلة
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
                    فيه منتجات ورقية في سلتك، هتوصلك خلال 2 لـ 4 أيام عمل. الدورات والنسخ الرقمية بتتفتح
                    فورًا.
                  </p>
                )}
              </div>

              <aside className="sticky top-27 flex flex-col gap-4 max-lg:static">
                <div className="flex flex-col gap-3 rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)]">
                  <h2 className="text-xl">ملخّص الطلب</h2>
                  <Row label="المجموع" value={formatEGP(summary?.subtotal ?? 0)} />
                  {!!summary?.discount && (
                    <Row label="الخصم" value={`− ${formatEGP(summary.discount)}`} accent />
                  )}
                  <Row label="الشحن" value={needsShipping ? 'بيتحسب حسب المحافظة' : 'مفيش'} />
                  <div className="mt-1 flex items-baseline justify-between border-t border-divider pt-3">
                    <b className="text-ink">الإجمالي</b>
                    <b className="font-head text-[28px] text-ink">{formatEGP(summary?.total ?? 0)}</b>
                  </div>
                  <p className="text-xs text-muted">عندك كوبون خصم؟ هتكتبه في خطوة الدفع.</p>
                  <button
                    type="button"
                    className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
                    disabled={unavailable}
                    onClick={() => navigate(routes.checkout)}
                  >
                    <Icon name="lock" size={18} /> كمّل للدفع
                  </button>
                  {unavailable && <p className="text-sm text-danger">فيه عنصر مبقاش متاح، شيله الأول.</p>}
                  <PaymentLogos
                    names={['applePay', 'visa', 'mastercard', 'meeza', 'vodafone', 'paypal']}
                    className="justify-center"
                  />
                </div>
                <ul className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 text-sm text-text-2">
                  {(
                    [
                      ['shield', 'دفع آمن ومشفّر'],
                      ['play', 'الدورات بتتفتح فورًا بعد الدفع'],
                      ['refresh', 'استرجاع حسب سياسة الاسترداد'],
                    ] as [IconName, string][]
                  ).map(([icon, text]) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-surface-blue text-blue-600">
                        <Icon name={icon} size={15} />
                      </span>
                      {text === 'استرجاع حسب سياسة الاسترداد' ? (
                        <span>
                          استرجاع حسب <Link to={routes.refunds}>سياسة الاستبدال والاسترجاع</Link>
                        </span>
                      ) : (
                        text
                      )}
                    </li>
                  ))}
                </ul>
                <Link to={routes.courses} className="text-center font-bold">
                  كمّل تسوّق <Icon name="chevLeft" size={14} className="inline" />
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
            {item?.nameAr}
          </Link>
        ) : (
          <b className="text-muted">عنصر مبقاش متاح</b>
        )}
        {item && !item.isActive && <span className="text-xs text-danger">مبقاش متاح للشراء</span>}
      </div>
      {canChangeQty && <QuantityStepper value={line.quantity} max={item?.stock ?? 99} onChange={onQty} />}
      <span className="flex w-24 flex-col items-end">
        <b className="text-lg text-ink">{formatEGP(line.lineTotal)}</b>
        {line.lineDiscount > 0 && <s className="text-xs text-muted-2">{formatEGP(line.lineSubtotal)}</s>}
      </span>
      <button
        type="button"
        aria-label={`شيل ${item?.nameAr ?? 'العنصر'}`}
        onClick={onRemove}
        className="flex size-10 flex-none items-center justify-center rounded-xl border border-red-200 bg-red-50 text-danger hover:bg-red-100"
      >
        <Icon name="trash" size={17} />
      </button>
    </li>
  )
}
