import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { ProductCard } from '@/components/catalog/ProductCard'
import { productsGridClass } from '@/components/catalog/grids'
import { Pager } from '@/components/ui/Pager'
import { innerClass, sectionClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import { keepScroll, scrollToResults } from '@/lib/scroll'
import { useRegion } from '@/lib/region'
import { PricePill } from '@/components/catalog/PricePill'
import { priceParam } from '@/lib/priceParam'
import { loc, tx } from '@/lib/i18n'

const PAGE_SIZE = 12

const tabClass =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-4 font-bold text-ink transition-colors hover:border-blue-300 ' +
  'aria-selected:border-transparent aria-selected:bg-navy aria-selected:text-white'

export function StorePage() {
  usePageTitle(tx('المتجر', 'Store'))
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('cat') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const { currency } = useRegion()
  const minPrice = priceParam(params.get('min'))
  const maxPrice = priceParam(params.get('max'))
  const hasPrice = minPrice !== undefined || maxPrice !== undefined

  const query = {
    page,
    limit: PAGE_SIZE,
    categoryId: categoryId || undefined,
    minPrice,
    maxPrice,
    priceCurrency: hasPrice ? currency : undefined,
  }
  const list = useQuery({
    queryKey: ['products', 'list', query],
    queryFn: () => productsApi.list(query),
    placeholderData: keepPreviousData,
  })
  const categories = useQuery({ queryKey: ['products', 'categories'], queryFn: productsApi.categories })
  const total = useQuery({
    queryKey: ['products', 'list', { limit: 1 }],
    queryFn: () => productsApi.list({ limit: 1 }),
  })
  // Highest product price for the slider. Older APIs don't send priceBounds, so fall back to
  // reading the product list once.
  const allPrices = useQuery({
    queryKey: ['products', 'list', { limit: 100 }],
    queryFn: () => productsApi.list({ limit: 100 }),
    enabled: total.isSuccess && !total.data?.priceBounds,
    staleTime: 10 * 60_000,
  })
  const maxProductPrice =
    total.data?.priceBounds?.[currency].max ??
    Math.max(
      0,
      ...(allPrices.data?.products ?? []).map((p) => (currency === 'USD' ? p.priceUSD : p.priceEGP)),
    )
  const products = list.data?.products ?? []
  const pagination = list.data?.pagination

  function update(next: Record<string, string | null>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p, keepScroll)
  }

  const pick = (cat: string) => update({ cat: cat || null, page: null })

  return (
    <>
      <PageHero
        crumbs={[{ label: tx('الرئيسية', 'Home'), to: routes.home }, { label: tx('المتجر', 'Store') }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            {tx('توصيل لحد باب البيت', 'Delivered to your door')}
          </>
        }
        title={
          <>
            {tx('أدوات تربوية', 'Parenting tools')}{' '}
            <span className="text-sheen">{tx('للبيت', 'for home')}</span>
          </>
        }
        body={tx(
          'أدوات بسيطة صمّمها الدكتور صالح عشان تساعدك تطبّق اللي بتتعلمه في الدورات مع ولادك كل يوم.',
          'Simple tools designed by Dr. Saleh to help you apply what you learn in the courses with your children every day.',
        )}
      >
        <div
          role="tablist"
          aria-label={tx('الأقسام', 'Categories')}
          className="flex flex-wrap gap-2 rounded-card bg-white p-2.5 shadow-[0_30px_60px_-30px_rgba(5,20,40,.6)]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!categoryId}
            className={tabClass}
            onClick={() => pick('')}
          >
            {tx('الكل', 'All')}
          </button>
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={categoryId === c.id}
              className={tabClass}
              onClick={() => pick(c.id)}
            >
              {loc(c.nameAr, c.nameEn)}
            </button>
          ))}
        </div>
      </PageHero>

      <section id="results" className={cn(sectionClass, 'scroll-mt-28 pt-8')}>
        <div className={innerClass}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted" aria-live="polite">
              {pagination && (
                <>
                  <b className="text-ink">{pagination.total}</b> {tx('منتج', 'products')}
                </>
              )}
            </p>
            <PricePill
              currency={currency}
              maxPrice={maxProductPrice}
              min={minPrice}
              max={maxPrice}
              resultCount={list.isPlaceholderData ? undefined : pagination?.total}
              onChange={(min, max) =>
                update({
                  min: min === undefined ? null : String(min),
                  max: max === undefined ? null : String(max),
                  page: null,
                })
              }
            />
          </div>
          {list.isError ? (
            <ErrorState onRetry={() => list.refetch()} />
          ) : list.isLoading ? (
            <div className={productsGridClass}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-90 skeleton rounded-card" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="box"
              title={
                hasPrice
                  ? tx('مفيش منتجات في حدود السعر ده', 'No products in this price range')
                  : tx('مفيش منتجات هنا لسه', 'No products here yet')
              }
              body={
                hasPrice
                  ? tx(
                      'وسّع نطاق السعر أو اختار قسم تاني.',
                      'Widen the price range or choose another category.',
                    )
                  : tx(
                      'المنتجات الجديدة هتظهر هنا أول ما تنزل.',
                      "New products will appear here as soon as they're added.",
                    )
              }
            />
          ) : (
            <div
              className={cn(
                productsGridClass,
                'stagger transition-opacity',
                list.isPlaceholderData && 'opacity-55',
              )}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {pagination && pagination.totalPages > 1 && (
            <Pager
              pagination={pagination}
              noun={tx('منتج', 'products')}
              onChange={(p) => {
                update({ page: p > 1 ? String(p) : null })
                scrollToResults()
              }}
            />
          )}
        </div>
      </section>
    </>
  )
}
