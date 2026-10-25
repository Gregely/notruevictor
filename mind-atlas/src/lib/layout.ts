// Where each chapter sits on the map.
//
// It's a small "force-directed" layout:
//   - every node gently pushes every other node away,
//   - chapters that share tags are tied together with springs (so they cluster),
//   - a soft pull towards the middle keeps loners from drifting off,
//   - then a tidy-up pass nudges apart any drawings still sitting on top of each other.
// We run the simulation a fixed number of steps from starting spots derived
// from each chapter's id, so the same chapters always give the same map.

import type { Chapter } from '../types'
import { hashString } from './utils'

export interface Point {
  x: number
  y: number
}

export interface Link {
  a: string // chapter id
  b: string // chapter id
  shared: string[] // the tags they have in common
}

// Each chapter keeps lines to at most this many others (its strongest ties).
// Without a cap, a common tag used in 50 chapters would draw 1,225 lines.
const MAX_LINKS_PER_CHAPTER = 4

/**
 * Lines between chapters that share at least one tag.
 * Each chapter keeps only its strongest ties: most shared tags first, then
 * the chapters closest in date. A line survives if either end wants it.
 */
export function findLinks(chapters: Chapter[]): Link[] {
  const days = chapters.map((c) => Date.parse(c.date) / 86_400_000 || 0)
  const tagSets = chapters.map((c) => new Set(c.tags))

  // Every candidate pair, plus a list of candidates per chapter.
  const candidates: (Link & { i: number; j: number })[] = []
  const perChapter: number[][] = chapters.map(() => [])
  for (let i = 0; i < chapters.length; i++) {
    for (let j = i + 1; j < chapters.length; j++) {
      const shared = chapters[j].tags.filter((t) => tagSets[i].has(t))
      if (!shared.length) continue
      perChapter[i].push(candidates.length)
      perChapter[j].push(candidates.length)
      candidates.push({ a: chapters[i].id, b: chapters[j].id, shared, i, j })
    }
  }

  const keep = new Set<number>()
  for (const list of perChapter) {
    list
      .sort((x, y) => {
        const cx = candidates[x]
        const cy = candidates[y]
        return (
          cy.shared.length - cx.shared.length ||
          Math.abs(days[cx.i] - days[cx.j]) - Math.abs(days[cy.i] - days[cy.j])
        )
      })
      .slice(0, MAX_LINKS_PER_CHAPTER)
      .forEach((k) => keep.add(k))
  }

  return [...keep].sort((x, y) => x - y).map((k) => ({ a: candidates[k].a, b: candidates[k].b, shared: candidates[k].shared }))
}

// Tuning knobs. Bigger REPEL = more space; bigger SPRING = tighter clusters.
const REPEL = 20000
const SPRING = 0.02
const SPRING_LENGTH = 140
const GRAVITY = 0.012
const MIN_GAP = 110 // nodes closer than this get pushed extra hard
const TIDY_PASSES = 50

export function layoutChapters(chapters: Chapter[], links: Link[]): Map<string, Point> {
  const n = chapters.length
  const index = new Map(chapters.map((c, i) => [c.id, i]))

  // Positions and forces live in plain arrays (fast); xs[i], ys[i] is chapter i.
  const xs: number[] = []
  const ys: number[] = []

  // Starting spots: a deterministic scatter around the middle.
  const spread = 80 + Math.sqrt(n) * 70
  for (const c of chapters) {
    const h = hashString(c.id)
    const angle = ((h % 3600) / 3600) * Math.PI * 2
    const radius = (((h >>> 12) % 1000) / 1000) * spread
    xs.push(Math.cos(angle) * radius)
    ys.push(Math.sin(angle) * radius)
  }

  const springs = links.map((l) => ({ i: index.get(l.a)!, j: index.get(l.b)!, strength: Math.min(l.shared.length, 3) }))
  // Fewer steps for big journals so the map still opens quickly.
  const steps = n > 300 ? 120 : 260

  for (let step = 0; step < steps; step++) {
    const cooling = 1 - step / steps // moves get smaller as things settle
    const fx = new Array<number>(n).fill(0)
    const fy = new Array<number>(n).fill(0)

    // 1. Everyone repels everyone.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = xs[i] - xs[j]
        let dy = ys[i] - ys[j]
        let d2 = dx * dx + dy * dy
        if (d2 < 0.01) {
          dx = i % 2 ? 0.5 : -0.5 // two nodes in exactly the same spot: nudge apart
          dy = j % 2 ? 0.5 : -0.5
          d2 = 0.01
        }
        const d = Math.sqrt(d2)
        let push = REPEL / d2
        if (d < MIN_GAP) push += (MIN_GAP - d) * 0.5
        const px = (dx / d) * push
        const py = (dy / d) * push
        fx[i] += px
        fy[i] += py
        fx[j] -= px
        fy[j] -= py
      }
    }

    // 2. Shared tags pull together (more shared tags = stronger pull).
    for (const { i, j, strength } of springs) {
      const dx = xs[j] - xs[i]
      const dy = ys[j] - ys[i]
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const pull = (d - SPRING_LENGTH) * SPRING * strength
      fx[i] += (dx / d) * pull
      fy[i] += (dy / d) * pull
      fx[j] -= (dx / d) * pull
      fy[j] -= (dy / d) * pull
    }

    // 3. Gentle gravity towards the centre, then move.
    const limit = 30 * cooling + 1 // never move too far in one step
    for (let i = 0; i < n; i++) {
      fx[i] -= xs[i] * GRAVITY
      fy[i] -= ys[i] * GRAVITY
      xs[i] += Math.max(-limit, Math.min(limit, fx[i]))
      ys[i] += Math.max(-limit, Math.min(limit, fy[i]))
    }
  }

  // 4. Tidy up: push any overlapping pair apart until they're MIN_GAP apart.
  for (let pass = 0; pass < TIDY_PASSES; pass++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = xs[j] - xs[i]
        const dy = ys[j] - ys[i]
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01
        if (d >= MIN_GAP) continue
        const half = (MIN_GAP - d) / 2 // each node moves half the overlap
        xs[i] -= (dx / d) * half
        ys[i] -= (dy / d) * half
        xs[j] += (dx / d) * half
        ys[j] += (dy / d) * half
        moved = true
      }
    }
    if (!moved) break
  }

  return new Map(chapters.map((c, i) => [c.id, { x: xs[i], y: ys[i] }]))
}
