import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { articlesApi, booksApi, coursesApi, productsApi } from '@/api/endpoints'
import { useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { BookCoverArt } from '@/components/catalog/BookCard'
import { CourseCard } from '@/components/course/CourseCard'
import { courseGridClass } from '@/components/course/grid'
import { HeroWave } from '@/components/layout/PageHero'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { EmptyState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { bookStartPrice, productPrice } from '@/lib/catalog'
import { formatMoney, minutesLabel, readingMinutes } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRegion } from '@/lib/region'

type Tab = 'all' | 'courses' | 'articles' | 'shop'

const SUGGESTIONS = ['العناد', 'المراهقة', 'الغضب', 'المذاكرة', 'الثقة بالنفس']

const rowClass =
  'flex items-center gap-3.5 border-t border-divider py-3.5 first:border-t-0 text-text hover:text-text'

/** One search box across courses, articles, books and products. */
export function SearchPage() {
  const { currency } = useRegion()
  const t = useCopy()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const [draft, setDraft] = useState(q)
  const [lastQ, setLastQ] = useState(q)
  if (lastQ !== q) {
    setLastQ(q)
    setDraft(q)
  }
  const [tab, setTab] = useState<Tab>('all')
  usePageTitle(q ? `البحث: ${q}` : 'البحث')

  const enabled = q.length > 1
  const courses = useQuery({
    queryKey: ['search', 'courses', q],
    queryFn: () => coursesApi.list({ search: q, limit: 6 }),
    enabled,
  })
  const articles = useQuery({
    queryKey: ['search', 'articles', q],
    queryFn: () => articlesApi.list({ search: q, limit: 6 }),
    enabled,
  })
  const products = useQuery({
    queryKey: ['search', 'products', q],
    queryFn: () => productsApi.list({ search: q, limit: 6 }),
    enabled,
  })
  const books = useQuery({ queryKey: ['books'], queryFn: booksApi.list, enabled })

  const bookHits = useMemo(
    () =>
      (books.data ?? [])
        .filter((b) => b.isActive && (b.titleAr.includes(q) || b.descriptionAr.includes(q)))
        .slice(0, 6),
    [books.data, q],
  )
  const courseHits = courses.data?.courses ?? []
  const articleHits = articles.data?.articles ?? []
  const productHits = products.data?.products ?? []
  const counts = {
    courses: courses.data?.pagination.total ?? 0,
    articles: articles.data?.pagination.total ?? 0,
    shop: bookHits.length + (products.data?.pagination.total ?? 0),
  }
  const total = counts.courses + counts.articles + counts.shop
  const loading =
    enabled && (courses.isLoading || articles.isLoading || products.isLoading || books.isLoading)

  function submit(e: FormEvent) {
    e.preventDefault()
    setParams(draft.trim() ? { q: draft.trim() } : {})
  }

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'all', label: 'الكل', n: total },
    { id: 'courses', label: 'دورات', n: counts.courses },
    { id: 'articles', label: 'مقالات', n: counts.articles },
    { id: 'shop', label: 'كتب ومنتجات', n: counts.shop },
  ]
  const show = (x: Tab) => tab === 'all' || tab === x

  return (
    <>
      <section className="relative bg-navy overflow-hidden px-6 pt-33.5 pb-24 text-white max-sm:px-4">
        <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-140 flex-col items-center gap-5 text-center">
          <h1 className="text-[clamp(30px,4.5vw,46px)] text-white">
            {q ? (
              <>
                نتائج البحث عن «<span className="text-sheen">{q}</span>»
              </>
            ) : (
              'بتدوّر على إيه؟'
            )}
          </h1>
          <form
            role="search"
            onSubmit={submit}
            className="flex w-full gap-2 rounded-card bg-white p-2 shadow-pop"
          >
            <label className="flex min-h-12 flex-1 items-center gap-2.5 px-3 text-muted">
              <Icon name="search" />
              <span className="sr-only">بحث</span>
              <input
                type="search"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('search.placeholder')}
                className="min-w-0 flex-1 border-0 bg-transparent text-lg text-text outline-none"
              />
            </label>
            <button type="submit" className={buttonClass({ variant: 'gold' })}>
              بحث
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-on-dark-muted">
            الأكثر بحثًا:
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setParams({ q: s })}
                className="rounded-full px-3 py-1 text-white glass hover:bg-white/15"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <HeroWave />
      </section>

      <section className={cn(sectionClass, 'pt-6')}>
        <div className={cn(innerClass, 'flex flex-col gap-8')}>
          {!enabled ? (
            <EmptyState
              icon="search"
              title="اكتب كلمتين عن اللي محتاجه"
              body="هندوّر لك في الدورات والمقالات والكتب والمنتجات مرة واحدة."
            />
          ) : loading ? (
            <div className="flex justify-center py-16 text-blue-600">
              <Spinner />
            </div>
          ) : total === 0 ? (
            <EmptyState
              icon="search"
              title={`مفيش نتائج لـ «${q}»`}
              body="جرّب كلمة أبسط، أو اختار من الأكثر بحثًا فوق."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white p-2.5">
                <div role="tablist" className="flex flex-wrap gap-1.5">
                  {tabs.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === x.id}
                      onClick={() => setTab(x.id)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-bold text-ink aria-selected:bg-navy aria-selected:text-white"
                    >
                      {x.label} <span className="text-xs opacity-70">{x.n}</span>
                    </button>
                  ))}
                </div>
                <span className="px-2 text-sm text-muted">
                  <b className="text-ink">{total}</b> نتيجة
                </span>
              </div>

              {show('courses') && courseHits.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl">الدورات</h2>
                    <Link to={`${routes.courses}?q=${encodeURIComponent(q)}`} className="text-sm font-bold">
                      كل الدورات <Icon name="arrowLeft" size={14} className="inline" />
                    </Link>
                  </div>
                  <div className={courseGridClass}>
                    {courseHits.map((c) => (
                      <CourseCard key={c.id} course={c} />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 items-start gap-6 max-lg:grid-cols-1">
                {show('articles') && articleHits.length > 0 && (
                  <div className="rounded-card border border-line bg-white p-5">
                    <h2 className="mb-2 text-2xl">مقالات</h2>
                    {articleHits.map((a) => (
                      <Link key={a.id} to={routes.article(a.slug)} className={rowClass}>
                        <span className="flex size-12 flex-none bg-navy items-center justify-center rounded-xl text-white">
                          <Icon name="pen" size={18} />
                        </span>
                        <span className="flex flex-col">
                          <b className="text-ink">{a.title}</b>
                          <span className="text-xs text-muted">
                            {a.category?.name} · {minutesLabel(readingMinutes(a.content ?? a.shortContent))}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {show('shop') && (bookHits.length > 0 || productHits.length > 0) && (
                  <div className="rounded-card border border-line bg-white p-5">
                    <h2 className="mb-2 text-2xl">كتب ومنتجات</h2>
                    {bookHits.map((b) => (
                      <Link key={b.id} to={routes.book(b.slug)} className={rowClass}>
                        <BookCoverArt book={b} size="sm" />
                        <span className="flex flex-1 flex-col">
                          <b className="text-ink">{b.titleAr}</b>
                          <span className="text-xs text-muted">كتاب</span>
                        </span>
                        {bookStartPrice(b, currency) != null && (
                          <b className="text-ink">من {formatMoney(bookStartPrice(b, currency), currency)}</b>
                        )}
                      </Link>
                    ))}
                    {productHits.map((p) => (
                      <Link key={p.id} to={routes.product(p.slug)} className={rowClass}>
                        <span className="flex size-12 flex-none bg-gold items-center justify-center rounded-xl text-navy">
                          <Icon name="box" size={18} />
                        </span>
                        <span className="flex flex-1 flex-col">
                          <b className="text-ink">{p.name}</b>
                          <span className="text-xs text-muted">منتج · {p.category?.nameAr}</span>
                        </span>
                        <b className="text-ink">{formatMoney(productPrice(p, currency).current, currency)}</b>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
