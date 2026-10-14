import { resolveAssetUrl } from '@/api/client'
import type { CartItemType } from '@/api/cart'
import { Icon, type IconName } from '@/components/ui/Icon'
import { CARD_GRADS, pickBySeed } from '@/lib/catalog'

const ICON: Record<CartItemType, IconName> = { COURSE: 'video', BOOK: 'book', PRODUCT: 'box' }

/** Square thumbnail for a cart / order line: the item's image, or a colored icon tile. */
export function LineThumb({
  id,
  type,
  image,
  size = 'md',
}: {
  id: string
  type: CartItemType
  image?: string | null
  size?: 'md' | 'sm'
}) {
  const src = resolveAssetUrl(image)
  const dims = size === 'sm' ? 'size-12 rounded-xl' : 'size-19 rounded-tile max-sm:size-16'
  return (
    <span
      className={`flex flex-none items-center justify-center overflow-hidden text-white ${dims}`}
      style={{ background: pickBySeed(CARD_GRADS, id) }}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <Icon name={ICON[type]} size={size === 'sm' ? 20 : 28} />
      )}
    </span>
  )
}
