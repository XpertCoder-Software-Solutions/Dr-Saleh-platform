/** Reads a `min` / `max` price from the URL; anything that isn't a non-negative number is ignored. */
export function priceParam(v: string | null): number | undefined {
  if (v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}
