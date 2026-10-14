/** Renders `*word*` in a title with the brand underline highlight. */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="g-ink uline">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}
