import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { coursesApi } from '@/api/endpoints'
import { useWishlist } from '@/api/wishlist'
import { useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { CTABand } from '@/components/layout/CTABand'
import { CourseCard, CourseCardSkeleton } from '@/components/course/CourseCard'
import { catalogGridClass } from '@/components/course/grid'
import { Icon } from '@/components/ui/Icon'
import { Pager } from '@/components/ui/Pager'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRegion, type Currency } from '@/lib/region'
import { formatMoney } from '@/lib/format'

const PAGE_SIZE = 9

const chip = 'inline-flex min-h-13 items-center gap-2 rounded-field px-4 text-[15px] font-bold max-sm:hidden'
const categoryBtn =
  'min-h-11 rounded-xl border-0 bg-surface px-3.5 text-start text-[15px] font-semibold text-ink transition-colors hover:bg-hover ' +
  'aria-checked:bg-navy aria-checked:text-white'

export function CoursesPage() {
  usePageTitle('الدورات')
  const t = useCopy()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const categoryId = params.get('cat') ?? ''
  const { currency } = useRegion()
  const minPrice = priceParam(params.get('min'))
  const maxPrice = priceParam(params.get('max'))
  const hasPrice = minPrice !== undefined || maxPrice !== undefined
  const page = Math.max(1, Number(params.get('page')) || 1)

  // The input follows the URL (back/forward, clear filters) but stays editable.
  const [draft, setDraft] = useState(search)
  const [lastSearch, setLastSearch] = useState(search)
  if (lastSearch !== search) {
    setLastSearch(search)
    setDraft(search)
  }

  const query = {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    categoryId: categoryId || undefined,
    minPrice,
    maxPrice,
    priceCurrency: hasPrice ? currency : undefined,
  }
  const list = useQuery({
    queryKey: ['courses', 'list', query],
    queryFn: () => coursesApi.list(query),
    placeholderData: keepPreviousData,
  })
  const categories = useQuery({
    queryKey: ['courses', 'categories'],
    queryFn: coursesApi.categories,
    staleTime: 10 * 60_000,
  })
  const total = useQuery({
    queryKey: ['courses', 'list', { limit: 1 }],
    queryFn: () => coursesApi.list({ limit: 1 }),
  })
  const wishlist = useWishlist('COURSE')

  function update(next: Record<string, string | null>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p)
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    update({ q: draft.trim() || null, page: null })
  }

  const courses = list.data?.courses ?? []
  const pagination = list.data?.pagination
  const totalCount = total.data?.pagination.total
  const filtered = Boolean(search || categoryId || hasPrice)
  const clearAll = () => setParams(new URLSearchParams())

  return (
    <>
      <PageHero
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'الدورات' }]}
        eyebrow={
          totalCount ? (
            <>
              <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
              {totalCount} دورات مسجّلة بشهادة
            </>
          ) : undefined
        }
        title={
          <>
            دورات تبني <span className="text-sheen">شخصية ابنك</span>
          </>
        }
        body={t('courses.hero.body')}
      >
        <form
          className="flex flex-wrap gap-2.5 rounded-card bg-white p-2.5 shadow-[0_30px_60px_-30px_rgba(5,20,40,.6)]"
          role="search"
          onSubmit={onSearch}
        >
          <label className="flex min-h-13 flex-[1_1_320px] items-center gap-2.5 rounded-field border-[1.5px] border-line px-4 text-muted transition-[border-color,box-shadow] focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(61,155,216,.15)]">
            <Icon name="search" />
            <span className="sr-only">ابحث عن دورة</span>
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ابحث عن دورة في التربية أو تطوير الذات…"
              className="min-w-0 flex-1 border-0 bg-transparent text-base text-text outline-none"
            />
          </label>
          <span className={cn(chip, 'bg-surface-blue text-ink')}>
            <Icon name="video" size={18} /> فيديو + PDF
          </span>
          <span className={cn(chip, 'bg-gold-soft text-gold-ink')}>
            <Icon name="award" size={18} /> شهادة لكل دورة
          </span>
          <button
            type="submit"
            className={buttonClass({ variant: 'navy', className: 'max-sm:flex-[1_1_100%]' })}
          >
            بحث
          </button>
        </form>
      </PageHero>

      <section className={cn(sectionClass, 'pt-8')}>
        <div className={cn(innerClass, 'grid grid-cols-[260px_1fr] items-start gap-7 max-md:grid-cols-1')}>
          <aside className="sticky top-27 flex flex-col gap-4.5 max-md:static" aria-label="تصفية النتائج">
            <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <b className="font-head text-lg text-ink">تصفية النتائج</b>
                {filtered && (
                  <button
                    type="button"
                    className="border-0 bg-transparent font-bold text-blue-500"
                    onClick={clearAll}
                  >
                    مسح
                  </button>
                )}
              </div>
              <span className="mt-1 text-sm font-bold text-ink">التصنيف</span>
              <div
                className="flex flex-col gap-1.5 max-md:flex-row max-md:flex-wrap"
                role="radiogroup"
                aria-label="التصنيف"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={!categoryId}
                  className={categoryBtn}
                  onClick={() => update({ cat: null, page: null })}
                >
                  كل الدورات
                </button>
                {(categories.data ?? []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={categoryId === c.id}
                    className={categoryBtn}
                    onClick={() => update({ cat: c.id, page: null })}
                  >
                    {c.nameAr}
                  </button>
                ))}
              </div>
              <PriceFilter
                currency={currency}
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

            <div className="relative flex min-h-37.5 flex-col gap-2 overflow-hidden rounded-card bg-linear-160 from-gold-soft to-gold-light py-5 ps-5 pe-24 max-md:hidden">
              <b className="font-head text-ink">مش عارف تبدأ بإيه؟</b>
              <p className="text-sm leading-[1.7] text-[#6b4a14]">
                اطلب استشارة قصيرة ونرشّحلك المسار المناسب لابنك.
              </p>
              <Link
                to={routes.consultation}
                className="relative z-1 mt-auto inline-flex items-center gap-1.5 font-bold text-navy hover:text-ink"
              >
                {t('cta.bookNow')} <Icon name="arrowLeft" size={16} />
              </Link>
              <img
                src="/assets/brand/saleh-cutout.webp"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute bottom-0 -left-1.5 h-32.5 w-auto"
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex min-h-11 items-center justify-between text-muted" aria-live="polite">
              {pagination && (
                <span>
                  <b className="text-ink">{pagination.total}</b> دورة متاحة
                  {search && <> لـ «{search}»</>}
                </span>
              )}
            </div>

            {list.isError ? (
              <ErrorState onRetry={() => list.refetch()} />
            ) : list.isLoading ? (
              <div className={catalogGridClass}>
                {Array.from({ length: 6 }, (_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <EmptyState
                icon="search"
                title={filtered ? 'مفيش دورات بالمواصفات دي' : 'الدورات جاية قريب'}
                body={filtered ? 'جرّب كلمة تانية أو امسح الفلاتر.' : 'بنجهّز أول دفعة من الدورات.'}
                action={
                  filtered && (
                    <button
                      type="button"
                      className={buttonClass({ variant: 'outline', size: 'sm' })}
                      onClick={clearAll}
                    >
                      مسح الفلاتر
                    </button>
                  )
                }
              />
            ) : (
              <div
                className={cn(catalogGridClass, 'transition-opacity', list.isPlaceholderData && 'opacity-55')}
              >
                {courses.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    variant="catalog"
                    wishlisted={wishlist.has(c.id)}
                    onToggleWishlist={wishlist.toggle}
                  />
                ))}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <Pager
                pagination={pagination}
                noun="دورة"
                onChange={(p) => {
                  update({ page: p > 1 ? String(p) : null })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            )}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  )
}

function priceParam(v: string | null): number | undefined {
  if (v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Ready-made ranges per currency; the last one has no upper bound. */
const PRICE_RANGES: Record<Currency, { min?: number; max?: number }[]> = {
  EGP: [{ min: 0, max: 0 }, { min: 1, max: 300 }, { min: 300, max: 600 }, { min: 600 }],
  USD: [{ min: 0, max: 0 }, { min: 0.01, max: 10 }, { min: 10, max: 20 }, { min: 20 }],
}

function rangeLabel(r: { min?: number; max?: number }, currency: Currency) {
  if (r.max === 0) return 'مجانًا'
  if (r.max === undefined) return `أكتر من ${formatMoney(r.min ?? 0, currency)}`
  if (!r.min || r.min <= 1) return `لحد ${formatMoney(r.max, currency)}`
  return `${formatMoney(r.min, currency)} – ${formatMoney(r.max, currency)}`
}

function PriceFilter({
  currency,
  min,
  max,
  onChange,
}: {
  currency: Currency
  min?: number
  max?: number
  onChange: (min?: number, max?: number) => void
}) {
  const ranges = PRICE_RANGES[currency]
  const isRange = (r: { min?: number; max?: number }) => r.min === min && r.max === max
  // The boxes show only a hand-typed range, not one of the ready-made ones.
  const boxValue = (v?: number) => (v === undefined || ranges.some(isRange) ? '' : String(v))
  const [from, setFrom] = useState(boxValue(min))
  const [to, setTo] = useState(boxValue(max))
  const [last, setLast] = useState(`${min}|${max}`)
  if (last !== `${min}|${max}`) {
    setLast(`${min}|${max}`)
    setFrom(boxValue(min))
    setTo(boxValue(max))
  }
  const custom = (min !== undefined || max !== undefined) && !ranges.some(isRange)
  const num = (v: string) => (v.trim() === '' ? undefined : Math.max(0, Number(v.replace(/[^\d.]/g, '')) || 0))

  return (
    <>
      <span className="mt-2 text-sm font-bold text-ink">السعر</span>
      <div className="flex flex-col gap-1.5 max-md:flex-row max-md:flex-wrap" role="radiogroup" aria-label="السعر">
        <button
          type="button"
          role="radio"
          aria-checked={min === undefined && max === undefined}
          className={categoryBtn}
          onClick={() => onChange(undefined, undefined)}
        >
          كل الأسعار
        </button>
        {ranges.map((r) => (
          <button
            key={`${r.min}-${r.max}`}
            type="button"
            role="radio"
            aria-checked={isRange(r)}
            className={categoryBtn}
            onClick={() => onChange(r.min, r.max)}
          >
            {rangeLabel(r, currency)}
          </button>
        ))}
      </div>
      <form
        className={cn('mt-1 flex items-center gap-2 rounded-xl p-1', custom && 'bg-surface-blue')}
        onSubmit={(e) => {
          e.preventDefault()
          const a = num(from)
          const b = num(to)
          if (a !== undefined && b !== undefined && a > b) onChange(b, a)
          else onChange(a, b)
        }}
        aria-label="سعر مخصص"
      >
        <input
          inputMode="decimal"
          placeholder="من"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label={`أقل سعر (${currency === 'USD' ? 'دولار' : 'جنيه'})`}
          className="h-10 w-full min-w-0 rounded-[10px] border-[1.5px] border-line-2 bg-white px-2.5 text-center text-sm outline-none focus:border-blue-400"
        />
        <span className="text-muted">–</span>
        <input
          inputMode="decimal"
          placeholder="إلى"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label={`أعلى سعر (${currency === 'USD' ? 'دولار' : 'جنيه'})`}
          className="h-10 w-full min-w-0 rounded-[10px] border-[1.5px] border-line-2 bg-white px-2.5 text-center text-sm outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          className="h-10 flex-none rounded-[10px] border-0 bg-navy px-3 text-sm font-bold text-white"
        >
          تطبيق
        </button>
      </form>
    </>
  )
}
