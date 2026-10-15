import { Children, isValidElement, useEffect, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { buttonClass } from './button'
import { cn } from '@/lib/cn'
import { dismissToast, showToast } from '@/lib/toast'

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

/** Plain text of a node tree, so an alert re-pops only when its wording changes. */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children)
  return Children.toArray(node).map(nodeText).join('')
}

/**
 * Errors and warnings show as an on-screen popup (kept while the alert is mounted, closable);
 * success messages stay inline.
 */
export function Alert({
  tone,
  children,
}: {
  tone: 'error' | 'warning' | 'success'
  children: ReactNode
}) {
  const popup = tone !== 'success'
  const text = nodeText(children)
  useEffect(() => {
    if (!popup || !text) return
    const id = showToast(tone, children)
    return () => dismissToast(id)
    // children is re-created every render; the text decides when to show it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup, tone, text])

  if (popup) return null
  return (
    <p
      role="status"
      className="rounded-field border border-green-200 bg-green-50 px-4 py-3 text-[15px] leading-relaxed text-green-800"
    >
      {children}
    </p>
  )
}
