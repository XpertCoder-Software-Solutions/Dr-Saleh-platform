import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { sinceLabel } from '@/lib/format'
import type { ActivityItem } from '@/lib/activity'

const TINT: Record<ActivityItem['tone'], string> = {
  blue: 'bg-surface-blue text-blue-600',
  gold: 'bg-gold-soft text-gold-ink',
  green: 'bg-[#E7F6EC] text-success',
  red: 'bg-red-50 text-danger',
}

/** One notification: opens its page and marks itself read; unread ones can be marked read in place. */
export function NotificationItem({
  item,
  unread,
  onRead,
  large,
}: {
  item: ActivityItem
  unread: boolean
  onRead: () => void
  large?: boolean
}) {
  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-xl transition-colors hover:bg-hover',
        large ? 'px-4 py-3.5' : 'px-2 py-2.5',
        unread && 'bg-surface-blue/50',
      )}
    >
      <span
        className={cn(
          'flex flex-none items-center justify-center rounded-xl',
          large ? 'size-11' : 'size-9',
          TINT[item.tone],
        )}
      >
        <Icon name={item.icon} size={large ? 18 : 16} />
      </span>
      <Link
        to={item.to}
        onClick={onRead}
        className="flex min-w-0 flex-1 flex-col text-ink after:absolute after:inset-0 after:content-['']"
      >
        <span className={cn('leading-snug', large ? 'text-[15px]' : 'text-sm', unread && 'font-bold')}>
          {item.text}
        </span>
        <span className="text-xs text-muted">{sinceLabel(item.at)}</span>
      </Link>
      {unread && (
        <button
          type="button"
          onClick={onRead}
          title="تعليم كمقروء"
          aria-label="تعليم كمقروء"
          className="relative z-1 flex size-7 flex-none items-center justify-center rounded-full border-0 bg-transparent hover:bg-white"
        >
          <span className="size-2.5 rounded-full bg-blue-400 group-hover:hidden" />
          <Icon name="check" size={14} className="hidden text-blue-600 group-hover:block" />
        </button>
      )}
    </div>
  )
}
