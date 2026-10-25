// Counting things for the Themes page.

import type { Chapter } from '../types'

export interface Count {
  label: string
  count: number
}

/** Sort a Map of counts, biggest first, and keep the top `limit`. */
function top(counts: Map<string, number>, limit: number): Count[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}

/** How many chapters use each tag. */
export function topTags(chapters: Chapter[], limit = 18): Count[] {
  const counts = new Map<string, number>()
  for (const c of chapters) for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return top(counts, limit)
}

/** How many chapters were written in each mood. */
export function moodCounts(chapters: Chapter[]): Count[] {
  const counts = new Map<string, number>()
  for (const c of chapters) counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1)
  return top(counts, 20)
}

// Little words that would otherwise win every time. Add your own to hide them.
const STOP_WORDS = new Set(
  `a about above after again against all also am an and any are aren't as at be because been before being
  below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during
  each even ever few for from further get got had hadn't has hasn't have haven't having he he'd he'll he's her
  here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself
  just let's like me more most much must mustn't my myself no nor not now of off on once only or other ought our
  ours ourselves out over own really same shan't she she'd she'll she's should shouldn't so some still such than
  that that's the their theirs them themselves then there there's these they they'd they'll they're they've this
  those through to too under until up upon us very was wasn't we we'd we'll we're we've were weren't what what's
  when when's where where's which while who who's whom why why's will with won't would wouldn't yet you you'd
  you'll you're you've your yours yourself yourselves one two lot lots thing things bit maybe kind sort going
  went go goes gonna wanna really got get gets day today yesterday tomorrow`.split(/\s+/),
)

/** The words used most across all titles and bodies (ignoring little words). */
export function topWords(chapters: Chapter[], limit = 14): Count[] {
  const counts = new Map<string, number>()
  for (const c of chapters) {
    const words = `${c.title} ${c.body}`
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .match(/[\p{L}][\p{L}'-]*/gu)
    for (const raw of words ?? []) {
      const w = raw.replace(/^['-]+|['-]+$/g, '').replace(/'s$/, '')
      if (w.length < 3 || STOP_WORDS.has(w)) continue
      counts.set(w, (counts.get(w) ?? 0) + 1)
    }
  }
  return top(counts, limit)
}
