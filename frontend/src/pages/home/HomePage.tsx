import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { articlesApi, booksApi, coursesApi } from '@/api/endpoints'
import { useAudience, useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, eyebrowClass, innerClass, pillTabClass, sectionClass } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CourseCard, CourseCardSkeleton } from '@/components/course/CourseCard'
import { courseGridClass } from '@/components/course/grid'
import { HeroWave } from '@/components/layout/PageHero'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Highlight } from '@/components/ui/Highlight'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import type { CourseSummary } from '@/types/api'
import { CHANNELS } from './channels'
import { BookCard } from '@/components/catalog/BookCard'
import { ArticleCard } from '@/components/catalog/ArticleCard'
import { articlesGridClass, booksGridClass } from '@/components/catalog/grids'
import { useTypewriter } from '@/lib/useTypewriter'
import { isEn, loc, tx } from '@/lib/i18n'

const HERO_WORDS_EN = ['understanding your child', 'your child’s heart', 'your own calm']
const HERO_WORDS = {
  guest: ['فهم أولادكم', 'قلب ابنكم', 'هدوءكم إنتم'],
  male: ['فهم طفلك', 'قلب ابنك', 'هدوءك إنت'],
  female: ['فهم طفلك', 'قلب ابنك', 'هدوءك إنتي'],
}

const PILLARS: { to: string; title: string; body: string; icon: IconName; grad: string; glow: string }[] = [
  {
    to: routes.courses,
    title: tx('الدورات المسجلة', 'Recorded courses'),
    body: tx(
      'فيديوهات وملفات PDF وشهادة بعد الإتمام، وتقدر تكمل من أي جهاز.',
      'Videos, PDFs and a certificate on completion. Continue from any device.',
    ),
    icon: 'video',
    grad: 'linear-gradient(135deg, #0B2E52 0%, #1E5F96 55%, #3D9BD8 100%)',
    glow: '#1E5F96',
  },
  {
    to: routes.library,
    title: tx('المكتبة', 'The library'),
    body: tx(
      'كتب ورقية بتوصل لحد باب البيت، ونسخ رقمية وصوتية فورية.',
      'Paperbacks delivered to your door, plus instant digital and audio editions.',
    ),
    icon: 'book',
    grad: 'linear-gradient(135deg, #1E5F96 0%, #3D9BD8 50%, #7CD3FF 100%)',
    glow: '#3D9BD8',
  },
  {
    to: routes.consultation,
    title: tx('استشارات خاصة', 'Private consultations'),
    body: tx(
      'جلسة فردية تناقش فيها مشكلة ابنك بالتفصيل، بسرية تامة.',
      "A one-to-one session to discuss your child's situation in detail, in full confidence.",
    ),
    icon: 'chat',
    grad: 'linear-gradient(135deg, #E8A33D 0%, #F2B856 50%, #F7CF7E 100%)',
    glow: '#E8A33D',
  },
  {
    to: routes.blog,
    title: tx('مقالات مجانية', 'Free articles'),
    body: tx(
      'نصائح عملية قصيرة في التربية وعلم النفس، تتجدد كل أسبوع.',
      'Short, practical tips on parenting and psychology, new every week.',
    ),
    icon: 'pen',
    grad: 'linear-gradient(135deg, #3B3A8F 0%, #5B5BD6 50%, #4BA9DE 100%)',
    glow: '#5B5BD6',
  },
]

/** The best recent course reviews (4+ stars with a comment); the section hides when there are none. */
function useTestimonials() {
  const { data } = useQuery({
    queryKey: ['courses', 'featured-reviews'],
    queryFn: () => coursesApi.featuredReviews(6),
    staleTime: 10 * 60_000,
  })
  return (data?.reviews ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    head: r.title || firstSentence(r.comment ?? ''),
    body: r.comment ?? '',
    name: r.user?.fullName ?? tx('متدرب', 'Learner'),
    course: loc(r.course.titleAr, r.course.titleEn),
  }))
}

function firstSentence(text: string) {
  const s = text.split(/[.!؟?\n]/)[0].trim()
  return s.length > 60 ? `${s.slice(0, 57)}…` : s
}

type Testimonial = ReturnType<typeof useTestimonials>[number]

export function HomePage() {
  usePageTitle()
  return (
    <>
      <Hero />
      <MediaStrip />
      <Pillars />
      <CoursesSection />
      <StatsBand />
      <AboutDoctor />
      <BooksSection />
      <ConsultBand />
      <TestimonialsSection />
      <ArticlesSection />
    </>
  )
}

/* ---------------- hero ---------------- */

const floatCard = 'absolute flex gap-3 rounded-tile bg-white shadow-float'

function Hero() {
  const t = useCopy()
  const audience = useAudience()
  const typed = useTypewriter(isEn ? HERO_WORDS_EN : HERO_WORDS[audience])

  const { data: home } = useQuery({ queryKey: ['courses', 'home'], queryFn: coursesApi.home })
  const proof = useMemo(() => ratingSummary(home ?? []), [home])
  const featured = home?.[0]

  return (
    <section className="relative bg-navy overflow-hidden px-6 pt-42.5 pb-30 max-sm:px-4 max-sm:pt-31 max-sm:pb-24">
      <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
      <div className="orb -end-20 -top-30 size-105 bg-blue-300" />
      <div className="orb end-[30%] -bottom-40 size-90 bg-gold-light opacity-35 [animation-delay:-5s]" />
      <div className="orb -start-30 top-[20%] size-75 bg-[#7E5BD9] opacity-30 [animation-delay:-8s]" />

      <div className="relative mx-auto flex max-w-site flex-wrap items-center gap-14">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-7">
          <div className="inline-flex animate-rise items-center gap-2.5 self-start rounded-full px-4 py-2 text-[15px] font-semibold text-white glass">
            <span className="size-2.5 flex-none animate-pulse-ring rounded-full bg-sky" />
            {tx(
              'المستشار النفسي والتربوي · دورات · كتب · استشارات',
              'Psychological & parenting consultant · Courses · Books · Consultations',
            )}
          </div>
          <h1 className="animate-rise text-[clamp(40px,6vw,64px)] leading-[1.2] font-bold tracking-[-0.5px] text-white [animation-delay:.1s] max-[400px]:text-[34px]">
            {tx('تربية واعية', 'Mindful parenting')}
            <br />
            {tx('تبدأ من', 'starts with')} <span className="sr-only">{typed.word}</span>
            <span className="text-sheen" aria-hidden="true">
              {typed.text}
            </span>
            <span className={cn('caret', typed.typing && 'animate-none')} aria-hidden="true" />
          </h1>
          <p className="max-w-140 animate-rise text-xl leading-[1.85] text-on-dark [animation-delay:.2s] max-sm:text-[17px]">
            {t('home.hero.body')}
          </p>
          <div className="flex animate-rise flex-wrap gap-3.5 [animation-delay:.3s] max-sm:*:flex-[1_1_100%]">
            <Link to={routes.courses} className={buttonClass({ variant: 'gold', size: 'lg' })}>
              {t('cta.start')}
              <Icon name="arrowLeft" />
            </Link>
            <Link to={routes.consultation} className={buttonClass({ variant: 'glass', size: 'lg' })}>
              {t('cta.bookPrivate')}
            </Link>
          </div>
          <div className="flex animate-rise flex-wrap items-center gap-7 pt-2 [animation-delay:.45s]">
            {proof && (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="flex *:size-11 *:rounded-full *:border-3 *:border-blue-600 *:not-first:-ms-3.5"
                    aria-hidden="true"
                  >
                    <span className="bg-linear-135 from-[#CFE3F3] to-[#7CC0EC]" />
                    <span className="bg-linear-135 from-[#FBE3B5] to-gold" />
                    <span className="bg-linear-135 from-[#D9D0F5] to-[#8E7BE0]" />
                  </div>
                  <ProofText
                    title={
                      <>
                        {proof.average} <span className="text-gold-light">★★★★★</span>
                      </>
                    }
                    sub={tx(`من ${proof.count} تقييم للمتدربين`, `from ${proof.count} learner reviews`)}
                  />
                </div>
                <span className="h-10 w-px bg-white/25 max-sm:hidden" />
              </>
            )}
            <ProofText
              title={tx('شهادة معتمدة', 'Accredited certificate')}
              sub={tx('بعد إتمام كل دورة', 'After completing each course')}
            />
          </div>
        </div>

        <div
          className="relative h-150 min-w-0 flex-[1_1_480px] animate-rise [animation-delay:.2s] max-[1100px]:hidden"
          aria-hidden="true"
        >
          <div className="absolute top-10 left-1/2 size-130 -translate-x-1/2 rounded-full bg-[conic-gradient(from_200deg,#4ba9de,#f7cf7e,#8e7be0,#4ba9de)] opacity-35 blur-[30px]" />
          <div className="absolute bottom-0 left-1/2 h-125 w-95 -translate-x-1/2 overflow-hidden rounded-[200px_200px_36px_36px] border border-white/25 bg-linear-to-b from-white/18 to-white/4">
            <img
              className="absolute top-10 left-1/2 w-70 -translate-x-1/2 opacity-14"
              src="/assets/brand/logo-white.webp"
              alt=""
            />
            <img
              className="absolute bottom-0 left-1/2 h-[96%] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_20px_40px_rgba(5,20,40,.45)]"
              src="/assets/brand/saleh-cutout.webp"
              alt=""
              fetchPriority="high"
            />
          </div>
          {featured && (
            <div className={cn(floatCard, '-start-2.5 top-75 w-65 animate-floaty flex-col px-5 py-4.5')}>
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 flex-none bg-navy items-center justify-center rounded-xl text-white">
                  <Icon name="play" size={18} filled />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] text-muted">{tx('دورة مميزة', 'Featured course')}</span>
                  <b className="text-[15px] leading-snug text-ink">
                    {loc(featured.titleAr, featured.titleEn)}
                  </b>
                </div>
              </div>
              <span className="text-[13px] text-muted">
                {tx('فيديو + PDF + شهادة', 'Video + PDF + certificate')}
              </span>
            </div>
          )}
          <div
            className={cn(
              floatCard,
              'end-0 bottom-15 w-60 animate-floaty items-center gap-3.5 px-4.5 py-4 [animation-delay:-3s]',
            )}
          >
            <span className="flex size-12 flex-none bg-gold items-center justify-center rounded-[14px] text-navy">
              <Icon name="bookClosed" size={22} />
            </span>
            <div className="flex flex-col gap-0.5">
              <b className="text-[15px] text-ink">{tx('فن تربية الأبناء', 'The Art of Parenting')}</b>
              <span className="text-[13px] text-muted">
                {tx('ورقي · رقمي · صوتي', 'Paperback · digital · audio')}
              </span>
            </div>
          </div>
          {proof && (
            <div className="absolute end-7.5 top-10 flex animate-floaty items-center gap-2 rounded-2xl px-4 py-3 font-bold text-white glass [animation-delay:-1.5s]">
              <span className="text-gold-light">★</span> {proof.average} {tx('تقييم', 'rating')}
            </div>
          )}
        </div>
      </div>

      <HeroWave />
    </section>
  )
}

function ProofText({ title, sub }: { title: ReactNode; sub: string }) {
  return (
    <div className="flex flex-col">
      <b className="text-lg text-white">{title}</b>
      <span className="text-sm text-on-dark-muted">{sub}</span>
    </div>
  )
}

function ratingSummary(courses: CourseSummary[]) {
  let sum = 0
  let count = 0
  for (const c of courses) {
    if (c.ratingAverage != null && c.ratingCount) {
      sum += c.ratingAverage * c.ratingCount
      count += c.ratingCount
    }
  }
  if (!count) return null
  return { average: (Math.round((sum / count) * 10) / 10).toFixed(1), count }
}

/* ---------------- media strip ---------------- */

function MediaStrip() {
  const doubled = [...CHANNELS, ...CHANNELS]
  return (
    <section className="pt-2 pb-12" aria-labelledby="media-title">
      <div className="mx-auto mb-6 flex max-w-site animate-rise justify-center px-6 text-center">
        <h2 id="media-title" className="text-[clamp(26px,3.5vw,34px)] font-bold">
          {tx('ضيف على', 'A guest on')}{' '}
          <span className="uline text-ink-grad">{tx('شاشات وإذاعات عربية', 'Arab TV and radio')}</span>
        </h2>
      </div>
      <div className="group overflow-hidden mask-fade-x py-2.5">
        <div className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]">
          {doubled.map((c, i) => (
            <span
              key={`${c.src}-${i}`}
              aria-hidden={i >= CHANNELS.length || undefined}
              className="group/logo flex h-22 flex-none items-center justify-center rounded-tile border border-line bg-white px-6.5 transition-[box-shadow,border-color] duration-350 hover:border-[#bbd8ee] hover:shadow-[0_16px_34px_-18px_rgba(30,95,150,.5)]"
            >
              <img
                src={c.src}
                alt={i < CHANNELS.length ? c.name : ''}
                loading="lazy"
                className="h-14 w-auto opacity-70 grayscale transition-[filter,opacity,transform] duration-350 group-hover/logo:scale-106 group-hover/logo:opacity-100 group-hover/logo:grayscale-0"
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- pillars ---------------- */

function Pillars() {
  return (
    <section className={sectionClass}>
      <div className={cn(innerClass, 'grid stagger grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5')}>
        {PILLARS.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="glow-card relative flex flex-col gap-3.5 overflow-hidden rounded-card border border-line bg-white p-7 text-text hover:text-text"
          >
            <div
              className="absolute -end-15 -top-15 size-40 rounded-full opacity-14 blur-[10px]"
              style={{ background: p.glow }}
              aria-hidden="true"
            />
            <span
              className="flex size-14.5 items-center justify-center rounded-[18px] text-white"
              style={{ background: p.grad, boxShadow: `0 12px 24px -10px ${p.glow}` }}
            >
              <Icon name={p.icon} size={26} />
            </span>
            <span className="font-head text-[22px] font-semibold text-ink">{p.title}</span>
            <span className="leading-[1.7] text-muted">{p.body}</span>
            <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-blue-500">
              {tx('اكتشف', 'Explore')} <Icon name="arrowLeft" size={16} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ---------------- courses ---------------- */

function CoursesSection() {
  const t = useCopy()
  const [tab, setTab] = useState<string>('all')
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', 'home'],
    queryFn: coursesApi.home,
  })

  const courses = useMemo(() => data ?? [], [data])
  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of courses) if (c.category) map.set(c.category.id, loc(c.category.nameAr, c.category.nameEn))
    return [...map]
  }, [courses])
  const shown = courses.filter((c) => tab === 'all' || c.categoryId === tab).slice(0, 3)

  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          eyebrow={tx('الأكثر طلبًا', 'Most popular')}
          icon="sparkle"
          title={<Highlight text={t('home.courses.title')} />}
          more={{ to: routes.courses, label: tx('كل الدورات', 'All courses') }}
        />

        {categories.length > 1 && (
          <div
            role="tablist"
            aria-label={tx('تصنيف الدورات', 'Course categories')}
            className="-mt-2 mb-8 flex flex-wrap gap-2.5"
          >
            {[['all', tx('الكل', 'All')] as const, ...categories].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={pillTabClass}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className={courseGridClass}>
            {[0, 1, 2].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon="video"
            title={tx('الدورات جاية قريب', 'Courses are coming soon')}
            body={tx(
              'بنجهّز أول دفعة من الدورات. تابعنا عشان تعرف أول ما تنزل.',
              "We're preparing the first courses. Follow us to hear as soon as they're out.",
            )}
          />
        ) : (
          <div className={cn(courseGridClass, 'stagger')}>
            {shown.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------- stats ---------------- */

function useCountUp(target: number, run: boolean) {
  const [k, setK] = useState(0)
  useEffect(() => {
    if (!run) return
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const x = Math.min(1, (now - t0) / 1800)
      setK(1 - Math.pow(1 - x, 3))
      if (x < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [run])
  return target * k
}

function StatsBand() {
  const courses = useQuery({
    queryKey: ['courses', 'list', { limit: 100 }],
    queryFn: () => coursesApi.list({ limit: 100 }),
  })
  const books = useQuery({ queryKey: ['books'], queryFn: booksApi.list })

  const ready = courses.isSuccess && books.isSuccess
  const totalCourses = courses.data?.pagination.total ?? 0
  const totalBooks = (books.data ?? []).filter((b) => b.isActive).length
  const rating = ratingSummary(courses.data?.courses ?? [])

  const nBooks = useCountUp(totalBooks, ready)
  const nCourses = useCountUp(totalCourses, ready)
  const nReviews = useCountUp(rating?.count ?? 0, ready)
  const nAvg = useCountUp(rating ? Number(rating.average) : 0, ready)

  if (!ready || (!totalCourses && !totalBooks)) return null

  const stats: { n: string; suf?: string; label: string; show: boolean }[] = [
    {
      n: nAvg.toFixed(1),
      suf: '★',
      label: tx('متوسط تقييم الدورات', 'Average course rating'),
      show: Boolean(rating),
    },
    {
      n: String(Math.round(nReviews)),
      label: tx('تقييم من المتدربين', 'Reviews from learners'),
      show: Boolean(rating),
    },
    {
      n: String(Math.round(nCourses)),
      label: tx('دورات مسجّلة بشهادة', 'Recorded courses with a certificate'),
      show: totalCourses > 0,
    },
    {
      n: String(Math.round(nBooks)),
      label: tx('كتب ورقية ورقمية وصوتية', 'Paperback, digital and audio books'),
      show: totalBooks > 0,
    },
  ]

  return (
    <section className={sectionClass}>
      <div
        className={cn(
          innerClass,
          'relative grid bg-navy-wide grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 overflow-hidden rounded-panel p-11 max-sm:rounded-[26px] max-sm:px-5.5 max-sm:py-8',
        )}
      >
        <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
        <div className="orb -start-15 -top-30 size-65 bg-gold-light opacity-30" />
        {stats
          .filter((s) => s.show)
          .map((s) => (
            <div key={s.label} className="relative flex flex-col items-center gap-2 py-2 text-center">
              <span className="font-head text-[50px] leading-none font-bold text-white tabular-nums max-sm:text-[40px]">
                {s.n}
                {s.suf && <span className="text-gold-light">{s.suf}</span>}
              </span>
              <span className="text-on-dark-muted">{s.label}</span>
            </div>
          ))}
      </div>
    </section>
  )
}

/* ---------------- about ---------------- */

function AboutDoctor() {
  const t = useCopy()
  const points: { text: string; icon: IconName; gold?: boolean }[] = [
    { text: tx('المستشار النفسي والتربوي', 'Psychological & parenting consultant'), icon: 'check' },
    {
      text: tx(
        'رئيس مركز السعادة للاستشارات النفسية والتربوية',
        'Head of Al-Saada Center for Psychological & Parenting Consultations',
      ),
      icon: 'check',
    },
    {
      text: tx('مقدّم برنامج «فن التربية» على قناة الرحمة', 'Host of “The Art of Parenting” on Al-Rahma TV'),
      icon: 'video',
      gold: true,
    },
  ]
  return (
    <section className={sectionClass}>
      <div
        className={cn(
          innerClass,
          'flex flex-wrap items-center gap-14 rounded-band p-14 gborder max-sm:rounded-[26px] max-sm:px-5.5 max-sm:py-8',
        )}
      >
        <div className="relative flex aspect-4/5 max-h-120 min-w-0 flex-[1_1_340px] tilt items-center justify-center overflow-hidden rounded-[28px] bg-linear-160 from-[#dcebf6] via-[#bfddf2] to-[#fbe3b5]">
          <div
            className="absolute size-80 animate-spin-slow rounded-full border-2 border-dashed border-navy/18"
            aria-hidden="true"
          />
          <img
            src="/assets/brand/saleh-cutout.webp"
            alt={tx('الدكتور صالح عبد الكريم', 'Dr. Saleh Abdelkarim')}
            loading="lazy"
            className="absolute bottom-0 left-1/2 h-[94%] w-auto max-w-none -translate-x-1/2"
          />
        </div>
        <div className="flex min-w-0 flex-[1.3_1_480px] flex-col gap-6 max-sm:basis-full">
          <span className={eyebrowClass}>
            <Icon name="user" size={16} />
            {tx('عن الدكتور', 'About the doctor')}
          </span>
          <img
            className="w-80 max-w-full"
            src="/assets/brand/logo-blue.webp"
            alt={tx('الدكتور صالح عبد الكريم', 'Dr. Saleh Abdelkarim')}
            loading="lazy"
          />
          <p className="font-head text-[clamp(20px,2.4vw,26px)] leading-[1.7] font-medium text-ink">
            {tx(
              '«مش مطلوب إن ابنك يكون مثالي… المطلوب إنه يكون',
              '“Your child doesn’t need to be perfect… they need to be',
            )}{' '}
            <span className="text-ink-grad">{tx('سوي، واثق في نفسه', 'balanced and self-confident')}</span>
            {tx('، وقادر يتكيّف مع الدنيا.»', ', and able to adapt to the world.”')}
          </p>
          <p className="text-[17px] leading-[1.9] text-text-2">
            {tx(
              'مؤلف كتاب «فن تربية الأبناء»، وبيقدّم برامج في التربية الإيجابية والبناء النفسي للأطفال والمراهقين بأسلوب عملي مبسّط تقدر تطبقه في البيت.',
              'Author of “The Art of Parenting”, presenting programs on positive parenting and the psychological development of children and teens, in a simple, practical way you can apply at home.',
            )}
          </p>
          <ul className="flex stagger flex-col gap-2.5">
            {points.map((p) => (
              <li key={p.text} className="flex items-center gap-3 font-semibold text-ink">
                <span
                  className={cn(
                    'flex size-8.5 flex-none items-center justify-center rounded-[10px]',
                    p.gold ? 'bg-gold text-navy' : 'bg-navy text-white',
                  )}
                >
                  <Icon name={p.icon} size={16} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
          <Link
            to={routes.consultation}
            className={buttonClass({ variant: 'navy', className: 'self-start' })}
          >
            {t('cta.bookDoctor')}
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------------- books ---------------- */

function BooksSection() {
  const t = useCopy()
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['books'], queryFn: booksApi.list })

  const books = useMemo(() => {
    const active = (data ?? []).filter((b) => b.isActive)
    const home = active.filter((b) => b.isHomeDisplay)
    return (home.length ? home : active).slice(0, 4)
  }, [data])

  if (!isLoading && !isError && books.length === 0) return null

  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          eyebrow={tx('من المكتبة', 'From the library')}
          icon="book"
          title={<Highlight text={t('home.books.title')} />}
          more={{ to: routes.library, label: tx('تصفّح المكتبة', 'Browse the library') }}
        />
        {isError ? (
          <ErrorState onRetry={() => refetch()} compact />
        ) : (
          <div className={booksGridClass}>
            {isLoading
              ? [0, 1, 2, 3].map((i) => <div key={i} className="h-95 skeleton rounded-card" />)
              : books.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------- consultation band ---------------- */

function ConsultBand() {
  const t = useCopy()
  const steps = [
    t('home.consult.step1'),
    t('home.consult.step2'),
    tx('جلسة خاصة مع د. صالح وخطة عملية', 'A private session with Dr. Saleh and a practical plan'),
  ]
  return (
    <section className={sectionClass}>
      <div
        className={cn(
          innerClass,
          'relative flex bg-navy flex-wrap items-center gap-12 overflow-hidden rounded-band px-14 py-16 max-sm:rounded-[26px] max-sm:px-5.5 max-sm:py-8',
        )}
      >
        <div className="absolute inset-0 dots opacity-45" aria-hidden="true" />
        <div className="orb -end-25 -bottom-40 size-85 bg-gold-light opacity-35" />
        <div
          className="absolute -end-45 -top-50 size-130 animate-spin-slow rounded-full border-2 border-dashed border-white/14"
          aria-hidden="true"
        />
        <div className="relative flex min-w-0 flex-[1_1_460px] flex-col gap-5 max-sm:basis-full">
          <span className={cn(eyebrowClass, 'bg-white/10 text-gold-light')}>
            <Icon name="chat" size={16} />
            {tx('استشارة فردية', 'One-to-one consultation')}
          </span>
          <h2 className="text-[clamp(30px,4vw,44px)] leading-[1.3] text-white">{t('home.consult.title')}</h2>
          <p className="text-lg leading-[1.85] text-on-dark">{t('home.consult.body')}</p>
          <Link
            to={routes.consultation}
            className={buttonClass({ variant: 'gold', size: 'lg', className: 'self-start' })}
          >
            {t('cta.bookNow')}
          </Link>
        </div>
        <ol className="relative flex min-w-0 flex-[1_1_380px] flex-col gap-3.5 max-sm:basis-full">
          {steps.map((s, i) => (
            <li
              key={s}
              className="flex lift items-center gap-4 rounded-[18px] px-5 py-4.5 text-[17px] text-white glass"
            >
              <span className="flex size-10.5 flex-none bg-gold items-center justify-center rounded-full font-extrabold text-navy">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------------- testimonials ---------------- */

function TestimonialsSection() {
  const list = useTestimonials()
  return list.length > 0 ? <Testimonials list={list} /> : null
}

function Testimonials({ list: TESTIMONIALS }: { list: Testimonial[] }) {
  const [i, setI] = useState(0)
  const n = TESTIMONIALS.length
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % n), 6000)
    return () => clearInterval(id)
  }, [n])
  const rv = TESTIMONIALS[i % n]
  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          center
          eyebrow={tx('آراء المتدربين', 'What learners say')}
          icon="quote"
          title={<Highlight text={tx('فرق *حقيقي* في البيت', 'A *real* difference at home')} />}
        />
        <div className="flex flex-wrap items-stretch gap-6">
          <figure className="m-0 flex flex-[1.2_1_420px] flex-col gap-5 rounded-[28px] p-9 gborder">
            <span
              className="tracking-[2px] text-gold"
              aria-label={tx(`${rv.rating} من 5`, `${rv.rating} out of 5`)}
            >
              {'★'.repeat(rv.rating)}
            </span>
            <span className="font-head text-[26px] font-semibold text-ink">{rv.head}</span>
            <blockquote className="m-0 text-lg leading-[1.9] text-text-2">{rv.body}</blockquote>
            <figcaption className="mt-auto flex flex-col border-t border-divider pt-4.5">
              <b>{rv.name}</b>
              <span className="text-sm text-muted">{rv.course}</span>
            </figcaption>
            <div className={cn('flex gap-2', n < 2 && 'hidden')}>
              <button
                type="button"
                className={buttonClass({ variant: 'outline', size: 'sm' })}
                aria-label={tx('السابق', 'Previous')}
                onClick={() => setI((i + n - 1) % n)}
              >
                <Icon name="arrowRight" size={16} />
              </button>
              <button
                type="button"
                className={buttonClass({ variant: 'navy', size: 'sm' })}
                aria-label={tx('التالي', 'Next')}
                onClick={() => setI((i + 1) % n)}
              >
                <Icon name="arrowLeft" size={16} />
              </button>
            </div>
          </figure>
          <div className="flex flex-[1_1_320px] flex-col gap-3.5">
            {TESTIMONIALS.map((r, k) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setI(k)}
                className={cn(
                  'flex flex-col gap-1 rounded-tile border px-5 py-4.5 text-start',
                  k === i ? 'border-glow bg-[#f2f8fd]' : 'border-line bg-white',
                )}
              >
                <b>{r.head}</b>
                <span className="text-sm text-muted">{r.course}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- articles ---------------- */

function ArticlesSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['articles', { page: 1, limit: 3 }],
    queryFn: () => articlesApi.list({ page: 1, limit: 3 }),
  })
  const articles = data?.articles ?? []
  if (isError || (!isLoading && articles.length === 0)) return null

  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          eyebrow={tx('أحدث المقالات', 'Latest articles')}
          icon="pen"
          title={tx('اقرأ في ٥ دقايق', 'Read in 5 minutes')}
          more={{ to: routes.blog, label: tx('كل المقالات', 'All articles') }}
        />
        <div className={articlesGridClass}>
          {isLoading
            ? [0, 1, 2].map((i) => <div key={i} className="h-75 skeleton rounded-card" />)
            : articles.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      </div>
    </section>
  )
}
