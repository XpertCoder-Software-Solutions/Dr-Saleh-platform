/**
 * Filters and paging only change the URL's query, so the page must stay where it is
 * (React Router's ScrollRestoration would otherwise jump to the top on every change).
 */
export const keepScroll = { preventScrollReset: true } as const

/** After changing page: bring the top of the results into view, only if it scrolled out above. */
export function scrollToResults(id = 'results') {
  const el = document.getElementById(id)
  if (!el || el.getBoundingClientRect().top >= 0) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
