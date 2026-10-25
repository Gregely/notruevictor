// The hand-drawn pictures for chapters. Each one is drawn in a box from
// -40 to 40 (centred on 0,0), so they can be dropped anywhere in an SVG.
// Paths are deliberately a little lumpy to look hand-drawn.

import type { Glyph } from '../types'

interface Props {
  glyph: Glyph
  color: string // the fill colour (comes from the chapter's first tag)
}

export function GlyphShape({ glyph, color }: Props) {
  // Outlines use the current ink colour so they flip in dark mode.
  const line = { stroke: 'var(--ink)', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

  switch (glyph) {
    case 'island':
      return (
        <g>
          {/* water ripples */}
          <path d="M-36 24 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" fill="none" {...line} strokeWidth={1.6} opacity={0.6} />
          {/* the sandy mound */}
          <path d="M-30 20 C-24 4 -8 -2 4 0 C18 2 30 10 32 20 Z" fill={color} {...line} />
          {/* palm trunk */}
          <path d="M2 2 C2 -10 6 -20 4 -28" fill="none" {...line} />
          {/* palm leaves */}
          <path d="M4 -28 C-6 -32 -14 -28 -18 -20 M4 -28 C14 -34 22 -30 26 -22 M4 -28 C2 -36 -6 -40 -12 -38 M4 -28 C10 -38 18 -40 22 -36" fill="none" {...line} />
          <circle cx={6} cy={-24} r={2.2} fill="var(--ink)" />
        </g>
      )
    case 'star':
      return (
        <g>
          <path
            d="M0 -34 L9 -12 L33 -11 L14 4 L21 28 L1 15 L-19 29 L-13 5 L-33 -10 L-9 -12 Z"
            fill={color}
            {...line}
          />
          {/* little sparkle marks */}
          <path d="M28 -28 l4 -4 M33 -22 l6 -1 M-30 -28 l-4 -4" fill="none" {...line} strokeWidth={1.8} />
        </g>
      )
    case 'spiral':
      return (
        <g>
          <circle r={30} fill={color} opacity={0.35} />
          <path
            d="M0 0 C4 -3 7 2 4 6 C0 11 -9 7 -9 0 C-9 -10 3 -15 11 -9 C20 -2 16 14 4 17 C-10 21 -21 9 -19 -4 C-17 -18 -2 -27 12 -24 C26 -20 32 -4 27 10"
            fill="none"
            {...line}
            strokeWidth={3}
          />
        </g>
      )
    case 'cloud':
      return (
        <g>
          <path
            d="M-28 14 C-38 12 -38 -2 -27 -3 C-28 -16 -12 -22 -5 -13 C-1 -26 20 -25 21 -10 C33 -12 38 4 28 10 C30 20 16 22 12 17 C6 24 -8 24 -12 17 C-18 22 -27 20 -28 14 Z"
            fill={color}
            {...line}
          />
          {/* raindrop-ish dashes */}
          <path d="M-12 28 l-2 6 M0 28 l-2 6 M12 28 l-2 6" fill="none" {...line} strokeWidth={1.8} />
        </g>
      )
    case 'moon':
      return (
        <g>
          <path d="M8 -30 C-14 -30 -28 -12 -26 4 C-24 22 -6 34 14 28 C-2 22 -10 8 -8 -6 C-6 -18 0 -26 8 -30 Z" fill={color} {...line} />
          {/* tiny stars around it */}
          <path d="M18 -12 l0 8 M14 -8 l8 0 M24 12 l0 6 M21 15 l6 0" fill="none" {...line} strokeWidth={1.8} />
          <circle cx={-14} cy={0} r={2} fill="var(--ink)" opacity={0.5} />
          <circle cx={-8} cy={14} r={1.5} fill="var(--ink)" opacity={0.5} />
        </g>
      )
  }
}

/** A glyph on its own, as a small inline icon (used in pickers and lists). */
export function GlyphIcon({ glyph, color, size = 40 }: Props & { size?: number }) {
  return (
    <svg viewBox="-42 -42 84 84" width={size} height={size} aria-hidden="true">
      <GlyphShape glyph={glyph} color={color} />
    </svg>
  )
}
