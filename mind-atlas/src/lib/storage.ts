// Reading and writing chapters: localStorage plus JSON export/import.
// Nothing ever leaves the browser unless you export it yourself.

import { GLYPHS, type AtlasFile, type Chapter, type Glyph, type MarginNote } from '../types'
import { cleanTag, makeId, todayString } from './utils'

const STORAGE_KEY = 'mind-atlas:v1'

/** Load chapters saved in this browser. Returns [] if there's nothing yet. */
export function loadChapters(): Chapter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return parseAtlas(raw)
  } catch (err) {
    console.warn('Mind Atlas: could not read saved chapters', err)
    return []
  }
}

/** Save chapters. Returns false if the browser refused (e.g. storage full). */
export function saveChapters(chapters: Chapter[]): boolean {
  const file: AtlasFile = { app: 'mind-atlas', version: 1, chapters }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
    return true
  } catch (err) {
    console.warn('Mind Atlas: could not save chapters', err)
    return false
  }
}

/** Download every chapter as a .json file. */
export function exportChapters(chapters: Chapter[]): void {
  const file: AtlasFile = {
    app: 'mind-atlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    chapters,
  }
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mind-atlas-${todayString()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Turn JSON text (from localStorage or an imported file) into chapters.
 * Accepts the full AtlasFile shape or a bare array of chapters.
 * Anything malformed is repaired where possible and skipped otherwise.
 * Throws if the text isn't JSON at all.
 */
export function parseAtlas(text: string): Chapter[] {
  const data: unknown = JSON.parse(text)
  const list = Array.isArray(data) ? data : isObject(data) && Array.isArray(data.chapters) ? data.chapters : null
  if (!list) throw new Error("This file doesn't look like a Mind Atlas export.")
  return list.map(toChapter).filter((c): c is Chapter => c !== null)
}

// ---- validation helpers ----------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const validGlyphs = new Set<string>(GLYPHS.map((g) => g.id))

/** Make a proper Chapter out of an unknown value, or null if it's hopeless. */
function toChapter(v: unknown): Chapter | null {
  if (!isObject(v)) return null
  const title = str(v.title)
  const body = str(v.body)
  if (!title && !body) return null // nothing to keep

  const now = new Date().toISOString()
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(v.date)) ? str(v.date) : todayString()
  const tags = Array.isArray(v.tags)
    ? [...new Set(v.tags.filter((t): t is string => typeof t === 'string').map(cleanTag).filter(Boolean))]
    : []
  const notes: MarginNote[] = Array.isArray(v.notes)
    ? v.notes.filter(isObject).flatMap((n) =>
        str(n.text) ? [{ id: str(n.id) || makeId(), text: str(n.text), createdAt: str(n.createdAt, now) }] : [],
      )
    : []

  return {
    id: str(v.id) || makeId(),
    title,
    body,
    date,
    mood: str(v.mood, '😊'),
    tags,
    glyph: validGlyphs.has(str(v.glyph)) ? (v.glyph as Glyph) : 'island',
    notes,
    createdAt: str(v.createdAt, now),
    updatedAt: str(v.updatedAt, now),
  }
}
