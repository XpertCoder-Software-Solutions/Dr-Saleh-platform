import type { Pagination } from '@/types/api'
import { Icon } from './Icon'
import { tx } from '@/lib/i18n'

const pageBtn =
  'flex h-11 min-w-11 items-center justify-center rounded-xl border-[1.5px] border-line-2 bg-white font-bold text-ink ' +
  'disabled:cursor-not-allowed disabled:opacity-40 aria-[current=page]:border-transparent aria-[current=page]:bg-navy aria-[current=page]:text-white'

/** "عرض 1-9 من 24" plus numbered page buttons with gaps. */
export function Pager({
  pagination,
  noun,
  onChange,
}: {
  pagination: Pagination
  noun: string
  onChange: (page: number) => void
}) {
  const { page, totalPages, total, limit } = pagination
  const from = (page - 1) * limit + 1
  const to = Math.min(total, page * limit)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )
  return (
    <nav
      className="mt-7 flex flex-wrap items-center justify-between gap-3.5 text-[15px] text-muted"
      aria-label={tx('الصفحات', 'Pages')}
    >
      <span>{tx(`عرض ${from}-${to} من ${total} ${noun}`, `Showing ${from}-${to} of ${total} ${noun}`)}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={pageBtn}
          aria-label={tx('الصفحة السابقة', 'Previous page')}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <Icon name="arrowRight" size={16} />
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-2">
            {i > 0 && p - pages[i - 1] > 1 && <span>…</span>}
            <button
              type="button"
              className={pageBtn}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          </span>
        ))}
        <button
          type="button"
          className={pageBtn}
          aria-label={tx('الصفحة التالية', 'Next page')}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
      </div>
    </nav>
  )
}
