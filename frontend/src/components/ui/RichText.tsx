import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { toSafeHtml } from '@/lib/richText'
import { richTextClass } from '@/components/ui/richTextClass'

export function RichText({
  value,
  html,
  className,
}: {
  value?: string | null
  html?: string
  className?: string
}) {
  const safe = useMemo(() => html ?? toSafeHtml(value), [html, value])
  if (!safe) return null
  return <div className={cn(richTextClass, className)} dangerouslySetInnerHTML={{ __html: safe }} />
}
