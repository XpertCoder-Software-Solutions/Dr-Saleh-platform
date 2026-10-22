import { useId } from 'react'
import { tx } from '@/lib/i18n'

/**
 * Dual-thumb range slider: two native range inputs stacked on one track, so keyboard
 * (arrows, Home/End, PageUp/PageDown) and screen readers work out of the box. Follows the
 * page direction: in RTL the low end sits on the right.
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  onCommit,
  formatValue = String,
  labels = [tx('أقل قيمة', 'Minimum'), tx('أعلى قيمة', 'Maximum')],
}: {
  min: number
  max: number
  step?: number
  value: [number, number]
  /** While dragging. */
  onChange: (value: [number, number]) => void
  /** When a thumb is released or moved by keyboard. */
  onCommit?: (value: [number, number]) => void
  formatValue?: (n: number) => string
  labels?: [string, string]
}) {
  const id = useId()
  const span = Math.max(max - min, step)
  const [lo, hi] = value
  const pct = (n: number) => ((Math.min(Math.max(n, min), max) - min) / span) * 100

  const commit = () => onCommit?.(value)

  return (
    <div className="relative h-11 select-none" dir="inherit">
      {/* track */}
      <div className="absolute inset-x-[13px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
      {/* selected part */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-linear-90 from-navy to-blue-500"
        style={{
          insetInlineStart: `calc(13px + (100% - 26px) * ${pct(lo) / 100})`,
          insetInlineEnd: `calc(13px + (100% - 26px) * ${(100 - pct(hi)) / 100})`,
        }}
      />
      {(['lo', 'hi'] as const).map((which) => {
        const isLo = which === 'lo'
        const v = isLo ? lo : hi
        return (
          <input
            key={which}
            id={`${id}-${which}`}
            type="range"
            min={min}
            max={max}
            step={step}
            value={v}
            aria-label={isLo ? labels[0] : labels[1]}
            aria-valuetext={formatValue(v)}
            onChange={(e) => {
              const n = Number(e.target.value)
              onChange(isLo ? [Math.min(n, hi), hi] : [lo, Math.max(n, lo)])
            }}
            onPointerUp={commit}
            onKeyUp={commit}
            onTouchEnd={commit}
            // Keep the low thumb grabbable when both sit at the top end.
            className={`range-thumb absolute inset-0 m-0 h-full w-full ${isLo && lo >= max - step ? 'z-20' : 'z-10'}`}
          />
        )
      })}
    </div>
  )
}
