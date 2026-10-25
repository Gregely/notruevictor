// The shapes of everything Mind Atlas stores.

/** The little pictures a chapter can appear as on the map. */
export type Glyph = 'island' | 'star' | 'spiral' | 'cloud' | 'moon'

/** A note scribbled in the margin while reading back. */
export interface MarginNote {
  id: string
  text: string
  createdAt: string // ISO timestamp
}

/** One journal entry. */
export interface Chapter {
  id: string
  title: string
  body: string
  date: string // "YYYY-MM-DD" (the day the chapter is about)
  mood: string // one emoji from MOODS
  tags: string[] // lowercase, no "#"
  glyph: Glyph
  notes: MarginNote[]
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

/** What gets written to localStorage and to exported files. */
export interface AtlasFile {
  app: 'mind-atlas'
  version: 1
  exportedAt?: string
  chapters: Chapter[]
}

// The mood choices in the editor. Add or swap emoji here.
export const MOODS = ['😊', '😌', '🤩', '🤔', '😐', '😴', '😢', '😠'] as const

// The glyph choices in the editor, with a label for screen readers.
export const GLYPHS: { id: Glyph; label: string }[] = [
  { id: 'island', label: 'island' },
  { id: 'star', label: 'star' },
  { id: 'spiral', label: 'spiral doodle' },
  { id: 'cloud', label: 'cloud' },
  { id: 'moon', label: 'moon' },
]
