import { useEffect, useId, useRef, useState } from 'react'
import { PriceFilter } from '@/components/catalog/PriceFilter'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import type { Currency } from '@/lib/region'

/**
 * Toolbar version of the price filter: a pill that opens the range slider in a small panel.
 * Shows the chosen range on the pill, with its own clear button, so the filter state is
 * visible without opening it.
 */
export function PricePill({
  currency,
  maxPrice,
  min,
  max,
  onChange,
  resultCount,
  className,
}: {
  currency: Currency
  maxPrice: number
  min?: number
  max?: number
  onChange: (min?: number, max?: number) => void
  /** Shown on the panel's button ("اعرض 5 نتايج"). */
  resultCount?: number
  className?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const active = min !== undefined || max !== undefined
  const fmt = (n: number) => formatMoney(n, currency)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector<HTMLElement>('input[type=range]')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const summary = active
    ? min !== undefined && max !== undefined
      ? `${fmt(min)} – ${fmt(max)}`
      : min !== undefined
        ? `من ${fmt(min)}`
        : `لحد ${fmt(max!)}`
    : null

  return (
    <div ref={rootRef} className={cn('relative', open && 'z-50', className)}>
      <div
        className={cn(
          'flex min-h-13 items-center rounded-field border-[1.5px] transition-colors',
          active ? 'bg-navy border-navy text-white' : 'border-line bg-white text-ink hover:border-blue-300',
          open && !active && 'border-blue-400 shadow-[0_0_0_4px_rgba(61,155,216,.15)]',
        )}
      >
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex min-h-12 items-center gap-2 rounded-field border-0 bg-transparent font-bold text-inherit',
            active ? 'ps-4 pe-1' : 'px-4',
          )}
        >
          <Icon name="sliders" size={17} />
          <span>السعر</span>
          {summary && <span className="font-semibold opacity-90">· {summary}</span>}
          {!active && (
            <Icon name="chevDown" size={15} className={cn('transition-transform', open && 'rotate-180')} />
          )}
        </button>
        {active && (
          <button
            type="button"
            aria-label="شيل فلتر السعر"
            onClick={() => onChange(undefined, undefined)}
            className="me-1 flex size-10 items-center justify-center rounded-full border-0 bg-transparent text-white hover:bg-white/15"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      {open && (
        <div
          ref={panelRef}
          id={`${id}-panel`}
          role="dialog"
          aria-label="تصفية بالسعر"
          className="absolute end-0 top-full z-40 mt-2.5 w-[min(360px,calc(100vw-32px))] animate-dd-in rounded-card border border-line bg-white p-5 shadow-pop max-sm:-end-2"
        >
          <PriceFilter
            className="mt-0"
            currency={currency}
            maxPrice={maxPrice}
            min={min}
            max={max}
            onChange={onChange}
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              buttonRef.current?.focus()
            }}
            className="mt-4 flex min-h-11 w-full bg-navy items-center justify-center rounded-xl border-0 font-bold text-white hover:bg-ink"
          >
            {resultsLabel(resultCount)}
          </button>
        </div>
      )}
    </div>
  )
}

/** "اعرض 3 نتايج" with the Arabic count agreement. */
function resultsLabel(n?: number) {
  if (n === undefined) return 'تمام'
  if (n === 0) return 'مفيش نتايج'
  if (n === 1) return 'اعرض نتيجة واحدة'
  if (n === 2) return 'اعرض نتيجتين'
  return `اعرض ${n} ${n <= 10 ? 'نتايج' : 'نتيجة'}`
}
