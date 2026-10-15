import { toast } from '@/lib/toast'

/**
 * Pops up the problems found when a form is submitted (fields still show their own message).
 * Returns true when there is something to fix.
 */
export function warnFormErrors(errors: Record<string, string | null | undefined>): boolean {
  const problems = [...new Set(Object.values(errors).filter((v): v is string => !!v))]
  if (!problems.length) return false
  toast.warning(
    problems.length === 1 ? (
      problems[0]
    ) : (
      <ul className="list-disc ps-5">
        {problems.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    ),
    { title: 'راجع البيانات دي' },
  )
  return true
}
