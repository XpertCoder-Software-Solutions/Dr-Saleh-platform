import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon } from '@/components/ui/Icon'
import { inputClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: ReactNode
  labelAside?: ReactNode
  /** Left-to-right value (email, phone, password) shown right-aligned. */
  ltr?: boolean
}

function FieldFrame({
  id,
  label,
  labelAside,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  labelAside?: ReactNode
  error?: string | null
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[15px] font-semibold text-ink">
          {label}
        </label>
        {labelAside && <span className="text-sm font-semibold">{labelAside}</span>}
      </div>
      {children}
      {error ? (
        <span id={`${id}-err`} className="text-sm text-danger">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="text-[13px] text-muted">
            {hint}
          </span>
        )
      )}
    </div>
  )
}

export function TextField({ label, error, hint, labelAside, ltr, className, ...input }: FieldProps) {
  const id = useId()
  return (
    <FieldFrame id={id} label={label} labelAside={labelAside} error={error} hint={hint}>
      <input
        id={id}
        className={cn(inputClass, ltr && 'text-right [direction:ltr]', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...input}
      />
    </FieldFrame>
  )
}

export function PasswordField({
  label,
  error,
  hint,
  labelAside,
  ...input
}: Omit<FieldProps, 'type' | 'ltr'>) {
  const [show, setShow] = useState(false)
  const id = useId()
  return (
    <FieldFrame id={id} label={label} labelAside={labelAside} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={cn(inputClass, 'pl-12 text-right [direction:ltr]')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          {...input}
        />
        <button
          type="button"
          className="absolute top-1/2 left-1.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-[10px] border-0 bg-transparent text-muted hover:bg-hover"
          aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          aria-pressed={show}
          onClick={() => setShow((s) => !s)}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
    </FieldFrame>
  )
}

/** Six single-digit boxes that behave like one input (paste, backspace, arrows). */
export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string
  onChange: (v: string) => void
  length?: number
}) {
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function focusAt(i: number) {
    const el = document.querySelector<HTMLInputElement>(`[data-otp="${i}"]`)
    el?.focus()
    el?.select()
  }

  return (
    <div className="flex justify-center gap-2.5 [direction:ltr]" role="group" aria-label="كود التفعيل">
      {digits.map((d, i) => (
        <input
          key={i}
          data-otp={i}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`الرقم ${i + 1}`}
          maxLength={length}
          value={d}
          className="h-16 w-14 rounded-field border-[1.5px] border-line-2 bg-white text-center font-head text-[26px] font-bold text-ink focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(61,155,216,.15)] focus:outline-none max-[480px]:h-14 max-[480px]:w-11 max-[480px]:text-[22px]"
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, '')
            if (!typed) return
            const next = (value.slice(0, i) + typed + value.slice(i + typed.length)).slice(0, length)
            onChange(next)
            focusAt(Math.min(length - 1, i + typed.length))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              const chars = value.split('')
              if (chars[i]) {
                chars[i] = ''
                onChange(chars.join('').slice(0, length))
              } else if (i > 0) {
                chars[i - 1] = ''
                onChange(chars.join(''))
                focusAt(i - 1)
              }
            } else if (e.key === 'ArrowLeft') focusAt(Math.min(length - 1, i + 1))
            else if (e.key === 'ArrowRight') focusAt(Math.max(0, i - 1))
          }}
          onPaste={(e) => {
            e.preventDefault()
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
            if (pasted) {
              onChange(pasted)
              focusAt(Math.min(length - 1, pasted.length))
            }
          }}
        />
      ))}
    </div>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string | null
  hint?: ReactNode
  labelAside?: ReactNode
}

export function TextAreaField({ label, error, hint, labelAside, className, ...rest }: TextAreaProps) {
  const id = useId()
  return (
    <FieldFrame id={id} label={label} labelAside={labelAside} error={error} hint={hint}>
      <textarea
        id={id}
        rows={4}
        className={cn(inputClass, 'min-h-28 resize-y', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </FieldFrame>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string | null
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ label, error, options, placeholder, className, ...rest }: SelectProps) {
  const id = useId()
  return (
    <FieldFrame id={id} label={label} error={error}>
      <select
        id={id}
        className={cn(inputClass, 'appearance-auto', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  )
}

/** A set of pill buttons acting as one radio group (e.g. consultation type). */
export function ChoiceChips<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
  hint,
}: {
  label: string
  value: T | ''
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  error?: string | null
  hint?: ReactNode
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby={id}>
      <span id={id} className="text-[15px] font-semibold text-ink">
        {label}
      </span>
      {hint && <span className="-mt-1.5 text-[13px] text-muted">{hint}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className="min-h-11 rounded-xl border-[1.5px] border-line-2 bg-white px-4 text-[15px] font-semibold text-text-2 transition-colors hover:border-blue-300 aria-checked:bg-navy aria-checked:border-transparent aria-checked:text-white"
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  )
}

/** Checkbox with a label to its side. */
export function CheckField({
  label,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[15px] text-text-2">
      <input type="checkbox" className="mt-0.5 size-5 flex-none accent-blue-600" {...rest} />
      <span>{label}</span>
    </label>
  )
}
