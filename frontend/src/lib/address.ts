import type { Address } from '@/api/shop'
import { loc, tx } from '@/lib/i18n'

export function formatAddress(a: Address) {
  return [
    a.street,
    a.buildingNumber && tx(`عمارة ${a.buildingNumber}`, `Building ${a.buildingNumber}`),
    a.floor && tx(`الدور ${a.floor}`, `Floor ${a.floor}`),
    a.city,
    a.governorate ? loc(a.governorate.nameAr, a.governorate.nameEn) : null,
  ]
    .filter(Boolean)
    .join(tx('، ', ', '))
}
