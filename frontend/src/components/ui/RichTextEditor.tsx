import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/cn'
import { isRichHtml, isRichEmpty, legacyToHtml } from '@/lib/richText'
import { richTextClass } from '@/components/ui/richTextClass'

/**
 * Admin editor for formatted text: headings, bold, italic, underline, lists, quotes, links.
 * Emits HTML (empty string when there's no text); the site renders it through RichText,
 * which sanitizes it.
 */
export function RichTextEditor({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  dir = 'rtl',
  minHeight = 180,
  compact,
}: {
  label: string
  value: string
  onChange: (html: string) => void
  error?: string | null
  hint?: ReactNode
  placeholder?: string
  dir?: 'rtl' | 'ltr'
  minHeight?: number
  /** Fewer tools (no headings), for short intros. */
  compact?: boolean
}) {
  const id = useId()
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        id,
        dir,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': `${id}-label`,
        ...(error ? { 'aria-invalid': 'true' } : {}),
        class: cn(richTextClass, 'min-h-[var(--rte-min)] px-4 py-3.5 text-base outline-none'),
      },
    },
    onUpdate: ({ editor }) =>
      onChange(editor.isEmpty || isRichEmpty(editor.getHTML()) ? '' : editor.getHTML()),
    immediatelyRender: true,
  })

  // Outside changes (form reset, loading another record) replace the content.
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (value !== current && !(isRichEmpty(value) && editor.isEmpty)) {
      editor.commands.setContent(toEditorHtml(value), { emitUpdate: false })
    }
  }, [editor, value])

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-[15px] font-semibold text-ink">
        {label}
      </span>
      <div
        className={cn(
          'overflow-hidden rounded-field border-[1.5px] border-line-2 bg-white transition-[border-color,box-shadow]',
          'focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(61,155,216,.15)]',
          error && 'border-danger',
        )}
        style={{ ['--rte-min' as string]: `${minHeight}px` }}
      >
        {editor && <Toolbar editor={editor} compact={compact} dir={dir} />}
        <EditorContent editor={editor} className="rte" />
      </div>
      {error ? (
        <span className="text-sm text-danger">{error}</span>
      ) : (
        hint && <span className="text-[13px] text-muted">{hint}</span>
      )}
    </div>
  )
}

function toEditorHtml(value: string) {
  if (!value) return ''
  return isRichHtml(value) ? value : legacyToHtml(value)
}

type Tool = {
  key: string
  label: string
  icon: ReactNode
  run: (e: Editor) => void
  active?: (e: Editor) => boolean
}

const B = (s: string) => <span className="font-head text-[15px] leading-none">{s}</span>
const svg = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
)

function Toolbar({ editor, compact, dir }: { editor: Editor; compact?: boolean; dir: 'rtl' | 'ltr' }) {
  // Inline box for adding a link to the selected text.
  const [link, setLink] = useState<string | null>(null)
  const linkInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (link !== null) linkInput.current?.select()
  }, [link])
  function applyLink() {
    const url = (link ?? '').trim()
    if (url && url !== 'https://') {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}` })
        .run()
    } else editor.commands.focus()
    setLink(null)
  }
  // Re-render the toolbar when the selection's formatting changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const groups: Tool[][] = [
    compact
      ? []
      : [
          {
            key: 'h2',
            label: 'عنوان رئيسي',
            icon: B('H2'),
            run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
          },
          {
            key: 'h3',
            label: 'عنوان فرعي',
            icon: B('H3'),
            run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
          },
        ],
    [
      {
        key: 'bold',
        label: 'عريض',
        icon: <b className="text-[16px]">B</b>,
        run: (e) => e.chain().focus().toggleBold().run(),
      },
      {
        key: 'italic',
        label: 'مائل',
        icon: <i className="font-serif text-[16px]">I</i>,
        run: (e) => e.chain().focus().toggleItalic().run(),
      },
      {
        key: 'underline',
        label: 'تحته خط',
        icon: <u className="text-[16px]">U</u>,
        run: (e) => e.chain().focus().toggleUnderline().run(),
      },
    ],
    [
      {
        key: 'bullet',
        label: 'قائمة نقط',
        icon: svg('M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01'),
        run: (e) => e.chain().focus().toggleBulletList().run(),
      },
      {
        key: 'ordered',
        label: 'قائمة مرقّمة',
        icon: svg('M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'),
        run: (e) => e.chain().focus().toggleOrderedList().run(),
      },
      ...(compact
        ? []
        : [
            {
              key: 'quote',
              label: 'اقتباس',
              icon: svg('M3 21c3 0 7-1 7-8V5H3v7h4M14 21c3 0 7-1 7-8V5h-7v7h4'),
              run: (e: Editor) => e.chain().focus().toggleBlockquote().run(),
            },
          ]),
      {
        key: 'link',
        label: 'رابط',
        icon: svg(
          'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
        ),
        run: (e) => {
          if (e.isActive('link')) {
            e.chain().focus().unsetLink().run()
            return
          }
          setLink('https://')
        },
      },
    ],
  ]

  const btn = (t: Tool) => {
    const active = (state as Record<string, boolean>)[t.key]
    return (
      <button
        key={t.key}
        type="button"
        title={t.label}
        aria-label={t.label}
        aria-pressed={active}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => t.run(editor)}
        className={cn(
          'flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-text-2 transition-colors hover:bg-hover hover:text-ink',
          active && 'bg-navy text-white hover:bg-navy hover:text-white',
        )}
      >
        {t.icon}
      </button>
    )
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="تنسيق النص"
        dir="rtl"
        className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-1.5"
      >
        {groups
          .filter((g) => g.length)
          .map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-0.5 border-line not-last:me-1 not-last:border-e not-last:pe-1.5"
            >
              {g.map(btn)}
            </div>
          ))}
        <div className="ms-auto flex items-center gap-0.5">
          <button
            type="button"
            title="تراجع"
            aria-label="تراجع"
            disabled={!state.canUndo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            className="flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover disabled:opacity-35"
          >
            {svg(
              dir === 'rtl'
                ? 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3'
                : 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
            )}
          </button>
          <button
            type="button"
            title="إعادة"
            aria-label="إعادة"
            disabled={!state.canRedo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            className="flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover disabled:opacity-35"
          >
            {svg(
              dir === 'rtl'
                ? 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3'
                : 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3',
            )}
          </button>
        </div>
      </div>
      {link !== null && (
        <div className="flex items-center gap-2 border-b border-line bg-surface-blue px-3 py-2">
          <input
            ref={linkInput}
            dir="ltr"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyLink()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setLink(null)
                editor.commands.focus()
              }
            }}
            aria-label="الرابط"
            placeholder="https://"
            className="h-9 min-w-0 flex-1 rounded-lg border-[1.5px] border-line-2 bg-white px-3 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-9 bg-navy rounded-lg border-0 px-3.5 text-sm font-bold text-white"
          >
            أضف الرابط
          </button>
          <button
            type="button"
            onClick={() => setLink(null)}
            className="h-9 rounded-lg border-0 bg-transparent px-2 text-sm font-bold text-muted"
          >
            إلغاء
          </button>
        </div>
      )}
    </>
  )
}
