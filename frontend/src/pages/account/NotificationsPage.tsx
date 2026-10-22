import { useState } from 'react'
import { useGender } from '@/auth/hooks'
import { AccountShell, FilterTabs, Panel } from '@/components/account/AccountShell'
import { NotificationItem } from '@/components/account/NotificationItem'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { useActivity, useReadState, type ActivityItem } from '@/lib/activity'
import { tx } from '@/lib/i18n'

type Tab = 'all' | 'unread'

const DAY = 24 * 60 * 60 * 1000

/** "النهارده / امبارح / آخر 7 أيام / أقدم" buckets, newest first. */
function groupByDay(items: ActivityItem[], now: number) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const today = start.getTime()
  const groups: { label: string; items: ActivityItem[] }[] = [
    { label: tx('النهارده', 'Today'), items: [] },
    { label: tx('امبارح', 'Yesterday'), items: [] },
    { label: tx('آخر 7 أيام', 'Last 7 days'), items: [] },
    { label: tx('أقدم', 'Older'), items: [] },
  ]
  for (const item of items) {
    const t = +new Date(item.at)
    const i = t >= today ? 0 : t >= today - DAY ? 1 : t >= today - 6 * DAY ? 2 : 3
    groups[i].items.push(item)
  }
  return groups.filter((g) => g.items.length)
}

export function NotificationsPage() {
  const g = useGender()
  const [tab, setTab] = useState<Tab>('all')
  const [now] = useState(() => Date.now())
  const feed = useActivity(100)
  const { isUnread, markRead, markAllRead } = useReadState()
  const unreadCount = feed.items.filter(isUnread).length
  const list = tab === 'unread' ? feed.items.filter(isUnread) : feed.items

  return (
    <AccountShell
      active="notifications"
      pageTitle={tx('الإشعارات', 'Notifications')}
      title={<span className="text-sheen">{tx('الإشعارات', 'Notifications')}</span>}
      body={g(
        'كل اللي حصل في حسابك: الدفع والشحن والشهادات ومواعيد الاستشارات.',
        'كل اللي حصل في حسابك: الدفع والشحن والشهادات ومواعيد الاستشارات.',
        'كل اللي حصل في الحساب: الدفع والشحن والشهادات ومواعيد الاستشارات.',
        'Everything in your account: payments, shipping, certificates and consultation times.',
      )}
    >
      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: tx('الكل', 'All'), count: feed.items.length },
            { id: 'unread', label: tx('غير مقروءة', 'Unread'), count: unreadCount },
          ]}
        />
        <button
          type="button"
          className={buttonClass({ variant: 'outline', size: 'sm' })}
          disabled={unreadCount === 0}
          onClick={markAllRead}
        >
          <Icon name="check" size={15} /> {tx('تعليم الكل كمقروء', 'Mark all as read')}
        </button>
      </Panel>

      {feed.isError ? (
        <ErrorState onRetry={feed.refetch} />
      ) : feed.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : list.length === 0 ? (
        <Panel>
          <EmptyState
            icon="bell"
            title={
              tab === 'unread'
                ? tx('مفيش إشعارات جديدة', 'No new notifications')
                : tx('لسه مفيش إشعارات', 'No notifications yet')
            }
            body={
              tab === 'unread'
                ? g(
                    'قريت كل حاجة 👌',
                    'قريتي كل حاجة 👌',
                    'كل الإشعارات مقروءة 👌',
                    "You're all caught up 👌",
                  )
                : tx(
                    'أول ما يحصل حاجة في طلباتك أو شهاداتك أو استشاراتك هتلاقيها هنا.',
                    'Updates about your orders, certificates and consultations will appear here.',
                  )
            }
          />
        </Panel>
      ) : (
        groupByDay(list, now).map((group) => (
          <Panel key={group.label} className="flex flex-col gap-1 p-3 max-sm:p-2">
            <h2 className="px-3 pt-2 pb-1.5 text-sm font-bold text-muted">{group.label}</h2>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NotificationItem
                    large
                    item={item}
                    unread={isUnread(item)}
                    onRead={() => markRead(item.id)}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        ))
      )}
    </AccountShell>
  )
}
