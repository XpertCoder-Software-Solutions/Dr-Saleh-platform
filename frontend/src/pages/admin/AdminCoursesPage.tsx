import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminCoursesApi, adminKeys } from '@/api/admin'
import { routes } from '@/app/routes'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { FilterTabs } from '@/components/account/AccountShell'
import { CourseCover } from '@/components/course/CourseCover'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, inputClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { coursePrice, durationLabel, formatEGP } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { VisibilitySwitch } from '@/components/admin/VisibilitySwitch'

type Tab = 'all' | 'live' | 'draft'

export function AdminCoursesPage() {
  usePageTitle('الدورات')
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const courses = useQuery({ queryKey: adminKeys.courses, queryFn: () => adminCoursesApi.list() })
  const all = courses.data?.courses ?? []
  const list = all
    .filter((c) => tab === 'all' || (tab === 'live' ? c.isActive : !c.isActive))
    .filter((c) => !q.trim() || c.titleAr.includes(q.trim()))

  return (
    <>
      <AdminHeader
        title="الدورات"
        sub={`${all.length} دورة · ${all.filter((c) => c.isActive).length} منشورة`}
        actions={
          <Link to={routes.adminCourse('new')} className={buttonClass({ variant: 'navy' })}>
            <Icon name="plus" size={16} /> دورة جديدة
          </Link>
        }
      />
      <AdminCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider p-4">
          <FilterTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'all', label: 'الكل', count: all.length },
              { id: 'live', label: 'منشورة', count: all.filter((c) => c.isActive).length },
              { id: 'draft', label: 'مخفية', count: all.filter((c) => !c.isActive).length },
            ]}
          />
          <label className="relative w-60 max-sm:w-full">
            <span className="sr-only">بحث</span>
            <Icon
              name="search"
              size={15}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
            />
            <input
              className={cn(inputClass, 'h-10 pr-10 text-sm')}
              placeholder="اسم الدورة…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        {courses.isError ? (
          <ErrorState onRetry={() => courses.refetch()} />
        ) : courses.isLoading ? (
          <div className="flex justify-center py-16 text-blue-600">
            <Spinner />
          </div>
        ) : list.length === 0 ? (
          <EmptyState compact icon="video" title="مفيش دورات هنا" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead className="bg-surface text-right text-muted">
                <tr>
                  <th className="px-5 py-3 font-bold">الدورة</th>
                  <th className="px-3 py-3 font-bold">الدروس</th>
                  <th className="px-3 py-3 font-bold">السعر</th>
                  <th className="px-3 py-3 font-bold">التقييم</th>
                  <th className="px-3 py-3 font-bold">الحالة</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const price = coursePrice(c)
                  return (
                    <tr key={c.id} className="border-t border-divider hover:bg-hover">
                      <td className="px-5 py-3">
                        <Link to={routes.adminCourse(c.id)} className="flex items-center gap-3 text-inherit">
                          <span className="w-16 flex-none overflow-hidden rounded-lg">
                            <CourseCover
                              seed={c.categoryId || c.id}
                              word=""
                              image={c.thumbnailImage}
                              height={44}
                            />
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <b className="text-ink">{c.titleAr}</b>
                            <span className="text-xs text-muted">{c.category?.nameAr}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-ink">
                        <b>{c.lessonsCount ?? 0}</b>
                        {!!c.totalDurationSeconds && (
                          <span className="block text-xs text-muted">
                            {durationLabel(c.totalDurationSeconds)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <b className="text-ink">{price.isFree ? 'مجانية' : formatEGP(price.current)}</b>
                        {price.old && <s className="block text-xs text-muted-2">{formatEGP(price.old)}</s>}
                      </td>
                      <td className="px-3 py-3 text-ink">
                        {c.ratingAverage ? (
                          <>
                            <span className="text-gold">★</span> {c.ratingAverage.toFixed(1)}
                            <span className="text-xs text-muted"> ({c.ratingCount})</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <VisibilitySwitch
                          visible={c.isActive}
                          name={c.titleAr}
                          labels={['منشورة', 'مخفية']}
                          save={(isActive) => adminCoursesApi.update(c.id, { isActive })}
                          invalidate={[adminKeys.courses]}
                        />
                      </td>
                      <td className="px-5 py-3 text-left">
                        <Link
                          to={routes.adminCourse(c.id)}
                          aria-label={`تعديل ${c.titleAr}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-blue hover:text-blue-600"
                        >
                          <Icon name="pen" size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  )
}
