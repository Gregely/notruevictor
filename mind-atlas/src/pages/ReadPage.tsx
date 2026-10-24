// Reading back: walk through chapters in date order, one page at a time,
// and scribble notes in the margin. The URL remembers which chapter you're on.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { useAtlas } from '../lib/store'
import { navigate } from '../lib/router'
import { byDate, inkFor, prettyDate } from '../lib/utils'
import { GlyphIcon } from '../components/GlyphArt'

export function ReadPage({ startId }: { startId?: string }) {
  const { chapters, addNote, deleteNote } = useAtlas()
  const ordered = useMemo(() => byDate(chapters), [chapters])
  // Unfinished margin notes, kept per chapter so turning a page doesn't lose one.
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})

  const found = ordered.findIndex((c) => c.id === startId)
  const index = found === -1 ? 0 : found
  const chapter = ordered[index]

  // Which way we last turned, so the page slides in from the matching side.
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  const go = useCallback(
    (i: number) => {
      if (!ordered[i]) return
      setDirection(i >= index ? 'forward' : 'back')
      navigate('read', ordered[i].id)
    },
    [index, ordered],
  )

  // Arrow keys turn pages, unless you're typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.matches('input, textarea')
      if (typing) return
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index])

  // Keep the current chapter's dot visible in the timeline strip.
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    stripRef.current?.querySelector('.strip-dot-on')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [index])

  if (!chapter) {
    return (
      <section className="paper-card empty">
        <p>Nothing to read back yet.</p>
        <button className="button button-big" onClick={() => navigate('write')}>
          ✎ write a chapter
        </button>
      </section>
    )
  }

  const noteText = noteDrafts[chapter.id] ?? ''
  const setNoteText = (text: string) => setNoteDrafts((d) => ({ ...d, [chapter.id]: text }))

  const pinNote = (e?: FormEvent) => {
    e?.preventDefault()
    if (!noteText.trim()) return
    addNote(chapter.id, noteText.trim())
    setNoteText('')
  }

  return (
    <div className="read">
      {/* A strip of every chapter's glyph, in order. Click one to jump there. */}
      <div className="strip" ref={stripRef} aria-label="All chapters in order">
        {ordered.map((c, i) => (
          <button
            key={c.id}
            className={`strip-dot ${i === index ? 'strip-dot-on' : ''}`}
            onClick={() => go(i)}
            title={`${c.title || 'untitled'} · ${c.date}`}
            aria-label={`${c.title || 'untitled'}, ${c.date}`}
            aria-current={i === index ? 'true' : undefined}
          >
            <GlyphIcon glyph={c.glyph} color={inkFor(c.tags[0])} size={30} />
          </button>
        ))}
      </div>

      <div className="read-nav">
        <button className="button" onClick={() => go(index - 1)} disabled={index === 0}>
          ← earlier
        </button>
        <span className="read-nav-date">{prettyDate(chapter.date)}</span>
        <button className="button" onClick={() => go(index + 1)} disabled={index === ordered.length - 1}>
          later →
        </button>
      </div>

      <div className="read-spread">
        <article key={chapter.id} className={`paper-card read-page turn-${direction}`}>
          <header className="chapter-head">
            <GlyphIcon glyph={chapter.glyph} color={inkFor(chapter.tags[0])} size={60} />
            <div>
              <h2>{chapter.title || <span className="muted">untitled</span>}</h2>
              <p className="chapter-meta">
                <span className="chapter-mood">{chapter.mood}</span> {prettyDate(chapter.date)}
              </p>
            </div>
            <button className="link-button read-edit" onClick={() => navigate('write', chapter.id)}>
              edit
            </button>
          </header>

          {chapter.tags.length > 0 && (
            <p className="tag-row">
              {chapter.tags.map((t) => (
                <span key={t} className="tag-chip" style={{ '--chip': inkFor(t) } as CSSProperties}>
                  #{t}
                </span>
              ))}
            </p>
          )}

          <div className="chapter-body lined">{chapter.body}</div>
        </article>

        <aside className="margin" aria-label="Margin notes">
          <p className="margin-title">margin</p>
          {chapter.notes.map((n, i) => (
            <div key={n.id} className={`margin-note ${i % 2 ? 'tilt-right' : 'tilt-left'}`}>
              <p>{n.text}</p>
              <small>{new Date(n.createdAt).toLocaleDateString()}</small>
              <button
                className="margin-note-delete"
                onClick={() => deleteNote(chapter.id, n.id)}
                aria-label="Delete this note"
                title="delete note"
              >
                ×
              </button>
            </div>
          ))}

          <form className="margin-form" onSubmit={pinNote}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) pinNote()
              }}
              placeholder="…"
              aria-label="New margin note"
              rows={3}
            />
            <button type="submit" className="button" disabled={!noteText.trim()}>
              ✎ add note
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}
