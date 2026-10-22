import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { tx } from '@/lib/i18n'

export interface SelectOption {
  value: string
  label: string
  /** Shown before the label, e.g. a country flag. */
  icon?: ReactNode
  /** Extra text matched by the search box (e.g. the English name). */
  keywords?: string
}

interface SelectFieldProps {
  label: string
  value: string
  /** Same shape as a native select's change event, so existing handlers keep working. */
  onChange?: (e: { target: { value: string; name?: string } }) => void
  options: SelectOption[]
  placeholder?: string
  error?: string | null
  hint?: ReactNode
  disabled?: boolean
  required?: boolean
  name?: string
  className?: string
  /** Search box in the list; on by default for long lists. */
  searchable?: boolean
}

/** The site's dropdown: same look as the text inputs, an on-brand list, keyboard and search. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  hint,
  disabled,
  required,
  name,
  className,
  searchable,
}: SelectFieldProps) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const withSearch = searchable ?? options.length > 12

  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.keywords ?? '').toLowerCase().includes(q),
    )
  }, [options, query])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    if (withSearch) searchRef.current?.focus()
    else listRef.current?.focus()
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, withSearch])

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function openList() {
    if (disabled) return
    const i = options.findIndex((o) => o.value === value)
    setQuery('')
    setActive(Math.max(0, i))
    setOpen(true)
  }

  function pick(o: SelectOption) {
    onChange?.({ target: { value: o.value, name } })
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onListKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(filtered.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(filtered.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[active]) pick(filtered[active])
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
      if (e.key === 'Escape') buttonRef.current?.focus()
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} ref={rootRef}>
      <label htmlFor={id} className="text-[15px] font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <button
          ref={buttonRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
              e.preventDefault()
              openList()
            }
          }}
          className={cn(
            'flex min-h-13 w-full items-center gap-2.5 rounded-field border-[1.5px] border-line-2 bg-white px-4 py-3 text-start text-base text-text transition-[border-color,box-shadow]',
            'focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(61,155,216,.15)] focus:outline-none disabled:opacity-60',
            open && 'border-blue-400 shadow-[0_0_0_4px_rgba(61,155,216,.15)]',
            error && 'border-danger',
          )}
        >
          {selected?.icon}
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-muted')}>
            {selected?.label ?? placeholder ?? tx('اختار', 'Choose')}
          </span>
          <Icon
            name="chevDown"
            size={16}
            className={cn('flex-none text-muted transition-transform', open && 'rotate-180')}
          />
        </button>
        {name && <input type="hidden" name={name} value={value} />}

        {open && (
          <div className="absolute inset-x-0 top-full z-40 mt-2 animate-dd-in overflow-hidden rounded-card border border-line bg-white shadow-pop">
            {withSearch && (
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
                  placeholder={tx('ابحث…', 'Search…')}
                  aria-controls={listId}
                  aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
                  className="h-11 w-full rounded-xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] outline-none focus:border-blue-400"
                />
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              tabIndex={-1}
              onKeyDown={withSearch ? undefined : onListKey}
              aria-activedescendant={!withSearch && filtered[active] ? `${listId}-${active}` : undefined}
              className="max-h-72 overflow-y-auto py-1.5 outline-none"
            >
              {placeholder && !required && !query && (
                <li
                  role="option"
                  aria-selected={value === ''}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick({ value: '', label: placeholder })}
                  className="cursor-pointer px-4 py-2.5 text-[15px] text-muted hover:bg-hover"
                >
                  {placeholder}
                </li>
              )}
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">{tx('مفيش نتايج.', 'No results.')}</li>
              )}
              {filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[15px] text-text-2',
                    i === active && 'bg-hover',
                    o.value === value && 'font-semibold text-ink',
                  )}
                >
                  {o.icon}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.value === value && <Icon name="check" size={15} className="flex-none text-blue-600" />}
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
