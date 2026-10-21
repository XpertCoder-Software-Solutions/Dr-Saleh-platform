import DOMPurify from 'dompurify'

/**
 * Rich text written in the admin editor is stored as a small subset of HTML. Older content is
 * plain text with light markers ("## " heading, "> " quote, "- " list item), which is
 * converted on the fly, so both render the same way.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
]
const ALLOWED_ATTR = ['href', 'target', 'rel']

const HTML_RE = /<\/?(p|h[1-6]|ul|ol|li|strong|b|em|i|u|s|blockquote|br|hr|a)\b[^>]*>/i

export function isRichHtml(value: string | null | undefined): boolean {
  return Boolean(value && HTML_RE.test(value))
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Plain text with "## / > / -" markers → HTML. */
export function legacyToHtml(text: string): string {
  const out: string[] = []
  let list: string[] | null = null
  const flush = () => {
    if (list) out.push(`<ul>${list.map((li) => `<li>${li}</li>`).join('')}</ul>`)
    list = null
  }
  for (const raw of text.split(/\n/)) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    if (line.startsWith('- ')) {
      ;(list ??= []).push(escapeHtml(line.slice(2).trim()))
      continue
    }
    flush()
    if (line.startsWith('## ')) out.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`)
    else if (line.startsWith('> '))
      out.push(`<blockquote><p>${escapeHtml(line.slice(2).trim())}</p></blockquote>`)
    else out.push(`<p>${escapeHtml(line)}</p>`)
  }
  flush()
  return out.join('')
}

/** Safe HTML for rendering, whatever the stored format. */
export function toSafeHtml(value: string | null | undefined): string {
  if (!value) return ''
  const html = isRichHtml(value) ? value : legacyToHtml(value)
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
  // Links open in a new tab and never pass the opener along.
  return clean.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
}

/** Text only (cards, meta descriptions, search). */
export function richToPlain(value: string | null | undefined): string {
  if (!value) return ''
  if (!isRichHtml(value)) return value.replace(/^(## |> |- )/gm, '').trim()
  const doc = new DOMParser().parseFromString(
    DOMPurify.sanitize(value, { ALLOWED_TAGS, ALLOWED_ATTR }),
    'text/html',
  )
  doc.querySelectorAll('p, h2, h3, li, blockquote, br').forEach((el) => el.append(' '))
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** True when the editor holds no actual text (an empty editor still produces "<p></p>"). */
export function isRichEmpty(value: string | null | undefined): boolean {
  return richToPlain(value).length === 0
}

/** Adds ids to the h2 headings (for a table of contents) and lists them. */
export function withHeadingAnchors(safeHtml: string): {
  html: string
  headings: { id: string; text: string }[]
} {
  const doc = new DOMParser().parseFromString(safeHtml, 'text/html')
  const headings: { id: string; text: string }[] = []
  doc.querySelectorAll('h2').forEach((h, i) => {
    const id = `s${i + 1}`
    h.id = id
    headings.push({ id, text: (h.textContent ?? '').trim() })
  })
  return { html: doc.body.innerHTML, headings }
}
