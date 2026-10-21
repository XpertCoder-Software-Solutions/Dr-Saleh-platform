import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiClientError, resolveAssetUrl } from '@/api/client'
import { RichText } from '@/components/ui/RichText'
import { richToPlain } from '@/lib/richText'
import { resetCartCache } from '@/api/cart'
import { useMyCourses } from '@/api/account'
import { coursesApi } from '@/api/endpoints'
import { useWishlist } from '@/api/wishlist'
import { useAuth, useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { CourseCover } from '@/components/course/CourseCover'
import { CTABand } from '@/components/layout/CTABand'
import { Breadcrumbs, HeroWave } from '@/components/layout/PageHero'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, inputClass, innerClass, sectionClass } from '@/components/ui/button'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { coursePrice, durationLabel, formatDate, formatMoney, lessonsLabel } from '@/lib/format'
import { useRegion } from '@/lib/region'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Course, CourseReview, CourseSection } from '@/types/api'
import { NotFoundPage } from '@/pages/NotFoundPage'

type Tab = 'info' | 'content' | 'reviews'

const stateWrap = 'flex min-h-[70vh] items-center justify-center px-6 pt-34.5 pb-15 text-blue-600'

export function CourseDetailsPage() {
  // The URL holds the course slug (or its id, for older links).
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courses', 'detail', id],
    queryFn: () => coursesApi.byId(id),
    enabled: Boolean(id),
    retry: (count, err) => !(err instanceof ApiClientError && err.statusCode === 404) && count < 2,
  })
  usePageTitle(course?.titleAr ?? 'الدورة')

  // Old id links move to the readable slug URL.
  useEffect(() => {
    if (course?.slug && id !== course.slug) {
      navigate(`${routes.course(course.slug)}${location.search}${location.hash}`, { replace: true })
    }
  }, [course?.slug, id, navigate, location.search, location.hash])

  if (!id || (error instanceof ApiClientError && error.statusCode === 404)) return <NotFoundPage />

  if (isError) {
    return (
      <div className={stateWrap}>
        <div className="w-full max-w-140">
          <ErrorState onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  if (isLoading || !course) {
    return (
      <div className={stateWrap}>
        <Spinner />
      </div>
    )
  }

  return <CourseDetails course={course} />
}

function Card({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <article
      id={id}
      className={cn(
        'flex scroll-mt-44 flex-col gap-4 rounded-card border border-line bg-white p-7 max-sm:p-5',
        className,
      )}
    >
      {children}
    </article>
  )
}

function CourseDetails({ course }: { course: Course }) {
  const [tab, setTab] = useState<Tab>('info')
  const [showPromo, setShowPromo] = useState(false)
  const sections = useMemo(
    () =>
      [...(course.sections ?? [])]
        .filter((s) => s.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((s) => ({
          ...s,
          lessons: [...(s.lessons ?? [])]
            .filter((l) => l.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder),
        })),
    [course.sections],
  )
  const lessonsCount = course.lessonsCount ?? sections.reduce((n, s) => n + s.lessons.length, 0)
  const seconds =
    course.totalDurationSeconds ??
    sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.videoDurationSeconds ?? 0), 0), 0)
  const category = course.category?.nameAr
  const [titleHead, ...titleTail] = course.titleAr.split(' ')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'info', label: 'معلومات الدورة' },
    { id: 'content', label: 'محتوى الدورة' },
    { id: 'reviews', label: 'التقييمات' },
  ]

  function goTo(t: Tab) {
    setTab(t)
    document.getElementById(`cd-${t}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="relative bg-navy overflow-hidden px-6 pt-33.5 pb-37.5 text-white max-lg:pb-22.5 max-sm:px-4">
        <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
        {/* leaves room for the buy card on the left at desktop widths */}
        <div className="relative mx-auto flex max-w-site flex-col gap-4 lg:*:max-w-[calc(100%-320px)]">
          <Breadcrumbs
            crumbs={[
              { label: 'الرئيسية', to: routes.home },
              { label: 'الدورات', to: routes.courses },
              { label: course.titleAr },
            ]}
          />
          {category && (
            <span className="inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-bold glass">
              <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
              {course.isFeatured ? 'الأكثر طلبًا · ' : ''}
              {category}
            </span>
          )}
          <h1 className="animate-rise text-[clamp(32px,5vw,52px)] leading-tight text-white">
            {titleHead} <span className="text-sheen">{titleTail.join(' ')}</span>
          </h1>
          <p className="max-w-180 animate-rise text-lg leading-[1.85] text-on-dark [animation-delay:.1s]">
            {richToPlain(course.shortDescriptionAr)}
          </p>
          <div className="flex animate-rise flex-wrap gap-x-5.5 gap-y-2.5 text-[15px] text-on-dark-muted [animation-delay:.2s] *:inline-flex *:items-center *:gap-1.5">
            {course.ratingAverage != null && (
              <span>
                <b className="text-lg text-white">{course.ratingAverage}</b>
                <Stars
                  value={Math.round(course.ratingAverage)}
                  className="text-gold-light"
                  dim="text-white/25"
                />
                <span>({course.ratingCount} تقييم)</span>
              </span>
            )}
            {lessonsCount > 0 && (
              <span>
                <Icon name="video" size={16} /> {lessonsLabel(lessonsCount)}
              </span>
            )}
            {seconds > 0 && (
              <span>
                <Icon name="clock" size={16} /> {durationLabel(seconds)}
              </span>
            )}
          </div>
          <div className="flex animate-rise items-center gap-3 [animation-delay:.3s]">
            <span className="size-13 flex-none bg-gold overflow-hidden rounded-full border-2 border-white/60">
              <img
                src="/assets/brand/saleh-cutout.webp"
                alt=""
                className="h-[130%] w-full object-cover object-top"
              />
            </span>
            <span className="flex flex-col">
              <b>د. صالح عبد الكريم</b>
              <small className="text-on-dark-muted">المستشار النفسي والتربوي</small>
            </span>
          </div>
        </div>
        <HeroWave />
      </section>

      <section className={cn(sectionClass, 'relative')}>
        <div className={cn(innerClass, 'grid grid-cols-[1fr_360px] items-start gap-7 max-lg:grid-cols-1')}>
          <div className="flex min-w-0 flex-col gap-5">
            <div
              role="tablist"
              aria-label="أقسام الدورة"
              className="sticky top-26 z-5 grid grid-cols-3 gap-1.5 rounded-[18px] border border-line bg-white p-1.5"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => goTo(t.id)}
                  className="min-h-11.5 rounded-xl border-0 bg-transparent font-bold text-muted aria-selected:bg-navy aria-selected:text-white max-sm:text-[13px]"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Card id="cd-info">
              <h2 className="text-[26px]">عن الدورة</h2>
              <RichText value={course.descriptionAr || course.shortDescriptionAr} />
              {course.certificateEnabled && (
                <>
                  <h3 className="mt-1.5 text-[19px]">نتائج الدورة</h3>
                  <p className="text-[15px] leading-[1.8] text-muted">
                    تحصل على شهادة معتمدة من المنصة بعد إتمام كل محتوى الدورة، تقدر تشاركها وتتحقق منها
                    برقمها.
                  </p>
                </>
              )}
            </Card>

            <Card id="cd-content">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[26px]">محتوى الدورة</h2>
                <span className="text-[15px] text-muted">
                  {sections.length} أقسام · {lessonsLabel(lessonsCount)}
                  {seconds > 0 && <> · {durationLabel(seconds)}</>}
                </span>
              </div>
              {sections.length === 0 ? (
                <EmptyState
                  compact
                  icon="list"
                  title="المحتوى بيتجهّز"
                  body="الدروس هتظهر هنا أول ما تنزل."
                />
              ) : (
                <Curriculum
                  sections={sections}
                  onPreview={course.promoVideoUrl ? () => setShowPromo(true) : undefined}
                />
              )}
            </Card>

            <Reviews course={course} />
          </div>

          <BuyCard
            course={course}
            lessonsCount={lessonsCount}
            seconds={seconds}
            onPreview={() => setShowPromo(true)}
          />
        </div>
      </section>

      <CTABand
        title="ابنك يستاهل بداية صح"
        body="لو محتار تبدأ بأنهي دورة، احكيلنا عن ابنك ونرشّحلك المسار المناسب."
      />

      {showPromo && course.promoVideoUrl && (
        <PromoModal url={course.promoVideoUrl} title={course.titleAr} onClose={() => setShowPromo(false)} />
      )}
    </>
  )
}

/* ---------------- curriculum ---------------- */

function Curriculum({
  sections,
  onPreview,
}: {
  sections: (CourseSection & { lessons: NonNullable<CourseSection['lessons']> })[]
  onPreview?: () => void
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(sections.slice(0, 2).map((s) => s.id)))
  const toggle = (id: string) =>
    setOpen((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-3">
      {sections.map((s) => {
        const isOpen = open.has(s.id)
        const secs = s.lessons.reduce((n, l) => n + (l.videoDurationSeconds ?? 0), 0)
        return (
          <div key={s.id} className="overflow-hidden rounded-[18px] border border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(s.id)}
              className="flex w-full items-center justify-between gap-3 border-0 bg-white px-4 py-3.5 text-start aria-expanded:bg-surface"
            >
              <span className="flex flex-col">
                <b className="text-ink">{s.titleAr}</b>
                <small className="text-[13px] text-muted">
                  {lessonsLabel(s.lessons.length)}
                  {secs > 0 && <> · {durationLabel(secs)}</>}
                </small>
              </span>
              <span
                className="flex size-7.5 flex-none items-center justify-center rounded-full border border-line bg-white font-bold text-ink"
                aria-hidden="true"
              >
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <ul className="px-4 pt-1 pb-2">
                {s.lessons.map((l) => (
                  <li
                    key={l.id}
                    className="flex min-h-12.5 items-center gap-2.5 border-b border-divider text-[15px] last:border-b-0"
                  >
                    <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-surface-blue text-blue-600">
                      <Icon
                        name={l.lessonType === 'PDF' ? 'file' : 'play'}
                        size={14}
                        filled={l.lessonType !== 'PDF'}
                      />
                    </span>
                    <span className="flex-1 text-ink">{l.titleAr}</span>
                    {l.isPreview && onPreview && (
                      <button
                        type="button"
                        className="border-0 bg-transparent text-[13px] font-bold text-blue-500"
                        onClick={onPreview}
                      >
                        معاينة مجانية
                      </button>
                    )}
                    {!!l.videoDurationSeconds && (
                      <span className="text-[13px] text-muted tabular-nums" dir="ltr">
                        {clock(l.videoDurationSeconds)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/* ---------------- buy card ---------------- */

function BuyCard({
  course,
  lessonsCount,
  seconds,
  onPreview,
}: {
  course: Course
  lessonsCount: number
  seconds: number
  onPreview: () => void
}) {
  const { user } = useAuth()
  const t = useCopy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const wishlist = useWishlist('COURSE')
  const { currency } = useRegion()
  const [error, setError] = useState<string | null>(null)

  const owned = useQuery({
    queryKey: ['me', 'my-courses'],
    queryFn: () => api.get<{ courseId: string }[]>('/my-courses'),
    enabled: Boolean(user),
  })
  const isOwned = (owned.data ?? []).some((c) => c.courseId === course.id)

  const price = coursePrice(course, currency)
  const shown = { current: price.current, old: price.old }
  const fmt = (n: number) => formatMoney(n, currency)

  const addToCart = useMutation({
    mutationFn: () => api.post('/cart/items', { itemType: 'COURSE', itemId: course.id, quantity: 1 }),
    onSuccess: () => resetCartCache(queryClient),
  })

  async function buy(goToCart: boolean) {
    setError(null)
    if (!user) {
      navigate(routes.login, { state: { from: routes.course(course.id) } })
      return
    }
    try {
      await addToCart.mutateAsync()
    } catch (e) {
      // Already in the cart is fine; anything else is shown.
      if (!(e instanceof ApiClientError && e.statusCode === 409)) {
        setError(e instanceof Error ? e.message : 'حصلت مشكلة، حاول تاني.')
        return
      }
    }
    if (goToCart) navigate(routes.cart)
  }

  const includes: { icon: IconName; text: string; show: boolean }[] = [
    {
      icon: 'video',
      text: `${seconds ? durationLabel(seconds) + ' فيديو في ' : ''}${lessonsLabel(lessonsCount)}`,
      show: lessonsCount > 0,
    },
    { icon: 'file', text: 'موارد وملفات PDF قابلة للتنزيل', show: true },
    { icon: 'refresh', text: 'تتبّع التقدم وكمّل من حيث وقفت', show: true },
    { icon: 'phone', text: 'الوصول من الموبايل ومدى الحياة', show: true },
    { icon: 'award', text: 'شهادة قابلة للمشاركة', show: Boolean(course.certificateEnabled) },
  ]
  const wished = wishlist.has(course.id)

  return (
    <aside
      aria-label="الاشتراك في الدورة"
      className="sticky top-26 -mt-65 flex flex-col gap-4 rounded-[28px] border border-line bg-white px-6 pt-3.5 pb-5.5 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-lg:static max-lg:order-first max-lg:mt-0"
    >
      <div className="relative -mx-2.5 overflow-hidden rounded-tile">
        <CourseCover
          seed={course.categoryId || course.id}
          word={course.category?.nameAr ?? course.titleAr}
          image={course.thumbnailImage}
          tag={course.promoVideoUrl ? 'معاينة مجانية' : null}
          badge={price.discountPercent ? `خصم ${price.discountPercent}%` : null}
          height={210}
          wordSize={24}
        />
        {course.promoVideoUrl && (
          <button
            type="button"
            aria-label="شغّل فيديو المعاينة"
            onClick={onPreview}
            className="absolute top-1/2 left-1/2 flex size-18 -translate-1/2 items-center justify-center rounded-full border-0 bg-white text-navy shadow-[0_16px_34px_-12px_rgba(5,20,40,.6)] transition-transform duration-250 hover:scale-108"
          >
            <Icon name="play" size={26} filled />
          </button>
        )}
      </div>

      {isOwned ? (
        <div className="flex flex-col gap-3">
          <Alert tone="success">الدورة دي في حسابك بالفعل.</Alert>
          <Link
            to={routes.learn(course.id)}
            className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
          >
            {t('cta.continue')}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <b className="font-head text-[34px] text-ink">
              {price.isFree && currency === 'EGP' ? 'مجانًا' : fmt(shown.current)}
            </b>
            {shown.old != null && <s className="text-muted-2">{fmt(shown.old)}</s>}
            {price.discountPercent > 0 && (
              <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[13px] font-bold text-gold-ink">
                خصم {price.discountPercent}%
              </span>
            )}
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <button
            type="button"
            className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
            disabled={addToCart.isPending}
            onClick={() => buy(true)}
          >
            {addToCart.isPending ? <Spinner /> : 'اشتري الآن'}
          </button>
          <div className="flex gap-2.5">
            <button
              type="button"
              className={buttonClass({
                variant: 'outline',
                className: cn('w-13 flex-none px-0', wished && 'text-danger-dot hover:text-danger-dot'),
              })}
              aria-pressed={wished}
              aria-label={wished ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              onClick={() => wishlist.toggle(course.id)}
            >
              <Icon name="heart" size={18} filled={wished} />
            </button>
            <button
              type="button"
              className={buttonClass({ variant: 'outline', className: 'flex-1' })}
              disabled={addToCart.isPending}
              onClick={() => buy(false)}
            >
              {addToCart.isSuccess ? (
                <>
                  <Icon name="check" size={18} /> اتضافت للسلة
                </>
              ) : (
                t('cta.addToCart')
              )}
            </button>
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-3 *:h-5.5 *:w-auto *:object-contain"
            aria-label="طرق الدفع"
          >
            <img src="/assets/payments/apple-pay.png" alt="Apple Pay" />
            <img src="/assets/payments/visa.svg" alt="Visa" />
            <img src="/assets/payments/mastercard.png" alt="Mastercard" />
            <img src="/assets/payments/vodafone-cash.png" alt="Vodafone Cash" />
            <img src="/assets/payments/paypal.png" alt="PayPal" />
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 border-t border-divider pt-4">
        <b className="text-ink">الدورة تتضمن:</b>
        <ul className="flex flex-col gap-2.5 text-[15px] text-text-2">
          {includes
            .filter((i) => i.show)
            .map((i) => (
              <li key={i.text} className="flex items-center gap-2.5">
                <span className="flex size-7.5 flex-none items-center justify-center rounded-[9px] bg-surface-blue text-blue-600">
                  <Icon name={i.icon} size={16} />
                </span>
                {i.text}
              </li>
            ))}
        </ul>
      </div>
    </aside>
  )
}

/* ---------------- reviews ---------------- */

function Stars({ value, className, dim }: { value: number; className?: string; dim?: string }) {
  return (
    <span className={cn('tracking-[1px] text-gold', className)} aria-label={`${value} من 5`}>
      {'★'.repeat(value)}
      <span className={dim ?? 'text-line-2'}>{'★'.repeat(5 - value)}</span>
    </span>
  )
}

function Reviews({ course }: { course: Course }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  // "?review=1" (from my courses) opens the form straight away.
  const [params] = useSearchParams()
  const [writing, setWriting] = useState(() => params.get('review') === '1')
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', 'reviews', course.id],
    queryFn: () => coursesApi.reviews(course.id, 1, 50),
  })
  const myCourses = useMyCourses()
  const reviews = data?.reviews ?? []
  const owns = Boolean(myCourses.data?.some((e) => e.courseId === course.id))
  const mine = user ? reviews.find((r) => r.userId === user.id) : undefined
  const canWrite = Boolean(user) && owns && !mine

  useEffect(() => {
    if (params.get('review') === '1' && !isLoading) {
      document.getElementById('cd-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [params, isLoading])
  const total = data?.pagination.total ?? 0
  const avg =
    course.ratingAverage ?? (reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0)
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }))

  return (
    <Card id="cd-reviews">
      <h2 className="text-[26px]">التقييمات</h2>
      {isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center gap-1 rounded-[18px] bg-surface px-6.5 py-4.5">
              <b className="font-head text-[44px] leading-none text-ink">{total ? avg.toFixed(1) : '—'}</b>
              <Stars value={total ? Math.round(avg) : 0} />
              <small className="text-muted">{total} تقييم</small>
            </div>
            <div className="flex flex-[1_1_240px] flex-col gap-1.5">
              {dist.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-[13px] text-muted">
                  <span>{d.star}</span>
                  <span className="text-gold">★</span>
                  <span className="h-1.75 flex-1 overflow-hidden rounded-full bg-divider">
                    <span className="block h-full bg-gold rounded-full" style={{ width: `${d.pct}%` }} />
                  </span>
                  <span className="w-9 tabular-nums">{d.pct}%</span>
                </div>
              ))}
            </div>
            {!user ? (
              <button
                type="button"
                className={buttonClass({ variant: 'navy' })}
                onClick={() => navigate(routes.login, { state: { from: routes.course(course.id) } })}
              >
                اكتب تقييم
              </button>
            ) : mine ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F6EC] px-3.5 py-2 text-sm font-bold text-success">
                <Icon name="check" size={15} /> قيّمت الدورة دي، شكرًا
              </span>
            ) : owns ? (
              <button
                type="button"
                className={buttonClass({ variant: 'navy' })}
                onClick={() => setWriting((w) => !w)}
              >
                اكتب تقييم
              </button>
            ) : (
              myCourses.isSuccess && (
                <span className="max-w-55 text-sm leading-relaxed text-muted">
                  التقييم متاح للي مشتركين في الدورة.
                </span>
              )
            )}
          </div>

          {writing && canWrite && <ReviewForm courseId={course.id} onDone={() => setWriting(false)} />}

          {reviews.length === 0 ? (
            <p className="py-2 text-[15px] text-muted">لسه مفيش تقييمات للدورة دي.</p>
          ) : (
            <ul>
              {reviews.slice(0, 6).map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  )
}

function ReviewItem({ review }: { review: CourseReview }) {
  const name = review.user?.fullName ?? 'متدرب'
  return (
    <li className="flex gap-3.5 border-t border-divider py-4.5">
      <span
        className="flex size-11 flex-none items-center justify-center rounded-full bg-linear-135 from-[#cfe3f3] to-[#7cc0ec] font-extrabold text-navy"
        aria-hidden="true"
      >
        {name.charAt(0)}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <b>{name}</b>
          <Stars value={review.rating} />
          <small className="text-muted-2">{formatDate(review.createdAt)}</small>
        </div>
        {review.title && <b className="mt-1.5 block text-ink">{review.title}</b>}
        {review.comment && <p className="mt-1.5 leading-[1.85] text-text-2">{review.comment}</p>}
      </div>
    </li>
  )
}

function reviewError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.statusCode === 409) return 'إنت قيّمت الدورة دي قبل كده.'
    if (error.statusCode === 403) return 'التقييم متاح بعد الاشتراك في الدورة.'
  }
  return (error as Error).message
}

function ReviewForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/courses/${courseId}/reviews`, { rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'reviews', courseId] })
      queryClient.invalidateQueries({ queryKey: ['courses', 'detail', courseId] })
      onDone()
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form className="flex flex-col gap-3.5 rounded-[18px] bg-surface p-4.5" onSubmit={submit}>
      <div className="flex gap-1" role="radiogroup" aria-label="التقييم">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} نجوم`}
            onClick={() => setRating(n)}
            className="border-0 bg-transparent p-0.5 text-gold"
          >
            <Icon name="star" size={26} filled={n <= rating} />
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold text-ink">رأيك في الدورة (اختياري)</span>
        <textarea
          className={cn(inputClass, 'min-h-24 resize-y')}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
        />
      </label>
      {mutation.isError && <Alert tone="error">{reviewError(mutation.error)}</Alert>}
      <div className="flex gap-2.5">
        <button type="submit" className={buttonClass({ variant: 'navy' })} disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner /> : 'نشر التقييم'}
        </button>
        <button type="button" className={buttonClass({ variant: 'ghost' })} onClick={onDone}>
          إلغاء
        </button>
      </div>
    </form>
  )
}

/* ---------------- promo video ---------------- */

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` : null
}

function PromoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const yt = youtubeEmbed(url)
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(5,20,40,.75)] p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`معاينة: ${title}`}
      onClick={onClose}
    >
      <div
        className="relative aspect-video w-full max-w-240 overflow-hidden rounded-[18px] bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="إغلاق"
          onClick={onClose}
          autoFocus
          className="absolute top-2.5 left-2.5 z-1 flex size-10 items-center justify-center rounded-full border-0 bg-white/90"
        >
          <Icon name="close" />
        </button>
        {yt ? (
          <iframe
            src={yt}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="size-full border-0"
          />
        ) : (
          <video src={resolveAssetUrl(url) ?? url} controls autoPlay playsInline className="size-full" />
        )}
      </div>
    </div>
  )
}
