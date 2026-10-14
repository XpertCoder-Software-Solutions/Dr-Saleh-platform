import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { accountKeys, myCoursesApi, useMyCourses, type Enrollment } from '@/api/account'
import { routes } from '@/app/routes'
import { useCopy, useGender } from '@/auth/hooks'
import { AccountShell, FilterTabs, Panel, ProgressBar } from '@/components/account/AccountShell'
import { CourseCover } from '@/components/course/CourseCover'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, inputClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { sinceLabel } from '@/lib/format'

type Filter = 'all' | 'active' | 'done'

export function MyCoursesPage() {
  const g = useGender()
  const courses = useMyCourses()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')

  const list = courses.data ?? []
  const done = list.filter((e) => e.completionPercentage >= 100)
  const visible = list
    .filter((e) =>
      filter === 'all'
        ? true
        : filter === 'done'
          ? e.completionPercentage >= 100
          : e.completionPercentage < 100,
    )
    .filter((e) => !q.trim() || e.course.titleAr.includes(q.trim()))

  return (
    <AccountShell
      active="courses"
      pageTitle="دوراتي"
      title={
        <>
          <span className="text-sheen">دوراتي</span>
        </>
      }
      body={g(
        'كل الدورات اللي اشتركت فيها، وتقدّمك في كل واحدة.',
        'كل الدورات اللي اشتركتي فيها، وتقدّمك في كل واحدة.',
        'كل الدورات اللي في حسابك، والتقدّم في كل واحدة.',
      )}
    >
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: 'all', label: 'الكل', count: list.length },
            { id: 'active', label: g('بتتعلمها', 'بتتعلميها', 'جارية'), count: list.length - done.length },
            { id: 'done', label: 'مكتملة', count: done.length },
          ]}
        />
        <label className="relative w-60 max-sm:w-full">
          <span className="sr-only">دوّر في دوراتك</span>
          <Icon name="search" size={16} className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
          <input
            className={cn(inputClass, 'h-11 pr-10')}
            placeholder={g('دوّر في دوراتك…', 'دوّري في دوراتك…', 'دوّر في الدورات…')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </Panel>

      {courses.isError ? (
        <ErrorState onRetry={() => courses.refetch()} />
      ) : courses.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : list.length === 0 ? (
        <Panel>
          <EmptyState
            icon="video"
            title="لسه مفيش دورات في حسابك"
            body={g(
              'أول ما تشترك في دورة هتلاقيها هنا.',
              'أول ما تشتركي في دورة هتلاقيها هنا.',
              'أول اشتراك في دورة هيظهر هنا.',
            )}
            action={
              <Link to={routes.courses} className={buttonClass({ variant: 'gold' })}>
                تصفّح الدورات
              </Link>
            }
          />
        </Panel>
      ) : visible.length === 0 ? (
        <Panel>
          <EmptyState
            compact
            icon="search"
            title="مفيش دورات بالشكل ده"
            body="جرّب فلتر تاني أو امسح البحث."
          />
        </Panel>
      ) : (
        <ul className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
          {visible.map((e) => (
            <EnrolledCard key={e.id} enrollment={e} />
          ))}
        </ul>
      )}

      <Link
        to={routes.courses}
        className="flex items-center gap-4 rounded-card border border-line bg-white p-5 text-inherit hover:bg-hover"
      >
        <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
          <Icon name="search" size={18} />
        </span>
        <span className="flex flex-1 flex-col">
          <b className="text-ink">{g('دوّر على دورة جديدة', 'دوّري على دورة جديدة', 'دورات جديدة')}</b>
          <span className="text-sm text-muted">دورات في التربية وتطوير الذات</span>
        </span>
        <Icon name="arrowLeft" size={18} className="text-blue-600" />
      </Link>
    </AccountShell>
  )
}

function EnrolledCard({ enrollment }: { enrollment: Enrollment }) {
  const t = useCopy()
  const g = useGender()
  const c = enrollment.course
  const progress = useQuery({
    queryKey: accountKeys.progress(enrollment.courseId),
    queryFn: () => myCoursesApi.progress(enrollment.courseId),
  })
  const p = progress.data
  const done = enrollment.completionPercentage >= 100
  const last = sinceLabel(enrollment.updatedAt)

  return (
    <li className="flex lift flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
      <Link to={routes.learn(enrollment.courseId)} className="relative block">
        <CourseCover
          seed={c.categoryId || c.id}
          word={c.category?.nameAr ?? c.titleAr}
          tag={c.category?.nameAr}
          badge={done ? 'مكتملة' : null}
          image={c.thumbnailImage}
          height={190}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg leading-snug">
          <Link to={routes.learn(enrollment.courseId)} className="text-ink">
            {c.titleAr}
          </Link>
        </h3>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
          {p && (
            <span className="flex items-center gap-1">
              <Icon name="video" size={13} /> {p.completedLessons} من {p.totalLessons} درس
            </span>
          )}
          {last && (
            <span className="flex items-center gap-1">
              <Icon name="clock" size={13} /> آخر نشاط: {last}
            </span>
          )}
        </p>
        <ProgressBar value={enrollment.completionPercentage} />
        <div className="mt-auto pt-1">
          {done ? (
            <Link to={routes.certificates} className={buttonClass({ variant: 'outline', block: true })}>
              <Icon name="award" size={16} /> {g('شوف الشهادة', 'شوفي الشهادة', 'الشهادة')}
            </Link>
          ) : (
            <Link
              to={routes.learn(enrollment.courseId)}
              className={buttonClass({ variant: 'gold', block: true })}
            >
              {enrollment.completionPercentage > 0
                ? t('cta.continue')
                : g('ابدأ الدورة', 'ابدئي الدورة', 'بدء الدورة')}
            </Link>
          )}
          {enrollment.completionPercentage >= 50 && (
            <Link
              to={`${routes.course(enrollment.courseId)}?review=1`}
              className="mt-2.5 flex items-center justify-center gap-1.5 text-sm font-bold text-blue-600"
            >
              <Icon name="star" size={15} />
              {g('قيّم الدورة', 'قيّمي الدورة', 'تقييم الدورة')}
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
