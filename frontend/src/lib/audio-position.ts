// Where the listener stopped in an audio book, kept in this browser only.
// It's a convenience: if storage is unavailable the player simply starts from the top.

const key = (formatId: string) => `drs.audio.${formatId}`

export function readAudioPosition(formatId: string): number | null {
  try {
    const v = Number(localStorage.getItem(key(formatId)))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

export function saveAudioPosition(formatId: string, seconds: number) {
  try {
    localStorage.setItem(key(formatId), String(Math.floor(seconds)))
  } catch {
    // ignore
  }
}
