import { createPortal } from 'react-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { dismissToast, useToasts, type ToastTone } from '@/lib/toast'
import { dir, tx } from '@/lib/i18n'

const TONE: Record<ToastTone, { icon: IconName; title: string; box: string; badge: string }> = {
  error: {
    icon: 'alert',
    title: tx('فيه مشكلة', 'Something went wrong'),
    box: 'border-red-200',
    badge: 'bg-red-50 text-danger',
  },
  warning: {
    icon: 'alert',
    title: tx('تنبيه', 'Heads up'),
    box: 'border-amber-200',
    badge: 'bg-amber-50 text-warning',
  },
  success: {
    icon: 'check',
    title: tx('تمام', 'Done'),
    box: 'border-green-200',
    badge: 'bg-green-50 text-green-700',
  },
  info: {
    icon: 'bulb',
    title: tx('معلومة', 'Note'),
    box: 'border-line',
    badge: 'bg-surface-blue text-blue-600',
  },
}

/** Popups stacked at the top of the screen; rendered once at the app root. */
export function Toaster() {
  const toasts = useToasts()
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2.5 px-4"
      dir={dir}
    >
      {toasts.map((t) => {
        const tone = TONE[t.tone]
        const urgent = t.tone === 'error' || t.tone === 'warning'
        return (
          <div
            key={t.id}
            role={urgent ? 'alert' : 'status'}
            aria-live={urgent ? 'assertive' : 'polite'}
            className={cn(
              'pointer-events-auto flex w-full max-w-[460px] animate-dd-in items-start gap-3 rounded-card border bg-white p-3.5 shadow-pop',
              tone.box,
            )}
          >
            <span
              className={cn('flex size-10 flex-none items-center justify-center rounded-xl', tone.badge)}
              aria-hidden="true"
            >
              <Icon name={tone.icon} size={20} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <b className="block font-head text-[15px] text-ink">{t.title ?? tone.title}</b>
              <div className="mt-0.5 text-[14.5px] leading-relaxed break-words text-text-2">{t.message}</div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="flex size-9 flex-none items-center justify-center rounded-[10px] border-0 bg-transparent text-muted hover:bg-hover"
              aria-label={tx('إغلاق', 'Close')}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
