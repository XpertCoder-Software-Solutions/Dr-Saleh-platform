import { useState } from 'react'
import { RangeSlider } from '@/components/ui/RangeSlider'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import type { Currency } from '@/lib/region'
import { tx } from '@/lib/i18n'

const STEP: Record<Currency, number> = { EGP: 1, USD: 0.5 }

/** Price range slider ("من" / "إلى") over the prices that actually exist, plus typed boxes. */
export function PriceFilter({
  currency,
  maxPrice,
  min,
  max,
  onChange,
  className,
}: {
  currency: Currency
  /** Highest price on offer; the slider runs from 0 to this. */
  maxPrice: number
  min?: number
  max?: number
  onChange: (min?: number, max?: number) => void
  className?: string
}) {
  const step = STEP[currency]
  const floor = 0
  const ceil = Math.max(step, Math.ceil(maxPrice / step) * step)
  const applied: [number, number] = [min ?? floor, max ?? ceil]
  const [draft, setDraft] = useState<[number, number]>(applied)
  const [boxes, setBoxes] = useState(['', ''])
  const key = `${applied[0]}|${applied[1]}|${floor}|${ceil}`
  const [last, setLast] = useState(key)
  if (last !== key) {
    setLast(key)
    setDraft(applied)
    setBoxes(['', ''])
  }
  const active = min !== undefined || max !== undefined
  const fmt = (n: number) => formatMoney(n, currency)

  function commit([a, b]: [number, number]) {
    const lo = Math.max(floor, Math.min(a, b))
    const hi = Math.min(ceil, Math.max(a, b))
    // The full range means "no price filter".
    onChange(lo <= floor ? undefined : lo, hi >= ceil ? undefined : hi)
  }

  function boxValue(i: 0 | 1) {
    return boxes[i] !== '' ? boxes[i] : String(draft[i])
  }

  function applyBoxes() {
    const parse = (i: 0 | 1) => {
      const n = Number(boxValue(i).replace(/[^\d.]/g, ''))
      return Number.isFinite(n) ? n : draft[i]
    }
    commit([parse(0), parse(1)])
  }

  return (
    <div className={cn('mt-2 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink">{tx('السعر', 'Price')}</span>
        {active && (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-sm font-bold text-blue-500"
            onClick={() => onChange(undefined, undefined)}
          >
            {tx('كل الأسعار', 'All prices')}
          </button>
        )}
      </div>
      {maxPrice <= 0 ? (
        <div className="h-24 skeleton" aria-label={tx('جاري تحميل الأسعار', 'Loading prices')} />
      ) : (
        <>
          <p className="-mt-1 text-sm text-text-2" aria-live="polite">
            {tx('من', 'From')} <b className="text-ink">{fmt(draft[0])}</b> {tx('إلى', 'to')}{' '}
            <b className="text-ink">{fmt(draft[1])}</b>
          </p>
          <RangeSlider
            min={floor}
            max={ceil}
            step={step}
            value={draft}
            onChange={setDraft}
            onCommit={commit}
            formatValue={fmt}
            labels={[tx('أقل سعر', 'Lowest price'), tx('أعلى سعر', 'Highest price')]}
          />
          <form
            className="grid grid-cols-[1fr_auto_1fr] items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              applyBoxes()
            }}
            aria-label={tx('اكتب السعر', 'Type a price')}
          >
            {([0, 1] as const).map((i) => (
              <label key={i} className={cn('flex flex-col gap-1', i === 1 && 'col-start-3')}>
                <span className="text-xs font-semibold text-muted">
                  {i === 0 ? tx('من', 'From') : tx('إلى', 'To')}
                </span>
                <span className="flex h-11 items-center gap-1 rounded-xl border-[1.5px] border-line-2 bg-white px-2.5 focus-within:border-blue-400">
                  <input
                    inputMode="decimal"
                    value={boxValue(i)}
                    onChange={(e) =>
                      setBoxes((b) => (i === 0 ? [e.target.value, b[1]] : [b[0], e.target.value]))
                    }
                    onBlur={applyBoxes}
                    className="w-full min-w-0 border-0 bg-transparent text-center text-[15px] font-semibold text-ink outline-none"
                  />
                  <span className="flex-none text-xs text-muted">
                    {currency === 'USD' ? '$' : tx('ج.م', 'EGP')}
                  </span>
                </span>
              </label>
            ))}
            <span className="col-start-2 row-start-1 pb-3 text-muted" aria-hidden="true">
              –
            </span>
            <button type="submit" className="sr-only">
              {tx('تطبيق', 'Apply')}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
