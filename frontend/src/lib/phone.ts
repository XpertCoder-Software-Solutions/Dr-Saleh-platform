import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min'

export interface Country {
  iso: CountryCode
  dial: string
  nameAr: string
  nameEn: string
}

export const DEFAULT_COUNTRY: CountryCode = 'EG'
// Shown first: Egypt, then the Gulf and nearby countries most visitors come from.
const PINNED: CountryCode[] = ['EG', 'SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'IQ', 'LY', 'SD', 'MA', 'DZ', 'TN', 'PS', 'SY', 'YE', 'US', 'GB']

// Not listed anywhere on the site.
const EXCLUDED: CountryCode[] = ['IL']
// Our own names where the browser's differ.
const NAME_AR: Partial<Record<CountryCode, string>> = { PS: 'فلسطين المحتلة' }
const NAME_EN: Partial<Record<CountryCode, string>> = { PS: 'Palestine' }

let cachedCountries: Country[] | null = null

export function listCountries(): Country[] {
  if (cachedCountries) return cachedCountries
  const ar = new Intl.DisplayNames(['ar'], { type: 'region' })
  const en = new Intl.DisplayNames(['en'], { type: 'region' })
  const all = getCountries()
    .filter((iso) => !EXCLUDED.includes(iso))
    .map((iso) => ({
      iso,
      dial: getCountryCallingCode(iso),
      nameAr: NAME_AR[iso] ?? ar.of(iso) ?? iso,
      nameEn: NAME_EN[iso] ?? en.of(iso) ?? iso,
    }))
  const pinned = PINNED.map((iso) => all.find((c) => c.iso === iso)).filter((c): c is Country => !!c)
  const rest = all
    .filter((c) => !PINNED.includes(c.iso))
    .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'))
  cachedCountries = [...pinned, ...rest]
  return cachedCountries
}

/** True for a complete, valid international number (E.164, e.g. +201001234567). */
export function isValidPhone(value: string): boolean {
  return !!value && isValidPhoneNumber(value)
}

/** Splits a stored value into country + local digits. Old local numbers are taken as Egyptian. */
export function splitPhone(value: string): { iso: CountryCode; national: string } {
  const v = value.trim()
  if (!v) return { iso: DEFAULT_COUNTRY, national: '' }
  const parsed = v.startsWith('+') || v.startsWith('00')
    ? parsePhoneNumberFromString(v.replace(/^00/, '+'))
    : parsePhoneNumberFromString(v, DEFAULT_COUNTRY)
  if (parsed?.country) return { iso: parsed.country, national: parsed.nationalNumber }
  if (parsed) {
    const match = listCountries().find((c) => c.dial === parsed.countryCallingCode)
    return { iso: match?.iso ?? DEFAULT_COUNTRY, national: parsed.nationalNumber }
  }
  return { iso: DEFAULT_COUNTRY, national: v.replace(/[^\d]/g, '') }
}

/** Local digits + country → E.164 ("" when empty). */
export function joinPhone(iso: CountryCode, national: string): string {
  const digits = national.replace(/\D/g, '')
  if (!digits) return ''
  const parsed = parsePhoneNumberFromString(digits, iso)
  if (parsed) return parsed.number
  return `+${getCountryCallingCode(iso)}${digits.replace(/^0+/, '')}`
}

