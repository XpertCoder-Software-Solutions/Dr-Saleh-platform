import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminCoursesApi, adminReviewsApi, type AdminReview } from '@/api/admin'
import { routes } from '@/app/routes'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { FilterTabs, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Pager } from '@/components/ui/Pager'
import { buttonClass, inputClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'

type Tab = 'all' | 'shown' | 'hidden' | 'low'

const KEY = ['admin', 'reviews'] as const

function Stars({ value }: { value: number }) {
  return (
    <span className="tracking-[1px] text-gold" aria-label={`${value} من 5`}>
      {'★'.repeat(value)}
      <span className="text-line-2">{'★'.repeat(5 - value)}</span>
    </span>
  )
}

export function AdminReviewsPage() {
  usePageTitle('التقييمات')
  const [tab, setTab] = useState<Tab>('all')
  const [courseId, setCourseId] = useState('')
  const [page, setPage] = useState(1)
  const courses = useQuery({ queryKey: ['admin', 'courses', 'all'], queryFn: () => adminCoursesApi.list() })
  const params = {
    page,
    limit: 20,
    courseId: courseId || undefined,
    isActive: tab === 'shown' ? true : tab === 'hidden' ? false : undefined,
    rating: undefined as number | undefined,
  }
  const reviews = useQuery({
    queryKey: [...KEY, tab, courseId, page],
    queryFn: async () => {
      if (tab !== 'low') return adminReviewsApi.list(params)
      // "Low" = 1 or 2 stars; the API filters one rating at a time.
      const [one, two] = await Promise.all([
        adminReviewsApi.list({ ...params, rating: 1, limit: 100 }),
        adminReviewsApi.list({ ...params, rating: 2, limit: 100 }),
      ])
      const list = [...one.reviews, ...two.reviews].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      )
      return {
        reviews: list,
        pagination: { page: 1, limit: list.length, total: list.length, totalPages: 1 },
      }
    },
    placeholderData: keepPreviousData,
  })
  const counts = useQuery({
    queryKey: [...KEY, 'counts', courseId],
    queryFn: async () => {
      const c = courseId || undefined
      const [all, hidden] = await Promise.all([
        adminReviewsApi.list({ limit: 1, courseId: c }),
        adminReviewsApi.list({ limit: 1, courseId: c, isActive: false }),
      ])
      return { all: all.pagination.total, hidden: hidden.pagination.total }
    },
  })

  const pick = (t: Tab) => {
    setTab(t)
    setPage(1)
  }

  return (
    <>
      <AdminHeader
        title="التقييمات"
        sub="آراء الطلاب على الدورات. التقييم المخفي مش بيظهر في الموقع ومش بيتحسب في متوسط الدورة."
      />
      <AdminCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider p-4">
          <FilterTabs
            value={tab}
            onChange={pick}
            tabs={[
              { id: 'all', label: 'الكل', count: counts.data?.all },
              {
                id: 'shown',
                label: 'ظاهر',
                count: counts.data ? counts.data.all - counts.data.hidden : undefined,
              },
              { id: 'hidden', label: 'مخفي', count: counts.data?.hidden },
              { id: 'low', label: 'نجمة أو اتنين' },
            ]}
          />
          <select
            aria-label="الدورة"
            className={cn(inputClass, 'h-11 w-auto min-w-56 max-sm:w-full')}
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">كل الدورات</option>
            {(courses.data?.courses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.titleAr}
              </option>
            ))}
          </select>
        </div>
        {reviews.isError ? (
          <ErrorState onRetry={() => reviews.refetch()} />
        ) : reviews.isLoading ? (
          <div className="flex justify-center py-16 text-blue-600">
            <Spinner />
          </div>
        ) : reviews.data!.reviews.length === 0 ? (
          <EmptyState
            compact
            icon="star"
            title="مفيش تقييمات هنا"
            body="الطلاب بيقيّموا الدورة من صفحتها بعد ما يشتركوا فيها."
          />
        ) : (
          <>
            <ul>
              {reviews.data!.reviews.map((r) => (
                <ReviewRow key={r.id} review={r} />
              ))}
            </ul>
            {tab !== 'low' && (
              <div className="border-t border-divider p-4">
                <Pager pagination={reviews.data!.pagination} noun="تقييم" onChange={setPage} />
              </div>
            )}
          </>
        )}
      </AdminCard>
    </>
  )
}

function ReviewRow({ review: r }: { review: AdminReview }) {
  const queryClient = useQueryClient()
  const toggle = useMutation({
    mutationFn: () => adminReviewsApi.setActive(r.id, !r.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      // The course's average and the public list change too.
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
  return (
    <li
      className={cn(
        'flex gap-4 border-t border-divider px-5 py-4 first:border-t-0 max-sm:flex-col max-sm:px-4',
        !r.isActive && 'bg-surface/60',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stars value={r.rating} />
          <b className="text-ink">{r.user?.fullName ?? 'مستخدم محذوف'}</b>
          {r.user?.email && (
            <span className="text-xs text-muted" dir="ltr">
              {r.user.email}
            </span>
          )}
          {!r.isActive && <StatusPill tone="muted">مخفي</StatusPill>}
        </div>
        {r.title && <b className="text-ink">{r.title}</b>}
        {r.comment ? (
          <p className={cn('leading-relaxed text-text-2', !r.isActive && 'text-muted')}>{r.comment}</p>
        ) : (
          <p className="text-sm text-muted">تقييم بالنجوم من غير تعليق.</p>
        )}
        <span className="text-xs text-muted">
          <Link to={routes.course(r.course.id)} target="_blank" className="font-semibold">
            {r.course.titleAr}
          </Link>{' '}
          · {formatDate(r.createdAt)}
        </span>
      </div>
      <div className="flex flex-none items-start gap-2">
        <button
          type="button"
          className={buttonClass({
            variant: r.isActive ? 'outline' : 'navy',
            size: 'sm',
            className: r.isActive ? 'text-danger' : undefined,
          })}
          disabled={toggle.isPending}
          onClick={() => toggle.mutate()}
        >
          {toggle.isPending ? (
            <Spinner />
          ) : r.isActive ? (
            <>
              <Icon name="eyeOff" size={15} /> إخفاء
            </>
          ) : (
            <>
              <Icon name="eye" size={15} /> إظهار
            </>
          )}
        </button>
      </div>
    </li>
  )
}
