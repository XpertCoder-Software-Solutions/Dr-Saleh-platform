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

const PAGE_SIZE = 12

const tabClass =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-4 font-bold text-ink transition-colors hover:border-blue-300 ' +
  'aria-selected:border-transparent aria-selected:bg-navy aria-selected:text-white'

export function StorePage() {
  usePageTitle('المتجر')
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('cat') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const query = { page, limit: PAGE_SIZE, categoryId: categoryId || undefined }
  const list = useQuery({
    queryKey: ['products', 'list', query],
    queryFn: () => productsApi.list(query),
    placeholderData: keepPreviousData,
  })
  const categories = useQuery({ queryKey: ['products', 'categories'], queryFn: productsApi.categories })
  const products = list.data?.products ?? []
  const pagination = list.data?.pagination

  function pick(cat: string) {
    const p = new URLSearchParams()
    if (cat) p.set('cat', cat)
    setParams(p)
  }

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

      <section className={cn(sectionClass, 'pt-8')}>
        <div className={innerClass}>
          {pagination && (
            <p className="mb-4 text-muted" aria-live="polite">
              <b className="text-ink">{pagination.total}</b> منتج
            </p>
          )}
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
              title="مفيش منتجات هنا لسه"
              body="المنتجات الجديدة هتظهر هنا أول ما تنزل."
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
                const next = new URLSearchParams(params)
                if (p > 1) next.set('page', String(p))
                else next.delete('page')
                setParams(next)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </div>
      </section>
    </>
  )
}
