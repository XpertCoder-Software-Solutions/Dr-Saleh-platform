import { useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { tx } from '@/lib/i18n'

export interface GalleryItem {
  key: string
  /** Full-size view. */
  main: ReactNode
  /** Thumbnail button content. */
  thumb: ReactNode
  label: string
}

/** Big stage with a row of thumbnails under it (book covers, product photos). */
export function Gallery({
  items,
  className,
  stageClass,
  stageStyle,
  badge,
}: {
  items: GalleryItem[]
  className?: string
  stageClass?: string
  stageStyle?: CSSProperties
  badge?: ReactNode
}) {
  const [i, setI] = useState(0)
  const current = items[Math.min(i, items.length - 1)]
  return (
    <div className={cn('flex min-w-0 flex-col gap-3', className)}>
      <div
        className={cn(
          'relative flex h-110 items-center justify-center overflow-hidden rounded-panel max-sm:h-80',
          stageClass,
        )}
        style={stageStyle}
      >
        <div
          className="absolute top-1/2 left-1/2 size-100 -translate-1/2 animate-spin-slow rounded-full border-2 border-dashed border-white/25"
          aria-hidden="true"
        />
        {badge}
        <div className="relative flex size-full items-center justify-center">{current?.main}</div>
      </div>
      {items.length > 1 && (
        <div className="grid grid-cols-4 gap-3" role="tablist" aria-label={tx('الصور', 'Photos')}>
          {items.map((it, k) => (
            <button
              key={it.key}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={it.label}
              onClick={() => setI(k)}
              className="flex h-20 items-center justify-center overflow-hidden rounded-tile border-2 border-transparent bg-surface-blue aria-selected:border-blue-400"
            >
              {it.thumb}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
