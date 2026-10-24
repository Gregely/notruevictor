// Free-form tags. Type a word and press Enter (or a comma) to add it.
// Backspace in an empty box removes the last tag.

import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { cleanTag, inkFor } from '../lib/utils'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions: string[] // tags already used in other chapters
}

export function TagInput({ tags, onChange, suggestions }: Props) {
  const [text, setText] = useState('')

  const add = (raw: string) => {
    // Allow pasting "a, b, c" in one go.
    const fresh = raw.split(',').map(cleanTag).filter((t) => t && !tags.includes(t))
    if (fresh.length) onChange([...tags, ...new Set(fresh)])
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && text.trim()) {
      e.preventDefault()
      add(text)
    } else if (e.key === 'Backspace' && !text && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="tag-input doodle-box-soft">
      {tags.map((t) => (
        <span key={t} className="tag-chip" style={{ '--chip': inkFor(t) } as CSSProperties}>
          #{t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => text.trim() && add(text)}
        list="known-tags"
        placeholder={tags.length ? '' : 'tags…'}
        aria-label="Add a tag"
      />
      <datalist id="known-tags">
        {suggestions
          .filter((s) => !tags.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  )
}
