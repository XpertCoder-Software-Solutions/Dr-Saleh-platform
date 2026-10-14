import { Link } from 'react-router-dom'
import { resolveAssetUrl } from '@/api/client'
import type { ArticleSummary } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { CARD_GRADS, pickBySeed } from '@/lib/catalog'
import { formatDate, minutesLabel, readingMinutes } from '@/lib/format'

export function ArticleCard({ article }: { article: ArticleSummary }) {
  const cover = resolveAssetUrl(article.coverImage)
  return (
    <Link
      to={routes.article(article.slug)}
      className="glow-card flex flex-col gap-3.5 rounded-card border border-line bg-white px-3.5 pt-3.5 pb-5.5 text-text hover:text-text"
    >
      <div
        className="relative h-50 overflow-hidden rounded-[18px]"
        style={{ background: pickBySeed(CARD_GRADS, article.id) }}
      >
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="size-full cover-photo object-cover" />
        ) : (
          <div className="absolute inset-0 dots opacity-40" />
        )}
        {article.category && (
          <span className="absolute right-3.5 bottom-3.5 rounded-full px-3 py-1.25 text-[13px] font-bold text-white glass">
            {article.category.name}
          </span>
        )}
      </div>
      <div className="flex gap-4 px-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="calendar" size={15} />
          {formatDate(article.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={15} />
          {minutesLabel(readingMinutes(article.content ?? article.shortContent))}
        </span>
      </div>
      <h3 className="px-2 text-xl leading-relaxed font-semibold">{article.title}</h3>
    </Link>
  )
}
