import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { CountryCode } from 'libphonenumber-js/min'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { joinPhone, listCountries, splitPhone, type Country } from '@/lib/phone'
import { tx } from '@/lib/i18n'

function flagUrl(iso: string) {
  return `/flags/${iso}.svg`
}

/** Country flag from /public/flags. */
export function Flag({ iso, className }: { iso: string; className?: string }) {
  return (
    <img
      src={flagUrl(iso)}
      alt=""
      width={24}
      height={16}
      loading="lazy"
      className={cn(
        'h-4 w-6 flex-none rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,.08)]',
        className,
      )}
    />
  )
}

interface PhoneFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: ReactNode
  required?: boolean
  disabled?: boolean
  autoComplete?: string
  name?: string
}

/**
 * Phone number with a country picker (flag, dialling code, short country name).
 * The value is always international (E.164), e.g. +201001234567.
 */
export function PhoneField({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  autoComplete = 'tel-national',
  name,
}: PhoneFieldProps) {
  const id = useId()
  const listId = `${id}-list`
  const countries = useMemo(() => listCountries(), [])
  const [{ iso, national }, setParts] = useState(() => splitPhone(value))
  const lastEmitted = useRef(value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Value replaced from outside (profile loaded, form reset): re-split it.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value
      setParts(splitPhone(value))
    }
  }, [value])

  function emit(nextIso: CountryCode, nextNational: string) {
    setParts({ iso: nextIso, national: nextNational })
    const next = joinPhone(nextIso, nextNational)
    lastEmitted.current = next
    onChange(next)
  }

  const current = countries.find((c) => c.iso === iso) ?? countries[0]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '')
    if (!q) return countries
    return countries.filter(
      (c) =>
        c.nameAr.includes(query.trim()) ||
        c.label.toLowerCase().includes(query.trim().toLowerCase()) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.iso.toLowerCase() === q ||
        c.dial.startsWith(q),
    )
  }, [countries, query])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    searchRef.current?.focus()
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function pick(c: Country) {
    emit(c.iso, national)
    setOpen(false)
    setQuery('')
    document.getElementById(id)?.focus()
  }

  function onListKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(filtered.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[active]) pick(filtered[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      <label htmlFor={id} className="text-[15px] font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <div
          className={cn(
            'flex min-h-13 items-stretch overflow-hidden rounded-field border-[1.5px] border-line-2 bg-white transition-colors [direction:ltr] focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(61,155,216,.15)]',
            error && 'border-danger',
            disabled && 'opacity-60',
          )}
        >
          <button
            type="button"
            disabled={disabled}
            className="flex flex-none items-center gap-1.5 border-0 border-r-[1.5px] border-line-2 bg-surface px-3 text-[15px] font-semibold text-ink hover:bg-hover"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={tx(
              `مفتاح الدولة: ${current.label} +${current.dial}`,
              `Country code: ${current.label} +${current.dial}`,
            )}
            onClick={() => {
              setActive(0)
              setOpen((o) => !o)
            }}
          >
            <Flag iso={current.iso} />
            <span className="text-[13px] text-muted">{current.iso}</span>
            <span>+{current.dial}</span>
            <Icon name="chevDown" size={14} className="text-muted" />
          </button>
          <input
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete={autoComplete}
            required={required}
            disabled={disabled}
            placeholder={iso === 'EG' ? '10 1234 5678' : tx('رقم الموبايل', 'Mobile number')}
            value={national}
            onChange={(e) => {
              const raw = e.target.value
              // Pasting a full international number switches the country too.
              if (/^\s*(\+|00)/.test(raw)) {
                const parts = splitPhone(raw)
                emit(parts.iso, parts.national)
                return
              }
              emit(iso, raw.replace(/[^\d\s-]/g, ''))
            }}
            className="min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[16px] text-ink outline-none placeholder:text-muted/70"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          />
        </div>

        {open && (
          <div className="absolute inset-x-0 top-full z-40 mt-2 animate-dd-in overflow-hidden rounded-card border border-line bg-white shadow-pop">
            <div className="border-b border-line p-2.5">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onListKey}
                placeholder={tx('ابحث باسم الدولة أو المفتاح…', 'Search by country or code…')}
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${listId}-${filtered[active].iso}` : undefined}
                className="h-11 w-full rounded-xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] outline-none focus:border-blue-400"
              />
            </div>
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={tx('الدول', 'Countries')}
              className="max-h-72 overflow-y-auto py-1.5"
            >
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">
                  {tx('مفيش دولة بالاسم ده.', 'No country with that name.')}
                </li>
              )}
              {filtered.map((c, i) => (
                <li
                  key={c.iso}
                  id={`${listId}-${c.iso}`}
                  data-index={i}
                  role="option"
                  aria-selected={c.iso === iso}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[15px]',
                    i === active && 'bg-hover',
                    c.iso === iso && 'font-semibold text-ink',
                  )}
                >
                  <Flag iso={c.iso} />
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  <span className="text-[13px] text-muted">{c.iso}</span>
                  <span className="w-16 text-left text-text-2 [direction:ltr]">+{c.dial}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
