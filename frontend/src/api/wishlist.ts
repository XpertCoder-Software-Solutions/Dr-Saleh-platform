import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { api } from './client'

export type WishlistItemType = 'COURSE' | 'BOOK' | 'PRODUCT'

interface WishlistEntry {
  id: string
  itemType: WishlistItemType
  itemId: string
}

const key = (type: WishlistItemType) => ['me', 'wishlist', type] as const

/** Wishlist membership for one item type, plus a toggle that sends guests to login. */
export function useWishlist(type: WishlistItemType) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: key(type),
    queryFn: () =>
      api.get<{ items: WishlistEntry[] }>('/wishlist', { params: { itemType: type, limit: 100 } }),
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
  })

  const byItemId = new Map((data?.items ?? []).map((e) => [e.itemId, e.id]))

  const mutation = useMutation({
    mutationFn: async (itemId: string) => {
      const existing = byItemId.get(itemId)
      if (existing) await api.delete(`/wishlist/${existing}`)
      else await api.post('/wishlist', { itemType: type, itemId })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key(type) }),
  })

  return {
    has: (itemId: string) => byItemId.has(itemId),
    toggle: (itemId: string) => {
      if (!user) {
        navigate(routes.login, { state: { from: window.location.pathname } })
        return
      }
      mutation.mutate(itemId)
    },
    pending: mutation.isPending ? mutation.variables : undefined,
  }
}
