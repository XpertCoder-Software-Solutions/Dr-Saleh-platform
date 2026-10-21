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
import { RangeSlider } from '@/components/ui/RangeSlider'
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
  // Highest course price for the slider. Older APIs don't send priceBounds, so fall back to
  // reading the (small) course list once.
  const allPrices = useQuery({
    queryKey: ['courses', 'list', { limit: 100 }],
    queryFn: () => coursesApi.list({ limit: 100 }),
    enabled: total.isSuccess && !total.data?.priceBounds,
    staleTime: 10 * 60_000,
  })
  const maxCoursePrice =
    total.data?.priceBounds?.[currency].max ??
    Math.max(0, ...(allPrices.data?.courses ?? []).map((c) => (currency === 'USD' ? c.priceUSD : c.priceEGP)))

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
                maxPrice={maxCoursePrice}
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

const STEP: Record<Currency, number> = { EGP: 1, USD: 0.5 }

/** Price range slider ("من" / "إلى") over the prices that actually exist, plus typed boxes. */
function PriceFilter({
  currency,
  maxPrice,
  min,
  max,
  onChange,
}: {
  currency: Currency
  /** Highest course price; the slider runs from 0 to this. */
  maxPrice: number
  min?: number
  max?: number
  onChange: (min?: number, max?: number) => void
}) {
  const step = STEP[currency]
  const floor = 0
  const ceil = Math.max(step, Math.ceil(maxPrice / step) * step)
  const applied: [number, number] = [min ?? floor, max ?? ceil]
  const [draft, setDraft] = useState<[number, number]>(applied)
  const [boxes, setBoxes] = useState(['', ''])
  const key = `${applied[0]}|${applied[1]}|${floor}|${ceil}`
  const [last, setLast] = useState(key)
  if (last !== key) {
    setLast(key)
    setDraft(applied)
    setBoxes(['', ''])
  }
  const active = min !== undefined || max !== undefined
  const fmt = (n: number) => formatMoney(n, currency)

  function commit([a, b]: [number, number]) {
    const lo = Math.max(floor, Math.min(a, b))
    const hi = Math.min(ceil, Math.max(a, b))
    // The full range means "no price filter".
    onChange(lo <= floor ? undefined : lo, hi >= ceil ? undefined : hi)
  }

  function boxValue(i: 0 | 1) {
    return boxes[i] !== '' ? boxes[i] : String(draft[i])
  }

  function applyBoxes() {
    const parse = (i: 0 | 1) => {
      const n = Number(boxValue(i).replace(/[^\d.]/g, ''))
      return Number.isFinite(n) ? n : draft[i]
    }
    commit([parse(0), parse(1)])
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink">السعر</span>
        {active && (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-sm font-bold text-blue-500"
            onClick={() => onChange(undefined, undefined)}
          >
            كل الأسعار
          </button>
        )}
      </div>
      {maxPrice <= 0 ? (
        <div className="h-24 skeleton" aria-label="جاري تحميل الأسعار" />
      ) : (
        <>
          <p className="-mt-1 text-sm text-text-2" aria-live="polite">
            من <b className="text-ink">{fmt(draft[0])}</b> إلى <b className="text-ink">{fmt(draft[1])}</b>
          </p>
          <RangeSlider
            min={floor}
            max={ceil}
            step={step}
            value={draft}
            onChange={setDraft}
            onCommit={commit}
            formatValue={fmt}
            labels={['أقل سعر', 'أعلى سعر']}
          />
          <form
            className="grid grid-cols-[1fr_auto_1fr] items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              applyBoxes()
            }}
            aria-label="اكتب السعر"
          >
            {([0, 1] as const).map((i) => (
              <label key={i} className={cn('flex flex-col gap-1', i === 1 && 'col-start-3')}>
                <span className="text-xs font-semibold text-muted">{i === 0 ? 'من' : 'إلى'}</span>
                <span className="flex h-11 items-center gap-1 rounded-xl border-[1.5px] border-line-2 bg-white px-2.5 focus-within:border-blue-400">
                  <input
                    inputMode="decimal"
                    value={boxValue(i)}
                    onChange={(e) =>
                      setBoxes((b) => (i === 0 ? [e.target.value, b[1]] : [b[0], e.target.value]))
                    }
                    onBlur={applyBoxes}
                    className="w-full min-w-0 border-0 bg-transparent text-center text-[15px] font-semibold text-ink outline-none"
                  />
                  <span className="flex-none text-xs text-muted">{currency === 'USD' ? '$' : 'ج.م'}</span>
                </span>
              </label>
            ))}
            <span className="col-start-2 row-start-1 pb-3 text-muted" aria-hidden="true">
              –
            </span>
            <button type="submit" className="sr-only">
              تطبيق
            </button>
          </form>
        </>
      )}
    </div>
  )
}
