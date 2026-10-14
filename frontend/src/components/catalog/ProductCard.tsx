import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveAssetUrl } from '@/api/client'
import { useAddToCart } from '@/api/cart'
import type { StoreProduct } from '@/api/endpoints'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { Spinner } from '@/components/ui/States'
import { CARD_GRADS, pickBySeed, productPrice } from '@/lib/catalog'
import { formatEGP } from '@/lib/format'

export function ProductImage({ product, className }: { product: StoreProduct; className?: string }) {
  const src = resolveAssetUrl(product.coverImage)
  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ background: pickBySeed(CARD_GRADS, product.id) }}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" className="size-full cover-photo object-cover" />
      ) : (
        <div className="absolute inset-0 dots opacity-40" />
      )}
    </div>
  )
}

export function ProductCard({ product }: { product: StoreProduct }) {
  const price = productPrice(product)
  const cart = useAddToCart()
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock <= 0
  const off = price.old ? Math.round((1 - price.current / price.old) * 100) : 0

  async function add() {
    try {
      if (await cart.add({ itemType: 'PRODUCT', itemId: product.id })) setAdded(true)
    } catch {
      // the button shows nothing new; the cart page will show the real state
    }
  }

  return (
    <article className="glow-card relative flex flex-col gap-3 rounded-card border border-line bg-white p-2.5 pb-4">
      <Link to={routes.product(product.slug)} className="absolute inset-0 z-1 rounded-[inherit]">
        <span className="sr-only">{product.name}</span>
      </Link>
      <div className="relative">
        <ProductImage product={product} className="h-52 rounded-[18px] max-sm:h-40" />
        {off > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-ink">
            وفّر {formatEGP(price.old! - price.current)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2">
        {product.category && (
          <span className="text-[13px] font-bold text-blue-600">{product.category.nameAr}</span>
        )}
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{product.description}</p>
      </div>
      <div className="flex items-center justify-between gap-2 px-2 pt-1">
        <span className="flex flex-col">
          <b className="font-head text-xl text-ink">{formatEGP(price.current)}</b>
          <span className={outOfStock ? 'text-xs text-danger' : 'text-xs text-muted'}>
            {outOfStock ? 'نفد من المخزن' : price.old ? <s>{formatEGP(price.old)}</s> : 'متوفر'}
          </span>
        </span>
        <button
          type="button"
          disabled={outOfStock || cart.isPending}
          onClick={add}
          className={buttonClass({ variant: 'navy', size: 'sm', className: 'relative z-2 px-3.5' })}
        >
          {cart.isPending ? (
            <Spinner />
          ) : added ? (
            <>
              <Icon name="check" size={16} /> اتضاف
            </>
          ) : (
            <>
              <Icon name="plus" size={16} /> أضف للسلة
            </>
          )}
        </button>
      </div>
    </article>
  )
}
