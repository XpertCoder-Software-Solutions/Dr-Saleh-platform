import type { Address } from '@/api/shop'

export function formatAddress(a: Address) {
  return [
    a.street,
    a.buildingNumber && `عمارة ${a.buildingNumber}`,
    a.floor && `الدور ${a.floor}`,
    a.city,
    a.governorate?.nameAr,
  ]
    .filter(Boolean)
    .join('، ')
}
