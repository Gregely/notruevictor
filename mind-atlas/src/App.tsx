// The frame around every page: the title, the tabs, dark mode and backups.

import { AtlasProvider, useAtlas } from './lib/store'
import { navigate, useRoute, type Page } from './lib/router'
import { ThemeToggle } from './components/ThemeToggle'
import { Backpack } from './components/Backpack'
import { WritePage } from './pages/WritePage'
import { MapPage } from './pages/MapPage'
import { ThemesPage } from './pages/ThemesPage'
import { ReadPage } from './pages/ReadPage'

const TABS: { page: Page; label: string; icon: string }[] = [
  { page: 'write', label: 'write', icon: '✎' },
  { page: 'map', label: 'map', icon: '✺' },
  { page: 'themes', label: 'themes', icon: '❦' },
  { page: 'read', label: 'read back', icon: '❧' },
]

function Shell() {
  const route = useRoute()
  const { saveFailed } = useAtlas()

  return (
    <div className="app">
      <header className="topbar">
        <a className="logo" href="#/map" aria-label="Mind Atlas, go to the map">
          <span className="logo-mark" aria-hidden="true">
            ✦
          </span>
          Mind Atlas
        </a>

        <nav className="tabs" aria-label="Pages">
          {TABS.map((t) => (
            <button
              key={t.page}
              className={`tab ${route.page === t.page ? 'tab-active' : ''}`}
              aria-current={route.page === t.page ? 'page' : undefined}
              onClick={() => navigate(t.page)}
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        <div className="topbar-tools">
          <Backpack />
          <ThemeToggle />
        </div>
      </header>

      {saveFailed && (
        <p className="save-warning" role="alert">
          Your browser wouldn't let Mind Atlas save (storage might be full or blocked). Use the backpack to export a
          copy.
        </p>
      )}

      <main className="page">
        {/* The key makes each page re-mount (and re-animate) when you switch. */}
        {route.page === 'write' && <WritePage key={route.id ?? 'new'} editId={route.id} />}
        {route.page === 'map' && <MapPage key="map" highlightId={route.id} />}
        {route.page === 'themes' && <ThemesPage />}
        {route.page === 'read' && <ReadPage startId={route.id} />}
      </main>

      {/* Shared SVG filters: a wobble that makes shapes look hand-drawn. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="wobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}

export default function App() {
  return (
    <AtlasProvider>
      <Shell />
    </AtlasProvider>
  )
}
