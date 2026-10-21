import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ApiClientError, resolveAssetUrl } from '@/api/client'
import { articlesApi, coursesApi, type ArticleSummary } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { RichText } from '@/components/ui/RichText'
import { toSafeHtml, withHeadingAnchors } from '@/lib/richText'
import { ArticleCard } from '@/components/catalog/ArticleCard'
import { CourseCard } from '@/components/course/CourseCard'
import { Breadcrumbs, HeroWave } from '@/components/layout/PageHero'
import { Icon, type IconName } from '@/components/ui/Icon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { innerClass, sectionClass } from '@/components/ui/button'
import { ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { CARD_GRADS, pickBySeed } from '@/lib/catalog'
import { formatDate, minutesLabel, readingMinutes } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function ArticlePage() {
  const { slug = '' } = useParams()
  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['articles', 'slug', slug],
    queryFn: () => articlesApi.bySlug(slug),
    staleTime: 5 * 60_000,
  })
  usePageTitle(article?.title ?? 'مقال')

  if (error instanceof ApiClientError && error.statusCode === 404) return <NotFoundPage />
  if (isError) {
    return (
      <div className="mx-auto max-w-140 px-6 pt-36 pb-20">
        <ErrorState onRetry={() => refetch()} />
      </div>
    )
  }
  if (isLoading || !article) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-30 text-blue-600">
        <Spinner />
      </div>
    )
  }
  return <Article article={article} />
}

function Article({ article }: { article: ArticleSummary }) {
  const { html, headings } = useMemo(() => withHeadingAnchors(toSafeHtml(article.content)), [article.content])
  const cover = resolveAssetUrl(article.coverImage)
  const words = article.title.split(' ')
  const cut = Math.ceil(words.length * 0.6)

  return (
    <>
      <section className="relative bg-navy overflow-hidden px-6 pt-33.5 pb-56 text-center text-white max-sm:px-4 max-sm:pb-40">
        <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-205 flex-col items-center gap-4">
          <Breadcrumbs
            crumbs={[
              { label: 'الرئيسية', to: routes.home },
              { label: 'المقالات', to: routes.blog },
              { label: article.category?.name ?? 'مقال' },
            ]}
          />
          <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold glass">
            <span className="size-2 rounded-full bg-gold-light" />
            {article.category?.name} · {minutesLabel(readingMinutes(article.content))} قراءة
          </span>
          <h1 className="animate-rise text-[clamp(30px,4.5vw,48px)] leading-tight text-white">
            {words.slice(0, cut).join(' ')} <span className="text-sheen">{words.slice(cut).join(' ')}</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-on-dark-muted">
            <span className="size-9 bg-gold overflow-hidden rounded-full border-2 border-white/60">
              <img
                src="/assets/brand/saleh-cutout.webp"
                alt=""
                className="h-[130%] w-full object-cover object-top"
              />
            </span>
            <b className="text-white">د. صالح عبد الكريم</b>·<span>{formatDate(article.createdAt)}</span>
            {!!article.viewsCount && (
              <>
                ·<span>{article.viewsCount} مشاهدة</span>
              </>
            )}
          </div>
        </div>
        <HeroWave />
      </section>

      <div className={cn(innerClass, 'relative -mt-44 px-6 max-sm:-mt-30 max-sm:px-4')}>
        <div
          className="h-115 overflow-hidden rounded-band shadow-pop max-sm:h-60 max-sm:rounded-[26px]"
          style={{ background: pickBySeed(CARD_GRADS, article.id) }}
        >
          {cover && <img src={cover} alt="" className="size-full object-cover" />}
        </div>
      </div>

      <section className={cn(sectionClass, 'pt-12')}>
        <div className={cn(innerClass, 'grid grid-cols-[1fr_260px] items-start gap-12 max-lg:grid-cols-1')}>
          <article className="min-w-0">
            {article.shortContent && (
              <RichText
                value={article.shortContent}
                className="mb-6 text-xl leading-[1.9] font-medium text-ink"
              />
            )}
            <RichText html={html} className="gap-5 text-lg leading-[2]" />
            {!!article.tags?.length && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-divider pt-6">
                {article.tags.map((tg) => (
                  <Link
                    key={tg.id}
                    to={`${routes.blog}?tag=${tg.id}`}
                    className="rounded-full bg-surface-blue px-3 py-1 text-sm font-semibold text-blue-600"
                  >
                    #{tg.name}
                  </Link>
                ))}
              </div>
            )}
          </article>
          <aside className="sticky top-27 flex flex-col gap-4 max-lg:static max-lg:order-first">
            {headings.length > 1 && (
              <nav
                aria-label="في المقال ده"
                className="flex flex-col gap-1 rounded-card border border-line bg-white p-5 max-lg:hidden"
              >
                <b className="mb-2 text-ink">في المقال ده</b>
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="border-s-2 border-line py-1.5 ps-3 text-sm text-text-2 hover:border-blue-400"
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            )}
            <Share title={article.title} />
          </aside>
        </div>
      </section>

      <RelatedCourses ids={article.relatedCourseIds ?? []} />
      <MoreArticles current={article} />
    </>
  )
}

function Share({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const links: { label: string; icon: IconName; href: string }[] = [
    {
      label: 'فيسبوك',
      icon: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: 'واتساب',
      icon: 'whatsapp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
  ]
  const btn =
    'flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-hover hover:text-ink'
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      شارك:
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`شارك على ${l.label}`}
          className={btn}
        >
          <Icon name={l.icon} size={17} />
        </a>
      ))}
      <button
        type="button"
        className={btn}
        aria-label="انسخ الرابط"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            // clipboard blocked; nothing to do
          }
        }}
      >
        <Icon name={copied ? 'check' : 'link'} size={17} />
      </button>
    </div>
  )
}

function RelatedCourses({ ids }: { ids: string[] }) {
  // Courses the admin picked for this article; hidden or deleted ones are skipped.
  const picked = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['courses', 'detail', id],
      queryFn: () => coursesApi.byId(id),
      retry: false,
    })),
  })
  const chosen = picked.flatMap((q) => (q.data ? [q.data] : []))
  const pickedDone = picked.every((q) => !q.isLoading)
  const fallback = useQuery({
    queryKey: ['courses', 'home'],
    queryFn: coursesApi.home,
    enabled: ids.length === 0 || (pickedDone && chosen.length === 0),
  })
  const courses = chosen.length ? chosen : (fallback.data ?? []).slice(0, 2)
  if (!courses.length) return null
  return (
    <section className={sectionClass}>
      <div className={cn(innerClass, 'rounded-panel bg-surface-blue p-9 max-sm:p-5')}>
        <SectionHeader
          eyebrow="دورات"
          icon="video"
          title="دورات ذات صلة بالمقال"
          more={{ to: routes.courses, label: 'كل الدورات' }}
        />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </section>
  )
}

function MoreArticles({ current }: { current: ArticleSummary }) {
  const { data } = useQuery({
    queryKey: ['articles', { categoryId: current.category?.id, limit: 4 }],
    queryFn: () => articlesApi.list({ categoryId: current.category?.id, limit: 4 }),
  })
  const others = (data?.articles ?? []).filter((a) => a.id !== current.id).slice(0, 3)
  if (!others.length) return null
  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          eyebrow="اقرأ كمان"
          icon="pen"
          title="مقالات تانية ممكن تفيدك"
          more={{ to: routes.blog, label: 'كل المقالات' }}
        />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {others.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </section>
  )
}
