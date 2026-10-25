// A chapter opened from the map, shown on a card over everything else.

import { useEffect, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { Chapter } from '../types'
import { navigate } from '../lib/router'
import { inkFor, prettyDate } from '../lib/utils'
import { GlyphIcon } from './GlyphArt'

interface Props {
  chapter: Chapter
  onClose: () => void
  onTagClick: (tag: string) => void
}

export function ChapterModal({ chapter, onClose, onTagClick }: Props) {
  // Escape closes the card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Rendered straight into <body> so no parent's animation or clipping can trap it.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <article
        className="modal paper-card pop-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close" autoFocus>
          ×
        </button>

        <header className="chapter-head">
          <GlyphIcon glyph={chapter.glyph} color={inkFor(chapter.tags[0])} size={56} />
          <div>
            <h2 id="modal-title">{chapter.title || <span className="muted">untitled</span>}</h2>
            <p className="chapter-meta">
              <span className="chapter-mood">{chapter.mood}</span> {prettyDate(chapter.date)}
            </p>
          </div>
        </header>

        {chapter.tags.length > 0 && (
          <p className="tag-row">
            {chapter.tags.map((t) => (
              <button
                key={t}
                className="tag-chip tag-chip-button"
                style={{ '--chip': inkFor(t) } as CSSProperties}
                onClick={() => onTagClick(t)}
                title="show this tag on the map"
              >
                #{t}
              </button>
            ))}
          </p>
        )}

        <div className="chapter-body">{chapter.body}</div>

        {chapter.notes.length > 0 && (
          <p className="muted small">
            ✎ {chapter.notes.length} margin note{chapter.notes.length === 1 ? '' : 's'}
          </p>
        )}

        <footer className="modal-actions">
          <button className="button button-quiet" onClick={() => navigate('write', chapter.id)}>
            edit
          </button>
          <button className="button" onClick={() => navigate('read', chapter.id)}>
            read on from here ❧
          </button>
        </footer>
      </article>
    </div>,
    document.body,
  )
}
