/**
 * Which parts of a video lesson were actually watched, as merged [start, end) second ranges.
 * Kept per lesson in localStorage so a lesson watched over several sittings adds up;
 * skipping or seeking ahead does not count as watching.
 */
export type Ranges = [number, number][]

const KEY = (lessonId: string) => `drs.watch.${lessonId}`
/** Biggest jump between two time updates that still counts as normal playback. */
const MAX_STEP_SECONDS = 2.5

export function loadRanges(lessonId: string): Ranges {
  try {
    const raw = localStorage.getItem(KEY(lessonId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter(
          (r): r is [number, number] =>
            Array.isArray(r) && r.length === 2 && r.every((n) => typeof n === 'number') && r[1] > r[0],
        )
      : []
  } catch {
    return []
  }
}

export function saveRanges(lessonId: string, ranges: Ranges) {
  try {
    localStorage.setItem(KEY(lessonId), JSON.stringify(ranges))
  } catch {
    /* private mode / storage full: coverage just won't survive a reload */
  }
}

export function addRange(ranges: Ranges, start: number, end: number): Ranges {
  if (!(end > start)) return ranges
  const all = [...ranges, [start, end] as [number, number]].sort((a, b) => a[0] - b[0])
  const merged: Ranges = []
  for (const [s, e] of all) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1] + 0.5) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  return merged
}

export function watchedSeconds(ranges: Ranges): number {
  return ranges.reduce((sum, [s, e]) => sum + (e - s), 0)
}

/** Watched share of the video, 0–100. */
export function coveragePercent(ranges: Ranges, duration: number): number {
  if (!duration || !Number.isFinite(duration)) return 0
  return Math.min(100, Math.round((watchedSeconds(ranges) / duration) * 100))
}

/** True when the step from `from` to `to` looks like normal playback (not a seek). */
export function isPlaybackStep(from: number, to: number): boolean {
  const step = to - from
  return step > 0 && step <= MAX_STEP_SECONDS
}
