import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addressesApi, type Address } from '@/api/shop'
import { useAuth } from '@/auth/hooks'
import { buttonClass } from '@/components/ui/button'
import { SelectField, TextField } from '@/components/ui/fields'
import { Alert, Spinner } from '@/components/ui/States'
import { formatEGP } from '@/lib/format'
import { PhoneField } from '@/components/ui/PhoneField'
import { isValidPhone } from '@/lib/phone'
import { warnFormErrors } from '@/lib/formErrors'

/** New shipping address. Shipping cost comes from the chosen governorate. */
export function AddressForm({ onSaved, onCancel }: { onSaved: (a: Address) => void; onCancel?: () => void }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const govs = useQuery({
    queryKey: ['governorates'],
    queryFn: addressesApi.governorates,
    staleTime: 30 * 60_000,
  })
  const [f, setF] = useState({
    fullName: user?.fullName ?? '',
    phoneNumber: '',
    governorateId: '',
    city: '',
    street: '',
    buildingNumber: '',
    floor: '',
    apartment: '',
    landmark: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }))

  const save = useMutation({
    mutationFn: () =>
      addressesApi.create({
        fullName: f.fullName.trim(),
        phoneNumber: f.phoneNumber.trim(),
        governorateId: f.governorateId,
        city: f.city.trim(),
        street: f.street.trim(),
        buildingNumber: f.buildingNumber.trim(),
        floor: f.floor.trim() || undefined,
        apartment: f.apartment.trim() || undefined,
        landmark: f.landmark.trim() || undefined,
      }),
    onSuccess: ({ address }) => {
      queryClient.invalidateQueries({ queryKey: ['me', 'addresses'] })
      onSaved(address)
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    const er: Record<string, string> = {}
    if (f.fullName.trim().length < 3) er.fullName = 'اكتب اسم المستلم.'
    if (!isValidPhone(f.phoneNumber)) er.phoneNumber = 'اكتب رقم موبايل صحيح للدولة اللي اخترتها.'
    if (!f.governorateId) er.governorateId = 'اختار المحافظة.'
    if (!f.city.trim()) er.city = 'اكتب المدينة أو المنطقة.'
    if (!f.street.trim()) er.street = 'اكتب الشارع.'
    if (!f.buildingNumber.trim()) er.buildingNumber = 'اكتب رقم العمارة.'
    setErrors(er)
    warnFormErrors(er)
    if (!Object.keys(er).length) save.mutate()
  }

  const options = (govs.data?.governorates ?? [])
    .filter((g) => g.isActive !== false)
    .map((g) => ({ value: g.id, label: `${g.nameAr} · شحن ${formatEGP(g.shippingCost)}` }))

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-tile border border-line bg-surface p-5"
      noValidate
    >
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <TextField
          label="اسم المستلم"
          autoComplete="name"
          value={f.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
        />
        <PhoneField
          label="رقم الموبايل"
          value={f.phoneNumber}
          onChange={(v) => set('phoneNumber')({ target: { value: v } })}
          error={errors.phoneNumber}
        />
        <SelectField
          label="المحافظة"
          placeholder="اختار المحافظة"
          value={f.governorateId}
          onChange={set('governorateId')}
          options={options}
          error={errors.governorateId}
        />
        <TextField label="المدينة / المنطقة" value={f.city} onChange={set('city')} error={errors.city} />
        <TextField
          label="الشارع"
          autoComplete="street-address"
          value={f.street}
          onChange={set('street')}
          error={errors.street}
        />
        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="العمارة"
            value={f.buildingNumber}
            onChange={set('buildingNumber')}
            error={errors.buildingNumber}
          />
          <TextField label="الدور" value={f.floor} onChange={set('floor')} />
          <TextField label="الشقة" value={f.apartment} onChange={set('apartment')} />
        </div>
      </div>
      <TextField
        label="علامة مميزة (اختياري)"
        placeholder="مثال: جنب الصيدلية"
        value={f.landmark}
        onChange={set('landmark')}
      />
      {save.isError && <Alert tone="error">{(save.error as Error).message}</Alert>}
      <div className="flex gap-2.5">
        <button type="submit" className={buttonClass({ variant: 'navy' })} disabled={save.isPending}>
          {save.isPending ? <Spinner /> : 'احفظ العنوان'}
        </button>
        {onCancel && (
          <button type="button" className={buttonClass({ variant: 'ghost' })} onClick={onCancel}>
            إلغاء
          </button>
        )}
      </div>
    </form>
  )
}
