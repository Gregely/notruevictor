// The one place chapters live while the app is running.
// Components call useAtlas() to read chapters or change them;
// every change is saved to localStorage automatically.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Chapter } from '../types'
import { loadChapters, saveChapters } from './storage'
import { makeId } from './utils'

/** The fields you fill in when writing a chapter. */
export type ChapterDraft = Pick<Chapter, 'title' | 'body' | 'date' | 'mood' | 'tags' | 'glyph'>

interface Atlas {
  chapters: Chapter[]
  saveFailed: boolean
  addChapter: (draft: ChapterDraft) => Chapter
  updateChapter: (id: string, draft: ChapterDraft) => void
  deleteChapter: (id: string) => void
  addNote: (chapterId: string, text: string) => void
  deleteNote: (chapterId: string, noteId: string) => void
  importChapters: (incoming: Chapter[], mode: 'merge' | 'replace') => void
}

const AtlasContext = createContext<Atlas | null>(null)

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [chapters, setChapters] = useState<Chapter[]>(loadChapters)
  const [saveFailed, setSaveFailed] = useState(false)

  // Save whenever chapters change, and remember if the browser refused.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reporting the result of an external write
    setSaveFailed(!saveChapters(chapters))
  }, [chapters])

  const now = () => new Date().toISOString()

  const atlas: Atlas = {
    chapters,
    saveFailed,

    addChapter(draft) {
      const chapter: Chapter = { ...draft, id: makeId(), notes: [], createdAt: now(), updatedAt: now() }
      setChapters((list) => [...list, chapter])
      return chapter
    },

    updateChapter(id, draft) {
      setChapters((list) => list.map((c) => (c.id === id ? { ...c, ...draft, updatedAt: now() } : c)))
    },

    deleteChapter(id) {
      setChapters((list) => list.filter((c) => c.id !== id))
    },

    addNote(chapterId, text) {
      const note = { id: makeId(), text, createdAt: now() }
      setChapters((list) => list.map((c) => (c.id === chapterId ? { ...c, notes: [...c.notes, note] } : c)))
    },

    deleteNote(chapterId, noteId) {
      setChapters((list) =>
        list.map((c) => (c.id === chapterId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c)),
      )
    },

    importChapters(incoming, mode) {
      if (mode === 'replace') {
        setChapters(incoming)
        return
      }
      // Merge: imported chapters win when the same id exists in both.
      setChapters((list) => {
        const byId = new Map(list.map((c) => [c.id, c]))
        for (const c of incoming) byId.set(c.id, c)
        return [...byId.values()]
      })
    },
  }

  return <AtlasContext.Provider value={atlas}>{children}</AtlasContext.Provider>
}

// The hook lives next to its provider on purpose, to keep the store in one file.
// oxlint-disable-next-line react/only-export-components
export function useAtlas(): Atlas {
  const atlas = useContext(AtlasContext)
  if (!atlas) throw new Error('useAtlas must be used inside <AtlasProvider>')
  return atlas
}
