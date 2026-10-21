import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { resolveAssetUrl } from '@/api/client'
import { articlesApi, type ArticleSummary } from '@/api/endpoints'
import { useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { ArticleCard } from '@/components/catalog/ArticleCard'
import { Icon } from '@/components/ui/Icon'
import { Pager } from '@/components/ui/Pager'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { CARD_GRADS, pickBySeed } from '@/lib/catalog'
import { formatDate, minutesLabel, readingMinutes } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { keepScroll, scrollToResults } from '@/lib/scroll'

const PAGE_SIZE = 9

const sideBtn =
  'flex min-h-11 w-full items-center justify-between rounded-xl border-0 bg-surface px-3.5 text-start text-[15px] font-semibold text-ink hover:bg-hover ' +
  'aria-checked:bg-navy aria-checked:text-white'

export function BlogPage() {
  usePageTitle('المقالات')
  const t = useCopy()
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('cat') ?? ''
  const tagId = params.get('tag') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const filtered = Boolean(categoryId || tagId)

  const query = { page, limit: PAGE_SIZE, categoryId: categoryId || undefined, tagId: tagId || undefined }
  const list = useQuery({
    queryKey: ['articles', query],
    queryFn: () => articlesApi.list(query),
    placeholderData: keepPreviousData,
  })
  const featured = useQuery({
    queryKey: ['articles', { isFeatured: true, limit: 1 }],
    queryFn: () => articlesApi.list({ isFeatured: true, limit: 1 }),
  })
  const categories = useQuery({ queryKey: ['articles', 'categories'], queryFn: articlesApi.categories })
  const tags = useQuery({ queryKey: ['articles', 'tags'], queryFn: articlesApi.tags })

  const spotlight = !filtered && page === 1 ? featured.data?.articles[0] : undefined
  const articles = (list.data?.articles ?? []).filter((a) => a.id !== spotlight?.id)

  function set(next: Record<string, string>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
    setParams(p, keepScroll)
  }

  return (
    <>
      <PageHero
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'المقالات' }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            مقال جديد كل أسبوع
          </>
        }
        title={
          <>
            مقالات في التربية <span className="text-sheen">وعلم النفس</span>
          </>
        }
        body="نصائح عملية قصيرة تقدر تطبقها النهارده، من غير مصطلحات معقدة."
      />

      <section id="results" className={cn(sectionClass, 'scroll-mt-28 pt-8')}>
        <div className={cn(innerClass, 'grid grid-cols-[1fr_260px] items-start gap-7 max-lg:grid-cols-1')}>
          <div className="flex min-w-0 flex-col gap-6">
            {spotlight && <Spotlight article={spotlight} />}
            {list.isError ? (
              <ErrorState onRetry={() => list.refetch()} />
            ) : list.isLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-75 skeleton rounded-card" />
                ))}
              </div>
            ) : articles.length === 0 && !spotlight ? (
              <EmptyState icon="pen" title="مفيش مقالات هنا لسه" body="المقالات الجديدة بتنزل كل أسبوع." />
            ) : (
              <div
                className={cn(
                  'grid stagger grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6 transition-opacity',
                  list.isPlaceholderData && 'opacity-55',
                )}
              >
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
            {list.data && list.data.pagination.totalPages > 1 && (
              <Pager
                pagination={list.data.pagination}
                noun="مقال"
                onChange={(p) => {
                  set({ cat: categoryId, tag: tagId, page: p > 1 ? String(p) : '' })
                  scrollToResults()
                }}
              />
            )}
          </div>

          <aside
            className="sticky top-27 flex flex-col gap-4.5 max-lg:static max-lg:order-first"
            aria-label="تصفية المقالات"
          >
            <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-5">
              <b className="mb-1 font-head text-lg text-ink">الأقسام</b>
              <div
                role="radiogroup"
                aria-label="الأقسام"
                className="flex flex-col gap-1.5 max-lg:flex-row max-lg:flex-wrap"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={!categoryId}
                  className={sideBtn}
                  onClick={() => set({})}
                >
                  الكل
                </button>
                {(categories.data ?? []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={categoryId === c.id}
                    className={sideBtn}
                    onClick={() => set({ cat: c.id })}
                  >
                    {c.name ?? c.nameAr}
                  </button>
                ))}
              </div>
            </div>
            {!!tags.data?.length && (
              <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
                <b className="font-head text-lg text-ink">وسوم شائعة</b>
                <div className="flex flex-wrap gap-2">
                  {tags.data.map((tg) => (
                    <button
                      key={tg.id}
                      type="button"
                      aria-pressed={tagId === tg.id}
                      onClick={() => set({ tag: tagId === tg.id ? '' : tg.id })}
                      className="rounded-full border border-line bg-surface px-3 py-1 text-[13px] text-text-2 aria-pressed:border-blue-400 aria-pressed:bg-surface-blue aria-pressed:text-ink"
                    >
                      #{tg.name ?? tg.nameAr}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex bg-navy flex-col gap-3 rounded-card p-5 text-white max-lg:hidden">
              <b className="font-head text-lg">عايز تتعمق أكتر؟</b>
              <p className="text-sm leading-relaxed text-on-dark">
                الدورات بتشرح كل اللي في المقالات دي خطوة بخطوة.
              </p>
              <Link
                to={routes.courses}
                className={buttonClass({ variant: 'gold', size: 'sm', className: 'self-start' })}
              >
                {t('cta.start')}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

function Spotlight({ article }: { article: ArticleSummary }) {
  const cover = resolveAssetUrl(article.coverImage)
  return (
    <Link
      to={routes.article(article.slug)}
      className="glow-card grid grid-cols-[1fr_1.1fr] overflow-hidden rounded-card border border-line bg-white text-text hover:text-text max-md:grid-cols-1"
    >
      <div className="flex flex-col justify-center gap-3.5 p-8 max-md:order-last max-md:p-6">
        <span className="text-sm font-bold text-blue-600">
          {article.category?.name} · {minutesLabel(readingMinutes(article.content ?? article.shortContent))}{' '}
          قراءة
        </span>
        <h2 className="text-[clamp(24px,3vw,32px)] leading-snug">{article.title}</h2>
        {article.shortContent && (
          <p className="line-clamp-3 leading-loose text-muted">{article.shortContent}</p>
        )}
        <span className="flex gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" size={15} /> {formatDate(article.createdAt)}
          </span>
          {!!article.viewsCount && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="eye" size={15} /> {article.viewsCount} مشاهدة
            </span>
          )}
        </span>
      </div>
      <div className="relative min-h-70" style={{ background: pickBySeed(CARD_GRADS, article.id) }}>
        {cover && <img src={cover} alt="" className="absolute inset-0 size-full cover-photo object-cover" />}
        <span className="absolute top-4 left-4 bg-gold rounded-full px-3 py-1 text-[13px] font-extrabold text-navy">
          مقال مميّز
        </span>
      </div>
    </Link>
  )
}
