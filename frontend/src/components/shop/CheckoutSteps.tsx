import { Fragment } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { tx } from '@/lib/i18n'

const STEPS = [tx('السلة', 'Cart'), tx('الشحن والدفع', 'Shipping & payment'), tx('التأكيد', 'Confirmation')]

/** "السلة ✓ — الشحن والدفع — التأكيد" progress bar under the checkout hero. */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2" aria-label={tx('خطوات الطلب', 'Order steps')}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current
        const on = n === current
        return (
          <Fragment key={label}>
            {i > 0 && (
              <span
                className={cn('h-0.5 w-10 rounded max-sm:w-4', done || on ? 'bg-blue-400' : 'bg-line')}
                aria-hidden="true"
              />
            )}
            <li className="flex items-center gap-2" aria-current={on ? 'step' : undefined}>
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-sm font-bold',
                  done ? 'bg-gold text-navy' : on ? 'bg-navy text-white' : 'border border-line-2 text-muted',
                )}
              >
                {done ? <Icon name="check" size={14} /> : n}
              </span>
              <span className={cn('text-sm font-bold', on ? 'text-ink' : 'text-muted', 'max-sm:hidden')}>
                {label}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
