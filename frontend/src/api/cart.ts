import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { api, ApiClientError } from './client'

export type CartItemType = 'COURSE' | 'BOOK' | 'PRODUCT'

export interface AddToCartInput {
  itemType: CartItemType
  /** Course id, book *format* id, or product id. */
  itemId: string
  quantity?: number
}

/**
 * Adds an item to the cart. Guests are sent to login and come back to the page.
 * "Already in cart" (409) counts as success.
 */
export function useAddToCart() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (input: AddToCartInput) => {
      try {
        await api.post('/cart/items', { quantity: 1, ...input })
      } catch (e) {
        if (e instanceof ApiClientError && e.statusCode === 409 && /already exists in cart/i.test(e.message))
          return
        throw e
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'cart-summary'] })
      queryClient.invalidateQueries({ queryKey: ['me', 'cart'] })
    },
  })

  return {
    ...mutation,
    /** Returns false when the user had to log in first. */
    add: async (input: AddToCartInput) => {
      if (!user) {
        navigate(routes.login, { state: { from: window.location.pathname } })
        return false
      }
      await mutation.mutateAsync(input)
      return true
    },
  }
}
