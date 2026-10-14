/** Number input value → number, or undefined when empty. */
export const numOrUndef = (v: string) => (v.trim() === '' ? undefined : Number(v))

/** Number → input value ('' for null/undefined). */
export const numToField = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v))

/** URL-safe slug from English text. */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
