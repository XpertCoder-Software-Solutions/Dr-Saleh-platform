import { useEffect, useState } from 'react'

interface Options {
  /** ms per letter while typing */
  typeMs?: number
  /** ms per letter while erasing */
  eraseMs?: number
  /** how long a full word stays before it's erased */
  holdMs?: number
  /** pause on the empty line before the next word */
  gapMs?: number
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Types each word letter by letter, holds it, erases it, then types the next one, forever.
 * Returns the visible text and the full current word (for screen readers).
 * With reduced motion the words just swap without the typing.
 */
export function useTypewriter(
  words: readonly string[],
  { typeMs = 55, eraseMs = 25, holdMs = 1300, gapMs = 200 }: Options = {},
) {
  const [state, setState] = useState({ index: 0, length: 0, erasing: false })
  const [reduced] = useState(prefersReducedMotion)
  const word = Array.from(words[state.index % words.length] ?? '')

  useEffect(() => {
    if (!words.length) return
    if (reduced) {
      const id = setTimeout(
        () => setState((s) => ({ index: (s.index + 1) % words.length, length: 0, erasing: false })),
        holdMs + 900,
      )
      return () => clearTimeout(id)
    }
    const full = state.length >= word.length
    let delay: number
    let next: typeof state
    if (!state.erasing && !full) {
      delay = state.length === 0 ? gapMs : typeMs
      next = { ...state, length: state.length + 1 }
    } else if (!state.erasing) {
      delay = holdMs
      next = { ...state, erasing: true }
    } else if (state.length > 0) {
      delay = eraseMs
      next = { ...state, length: state.length - 1 }
    } else {
      delay = 0
      next = { index: (state.index + 1) % words.length, length: 0, erasing: false }
    }
    const id = setTimeout(() => setState(next), delay)
    return () => clearTimeout(id)
  }, [state, word.length, words.length, reduced, typeMs, eraseMs, holdMs, gapMs])

  return {
    text: reduced ? word.join('') : word.slice(0, state.length).join(''),
    word: word.join(''),
    typing: !state.erasing && state.length < word.length,
  }
}
