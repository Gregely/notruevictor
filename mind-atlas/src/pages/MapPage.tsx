// The map: every chapter is a little drawing; shared tags draw lines between
// them and pull them close. Drag to wander, scroll or pinch to zoom.

import { useCallback, useLayoutEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useAtlas } from '../lib/store'
import { navigate } from '../lib/router'
import { findLinks, layoutChapters, type Point } from '../lib/layout'
import { usePanZoom, type View } from '../lib/usePanZoom'
import { hashString, inkFor } from '../lib/utils'
import { topTags } from '../lib/words'
import { GlyphShape } from '../components/GlyphArt'
import { ChapterModal } from '../components/ChapterModal'

const NODE_RADIUS = 46 // roughly how much room a node needs, for "fit to view"

/** Shorten long titles so labels don't sprawl across the map. */
const shortLabel = (s: string) => (s.length > 24 ? s.slice(0, 22).trimEnd() + '…' : s)

export function MapPage({ highlightId }: { highlightId?: string }) {
  const { chapters } = useAtlas()

  if (chapters.length === 0) {
    return (
      <section className="paper-card empty map-empty">
        <svg viewBox="-60 -50 120 100" width="160" aria-hidden="true">
          <path d="M-50 30 q12 -8 25 0 t25 0 t25 0 t25 0" fill="none" stroke="var(--ink)" strokeWidth="2" opacity="0.5" />
          <path d="M-40 -30 l6 6 m0 -6 l-6 6 M30 -38 l5 5 m0 -5 l-5 5" stroke="var(--ink)" strokeWidth="2" />
        </svg>
        <p>The map is blank paper for now.</p>
        <button className="button button-big" onClick={() => navigate('write')}>
          ✎ write a chapter
        </button>
      </section>
    )
  }
  return <MapCanvas highlightId={highlightId} />
}

function MapCanvas({ highlightId }: { highlightId?: string }) {
  const { chapters } = useAtlas()
  const [openId, setOpenId] = useState<string | null>(null)
  const [focusTag, setFocusTag] = useState<string | null>(null)
  const { svgRef, view, setView, zoomBy, justDragged, handlers } = usePanZoom()

  // Layout is the slow part, so only redo it when chapters change.
  const links = useMemo(() => findLinks(chapters), [chapters])
  const positions = useMemo(() => layoutChapters(chapters, links), [chapters, links])
  const tagChips = useMemo(() => topTags(chapters, 14), [chapters])

  /** Work out a view that shows every node, centred. */
  const fitView = useCallback((): View | null => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || positions.size === 0) return null
    const pts = [...positions.values()]
    const minX = Math.min(...pts.map((p) => p.x)) - NODE_RADIUS
    const maxX = Math.max(...pts.map((p) => p.x)) + NODE_RADIUS
    const minY = Math.min(...pts.map((p) => p.y)) - NODE_RADIUS
    const maxY = Math.max(...pts.map((p) => p.y)) + NODE_RADIUS + 20 // room for labels
    const k = Math.min(1.6, Math.max(0.2, Math.min(r.width / (maxX - minX), r.height / (maxY - minY)) * 0.9))
    return { k, x: r.width / 2 - ((minX + maxX) / 2) * k, y: r.height / 2 - ((minY + maxY) / 2) * k }
  }, [positions, svgRef])

  // On first show: centre on the highlighted chapter, or fit everything.
  useLayoutEffect(() => {
    const r = svgRef.current?.getBoundingClientRect()
    const target = highlightId ? positions.get(highlightId) : undefined
    if (r && target) {
      setView({ k: 1, x: r.width / 2 - target.x, y: r.height / 2 - target.y })
    } else {
      const fit = fitView()
      if (fit) setView(fit)
    }
    // Only on mount: we don't want the view jumping while you look around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const open = (id: string) => {
    if (justDragged.current) return // that was a pan, not a click
    setOpenId(id)
  }

  const onNodeKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpenId(id)
    }
  }

  const openChapter = chapters.find((c) => c.id === openId)
  const dimmed = (tags: string[]) => focusTag !== null && !tags.includes(focusTag)

  return (
    <section className="map-wrap">
      {/* Tag chips: pick one to light up just those chapters. */}
      <div className="map-tags" aria-label="Highlight a tag">
        {tagChips.map(({ label }) => (
          <button
            key={label}
            className={`tag-chip tag-chip-button ${focusTag === label ? 'tag-chip-on' : ''}`}
            style={{ '--chip': inkFor(label) } as CSSProperties}
            onClick={() => setFocusTag(focusTag === label ? null : label)}
            aria-pressed={focusTag === label}
          >
            #{label}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        className="map"
        role="application"
        aria-label="Map of chapters. Drag to move around, scroll to zoom."
        {...handlers}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {/* Lines first, so they sit under the drawings. */}
          {links.map((link) => {
            const a = positions.get(link.a)!
            const b = positions.get(link.b)!
            const faded = focusTag !== null && !link.shared.includes(focusTag)
            return (
              <path
                key={`${link.a}-${link.b}`}
                d={wobblyLine(a, b, link.a + link.b)}
                className={`map-link ${faded ? 'faded' : ''}`}
                stroke={inkFor(link.shared[0])}
                strokeWidth={1.5 + Math.min(link.shared.length, 4) * 1.2}
              >
                <title>{link.shared.map((t) => '#' + t).join(' ')}</title>
              </path>
            )
          })}

          {chapters.map((c) => {
            const p = positions.get(c.id)!
            const isNew = c.id === highlightId
            // Each node gets a small fixed tilt so the map looks hand-placed.
            const tilt = (hashString(c.id) % 21) - 10
            return (
              <g key={c.id} transform={`translate(${p.x} ${p.y})`}>
                <g
                  className={`map-node ${isNew ? 'map-node-new' : ''} ${dimmed(c.tags) ? 'faded' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.title || 'untitled'}, ${c.date}`}
                  onClick={() => open(c.id)}
                  onKeyDown={(e) => onNodeKey(e, c.id)}
                >
                  {isNew && <circle className="map-node-ripple" r={44} stroke={inkFor(c.tags[0])} />}
                  <circle r={44} className="map-node-hit" />
                  <g transform={`rotate(${tilt})`}>
                    <GlyphShape glyph={c.glyph} color={inkFor(c.tags[0])} />
                  </g>
                  <text className="map-node-mood" x={30} y={-26}>
                    {c.mood}
                  </text>
                  <text className="map-node-label" y={56}>
                    {shortLabel(c.title || c.date)}
                  </text>
                </g>
              </g>
            )
          })}
        </g>
      </svg>

      <div className="map-controls">
        <button className="icon-button" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
          +
        </button>
        <button className="icon-button" onClick={() => zoomBy(0.8)} aria-label="Zoom out">
          −
        </button>
        <button
          className="icon-button"
          onClick={() => {
            const fit = fitView()
            if (fit) setView(fit)
          }}
          aria-label="Fit everything in view"
          title="fit to view"
        >
          ⤢
        </button>
      </div>

      <Compass />

      {openChapter && (
        <ChapterModal
          chapter={openChapter}
          onClose={() => setOpenId(null)}
          onTagClick={(t) => {
            setFocusTag(t)
            setOpenId(null)
          }}
        />
      )}
    </section>
  )
}

/** A gently curved line between two points, bent by a fixed per-pair amount. */
function wobblyLine(a: Point, b: Point, seed: string): string {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const bend = ((hashString(seed) % 40) - 20) / 100 // -0.2 .. 0.2 of the length
  const cx = mx - (dy / len) * len * bend
  const cy = my + (dx / len) * len * bend
  return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`
}

/** A doodled compass rose in the corner, purely decorative. */
function Compass() {
  return (
    <svg className="compass" viewBox="-30 -36 60 66" aria-hidden="true">
      <circle r={20} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 4" />
      <path d="M0 -24 L5 0 L0 24 L-5 0 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth={1.5} />
      <path d="M-24 0 L0 4 L24 0 L0 -4 Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
      <text y={-27} textAnchor="middle" className="compass-n">
        N
      </text>
    </svg>
  )
}
