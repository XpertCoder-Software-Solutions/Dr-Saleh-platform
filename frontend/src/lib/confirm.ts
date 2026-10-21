import { useSyncExternalStore } from 'react'
import type { IconName } from '@/components/ui/Icon'

/**
 * Site-styled confirmation dialog (replaces window.confirm). One at a time:
 *
 *   if (await confirmAction({ title: 'تلغي الطلب؟', confirmLabel: 'أيوه، الغيه', tone: 'danger' })) …
 */
export type ConfirmTone = 'danger' | 'warning' | 'info'

export interface ConfirmOptions {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: IconName
}

export interface PendingConfirm extends ConfirmOptions {
  id: number
  resolve: (ok: boolean) => void
}

let current: PendingConfirm | null = null
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  // A new request answers an open one with "no".
  current?.resolve(false)
  return new Promise((resolve) => {
    const id = nextId++
    current = {
      tone: 'danger',
      ...options,
      id,
      resolve: (ok) => {
        if (current?.id === id) {
          current = null
          emit()
        }
        resolve(ok)
      },
    }
    emit()
  })
}

export function usePendingConfirm(): PendingConfirm | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null,
  )
}
