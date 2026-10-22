import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  accountKeys,
  myCoursesApi,
  useMyBooks,
  useMyCertificates,
  useMyConsultations,
  useMyCourses,
  type Enrollment,
} from '@/api/account'
import { ordersApi } from '@/api/shop'
import { routes } from '@/app/routes'
import { useAuth, useCopy, useGender } from '@/auth/hooks'
import { AccountShell, Panel, ProgressBar, StatusPill } from '@/components/account/AccountShell'
import { CourseCover } from '@/components/course/CourseCover'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { CONSULT_STATUS, SESSION_TYPE, dateTile, nextSession } from '@/lib/consult-status'
import { formatEGP } from '@/lib/format'
import { orderKinds, orderStatus } from '@/lib/order-status'
import { isEn, loc, tx } from '@/lib/i18n'

/** The course to resume: the most recently touched one that isn't finished. */
function pickCurrent(list: Enrollment[]) {
  return [...list]
    .filter((e) => e.completionPercentage < 100)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0]
}

export function DashboardPage() {
  const { user } = useAuth()
  const t = useCopy()
  const g = useGender()
  const courses = useMyCourses()
  const books = useMyBooks()
  const certs = useMyCertificates()
  const consults = useMyConsultations()
  const orders = useQuery({
    queryKey: [...accountKeys.orders, 'latest'],
    queryFn: () => ordersApi.list({ limit: 3 }),
  })

  const list = courses.data ?? []
  const current = pickCurrent(list)
  const completed = list.filter((e) => e.completionPercentage >= 100).length
  const next = nextSession(consults.data?.items ?? [])

  const stats: { icon: IconName; value: number; label: string; tint: string }[] = [
    {
      icon: 'video',
      value: list.length,
      label: g('دورات مشترك فيها', 'دورات مشتركة فيها', 'دورات في حسابك', 'Enrolled courses'),
      tint: 'bg-surface-blue text-blue-600',
    },
    {
      icon: 'check',
      value: completed,
      label: tx('دورة مكتملة', 'Completed courses'),
      tint: 'bg-[#E7F6EC] text-success',
    },
    {
      icon: 'award',
      value: certs.data?.length ?? 0,
      label: tx('شهادة', 'Certificates'),
      tint: 'bg-gold-soft text-gold-ink',
    },
    {
      icon: 'book',
      value: books.data?.items.length ?? 0,
      label: tx('كتاب في مكتبتك', 'Books in your library'),
      tint: 'bg-red-50 text-danger',
    },
  ]

  return (
    <AccountShell
      active="dashboard"
      pageTitle={tx('حسابي', 'My account')}
      title={
        user?.gender ? (
          <>
            {isEn ? 'Welcome,' : g('أهلًا بيك يا', 'أهلًا بيكي يا')}{' '}
            <span className="text-sheen">{user.firstName}</span>
          </>
        ) : (
          <>
            {tx('أهلًا', 'Welcome,')} <span className="text-sheen">{user?.firstName}</span>
          </>
        )
      }
      body={tx(
        `${t('dash.sub')}، وشهاداتك وطلباتك من مكان واحد.`,
        `${t('dash.sub')}, plus your certificates and orders, all in one place.`,
      )}
    >
      {courses.isError ? (
        <ErrorState onRetry={() => courses.refetch()} />
      ) : courses.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : current ? (
        <ContinueCard enrollment={current} />
      ) : (
        <Panel>
          <EmptyState
            compact
            icon="video"
            title={
              list.length
                ? g(
                    'خلّصت كل دوراتك، برافو!',
                    'خلّصتي كل دوراتك، برافو!',
                    'كل الدورات مكتملة',
                    'You finished all your courses. Well done!',
                  )
                : tx('لسه مفيش دورات في حسابك', 'No courses in your account yet')
            }
            body={tx(
              'فيه دورات جديدة في التربية وتطوير الذات مستنياك.',
              'New courses on parenting and self-development are waiting for you.',
            )}
            action={
              <Link to={routes.courses} className={buttonClass({ variant: 'gold' })}>
                {tx('تصفّح الدورات', 'Browse courses')}
              </Link>
            }
          />
        </Panel>
      )}

      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        {stats.map((s) => (
          <Panel key={s.label} className="flex flex-col items-start gap-3 p-5 max-sm:p-4">
            <span className={`flex size-10 items-center justify-center rounded-xl ${s.tint}`}>
              <Icon name={s.icon} size={18} />
            </span>
            <b className="font-head text-[30px] leading-none text-ink">{s.value}</b>
            <span className="text-sm text-muted">{s.label}</span>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 max-xl:grid-cols-1">
        <Panel className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl">{tx('دوراتي', 'My courses')}</h2>
              <p className="text-sm text-muted">
                {tx(`${list.length} دورات في حسابك`, `${list.length} courses in your account`)}
              </p>
            </div>
            <Link to={routes.myCourses} className="flex items-center gap-1 text-sm font-bold">
              {tx('كل دوراتي', 'All my courses')} <Icon name="arrowLeft" size={14} />
            </Link>
          </div>
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{tx('مفيش دورات لسه.', 'No courses yet.')}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {list.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <Link to={routes.learn(e.courseId)} className="flex items-center gap-3.5 text-inherit">
                    <span className="flex size-13 flex-none bg-navy items-center justify-center overflow-hidden rounded-tile text-white">
                      <Icon name={e.completionPercentage >= 100 ? 'award' : 'play'} size={20} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <b className="truncate text-ink">{loc(e.course.titleAr, e.course.titleEn)}</b>
                      <ProgressBar value={e.completionPercentage} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl">{tx('آخر الطلبات', 'Recent orders')}</h2>
            <Link to={routes.orders} className="flex items-center gap-1 text-sm font-bold">
              {tx('كل الطلبات', 'All orders')} <Icon name="arrowLeft" size={14} />
            </Link>
          </div>
          {orders.isLoading ? (
            <div className="flex justify-center py-6 text-blue-600">
              <Spinner />
            </div>
          ) : !orders.data?.items.length ? (
            <p className="py-6 text-center text-sm text-muted">{tx('مفيش طلبات لسه.', 'No orders yet.')}</p>
          ) : (
            <ul className="flex flex-col">
              {orders.data.items.slice(0, 3).map((o) => {
                const st = orderStatus(o)
                return (
                  <li
                    key={o.id}
                    className="flex items-center gap-3 border-t border-divider py-3 first:border-t-0"
                  >
                    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
                      <Icon name="receipt" size={17} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <b className="text-ink" dir="ltr">
                        #{o.orderNumber}
                      </b>
                      <span className="truncate text-xs text-muted">
                        {orderKinds(o)} · {formatEGP(o.totalAmount)}
                      </span>
                    </span>
                    <StatusPill tone={st.tone}>{st.label}</StatusPill>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl">
            {next ? tx('استشارتك القادمة', 'Your next consultation') : tx('الاستشارات', 'Consultations')}
          </h2>
          <Link to={routes.myConsultations} className="flex items-center gap-1 text-sm font-bold">
            {tx('استشاراتي', 'My consultations')} <Icon name="arrowLeft" size={14} />
          </Link>
        </div>
        {next?.scheduledAt ? (
          <NextSessionRow
            date={next.scheduledAt}
            title={`استشارة ${loc(next.category?.nameAr, next.category?.nameEn) ?? ''}`}
            meta={SESSION_TYPE[next.sessionType ?? ''] ?? tx('أونلاين', 'Online')}
            status={CONSULT_STATUS[next.status].label}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-tile bg-surface-blue p-4">
            <p className="text-sm text-text-2">
              {consults.data?.items.length
                ? tx(
                    'مفيش جلسة متحددة دلوقتي. هنكلمك على واتساب لتحديد الميعاد.',
                    "No session scheduled yet. We'll message you on WhatsApp to set a time.",
                  )
                : tx(
                    'محتاج رأي متخصص في موقف مع ابنك؟ اطلب استشارة وهنكلمك.',
                    'Need expert advice about your child? Request a consultation and we’ll be in touch.',
                  )}
            </p>
            <Link to={routes.consultRequest} className={buttonClass({ variant: 'navy', size: 'sm' })}>
              {t('cta.book')}
            </Link>
          </div>
        )}
      </Panel>
    </AccountShell>
  )
}

function ContinueCard({ enrollment }: { enrollment: Enrollment }) {
  const t = useCopy()
  const c = enrollment.course
  const cont = useQuery({
    queryKey: [...accountKeys.course(enrollment.courseId), 'continue'],
    queryFn: () => myCoursesApi.continue(enrollment.courseId),
  })
  const progress = useQuery({
    queryKey: accountKeys.progress(enrollment.courseId),
    queryFn: () => myCoursesApi.progress(enrollment.courseId),
  })
  const p = progress.data
  const lessonNo = p ? Math.min(p.completedLessons + 1, p.totalLessons) : null

  return (
    <div className="grid grid-cols-[1fr_270px] overflow-hidden rounded-card border border-line bg-white shadow-[0_30px_60px_-40px_rgba(12,42,74,.45)] max-md:grid-cols-1">
      <div className="flex flex-col justify-center gap-3 p-7 max-sm:p-5">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface-blue px-3 py-1 text-xs font-bold text-blue-600">
          <Icon name="play" size={12} /> {tx('كمّل من حيث وقفت', 'Pick up where you left off')}
        </span>
        <h2 className="text-2xl">
          {loc(cont.data?.titleAr, cont.data?.titleEn) ?? loc(c.titleAr, c.titleEn)}
        </h2>
        <p className="text-sm text-muted">
          {loc(c.titleAr, c.titleEn)}
          {lessonNo && p
            ? tx(` · الدرس ${lessonNo} من ${p.totalLessons}`, ` · Lesson ${lessonNo} of ${p.totalLessons}`)
            : ''}
        </p>
        <span className="text-xs font-bold text-muted">{tx('تقدّمك في الدورة', 'Your progress')}</span>
        <ProgressBar value={enrollment.completionPercentage} />
        <Link
          to={routes.learn(enrollment.courseId, cont.data?.lessonId)}
          className={buttonClass({ variant: 'gold', className: 'mt-1 self-start' })}
        >
          {t('cta.continue')} <Icon name="play" size={15} />
        </Link>
      </div>
      <div className="max-md:order-first">
        <CourseCover
          seed={c.categoryId || c.id}
          word={loc(c.category?.nameAr, c.category?.nameEn) ?? loc(c.titleAr, c.titleEn)}
          tag={null}
          image={c.thumbnailImage}
          height={250}
        />
      </div>
    </div>
  )
}

export function NextSessionRow({
  date,
  title,
  meta,
  status,
}: {
  date: string
  title: string
  meta: string
  status: string
}) {
  const d = dateTile(date)
  return (
    <div className="flex items-center gap-4 rounded-tile bg-surface-blue p-4">
      <span className="flex w-16 flex-none flex-col items-center rounded-xl bg-white py-2 text-ink shadow-sm">
        <span className="text-xs text-muted">{d.month}</span>
        <b className="font-head text-2xl leading-tight">{d.day}</b>
        <span className="text-xs text-muted">{d.weekday}</span>
      </span>
      <span className="flex flex-col gap-1">
        <b className="text-ink">{title}</b>
        <span className="text-sm text-muted">
          {d.time} · {meta}
        </span>
        <span className="text-sm font-bold text-success">
          {status} · {tx('هيوصلك اللينك على واتساب', "You'll get the link on WhatsApp")}
        </span>
      </span>
    </div>
  )
}
