// A tiny hash router, so pages have their own URLs without a server.
//   #/write          new chapter
//   #/write/<id>     edit a chapter
//   #/map            the map
//   #/map/<id>       the map, with that chapter highlighted
//   #/themes         tags & words
//   #/read           reading back from the first chapter
//   #/read/<id>      reading back from that chapter

import { useEffect, useState } from 'react'

export type Page = 'write' | 'map' | 'themes' | 'read'

export interface Route {
  page: Page
  id?: string
}

const PAGES: Page[] = ['write', 'map', 'themes', 'read']

function parse(hash: string): Route {
  const [page, id] = hash.replace(/^#\/?/, '').split('/')
  if (PAGES.includes(page as Page)) return { page: page as Page, id: id ? decodeURIComponent(id) : undefined }
  return { page: 'map' }
}

/** The current route; re-renders when the URL hash changes. */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

/** Go somewhere: navigate('read', chapter.id) */
export function navigate(page: Page, id?: string): void {
  window.location.hash = `/${page}${id ? '/' + encodeURIComponent(id) : ''}`
}
