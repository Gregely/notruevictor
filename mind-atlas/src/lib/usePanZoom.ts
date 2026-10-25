// Drag to pan, scroll / pinch to zoom, for an <svg> with one transformed <g>.
//
// The view is { x, y, k }: a point in "map space" appears on screen at
//   screen = map * k + (x, y)

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

export interface View {
  x: number
  y: number
  k: number
}

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3
const DRAG_THRESHOLD = 5 // pixels before a press counts as a drag, not a click

const clampZoom = (k: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k))

export function usePanZoom() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })

  // Pointers currently pressed, so we can tell a drag from a pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const start = useRef<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  /** True right after a drag, so the click that follows doesn't open a node. */
  const justDragged = useRef(false)
  const pinchDistance = useRef(0)

  /** Zoom by `factor`, keeping the screen point (px, py) still. */
  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    setView((v) => {
      const k = clampZoom(v.k * factor)
      const ratio = k / v.k
      return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }
    })
  }, [])

  /** Zoom around the middle of the svg (for the + / − buttons). */
  const zoomBy = useCallback(
    (factor: number) => {
      const r = svgRef.current?.getBoundingClientRect()
      if (r) zoomAt(factor, r.width / 2, r.height / 2)
    },
    [zoomAt],
  )

  // Wheel zoom. Added by hand because React's onWheel can't preventDefault.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = svg.getBoundingClientRect()
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const local = (e: PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, local(e))
    start.current = local(e)
    dragging.current = false
    justDragged.current = false
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const now = local(e)
    pointers.current.set(e.pointerId, now)

    // Two fingers: pinch zoom around their midpoint.
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDistance.current > 0) zoomAt(d / pinchDistance.current, (a.x + b.x) / 2, (a.y + b.y) / 2)
      pinchDistance.current = d
      dragging.current = true
      return
    }

    // One pointer: only start panning once it has moved a little.
    if (!dragging.current && start.current) {
      if (Math.hypot(now.x - start.current.x, now.y - start.current.y) < DRAG_THRESHOLD) return
      dragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setView((v) => ({ ...v, x: v.x + now.x - prev.x, y: v.y + now.y - prev.y }))
  }

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchDistance.current = 0
    if (pointers.current.size === 0) {
      justDragged.current = dragging.current
      dragging.current = false
      start.current = null
    }
  }

  return {
    svgRef,
    view,
    setView,
    zoomBy,
    justDragged,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
