import { useSyncExternalStore, type ReactNode } from 'react'

/** On-screen popups for errors, warnings and short confirmations. */
export type ToastTone = 'error' | 'warning' | 'success' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  title?: string
  message: ReactNode
  /** 0 = stays until closed (or until its owner removes it). */
  durationMs: number
}

type Options = { title?: string; durationMs?: number }

const DEFAULT_DURATION: Record<ToastTone, number> = {
  error: 8000,
  warning: 7000,
  success: 4000,
  info: 5000,
}
const MAX_VISIBLE = 4

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit() {
  for (const l of listeners) l()
}

export function dismissToast(id: number) {
  const t = timers.get(id)
  if (t) clearTimeout(t)
  timers.delete(id)
  if (!toasts.some((x) => x.id === id)) return
  toasts = toasts.filter((x) => x.id !== id)
  emit()
}

/** Removes every popup (e.g. once a step that failed before has succeeded). */
export function clearToasts() {
  for (const t of toasts) dismissToast(t.id)
}

export function showToast(tone: ToastTone, message: ReactNode, opts: Options = {}): number {
  const id = nextId++
  const durationMs = opts.durationMs ?? DEFAULT_DURATION[tone]
  // Same text already on screen: don't stack duplicates.
  if (typeof message === 'string') {
    const dup = toasts.find((x) => x.tone === tone && x.message === message)
    if (dup) dismissToast(dup.id)
  }
  toasts = [...toasts, { id, tone, title: opts.title, message, durationMs }].slice(-MAX_VISIBLE)
  if (durationMs > 0) timers.set(id, setTimeout(() => dismissToast(id), durationMs))
  emit()
  return id
}

export const toast = {
  error: (message: ReactNode, opts?: Options) => showToast('error', message, opts),
  warning: (message: ReactNode, opts?: Options) => showToast('warning', message, opts),
  success: (message: ReactNode, opts?: Options) => showToast('success', message, opts),
  info: (message: ReactNode, opts?: Options) => showToast('info', message, opts),
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts,
  )
}
