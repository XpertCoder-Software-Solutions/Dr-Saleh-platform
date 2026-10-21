import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWishlistAll, wishlistApi, type WishlistRow } from '@/api/account'
import { useAddToCart } from '@/api/cart'
import { resolveAssetUrl } from '@/api/client'
import type { WishlistItemType } from '@/api/wishlist'
import { routes } from '@/app/routes'
import { useGender } from '@/auth/hooks'
import { AccountShell, FilterTabs, Panel } from '@/components/account/AccountShell'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { CARD_GRADS, pickBySeed } from '@/lib/catalog'
import { formatMoney } from '@/lib/format'
import { useRegion } from '@/lib/region'
import { productPrice } from '@/lib/catalog'

type Filter = 'all' | WishlistItemType

const KIND: Record<WishlistItemType, { label: string; icon: IconName }> = {
  COURSE: { label: 'دورة', icon: 'video' },
  BOOK: { label: 'كتاب', icon: 'book' },
  PRODUCT: { label: 'منتج', icon: 'box' },
}

function itemLink(row: WishlistRow) {
  const slug = row.item?.slug ?? ''
  return row.itemType === 'COURSE'
    ? routes.course(row.itemId)
    : row.itemType === 'BOOK'
      ? routes.book(slug)
      : routes.product(slug)
}

export function WishlistPage() {
  const g = useGender()
  const wishlist = useWishlistAll()
  const [filter, setFilter] = useState<Filter>('all')
  const rows = (wishlist.data?.items ?? []).filter((r) => r.item)
  const count = (t: WishlistItemType) => rows.filter((r) => r.itemType === t).length
  const visible = rows.filter((r) => filter === 'all' || r.itemType === filter)

  return (
    <AccountShell
      active="wishlist"
      pageTitle="المفضلة"
      title={<span className="text-sheen">المفضلة</span>}
      body={g(
        'الدورات والكتب والمنتجات اللي حفظتها عشان ترجعلها.',
        'الدورات والكتب والمنتجات اللي حفظتيها عشان ترجعيلها.',
        'الدورات والكتب والمنتجات المحفوظة.',
      )}
    >
      <Panel className="p-4">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: 'all', label: 'الكل', count: rows.length },
            { id: 'COURSE', label: 'دورات', count: count('COURSE') },
            { id: 'BOOK', label: 'كتب', count: count('BOOK') },
            { id: 'PRODUCT', label: 'منتجات', count: count('PRODUCT') },
          ]}
        />
      </Panel>

      {wishlist.isError ? (
        <ErrorState onRetry={() => wishlist.refetch()} />
      ) : wishlist.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : visible.length === 0 ? (
        <Panel>
          <EmptyState
            icon="heart"
            title="المفضلة فاضية"
            body={g(
              'دوس على القلب في أي دورة أو كتاب عشان تحفظه هنا.',
              'دوسي على القلب في أي دورة أو كتاب عشان تحفظيه هنا.',
              'القلب في أي دورة أو كتاب بيحفظه هنا.',
            )}
            action={
              <Link to={routes.courses} className={buttonClass({ variant: 'gold' })}>
                تصفّح الدورات
              </Link>
            }
          />
        </Panel>
      ) : (
        <ul className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
          {visible.map((r) => (
            <WishCard key={r.id} row={r} />
          ))}
        </ul>
      )}
    </AccountShell>
  )
}

function WishCard({ row }: { row: WishlistRow }) {
  const { currency } = useRegion()
  const queryClient = useQueryClient()
  const cart = useAddToCart()
  const [added, setAdded] = useState(false)
  const item = row.item!
  const kind = KIND[row.itemType]
  const img = resolveAssetUrl(item.image)
  const { current: price, old: listPrice } = productPrice(item, currency)
  const outOfStock = row.itemType === 'PRODUCT' && item.stock === 0

  const remove = useMutation({
    mutationFn: () => wishlistApi.remove(row.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['me', 'wishlist'] }),
  })

  return (
    <li className="flex lift flex-col overflow-hidden rounded-card border border-line bg-white p-2.5 shadow-card">
      <div
        className="relative flex h-40 items-center justify-center overflow-hidden rounded-tile text-white"
        style={{ background: pickBySeed(CARD_GRADS, row.itemId) }}
      >
        {img ? (
          <img src={img} alt="" className="size-full object-cover" />
        ) : (
          <Icon name={kind.icon} size={40} />
        )}
        <span className="absolute top-2.5 right-2.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-ink">
          {kind.label}
        </span>
        <button
          type="button"
          aria-label={`شيل ${item.nameAr} من المفضلة`}
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
          className="absolute top-2.5 left-2.5 flex size-10 items-center justify-center rounded-full border-0 bg-white text-danger-dot shadow-md disabled:opacity-60"
        >
          <Icon name="heart" size={18} className="fill-current" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2.5 pt-3.5">
        <h3 className="text-[17px] leading-snug">
          <Link to={itemLink(row)} className="text-ink">
            {item.nameAr}
          </Link>
        </h3>
        {!item.isActive && <span className="text-xs text-danger">مش متاح حاليًا</span>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-divider px-2.5 pt-3 pb-1.5">
        <span className="flex flex-col">
          <b className="font-head text-lg text-ink">{formatMoney(price, currency)}</b>
          {listPrice !== null && (
            <span className="text-xs font-bold text-success">
              السعر نزل {formatMoney((listPrice ?? price) - price, currency)}
            </span>
          )}
        </span>
        {row.itemType === 'BOOK' ? (
          <Link to={itemLink(row)} className={buttonClass({ variant: 'navy', size: 'sm' })}>
            اختار النسخة
          </Link>
        ) : (
          <button
            type="button"
            className={buttonClass({ variant: 'navy', size: 'sm' })}
            disabled={!item.isActive || outOfStock || cart.isPending}
            onClick={async () => {
              if (await cart.add({ itemType: row.itemType, itemId: row.itemId })) setAdded(true)
            }}
          >
            {added ? (
              <>
                <Icon name="check" size={14} /> في السلة
              </>
            ) : outOfStock ? (
              'نفد'
            ) : (
              <>
                <Icon name="plus" size={14} /> للسلة
              </>
            )}
          </button>
        )}
      </div>
    </li>
  )
}
