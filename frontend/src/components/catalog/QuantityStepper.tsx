import { Icon } from '@/components/ui/Icon'
import { tx } from '@/lib/i18n'

export function QuantityStepper({
  value,
  onChange,
  max = 99,
}: {
  value: number
  onChange: (v: number) => void
  max?: number
}) {
  const btn =
    'flex size-10 items-center justify-center rounded-[10px] border-0 bg-transparent text-ink hover:bg-hover disabled:opacity-40'
  return (
    <div
      className="inline-flex items-center rounded-xl border border-line bg-white p-0.5"
      role="group"
      aria-label={tx('الكمية', 'Quantity')}
    >
      <button
        type="button"
        className={btn}
        aria-label={tx('زوّد', 'Increase')}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Icon name="plus" size={16} />
      </button>
      <span className="w-9 text-center font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        aria-label={tx('قلّل', 'Decrease')}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Icon name="minus" size={16} />
      </button>
    </div>
  )
}
