import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountKeys, myCoursesApi } from '@/api/account'
import { ApiClientError } from '@/api/client'
import { routes } from '@/app/routes'
import { useGender } from '@/auth/hooks'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { Alert, EmptyState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Lesson } from '@/types/api'

/** Saves watch progress at most this often while a video plays. */
const SAVE_EVERY_MS = 15_000

function minutes(seconds?: number | null) {
  return seconds ? `${Math.max(1, Math.round(seconds / 60))} د` : ''
}

/** Progress ring in the top bar. */
function Ring({ value }: { value: number }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden="true">
      <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="5" />
      <circle
        cx="25"
        cy="25"
        r={r}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 25 25)"
      />
      <text x="25" y="29" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
        {Math.round(value)}%
      </text>
    </svg>
  )
}

export function PlayerPage() {
  const { courseId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const g = useGender()
  const queryClient = useQueryClient()

  const course = useQuery({
    queryKey: accountKeys.course(courseId),
    queryFn: () => myCoursesApi.get(courseId),
  })
  const progress = useQuery({
    queryKey: accountKeys.progress(courseId),
    queryFn: () => myCoursesApi.progress(courseId),
  })
  const cont = useQuery({
    queryKey: [...accountKeys.course(courseId), 'continue'],
    queryFn: () => myCoursesApi.continue(courseId),
    enabled: !params.get('lesson'),
  })
  usePageTitle(course.data?.titleAr ?? 'الدورة')

  const sections = useMemo(
    () =>
      (course.data?.sections ?? [])
        .filter((s) => s.isActive !== false)
        .map((s) => ({ ...s, lessons: (s.lessons ?? []).filter((l) => l.isActive !== false) })),
    [course.data],
  )
  const lessons = useMemo(() => sections.flatMap((s) => s.lessons), [sections])
  const lessonId = params.get('lesson') ?? cont.data?.lessonId ?? lessons[0]?.id
  // Pin the resumed lesson in the URL so finishing it doesn't jump to the next "continue" target.
  useEffect(() => {
    if (!params.get('lesson') && lessonId) setParams({ lesson: lessonId }, { replace: true })
  }, [params, lessonId, setParams])
  const index = lessons.findIndex((l) => l.id === lessonId)
  const lesson: Lesson | undefined = lessons[index]
  const next = index >= 0 ? lessons[index + 1] : undefined
  const sectionNo = sections.findIndex((s) => s.lessons.some((l) => l.id === lessonId)) + 1

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: accountKeys.course(courseId) })
    queryClient.invalidateQueries({ queryKey: accountKeys.courses, exact: true })
  }
  const save = useMutation({
    mutationFn: (body: { completionPercentage: number; watchedSeconds?: number; isCompleted?: boolean }) =>
      myCoursesApi.saveProgress(lessonId!, body),
    onSuccess: (_d, body) => {
      if (body.isCompleted) refresh()
    },
  })

  const go = (id: string) => {
    setParams({ lesson: id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (course.isError) {
    const forbidden = course.error instanceof ApiClientError && [403, 404].includes(course.error.statusCode)
    return (
      <PlayerFrame title="الدورة" progress={0} courseId={courseId}>
        <div className="mx-auto max-w-xl rounded-card bg-white p-8">
          <EmptyState
            icon="lock"
            title={forbidden ? 'الدورة دي مش في حسابك' : 'مقدرناش نفتح الدورة'}
            body={forbidden ? 'اشترك في الدورة الأول عشان تقدر تتفرج على الدروس.' : 'جرّب تاني بعد شوية.'}
            action={
              <Link
                to={forbidden ? routes.course(courseId) : routes.myCourses}
                className={buttonClass({ variant: 'gold' })}
              >
                {forbidden ? 'صفحة الدورة' : 'دوراتي'}
              </Link>
            }
          />
        </div>
      </PlayerFrame>
    )
  }

  if (course.isLoading || !lesson) {
    return (
      <PlayerFrame title={course.data?.titleAr ?? ''} progress={0} courseId={courseId}>
        <div className="flex justify-center py-32 text-white">
          {course.isLoading ? <Spinner /> : <p>الدورة لسه مفيهاش دروس.</p>}
        </div>
      </PlayerFrame>
    )
  }

  const completed = lessons.filter((l) => l.progress?.isCompleted).length
  const isDone = Boolean(lesson.progress?.isCompleted)

  return (
    <PlayerFrame
      title={course.data!.titleAr}
      progress={progress.data?.completionPercentage ?? 0}
      sub={
        progress.data ? `${progress.data.completedLessons} من ${progress.data.totalLessons} دروس` : undefined
      }
      courseId={courseId}
    >
      <div className="grid grid-cols-[1fr_360px] items-start gap-6 max-lg:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-5">
          <LessonMedia
            key={lesson.id}
            courseId={courseId}
            lesson={lesson}
            onProgress={(watchedSeconds, pct) =>
              save.mutate({
                watchedSeconds,
                completionPercentage: pct,
                isCompleted: pct >= 90 ? true : undefined,
              })
            }
          />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted">
                القسم {sectionNo} · الدرس {index + 1}
              </span>
              <h1 className="text-[clamp(22px,3vw,30px)]">{lesson.titleAr}</h1>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                className={buttonClass({ variant: 'outline', className: isDone ? 'text-success' : '' })}
                disabled={isDone || save.isPending}
                onClick={() => save.mutate({ completionPercentage: 100, isCompleted: true })}
              >
                {isDone ? (
                  <>
                    <Icon name="check" size={16} /> مكتمل
                  </>
                ) : (
                  'تحديد كمكتمل'
                )}
              </button>
              {next && (
                <button
                  type="button"
                  className={buttonClass({ variant: 'navy' })}
                  onClick={() => go(next.id)}
                >
                  الدرس التالي <Icon name="arrowLeft" size={16} />
                </button>
              )}
            </div>
          </div>
          {save.isError && <Alert tone="error">مقدرناش نحفظ تقدّمك. {(save.error as Error).message}</Alert>}
          {!next && isDone && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-gold-soft p-5">
              <span className="flex items-center gap-3 text-gold-ink">
                <Icon name="award" size={22} />
                <b>{g('خلّصت آخر درس!', 'خلّصتي آخر درس!', 'آخر درس اتخلص!')}</b>
              </span>
              <Link to={routes.certificates} className={buttonClass({ variant: 'gold', size: 'sm' })}>
                شهاداتي
              </Link>
            </div>
          )}
          <div className="rounded-card border border-line bg-white p-6 max-sm:p-4">
            <h2 className="mb-2 text-lg">عن الدورة</h2>
            <p className="leading-loose text-text-2">{course.data!.shortDescriptionAr}</p>
          </div>
        </div>

        <aside className="sticky top-6 overflow-hidden rounded-card border border-line bg-white max-lg:static">
          <div className="flex items-center justify-between border-b border-divider px-5 py-4">
            <h2 className="text-lg">محتوى الدورة</h2>
            <span className="text-sm font-bold text-muted">
              {completed}/{lessons.length}
            </span>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-2.5 max-lg:max-h-none">
            {sections.map((s, si) => (
              <div key={s.id} className="mb-1">
                {sections.length > 1 && (
                  <p className="px-3 pt-3 pb-1.5 text-xs font-bold text-muted">
                    القسم {si + 1}: {s.titleAr}
                  </p>
                )}
                <ul className="flex flex-col gap-0.5">
                  {s.lessons.map((l) => {
                    const on = l.id === lesson.id
                    const done = l.progress?.isCompleted
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => go(l.id)}
                          aria-current={on ? 'true' : undefined}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-[14px] border-0 px-3 py-2.5 text-right transition-colors',
                            on ? 'bg-surface-blue' : 'bg-transparent hover:bg-hover',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-7 flex-none items-center justify-center rounded-full',
                              done
                                ? 'bg-navy text-white'
                                : on
                                  ? 'border-2 border-gold text-gold'
                                  : 'border border-line-2 text-muted',
                            )}
                          >
                            {done ? (
                              <Icon name="check" size={13} />
                            ) : (
                              <Icon name={l.lessonType === 'PDF' ? 'file' : 'play'} size={12} />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={cn('truncate text-sm', on ? 'font-bold text-ink' : 'text-text')}>
                              {l.titleAr}
                            </span>
                            <span className="text-xs text-muted">
                              {l.lessonType === 'PDF'
                                ? 'ملف PDF'
                                : `فيديو · ${minutes(l.videoDurationSeconds)}`}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PlayerFrame>
  )
}

/** Plays a video lesson (with throttled progress saves) or shows a PDF lesson. */
function LessonMedia({
  courseId,
  lesson,
  onProgress,
}: {
  courseId: string
  lesson: Lesson
  onProgress: (watchedSeconds: number, pct: number) => void
}) {
  const isVideo = lesson.lessonType === 'VIDEO' && lesson.hasVideo !== false
  const media = useQuery({
    queryKey: ['me', 'lesson-url', lesson.id, isVideo ? 'video' : 'pdf'],
    queryFn: () =>
      isVideo ? myCoursesApi.videoUrl(courseId, lesson.id) : myCoursesApi.pdfUrl(courseId, lesson.id),
    staleTime: 30 * 60_000,
    retry: 1,
  })
  const pdf = useQuery({
    queryKey: ['me', 'lesson-url', lesson.id, 'pdf'],
    queryFn: () => myCoursesApi.pdfUrl(courseId, lesson.id),
    enabled: isVideo && Boolean(lesson.hasPdf),
    staleTime: 30 * 60_000,
  })
  const lastSave = useRef(0)
  const [failed, setFailed] = useState(false)
  const startAt = lesson.progress?.isCompleted ? 0 : (lesson.progress?.watchedSeconds ?? 0)

  useEffect(() => {
    lastSave.current = Date.now()
  }, [lesson.id])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-card bg-[#08213C] shadow-float">
        {media.isLoading ? (
          <div className="flex size-full items-center justify-center text-white">
            <Spinner />
          </div>
        ) : media.isError || failed ? (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <Icon name="alert" size={30} className="text-gold" />
            <b>مقدرناش نشغّل الدرس دلوقتي</b>
            <span className="text-sm text-on-dark">
              {media.error instanceof Error ? media.error.message : 'الرابط مش شغال. جرّب تحدّث الصفحة.'}
            </span>
            <button
              type="button"
              className={buttonClass({ variant: 'glass', size: 'sm' })}
              onClick={() => {
                setFailed(false)
                media.refetch()
              }}
            >
              جرّب تاني
            </button>
          </div>
        ) : isVideo ? (
          <video
            className="size-full bg-black"
            src={media.data!.url}
            controls
            controlsList="nodownload"
            playsInline
            onContextMenu={(e) => e.preventDefault()}
            onLoadedMetadata={(e) => {
              if (startAt > 5 && startAt < e.currentTarget.duration - 5) e.currentTarget.currentTime = startAt
            }}
            onError={() => setFailed(true)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget
              if (!v.duration || Date.now() - lastSave.current < SAVE_EVERY_MS) return
              lastSave.current = Date.now()
              onProgress(Math.floor(v.currentTime), Math.round((v.currentTime / v.duration) * 100))
            }}
            onEnded={(e) => onProgress(Math.floor(e.currentTarget.duration), 100)}
          />
        ) : (
          <iframe title={lesson.titleAr} src={media.data!.url} className="size-full bg-white" />
        )}
        {media.data && !failed && (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
            رابط مؤمَّن · بينتهي بعد شوية
          </span>
        )}
      </div>
      {!isVideo && media.data && (
        <a
          href={media.data.url}
          target="_blank"
          rel="noreferrer"
          className={buttonClass({ variant: 'outline', size: 'sm', className: 'self-start' })}
        >
          <Icon name="download" size={15} /> افتح الملف في تاب جديدة
        </a>
      )}
      {pdf.data && (
        <a
          href={pdf.data.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 self-start rounded-tile bg-surface-blue px-4 py-3 font-bold text-ink"
        >
          <span className="rounded-md bg-gold-soft px-2 py-0.5 text-xs text-gold-ink">PDF</span>
          ملف الدرس، تنزيل
        </a>
      )}
    </div>
  )
}

/** Full-screen frame for the player: navy top bar, no site header/footer. */
function PlayerFrame({
  title,
  sub,
  progress,
  courseId,
  children,
}: {
  title: string
  sub?: string
  progress: number
  courseId: string
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="flex bg-navy-wide items-center justify-between gap-4 px-6 py-3 text-white max-sm:px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to={routes.home} className="flex-none max-sm:hidden">
            <img src="/assets/brand/logo-white.webp" alt="منصة د. صالح عبد الكريم" className="h-10 w-auto" />
          </Link>
          <span className="h-8 w-px bg-white/20 max-sm:hidden" aria-hidden="true" />
          <span className="flex min-w-0 flex-col">
            <Link to={routes.myCourses} className="text-xs text-on-dark-muted hover:text-white">
              دوراتي
            </Link>
            <b className="truncate">{title}</b>
          </span>
        </div>
        <div className="flex flex-none items-center gap-4">
          <span className="flex items-center gap-2.5 max-sm:hidden">
            <span className="flex flex-col text-left text-xs">
              <b className="text-sm">تقدّمك في الدورة</b>
              {sub && <span className="text-on-dark">{sub}</span>}
            </span>
            <Ring value={progress} />
          </span>
          <Link to={routes.course(courseId)} className={buttonClass({ variant: 'glass', size: 'sm' })}>
            صفحة الدورة
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-6 max-sm:px-4">{children}</main>
    </div>
  )
}
