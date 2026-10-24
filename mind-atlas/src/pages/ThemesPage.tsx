// Themes: your most-used tags as a pile of bubbles, your most-used words as
// crayon bars, and a jar of moods.

import { useMemo, type CSSProperties } from 'react'
import { useAtlas } from '../lib/store'
import { navigate } from '../lib/router'
import { inkFor } from '../lib/utils'
import { moodCounts, topTags, topWords, type Count } from '../lib/words'

export function ThemesPage() {
  const { chapters } = useAtlas()
  const tags = useMemo(() => topTags(chapters), [chapters])
  const words = useMemo(() => topWords(chapters), [chapters])
  const moods = useMemo(() => moodCounts(chapters), [chapters])

  if (chapters.length === 0) {
    return (
      <section className="paper-card empty">
        <p>Themes show up here once there are chapters.</p>
        <button className="button button-big" onClick={() => navigate('write')}>
          ✎ write a chapter
        </button>
      </section>
    )
  }

  return (
    <div className="themes">
      <section className="paper-card themes-card">
        <h2 className="scribble-heading">tags</h2>
        {tags.length ? <TagBubbles tags={tags} /> : <p className="muted">No tags yet.</p>}
      </section>

      <section className="paper-card themes-card">
        <h2 className="scribble-heading">words</h2>
        {words.length ? <WordBars words={words} /> : <p className="muted">Not enough words yet.</p>}
      </section>

      <section className="paper-card themes-card">
        <h2 className="scribble-heading">moods</h2>
        <div className="mood-jar">
          {moods.map((m, i) => (
            <span
              key={m.label}
              className="mood-jar-item"
              // Bigger emoji for moods that come up more; staggered pop-in.
              style={{ fontSize: `${1.4 + (m.count / moods[0].count) * 2}rem`, animationDelay: `${i * 70}ms` }}
              title={`${m.count} chapter${m.count === 1 ? '' : 's'}`}
            >
              {m.label}
              <small>×{m.count}</small>
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

// ---- tag bubbles -------------------------------------------------------------

interface Bubble extends Count {
  x: number
  y: number
  r: number
}

/**
 * Pack bubbles loosely: biggest in the middle, each next one walks out along
 * a spiral until it finds a spot where it doesn't overlap anything.
 */
function packBubbles(tags: Count[]): Bubble[] {
  const max = tags[0]?.count ?? 1
  const placed: Bubble[] = []
  for (const t of tags) {
    const r = 26 + Math.sqrt(t.count / max) * 50
    let angle = 0
    let x = 0
    let y = 0
    // Step along the spiral; 2000 steps is far more than ever needed.
    for (let step = 0; step < 2000; step++) {
      const dist = step * 1.5
      x = Math.cos(angle) * dist
      y = Math.sin(angle) * dist * 0.7 // squash a bit: the page is wider than tall
      if (placed.every((b) => Math.hypot(b.x - x, b.y - y) > b.r + r + 6)) break
      angle += 0.35
    }
    placed.push({ ...t, x, y, r })
  }
  return placed
}

function TagBubbles({ tags }: { tags: Count[] }) {
  const bubbles = packBubbles(tags)
  // Frame the viewBox around whatever got placed.
  const pad = 10
  const minX = Math.min(...bubbles.map((b) => b.x - b.r)) - pad
  const maxX = Math.max(...bubbles.map((b) => b.x + b.r)) + pad
  const minY = Math.min(...bubbles.map((b) => b.y - b.r)) - pad
  const maxY = Math.max(...bubbles.map((b) => b.y + b.r)) + pad

  return (
    <svg className="bubbles" viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="img" aria-label="Most-used tags">
      {bubbles.map((b, i) => (
        <g key={b.label} transform={`translate(${b.x} ${b.y})`}>
          <g className="bubble" style={{ animationDelay: `${i * 60}ms` } as CSSProperties}>
            <circle r={b.r} fill={inkFor(b.label)} className="bubble-fill" filter="url(#wobble)" />
            <circle r={b.r - 5} fill="none" className="bubble-ring" />
            <text className="bubble-label" y={-2} style={{ fontSize: Math.max(13, b.r / 3) }}>
              #{b.label.length > 14 ? b.label.slice(0, 13) + '…' : b.label}
            </text>
            <text className="bubble-count" y={Math.max(13, b.r / 3) + 2}>
              {b.count}
            </text>
            <title>
              #{b.label}: {b.count} chapter{b.count === 1 ? '' : 's'}
            </title>
          </g>
        </g>
      ))}
    </svg>
  )
}

// ---- word bars ---------------------------------------------------------------

const BAR_START = 130 // where bars begin (labels sit to the left)
const BAR_MAX = 420 // the longest bar's length
const ROW = 36

function WordBars({ words }: { words: Count[] }) {
  const max = words[0].count
  const colors = ['#e07a5f', '#f2a541', '#3d8b7d', '#8e6bbf', '#5b8bd9', '#d1495b']
  return (
    <svg className="word-bars" viewBox={`0 0 600 ${words.length * ROW + 10}`} role="img" aria-label="Most-used words">
      {words.map((w, i) => {
        const len = Math.max(14, (w.count / max) * BAR_MAX)
        const y = i * ROW + 8
        // A crayon stroke: a lumpy rounded rectangle, slightly tilted.
        const d = `M${BAR_START} ${y + 4} q${len / 2} -4 ${len} 1 q4 9 -1 17 q${-len / 2} 4 ${-len} -1 q-4 -8 1 -17 Z`
        return (
          <g key={w.label} className="word-row" style={{ animationDelay: `${i * 50}ms` } as CSSProperties}>
            <text className="word-label" x={BAR_START - 12} y={y + 18}>
              {w.label}
            </text>
            <path d={d} className="word-bar" fill={colors[i % colors.length]} filter="url(#wobble)" transform={`rotate(${(i % 2 ? 0.6 : -0.6)} ${BAR_START} ${y})`} />
            <text className="word-count" x={BAR_START + len + 10} y={y + 18}>
              {w.count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
