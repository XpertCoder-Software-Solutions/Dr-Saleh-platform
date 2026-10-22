import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { usePendingConfirm, type ConfirmTone } from '@/lib/confirm'
import { dir, tx } from '@/lib/i18n'

const TONE: Record<ConfirmTone, { icon: IconName; ring: string; badge: string; confirm: string }> = {
  danger: {
    icon: 'alert',
    ring: 'bg-red-50',
    badge: 'bg-red-100 text-danger',
    confirm: 'bg-danger text-white hover:bg-[#9a1f18] focus-visible:shadow-[0_0_0_4px_rgba(179,38,30,.25)]',
  },
  warning: {
    icon: 'alert',
    ring: 'bg-amber-50',
    badge: 'bg-amber-100 text-warning',
    confirm: 'bg-navy text-white hover:bg-ink focus-visible:shadow-[0_0_0_4px_rgba(61,155,216,.3)]',
  },
  info: {
    icon: 'bulb',
    ring: 'bg-surface-blue',
    badge: 'bg-blue-100 text-blue-600',
    confirm: 'bg-navy text-white hover:bg-ink focus-visible:shadow-[0_0_0_4px_rgba(61,155,216,.3)]',
  },
}

/** Renders the open confirmation (see lib/confirm.ts); mounted once at the app root. */
export function ConfirmHost() {
  const pending = usePendingConfirm()
  const titleId = useId()
  const bodyId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!pending) return
    returnFocus.current = document.activeElement as HTMLElement | null
    // Destructive actions start on "cancel" so Enter never deletes by accident.
    ;(pending.tone === 'danger' ? cancelRef : confirmRef).current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        pending!.resolve(false)
      } else if (e.key === 'Tab') {
        // Keep focus on the two buttons.
        const order = [cancelRef.current, confirmRef.current]
        const i = order.indexOf(document.activeElement as HTMLButtonElement)
        e.preventDefault()
        order[(i + 1) % 2]?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      returnFocus.current?.focus?.({ preventScroll: true })
    }
  }, [pending])

  if (!pending || typeof document === 'undefined') return null
  const tone = TONE[pending.tone ?? 'danger']

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir={dir}>
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-navy/50 backdrop-blur-[3px]"
        onClick={() => pending.resolve(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={pending.body ? bodyId : undefined}
        className="relative w-full max-w-[420px] animate-confirm-in rounded-[28px] bg-white px-7 pt-8 pb-6 text-center shadow-float max-sm:px-5"
      >
        <span className={cn('mx-auto flex size-22 items-center justify-center rounded-full', tone.ring)}>
          <span
            className={cn('flex size-15 animate-pop items-center justify-center rounded-full', tone.badge)}
          >
            <Icon name={pending.icon ?? tone.icon} size={28} />
          </span>
        </span>
        <h2 id={titleId} className="mt-5 text-[22px] leading-snug text-ink">
          {pending.title}
        </h2>
        {pending.body && (
          <p id={bodyId} className="mt-2 leading-relaxed text-text-2">
            {pending.body}
          </p>
        )}
        <div className="mt-7 grid grid-cols-2 gap-3 max-[360px]:grid-cols-1">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => pending.resolve(false)}
            className="min-h-12 rounded-2xl border-[1.5px] border-line-2 bg-white px-4 font-bold text-ink transition-colors hover:border-blue-300 hover:bg-hover focus-visible:border-blue-400 focus-visible:shadow-[0_0_0_4px_rgba(61,155,216,.2)] focus-visible:outline-none"
          >
            {pending.cancelLabel ?? tx('رجوع', 'Back')}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => pending.resolve(true)}
            className={cn(
              'min-h-12 rounded-2xl border-0 px-4 font-bold transition-[background-color,box-shadow] focus-visible:outline-none',
              tone.confirm,
            )}
          >
            {pending.confirmLabel ?? tx('تأكيد', 'Confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
