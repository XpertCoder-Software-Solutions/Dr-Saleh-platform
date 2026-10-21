import { Link } from 'react-router-dom'
import type { CourseSummary } from '@/types/api'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { coursePrice, durationLabel, formatMoney, lessonsLabel } from '@/lib/format'
import { CourseCover } from './CourseCover'
import { useRegion } from '@/lib/region'

const NEW_DAYS = 30
// Captured once per page load; precise enough for a "new" badge.
const LOADED_AT = Date.now()

interface CourseCardProps {
  course: CourseSummary
  /** Catalog cards show the category above the title, rating count and a wishlist heart. */
  variant?: 'home' | 'catalog'
  wishlisted?: boolean
  onToggleWishlist?: (courseId: string) => void
}

export function CourseCard({ course, variant = 'home', wishlisted, onToggleWishlist }: CourseCardProps) {
  const { currency } = useRegion()
  const catalog = variant === 'catalog'
  const price = coursePrice(course, currency)
  const isNew = LOADED_AT - new Date(course.createdAt).getTime() < NEW_DAYS * 86_400_000
  const badge = price.discountPercent > 0 ? `خصم ${price.discountPercent}%` : isNew ? 'جديد' : null
  const category = course.category?.nameAr ?? null

  return (
    <article className="glow-card relative flex flex-col overflow-hidden rounded-card border border-line bg-white text-text">
      {/* Whole-card link sits under the wishlist button (no buttons nested inside <a>). */}
      <Link to={routes.course(course.id)} className="absolute inset-0 z-1 rounded-[inherit]">
        <span className="sr-only">{course.titleAr}</span>
      </Link>
      <div className="relative overflow-hidden rounded-t-card">
        <CourseCover
          seed={course.categoryId || course.id}
          word={category ?? course.titleAr}
          tag={category}
          badge={badge}
          image={course.thumbnailImage}
          wordSize={catalog ? 24 : 28}
          height={catalog ? 200 : 230}
        />
        {onToggleWishlist && (
          <button
            type="button"
            className={cn(
              'absolute bottom-3.5 left-3.5 z-2 flex size-10 items-center justify-center rounded-full border-0 bg-white shadow-[0_8px_18px_-8px_rgba(5,20,40,.5)] transition-transform duration-200 hover:scale-108',
              wishlisted ? 'text-danger-dot' : 'text-ink',
            )}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            onClick={() => onToggleWishlist(course.id)}
          >
            <Icon name="heart" size={18} filled={wishlisted} />
          </button>
        )}
      </div>
      <div
        className={cn(
          'flex flex-1 flex-col',
          catalog ? 'gap-2.5 px-5 pt-4.5 pb-5' : 'gap-3.5 px-6 pt-5.5 pb-6',
        )}
      >
        {catalog && category && <span className="text-[13px] font-bold text-blue-600">{category}</span>}
        <h3 className={cn('leading-normal font-semibold', catalog ? 'text-lg' : 'text-[21px]')}>
          {course.titleAr}
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
          {!!course.lessonsCount && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="video" size={16} />
              {lessonsLabel(course.lessonsCount)}
            </span>
          )}
          {!!course.totalDurationSeconds && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={16} />
              {durationLabel(course.totalDurationSeconds)}
            </span>
          )}
          {course.certificateEnabled && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="award" size={16} />
              شهادة
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-divider pt-3.5">
          <span className="flex items-baseline gap-2">
            <span className={cn('text-ink-grad font-bold', catalog ? 'text-xl' : 'text-[23px]')}>
              {price.isFree ? 'مجانًا' : formatMoney(price.current, currency)}
            </span>
            {price.old !== null && <s className="text-[15px] text-muted-2">{formatMoney(price.old, currency)}</s>}
          </span>
          {course.ratingAverage != null && (
            <span
              className="text-[15px] font-semibold text-ink"
              aria-label={`التقييم ${course.ratingAverage} من 5`}
            >
              <span aria-hidden="true" className="text-gold">
                ★
              </span>{' '}
              {course.ratingAverage}
              {catalog && !!course.ratingCount && (
                <small className="text-[13px] font-medium text-muted-2"> ({course.ratingCount})</small>
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export function CourseCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-card border border-line bg-white"
      aria-hidden="true"
    >
      <div className="h-57.5 skeleton rounded-none" />
      <div className="flex flex-col gap-3.5 px-6 pt-5.5 pb-6">
        <div className="h-6 w-4/5 skeleton" />
        <div className="h-4 w-3/5 skeleton" />
        <div className="mt-3 h-7 w-2/5 skeleton" />
      </div>
    </div>
  )
}
