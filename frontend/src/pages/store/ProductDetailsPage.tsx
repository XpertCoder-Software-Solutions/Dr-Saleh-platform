import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { formatEGP } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { NotFoundPage } from '@/pages/NotFoundPage'

const TRUST: { icon: IconName; text: string }[] = [
  { icon: 'truck', text: 'توصيل لكل المحافظات' },
  { icon: 'shield', text: 'Apple Pay · محافظ · كروت · PayPal' },
  { icon: 'refresh', text: 'استرجاع خلال 14 يوم' },
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
  usePageTitle(product?.name ?? 'المنتج')

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
  const t = useCopy()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cart = useAddToCart()
  const wishlist = useWishlist('PRODUCT')
  const price = productPrice(product)
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
      label: `صورة ${i + 1}`,
      main: <img src={src} alt={i === 0 ? product.name : ''} className="size-full object-cover" />,
      thumb: <img src={src} alt="" className="size-full object-cover" />,
    }))
  }, [product])

  async function add() {
    setError(null)
    try {
      if (await cart.add({ itemType: 'PRODUCT', itemId: product.id, quantity: qty })) setAdded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حصلت مشكلة، حاول تاني.')
    }
  }

  return (
    <>
      <section className="px-6 pt-30 pb-16 max-sm:px-4 max-sm:pt-26">
        <div className={cn(innerClass, 'flex flex-col gap-6')}>
          <nav aria-label="مسار الصفحة" className="text-sm text-muted">
            <Link to={routes.home}>الرئيسية</Link> / <Link to={routes.store}>المتجر</Link>
            {product.category && (
              <>
                {' '}
                / <Link to={`${routes.store}?cat=${product.category.id}`}>{product.category.nameAr}</Link>
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
                    الأكثر مبيعًا
                  </span>
                )}
                {product.category && (
                  <span className="rounded-full bg-surface-blue px-3 py-1 text-[13px] font-bold text-blue-600">
                    {product.category.nameAr}
                  </span>
                )}
              </div>
              <h1 className="text-[clamp(32px,4.5vw,48px)] leading-tight">
                <Highlight text={tail.length ? `${head} *${tail.join(' ')}*` : head} />
              </h1>
              <p className="text-sm text-muted">تصميم: د. صالح عبد الكريم</p>
              {lead && <p className="text-[17px] leading-loose text-text-2">{lead}</p>}

              <div className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
                <span
                  className={cn('text-[15px] font-semibold', outOfStock ? 'text-danger' : 'text-success')}
                >
                  ● {outOfStock ? 'نفد من المخزن حاليًا' : 'متوفر · يوصلك خلال 2 لـ 4 أيام عمل لأي محافظة'}
                </span>
                {!outOfStock && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm text-muted">الإجمالي</span>
                      <b className="font-head text-2xl text-ink">{formatEGP(price.current * qty)}</b>
                      {price.old != null && (
                        <s className="text-sm text-muted-2">{formatEGP(price.old * qty)}</s>
                      )}
                    </span>
                    <QuantityStepper value={qty} onChange={setQty} max={product.stock} />
                  </div>
                )}
                {error && <Alert tone="error">{error}</Alert>}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    className={buttonClass({ variant: 'gold', size: 'lg', className: 'flex-1' })}
                    disabled={outOfStock || cart.isPending}
                    onClick={add}
                  >
                    {cart.isPending ? (
                      <Spinner />
                    ) : added ? (
                      <>
                        <Icon name="check" /> اتضاف للسلة
                      </>
                    ) : (
                      <>
                        <Icon name="bag" /> {t('cta.addToCart')}
                      </>
                    )}
                  </button>
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
                    aria-label={wishlist.has(product.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    onClick={() => wishlist.toggle(product.id)}
                  >
                    <Icon name="heart" filled={wishlist.has(product.id)} />
                  </button>
                </div>
                {added && (
                  <Link to={routes.cart} className="text-center font-bold">
                    روح للسلة <Icon name="arrowLeft" size={16} className="inline" />
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
            <h2 className="text-[26px]">تفاصيل المنتج</h2>
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
          eyebrow="من المتجر"
          icon="box"
          title={<Highlight text="ممكن *يعجبك* كمان" />}
          more={{ to: routes.store, label: 'كل المنتجات' }}
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
