// The backpack: export all chapters to a JSON file, or bring a file back in.

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAtlas } from '../lib/store'
import { exportChapters, parseAtlas } from '../lib/storage'

export function Backpack() {
  const { chapters, importChapters } = useAtlas()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const modeRef = useRef<'merge' | 'replace'>('merge')
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close when clicking anywhere else, pressing Escape, or changing page.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onHash = () => setOpen(false)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
    }
  }, [open])

  // Ask for a file; what happens next depends on which button was pressed.
  const pickFile = (mode: 'merge' | 'replace') => {
    modeRef.current = mode
    setMessage('')
    fileInput.current?.click()
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so picking the same file again still triggers
    if (!file) return
    try {
      const incoming = parseAtlas(await file.text())
      const mode = modeRef.current
      if (
        mode === 'replace' &&
        chapters.length > 0 &&
        !window.confirm(`Replace your ${chapters.length} chapter(s) with the ${incoming.length} in this file?`)
      ) {
        return
      }
      importChapters(incoming, mode)
      setMessage(`Brought in ${incoming.length} chapter(s).`)
    } catch (err) {
      if (err instanceof SyntaxError) setMessage("That file isn't valid JSON.")
      else setMessage(err instanceof Error ? err.message : "Couldn't read that file.")
    }
  }

  return (
    <div className="backpack" ref={wrapRef}>
      <button
        className="icon-button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Backpack: export and import"
        title="backpack (export / import)"
      >
        <span aria-hidden="true">🎒</span>
      </button>

      {open && (
        <div className="backpack-panel doodle-box pop-in" role="dialog" aria-label="Export and import">
          <p className="backpack-title">backpack</p>
          <button className="button" onClick={() => exportChapters(chapters)} disabled={chapters.length === 0}>
            ⬇ export as JSON
          </button>
          <button className="button" onClick={() => pickFile('merge')}>
            ⬆ import &amp; merge
          </button>
          <button className="button button-quiet" onClick={() => pickFile('replace')}>
            ⬆ import &amp; replace all
          </button>
          {message && <p className="backpack-message">{message}</p>}
          <button className="link-button" onClick={() => setOpen(false)}>
            close
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} />
        </div>
      )}
    </div>
  )
}
