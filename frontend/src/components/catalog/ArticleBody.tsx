import type { ReactNode } from 'react'
import type { ArticleBlock } from '@/lib/article'

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="flex flex-col gap-5 text-lg leading-[2] text-text-2">
      {blocks.map((b, i): ReactNode => {
        switch (b.kind) {
          case 'h':
            return (
              <h2 key={i} id={b.id} className="mt-4 scroll-mt-32 text-[26px] leading-snug">
                {b.text}
              </h2>
            )
          case 'quote':
            return (
              <blockquote
                key={i}
                className="m-0 rounded-tile border-s-4 border-blue-400 bg-surface-blue px-6 py-5 font-head text-xl leading-relaxed text-ink"
              >
                {b.text}
              </blockquote>
            )
          case 'list':
            return (
              <ul key={i} className="flex flex-col gap-2.5">
                {b.items.map((it, k) => (
                  <li key={k} className="flex gap-3">
                    <span className="mt-3 size-2 flex-none rounded-full bg-blue-400" />
                    {it}
                  </li>
                ))}
              </ul>
            )
          default:
            return <p key={i}>{b.text}</p>
        }
      })}
    </div>
  )
}
