import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { fileSize } from '@/lib/fileSize'

/**
 * Admin file picker: a drop zone that shows the chosen file (name, size) with a remove
 * button, and an upload progress bar while it uploads.
 */
export function FileDrop({
  label,
  hint,
  accept,
  icon = 'download',
  file,
  onFile,
  current,
  onRemoveCurrent,
  progress,
  disabled,
  error,
}: {
  label: string
  /** Allowed types / size, e.g. "MP4 · WebM · MOV — لحد 2 جيجا". */
  hint?: string
  accept: string
  icon?: IconName
  /** File picked but not uploaded yet. */
  file?: File | null
  onFile: (file: File | null) => void
  /** What's already saved (e.g. "فيديو مرفوع"), shown when no new file is picked. */
  current?: ReactNode
  onRemoveCurrent?: () => void
  /** 0–100 while uploading. */
  progress?: number | null
  disabled?: boolean
  error?: string | null
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const uploading = progress !== null && progress !== undefined
  const types = accept.split(',').map((t) => t.trim())

  function accepts(f: File) {
    return types.some((t) => (t.endsWith('/*') ? f.type.startsWith(t.slice(0, -1)) : f.type === t))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    if (disabled || uploading) return
    const f = e.dataTransfer.files?.[0]
    if (f && accepts(f)) onFile(f)
  }

  const shown = file ? (
    <>
      <b className="truncate text-sm text-ink" dir="auto">
        {file.name}
      </b>
      <span className="text-xs text-muted">{fileSize(file.size)}</span>
    </>
  ) : (
    current
  )

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-[15px] font-semibold text-ink">
        {label}
      </span>
      {shown ? (
        <div
          className={cn(
            'relative flex items-center gap-3 overflow-hidden rounded-field border-[1.5px] border-line-2 bg-white p-3',
            error && 'border-danger',
          )}
        >
          <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
            <Icon name={icon} size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">{shown}</span>
          {uploading ? (
            <span className="text-sm font-bold text-blue-600 tabular-nums">{progress}%</span>
          ) : (
            <span className="flex flex-none items-center gap-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => input.current?.click()}
                className="rounded-lg border-0 bg-transparent px-2.5 py-2 text-sm font-bold text-blue-600 hover:bg-hover"
              >
                تغيير
              </button>
              {(file || onRemoveCurrent) && (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label="شيل الملف"
                  onClick={() => (file ? onFile(null) : onRemoveCurrent?.())}
                  className="flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:bg-red-50 hover:text-danger"
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
            </span>
          )}
          {uploading && (
            <span
              className="absolute inset-x-0 bottom-0 h-1 bg-blue-100"
              role="progressbar"
              aria-valuenow={progress ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby={`${id}-label`}
            >
              <span
                className="block h-full bg-linear-90 from-navy to-blue-500 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'flex min-h-28 w-full flex-col items-center justify-center gap-1.5 rounded-field border-2 border-dashed border-line-2 bg-surface px-4 py-5 text-center transition-colors',
            'hover:border-blue-300 hover:bg-surface-blue focus-visible:border-blue-400 focus-visible:outline-none disabled:opacity-60',
            over && 'border-blue-400 bg-surface-blue',
            error && 'border-danger',
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
            <Icon name={icon} size={20} />
          </span>
          <span className="text-sm font-bold text-ink">
            اسحب الملف هنا أو <span className="text-blue-600 underline">اختار من جهازك</span>
          </span>
          {hint && (
            <span id={`${id}-hint`} className="text-xs text-muted">
              {hint}
            </span>
          )}
        </button>
      )}
      {error && <span className="text-sm text-danger">{error}</span>}
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        aria-labelledby={`${id}-label`}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          e.target.value = ''
          if (f) onFile(f)
        }}
      />
    </div>
  )
}

/** Thin progress bar for uploads shown elsewhere (e.g. a lesson row). */
export function UploadBar({ pct, label }: { pct: number; label: string }) {
  return (
    <span className="flex min-w-48 flex-1 flex-col gap-1">
      <span className="flex justify-between text-xs font-bold text-blue-600">
        <span>{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </span>
      <span
        className="h-1.5 overflow-hidden rounded-full bg-blue-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span
          className="block h-full rounded-full bg-linear-90 from-navy to-blue-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  )
}
