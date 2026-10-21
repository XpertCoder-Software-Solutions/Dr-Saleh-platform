import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'

/**
 * Row switch in admin tables: shows or hides an item on the site right away.
 * The list refreshes after the change; the switch moves immediately.
 */
export function VisibilitySwitch({
  visible,
  name,
  save,
  invalidate,
  labels = ['ظاهر', 'مخفي'],
}: {
  visible: boolean
  /** For the accessible label, e.g. the item's title. */
  name: string
  save: (visible: boolean) => Promise<unknown>
  /** Query keys to refresh afterwards. */
  invalidate: QueryKey[]
  labels?: [string, string]
}) {
  const queryClient = useQueryClient()
  const toggle = useMutation({
    mutationFn: (next: boolean) => save(next),
    onSuccess: (_r, next) => {
      invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      toast.success(next ? `«${name}» ظاهر على الموقع.` : `«${name}» اتخفى من الموقع.`)
    },
  })
  const on = toggle.isPending ? Boolean(toggle.variables) : visible
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`ظهور «${name}» على الموقع`}
      title={on ? 'دوس عشان تخفيه من الموقع' : 'دوس عشان تظهره على الموقع'}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate(!visible)}
      className="group inline-flex min-h-9 items-center gap-2 rounded-full border-0 bg-transparent px-1 text-xs font-bold disabled:opacity-70"
    >
      <span
        className={cn(
          'relative h-6 w-10.5 flex-none rounded-full transition-colors',
          on ? 'bg-success' : 'bg-line-2',
          'group-focus-visible:shadow-[0_0_0_4px_rgba(61,155,216,.25)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-[inset-inline-start] duration-200',
            on ? 'start-[calc(100%-22px)]' : 'start-0.5',
          )}
        />
      </span>
      <span className={cn('w-9 text-start', on ? 'text-success' : 'text-muted')}>
        {on ? labels[0] : labels[1]}
      </span>
    </button>
  )
}
