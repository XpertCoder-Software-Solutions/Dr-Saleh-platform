import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Icon } from '@/components/ui/Icon'
import { inputClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { PASSWORD_RULES } from '@/lib/password'
import { tx } from '@/lib/i18n'

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
        className={cn(inputClass, ltr && '[direction:ltr] rtl:text-right', className)}
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
          className={cn(inputClass, '[direction:ltr] ltr:pr-12 rtl:pl-12 rtl:text-right')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          {...input}
        />
        <button
          type="button"
          className="absolute end-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-[10px] border-0 bg-transparent text-muted hover:bg-hover"
          aria-label={
            show ? tx('إخفاء كلمة المرور', 'Hide password') : tx('إظهار كلمة المرور', 'Show password')
          }
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
    <div
      className="flex justify-center gap-2.5 [direction:ltr]"
      role="group"
      aria-label={tx('كود التفعيل', 'Verification code')}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          data-otp={i}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={tx(`الرقم ${i + 1}`, `Digit ${i + 1}`)}
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
      <span className="relative mt-0.5 flex size-5.5 flex-none">
        <input
          type="checkbox"
          className="peer size-full cursor-pointer appearance-none rounded-md border-[1.5px] border-line-2 bg-white transition-colors checked:bg-navy checked:border-navy focus-visible:shadow-[0_0_0_4px_rgba(61,155,216,.25)] focus-visible:outline-none"
          {...rest}
        />
        <Icon
          name="check"
          size={14}
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span>{label}</span>
    </label>
  )
}

/** Live checklist under a new-password field. */
export function PasswordRules({ password }: { password: string }) {
  return (
    <ul
      className="-mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] max-[420px]:grid-cols-1"
      aria-label={tx('شروط كلمة المرور', 'Password requirements')}
    >
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password)
        return (
          <li key={r.id} className={cn('flex items-center gap-1.5', ok ? 'text-green-700' : 'text-muted')}>
            <span
              className={cn(
                'flex size-4.5 flex-none items-center justify-center rounded-full',
                ok ? 'bg-green-100' : 'bg-surface',
              )}
              aria-hidden="true"
            >
              {ok ? <Icon name="check" size={11} /> : <span className="size-1.5 rounded-full bg-line-2" />}
            </span>
            {r.label}
            <span className="sr-only">{ok ? tx(' (متحقق)', ' (met)') : tx(' (ناقص)', ' (missing)')}</span>
          </li>
        )
      })}
    </ul>
  )
}

export { SelectField, type SelectOption } from './Select'
