import { useQuery } from '@tanstack/react-query'
import { adminCoursesApi, adminKeys } from '@/api/admin'
import { Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'

/** Pick courses from the full list (checkbox cards). */
export function CoursePicker({
  value,
  onChange,
  owned = [],
  max,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  /** Already owned: shown checked and locked. */
  owned?: string[]
  /** Most that can be picked. */
  max?: number
}) {
  const courses = useQuery({ queryKey: adminKeys.courses, queryFn: () => adminCoursesApi.list() })
  if (courses.isLoading) return <Spinner />
  return (
    <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
      {(courses.data?.courses ?? []).map((c) => {
        const has = owned.includes(c.id)
        const on = has || value.includes(c.id)
        return (
          <label
            key={c.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-sm font-semibold',
              on ? 'border-blue-400 bg-surface-blue text-ink' : 'border-line bg-white text-text-2',
              has && 'cursor-default opacity-60',
            )}
          >
            <input
              type="checkbox"
              className="size-4.5 accent-blue-600"
              checked={on}
              disabled={has || (!on && max !== undefined && value.length >= max)}
              onChange={(e) =>
                onChange(e.target.checked ? [...value, c.id] : value.filter((x) => x !== c.id))
              }
            />
            <span className="flex-1">{c.titleAr}</span>
            {has && <span className="text-xs text-muted">عنده</span>}
          </label>
        )
      })}
    </div>
  )
}
