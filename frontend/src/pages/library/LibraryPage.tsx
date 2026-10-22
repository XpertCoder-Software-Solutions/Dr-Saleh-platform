import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { booksApi, productsApi } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { BookCard, BookCoverArt } from '@/components/catalog/BookCard'
import { ProductCard } from '@/components/catalog/ProductCard'
import { booksGridClass, productsGridClass } from '@/components/catalog/grids'
import { Icon } from '@/components/ui/Icon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { buttonClass, innerClass, pillTabClass, sectionClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Highlight } from '@/components/ui/Highlight'
import { cn } from '@/lib/cn'
import { activeFormats, FORMAT_LABEL, formatPrice } from '@/lib/catalog'
import { formatMoney } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Book, BookFormatType } from '@/types/api'
import { useRegion } from '@/lib/region'
import { keepScroll } from '@/lib/scroll'
import { PricePill } from '@/components/catalog/PricePill'
import { priceParam } from '@/lib/priceParam'
import { loc, tx } from '@/lib/i18n'

const FORMAT_TABS: { id: '' | BookFormatType; label: string }[] = [
  { id: '', label: tx('الكل', 'All') },
  { id: 'Physical', label: tx('ورقي', 'Paperback') },
  { id: 'Digital', label: tx('رقمي', 'Digital') },
  { id: 'Audio', label: tx('صوتي', 'Audio') },
]

export function LibraryPage() {
  usePageTitle(tx('المكتبة', 'Library'))
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') ?? ''
  const format = (params.get('format') ?? '') as '' | BookFormatType
  const minPrice = priceParam(params.get('min'))
  const maxPrice = priceParam(params.get('max'))
  const hasPrice = minPrice !== undefined || maxPrice !== undefined
  const { currency } = useRegion()
  const [search, setSearch] = useState(params.get('q') ?? '')

  const books = useQuery({ queryKey: ['books'], queryFn: booksApi.list })
  const categories = useQuery({
    queryKey: ['books', 'categories'],
    queryFn: booksApi.categories,
    staleTime: 10 * 60_000,
  })

  // The endpoint returns every book, so the library filters on the client.
  const active = useMemo(() => (books.data ?? []).filter((b) => b.isActive), [books.data])
  const featured = active.find((b) => b.isFeatured) ?? active[0]
  // Highest list price of any copy, so the slider covers every book.
  const maxBookPrice = useMemo(
    () =>
      Math.max(
        0,
        ...active.flatMap((b) =>
          activeFormats(b).map((f) => {
            const p = formatPrice(f, b, currency)
            return p.old ?? p.current ?? 0
          }),
        ),
      ),
    [active, currency],
  )
  const shown = useMemo(() => {
    const q = search.trim()
    // A book matches the price range when one of its copies (of the chosen type) costs that much.
    const inRange = (b: Book) =>
      activeFormats(b).some((f) => {
        if (format && f.formatType !== format) return false
        const p = formatPrice(f, b, currency).current
        return (
          p != null && (minPrice === undefined || p >= minPrice) && (maxPrice === undefined || p <= maxPrice)
        )
      })
    return active.filter(
      (b) =>
        (!cat || b.categoryId === cat) &&
        (!format || b.formats.some((f) => f.isActive && f.formatType === format)) &&
        (!hasPrice || inRange(b)) &&
        (!q || loc(b.titleAr, b.titleEn).includes(q) || loc(b.descriptionAr, b.descriptionEn).includes(q)),
    )
  }, [active, cat, format, search, hasPrice, minPrice, maxPrice, currency])
  const usedCategories = (categories.data ?? []).filter((c) => active.some((b) => b.categoryId === c.id))

  function setParam(key: string, value: string) {
    setParamsMap({ [key]: value })
  }

  function setParamsMap(next: Record<string, string>) {
    const p = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value)
      else p.delete(key)
    }
    setParams(p, { replace: true, ...keepScroll })
  }

  return (
    <>
      <PageHero
        portrait={false}
        crumbs={[{ label: tx('الرئيسية', 'Home'), to: routes.home }, { label: tx('المكتبة', 'Library') }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            {tx('ورقي · رقمي PDF · صوتي', 'Paperback · digital PDF · audio')}
          </>
        }
        title={
          <>
            {tx('اقرأ… أو', 'Read… or')}{' '}
            <span className="text-sheen">{tx('اسمع وانت في الطريق', 'listen on the go')}</span>
          </>
        }
        body={tx(
          'كتب الدكتور صالح في التربية وعلم النفس. النسخة الورقية بتوصلك لحد البيت، والرقمية والصوتية فورًا بعد الدفع.',
          "Dr. Saleh's books on parenting and psychology. Paperbacks are delivered to your door; digital and audio editions are available right after payment.",
        )}
      >
        {featured && <FeaturedBook book={featured} />}
      </PageHero>

      <section className={cn(sectionClass, 'pt-8')}>
        <div className={innerClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-13 flex-[1_1_320px] items-center gap-2.5 rounded-field border-[1.5px] border-line bg-white px-4 text-muted focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(61,155,216,.15)] md:max-w-115">
              <Icon name="search" />
              <span className="sr-only">{tx('ابحث في المكتبة', 'Search the library')}</span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setParam('q', e.target.value.trim())
                }}
                placeholder={tx(
                  'ابحث عن كتاب في التربية أو علم النفس…',
                  'Search parenting or psychology books…',
                )}
                className="min-w-0 flex-1 border-0 bg-transparent text-base text-text outline-none"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label={tx('نوع النسخة', 'Edition type')}
                className="flex gap-1 rounded-field border border-line bg-white p-1"
              >
                {FORMAT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={format === t.id}
                    onClick={() => setParam('format', t.id)}
                    className="min-h-10 rounded-[10px] px-4 font-semibold text-text-2 aria-selected:bg-navy aria-selected:text-white"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {active.length > 0 && (
                <PricePill
                  currency={currency}
                  maxPrice={maxBookPrice}
                  min={minPrice}
                  max={maxPrice}
                  resultCount={shown.length}
                  onChange={(min, max) =>
                    setParamsMap({
                      min: min === undefined ? '' : String(min),
                      max: max === undefined ? '' : String(max),
                    })
                  }
                />
              )}
            </div>
          </div>

          {usedCategories.length > 1 && (
            <div
              role="tablist"
              aria-label={tx('الأقسام', 'Categories')}
              className="mb-8 flex flex-wrap gap-2.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!cat}
                className={pillTabClass}
                onClick={() => setParam('cat', '')}
              >
                {tx('كل الأقسام', 'All categories')}
              </button>
              {usedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={cat === c.id}
                  className={pillTabClass}
                  onClick={() => setParam('cat', c.id)}
                >
                  {loc(c.nameAr, c.nameEn)}
                </button>
              ))}
            </div>
          )}

          {books.isError ? (
            <ErrorState onRetry={() => books.refetch()} />
          ) : books.isLoading ? (
            <div className={booksGridClass}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-95 skeleton rounded-card" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <EmptyState
              icon="book"
              title={
                active.length
                  ? tx('مفيش كتب بالمواصفات دي', 'No books match these filters')
                  : tx('المكتبة بتتجهّز', 'The library is being prepared')
              }
              body={
                active.length
                  ? hasPrice
                    ? tx(
                        'وسّع نطاق السعر، أو جرّب كلمة تانية أو نوع نسخة مختلف.',
                        'Widen the price range, or try another word or edition type.',
                      )
                    : tx('جرّب كلمة تانية أو نوع نسخة مختلف.', 'Try another word or edition type.')
                  : tx('أول الكتب هتنزل هنا قريب.', 'The first books will be here soon.')
              }
            />
          ) : (
            <div className={cn(booksGridClass, 'stagger')}>
              {shown.map((b) => (
                <BookCard key={b.id} book={b} showCategory />
              ))}
            </div>
          )}
        </div>
      </section>

      <StoreTeaser />
    </>
  )
}

function FeaturedBook({ book }: { book: Book }) {
  const { currency } = useRegion()
  const formats = activeFormats(book)
  const [head, ...tail] = loc(book.titleAr, book.titleEn).split(' ')
  return (
    <div className="relative flex flex-wrap items-center gap-10 overflow-hidden rounded-panel bg-linear-120 from-[#fffaf0] via-white to-[#fdf3e1] px-14 py-11 text-text shadow-[0_30px_60px_-30px_rgba(5,20,40,.5)] max-md:px-6 max-md:py-8">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
        <span className="bg-gold self-start rounded-full px-3 py-1 text-[13px] font-extrabold text-navy">
          {tx('الكتاب الأكثر مبيعًا', 'Best-selling book')}
        </span>
        <h2 className="text-[clamp(28px,3.5vw,40px)]">
          <Highlight text={tail.length ? `${head} *${tail.join(' ')}*` : head} />
        </h2>
        <p className="line-clamp-3 leading-loose text-muted">{loc(book.descriptionAr, book.descriptionEn)}</p>
        <div className="flex flex-wrap gap-2.5">
          {formats.map((f) => {
            const p = formatPrice(f, book, currency).current
            return (
              <span
                key={f.id}
                className="flex flex-col rounded-xl border border-line bg-white px-3.5 py-2 text-center"
              >
                <b className="text-ink">{FORMAT_LABEL[f.formatType]}</b>
                {p != null && (
                  <span className="text-[13px] font-bold text-gold-ink">{formatMoney(p, currency)}</span>
                )}
              </span>
            )
          })}
        </div>
        <Link
          to={routes.book(book.slug)}
          className={buttonClass({ variant: 'navy', className: 'self-start' })}
        >
          {tx('اختار النسخة واطلب', 'Choose an edition and order')} <Icon name="arrowLeft" />
        </Link>
      </div>
      <div className="relative flex flex-[0_1_340px] justify-center max-md:hidden">
        <div className="absolute top-1/2 left-1/2 size-80 -translate-1/2 animate-spin-slow rounded-full border-2 border-dashed border-gold/40" />
        <BookCoverArt book={book} className="relative h-auto max-h-90 w-60 tilt" />
      </div>
    </div>
  )
}

function StoreTeaser() {
  const { data } = useQuery({
    queryKey: ['products', 'list', { limit: 4, isHomeDisplay: true }],
    queryFn: () => productsApi.list({ limit: 4, isHomeDisplay: true }),
  })
  const products = data?.products ?? []
  if (!products.length) return null
  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          eyebrow={tx('منتجات المنصة', 'Platform products')}
          icon="box"
          title={<Highlight text={tx('أدوات تربوية *للبيت*', 'Parenting tools *for home*')} />}
          more={{ to: routes.store, label: tx('كل المنتجات', 'All products') }}
        />
        <div className={productsGridClass}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
