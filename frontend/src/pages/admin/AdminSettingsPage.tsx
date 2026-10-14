import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NamedCategory } from '@/api/admin'
import { api } from '@/api/client'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { FilterTabs, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { buttonClass, inputClass } from '@/components/ui/button'
import { CheckField, SelectField, TextField } from '@/components/ui/fields'
import { Alert, EmptyState, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatDate, formatEGP } from '@/lib/format'
import { numOrUndef, numToField } from '@/lib/form'
import { usePageTitle } from '@/lib/usePageTitle'

type Tab = 'shipping' | 'coupons' | 'categories'

/** Where each kind of category lives in the API. */
const CATEGORY_SETS = [
  { id: 'course', label: 'أقسام الدورات', path: '/admin/course-categories' },
  { id: 'book', label: 'أقسام الكتب', path: '/book-categories' },
  { id: 'product', label: 'أقسام المنتجات', path: '/admin/product-categories' },
  { id: 'article', label: 'أقسام المقالات', path: '/admin/article-categories' },
  { id: 'tag', label: 'وسوم المقالات', path: '/admin/article-tags', noActive: true },
  { id: 'consult', label: 'أنواع الاستشارات', path: '/admin/consultation-categories' },
] as const

export function AdminSettingsPage() {
  usePageTitle('الإعدادات')
  const [tab, setTab] = useState<Tab>('shipping')
  return (
    <>
      <AdminHeader title="الإعدادات" sub="الشحن والكوبونات والأقسام." />
      <div className="mb-5">
        <FilterTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'shipping', label: 'الشحن' },
            { id: 'coupons', label: 'الكوبونات' },
            { id: 'categories', label: 'الأقسام' },
          ]}
        />
      </div>
      {tab === 'shipping' && <Governorates />}
      {tab === 'coupons' && <Coupons />}
      {tab === 'categories' && (
        <div className="grid grid-cols-2 gap-6 max-xl:grid-cols-1">
          {CATEGORY_SETS.map((c) => (
            <NameList key={c.id} title={c.label} path={c.path} noActive={'noActive' in c} />
          ))}
        </div>
      )}
    </>
  )
}

// ---------- shipping ----------

function Governorates() {
  const queryClient = useQueryClient()
  const key = ['admin', 'governorates']
  const list = useQuery({
    queryKey: key,
    queryFn: () => api.get<{ governorates: NamedCategory[] }>('/admin/governorates'),
  })
  const [draft, setDraft] = useState({ nameAr: '', nameEn: '', shippingCost: '' })
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/governorates', {
        nameAr: draft.nameAr.trim(),
        nameEn: draft.nameEn.trim() || draft.nameAr.trim(),
        shippingCost: Number(draft.shippingCost),
      }),
    onSuccess: () => {
      setDraft({ nameAr: '', nameEn: '', shippingCost: '' })
      refresh()
    },
  })
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/admin/governorates/${id}`, body),
    onSuccess: refresh,
  })
  const rows = list.data?.governorates ?? []

  return (
    <AdminCard className="overflow-hidden">
      <div className="p-5 pb-3">
        <h2 className="text-lg">مصاريف الشحن حسب المحافظة</h2>
        <p className="text-sm text-muted">بتتحسب على الطلبات اللي فيها كتب ورقية أو منتجات.</p>
      </div>
      {list.isLoading ? (
        <div className="flex justify-center py-10 text-blue-600">
          <Spinner />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-surface text-right text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">المحافظة</th>
              <th className="px-3 py-3 font-bold">الشحن</th>
              <th className="px-5 py-3 font-bold">متاحة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <GovernorateRow key={g.id} g={g} onSave={(body) => update.mutate({ id: g.id, body })} />
            ))}
            <tr className="border-t border-divider bg-surface-blue/40">
              <td className="px-5 py-3">
                <input
                  className={cn(inputClass, 'h-10')}
                  placeholder="محافظة جديدة"
                  value={draft.nameAr}
                  onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })}
                />
              </td>
              <td className="px-3 py-3">
                <input
                  className={cn(inputClass, 'h-10 w-28')}
                  type="number"
                  min={0}
                  dir="ltr"
                  placeholder="0"
                  value={draft.shippingCost}
                  onChange={(e) => setDraft({ ...draft, shippingCost: e.target.value })}
                />
              </td>
              <td className="px-5 py-3">
                <button
                  type="button"
                  className={buttonClass({ variant: 'navy', size: 'sm' })}
                  disabled={draft.nameAr.trim().length < 2 || draft.shippingCost === '' || create.isPending}
                  onClick={() => create.mutate()}
                >
                  <Icon name="plus" size={14} /> إضافة
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {(create.isError || update.isError) && (
        <div className="p-4">
          <Alert tone="error">{((create.error ?? update.error) as Error).message}</Alert>
        </div>
      )}
    </AdminCard>
  )
}

function GovernorateRow({
  g,
  onSave,
}: {
  g: NamedCategory
  onSave: (body: Record<string, unknown>) => void
}) {
  const [cost, setCost] = useState(numToField(g.shippingCost))
  const changed = cost !== numToField(g.shippingCost) && cost !== ''
  return (
    <tr className="border-t border-divider">
      <td className="px-5 py-3 font-bold text-ink">{g.nameAr}</td>
      <td className="px-3 py-3">
        <span className="flex items-center gap-2">
          <input
            className={cn(inputClass, 'h-10 w-28')}
            type="number"
            min={0}
            dir="ltr"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            aria-label={`مصاريف شحن ${g.nameAr}`}
          />
          {changed ? (
            <button
              type="button"
              className={buttonClass({ variant: 'gold', size: 'sm' })}
              onClick={() => onSave({ shippingCost: Number(cost) })}
            >
              حفظ
            </button>
          ) : (
            <span className="text-xs text-muted">{formatEGP(g.shippingCost)}</span>
          )}
        </span>
      </td>
      <td className="px-5 py-3">
        <input
          type="checkbox"
          className="size-5 accent-blue-600"
          checked={g.isActive !== false}
          onChange={(e) => onSave({ isActive: e.target.checked })}
          aria-label={`${g.nameAr} متاحة`}
        />
      </td>
    </tr>
  )
}

// ---------- coupons ----------

interface Coupon {
  id: string
  code: string
  name: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  minimumOrderAmount: number | null
  maximumDiscountAmount: number | null
  usageLimit: number | null
  usedCount: number
  startsAt: string
  expiresAt: string
  isReferralCoupon: boolean
  isActive: boolean
}

function Coupons() {
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null)
  const list = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => api.get<{ items: Coupon[] }>('/admin/coupons', { params: { limit: 100 } }),
  })
  const rows = (list.data?.items ?? []).filter((c) => !c.isReferralCoupon)

  return (
    <AdminCard className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5 pb-3">
        <div>
          <h2 className="text-lg">كوبونات الخصم</h2>
          <p className="text-sm text-muted">كوبونات الدعوات بتتعمل تلقائي ومش ظاهرة هنا.</p>
        </div>
        <button
          type="button"
          className={buttonClass({ variant: 'navy', size: 'sm' })}
          onClick={() => setEditing('new')}
        >
          <Icon name="plus" size={14} /> كوبون جديد
        </button>
      </div>
      {list.isLoading ? (
        <div className="flex justify-center py-10 text-blue-600">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState compact icon="card" title="مفيش كوبونات" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead className="bg-surface text-right text-muted">
              <tr>
                <th className="px-5 py-3 font-bold">الكود</th>
                <th className="px-3 py-3 font-bold">الخصم</th>
                <th className="px-3 py-3 font-bold">الاستخدام</th>
                <th className="px-3 py-3 font-bold">لحد</th>
                <th className="px-3 py-3 font-bold">الحالة</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-divider">
                  <td className="px-5 py-3">
                    <b dir="ltr" className="font-head tracking-wider text-ink">
                      {c.code}
                    </b>
                    <span className="block text-xs text-muted">{c.name}</span>
                  </td>
                  <td className="px-3 py-3 font-bold text-ink">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : formatEGP(c.value)}
                  </td>
                  <td className="px-3 py-3 text-ink">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td className="px-3 py-3 text-muted">{formatDate(c.expiresAt)}</td>
                  <td className="px-3 py-3">
                    {c.isActive ? (
                      <StatusPill tone="success">شغال</StatusPill>
                    ) : (
                      <StatusPill tone="muted">موقوف</StatusPill>
                    )}
                  </td>
                  <td className="px-5 py-3 text-left">
                    <button
                      type="button"
                      aria-label={`تعديل ${c.code}`}
                      className={buttonClass({ variant: 'ghost', size: 'sm' })}
                      onClick={() => setEditing(c)}
                    >
                      <Icon name="pen" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <CouponModal coupon={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </AdminCard>
  )
}

const dateField = (iso?: string) => (iso ? iso.slice(0, 10) : '')

function CouponModal({ coupon, onClose }: { coupon?: Coupon; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [f, setF] = useState({
    code: coupon?.code ?? '',
    name: coupon?.name ?? '',
    type: coupon?.type ?? ('PERCENTAGE' as Coupon['type']),
    value: numToField(coupon?.value),
    minimumOrderAmount: numToField(coupon?.minimumOrderAmount),
    maximumDiscountAmount: numToField(coupon?.maximumDiscountAmount),
    usageLimit: numToField(coupon?.usageLimit),
    startsAt: dateField(coupon?.startsAt) || new Date().toISOString().slice(0, 10),
    expiresAt: dateField(coupon?.expiresAt),
    isActive: coupon?.isActive ?? true,
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const save = useMutation({
    mutationFn: () => {
      const body = {
        code: f.code.trim().toUpperCase(),
        name: f.name.trim() || f.code.trim().toUpperCase(),
        type: f.type,
        value: Number(f.value),
        minimumOrderAmount: numOrUndef(f.minimumOrderAmount),
        maximumDiscountAmount: numOrUndef(f.maximumDiscountAmount),
        usageLimit: numOrUndef(f.usageLimit),
        startsAt: new Date(`${f.startsAt}T00:00:00`).toISOString(),
        expiresAt: new Date(`${f.expiresAt}T23:59:59`).toISOString(),
        isActive: f.isActive,
      }
      return coupon ? api.patch(`/admin/coupons/${coupon.id}`, body) : api.post('/admin/coupons', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      onClose()
    },
  })
  const valid =
    f.code.trim().length >= 3 &&
    Number(f.value) > 0 &&
    (f.type !== 'PERCENTAGE' || Number(f.value) <= 100) &&
    f.expiresAt &&
    f.expiresAt >= f.startsAt

  return (
    <Modal
      title={coupon ? `تعديل ${coupon.code}` : 'كوبون جديد'}
      icon="card"
      onClose={onClose}
      width={620}
      footer={
        <>
          <button type="button" className={buttonClass({ variant: 'outline' })} onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className={buttonClass({ variant: 'gold' })}
            disabled={!valid || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? <Spinner /> : 'حفظ'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <TextField
          label="الكود"
          ltr
          placeholder="WELCOME10"
          value={f.code}
          onChange={(e) => set('code', e.target.value.toUpperCase())}
        />
        <TextField
          label="اسم داخلي"
          placeholder="خصم الترحيب"
          value={f.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <SelectField
          label="نوع الخصم"
          value={f.type}
          onChange={(e) => set('type', e.target.value as Coupon['type'])}
          options={[
            { value: 'PERCENTAGE', label: 'نسبة %' },
            { value: 'FIXED_AMOUNT', label: 'مبلغ ثابت (ج.م)' },
          ]}
        />
        <TextField
          label={f.type === 'PERCENTAGE' ? 'النسبة %' : 'المبلغ'}
          type="number"
          min={0}
          ltr
          value={f.value}
          onChange={(e) => set('value', e.target.value)}
        />
        <TextField
          label="أقل قيمة للطلب (اختياري)"
          type="number"
          min={0}
          ltr
          value={f.minimumOrderAmount}
          onChange={(e) => set('minimumOrderAmount', e.target.value)}
        />
        <TextField
          label="أقصى خصم (اختياري)"
          type="number"
          min={0}
          ltr
          value={f.maximumDiscountAmount}
          onChange={(e) => set('maximumDiscountAmount', e.target.value)}
        />
        <TextField
          label="يبدأ"
          type="date"
          ltr
          value={f.startsAt}
          onChange={(e) => set('startsAt', e.target.value)}
        />
        <TextField
          label="ينتهي"
          type="date"
          ltr
          value={f.expiresAt}
          onChange={(e) => set('expiresAt', e.target.value)}
        />
        <TextField
          label="عدد مرات الاستخدام (فاضي = مفتوح)"
          type="number"
          min={1}
          ltr
          value={f.usageLimit}
          onChange={(e) => set('usageLimit', e.target.value)}
        />
        <div className="flex items-end pb-3">
          <CheckField label="شغال" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} />
        </div>
      </div>
      {save.isError && (
        <div className="mt-4">
          <Alert tone="error">{(save.error as Error).message}</Alert>
        </div>
      )}
    </Modal>
  )
}

// ---------- name lists (categories, tags) ----------

function NameList({ title, path, noActive }: { title: string; path: string; noActive?: boolean }) {
  const queryClient = useQueryClient()
  const key = ['admin', 'names', path]
  const list = useQuery({ queryKey: key, queryFn: () => api.get<NamedCategory[]>(path) })
  const [name, setName] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const create = useMutation({
    mutationFn: () => api.post(path, { nameAr: name.trim(), nameEn: name.trim() }),
    onSuccess: () => {
      setName('')
      refresh()
    },
  })
  const toggle = useMutation({
    mutationFn: (c: NamedCategory) => api.patch(`${path}/${c.id}`, { isActive: !c.isActive }),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`${path}/${id}`), onSuccess: refresh })
  const rename = useMutation({
    mutationFn: ({ id, nameAr }: { id: string; nameAr: string }) => api.patch(`${path}/${id}`, { nameAr }),
    onSuccess: refresh,
  })
  const error = create.error ?? toggle.error ?? remove.error ?? rename.error

  return (
    <AdminCard className="flex flex-col gap-3 p-5">
      <h2 className="text-lg">{title}</h2>
      {list.isLoading ? (
        <Spinner />
      ) : (
        <ul className="flex flex-col">
          {(list.data ?? []).map((c) => (
            <li key={c.id} className="flex items-center gap-2 border-t border-divider py-2 first:border-t-0">
              <span
                className={cn(
                  'flex-1 text-sm',
                  c.isActive === false ? 'text-muted line-through' : 'font-bold text-ink',
                )}
              >
                {c.nameAr}
              </span>
              <button
                type="button"
                className={buttonClass({ variant: 'ghost', size: 'sm' })}
                onClick={() => {
                  const next = window.prompt('الاسم الجديد', c.nameAr)
                  if (next && next.trim() && next.trim() !== c.nameAr)
                    rename.mutate({ id: c.id, nameAr: next.trim() })
                }}
              >
                تعديل
              </button>
              {!noActive && (
                <button
                  type="button"
                  className={buttonClass({ variant: 'ghost', size: 'sm' })}
                  onClick={() => toggle.mutate(c)}
                >
                  {c.isActive === false ? 'إظهار' : 'إخفاء'}
                </button>
              )}
              <button
                type="button"
                className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
                onClick={() => window.confirm(`حذف «${c.nameAr}»؟`) && remove.mutate(c.id)}
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className={cn(inputClass, 'h-10 flex-1')}
          placeholder="اسم جديد"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className={buttonClass({ variant: 'outline', size: 'sm' })}
          disabled={name.trim().length < 2 || create.isPending}
          onClick={() => create.mutate()}
        >
          <Icon name="plus" size={14} /> إضافة
        </button>
      </div>
      {error && (
        <Alert tone="error">
          {(error as Error).message}
          {/in use|related|exist/i.test((error as Error).message) && ' — القسم مستخدم؛ خبّيه بدل ما تحذفه.'}
        </Alert>
      )}
    </AdminCard>
  )
}
