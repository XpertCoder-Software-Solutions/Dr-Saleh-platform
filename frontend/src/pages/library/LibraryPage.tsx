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
import { formatEGP } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Book, BookFormatType } from '@/types/api'

const FORMAT_TABS: { id: '' | BookFormatType; label: string }[] = [
  { id: '', label: 'الكل' },
  { id: 'Physical', label: 'ورقي' },
  { id: 'Digital', label: 'رقمي' },
  { id: 'Audio', label: 'صوتي' },
]

export function LibraryPage() {
  usePageTitle('المكتبة')
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') ?? ''
  const format = (params.get('format') ?? '') as '' | BookFormatType
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
  const shown = useMemo(() => {
    const q = search.trim()
    return active.filter(
      (b) =>
        (!cat || b.categoryId === cat) &&
        (!format || b.formats.some((f) => f.isActive && f.formatType === format)) &&
        (!q || b.titleAr.includes(q) || b.descriptionAr.includes(q)),
    )
  }, [active, cat, format, search])
  const usedCategories = (categories.data ?? []).filter((c) => active.some((b) => b.categoryId === c.id))

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(params)
    if (value) p.set(key, value)
    else p.delete(key)
    setParams(p, { replace: true })
  }

  return (
    <>
      <PageHero
        portrait={false}
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'المكتبة' }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            ورقي · رقمي PDF · صوتي
          </>
        }
        title={
          <>
            اقرأ… أو <span className="text-sheen">اسمع وانت في الطريق</span>
          </>
        }
        body="كتب الدكتور صالح في التربية وعلم النفس. النسخة الورقية بتوصلك لحد البيت، والرقمية والصوتية فورًا بعد الدفع."
      >
        {featured && <FeaturedBook book={featured} />}
      </PageHero>

      <section className={cn(sectionClass, 'pt-8')}>
        <div className={innerClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-13 flex-[1_1_320px] items-center gap-2.5 rounded-field border-[1.5px] border-line bg-white px-4 text-muted focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(61,155,216,.15)] md:max-w-115">
              <Icon name="search" />
              <span className="sr-only">ابحث في المكتبة</span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setParam('q', e.target.value.trim())
                }}
                placeholder="ابحث عن كتاب في التربية أو علم النفس…"
                className="min-w-0 flex-1 border-0 bg-transparent text-base text-text outline-none"
              />
            </label>
            <div
              role="tablist"
              aria-label="نوع النسخة"
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
          </div>

          {usedCategories.length > 1 && (
            <div role="tablist" aria-label="الأقسام" className="mb-8 flex flex-wrap gap-2.5">
              <button
                type="button"
                role="tab"
                aria-selected={!cat}
                className={pillTabClass}
                onClick={() => setParam('cat', '')}
              >
                كل الأقسام
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
                  {c.nameAr}
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
              title={active.length ? 'مفيش كتب بالمواصفات دي' : 'المكتبة بتتجهّز'}
              body={active.length ? 'جرّب كلمة تانية أو نوع نسخة مختلف.' : 'أول الكتب هتنزل هنا قريب.'}
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
  const formats = activeFormats(book)
  const [head, ...tail] = book.titleAr.split(' ')
  return (
    <div className="relative flex flex-wrap items-center gap-10 overflow-hidden rounded-panel bg-linear-120 from-[#fffaf0] via-white to-[#fdf3e1] px-14 py-11 text-text shadow-[0_30px_60px_-30px_rgba(5,20,40,.5)] max-md:px-6 max-md:py-8">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
        <span className="bg-gold self-start rounded-full px-3 py-1 text-[13px] font-extrabold text-navy">
          الكتاب الأكثر مبيعًا
        </span>
        <h2 className="text-[clamp(28px,3.5vw,40px)]">
          <Highlight text={tail.length ? `${head} *${tail.join(' ')}*` : head} />
        </h2>
        <p className="line-clamp-3 leading-loose text-muted">{book.descriptionAr}</p>
        <div className="flex flex-wrap gap-2.5">
          {formats.map((f) => {
            const p = formatPrice(f, book).current
            return (
              <span
                key={f.id}
                className="flex flex-col rounded-xl border border-line bg-white px-3.5 py-2 text-center"
              >
                <b className="text-ink">{FORMAT_LABEL[f.formatType]}</b>
                {p != null && <span className="text-[13px] font-bold text-gold-ink">{formatEGP(p)}</span>}
              </span>
            )
          })}
        </div>
        <Link
          to={routes.book(book.slug)}
          className={buttonClass({ variant: 'navy', className: 'self-start' })}
        >
          اختار النسخة واطلب <Icon name="arrowLeft" />
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
          eyebrow="منتجات المنصة"
          icon="box"
          title={<Highlight text="أدوات تربوية *للبيت*" />}
          more={{ to: routes.store, label: 'كل المنتجات' }}
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
