// Small helpers shared across the app.

/** A random id that's unique enough for a personal journal. */
export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Today's date as "YYYY-MM-DD" in local time (not UTC). */
export function todayString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "2026-10-24" -> "Sat 24 Oct 2026" */
export function prettyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Turn whatever the user typed into a tidy tag: "#Big Ideas " -> "big ideas". */
export function cleanTag(raw: string): string {
  return raw.replace(/^#+/, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** A stable number from a string, used to pick colours and starting spots. */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Warm "felt-tip" colours. Each tag gets one, always the same.
const INKS = ['#e07a5f', '#3d8b7d', '#f2a541', '#8e6bbf', '#d1495b', '#5b8bd9', '#7a9e3d', '#c26d3a']

/** The ink colour for a tag (or a neutral one when there's no tag). */
export function inkFor(tag: string | undefined): string {
  if (!tag) return '#9c8a74'
  return INKS[hashString(tag) % INKS.length]
}

/** Chapters sorted oldest first (by date, then by when they were written). */
export function byDate<T extends { date: string; createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) =>
    a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date),
  )
}
