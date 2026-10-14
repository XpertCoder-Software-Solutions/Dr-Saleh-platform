import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountKeys } from '@/api/account'
import { ordersApi, type Order } from '@/api/shop'
import { routes } from '@/app/routes'
import { useGender } from '@/auth/hooks'
import { AccountShell, FilterTabs, Panel, StatusPill } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { Pager } from '@/components/ui/Pager'
import { buttonClass } from '@/components/ui/button'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { formatAddress } from '@/lib/address'
import { cn } from '@/lib/cn'
import { formatDate, formatEGP } from '@/lib/format'
import { orderKinds, orderStatus } from '@/lib/order-status'

type Filter = 'all' | 'pending' | 'paid' | 'closed'

const PAGE_SIZE = 20

function money(o: Pick<Order, 'currency'>, v: number) {
  return o.currency === 'USD' ? `$${v.toFixed(2)}` : formatEGP(v)
}

function bucket(o: Order): Filter {
  if (o.status === 'PAID') return 'paid'
  if (o.status === 'PENDING') return 'pending'
  return 'closed'
}

export function OrdersPage() {
  const g = useGender()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)
  const orders = useQuery({
    queryKey: [...accountKeys.orders, page],
    queryFn: () => ordersApi.list({ page, limit: PAGE_SIZE }),
  })
  const list = orders.data?.items ?? []
  const count = (f: Filter) => list.filter((o) => bucket(o) === f).length
  const visible = list.filter((o) => filter === 'all' || bucket(o) === filter)
  const openId = open ?? visible[0]?.id ?? null

  return (
    <AccountShell
      active="orders"
      pageTitle="طلباتي"
      title={<span className="text-sheen">طلباتي</span>}
      body={g(
        'تابع حالة كل طلب، وكمّل دفع أي طلب لسه مستني.',
        'تابعي حالة كل طلب، وكمّلي دفع أي طلب لسه مستني.',
        'حالة كل طلب، ودفع الطلبات اللي لسه مستنية.',
      )}
    >
      <Panel className="p-4">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: 'all', label: 'الكل', count: list.length },
            { id: 'pending', label: 'في انتظار الدفع', count: count('pending') },
            { id: 'paid', label: 'مدفوعة', count: count('paid') },
            { id: 'closed', label: 'ملغية ومستردة', count: count('closed') },
          ]}
        />
      </Panel>

      {orders.isError ? (
        <ErrorState onRetry={() => orders.refetch()} />
      ) : orders.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : list.length === 0 ? (
        <Panel>
          <EmptyState
            icon="receipt"
            title="مفيش طلبات لسه"
            body="أي طلب بتعمله هتلاقيه هنا بحالته."
            action={
              <Link to={routes.courses} className={buttonClass({ variant: 'gold' })}>
                تصفّح الدورات
              </Link>
            }
          />
        </Panel>
      ) : visible.length === 0 ? (
        <Panel>
          <EmptyState compact icon="receipt" title="مفيش طلبات بالحالة دي" />
        </Panel>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              open={o.id === openId}
              onToggle={() => setOpen(o.id === openId ? '' : o.id)}
            />
          ))}
        </ul>
      )}
      {orders.data && orders.data.pagination.totalPages > 1 && (
        <Pager pagination={orders.data.pagination} noun="طلب" onChange={setPage} />
      )}
    </AccountShell>
  )
}

function OrderRow({ order, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  const queryClient = useQueryClient()
  const st = orderStatus(order)
  const pending = order.status === 'PENDING'
  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(order.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.orders }),
  })

  return (
    <li className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 border-0 bg-transparent p-5 text-right max-sm:p-4"
      >
        <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
          <Icon name="receipt" size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <b className="text-ink">
            طلب{' '}
            <span dir="ltr" className="whitespace-nowrap">
              #{order.orderNumber}
            </span>
          </b>
          <span className="truncate text-sm text-muted">
            {formatDate(order.createdAt)} · {orderKinds(order)}
          </span>
          <StatusPill tone={st.tone} className="mt-1.5 self-start sm:hidden">
            {st.label}
          </StatusPill>
        </span>
        <StatusPill tone={st.tone} className="max-sm:hidden">
          {st.label}
        </StatusPill>
        <b className="w-24 text-left font-head text-lg text-ink max-sm:hidden">
          {money(order, order.totalAmount)}
        </b>
        <Icon
          name="chevDown"
          size={18}
          className={cn('flex-none text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="grid grid-cols-[1.3fr_1fr] gap-6 border-t border-divider p-5 max-md:grid-cols-1 max-sm:p-4">
          <div className="flex flex-col gap-2">
            <h3 className="mb-1 text-base">محتوى الطلب</h3>
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-text-2">
                  {i.titleAr}
                  {i.quantity > 1 && <span className="text-muted"> × {i.quantity}</span>}
                </span>
                <b className="whitespace-nowrap text-ink">{money(order, i.totalPrice)}</b>
              </div>
            ))}
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">الخصم</span>
                <b className="text-success">− {money(order, order.discountAmount)}</b>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">الشحن</span>
                <b className="text-ink">{money(order, order.shippingCost)}</b>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-divider pt-2">
              <b className="text-ink">الإجمالي</b>
              <b className="font-head text-lg text-ink">{money(order, order.totalAmount)}</b>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-base">حالة الطلب</h3>
            <Timeline order={order} />
            {order.trackingNumber && (
              <p className="flex items-center gap-2 text-sm text-text-2">
                <Icon name="truck" size={15} className="text-blue-600" />
                رقم الشحنة:{' '}
                <b dir="ltr" className="text-ink">
                  {order.trackingNumber}
                </b>
              </p>
            )}
            {order.shippingAddress && (
              <p className="flex items-start gap-2 rounded-tile bg-surface p-3 text-sm text-text-2">
                <Icon name="mapPin" size={15} className="mt-0.5 flex-none text-blue-600" />
                {formatAddress(order.shippingAddress)}
              </p>
            )}
            <Link
              to={routes.invoice(order.id)}
              target="_blank"
              className={buttonClass({ variant: 'outline', size: 'sm', className: 'self-start' })}
            >
              <Icon name="download" size={15} /> تحميل الفاتورة
            </Link>
            {pending && (
              <div className="flex flex-wrap gap-2.5">
                <Link
                  to={routes.checkoutPay(order.id)}
                  className={buttonClass({ variant: 'gold', size: 'sm' })}
                >
                  <Icon name="card" size={15} /> ادفع دلوقتي
                </Link>
                <button
                  type="button"
                  className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-danger' })}
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (window.confirm('متأكد إنك عايز تلغي الطلب؟')) cancel.mutate()
                  }}
                >
                  إلغاء الطلب
                </button>
              </div>
            )}
            {cancel.isError && <Alert tone="error">{(cancel.error as Error).message}</Alert>}
          </div>
        </div>
      )}
    </li>
  )
}

/** Received → paid → (for physical items) on its way. Shipping isn't tracked yet, so that step is informational. */
function Timeline({ order }: { order: Order }) {
  const paid = order.status === 'PAID'
  const steps: { label: string; sub?: string; state: 'done' | 'now' | 'todo' | 'off' }[] = [
    { label: 'تم استلام الطلب', sub: formatDate(order.createdAt), state: 'done' },
    order.status === 'CANCELLED'
      ? { label: 'اتلغى', state: 'off' }
      : order.status === 'REFUNDED'
        ? { label: 'المبلغ اترد', state: 'done' }
        : paid
          ? { label: 'تم الدفع', sub: order.paidAt ? formatDate(order.paidAt) : undefined, state: 'done' }
          : {
              label: order.paymentStatus === 'FAILED' ? 'الدفع مكملش' : 'في انتظار الدفع',
              state: 'now',
            },
  ]
  if (order.hasPhysicalItems && order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
    const ship = order.shippingStatus
    const shipped = ship === 'SHIPPED' || ship === 'DELIVERED'
    steps.push({
      label: shipped ? 'خرج للشحن' : 'بيتجهّز للشحن',
      sub: shipped
        ? [order.shippedAt && formatDate(order.shippedAt), order.shippingCarrier].filter(Boolean).join(' · ')
        : paid
          ? 'بيوصلك خلال 2 لـ 4 أيام عمل'
          : 'بعد الدفع',
      state: shipped ? 'done' : paid ? 'now' : 'todo',
    })
    steps.push({
      label: 'تم التوصيل',
      sub: ship === 'DELIVERED' && order.deliveredAt ? formatDate(order.deliveredAt) : undefined,
      state: ship === 'DELIVERED' ? 'done' : ship === 'SHIPPED' ? 'now' : 'todo',
    })
  }
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-7 flex-none items-center justify-center rounded-full text-xs',
              s.state === 'done' && 'bg-navy text-white',
              s.state === 'now' && 'bg-gold text-navy',
              s.state === 'todo' && 'border border-line-2 text-muted',
              s.state === 'off' && 'bg-red-50 text-danger',
            )}
          >
            <Icon name={s.state === 'off' ? 'close' : s.state === 'done' ? 'check' : 'clock'} size={13} />
          </span>
          <span className="flex flex-col">
            <b className={cn('text-sm', s.state === 'todo' ? 'text-muted' : 'text-ink')}>{s.label}</b>
            {s.sub && <span className="text-xs text-muted">{s.sub}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
