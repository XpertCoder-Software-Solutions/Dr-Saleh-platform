import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminCoursesApi, adminKeys, type CourseInput } from '@/api/admin'
import { routes } from '@/app/routes'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { CourseCover } from '@/components/course/CourseCover'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { CheckField, SelectField, TextField } from '@/components/ui/fields'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { FileDrop, UploadBar } from '@/components/admin/FileDrop'
import { isRichEmpty } from '@/lib/richText'
import { toast } from '@/lib/toast'
import { resolveAssetUrl } from '@/api/client'
import { Alert, ErrorState, Spinner } from '@/components/ui/States'
import { durationLabel } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Course, CourseSection, Lesson } from '@/types/api'
import { warnFormErrors } from '@/lib/formErrors'
import { confirmAction } from '@/lib/confirm'

type Form = Omit<CourseInput, 'priceEGP' | 'priceUSD' | 'discountPriceEGP' | 'discountPriceUSD' | 'slug'> & {
  slug: string
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
    slug: c?.slug ?? '',
    shortDescriptionAr: c?.shortDescriptionAr ?? '',
    shortDescriptionEn: c?.shortDescriptionEn ?? '',
    descriptionAr: c?.descriptionAr ?? '',
    descriptionEn: c?.descriptionEn ?? '',
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

/** "Positive Parenting 101" → "positive-parenting-101" */
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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
  // A new course's slug follows the English name until it's edited by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(course?.slug))
  // Files picked before the course exists are uploaded right after it's created.
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [promoFile, setPromoFile] = useState<File | null>(null)
  const [promoPct, setPromoPct] = useState<number | null>(null)
  const categories = useQuery({
    queryKey: ['admin', 'course-categories'],
    queryFn: adminCoursesApi.categories,
  })
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = useMutation({
    mutationFn: async () => {
      const body: CourseInput = {
        ...f,
        slug: f.slug.trim() || undefined,
        // English fields are required by the API; fall back to the Arabic text.
        shortDescriptionEn: f.shortDescriptionEn.trim() || f.shortDescriptionAr,
        descriptionEn: f.descriptionEn.trim() || f.descriptionAr,
        priceEGP: Number(f.priceEGP),
        priceUSD: Number(f.priceUSD),
        discountPriceEGP: num(f.discountPriceEGP),
        discountPriceUSD: num(f.discountPriceUSD),
      }
      const result = course
        ? await adminCoursesApi.update(course.id, body)
        : await adminCoursesApi.create(body)
      if (!course) {
        const id = result.course.id
        if (thumbFile) await adminCoursesApi.uploadThumbnail(id, thumbFile)
        if (promoFile) await adminCoursesApi.uploadPromoVideo(id, promoFile, setPromoPct)
      }
      return result
    },
    onSettled: () => setPromoPct(null),
    onSuccess: ({ course: saved }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.courses })
      if (!course) {
        toast.success('الدورة اتعملت. ضيف الأقسام والدروس تحت.')
        navigate(routes.adminCourse(saved.id), { replace: true })
      } else {
        setF((x) => ({ ...x, slug: saved.slug ?? x.slug }))
        queryClient.invalidateQueries({ queryKey: adminKeys.course(course.id) })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.titleAr.trim().length < 3) er.titleAr = 'اكتب اسم الدورة.'
    if (!f.titleEn.trim()) er.titleEn = 'اكتب اسم الدورة بالإنجليزي.'
    if (!f.categoryId) er.categoryId = 'اختار القسم.'
    if (f.slug.trim() && !SLUG_RE.test(f.slug.trim()))
      er.slug = 'حروف إنجليزي صغيرة وأرقام وشَرطة (-) بس، من غير مسافات.'
    if (f.priceEGP === '' || Number(f.priceEGP) < 0) er.priceEGP = 'اكتب السعر بالجنيه.'
    if (f.priceUSD === '' || Number(f.priceUSD) < 0) er.priceUSD = 'اكتب السعر بالدولار.'
    if (f.discountPriceEGP && Number(f.discountPriceEGP) >= Number(f.priceEGP))
      er.discountPriceEGP = 'لازم يكون أقل من السعر بالجنيه.'
    if (f.discountPriceUSD && Number(f.discountPriceUSD) >= Number(f.priceUSD))
      er.discountPriceUSD = 'لازم يكون أقل من السعر بالدولار.'
    if (isRichEmpty(f.shortDescriptionAr)) er.shortDescriptionAr = 'اكتب معلومات عن الدورة.'
    if (isRichEmpty(f.descriptionAr)) er.descriptionAr = 'اكتب وصف الدورة.'
    setErrors(er)
    warnFormErrors(er)
    if (Object.keys(er).length) return
    save.mutate()
  }

  const section = (title: string, sub?: string) => (
    <div className="mt-2 flex flex-col gap-0.5 border-t border-divider pt-5 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="text-lg">{title}</h2>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  )

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
                to={routes.course(course.slug || course.id)}
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
          {section('البيانات الأساسية')}
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <TextField
              label="اسم الدورة (عربي)"
              value={f.titleAr}
              onChange={(e) => set('titleAr', e.target.value)}
              error={errors.titleAr}
            />
            <TextField
              label="اسم الدورة (إنجليزي)"
              ltr
              value={f.titleEn}
              onChange={(e) => {
                const v = e.target.value
                setF((x) => ({ ...x, titleEn: v, slug: slugTouched ? x.slug : slugify(v) }))
              }}
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
              label="اسم الرابط (Slug)"
              ltr
              placeholder="positive-parenting"
              value={f.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))
              }}
              error={errors.slug}
              hint={
                <span dir="ltr" className="block truncate text-start">
                  /courses/{f.slug.trim() || slugify(f.titleEn) || '…'}
                </span>
              }
            />
          </div>

          {section('الأسعار', 'سيب سعر الخصم فاضي لو مفيش خصم.')}
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <TextField
              label="السعر بالجنيه"
              type="number"
              min={0}
              ltr
              value={f.priceEGP}
              onChange={(e) => set('priceEGP', e.target.value)}
              error={errors.priceEGP}
            />
            <TextField
              label="السعر بالدولار"
              type="number"
              min={0}
              step="0.01"
              ltr
              value={f.priceUSD}
              onChange={(e) => set('priceUSD', e.target.value)}
              error={errors.priceUSD}
            />
            <TextField
              label="بعد الخصم بالجنيه"
              type="number"
              min={0}
              ltr
              value={f.discountPriceEGP}
              onChange={(e) => set('discountPriceEGP', e.target.value)}
              error={errors.discountPriceEGP}
            />
            <TextField
              label="بعد الخصم بالدولار"
              type="number"
              min={0}
              step="0.01"
              ltr
              value={f.discountPriceUSD}
              onChange={(e) => set('discountPriceUSD', e.target.value)}
              error={errors.discountPriceUSD}
            />
          </div>

          {section('معلومات عن الدورة', 'نبذة قصيرة بتظهر تحت اسم الدورة.')}
          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            <RichTextEditor
              label="بالعربي"
              compact
              minHeight={110}
              value={f.shortDescriptionAr}
              onChange={(v) => set('shortDescriptionAr', v)}
              error={errors.shortDescriptionAr}
              placeholder="الدورة دي هتساعدك…"
            />
            <RichTextEditor
              label="English"
              dir="ltr"
              compact
              minHeight={110}
              value={f.shortDescriptionEn}
              onChange={(v) => set('shortDescriptionEn', v)}
              hint="اختياري؛ لو فاضي هيتاخد العربي."
            />
          </div>

          {section(
            'وصف الدورة',
            'الشرح الكامل في قسم «عن الدورة»: استخدم العناوين والقوائم علشان يبقى سهل القراءة.',
          )}
          <RichTextEditor
            label="بالعربي"
            minHeight={220}
            value={f.descriptionAr}
            onChange={(v) => set('descriptionAr', v)}
            error={errors.descriptionAr}
          />
          <RichTextEditor
            label="English"
            dir="ltr"
            minHeight={160}
            value={f.descriptionEn}
            onChange={(v) => set('descriptionEn', v)}
            hint="اختياري؛ لو فاضي هيتاخد العربي."
          />

          {section('الفيديو التعريفي والصورة')}
          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            {course ? (
              <PromoVideoField course={course} />
            ) : (
              <FileDrop
                label="الفيديو التعريفي (اختياري)"
                hint="MP4 · WebM · MOV — لحد 500 ميجا"
                accept="video/mp4,video/webm,video/quicktime"
                icon="play"
                file={promoFile}
                onFile={setPromoFile}
                progress={promoPct}
                disabled={save.isPending}
              />
            )}
            {course ? (
              <ThumbnailField course={course} />
            ) : (
              <FileDrop
                label="صورة الدورة"
                hint="JPG · PNG · WebP — لحد 5 ميجا"
                accept="image/png,image/jpeg,image/webp"
                icon="image"
                file={thumbFile}
                onFile={setThumbFile}
                disabled={save.isPending}
              />
            )}
          </div>
        </AdminCard>

        <div className="sticky top-6 flex flex-col gap-4 max-xl:static">
          {course && (
            <AdminCard className="overflow-hidden">
              <CourseCover
                seed={course.categoryId || course.id}
                word={course.category?.nameAr ?? ''}
                image={course.thumbnailImage}
                height={170}
              />
            </AdminCard>
          )}
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
                promoPct !== null ? (
                  `بيرفع الفيديو ${promoPct}%`
                ) : (
                  <Spinner />
                )
              ) : (
                <>
                  <Icon name="check" size={16} /> {course ? 'حفظ التعديلات' : 'اعمل الدورة'}
                </>
              )}
            </button>
            {saved && <p className="text-center text-sm font-bold text-success">اتحفظت</p>}
            {!course && <p className="text-xs text-muted">بعد ما تتعمل، تقدر تضيف الأقسام والدروس.</p>}
          </AdminCard>
        </div>
      </form>
      {course && <Curriculum course={course} />}
    </>
  )
}

function ThumbnailField({ course }: { course: Course }) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.course(course.id) })
  const upload = useMutation({
    mutationFn: (file: File) => adminCoursesApi.uploadThumbnail(course.id, file),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: () => adminCoursesApi.removeThumbnail(course.id),
    onSuccess: refresh,
  })
  const busy = upload.isPending || remove.isPending
  return (
    <FileDrop
      label="صورة الدورة"
      hint="JPG · PNG · WebP — لحد 5 ميجا"
      accept="image/png,image/jpeg,image/webp"
      icon="image"
      onFile={(file) => file && upload.mutate(file)}
      current={
        course.thumbnailImage ? (
          <>
            <b className="text-sm text-ink">{busy ? 'بيتحدّث…' : 'صورة مرفوعة'}</b>
            <span className="text-xs text-muted">بتظهر في كارت الدورة وصفحتها</span>
          </>
        ) : busy ? (
          <b className="text-sm text-ink">بيترفع…</b>
        ) : null
      }
      onRemoveCurrent={async () => {
        if (
          await confirmAction({
            title: 'تشيل صورة الدورة؟',
            body: 'هيظهر مكانها الغلاف الافتراضي لحد ما ترفع صورة تانية.',
            confirmLabel: 'أيوه، شيلها',
            icon: 'trash',
          })
        )
          remove.mutate()
      }}
      disabled={busy}
      error={((upload.error ?? remove.error) as Error | null)?.message}
    />
  )
}

function PromoVideoField({ course }: { course: Course }) {
  const queryClient = useQueryClient()
  const [pct, setPct] = useState<number | null>(null)
  const [picked, setPicked] = useState<File | null>(null)
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.course(course.id) })
  const upload = useMutation({
    mutationFn: (file: File) => adminCoursesApi.uploadPromoVideo(course.id, file, setPct),
    onSettled: () => {
      setPct(null)
      setPicked(null)
    },
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: () => adminCoursesApi.removePromoVideo(course.id),
    onSuccess: refresh,
  })
  const url = course.promoVideoUrl
  const isUpload = url?.startsWith('/uploads/')
  return (
    <FileDrop
      label="الفيديو التعريفي (اختياري)"
      hint="MP4 · WebM · MOV — لحد 500 ميجا"
      accept="video/mp4,video/webm,video/quicktime"
      icon="play"
      file={picked}
      progress={pct}
      onFile={(file) => {
        setPicked(file)
        if (file) upload.mutate(file)
      }}
      current={
        url ? (
          <>
            <b className="text-sm text-ink">{isUpload ? 'فيديو مرفوع' : 'رابط فيديو قديم'}</b>
            <a href={resolveAssetUrl(url) ?? url} target="_blank" rel="noreferrer" className="text-xs">
              اتفرج عليه
            </a>
          </>
        ) : null
      }
      onRemoveCurrent={async () => {
        if (
          await confirmAction({
            title: 'تشيل الفيديو التعريفي؟',
            confirmLabel: 'أيوه، شيله',
            icon: 'trash',
          })
        )
          remove.mutate()
      }}
      disabled={remove.isPending}
      error={((upload.error ?? remove.error) as Error | null)?.message}
    />
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
        <UploadBar pct={pct} label="بيرفع الملف…" />
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
        <FileDrop
          label="فيديو الدرس"
          hint="MP4 · WebM · MOV — لحد 2 جيجا"
          accept="video/mp4,video/webm,video/quicktime"
          icon="play"
          file={video}
          onFile={setVideo}
          progress={video ? pct : null}
          disabled={create.isPending}
        />
        <FileDrop
          label={video ? 'ملف PDF مرفق (اختياري)' : 'ملف PDF'}
          hint="PDF — لحد 2 جيجا"
          accept="application/pdf"
          icon="file"
          file={pdf}
          onFile={setPdf}
          progress={pdf && !video ? pct : null}
          disabled={create.isPending}
        />
      </div>
      <p className="text-xs text-muted">ارفع فيديو، أو ملف PDF، أو الاتنين مع بعض.</p>
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
