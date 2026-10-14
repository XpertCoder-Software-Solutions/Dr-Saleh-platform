/**
 * Article content is plain text written in the admin. A few light markers are
 * understood: "## " heading, "> " quote, "- " list item. Everything is rendered
 * as text (no HTML), so admin content can't inject markup.
 */
export interface ArticleHeading {
  id: string
  text: string
}

export type ArticleBlock =
  | { kind: 'h'; id: string; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'p'; text: string }

export function parseArticle(content: string): { blocks: ArticleBlock[]; headings: ArticleHeading[] } {
  const blocks: ArticleBlock[] = []
  const headings: ArticleHeading[] = []
  for (const raw of content.split(/\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('## ')) {
      const id = `s${headings.length + 1}`
      const text = line.slice(3).trim()
      headings.push({ id, text })
      blocks.push({ kind: 'h', id, text })
    } else if (line.startsWith('> ')) {
      blocks.push({ kind: 'quote', text: line.slice(2).trim() })
    } else if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1]
      if (last?.kind === 'list') last.items.push(line.slice(2).trim())
      else blocks.push({ kind: 'list', items: [line.slice(2).trim()] })
    } else {
      blocks.push({ kind: 'p', text: line })
    }
  }
  return { blocks, headings }
}
