import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogApi, type AdminBook, type AdminBookFormat, type AdminProduct } from '@/api/admin'
import { resolveAssetUrl } from '@/api/client'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { CoverInput } from '@/components/admin/AdminForm'
import { FilterTabs, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/button'
import { CheckField, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { FORMAT_TYPE_LABEL } from '@/lib/shop-labels'
import { durationLabel, formatEGP } from '@/lib/format'
import { numOrUndef, numToField, slugify } from '@/lib/form'
import { usePageTitle } from '@/lib/usePageTitle'
import { warnFormErrors } from '@/lib/formErrors'

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
                  <b className="text-sm text-ink">{formatEGP(b.discountPriceEGP ?? b.priceEGP)}</b>
                  {b.isActive ? (
                    <StatusPill tone="success">منشور</StatusPill>
                  ) : (
                    <StatusPill tone="muted">مخفي</StatusPill>
                  )}
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
                {p.isActive === false ? (
                  <StatusPill tone="muted">مخفي</StatusPill>
                ) : p.stock === 0 ? (
                  <StatusPill tone="danger">نفد</StatusPill>
                ) : (
                  <StatusPill tone="success">متاح</StatusPill>
                )}
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
    priceEGP: numToField(book?.priceEGP),
    discountPriceEGP: numToField(book?.discountPriceEGP),
    priceUSD: numToField(book?.priceUSD),
    isActive: book?.isActive ?? true,
    isFeatured: book?.isFeatured ?? false,
    isHomeDisplay: book?.isHomeDisplay ?? false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const fields = {
        categoryId: f.categoryId,
        titleAr: f.titleAr.trim(),
        titleEn: f.titleEn.trim(),
        slug: f.slug.trim() || slugify(f.titleEn),
        descriptionAr: f.descriptionAr.trim(),
        descriptionEn: book?.descriptionEn || f.descriptionAr.trim(),
        priceEGP: numOrUndef(f.priceEGP),
        discountPriceEGP: numOrUndef(f.discountPriceEGP),
        priceUSD: numOrUndef(f.priceUSD),
        isActive: f.isActive,
        isFeatured: f.isFeatured,
        isHomeDisplay: f.isHomeDisplay,
        coverImage: cover,
      }
      return book ? catalogApi.updateBook(book.id, fields) : catalogApi.createBook(fields)
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY })
      queryClient.invalidateQueries({ queryKey: ['admin', 'book'] })
      if (!book) {
        const created = (saved as unknown as { book?: AdminBook }).book ?? saved
        onCreated(created.id)
      } else onClose()
    },
  })

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (!f.categoryId) er.categoryId = 'اختار القسم.'
    if (f.titleAr.trim().length < 2) er.titleAr = 'اكتب اسم الكتاب.'
    if (!f.titleEn.trim()) er.titleEn = 'اكتب الاسم بالإنجليزي.'
    if (!f.descriptionAr.trim()) er.descriptionAr = 'اكتب وصف الكتاب.'
    if (f.priceEGP === '') er.priceEGP = 'اكتب السعر.'
    if (f.priceUSD === '') er.priceUSD = 'اكتب السعر بالدولار.'
    if (!book && !cover) er.cover = 'اختار صورة الغلاف.'
    setErrors(er)
    warnFormErrors(er)
    if (!Object.keys(er).length) save.mutate()
  }

  return (
    <Modal
      title={book ? 'تعديل الكتاب' : 'كتاب جديد'}
      sub={book ? book.titleAr : 'بعد الحفظ هتقدر تضيف النسخ (ورقي، رقمي، صوتي).'}
      icon="book"
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
            {save.isPending ? <Spinner /> : book ? 'حفظ' : 'اعمل الكتاب'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid grid-cols-[1fr_220px] gap-5 max-md:grid-cols-1">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <TextField
              label="اسم الكتاب"
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
              label="الرابط (slug)"
              ltr
              placeholder={slugify(f.titleEn) || 'book-name'}
              value={f.slug}
              onChange={(e) => set('slug', e.target.value)}
            />
          </div>
          <TextAreaField
            label="عن الكتاب"
            rows={4}
            value={f.descriptionAr}
            onChange={(e) => set('descriptionAr', e.target.value)}
            error={errors.descriptionAr}
          />
          <div className="grid grid-cols-3 gap-4">
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
          </div>
          <p className="-mt-2 text-xs text-muted">ده السعر الأساسي؛ كل نسخة ممكن يكون ليها سعرها.</p>
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
          label="الغلاف"
          current={book?.coverImage}
          file={cover}
          onChange={setCover}
          required={!book}
          error={errors.cover}
        />
      </form>
      {book && <Formats book={book} />}
    </Modal>
  )
}

function Formats({ book }: { book: AdminBook }) {
  const [adding, setAdding] = useState(false)
  const existing = new Set((book.formats ?? []).map((f) => f.formatType))
  const missing = (['Physical', 'Digital', 'Audio'] as const).filter((t) => !existing.has(t))
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-divider pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">النسخ</h3>
        {missing.length > 0 && !adding && (
          <button
            type="button"
            className={buttonClass({ variant: 'outline', size: 'sm' })}
            onClick={() => setAdding(true)}
          >
            <Icon name="plus" size={14} /> نسخة جديدة
          </button>
        )}
      </div>
      {(book.formats ?? []).map((fm) => (
        <FormatRow key={fm.id} book={book} format={fm} />
      ))}
      {adding && <FormatForm book={book} types={missing} onDone={() => setAdding(false)} />}
      {!book.formats?.length && !adding && (
        <p className="text-sm text-muted">مفيش نسخ؛ الكتاب مش هيتباع غير لما تضيف نسخة.</p>
      )}
    </div>
  )
}

function FormatRow({ book, format }: { book: AdminBook; format: AdminBookFormat }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const remove = useMutation({
    mutationFn: () => catalogApi.removeFormat(format.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'book', book.id] })
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY })
    },
  })
  if (editing)
    return (
      <FormatForm book={book} format={format} types={[format.formatType]} onDone={() => setEditing(false)} />
    )
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-tile border border-line p-3.5">
      <span className="rounded-full bg-surface-blue px-3 py-1 text-xs font-bold text-blue-600">
        {FORMAT_TYPE_LABEL[format.formatType]}
      </span>
      <span className="flex-1 text-sm text-text-2">
        {formatEGP(format.discountPriceEGP ?? format.priceEGP ?? book.priceEGP)}
        {format.formatType === 'Physical' && ` · المخزون ${format.stock ?? 0}`}
        {format.formatType === 'Digital' && (format.hasReaderFile ? ' · الملف مرفوع' : ' · من غير ملف')}
        {format.formatType === 'Audio' &&
          (format.hasAudioFile
            ? ` · ${format.audioDuration ? durationLabel(format.audioDuration) : 'الملف مرفوع'}`
            : ' · من غير ملف')}
      </span>
      <button
        type="button"
        className={buttonClass({ variant: 'ghost', size: 'sm' })}
        onClick={() => setEditing(true)}
      >
        تعديل
      </button>
      <button
        type="button"
        className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
        disabled={remove.isPending}
        onClick={() =>
          window.confirm(`حذف النسخة ${FORMAT_TYPE_LABEL[format.formatType]}؟`) && remove.mutate()
        }
      >
        حذف
      </button>
      {remove.isError && (
        <div className="w-full">
          <Alert tone="error">{(remove.error as Error).message}</Alert>
        </div>
      )}
    </div>
  )
}

function FormatForm({
  book,
  format,
  types,
  onDone,
}: {
  book: AdminBook
  format?: AdminBookFormat
  types: AdminBookFormat['formatType'][]
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [type, setType] = useState(format?.formatType ?? types[0])
  const [f, setF] = useState({
    priceEGP: numToField(format?.priceEGP),
    discountPriceEGP: numToField(format?.discountPriceEGP),
    priceUSD: numToField(format?.priceUSD),
    stock: numToField(format?.stock),
    weight: numToField(format?.weight),
    sku: format?.sku ?? '',
  })
  const [file, setFile] = useState<File | null>(null)
  const save = useMutation({
    mutationFn: async () => {
      let audioDuration: number | undefined
      if (type === 'Audio' && file) {
        audioDuration = await new Promise<number | undefined>((resolve) => {
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
      const fields = {
        ...(format ? {} : { formatType: type }),
        priceEGP: numOrUndef(f.priceEGP),
        discountPriceEGP: numOrUndef(f.discountPriceEGP),
        priceUSD: numOrUndef(f.priceUSD),
        ...(type === 'Physical'
          ? { stock: numOrUndef(f.stock), weight: numOrUndef(f.weight), sku: f.sku.trim() || undefined }
          : {}),
        ...(type === 'Digital' ? { readerFile: file } : {}),
        ...(type === 'Audio' ? { audioFile: file, audioDuration } : {}),
      }
      return format ? catalogApi.updateFormat(format.id, fields) : catalogApi.addFormat(book.id, fields)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'book', book.id] })
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY })
      onDone()
    },
  })

  return (
    <div className="flex flex-col gap-3 rounded-tile border border-blue-300/60 bg-surface-blue/40 p-4">
      {!format && (
        <SelectField
          label="نوع النسخة"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          options={types.map((t) => ({ value: t, label: FORMAT_TYPE_LABEL[t] }))}
        />
      )}
      <div className="grid grid-cols-3 gap-3">
        <TextField
          label="السعر (ج.م)"
          type="number"
          min={0}
          ltr
          placeholder={String(book.priceEGP)}
          value={f.priceEGP}
          onChange={(e) => setF({ ...f, priceEGP: e.target.value })}
        />
        <TextField
          label="بعد الخصم"
          type="number"
          min={0}
          ltr
          value={f.discountPriceEGP}
          onChange={(e) => setF({ ...f, discountPriceEGP: e.target.value })}
        />
        <TextField
          label="السعر ($)"
          type="number"
          min={0}
          step="0.01"
          ltr
          placeholder={String(book.priceUSD)}
          value={f.priceUSD}
          onChange={(e) => setF({ ...f, priceUSD: e.target.value })}
        />
      </div>
      {type === 'Physical' && (
        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="المخزون"
            type="number"
            min={0}
            ltr
            value={f.stock}
            onChange={(e) => setF({ ...f, stock: e.target.value })}
          />
          <TextField
            label="الوزن (كجم)"
            type="number"
            min={0}
            step="0.01"
            ltr
            value={f.weight}
            onChange={(e) => setF({ ...f, weight: e.target.value })}
          />
          <TextField label="SKU" ltr value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} />
        </div>
      )}
      {type !== 'Physical' && (
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
          {type === 'Digital' ? 'ملف الكتاب (PDF)' : 'الملف الصوتي (mp3, m4a, wav)'}
          {format && (type === 'Digital' ? format.hasReaderFile : format.hasAudioFile) && (
            <span className="text-xs font-normal text-muted">
              فيه ملف مرفوع؛ اختار ملف جديد لو عايز تستبدله.
            </span>
          )}
          <input
            type="file"
            accept={type === 'Digital' ? 'application/pdf' : 'audio/mpeg,audio/mp4,audio/x-m4a,audio/wav'}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm font-normal"
          />
        </label>
      )}

      {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
      <div className="flex gap-2.5">
        <button
          type="button"
          className={buttonClass({ variant: 'navy', size: 'sm' })}
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? <Spinner /> : 'حفظ النسخة'}
        </button>
        <button type="button" className={buttonClass({ variant: 'ghost', size: 'sm' })} onClick={onDone}>
          إلغاء
        </button>
      </div>
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
