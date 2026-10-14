import { useEffect, useState } from 'react'
import { resolveAssetUrl } from '@/api/client'
import { Icon } from '@/components/ui/Icon'

/** Image picker with a preview of the current or newly chosen picture. */
export function CoverInput({
  label = 'الصورة',
  current,
  file,
  onChange,
  required,
  error,
}: {
  label?: string
  current?: string | null
  file: File | null
  onChange: (f: File | null) => void
  required?: boolean
  error?: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    // The object URL only exists once the file is picked.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const src = file ? preview : resolveAssetUrl(current)

  return (
    <label className="flex cursor-pointer flex-col gap-2">
      <span className="text-[15px] font-semibold text-ink">
        {label}
        {required && ' *'}
      </span>
      <span className="relative flex h-40 items-center justify-center overflow-hidden rounded-tile border-[1.5px] border-dashed border-line-2 bg-surface text-muted hover:border-blue-300">
        {src ? (
          <img src={src} alt="" className="size-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm">
            <Icon name="plus" size={20} /> اختار صورة (jpg, png, webp)
          </span>
        )}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </label>
  )
}
