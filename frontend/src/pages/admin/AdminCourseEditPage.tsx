import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminCoursesApi, adminKeys, type CourseInput } from '@/api/admin'
import { routes } from '@/app/routes'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { CourseCover } from '@/components/course/CourseCover'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { CheckField, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Alert, ErrorState, Spinner } from '@/components/ui/States'
import { durationLabel } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Course, CourseSection, Lesson } from '@/types/api'
import { warnFormErrors } from '@/lib/formErrors'
import { confirmAction } from '@/lib/confirm'

type Form = Omit<CourseInput, 'priceEGP' | 'priceUSD' | 'discountPriceEGP' | 'discountPriceUSD'> & {
  priceEGP: string
  priceUSD: string
  discountPriceEGP: string
  discountPriceUSD: string
}

function toForm(c?: Course): Form {
  return {
    categoryId: c?.categoryId ?? '',
    titleAr: c?.titleAr ?? '',
    titleEn: c?.titleEn ?? '',
    shortDescriptionAr: c?.shortDescriptionAr ?? '',
    shortDescriptionEn: c?.shortDescriptionEn ?? '',
    descriptionAr: c?.descriptionAr ?? '',
    descriptionEn: c?.descriptionEn ?? '',
    promoVideoUrl: c?.promoVideoUrl ?? '',
    priceEGP: c ? String(c.priceEGP) : '',
    priceUSD: c ? String(c.priceUSD) : '',
    discountPriceEGP: c?.discountPriceEGP != null ? String(c.discountPriceEGP) : '',
    discountPriceUSD: c?.discountPriceUSD != null ? String(c.discountPriceUSD) : '',
    certificateEnabled: c?.certificateEnabled ?? true,
    isFeatured: c?.isFeatured ?? false,
    isHomeDisplay: c?.isHomeDisplay ?? false,
    isActive: c?.isActive ?? false,
  }
}

const num = (v: string) => (v.trim() === '' ? null : Number(v))

/** Reads a video's length in the browser so the lesson shows its duration. */
function videoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(v.duration) ? v.duration : undefined)
    }
    v.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    v.src = url
  })
}

export function AdminCourseEditPage() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const course = useQuery({
    queryKey: adminKeys.course(id),
    queryFn: () => adminCoursesApi.get(id),
    enabled: !isNew,
  })
  usePageTitle(isNew ? 'دورة جديدة' : (course.data?.titleAr ?? 'تعديل دورة'))

  if (!isNew && course.isError) return <ErrorState onRetry={() => course.refetch()} />
  if (!isNew && course.isLoading) {
    return (
      <div className="flex justify-center py-24 text-blue-600">
        <Spinner />
      </div>
    )
  }
  return <Editor key={id} course={course.data} />
}

function Editor({ course }: { course?: Course }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [f, setF] = useState<Form>(() => toForm(course))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const categories = useQuery({
    queryKey: ['admin', 'course-categories'],
    queryFn: adminCoursesApi.categories,
  })
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const body: CourseInput = {
        ...f,
        // English fields are required by the API; fall back to the Arabic text.
        shortDescriptionEn: f.shortDescriptionEn.trim() || f.shortDescriptionAr,
        descriptionEn: f.descriptionEn.trim() || f.descriptionAr,
        promoVideoUrl: f.promoVideoUrl?.trim() || undefined,
        priceEGP: Number(f.priceEGP),
        priceUSD: Number(f.priceUSD),
        discountPriceEGP: num(f.discountPriceEGP),
        discountPriceUSD: num(f.discountPriceUSD),
      }
      return course ? adminCoursesApi.update(course.id, body) : adminCoursesApi.create(body)
    },
    onSuccess: ({ course: saved }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.courses })
      if (!course) navigate(routes.adminCourse(saved.id), { replace: true })
      else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!f.categoryId) er.categoryId = 'اختار القسم.'
    if (f.titleAr.trim().length < 3) er.titleAr = 'اكتب اسم الدورة.'
    if (!f.titleEn.trim()) er.titleEn = 'اكتب الاسم بالإنجليزي (بيستخدم في الروابط).'
    if (!f.shortDescriptionAr.trim()) er.shortDescriptionAr = 'اكتب وصف قصير.'
    if (!f.descriptionAr.trim()) er.descriptionAr = 'اكتب وصف الدورة.'
    if (f.priceEGP === '' || Number(f.priceEGP) < 0) er.priceEGP = 'اكتب السعر.'
    if (f.priceUSD === '' || Number(f.priceUSD) < 0) er.priceUSD = 'اكتب السعر بالدولار.'
    if (f.discountPriceEGP && Number(f.discountPriceEGP) >= Number(f.priceEGP))
      er.discountPriceEGP = 'سعر الخصم لازم يكون أقل من السعر.'
    setErrors(er)
    warnFormErrors(er)
    if (Object.keys(er).length) return
    save.mutate()
  }

  return (
    <>
      <AdminHeader
        title={course ? 'تعديل الدورة' : 'دورة جديدة'}
        sub={course?.titleAr}
        actions={
          <>
            <Link to={routes.adminCourses} className={buttonClass({ variant: 'outline' })}>
              <Icon name="chevRight" size={15} /> كل الدورات
            </Link>
            {course && (
              <Link
                to={routes.course(course.id)}
                target="_blank"
                className={buttonClass({ variant: 'outline' })}
              >
                <Icon name="eye" size={15} /> معاينة
              </Link>
            )}
          </>
        }
      />
      <form
        onSubmit={submit}
        noValidate
        className="grid grid-cols-[1fr_320px] items-start gap-6 max-xl:grid-cols-1"
      >
        <AdminCard className="flex flex-col gap-4 p-6 max-sm:p-4">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <TextField
              label="اسم الدورة"
              value={f.titleAr}
              onChange={(e) => set('titleAr', e.target.value)}
              error={errors.titleAr}
            />
            <TextField
              label="الاسم بالإنجليزي"
              ltr
              value={f.titleEn}
              onChange={(e) => set('titleEn', e.target.value)}
              error={errors.titleEn}
            />
            <SelectField
              label="القسم"
              placeholder="اختار القسم"
              value={f.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.nameAr }))}
              error={errors.categoryId}
            />
            <TextField
              label="فيديو تعريفي (يوتيوب، اختياري)"
              ltr
              placeholder="https://youtube.com/watch?v=…"
              value={f.promoVideoUrl ?? ''}
              onChange={(e) => set('promoVideoUrl', e.target.value)}
            />
          </div>
          <TextAreaField
            label="وصف قصير (بيظهر في كارت الدورة)"
            rows={2}
            value={f.shortDescriptionAr}
            onChange={(e) => set('shortDescriptionAr', e.target.value)}
            error={errors.shortDescriptionAr}
          />
          <TextAreaField
            label="عن الدورة"
            rows={6}
            value={f.descriptionAr}
            onChange={(e) => set('descriptionAr', e.target.value)}
            error={errors.descriptionAr}
          />
          <details className="rounded-tile border border-line p-4">
            <summary className="cursor-pointer font-bold text-ink">النسخة الإنجليزية (اختياري)</summary>
            <div className="mt-4 flex flex-col gap-4" dir="ltr">
              <TextAreaField
                label="Short description"
                rows={2}
                value={f.shortDescriptionEn}
                onChange={(e) => set('shortDescriptionEn', e.target.value)}
              />
              <TextAreaField
                label="Description"
                rows={4}
                value={f.descriptionEn}
                onChange={(e) => set('descriptionEn', e.target.value)}
              />
            </div>
          </details>
          <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
            <TextField
              label="السعر (ج.م)"
              type="number"
              min={0}
              ltr
              value={f.priceEGP}
              onChange={(e) => set('priceEGP', e.target.value)}
              error={errors.priceEGP}
            />
            <TextField
              label="بعد الخصم (ج.م)"
              type="number"
              min={0}
              ltr
              value={f.discountPriceEGP}
              onChange={(e) => set('discountPriceEGP', e.target.value)}
              error={errors.discountPriceEGP}
            />
            <TextField
              label="السعر ($)"
              type="number"
              min={0}
              step="0.01"
              ltr
              value={f.priceUSD}
              onChange={(e) => set('priceUSD', e.target.value)}
              error={errors.priceUSD}
            />
            <TextField
              label="بعد الخصم ($)"
              type="number"
              min={0}
              step="0.01"
              ltr
              value={f.discountPriceUSD}
              onChange={(e) => set('discountPriceUSD', e.target.value)}
            />
          </div>
        </AdminCard>

        <div className="sticky top-6 flex flex-col gap-4 max-xl:static">
          {course && <ThumbnailCard course={course} />}
          <AdminCard className="flex flex-col gap-3 p-5">
            <CheckField
              label="منشورة على الموقع"
              checked={f.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
            />
            <CheckField
              label="تظهر في الصفحة الرئيسية"
              checked={f.isHomeDisplay}
              onChange={(e) => set('isHomeDisplay', e.target.checked)}
            />
            <CheckField
              label="دورة مميزة"
              checked={f.isFeatured}
              onChange={(e) => set('isFeatured', e.target.checked)}
            />
            <CheckField
              label="فيها شهادة إتمام"
              checked={f.certificateEnabled}
              onChange={(e) => set('certificateEnabled', e.target.checked)}
            />
            {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
            <button
              type="submit"
              className={buttonClass({ variant: 'navy', block: true })}
              disabled={save.isPending}
            >
              {save.isPending ? (
                <Spinner />
              ) : (
                <>
                  <Icon name="check" size={16} /> {course ? 'حفظ التعديلات' : 'اعمل الدورة'}
                </>
              )}
            </button>
            {saved && <p className="text-center text-sm font-bold text-success">اتحفظت</p>}
            {!course && <p className="text-xs text-muted">بعد ما تتعمل، تقدر ترفع الصورة وتضيف الدروس.</p>}
          </AdminCard>
        </div>
      </form>
      {course && <Curriculum course={course} />}
    </>
  )
}

function ThumbnailCard({ course }: { course: Course }) {
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const upload = useMutation({
    mutationFn: (file: File) => adminCoursesApi.uploadThumbnail(course.id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.course(course.id) }),
  })
  return (
    <AdminCard className="overflow-hidden">
      <div className="relative">
        <CourseCover
          seed={course.categoryId || course.id}
          word={course.category?.nameAr ?? ''}
          image={course.thumbnailImage}
          height={170}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={buttonClass({ variant: 'glass', size: 'sm', className: 'absolute right-3 bottom-3' })}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <Spinner />
          ) : (
            <>
              <Icon name="pen" size={14} /> غيّر الصورة
            </>
          )}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) upload.mutate(file)
          }}
        />
      </div>
      {upload.isError && (
        <div className="p-3">
          <Alert tone="error">{(upload.error as Error).message}</Alert>
        </div>
      )}
    </AdminCard>
  )
}

function Curriculum({ course }: { course: Course }) {
  const queryClient = useQueryClient()
  const sections = [...(course.sections ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.course(course.id) })
  const [title, setTitle] = useState('')
  const addSection = useMutation({
    mutationFn: () =>
      adminCoursesApi.addSection(course.id, {
        titleAr: title.trim(),
        titleEn: title.trim(),
        displayOrder: Math.max(0, ...sections.map((s) => s.displayOrder)) + 1,
      }),
    onSuccess: () => {
      setTitle('')
      refresh()
    },
  })
  const lessonsCount = sections.reduce((n, s) => n + (s.lessons?.length ?? 0), 0)

  return (
    <AdminCard className="mt-6 flex flex-col gap-4 p-6 max-sm:p-4">
      <div>
        <h2 className="text-xl">محتوى الدورة</h2>
        <p className="text-sm text-muted">
          {sections.length} أقسام · {lessonsCount} درس. الفيديوهات والملفات محمية، والطلاب بيشوفوها بروابط
          مؤقتة.
        </p>
      </div>
      {sections.map((s, i) => (
        <SectionBlock key={s.id} section={s} index={i + 1} onChange={refresh} />
      ))}
      <div className="flex flex-wrap items-end gap-2.5 rounded-tile border border-dashed border-line-2 p-4">
        <div className="min-w-60 flex-1">
          <TextField
            label="قسم جديد"
            placeholder="مثال: أساليب التربية الفعّالة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={buttonClass({ variant: 'outline' })}
          disabled={title.trim().length < 2 || addSection.isPending}
          onClick={() => addSection.mutate()}
        >
          <Icon name="plus" size={15} /> إضافة قسم
        </button>
      </div>
      {addSection.isError && <Alert tone="error">{(addSection.error as Error).message}</Alert>}
    </AdminCard>
  )
}

function SectionBlock({
  section,
  index,
  onChange,
}: {
  section: CourseSection
  index: number
  onChange: () => void
}) {
  const [adding, setAdding] = useState(false)
  const lessons = [...(section.lessons ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
  const remove = useMutation({
    mutationFn: () => adminCoursesApi.removeSection(section.id),
    onSuccess: onChange,
  })
  const toggle = useMutation({
    mutationFn: () => adminCoursesApi.updateSection(section.id, { isActive: !section.isActive }),
    onSuccess: onChange,
  })

  return (
    <div className="overflow-hidden rounded-tile border border-line">
      <div className="flex flex-wrap items-center gap-3 bg-surface px-4 py-3">
        <b className="flex-1 text-ink">
          القسم {index}: {section.titleAr}
          {!section.isActive && <span className="mr-2 text-xs font-normal text-muted">(مخفي)</span>}
        </b>
        <button
          type="button"
          className={buttonClass({ variant: 'ghost', size: 'sm' })}
          onClick={() => toggle.mutate()}
        >
          {section.isActive ? 'إخفاء' : 'إظهار'}
        </button>
        {lessons.length === 0 && (
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
            onClick={async () => {
              if (
                await confirmAction({
                  title: 'تحذف القسم؟',
                  body: 'هيتحذف القسم وكل الدروس اللي جواه.',
                  confirmLabel: 'أيوه، احذف',
                  icon: 'trash',
                })
              )
                remove.mutate()
            }}
          >
            حذف
          </button>
        )}
      </div>
      <ul>
        {lessons.map((l) => (
          <LessonRow key={l.id} lesson={l} onChange={onChange} />
        ))}
      </ul>
      {(remove.isError || toggle.isError) && (
        <div className="px-4 pb-3">
          <Alert tone="error">{((remove.error ?? toggle.error) as Error).message}</Alert>
        </div>
      )}
      {adding ? (
        <NewLessonForm
          sectionId={section.id}
          nextOrder={Math.max(0, ...lessons.map((l) => l.displayOrder)) + 1}
          onDone={() => {
            setAdding(false)
            onChange()
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-2 border-0 border-t border-divider bg-white px-4 py-3 text-sm font-bold text-blue-600 hover:bg-hover"
        >
          <Icon name="plus" size={14} /> درس جديد
        </button>
      )}
    </div>
  )
}

function LessonRow({ lesson, onChange }: { lesson: Lesson; onChange: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number | null>(null)
  const patch = useMutation({
    mutationFn: (body: Parameters<typeof adminCoursesApi.updateLesson>[1]) =>
      adminCoursesApi.updateLesson(lesson.id, body),
    onSuccess: onChange,
  })
  const remove = useMutation({
    mutationFn: () => adminCoursesApi.removeLesson(lesson.id),
    onSuccess: onChange,
  })
  const media = useMutation({
    mutationFn: async (file: File) => {
      const isVideo = file.type.startsWith('video/')
      const duration = isVideo ? await videoDuration(file) : undefined
      return adminCoursesApi.replaceLessonMedia(
        lesson.id,
        isVideo ? { video: file } : { pdf: file },
        duration,
        setPct,
      )
    },
    onSettled: () => setPct(null),
    onSuccess: onChange,
  })
  const error = patch.error ?? remove.error ?? media.error

  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-divider px-4 py-3 first:border-t-0">
      <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-surface-blue text-blue-600">
        <Icon name={lesson.lessonType === 'PDF' ? 'file' : 'play'} size={14} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <b className="truncate text-sm text-ink">
          {lesson.titleAr}
          {!lesson.isActive && <span className="mr-2 text-xs font-normal text-muted">(مخفي)</span>}
        </b>
        <span className="text-xs text-muted">
          {lesson.lessonType === 'PDF'
            ? 'ملف PDF'
            : `فيديو${lesson.videoDurationSeconds ? ` · ${durationLabel(lesson.videoDurationSeconds)}` : ''}`}
          {lesson.lessonType === 'VIDEO' && lesson.hasPdf && ' · + ملف PDF'}
          {lesson.isPreview && ' · معاينة مجانية'}
        </span>
      </span>
      {pct !== null ? (
        <span className="text-sm font-bold text-blue-600">بيترفع {pct}%</span>
      ) : (
        <span className="flex flex-wrap gap-1">
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm' })}
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="download" size={13} className="rotate-180" />{' '}
            {lesson.lessonType === 'PDF' ? 'استبدال الملف' : 'فيديو / PDF'}
          </button>
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm' })}
            onClick={() => patch.mutate({ isPreview: !lesson.isPreview })}
          >
            {lesson.isPreview ? 'إلغاء المعاينة' : 'معاينة مجانية'}
          </button>
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm' })}
            onClick={() => patch.mutate({ isActive: !lesson.isActive })}
          >
            {lesson.isActive ? 'إخفاء' : 'إظهار'}
          </button>
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
            onClick={async () => {
              if (
                await confirmAction({
                  title: `تحذف «${lesson.titleAr}»؟`,
                  body: 'الدرس هيتشال من الدورة ومش هيظهر للطلاب.',
                  confirmLabel: 'أيوه، احذف',
                  icon: 'trash',
                })
              )
                remove.mutate()
            }}
          >
            حذف
          </button>
        </span>
      )}
      <input
        ref={fileInput}
        type="file"
        accept={
          lesson.lessonType === 'PDF'
            ? 'application/pdf'
            : 'video/mp4,video/webm,video/quicktime,application/pdf'
        }
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) media.mutate(file)
        }}
      />
      {error && (
        <div className="w-full">
          <Alert tone="error">
            {(error as Error).message}
            {/progress|content sessions/i.test((error as Error).message) &&
              ' — الدرس عليه تقدّم طلاب، خبّيه بدل ما تحذفه.'}
          </Alert>
        </div>
      )}
    </li>
  )
}

function NewLessonForm({
  sectionId,
  nextOrder,
  onDone,
  onCancel,
}: {
  sectionId: string
  nextOrder: number
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [video, setVideo] = useState<File | null>(null)
  const [pdf, setPdf] = useState<File | null>(null)
  const [preview, setPreview] = useState(false)
  const [pct, setPct] = useState<number | null>(null)
  const create = useMutation({
    mutationFn: async () => {
      const duration = video ? await videoDuration(video) : undefined
      return adminCoursesApi.addLesson(
        sectionId,
        {
          titleAr: title.trim(),
          titleEn: title.trim(),
          displayOrder: nextOrder,
          isPreview: preview,
          durationSeconds: duration,
        },
        { video: video ?? undefined, pdf: pdf ?? undefined },
        setPct,
      )
    },
    onSettled: () => setPct(null),
    onSuccess: onDone,
  })

  return (
    <div className="flex flex-col gap-3 border-t border-divider bg-surface-blue/40 p-4">
      <TextField label="اسم الدرس" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
          فيديو الدرس (mp4)
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            className="text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
          ملف PDF {video ? '(مرفق، اختياري)' : ''}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            className="text-sm font-normal"
          />
        </label>
      </div>
      <CheckField
        label="معاينة مجانية (يتفرج عليه أي حد)"
        checked={preview}
        onChange={(e) => setPreview(e.target.checked)}
      />
      {create.isError && <Alert tone="error">{(create.error as Error).message}</Alert>}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className={buttonClass({ variant: 'navy', size: 'sm' })}
          disabled={title.trim().length < 2 || (!video && !pdf) || create.isPending}
          onClick={() => create.mutate()}
        >
          {pct !== null ? `بيترفع ${pct}%` : create.isPending ? <Spinner /> : 'إضافة الدرس'}
        </button>
        <button
          type="button"
          className={buttonClass({ variant: 'ghost', size: 'sm' })}
          onClick={onCancel}
          disabled={create.isPending}
        >
          إلغاء
        </button>
      </div>
    </div>
  )
}
