import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError, resolveAssetUrl } from '@/api/client'
import { productsApi, type StoreProduct } from '@/api/endpoints'
import { useAddToCart } from '@/api/cart'
import { useWishlist } from '@/api/wishlist'
import { useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { Gallery } from '@/components/catalog/Gallery'
import { ProductCard } from '@/components/catalog/ProductCard'
import { productsGridClass } from '@/components/catalog/grids'
import { QuantityStepper } from '@/components/catalog/QuantityStepper'
import { Icon, type IconName } from '@/components/ui/Icon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { Alert, ErrorState, Spinner } from '@/components/ui/States'
import { Highlight } from '@/components/ui/Highlight'
import { cn } from '@/lib/cn'
import { CARD_GRADS, pickBySeed, productPrice } from '@/lib/catalog'
import { formatMoney } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useRegion } from '@/lib/region'
import { loc, tx } from '@/lib/i18n'

const TRUST: { icon: IconName; text: string }[] = [
  { icon: 'truck', text: tx('توصيل لكل المحافظات', 'Delivery to all governorates') },
  { icon: 'shield', text: tx('Apple Pay · محافظ · كروت · PayPal', 'Apple Pay · wallets · cards · PayPal') },
  { icon: 'refresh', text: tx('استرجاع خلال 14 يوم', 'Returns within 14 days') },
]

export function ProductDetailsPage() {
  const { slug = '' } = useParams()
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', 'slug', slug],
    queryFn: () => productsApi.bySlug(slug),
  })
  usePageTitle(product?.name ?? tx('المنتج', 'Product'))

  if (error instanceof ApiClientError && error.statusCode === 404) return <NotFoundPage />
  if (isError) {
    return (
      <div className="mx-auto max-w-140 px-6 pt-36 pb-20">
        <ErrorState onRetry={() => refetch()} />
      </div>
    )
  }
  if (isLoading || !product) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-30 text-blue-600">
        <Spinner />
      </div>
    )
  }
  return <ProductDetails product={product} />
}

function ProductDetails({ product }: { product: StoreProduct }) {
  const { currency } = useRegion()
  const t = useCopy()
  const [qty, setQty] = useState(1)
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cart = useAddToCart()
  const wishlist = useWishlist('PRODUCT')
  const price = productPrice(product, currency)
  const outOfStock = product.stock <= 0
  const [head, ...tail] = product.name.split(' ')
  const [lead, ...rest] = product.description.split(/\n+/).filter(Boolean)

  const gallery = useMemo(() => {
    const photos = [
      product.coverImage,
      ...(product.images ?? []).sort((a, b) => a.displayOrder - b.displayOrder).map((i) => i.imageUrl),
    ]
      .map((p) => resolveAssetUrl(p))
      .filter((p): p is string => Boolean(p))
    if (!photos.length) {
      return [
        {
          key: 'none',
          label: product.name,
          main: <Icon name="box" size={90} className="text-white" />,
          thumb: null,
        },
      ]
    }
    return photos.map((src, i) => ({
      key: `${i}-${src}`,
      label: tx(`صورة ${i + 1}`, `Photo ${i + 1}`),
      main: <img src={src} alt={i === 0 ? product.name : ''} className="size-full object-cover" />,
      thumb: <img src={src} alt="" className="size-full object-cover" />,
    }))
  }, [product])

  async function add(goToCart: boolean) {
    setError(null)
    setBuying(goToCart)
    try {
      if (!(await cart.add({ itemType: 'PRODUCT', itemId: product.id, quantity: qty }))) return
      setAdded(true)
      if (goToCart) navigate(routes.cart)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : tx('حصلت مشكلة، حاول تاني.', 'Something went wrong. Please try again.'),
      )
    }
  }

  return (
    <>
      <section className="px-6 pt-30 pb-16 max-sm:px-4 max-sm:pt-26">
        <div className={cn(innerClass, 'flex flex-col gap-6')}>
          <nav aria-label={tx('مسار الصفحة', 'Breadcrumb')} className="text-sm text-muted">
            <Link to={routes.home}>{tx('الرئيسية', 'Home')}</Link> /{' '}
            <Link to={routes.store}>{tx('المتجر', 'Store')}</Link>
            {product.category && (
              <>
                {' '}
                /{' '}
                <Link to={`${routes.store}?cat=${product.category.id}`}>
                  {loc(product.category.nameAr, product.category.nameEn)}
                </Link>
              </>
            )}{' '}
            /{' '}
            <span aria-current="page" className="text-ink">
              {product.name}
            </span>
          </nav>
          <div className="grid grid-cols-2 items-start gap-8 max-lg:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {product.isFeatured && (
                  <span className="bg-gold rounded-full px-3 py-1 text-[13px] font-extrabold text-navy">
                    {tx('الأكثر مبيعًا', 'Best seller')}
                  </span>
                )}
                {product.category && (
                  <span className="rounded-full bg-surface-blue px-3 py-1 text-[13px] font-bold text-blue-600">
                    {loc(product.category.nameAr, product.category.nameEn)}
                  </span>
                )}
              </div>
              <h1 className="text-[clamp(32px,4.5vw,48px)] leading-tight">
                <Highlight text={tail.length ? `${head} *${tail.join(' ')}*` : head} />
              </h1>
              <p className="text-sm text-muted">
                {tx('تصميم: د. صالح عبد الكريم', 'Designed by Dr. Saleh Abdelkarim')}
              </p>
              {lead && <p className="text-[17px] leading-loose text-text-2">{lead}</p>}

              <div className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
                <span
                  className={cn('text-[15px] font-semibold', outOfStock ? 'text-danger' : 'text-success')}
                >
                  ●{' '}
                  {outOfStock
                    ? tx('نفد من المخزن حاليًا', 'Out of stock for now')
                    : tx(
                        'متوفر · يوصلك خلال 2 لـ 4 أيام عمل لأي محافظة',
                        'In stock · delivered within 2–4 business days to any governorate',
                      )}
                </span>
                {!outOfStock && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm text-muted">{tx('الإجمالي', 'Total')}</span>
                      <b className="font-head text-2xl text-ink">
                        {formatMoney(price.current * qty, currency)}
                      </b>
                      {price.old != null && (
                        <s className="text-sm text-muted-2">{formatMoney(price.old * qty, currency)}</s>
                      )}
                    </span>
                    <QuantityStepper value={qty} onChange={setQty} max={product.stock} />
                  </div>
                )}
                {error && <Alert tone="error">{error}</Alert>}
                <button
                  type="button"
                  className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
                  disabled={outOfStock || cart.isPending}
                  onClick={() => add(true)}
                >
                  {cart.isPending && buying ? (
                    <Spinner />
                  ) : (
                    <>
                      {tx('اشتري الآن', 'Buy now')} · {formatMoney(price.current * qty, currency)}
                    </>
                  )}
                </button>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    className={buttonClass({
                      variant: 'outline',
                      size: 'lg',
                      className: cn(
                        'w-14 flex-none px-0',
                        wishlist.has(product.id) && 'text-danger-dot hover:text-danger-dot',
                      ),
                    })}
                    aria-pressed={wishlist.has(product.id)}
                    aria-label={
                      wishlist.has(product.id)
                        ? tx('إزالة من المفضلة', 'Remove from wishlist')
                        : tx('إضافة للمفضلة', 'Add to wishlist')
                    }
                    onClick={() => wishlist.toggle(product.id)}
                  >
                    <Icon name="heart" filled={wishlist.has(product.id)} />
                  </button>
                  <button
                    type="button"
                    className={buttonClass({ variant: 'outline', size: 'lg', className: 'flex-1' })}
                    disabled={outOfStock || cart.isPending}
                    onClick={() => add(false)}
                  >
                    {cart.isPending && !buying ? (
                      <Spinner />
                    ) : added ? (
                      <>
                        <Icon name="check" /> {tx('اتضاف للسلة', 'Added to cart')}
                      </>
                    ) : (
                      <>
                        <Icon name="bag" /> {t('cta.addToCart')}
                      </>
                    )}
                  </button>
                </div>
                {added && (
                  <Link to={routes.cart} className="text-center font-bold">
                    {tx('روح للسلة', 'Go to cart')} <Icon name="arrowLeft" size={16} className="inline" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                {TRUST.map((x) => (
                  <span
                    key={x.text}
                    className="flex items-center gap-2.5 rounded-tile border border-line bg-white p-3 text-[13px] font-semibold text-ink"
                  >
                    <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
                      <Icon name={x.icon} size={17} />
                    </span>
                    {x.text}
                  </span>
                ))}
              </div>
            </div>

            <Gallery
              className="max-lg:order-first"
              items={gallery}
              stageStyle={{ background: pickBySeed(CARD_GRADS, product.id) }}
            />
          </div>
        </div>
      </section>

      {rest.length > 0 && (
        <section className={sectionClass}>
          <div className={cn(innerClass, 'flex flex-col gap-4 rounded-panel p-9 gborder max-sm:p-6')}>
            <h2 className="text-[26px]">{tx('تفاصيل المنتج', 'Product details')}</h2>
            <div className="flex flex-col gap-3 text-[17px] leading-[1.95] text-text-2">
              {rest.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      <Related current={product} />
    </>
  )
}

function Related({ current }: { current: StoreProduct }) {
  const { data } = useQuery({
    queryKey: ['products', 'list', { limit: 5, categoryId: current.category?.id }],
    queryFn: () => productsApi.list({ limit: 5, categoryId: current.category?.id }),
  })
  const others = (data?.products ?? []).filter((p) => p.id !== current.id).slice(0, 4)
  if (!others.length) return null
  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          eyebrow={tx('من المتجر', 'From the store')}
          icon="box"
          title={<Highlight text={tx('ممكن *يعجبك* كمان', 'You might *also like*')} />}
          more={{ to: routes.store, label: tx('كل المنتجات', 'All products') }}
        />
        <div className={productsGridClass}>
          {others.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
