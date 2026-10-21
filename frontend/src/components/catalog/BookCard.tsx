import { Link } from 'react-router-dom'
import { resolveAssetUrl } from '@/api/client'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import {
  activeFormats,
  audioHours,
  bookStartPrice,
  FORMAT_LABEL,
  pickBySeed,
  SHELF_THEMES,
} from '@/lib/catalog'
import { formatMoney } from '@/lib/format'
import type { Book } from '@/types/api'
import { useRegion } from '@/lib/region'

const bookShadow = 'rounded-[4px_10px_10px_4px] shadow-[-10px_16px_30px_-10px_rgba(12,42,74,.55)]'

/** The book itself on its colored shelf: the real cover, or a drawn spine when there is none. */
export function BookCoverArt({
  book,
  className,
  size = 'md',
}: {
  book: Book
  className?: string
  size?: 'md' | 'sm'
}) {
  const cover = resolveAssetUrl(book.coverImage)
  const theme = pickBySeed(SHELF_THEMES, book.id)
  const dims = size === 'sm' ? 'h-16 w-12' : 'h-53.5 w-37.5 max-sm:h-40 max-sm:w-28'
  if (cover) {
    return (
      <img className={cn(bookShadow, 'object-cover', dims, className)} src={cover} alt="" loading="lazy" />
    )
  }
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden px-4 py-4.5',
        bookShadow,
        dims,
        className,
      )}
      style={{ background: theme.grad }}
    >
      <span className="absolute inset-y-0 right-2 w-0.5 bg-white/25" />
      {size === 'md' && (
        <>
          <span className="font-head text-xl leading-[1.3] font-bold text-white max-sm:text-base">
            {book.titleAr}
          </span>
          <span className="text-[11px] text-white/85">د. صالح عبد الكريم</span>
        </>
      )}
    </div>
  )
}

export function BookCard({ book, showCategory }: { book: Book; showCategory?: boolean }) {
  const { currency } = useRegion()
  const theme = pickBySeed(SHELF_THEMES, book.id)
  const price = bookStartPrice(book, currency)
  const formats = [...new Set(activeFormats(book).map((f) => f.formatType))]
  const hours = audioHours(book)
  return (
    <Link
      to={routes.book(book.slug)}
      className="glow-card flex flex-col gap-4 rounded-card border border-line bg-white p-4.5 text-text hover:text-text max-sm:p-3"
    >
      <div
        className="relative flex h-65 items-center justify-center overflow-hidden rounded-2xl max-sm:h-50"
        style={{ background: theme.shelf }}
      >
        <BookCoverArt book={book} className="tilt" />
        {hours && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
            <Icon name="headphones" size={13} /> {hours} س
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
        {showCategory && book.category && (
          <span className="text-[13px] font-bold text-blue-600">{book.category.nameAr}</span>
        )}
        <span className="font-head text-[19px] font-semibold text-ink max-sm:text-base">{book.titleAr}</span>
        {formats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {formats.map((f) => (
              <span
                key={f}
                className="rounded-lg bg-surface-blue px-2.5 py-1 text-[13px] font-semibold text-blue-500"
              >
                {FORMAT_LABEL[f]}
              </span>
            ))}
          </div>
        )}
        {price !== null && (
          <span className="mt-auto text-[15px] text-muted">
            يبدأ من <b className="text-lg text-ink">{formatMoney(price, currency)}</b>
          </span>
        )}
      </div>
    </Link>
  )
}
