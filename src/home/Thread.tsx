import { useEffect, useRef } from 'react'
import type { Anchor, AnchorKind, ThreadSamples } from './threadPath'
import { buildThread, catmullRomPath, drawnLength, lengthNearest, makeSamples, pointAtSampled } from './threadPath'
import './thread.css'

const SVG_NS = 'http://www.w3.org/2000/svg'
const KINDS: readonly AnchorKind[] = ['start', 'row', 'card', 'end']

// The Revision Orange thread ("Follow the thread"). One SVG behind <main> covering all of .home:
// reads every [data-thread] anchor in DOM order, laces a spline through them, and draws it with
// scroll via stroke-dashoffset. Pure geometry lives in thread.ts.
export default function Thread() {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const eyeletsRef = useRef<SVGGElement>(null)
  const tipRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const path = pathRef.current
    const eyeletGroup = eyeletsRef.current
    const tip = tipRef.current
    const home = svg?.parentElement
    if (!svg || !path || !eyeletGroup || !tip || !home) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let samples: ThreadSamples | null = null
    let eyeletEls: SVGGElement[] = []
    let eyeletLengths: number[] = []
    let homeTop = 0
    let viewportHeight = window.innerHeight
    let maxScroll = Infinity
    let frame = 0
    let lastLength = -1
    let disposed = false

    const update = () => {
      frame = 0
      if (!samples) return
      const length = reduced.matches
        ? samples.total
        : drawnLength(samples, window.scrollY, viewportHeight, homeTop, maxScroll)
      if (Math.abs(length - lastLength) < 0.25) return
      lastLength = length
      path.style.strokeDashoffset = String(samples.total - length)
      for (let i = 0; i < eyeletEls.length; i++) {
        eyeletEls[i].classList.toggle('is-lit', length >= eyeletLengths[i] - 1)
      }
      const p = pointAtSampled(samples, length)
      tip.style.transform = `translate(${p.x}px, ${p.y}px)`
      tip.style.opacity = !reduced.matches && length > 0 && length < samples.total ? '1' : '0'
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const build = () => {
      if (disposed) return
      const homeRect = home.getBoundingClientRect()
      homeTop = homeRect.top + window.scrollY
      viewportHeight = window.innerHeight
      maxScroll = document.documentElement.scrollHeight - viewportHeight
      const width = home.clientWidth
      const height = home.scrollHeight
      const anchors: Anchor[] = []
      for (const el of home.querySelectorAll<HTMLElement>('[data-thread]')) {
        const kind = el.dataset.thread as AnchorKind
        if (!KINDS.includes(kind)) continue
        const r = el.getBoundingClientRect()
        anchors.push({
          kind,
          left: r.left - homeRect.left,
          top: r.top - homeRect.top,
          width: r.width,
          height: r.height,
        })
      }

      svg.style.height = `${height}px`
      const phone = width <= 720
      const layout = buildThread(anchors, { width, eyeletOffset: 10, loopReach: phone ? 4 : 44, margin: phone ? 2 : 3 })
      path.setAttribute('d', catmullRomPath(layout.points))

      const total = layout.points.length > 1 ? path.getTotalLength() : 0
      if (total <= 0) {
        samples = null
        return
      }
      samples = makeSamples(total, (length) => path.getPointAtLength(length))
      path.style.strokeDasharray = `${total} ${total}`

      eyeletGroup.replaceChildren()
      eyeletEls = []
      eyeletLengths = []
      let from = 0
      for (const eyelet of layout.eyelets) {
        const g = document.createElementNS(SVG_NS, 'g')
        g.setAttribute('class', 'home-thread-eyelet')
        g.setAttribute('transform', `translate(${eyelet.x} ${eyelet.y})`)
        const ring = document.createElementNS(SVG_NS, 'circle')
        ring.setAttribute('class', 'home-thread-ring')
        ring.setAttribute('r', '5')
        const dot = document.createElementNS(SVG_NS, 'circle')
        dot.setAttribute('class', 'home-thread-dot')
        dot.setAttribute('r', '2.4')
        g.append(ring, dot)
        eyeletGroup.append(g)
        eyeletEls.push(g)
        from = lengthNearest(samples, eyelet, from)
        eyeletLengths.push(from)
      }
      lastLength = -1
      update()
    }

    let buildFrame = 0
    const scheduleBuild = () => {
      if (!buildFrame)
        buildFrame = requestAnimationFrame(() => {
          buildFrame = 0
          build()
        })
    }

    build()
    const observer = new ResizeObserver(scheduleBuild)
    observer.observe(home)
    document.fonts?.ready.then(scheduleBuild, () => {})
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', scheduleBuild)
    const onMotion = () => {
      lastLength = -1
      schedule()
    }
    reduced.addEventListener('change', onMotion)

    return () => {
      disposed = true
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', scheduleBuild)
      reduced.removeEventListener('change', onMotion)
      if (frame) cancelAnimationFrame(frame)
      if (buildFrame) cancelAnimationFrame(buildFrame)
      eyeletGroup.replaceChildren()
    }
  }, [])

  return (
    <svg ref={svgRef} className="home-thread" aria-hidden="true" focusable="false">
      <path ref={pathRef} className="home-thread-path" d="" />
      <g ref={eyeletsRef} />
      <circle ref={tipRef} className="home-thread-tip" r="3.5" cx="0" cy="0" />
    </svg>
  )
}
