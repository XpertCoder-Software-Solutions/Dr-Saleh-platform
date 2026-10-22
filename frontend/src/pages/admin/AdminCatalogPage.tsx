import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogApi, type AdminBook, type AdminBookFormat, type AdminProduct } from '@/api/admin'
import { resolveAssetUrl } from '@/api/client'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { CoverInput } from '@/components/admin/AdminForm'
import { FileDrop } from '@/components/admin/FileDrop'
import { FilterTabs, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/button'
import { CheckField, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { FORMAT_TYPE_LABEL } from '@/lib/shop-labels'
import { formatEGP } from '@/lib/format'
import { numOrUndef, numToField, slugify } from '@/lib/form'
import { usePageTitle } from '@/lib/usePageTitle'
import { warnFormErrors } from '@/lib/formErrors'
import { confirmAction } from '@/lib/confirm'
import { VisibilitySwitch } from '@/components/admin/VisibilitySwitch'

type Tab = 'books' | 'products'
const BOOKS_KEY = ['admin', 'books'] as const
const PRODUCTS_KEY = ['admin', 'products'] as const

function Thumb({ src }: { src: string | null }) {
  const url = resolveAssetUrl(src)
  return (
    <span className="flex h-14 w-11 flex-none items-center justify-center overflow-hidden rounded-md bg-surface text-muted">
      {url ? <img src={url} alt="" className="size-full object-cover" /> : <Icon name="book" size={18} />}
    </span>
  )
}

export function AdminCatalogPage() {
  usePageTitle('الكتب والمنتجات')
  const [tab, setTab] = useState<Tab>('books')
  const [editing, setEditing] = useState<{ kind: Tab; id: string | null } | null>(null)
  const books = useQuery({ queryKey: BOOKS_KEY, queryFn: catalogApi.books })
  const products = useQuery({ queryKey: PRODUCTS_KEY, queryFn: catalogApi.products })

  return (
    <>
      <AdminHeader
        title="الكتب والمنتجات"
        sub={`${books.data?.length ?? 0} كتاب · ${products.data?.products.length ?? 0} منتج`}
        actions={
          <button
            type="button"
            className={buttonClass({ variant: 'navy' })}
            onClick={() => setEditing({ kind: tab, id: null })}
          >
            <Icon name="plus" size={16} /> {tab === 'books' ? 'كتاب جديد' : 'منتج جديد'}
          </button>
        }
      />
      <AdminCard className="overflow-hidden">
        <div className="border-b border-divider p-4">
          <FilterTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'books', label: 'الكتب', count: books.data?.length },
              { id: 'products', label: 'المنتجات', count: products.data?.products.length },
            ]}
          />
        </div>
        {tab === 'books' ? (
          books.isError ? (
            <ErrorState onRetry={() => books.refetch()} />
          ) : books.isLoading ? (
            <div className="flex justify-center py-16 text-blue-600">
              <Spinner />
            </div>
          ) : !books.data!.length ? (
            <EmptyState compact icon="book" title="مفيش كتب لسه" />
          ) : (
            <ul>
              {books.data!.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-4 border-t border-divider px-5 py-3 first:border-t-0"
                >
                  <Thumb src={b.coverImage} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <b className="text-ink">{b.titleAr}</b>
                    <span className="text-xs text-muted">
                      {b.category?.nameAr} ·{' '}
                      {(b.formats ?? []).map((f) => FORMAT_TYPE_LABEL[f.formatType]).join('، ') ||
                        'من غير نسخ'}
                    </span>
                  </span>
                  <b className="text-sm text-ink">
                    {(() => {
                      const prices = (b.formats ?? [])
                        .filter((f) => f.isActive)
                        .map((f) => f.discountPriceEGP ?? f.priceEGP ?? b.priceEGP)
                      return prices.length
                        ? `من ${formatEGP(Math.min(...prices))}`
                        : formatEGP(b.discountPriceEGP ?? b.priceEGP)
                    })()}
                  </b>
                  <VisibilitySwitch
                    visible={b.isActive}
                    name={b.titleAr}
                    labels={['منشور', 'مخفي']}
                    save={(isActive) => catalogApi.updateBook(b.id, { isActive })}
                    invalidate={[BOOKS_KEY]}
                  />
                  <button
                    type="button"
                    aria-label={`تعديل ${b.titleAr}`}
                    className={buttonClass({ variant: 'ghost', size: 'sm' })}
                    onClick={() => setEditing({ kind: 'books', id: b.id })}
                  >
                    <Icon name="pen" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : products.isError ? (
          <ErrorState onRetry={() => products.refetch()} />
        ) : products.isLoading ? (
          <div className="flex justify-center py-16 text-blue-600">
            <Spinner />
          </div>
        ) : !products.data!.products.length ? (
          <EmptyState compact icon="box" title="مفيش منتجات لسه" />
        ) : (
          <ul>
            {products.data!.products.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 border-t border-divider px-5 py-3 first:border-t-0"
              >
                <Thumb src={p.coverImage} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className="text-ink">{p.nameAr}</b>
                  <span className="text-xs text-muted">
                    {p.category?.nameAr} · المخزون: {p.stock}
                  </span>
                </span>
                <b className="text-sm text-ink">{formatEGP(p.discountPriceEGP ?? p.priceEGP)}</b>
                {p.isActive !== false && p.stock === 0 && <StatusPill tone="danger">نفد</StatusPill>}
                <VisibilitySwitch
                  visible={p.isActive !== false}
                  name={p.nameAr}
                  save={(isActive) => catalogApi.updateProduct(p.id, { isActive })}
                  invalidate={[PRODUCTS_KEY]}
                />
                <button
                  type="button"
                  aria-label={`تعديل ${p.nameAr}`}
                  className={buttonClass({ variant: 'ghost', size: 'sm' })}
                  onClick={() => setEditing({ kind: 'products', id: p.id })}
                >
                  <Icon name="pen" size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      {editing?.kind === 'books' && (
        <BookModal
          id={editing.id}
          onClose={() => setEditing(null)}
          onCreated={(id) => setEditing({ kind: 'books', id })}
        />
      )}
      {editing?.kind === 'products' && (
        <ProductModal
          product={products.data?.products.find((p) => p.id === editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

// ---------- book ----------

function BookModal({
  id,
  onClose,
  onCreated,
}: {
  id: string | null
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const book = useQuery({
    queryKey: ['admin', 'book', id],
    queryFn: () => catalogApi.book(id!),
    enabled: Boolean(id),
  })
  if (id && book.isLoading) {
    return (
      <Modal title="الكتاب" onClose={onClose}>
        <div className="flex justify-center py-10 text-blue-600">
          <Spinner />
        </div>
      </Modal>
    )
  }
  return <BookForm key={id ?? 'new'} book={book.data} onClose={onClose} onCreated={onCreated} />
}

type FormatType = AdminBookFormat['formatType']
const FORMAT_TYPES: FormatType[] = ['Physical', 'Digital', 'Audio']

/** One copy (ورقي / رقمي / صوتي) as edited in the book form. */
interface FormatDraft {
  key: string
  id?: string
  formatType: FormatType
  priceEGP: string
  priceUSD: string
  discountPriceEGP: string
  discountPriceUSD: string
  sku: string
  stock: string
  weight: string
  file: File | null
  hasFile: boolean
}

function toDraft(f: AdminBookFormat): FormatDraft {
  return {
    key: f.id,
    id: f.id,
    formatType: f.formatType,
    priceEGP: numToField(f.priceEGP),
    priceUSD: numToField(f.priceUSD),
    discountPriceEGP: numToField(f.discountPriceEGP),
    discountPriceUSD: numToField(f.discountPriceUSD),
    sku: f.sku ?? '',
    stock: numToField(f.stock),
    weight: numToField(f.weight),
    file: null,
    hasFile: Boolean(f.formatType === 'Digital' ? f.hasReaderFile : f.hasAudioFile),
  }
}

function newDraft(formatType: FormatType): FormatDraft {
  return {
    key: `new-${formatType}-${Math.random().toString(36).slice(2)}`,
    formatType,
    priceEGP: '',
    priceUSD: '',
    discountPriceEGP: '',
    discountPriceUSD: '',
    sku: '',
    stock: formatType === 'Physical' ? '0' : '',
    weight: '',
    file: null,
    hasFile: false,
  }
}

function audioLength(file: File) {
  return new Promise<number | undefined>((resolve) => {
    const url = URL.createObjectURL(file)
    const a = new Audio()
    a.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(a.duration) ? Math.round(a.duration) : undefined)
    }
    a.onerror = () => resolve(undefined)
    a.src = url
  })
}

/** Fields the API takes for a copy. */
async function formatFields(d: FormatDraft, isNew: boolean) {
  return {
    ...(isNew ? { formatType: d.formatType } : {}),
    priceEGP: numOrUndef(d.priceEGP),
    priceUSD: numOrUndef(d.priceUSD),
    discountPriceEGP: numOrUndef(d.discountPriceEGP),
    discountPriceUSD: numOrUndef(d.discountPriceUSD),
    sku: d.sku.trim() || undefined,
    ...(d.formatType === 'Physical' ? { stock: numOrUndef(d.stock), weight: numOrUndef(d.weight) } : {}),
    ...(d.formatType === 'Digital' ? { readerFile: d.file } : {}),
    ...(d.formatType === 'Audio' && d.file
      ? { audioFile: d.file, audioDuration: await audioLength(d.file) }
      : {}),
  }
}

function BookForm({
  book,
  onClose,
  onCreated,
}: {
  book?: AdminBook
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const categories = useQuery({ queryKey: ['admin', 'book-categories'], queryFn: catalogApi.bookCategories })
  const [cover, setCover] = useState<File | null>(null)
  const [f, setF] = useState({
    categoryId: book?.categoryId ?? '',
    titleAr: book?.titleAr ?? '',
    titleEn: book?.titleEn ?? '',
    slug: book?.slug ?? '',
    descriptionAr: book?.descriptionAr ?? '',
    isActive: book?.isActive ?? true,
    isFeatured: book?.isFeatured ?? false,
    isHomeDisplay: book?.isHomeDisplay ?? false,
  })
  const [slugTouched, setSlugTouched] = useState(Boolean(book?.slug))
  const [formats, setFormats] = useState<FormatDraft[]>(() =>
    book?.formats?.length
      ? [...book.formats]
          .sort((a, b) => FORMAT_TYPES.indexOf(a.formatType) - FORMAT_TYPES.indexOf(b.formatType))
          .map(toDraft)
      : [newDraft('Physical')],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const setFormat = (key: string, patch: Partial<FormatDraft>) =>
    setFormats((list) => list.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  const unused = FORMAT_TYPES.filter((t) => !formats.some((d) => d.formatType === t))

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: BOOKS_KEY })
    queryClient.invalidateQueries({ queryKey: ['admin', 'book'] })
  }

  const save = useMutation({
    mutationFn: async () => {
      // The book's own price is the cheapest copy, so lists and filters stay right.
      const lowest = (k: 'priceEGP' | 'priceUSD') => Math.min(...formats.map((d) => Number(d[k])))
      const fields = {
        categoryId: f.categoryId,
        titleAr: f.titleAr.trim(),
        titleEn: f.titleEn.trim(),
        slug: f.slug.trim() || slugify(f.titleEn),
        descriptionAr: f.descriptionAr.trim() || f.titleAr.trim(),
        descriptionEn: book?.descriptionEn || f.descriptionAr.trim() || f.titleEn.trim(),
        priceEGP: lowest('priceEGP'),
        priceUSD: lowest('priceUSD'),
        isActive: f.isActive,
        isFeatured: f.isFeatured,
        isHomeDisplay: f.isHomeDisplay,
        coverImage: cover,
      }
      setStep('بيحفظ بيانات الكتاب…')
      const saved = book ? await catalogApi.updateBook(book.id, fields) : await catalogApi.createBook(fields)
      const bookId = book?.id ?? ((saved as unknown as { book?: AdminBook }).book ?? saved).id
      try {
        for (const d of formats) {
          setStep(`بيحفظ النسخة ال${FORMAT_TYPE_LABEL[d.formatType]}…`)
          const body = await formatFields(d, !d.id)
          if (d.id) await catalogApi.updateFormat(d.id, body)
          else await catalogApi.addFormat(bookId, body)
        }
      } catch (e) {
        // The book exists now; reopen it so the remaining copies can be fixed.
        if (!book) {
          refresh()
          onCreated(bookId)
        }
        throw e
      }
      return bookId
    },
    onSettled: () => setStep(null),
    onSuccess: () => {
      refresh()
      onClose()
    },
  })

  const removeExisting = useMutation({
    mutationFn: (id: string) => catalogApi.removeFormat(id),
    onSuccess: (_r, id) => {
      setFormats((list) => list.filter((d) => d.id !== id))
      refresh()
    },
  })

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (f.titleAr.trim().length < 2) er.titleAr = 'اكتب اسم الكتاب.'
    if (!f.titleEn.trim()) er.titleEn = 'اكتب اسم الكتاب بالإنجليزي.'
    if (!f.categoryId) er.categoryId = 'اختار القسم.'
    if (!book && !cover) er.cover = 'اختار صورة الغلاف.'
    if (f.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug.trim()))
      er.slug = 'حروف إنجليزي صغيرة وأرقام وشَرطة (-) بس.'
    if (!formats.length) er.formats = 'ضيف نسخة واحدة على الأقل.'
    for (const d of formats) {
      const k = (n: string) => `${d.key}.${n}`
      if (d.priceEGP === '' || Number(d.priceEGP) < 0) er[k('priceEGP')] = 'اكتب السعر.'
      if (d.priceUSD === '' || Number(d.priceUSD) < 0) er[k('priceUSD')] = 'اكتب السعر.'
      if (d.discountPriceEGP && Number(d.discountPriceEGP) >= Number(d.priceEGP))
        er[k('discountPriceEGP')] = 'لازم يكون أقل من السعر.'
      if (d.discountPriceUSD && Number(d.discountPriceUSD) >= Number(d.priceUSD))
        er[k('discountPriceUSD')] = 'لازم يكون أقل من السعر.'
      if (d.formatType === 'Physical' && (d.stock === '' || Number(d.stock) < 0))
        er[k('stock')] = 'اكتب المخزون.'
    }
    setErrors(er)
    warnFormErrors(er)
    if (!Object.keys(er).length) save.mutate()
  }

  return (
    <Modal
      title={book ? 'تعديل الكتاب' : 'كتاب جديد'}
      sub={book ? book.titleAr : 'بيانات الكتاب ونسخه في خطوة واحدة.'}
      icon="book"
      onClose={onClose}
      width={920}
      footer={
        <>
          <span className="text-sm text-muted" aria-live="polite">
            {step ?? 'سعر الكتاب في الموقع = أرخص نسخة.'}
          </span>
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
              {save.isPending ? <Spinner /> : book ? 'حفظ' : 'اعمل الكتاب'}
            </button>
          </span>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <div className="grid grid-cols-[1fr_200px] gap-5 max-md:grid-cols-1">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <TextField
                label="اسم الكتاب (عربي)"
                value={f.titleAr}
                onChange={(e) => set('titleAr', e.target.value)}
                error={errors.titleAr}
              />
              <TextField
                label="اسم الكتاب (إنجليزي)"
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
                placeholder="book-name"
                value={f.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }}
                error={errors.slug}
              />
            </div>
            <TextAreaField
              label="عن الكتاب (اختياري)"
              rows={3}
              value={f.descriptionAr}
              onChange={(e) => set('descriptionAr', e.target.value)}
            />
            <div className="flex flex-wrap gap-x-6 gap-y-2">
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
          </div>
          <CoverInput
            label="الغلاف"
            current={book?.coverImage}
            file={cover}
            onChange={setCover}
            required={!book}
            error={errors.cover}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-divider pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg">النسخ</h3>
              <p className="text-sm text-muted">كل نسخة بسعرها؛ الكارت في الموقع بيعرض أرخص نسخة.</p>
            </div>
            {unused.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {unused.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={buttonClass({ variant: 'outline', size: 'sm' })}
                    onClick={() => setFormats((list) => [...list, newDraft(t)])}
                  >
                    <Icon name="plus" size={14} /> نسخة {FORMAT_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.formats && <Alert tone="error">{errors.formats}</Alert>}
          {formats.map((d) => (
            <FormatCard
              key={d.key}
              draft={d}
              errors={errors}
              onChange={(patch) => setFormat(d.key, patch)}
              removing={removeExisting.isPending && removeExisting.variables === d.id}
              onRemove={async () => {
                if (!d.id) {
                  setFormats((list) => list.filter((x) => x.key !== d.key))
                  return
                }
                if (
                  await confirmAction({
                    title: `تحذف النسخة ال${FORMAT_TYPE_LABEL[d.formatType]}؟`,
                    body: 'النسخة هتتشال من الموقع فورًا.',
                    confirmLabel: 'أيوه، احذف',
                    icon: 'trash',
                  })
                )
                  removeExisting.mutate(d.id)
              }}
            />
          ))}
          {removeExisting.isError && <Alert tone="error">{(removeExisting.error as Error).message}</Alert>}
        </div>
        {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
      </form>
    </Modal>
  )
}

function FormatCard({
  draft: d,
  errors,
  onChange,
  onRemove,
  removing,
}: {
  draft: FormatDraft
  errors: Record<string, string>
  onChange: (patch: Partial<FormatDraft>) => void
  onRemove: () => void
  removing: boolean
}) {
  const err = (n: string) => errors[`${d.key}.${n}`]
  const money = (
    k: 'priceEGP' | 'priceUSD' | 'discountPriceEGP' | 'discountPriceUSD',
    label: string,
    usd = false,
  ) => (
    <TextField
      label={label}
      type="number"
      min={0}
      step={usd ? '0.01' : '1'}
      ltr
      value={d[k]}
      onChange={(e) => onChange({ [k]: e.target.value })}
      error={err(k)}
    />
  )
  return (
    <div className="flex flex-col gap-4 rounded-tile border border-line bg-surface/60 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 bg-navy items-center justify-center rounded-xl text-white">
          <Icon
            name={d.formatType === 'Audio' ? 'headphones' : d.formatType === 'Digital' ? 'file' : 'book'}
            size={16}
          />
        </span>
        <b className="flex-1 text-ink">نسخة {FORMAT_TYPE_LABEL[d.formatType]}</b>
        <button
          type="button"
          className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
          onClick={onRemove}
          disabled={removing}
        >
          {removing ? <Spinner /> : <Icon name="trash" size={15} />} شيل النسخة
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
        {money('priceEGP', 'السعر بالجنيه')}
        {money('priceUSD', 'السعر بالدولار', true)}
        {money('discountPriceEGP', 'بعد الخصم بالجنيه')}
        {money('discountPriceUSD', 'بعد الخصم بالدولار', true)}
      </div>
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <TextField
          label="SKU (اختياري)"
          ltr
          value={d.sku}
          onChange={(e) => onChange({ sku: e.target.value })}
        />
        {d.formatType === 'Physical' && (
          <>
            <TextField
              label="المخزون"
              type="number"
              min={0}
              ltr
              value={d.stock}
              onChange={(e) => onChange({ stock: e.target.value })}
              error={err('stock')}
            />
            <TextField
              label="الوزن بالكيلو (اختياري)"
              type="number"
              min={0}
              step="0.01"
              ltr
              value={d.weight}
              onChange={(e) => onChange({ weight: e.target.value })}
            />
          </>
        )}
      </div>
      {d.formatType !== 'Physical' && (
        <FileDrop
          label={d.formatType === 'Digital' ? 'ملف الكتاب (PDF)' : 'الملف الصوتي'}
          hint={d.formatType === 'Digital' ? 'PDF' : 'MP3 · M4A · WAV'}
          accept={
            d.formatType === 'Digital' ? 'application/pdf' : 'audio/mpeg,audio/mp4,audio/x-m4a,audio/wav'
          }
          icon={d.formatType === 'Digital' ? 'file' : 'headphones'}
          file={d.file}
          onFile={(file) => onChange({ file })}
          current={
            d.hasFile ? (
              <>
                <b className="text-sm text-ink">ملف مرفوع</b>
                <span className="text-xs text-muted">اختار ملف جديد لو عايز تستبدله</span>
              </>
            ) : null
          }
        />
      )}
    </div>
  )
}

// ---------- product ----------

function ProductModal({ product, onClose }: { product?: AdminProduct; onClose: () => void }) {
  const queryClient = useQueryClient()
  const categories = useQuery({
    queryKey: ['admin', 'product-categories'],
    queryFn: catalogApi.productCategories,
  })
  const [cover, setCover] = useState<File | null>(null)
  const [f, setF] = useState({
    categoryId: product?.categoryId ?? '',
    nameAr: product?.nameAr ?? '',
    nameEn: product?.nameEn ?? '',
    descriptionAr: product?.descriptionAr ?? '',
    priceEGP: numToField(product?.priceEGP),
    discountPriceEGP: numToField(product?.discountPriceEGP),
    priceUSD: numToField(product?.priceUSD),
    stock: numToField(product?.stock),
    sku: product?.sku ?? '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isHomeDisplay: product?.isHomeDisplay ?? false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const fields = {
        categoryId: f.categoryId,
        nameAr: f.nameAr.trim(),
        nameEn: f.nameEn.trim(),
        descriptionAr: f.descriptionAr.trim(),
        descriptionEn: product?.descriptionEn || f.descriptionAr.trim(),
        priceEGP: numOrUndef(f.priceEGP),
        discountPriceEGP: numOrUndef(f.discountPriceEGP),
        priceUSD: numOrUndef(f.priceUSD),
        stock: numOrUndef(f.stock),
        sku: f.sku.trim() || undefined,
        isActive: f.isActive,
        isFeatured: f.isFeatured,
        isHomeDisplay: f.isHomeDisplay,
        coverImage: cover,
      }
      return product ? catalogApi.updateProduct(product.id, fields) : catalogApi.createProduct(fields)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      onClose()
    },
  })

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (!f.categoryId) er.categoryId = 'اختار القسم.'
    if (f.nameAr.trim().length < 2) er.nameAr = 'اكتب اسم المنتج.'
    if (!f.nameEn.trim()) er.nameEn = 'اكتب الاسم بالإنجليزي.'
    if (!f.descriptionAr.trim()) er.descriptionAr = 'اكتب وصف المنتج.'
    if (f.priceEGP === '') er.priceEGP = 'اكتب السعر.'
    if (f.priceUSD === '') er.priceUSD = 'اكتب السعر بالدولار.'
    if (f.stock === '') er.stock = 'اكتب الكمية.'
    if (!product && !cover) er.cover = 'اختار صورة.'
    setErrors(er)
    warnFormErrors(er)
    if (!Object.keys(er).length) save.mutate()
  }

  return (
    <Modal
      title={product ? 'تعديل المنتج' : 'منتج جديد'}
      sub={product?.nameAr}
      icon="box"
      onClose={onClose}
      width={860}
      footer={
        <>
          <button type="button" className={buttonClass({ variant: 'outline' })} onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className={buttonClass({ variant: 'gold' })}
            disabled={save.isPending}
            onClick={() => submit()}
          >
            {save.isPending ? <Spinner /> : 'حفظ'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid grid-cols-[1fr_220px] gap-5 max-md:grid-cols-1">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <TextField
              label="اسم المنتج"
              value={f.nameAr}
              onChange={(e) => set('nameAr', e.target.value)}
              error={errors.nameAr}
            />
            <TextField
              label="الاسم بالإنجليزي"
              ltr
              value={f.nameEn}
              onChange={(e) => set('nameEn', e.target.value)}
              error={errors.nameEn}
            />
            <SelectField
              label="القسم"
              placeholder="اختار القسم"
              value={f.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.nameAr }))}
              error={errors.categoryId}
            />
            <TextField label="SKU (اختياري)" ltr value={f.sku} onChange={(e) => set('sku', e.target.value)} />
          </div>
          <TextAreaField
            label="الوصف"
            rows={4}
            value={f.descriptionAr}
            onChange={(e) => set('descriptionAr', e.target.value)}
            error={errors.descriptionAr}
          />
          <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
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
              label="بعد الخصم"
              type="number"
              min={0}
              ltr
              value={f.discountPriceEGP}
              onChange={(e) => set('discountPriceEGP', e.target.value)}
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
              label="المخزون"
              type="number"
              min={0}
              ltr
              value={f.stock}
              onChange={(e) => set('stock', e.target.value)}
              error={errors.stock}
            />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
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
          {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
        </div>
        <CoverInput
          current={product?.coverImage}
          file={cover}
          onChange={setCover}
          required={!product}
          error={errors.cover}
        />
      </form>
    </Modal>
  )
}
