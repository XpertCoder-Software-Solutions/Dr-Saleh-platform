import { useMemo, type ReactNode } from 'react'
import { Flag } from '@/components/ui/PhoneField'
import { SelectField } from '@/components/ui/Select'
import { listCountries } from '@/lib/phone'
import { tx } from '@/lib/i18n'

/**
 * Country picker with flags and search. The value is the country's Arabic name
 * (what the consultation API stores), e.g. "مصر".
 */
export function CountrySelectField({
  label,
  value,
  onChange,
  error,
  hint,
  className,
  required,
}: {
  label: string
  value: string
  onChange: (nameAr: string) => void
  error?: string | null
  hint?: ReactNode
  className?: string
  required?: boolean
}) {
  const options = useMemo(
    () =>
      listCountries().map((c) => ({
        value: c.nameAr,
        label: c.label,
        keywords: `${c.nameEn} ${c.iso}`,
        icon: <Flag iso={c.iso} />,
      })),
    [],
  )
  return (
    <SelectField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder={tx('اختار الدولة', 'Choose a country')}
      error={error}
      hint={hint}
      className={className}
      required={required}
      searchable
    />
  )
}
