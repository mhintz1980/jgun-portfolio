import { useEffect, useRef, useState } from 'react'
import { CONTACT } from './content'
import { REACH, createRope, easeInOutCubic, endDirection, freeEnd, freeze, isSolved, maxSpeed, step } from './rope'
import type { Rope, Vec } from './rope'
import './rope.css'

// "Pull to untangle" (JG-039 W4). The page's orange thread arrives here tangled; the visitor drags
// the needle at the free end until the thread runs straight. The links below are never gated on it.
// Owns the [data-thread="end"] anchor, kept exactly on the rope's pinned left end.

const POINTS = 60
const ANCHOR_X = 6
const NEEDLE = 24
const RIGHT_ROOM = NEEDLE + 14
const PULL_MS = 1200
const DT = 1 / 60
const SETTLE_FRAMES = 150

interface Geometry {
  width: number
  height: number
  anchor: Vec
  length: number
}

function geometry(width: number): Geometry {
  const height = width < 600 ? 180 : 220
  const anchor = { x: ANCHOR_X, y: Math.round(height / 2) }
  const length = Math.max(60, (width - RIGHT_ROOM - ANCHOR_X) / REACH)
  return { width, height, anchor, length }
}

function buildRope(g: Geometry, straight: boolean): Rope {
  return createRope({
    anchor: g.anchor,
    length: g.length,
    points: POINTS,
    layout: straight ? 'straight' : 'tangled',
    maxHeight: g.height - 32,
    bounds: { minX: 0, minY: 6, maxX: g.width - 4, maxY: g.height - 6 },
  })
}

export default function ContactRope() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const pullRef = useRef<() => void>(() => {})
  const [solved, setSolved] = useState(false)
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const anchorEl = anchorRef.current
    const handle = handleRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !anchorEl || !handle || !ctx) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let still = motion.matches
    let g = geometry(Math.round(wrap.clientWidth) || 320)
    let done = still
    let rope = buildRope(g, done)
    let pin: Vec | null = done ? freeEnd(rope) : null
    let dragging = false
    let grab: Vec = { x: 0, y: 0 }
    let anim: { from: Vec; to: Vec; start: number } | null = null
    let inView = false
    let raf = 0
    let quiet = 0
    let idle = 0
    let settled = true
    let ink = '#14181d'
    let accent = '#c2410c'

    const readColors = () => {
      const css = getComputedStyle(wrap)
      accent = css.getPropertyValue('--accent').trim() || accent
      ink = css.getPropertyValue('--ink').trim() || ink
    }

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      canvas.width = Math.round(g.width * dpr)
      canvas.height = Math.round(g.height * dpr)
      canvas.style.height = `${g.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      anchorEl.style.left = `${g.anchor.x}px`
      anchorEl.style.top = `${g.anchor.y}px`
    }

    const draw = () => {
      ctx.clearRect(0, 0, g.width, g.height)
      const { x, y } = rope
      const n = x.length
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      // Thread: quadratic curves through segment midpoints, so 60 points read as one smooth line.
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x[0], y[0])
      for (let i = 1; i < n - 1; i++) ctx.quadraticCurveTo(x[i], y[i], (x[i] + x[i + 1]) / 2, (y[i] + y[i + 1]) / 2)
      ctx.lineTo(x[n - 1], y[n - 1])
      ctx.stroke()
      // Needle: the thread runs through an elongated eye; the shaft points the way it is pulled.
      const e = freeEnd(rope)
      const d = endDirection(rope)
      const angle = Math.atan2(d.y, d.x)
      ctx.strokeStyle = ink
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.ellipse(e.x + d.x * 1.5, e.y + d.y * 1.5, 5, 2, angle, 0, Math.PI * 2)
      ctx.stroke()
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(e.x + d.x * 7, e.y + d.y * 7)
      ctx.lineTo(e.x + d.x * NEEDLE, e.y + d.y * NEEDLE)
      ctx.stroke()
      // Grab area centred on the needle.
      const hx = e.x + d.x * (NEEDLE / 2)
      const hy = e.y + d.y * (NEEDLE / 2)
      handle.style.transform = `translate(${hx - 22}px, ${hy - 22}px)`
    }

    const markSolved = () => {
      if (!done && isSolved(rope)) {
        done = true
        setSolved(true)
      }
    }

    const frame = (now: number) => {
      raf = 0
      if (anim) {
        const f = easeInOutCubic((now - anim.start) / PULL_MS)
        pin = { x: anim.from.x + (anim.to.x - anim.from.x) * f, y: anim.from.y + (anim.to.y - anim.from.y) * f }
        if (f >= 1) anim = null
      }
      step(rope, DT, pin)
      draw()
      markSolved()
      // A nearly taut rope creeps for seconds below a pixel per frame; stop once it is still, or
      // SETTLE_FRAMES after the last input, whichever comes first.
      if (dragging || anim) {
        quiet = 0
        idle = 0
      } else {
        idle++
        quiet = maxSpeed(rope) < 0.03 ? quiet + 1 : 0
      }
      if (quiet >= 12 || idle >= SETTLE_FRAMES) {
        freeze(rope)
        settled = true
        return
      }
      if (inView) raf = requestAnimationFrame(frame)
    }

    // Input wakes the loop; it then runs only while in view and until settled.
    const kick = () => {
      quiet = 0
      idle = 0
      settled = false
      if (!raf && inView && !still) raf = requestAnimationFrame(frame)
    }

    const rebuild = () => {
      g = geometry(Math.round(wrap.clientWidth) || g.width)
      rope = buildRope(g, done)
      freeze(rope)
      pin = done ? freeEnd(rope) : null
      anim = null
      size()
      draw()
    }

    const local = (event: PointerEvent): Vec => {
      const r = canvas.getBoundingClientRect()
      return { x: event.clientX - r.left, y: event.clientY - r.top }
    }

    const onDown = (event: PointerEvent) => {
      if (still || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.preventDefault()
      handle.setPointerCapture(event.pointerId)
      const p = local(event)
      const e = freeEnd(rope)
      grab = { x: p.x - e.x, y: p.y - e.y }
      dragging = true
      anim = null
      pin = e
      handle.classList.add('is-dragging')
      kick()
    }
    const onMove = (event: PointerEvent) => {
      if (!dragging) return
      const p = local(event)
      pin = { x: p.x - grab.x, y: p.y - grab.y }
      kick()
    }
    const onUp = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      handle.classList.remove('is-dragging')
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
      // The needle stays where it was let go; the thread settles behind it.
      pin = freeEnd(rope)
      kick()
    }

    pullRef.current = () => {
      if (still || done) return
      dragging = false
      anim = {
        from: freeEnd(rope),
        to: { x: g.anchor.x + g.length * REACH, y: g.anchor.y },
        start: performance.now(),
      }
      inView = true
      kick()
    }

    const onMotion = () => {
      still = motion.matches
      setReduced(still)
      if (still) {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        done = true
        setSolved(true)
      }
      rebuild()
    }

    readColors()
    size()
    draw()

    const resize = new ResizeObserver(() => {
      if (Math.round(wrap.clientWidth) !== g.width) rebuild()
    })
    resize.observe(wrap)
    const view = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView && !settled && !raf && !still) raf = requestAnimationFrame(frame)
    })
    view.observe(canvas)
    const theme = new MutationObserver(() => {
      readColors()
      draw()
    })
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    motion.addEventListener('change', onMotion)
    handle.addEventListener('pointerdown', onDown)
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
    handle.addEventListener('pointercancel', onUp)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      resize.disconnect()
      view.disconnect()
      theme.disconnect()
      motion.removeEventListener('change', onMotion)
      handle.removeEventListener('pointerdown', onDown)
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      handle.removeEventListener('pointercancel', onUp)
      pullRef.current = () => {}
    }
  }, [])

  const straight = solved || reduced
  return (
    <div className={`home-rope${straight ? ' is-solved' : ''}${reduced ? ' is-still' : ''}`}>
      <div className="home-rope-stage" ref={wrapRef}>
        <canvas className="home-rope-canvas" ref={canvasRef} aria-hidden="true" />
        <span className="home-rope-anchor" data-thread="end" ref={anchorRef} aria-hidden="true" />
        <div className="home-rope-handle" ref={handleRef} aria-hidden="true" />
      </div>
      <div className="home-rope-foot">
        <p className="home-rope-caption" aria-live="polite">
          {straight ? CONTACT.pulled : CONTACT.pull}
        </p>
        {!reduced && (
          <button type="button" className="home-rope-button" aria-disabled={solved} onClick={() => pullRef.current()}>
            {solved ? 'Pulled' : CONTACT.pull}
          </button>
        )}
      </div>
    </div>
  )
}
