// Write a chapter (or edit one, when there's an id in the URL).

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAtlas, type ChapterDraft } from '../lib/store'
import { navigate } from '../lib/router'
import { inkFor, todayString } from '../lib/utils'
import { GLYPHS, MOODS, type Chapter } from '../types'
import { GlyphIcon } from '../components/GlyphArt'
import { TagInput } from '../components/TagInput'
import { InkBurst } from '../components/InkBurst'

// An unsaved new chapter is kept here so a closed tab doesn't lose it.
const DRAFT_KEY = 'mind-atlas:draft'

const blankDraft = (): ChapterDraft => ({
  title: '',
  body: '',
  date: todayString(),
  mood: MOODS[0],
  tags: [],
  glyph: 'island',
})

function loadDraft(): ChapterDraft {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) return { ...blankDraft(), ...JSON.parse(saved) }
  } catch {
    // no draft, or storage blocked
  }
  return blankDraft()
}

function toDraft(c: Chapter): ChapterDraft {
  return { title: c.title, body: c.body, date: c.date, mood: c.mood, tags: c.tags, glyph: c.glyph }
}

export function WritePage({ editId }: { editId?: string }) {
  const { chapters, addChapter, updateChapter, deleteChapter } = useAtlas()
  const existing = editId ? chapters.find((c) => c.id === editId) : undefined

  const [draft, setDraft] = useState<ChapterDraft>(() => (existing ? toDraft(existing) : loadDraft()))
  const [celebrating, setCelebrating] = useState(false)
  const [hint, setHint] = useState('')

  // Every tag used anywhere, for the suggestions list.
  const knownTags = useMemo(() => [...new Set(chapters.flatMap((c) => c.tags))].sort(), [chapters])

  // Keep the unsaved draft of a *new* chapter.
  useEffect(() => {
    if (editId || celebrating) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // not fatal
    }
  }, [draft, editId, celebrating])

  const set = <K extends keyof ChapterDraft>(key: K, value: ChapterDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setHint('')
  }

  if (editId && !existing) {
    return (
      <section className="paper-card empty">
        <p>That chapter isn't in this atlas.</p>
        <button className="button" onClick={() => navigate('write')}>
          write a new one
        </button>
      </section>
    )
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    const clean = { ...draft, title: draft.title.trim(), date: draft.date || todayString() }
    if (!clean.title && !clean.body.trim()) {
      setHint('Add a title or some words first.')
      return
    }
    if (existing) {
      updateChapter(existing.id, clean)
      navigate('read', existing.id)
      return
    }
    const chapter = addChapter(clean)
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // not fatal
    }
    // Little ink-splash celebration, then fly to the map where the new node pops in.
    setCelebrating(true)
    window.setTimeout(() => navigate('map', chapter.id), 1150)
  }

  const remove = () => {
    if (existing && window.confirm(`Delete "${existing.title || 'this chapter'}"? This can't be undone.`)) {
      deleteChapter(existing.id)
      navigate('map')
    }
  }

  const clearDraft = () => {
    if (window.confirm('Clear this page?')) setDraft(blankDraft())
  }

  const color = inkFor(draft.tags[0])

  return (
    <form className={`write paper-card ${celebrating ? 'write-stamped' : ''}`} onSubmit={save}>
      <div className="write-top">
        <input
          className="write-title"
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="title"
          aria-label="Title"
          autoFocus={!existing}
        />
        <input
          className="write-date"
          type="date"
          value={draft.date}
          onChange={(e) => set('date', e.target.value)}
          aria-label="Date"
        />
      </div>

      <div className="write-pickers">
        <fieldset className="picker">
          <legend>mood</legend>
          {MOODS.map((m) => (
            <button
              type="button"
              key={m}
              className={`mood-option ${draft.mood === m ? 'picked' : ''}`}
              onClick={() => set('mood', m)}
              aria-pressed={draft.mood === m}
            >
              {m}
            </button>
          ))}
        </fieldset>

        <fieldset className="picker">
          <legend>on the map as</legend>
          {GLYPHS.map((g) => (
            <button
              type="button"
              key={g.id}
              className={`glyph-option ${draft.glyph === g.id ? 'picked' : ''}`}
              onClick={() => set('glyph', g.id)}
              aria-pressed={draft.glyph === g.id}
              aria-label={g.label}
              title={g.label}
            >
              <GlyphIcon glyph={g.id} color={color} size={38} />
            </button>
          ))}
        </fieldset>
      </div>

      <TagInput tags={draft.tags} onChange={(tags) => set('tags', tags)} suggestions={knownTags} />

      <textarea
        className="write-body lined"
        value={draft.body}
        onChange={(e) => set('body', e.target.value)}
        placeholder="…"
        aria-label="Chapter text"
      />

      <div className="write-actions">
        {hint && <p className="hint wiggle">{hint}</p>}
        {existing ? (
          <>
            <button type="button" className="button button-quiet" onClick={remove}>
              delete
            </button>
            <button type="button" className="button button-quiet" onClick={() => navigate('read', existing.id)}>
              cancel
            </button>
            <button type="submit" className="button button-big">
              save changes
            </button>
          </>
        ) : (
          <>
            <button type="button" className="button button-quiet" onClick={clearDraft}>
              clear
            </button>
            <button type="submit" className="button button-big" disabled={celebrating}>
              ✦ add to the atlas
            </button>
          </>
        )}
      </div>

      {celebrating && <InkBurst glyph={draft.glyph} color={color} />}
    </form>
  )
}
