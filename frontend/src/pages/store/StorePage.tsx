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
import { PriceFilter } from '@/components/catalog/PriceFilter'
import { priceParam } from '@/lib/priceParam'

const PAGE_SIZE = 12

const tabClass =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-4 font-bold text-ink transition-colors hover:border-blue-300 ' +
  'aria-selected:border-transparent aria-selected:bg-navy aria-selected:text-white'

export function StorePage() {
  usePageTitle('المتجر')
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
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'المتجر' }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            توصيل لحد باب البيت
          </>
        }
        title={
          <>
            أدوات تربوية <span className="text-sheen">للبيت</span>
          </>
        }
        body="أدوات بسيطة صمّمها الدكتور صالح عشان تساعدك تطبّق اللي بتتعلمه في الدورات مع ولادك كل يوم."
      >
        <div
          role="tablist"
          aria-label="الأقسام"
          className="flex flex-wrap gap-2 rounded-card bg-white p-2.5 shadow-[0_30px_60px_-30px_rgba(5,20,40,.6)]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!categoryId}
            className={tabClass}
            onClick={() => pick('')}
          >
            الكل
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
              {c.nameAr}
            </button>
          ))}
        </div>
      </PageHero>

      <section id="results" className={cn(sectionClass, 'scroll-mt-28 pt-8')}>
        <div className={innerClass}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 rounded-card border border-line bg-white px-5 pt-3 pb-4">
            <p className="pb-3 text-muted" aria-live="polite">
              {pagination && (
                <>
                  <b className="text-ink">{pagination.total}</b> منتج
                </>
              )}
            </p>
            <PriceFilter
              className="w-full max-w-sm"
              currency={currency}
              maxPrice={maxProductPrice}
              min={minPrice}
              max={maxPrice}
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
              title={hasPrice ? 'مفيش منتجات في حدود السعر ده' : 'مفيش منتجات هنا لسه'}
              body={
                hasPrice ? 'وسّع نطاق السعر أو اختار قسم تاني.' : 'المنتجات الجديدة هتظهر هنا أول ما تنزل.'
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
              noun="منتج"
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
