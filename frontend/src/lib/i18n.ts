/**
 * Site language: Arabic (default, RTL) or English (LTR).
 *
 * The choice is read once when the page loads (from `?lang=en|ar`, then the visitor's saved
 * choice), so any module can call tx() — even in constants. Switching language saves the
 * choice and reloads the page. The admin dashboard always stays Arabic.
 */
export type Lang = 'ar' | 'en'

const KEY = 'drs.lang'

function detect(): Lang {
  if (typeof window === 'undefined') return 'ar'
  if (window.location.pathname.startsWith('/admin')) return 'ar'
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl === 'en' || fromUrl === 'ar') {
    try {
      localStorage.setItem(KEY, fromUrl)
    } catch {
      /* storage blocked */
    }
    return fromUrl
  }
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

export const lang: Lang = detect()
export const isEn = lang === 'en'
export const dir: 'rtl' | 'ltr' = isEn ? 'ltr' : 'rtl'
/** Locale for Intl (dates, numbers): Western digits in both languages. */
export const locale = isEn ? 'en-US' : 'ar-EG'

if (typeof document !== 'undefined') {
  document.documentElement.lang = lang
  document.documentElement.dir = dir
}

/** Interface text: tx('الدورات', 'Courses'). */
export function tx(ar: string, en: string): string {
  return isEn ? en : ar
}

/** Content with Arabic and English versions (titles, descriptions); English falls back to Arabic. */
export function loc(ar: string | null | undefined, en: string | null | undefined): string {
  if (isEn) return (en && en.trim()) || ar || ''
  return ar || en || ''
}

export function setLang(next: Lang) {
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* storage blocked: the URL parameter below still switches this page */
  }
  const url = new URL(window.location.href)
  url.searchParams.delete('lang')
  if (next === 'en') url.searchParams.set('lang', 'en')
  else url.searchParams.set('lang', 'ar')
  window.location.assign(url.toString())
}
