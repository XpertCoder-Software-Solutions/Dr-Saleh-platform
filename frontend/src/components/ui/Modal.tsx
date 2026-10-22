import { useEffect, useId, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { tx } from '@/lib/i18n'

interface ModalProps {
  title: string
  sub?: string
  icon?: IconName
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
  width?: number
}

/** Centered dialog with a dimmed backdrop. Escape and the backdrop close it. */
export function Modal({ title, sub, icon, onClose, footer, children, width = 720 }: ModalProps) {
  const id = useId()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={tx('إغلاق', 'Close')}
        className="absolute inset-0 border-0 bg-navy/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-card bg-white shadow-float"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center gap-3 border-b border-divider px-6 py-4 max-sm:px-4">
          {icon && (
            <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
              <Icon name={icon} size={19} />
            </span>
          )}
          <div className="flex-1">
            <h2 id={id} className="text-xl">
              {title}
            </h2>
            {sub && <p className="text-sm text-muted">{sub}</p>}
          </div>
          <button
            type="button"
            aria-label={tx('إغلاق', 'Close')}
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl border border-line bg-white text-muted hover:bg-hover"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 max-sm:px-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider bg-surface px-6 py-4 max-sm:px-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
