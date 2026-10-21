import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogApi, type AdminArticle } from '@/api/admin'
import { resolveAssetUrl } from '@/api/client'
import { routes } from '@/app/routes'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { CoverInput } from '@/components/admin/AdminForm'
import { FilterTabs } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/button'
import { CheckField, SelectField, TextField } from '@/components/ui/fields'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { isRichEmpty, richToPlain } from '@/lib/richText'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { warnFormErrors } from '@/lib/formErrors'
import { confirmAction } from '@/lib/confirm'
import { VisibilitySwitch } from '@/components/admin/VisibilitySwitch'
import { CoursePicker } from '@/components/admin/CoursePicker'

const KEY = ['admin', 'articles'] as const
type Tab = 'all' | 'live' | 'hidden'

export function AdminBlogPage() {
  usePageTitle('المقالات')
  const [tab, setTab] = useState<Tab>('all')
  const [editing, setEditing] = useState<AdminArticle | 'new' | null>(null)
  const articles = useQuery({ queryKey: KEY, queryFn: catalogApi.articles })
  const all = articles.data?.articles ?? []
  const list = all.filter((a) => tab === 'all' || (tab === 'live' ? a.isActive : !a.isActive))

  return (
    <>
      <AdminHeader
        title="المقالات"
        sub={`${all.length} مقال`}
        actions={
          <button
            type="button"
            className={buttonClass({ variant: 'navy' })}
            onClick={() => setEditing('new')}
          >
            <Icon name="plus" size={16} /> مقال جديد
          </button>
        }
      />
      <AdminCard className="overflow-hidden">
        <div className="border-b border-divider p-4">
          <FilterTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'all', label: 'الكل', count: all.length },
              { id: 'live', label: 'منشور', count: all.filter((a) => a.isActive).length },
              { id: 'hidden', label: 'مخفي', count: all.filter((a) => !a.isActive).length },
            ]}
          />
        </div>
        {articles.isError ? (
          <ErrorState onRetry={() => articles.refetch()} />
        ) : articles.isLoading ? (
          <div className="flex justify-center py-16 text-blue-600">
            <Spinner />
          </div>
        ) : list.length === 0 ? (
          <EmptyState compact icon="pen" title="مفيش مقالات هنا" />
        ) : (
          <ul>
            {list.map((a) => {
              const img = resolveAssetUrl(a.coverImage)
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-4 border-t border-divider px-5 py-3 first:border-t-0"
                >
                  <span className="h-14 w-20 flex-none overflow-hidden rounded-lg bg-surface">
                    {img && <img src={img} alt="" className="size-full object-cover" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <b className="truncate text-ink">{a.titleAr}</b>
                    <span className="text-xs text-muted">
                      {a.category?.nameAr} · {formatDate(a.publishedAt ?? a.createdAt)}
                    </span>
                  </span>
                  <VisibilitySwitch
                    visible={a.isActive}
                    name={a.titleAr}
                    labels={['منشور', 'مخفي']}
                    save={(isActive) => catalogApi.updateArticle(a.id, { isActive })}
                    invalidate={[KEY]}
                  />
                  <Link
                    to={routes.article(a.slug)}
                    target="_blank"
                    aria-label="عرض"
                    className={buttonClass({ variant: 'ghost', size: 'sm' })}
                  >
                    <Icon name="eye" size={15} />
                  </Link>
                  <button
                    type="button"
                    aria-label={`تعديل ${a.titleAr}`}
                    className={buttonClass({ variant: 'ghost', size: 'sm' })}
                    onClick={() => setEditing(a)}
                  >
                    <Icon name="pen" size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </AdminCard>
      {editing && (
        <ArticleModal article={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </>
  )
}

function ArticleModal({ article, onClose }: { article?: AdminArticle; onClose: () => void }) {
  const queryClient = useQueryClient()
  const categories = useQuery({
    queryKey: ['admin', 'article-categories'],
    queryFn: catalogApi.articleCategories,
  })
  const tags = useQuery({ queryKey: ['admin', 'article-tags'], queryFn: catalogApi.articleTags })
  const [cover, setCover] = useState<File | null>(null)
  const [f, setF] = useState({
    categoryId: article?.categoryId ?? '',
    titleAr: article?.titleAr ?? '',
    titleEn: article?.titleEn ?? '',
    shortContentAr: article?.shortContentAr ?? '',
    contentAr: article?.contentAr ?? '',
    tagIds: (article?.tags ?? []).map((t) => t.id),
    relatedCourseIds: article?.relatedCourseIds ?? [],
    isActive: article?.isActive ?? true,
    isFeatured: article?.isFeatured ?? false,
    isHomeDisplay: article?.isHomeDisplay ?? false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const fields = {
        categoryId: f.categoryId,
        titleAr: f.titleAr.trim(),
        titleEn: f.titleEn.trim(),
        shortContentAr: f.shortContentAr.trim(),
        shortContentEn: article?.shortContentEn || f.shortContentAr.trim(),
        contentAr: f.contentAr.trim(),
        contentEn: article?.contentEn || f.contentAr.trim(),
        tagIds: article || f.tagIds.length ? JSON.stringify(f.tagIds) : undefined,
        relatedCourseIds: JSON.stringify(f.relatedCourseIds),
        isActive: f.isActive,
        isFeatured: f.isFeatured,
        isHomeDisplay: f.isHomeDisplay,
        coverImage: cover,
      }
      return article ? catalogApi.updateArticle(article.id, fields) : catalogApi.createArticle(fields)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      onClose()
    },
  })
  const remove = useMutation({
    mutationFn: () => catalogApi.removeArticle(article!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      onClose()
    },
  })

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (!f.categoryId) er.categoryId = 'اختار القسم.'
    if (f.titleAr.trim().length < 3) er.titleAr = 'اكتب العنوان.'
    if (!f.titleEn.trim()) er.titleEn = 'اكتب عنوان بالإنجليزي (بيطلع منه الرابط).'
    if (isRichEmpty(f.shortContentAr)) er.shortContentAr = 'اكتب مقدمة قصيرة.'
    if (richToPlain(f.contentAr).length < 20) er.contentAr = 'اكتب المقال.'
    if (!article && !cover) er.cover = 'اختار صورة.'
    setErrors(er)
    warnFormErrors(er)
    if (!Object.keys(er).length) save.mutate()
  }

  return (
    <Modal
      title={article ? 'تعديل المقال' : 'مقال جديد'}
      icon="pen"
      onClose={onClose}
      width={920}
      footer={
        <>
          {article ? (
            <button
              type="button"
              className={buttonClass({ variant: 'ghost', className: 'text-danger' })}
              disabled={remove.isPending}
              onClick={async () => {
                if (
                  await confirmAction({
                    title: 'تحذف المقال نهائيًا؟',
                    body: 'مش هتقدر ترجّعه بعد كده.',
                    confirmLabel: 'أيوه، احذف',
                    icon: 'trash',
                  })
                )
                  remove.mutate()
              }}
            >
              حذف
            </button>
          ) : (
            <span />
          )}
          <span className="flex gap-2.5">
            <button type="button" className={buttonClass({ variant: 'outline' })} onClick={onClose}>
              إلغاء
            </button>
            <button
              type="button"
              className={buttonClass({ variant: 'gold' })}
              disabled={save.isPending}
              onClick={() => submit()}
            >
              {save.isPending ? <Spinner /> : article ? 'حفظ' : 'انشر المقال'}
            </button>
          </span>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid grid-cols-[1fr_240px] gap-5 max-md:grid-cols-1">
        <div className="flex flex-col gap-4">
          <TextField
            label="العنوان"
            value={f.titleAr}
            onChange={(e) => set('titleAr', e.target.value)}
            error={errors.titleAr}
          />
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <TextField
              label="العنوان بالإنجليزي"
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
          </div>
          <RichTextEditor
            label="مقدمة المقال"
            hint="بتظهر في أول المقال، ونصها بيظهر في كارت المقال."
            compact
            minHeight={110}
            value={f.shortContentAr}
            onChange={(v) => set('shortContentAr', v)}
            error={errors.shortContentAr}
          />
          <RichTextEditor
            label="المقال"
            hint="العناوين الرئيسية (H2) بتظهر في فهرس المقال."
            minHeight={360}
            value={f.contentAr}
            onChange={(v) => set('contentAr', v)}
            error={errors.contentAr}
          />
          <div className="flex flex-col gap-2 rounded-tile border border-line p-4">
            <span className="text-[15px] font-semibold text-ink">
              دورات ذات صلة{' '}
              <span className="text-sm font-normal text-muted">
                ({f.relatedCourseIds.length ? `${f.relatedCourseIds.length} مختارة` : 'اختياري'})
              </span>
            </span>
            <p className="text-sm text-muted">
              بتظهر تحت المقال. لو مختارتش، الموقع هيعرض الدورات المميزة زي دلوقتي.
            </p>
            <CoursePicker
              value={f.relatedCourseIds}
              onChange={(ids) => set('relatedCourseIds', ids)}
              max={6}
            />
          </div>
          {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
          {remove.isError && <Alert tone="error">{(remove.error as Error).message}</Alert>}
        </div>
        <div className="flex flex-col gap-4">
          <CoverInput
            current={article?.coverImage}
            file={cover}
            onChange={setCover}
            required={!article}
            error={errors.cover}
          />
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">الوسوم</span>
            <div className="flex flex-wrap gap-1.5">
              {(tags.data ?? []).map((t) => {
                const on = f.tagIds.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set('tagIds', on ? f.tagIds.filter((x) => x !== t.id) : [...f.tagIds, t.id])
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-bold',
                      on ? 'bg-navy border-navy text-white' : 'border-line bg-white text-text-2',
                    )}
                  >
                    {t.nameAr}
                  </button>
                )
              })}
            </div>
          </div>
          <CheckField
            label="منشور"
            checked={f.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
          />
          <CheckField
            label="في الرئيسية"
            checked={f.isHomeDisplay}
            onChange={(e) => set('isHomeDisplay', e.target.checked)}
          />
          <CheckField
            label="مميز"
            checked={f.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
          />
        </div>
      </form>
    </Modal>
  )
}
