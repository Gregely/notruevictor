// The little celebration when a chapter is added: the chapter's glyph is
// stamped in the middle and doodles fly out around it. Pure CSS animation.

import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { Glyph } from '../types'
import { GlyphIcon } from './GlyphArt'

const BITS = ['✦', '✧', '❀', '☆', '✺', '~', '✿', '⁂', '✶', '◌', '♡', '✷']

export function InkBurst({ glyph, color }: { glyph: Glyph; color: string }) {
  // Rendered into <body> so it always covers the whole window.
  return createPortal(
    <div className="ink-burst" aria-live="polite">
      <span className="sr-only">Chapter added</span>
      <div className="ink-splat" style={{ background: color }} />
      <div className="ink-stamp">
        <GlyphIcon glyph={glyph} color={color} size={140} />
      </div>
      {BITS.map((bit, i) => {
        // Spread the bits evenly around a circle; CSS flies each one outwards.
        const angle = (i / BITS.length) * Math.PI * 2
        const style = {
          '--dx': `${Math.cos(angle) * 190}px`,
          '--dy': `${Math.sin(angle) * 190}px`,
          '--spin': `${(i % 2 ? 1 : -1) * (90 + i * 20)}deg`,
          animationDelay: `${(i % 3) * 40}ms`,
        } as CSSProperties
        return (
          <span key={i} className="ink-bit" style={style} aria-hidden="true">
            {bit}
          </span>
        )
      })}
    </div>,
    document.body,
  )
}
