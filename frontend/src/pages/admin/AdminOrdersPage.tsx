import { useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/routes'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys, adminOrdersApi, type AdminOrder } from '@/api/admin'
import type { OrderStatus, PaymentStatus, ShippingStatus } from '@/api/shop'
import { AdminCard, AdminHeader } from '@/components/admin/AdminLayout'
import { FilterTabs, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Pager } from '@/components/ui/Pager'
import { buttonClass, inputClass } from '@/components/ui/button'
import { SelectField, TextField } from '@/components/ui/fields'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { formatAddress } from '@/lib/address'
import { cn } from '@/lib/cn'
import { formatDate, formatEGP } from '@/lib/format'
import { SHIPPING_LABEL, orderKinds, orderStatus } from '@/lib/order-status'
import { downloadCsv } from '@/lib/csv'
import { usePageTitle } from '@/lib/usePageTitle'

type Tab = 'all' | 'pending' | 'paid' | 'toShip' | 'shipped' | 'failed' | 'cancelled' | 'refunded'

const TAB_QUERY: Record<
  Tab,
  { status?: OrderStatus; paymentStatus?: PaymentStatus; shippingStatus?: ShippingStatus }
> = {
  all: {},
  pending: { status: 'PENDING', paymentStatus: 'PENDING' },
  paid: { status: 'PAID' },
  toShip: { status: 'PAID', shippingStatus: 'PREPARING' },
  shipped: { status: 'PAID', shippingStatus: 'SHIPPED' },
  failed: { paymentStatus: 'FAILED' },
  cancelled: { status: 'CANCELLED' },
  refunded: { status: 'REFUNDED' },
}

function money(o: Pick<AdminOrder, 'currency'>, v: number) {
  return o.currency === 'USD' ? `$${v.toFixed(2)}` : formatEGP(v)
}

function whatsappLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

export function AdminOrdersPage() {
  usePageTitle('الطلبات')
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const query = { ...TAB_QUERY[tab], search: search.trim() || undefined }
  const orders = useQuery({
    queryKey: [...adminKeys.orders, tab, page, search],
    queryFn: () => adminOrdersApi.list({ page, limit: 20, ...query }),
  })

  async function exportCsv() {
    setExporting(true)
    try {
      const rows: AdminOrder[] = []
      for (let p = 1; p <= 50; p++) {
        const res = await adminOrdersApi.list({ page: p, limit: 100, ...query })
        rows.push(...res.items)
        if (p >= res.pagination.totalPages) break
      }
      downloadCsv(
        `orders-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'رقم الطلب',
          'التاريخ',
          'العميل',
          'الموبايل',
          'الإيميل',
          'المحتوى',
          'الإجمالي',
          'العملة',
          'الحالة',
          'رقم الشحنة',
        ],
        rows.map((o) => [
          o.orderNumber,
          o.createdAt.slice(0, 10),
          o.user?.fullName ?? '',
          o.user?.phoneNumber ?? '',
          o.user?.email ?? '',
          o.items.map((i) => `${i.titleAr}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`).join(' + '),
          o.totalAmount,
          o.currency,
          orderStatus(o).label,
          o.trackingNumber ?? '',
        ]),
      )
    } finally {
      setExporting(false)
    }
  }
  const list = orders.data?.items ?? []
  const current = list.find((o) => o.id === selected) ?? list[0]

  return (
    <>
      <AdminHeader
        title="الطلبات"
        sub={orders.data ? `${orders.data.pagination.total} طلب` : undefined}
        actions={
          <button
            type="button"
            className={buttonClass({ variant: 'outline' })}
            disabled={exporting}
            onClick={exportCsv}
          >
            {exporting ? (
              <Spinner />
            ) : (
              <>
                <Icon name="download" size={16} /> تصدير Excel
              </>
            )}
          </button>
        }
      />
      <div className="grid grid-cols-[1fr_340px] items-start gap-6 max-xl:grid-cols-1">
        <AdminCard className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-divider p-4">
            <label className="relative w-72 max-sm:w-full">
              <span className="sr-only">بحث</span>
              <Icon
                name="search"
                size={15}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
              />
              <input
                className={cn(inputClass, 'h-10 pr-10 text-sm')}
                placeholder="رقم الطلب، اسم العميل، موبايل…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                  setSelected(null)
                }}
              />
            </label>
            <FilterTabs
              value={tab}
              onChange={(t) => {
                setTab(t)
                setPage(1)
                setSelected(null)
              }}
              tabs={[
                { id: 'all', label: 'الكل' },
                { id: 'pending', label: 'مستني الدفع' },
                { id: 'paid', label: 'مدفوع' },
                { id: 'toShip', label: 'بيتجهّز' },
                { id: 'shipped', label: 'في الطريق' },
                { id: 'failed', label: 'الدفع فشل' },
                { id: 'cancelled', label: 'ملغي' },
                { id: 'refunded', label: 'مسترد' },
              ]}
            />
          </div>
          {orders.isError ? (
            <ErrorState onRetry={() => orders.refetch()} />
          ) : orders.isLoading ? (
            <div className="flex justify-center py-16 text-blue-600">
              <Spinner />
            </div>
          ) : list.length === 0 ? (
            <EmptyState compact icon="bag" title="مفيش طلبات هنا" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-sm">
                <thead className="bg-surface text-right text-muted">
                  <tr>
                    <th className="px-5 py-3 font-bold">الطلب</th>
                    <th className="px-3 py-3 font-bold">العميل</th>
                    <th className="px-3 py-3 font-bold">المحتوى</th>
                    <th className="px-3 py-3 font-bold">المبلغ</th>
                    <th className="px-3 py-3 font-bold">الحالة</th>
                    <th className="px-5 py-3 font-bold">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => {
                    const st = orderStatus(o)
                    const on = current?.id === o.id
                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelected(o.id)}
                        className={cn(
                          'cursor-pointer border-t border-divider hover:bg-hover',
                          on && 'bg-surface-blue',
                        )}
                      >
                        <td className="px-5 py-3 font-bold text-ink" dir="ltr">
                          <button
                            type="button"
                            className="border-0 bg-transparent font-bold text-ink"
                            aria-pressed={on}
                          >
                            #{o.orderNumber}
                          </button>
                        </td>
                        <td className="px-3 py-3">{o.user?.fullName ?? '—'}</td>
                        <td className="px-3 py-3 text-muted">
                          {o.items.length === 1 ? o.items[0].titleAr : `${o.items.length} عناصر`}
                        </td>
                        <td className="px-3 py-3 font-bold text-ink">{money(o, o.totalAmount)}</td>
                        <td className="px-3 py-3">
                          <StatusPill tone={st.tone}>{st.label}</StatusPill>
                        </td>
                        <td className="px-5 py-3 text-muted">{formatDate(o.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {orders.data && orders.data.pagination.totalPages > 1 && (
            <div className="border-t border-divider p-4">
              <Pager pagination={orders.data.pagination} noun="طلب" onChange={setPage} />
            </div>
          )}
        </AdminCard>

        {current && <OrderPanel key={current.id} order={current} />}
      </div>
    </>
  )
}

function OrderPanel({ order }: { order: AdminOrder }) {
  const queryClient = useQueryClient()
  const st = orderStatus(order)
  const save = useMutation({
    mutationFn: (status: 'CANCELLED' | 'REFUNDED') =>
      adminOrdersApi.setStatus(order.id, { status, paymentStatus: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  return (
    <AdminCard className="sticky top-6 flex flex-col gap-4 p-5 max-xl:static">
      <div className="flex items-center justify-between gap-2">
        <b className="font-head text-xl text-ink" dir="ltr">
          #{order.orderNumber}
        </b>
        <StatusPill tone={st.tone}>{st.label}</StatusPill>
      </div>
      {order.user && (
        <div className="flex items-center gap-3 rounded-tile bg-surface p-3">
          <span className="flex size-10 flex-none bg-gold items-center justify-center rounded-full font-bold text-navy">
            {order.user.fullName.charAt(0)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <b className="truncate text-ink">{order.user.fullName}</b>
            <span className="text-xs text-muted" dir="ltr">
              {order.user.phoneNumber}
            </span>
          </span>
          <a
            href={whatsappLink(order.user.phoneNumber)}
            target="_blank"
            rel="noreferrer"
            aria-label="واتساب"
            className="flex size-10 items-center justify-center rounded-xl bg-[#25D366] text-white"
          >
            <Icon name="whatsapp" size={18} />
          </a>
        </div>
      )}
      <div className="flex flex-col gap-1.5 text-sm">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between gap-2">
            <span className="text-text-2">
              {i.titleAr}
              {i.quantity > 1 && ` × ${i.quantity}`}
            </span>
            <b className="whitespace-nowrap text-ink">{money(order, i.totalPrice)}</b>
          </div>
        ))}
        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted">الخصم</span>
            <b className="text-success">− {money(order, order.discountAmount)}</b>
          </div>
        )}
        {order.shippingCost > 0 && (
          <div className="flex justify-between">
            <span className="text-muted">الشحن</span>
            <b className="text-ink">{money(order, order.shippingCost)}</b>
          </div>
        )}
        <div className="mt-1 flex items-baseline justify-between border-t border-divider pt-2">
          <b className="text-ink">الإجمالي</b>
          <b className="font-head text-2xl text-ink">{money(order, order.totalAmount)}</b>
        </div>
      </div>
      <p className="text-xs text-muted">
        {orderKinds(order)} · {formatDate(order.createdAt)}
        {order.paidAt && ` · اتدفع ${formatDate(order.paidAt)}`}
      </p>
      {order.shippingAddress && (
        <p className="flex items-start gap-2 rounded-tile bg-surface p-3 text-sm text-text-2">
          <Icon name="mapPin" size={15} className="mt-0.5 flex-none text-blue-600" />
          <span>
            {formatAddress(order.shippingAddress)}
            <span className="block text-xs text-muted" dir="ltr">
              {order.shippingAddress.phoneNumber}
            </span>
          </span>
        </p>
      )}
      {order.notes && (
        <p className="rounded-tile bg-gold-soft p-3 text-sm text-gold-ink">ملاحظة العميل: {order.notes}</p>
      )}
      {order.status === 'PAID' && order.hasPhysicalItems && <ShippingForm order={order} />}
      <div className="flex flex-wrap gap-2.5">
        <Link
          to={routes.invoice(order.id)}
          target="_blank"
          className={buttonClass({ variant: 'outline', size: 'sm' })}
        >
          <Icon name="receipt" size={15} /> الفاتورة
        </Link>
        {order.status === 'PENDING' && order.paymentStatus !== 'PAID' && (
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
            disabled={save.isPending}
            onClick={() => window.confirm('إلغاء الطلب؟') && save.mutate('CANCELLED')}
          >
            إلغاء الطلب
          </button>
        )}
        {order.status === 'PAID' && (
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
            disabled={save.isPending}
            onClick={() =>
              window.confirm(
                'تسجيل إن المبلغ اترد للعميل؟ (ده بيسجّل الحالة بس، الرد نفسه بيتعمل من بوابة الدفع)',
              ) && save.mutate('REFUNDED')
            }
          >
            تسجيل استرداد
          </button>
        )}
      </div>
      {order.status === 'PENDING' && (
        <p className="text-xs leading-relaxed text-muted">
          الطلب بيتعلّم مدفوع لوحده لما الدفع يتم من بوابة الدفع. لو العميل دفع خارج المنصة، افتحله المحتوى من
          صفحة المستخدمين.
        </p>
      )}
      {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
    </AdminCard>
  )
}

function ShippingForm({ order }: { order: AdminOrder }) {
  const queryClient = useQueryClient()
  const [f, setF] = useState({
    shippingStatus: (order.shippingStatus ?? 'PREPARING') as ShippingStatus,
    shippingCarrier: order.shippingCarrier ?? '',
    trackingNumber: order.trackingNumber ?? '',
  })
  const dirty =
    f.shippingStatus !== (order.shippingStatus ?? 'PREPARING') ||
    f.shippingCarrier !== (order.shippingCarrier ?? '') ||
    f.trackingNumber !== (order.trackingNumber ?? '') ||
    !order.shippingStatus
  const save = useMutation({
    mutationFn: () =>
      adminOrdersApi.setShipping(order.id, {
        shippingStatus: f.shippingStatus,
        shippingCarrier: f.shippingCarrier.trim() || undefined,
        trackingNumber: f.trackingNumber.trim() || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.orders }),
  })
  return (
    <fieldset className="flex flex-col gap-3 rounded-tile border border-blue-300/50 bg-surface-blue/40 p-4">
      <legend className="flex items-center gap-2 px-1 font-bold text-ink">
        <Icon name="truck" size={16} /> الشحن
      </legend>
      <SelectField
        label="حالة الشحن"
        value={f.shippingStatus}
        onChange={(e) => setF({ ...f, shippingStatus: e.target.value as ShippingStatus })}
        options={(Object.keys(SHIPPING_LABEL) as ShippingStatus[]).map((k) => ({
          value: k,
          label: SHIPPING_LABEL[k],
        }))}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <TextField
          label="شركة الشحن"
          placeholder="بوسطة"
          value={f.shippingCarrier}
          onChange={(e) => setF({ ...f, shippingCarrier: e.target.value })}
        />
        <TextField
          label="رقم الشحنة"
          ltr
          value={f.trackingNumber}
          onChange={(e) => setF({ ...f, trackingNumber: e.target.value })}
        />
      </div>
      {(order.shippedAt || order.deliveredAt) && (
        <p className="text-xs text-muted">
          {order.shippedAt && `خرج ${formatDate(order.shippedAt)}`}
          {order.deliveredAt && ` · اتسلّم ${formatDate(order.deliveredAt)}`}
        </p>
      )}
      {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
      {save.isSuccess && <Alert tone="success">اتحفظ، والعميل هيشوف الحالة في «طلباتي».</Alert>}
      <button
        type="button"
        className={buttonClass({ variant: 'navy', size: 'sm' })}
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? <Spinner /> : 'حفظ الشحن'}
      </button>
    </fieldset>
  )
}
