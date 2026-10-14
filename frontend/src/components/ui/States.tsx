import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { buttonClass } from './button'
import { cn } from '@/lib/cn'

interface StateProps {
  icon?: IconName
  title: string
  body?: ReactNode
  action?: ReactNode
  compact?: boolean
}

const box =
  'flex flex-col items-center gap-3 rounded-card border border-dashed border-line-2 bg-white px-6 text-center'

export function EmptyState({ icon = 'sparkle', title, body, action, compact }: StateProps) {
  return (
    <div className={cn(box, compact ? 'py-8' : 'py-14')} role="status">
      <span className="flex size-15 items-center justify-center rounded-[18px] bg-surface-blue text-blue-600">
        <Icon name={icon} size={26} />
      </span>
      <b className="font-head text-xl text-ink">{title}</b>
      {body && <p className="max-w-105 leading-loose text-muted">{body}</p>}
      {action}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  compact,
}: {
  message?: string
  onRetry?: () => void
  compact?: boolean
}) {
  return (
    <div className={cn(box, compact ? 'py-8' : 'py-14')} role="alert">
      <span className="flex size-15 items-center justify-center rounded-[18px] bg-red-50 text-danger">
        <Icon name="alert" size={26} />
      </span>
      <b className="font-head text-xl text-ink">مقدرناش نحمّل البيانات</b>
      <p className="max-w-105 leading-loose text-muted">
        {message ?? 'حصلت مشكلة في الاتصال. حاول تاني بعد شوية.'}
      </p>
      {onRetry && (
        <button type="button" className={buttonClass({ variant: 'outline', size: 'sm' })} onClick={onRetry}>
          <Icon name="refresh" size={16} />
          حاول تاني
        </button>
      )}
    </div>
  )
}

export function Spinner({ label = 'جاري التحميل' }: { label?: string }) {
  return (
    <span
      className="inline-block size-5.5 animate-spin rounded-full border-[2.5px] border-current border-t-transparent align-middle"
      role="status"
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function Alert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-field border px-4 py-3 text-[15px] leading-relaxed',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-danger'
          : 'border-green-200 bg-green-50 text-green-800',
      )}
    >
      {children}
    </p>
  )
}
