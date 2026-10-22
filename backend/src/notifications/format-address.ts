/** One-line Arabic shipping address for emails ("شارع ..، عمارة 5، الدور 3، المعادي، القاهرة"). */
export function formatAddressAr(
  address:
    | {
        fullName?: string | null;
        phoneNumber?: string | null;
        street?: string | null;
        buildingNumber?: string | null;
        floor?: string | null;
        apartment?: string | null;
        city?: string | null;
        governorate?: { nameAr: string } | null;
      }
    | null
    | undefined,
): string | null {
  if (!address) return null;
  const parts = [
    address.street,
    address.buildingNumber && `عمارة ${address.buildingNumber}`,
    address.floor && `الدور ${address.floor}`,
    address.apartment && `شقة ${address.apartment}`,
    address.city,
    address.governorate?.nameAr,
  ].filter((part): part is string => Boolean(part && part.trim()));
  const line = parts.join('، ');
  const who = [address.fullName, address.phoneNumber]
    .filter(Boolean)
    .join(' — ');
  return [line, who].filter(Boolean).join(' · ') || null;
}
