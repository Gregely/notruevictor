// Day paper / night paper switch. Remembers your choice in this browser;
// until you pick, it follows your system setting.

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const KEY = 'mind-atlas:theme'

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage blocked: fall through to the system setting
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // The CSS colours hang off <html data-theme="...">.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // not fatal; it just won't be remembered
    }
  }

  return (
    <button
      className="icon-button theme-toggle"
      onClick={flip}
      aria-label={theme === 'dark' ? 'Switch to day paper' : 'Switch to night paper'}
      title={theme === 'dark' ? 'day paper' : 'night paper'}
    >
      <span key={theme} className="theme-icon" aria-hidden="true">
        {theme === 'dark' ? '☾' : '☀'}
      </span>
    </button>
  )
}
