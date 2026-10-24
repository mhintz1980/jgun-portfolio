import { useEffect, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { ShaftStoryLayer } from '../../components/ShaftStoryLayer'
import {
  TORQUE_HOTSPOTS, isTorqueHotspotActiveForSample, layoutTorqueCallouts, readTorqueOverlaySample,
  requestTorquePartFocus, torqueCalloutReveal, type CalloutInput, type TorqueFcfCell, type TorqueHotspotId,
} from './hotspotData'
import './torque-inspection-overlay.css'

const SHAFT_UPDATE_MS = 1000 / 15

const glyphStroke = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}
/** Y14.5 characteristic glyphs (20x20), same construction as main's ToleranceStations. */
const GLYPH: Record<'DIAMETER' | 'TOTAL_RUNOUT', ReactElement> = {
  DIAMETER: <><circle cx="10" cy="10" r="5.6" {...glyphStroke} /><path d="M4 16 L16 4" {...glyphStroke} /></>,
  TOTAL_RUNOUT: <>
    <path d="M2.5 17.5 H17.5" {...glyphStroke} />
    <path d="M3.5 17.5 L11 5 M9.5 17.5 L17 5" {...glyphStroke} />
    <path d="M11 5 L7.6 6.4 M11 5 L11.6 8.6 M17 5 L13.6 6.4 M17 5 L17.6 8.6" {...glyphStroke} />
  </>,
}

function Frame({ cells, label }: { cells: readonly TorqueFcfCell[]; label: string }) {
  return <span className="torque-callout-fcf" role="img" aria-label={label}>
    {cells.map((cell, i) => <span key={i} className={`torque-callout-fcf-cell is-${cell.kind}`} aria-hidden="true">
      {cell.kind === 'symbol'
        ? <svg viewBox="0 0 20 20" focusable="false">{GLYPH[cell.symbol]}</svg>
        : cell.text}
    </span>)}
  </span>
}

/** DOM only: leaders track every rendered frame; the existing shaft presentation is capped
 * at 15 Hz. Nothing subscribes React inside Canvas or calls the allocating debug snapshot.
 *
 * Doc45 Issue 5: one engineering callout at a time in the style of main's ToleranceStations
 * (cream ink, segmented FCF, amber reticle, anchor -> elbow -> shelf leader). Cards sit beside
 * their own anchor instead of a shared right-hand rail, so leaders never cross.
 */
export function TorqueInspectionOverlay() {
  const root = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLElement | null)[]>([])
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const leaders = useRef<(SVGPolylineElement | null)[]>([])
  const reticles = useRef<(SVGGElement | null)[]>([])
  const selectedRef = useRef<TorqueHotspotId | null>(null)
  const focusRequest = useRef({ at: 0, acknowledged: false })
  const [selected, setSelected] = useState<TorqueHotspotId | null>(null)
  const [shaft, setShaft] = useState({ visible: false, time: 0 })

  const select = (id: TorqueHotspotId | null) => {
    selectedRef.current = id
    focusRequest.current.at = performance.now()
    focusRequest.current.acknowledged = false
    setSelected(id)
    requestTorquePartFocus(id)
  }

  useEffect(() => {
    let raf = 0, lastShaftUpdate = -Infinity, lastTime = -1, shaftVisible = false
    let sizeDirty = true
    const sizes = TORQUE_HOTSPOTS.map(() => ({ width: 0, height: 0 }))
    const lastAnchor = TORQUE_HOTSPOTS.map(() => ({ x: NaN, y: NaN }))
    const observer = new ResizeObserver(() => { sizeDirty = true })
    for (const card of cards.current) if (card) observer.observe(card)
    const resize = () => { sizeDirty = true }
    window.addEventListener('resize', resize)

    const restoreFocus = (id: TorqueHotspotId) => {
      const button = buttons.current[TORQUE_HOTSPOTS.findIndex(hotspot => hotspot.id === id)]
      if (button && !button.closest('[hidden]')) button.focus({ preventScroll: true })
      else document.getElementById('torque-story')?.focus({ preventScroll: true })
    }
    const close = (restore: boolean) => {
      const previous = selectedRef.current
      if (!previous) return
      selectedRef.current = null
      setSelected(null)
      requestTorquePartFocus(null)
      if (restore) restoreFocus(previous)
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedRef.current) close(true)
    }
    window.addEventListener('keydown', keydown)

    const shown: boolean[] = TORQUE_HOTSPOTS.map(() => false)
    const anchorVisible: boolean[] = TORQUE_HOTSPOTS.map(() => false)
    const inputs: CalloutInput[] = []

    const tick = (now: number) => {
      raf = 0
      if (document.hidden) return
      const sample = readTorqueOverlaySample()
      const showShaft = Boolean(sample && sample.studyVisible && Number.isFinite(sample.subjectTime))
      if (showShaft && sample) {
        if (now - lastShaftUpdate >= SHAFT_UPDATE_MS) {
          const time = Math.round(sample.subjectTime * 15) / 15
          if (!shaftVisible || time !== lastTime) setShaft({ visible: true, time })
          shaftVisible = true
          lastTime = time
          lastShaftUpdate = now
        }
      } else if (shaftVisible) {
        shaftVisible = false
        setShaft({ visible: false, time: 0 })
      }

      inputs.length = 0
      for (let i = 0; i < TORQUE_HOTSPOTS.length; i++) {
        const hotspot = TORQUE_HOTSPOTS[i]
        const anchor = sample?.anchors.find(item => item.id === hotspot.id)
        // Same gate RuntimeWorld uses: own beat window only, never inside a special sequence.
        const active = Boolean(sample && !showShaft && isTorqueHotspotActiveForSample(hotspot.id, sample))
        const onScreen = Boolean(anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y) &&
          anchor.x >= 0 && anchor.x <= innerWidth && anchor.y >= 0 && anchor.y <= innerHeight)
        const visible = Boolean(active && anchor?.visible && onScreen)
        const focusing = active && selectedRef.current === hotspot.id
          && (sample?.focusId === hotspot.id || (!focusRequest.current.acknowledged && now - focusRequest.current.at < 300))
        const card = cards.current[i]
        // Preserve a real keyboard destination while the focus camera clears an occluder,
        // but only inside this callout's own window.
        const keyboardFocus = Boolean(active && card?.contains(document.activeElement))
        const showCard = visible || focusing || keyboardFocus
        if (card && card.hidden === showCard) {
          card.hidden = !showCard
          sizeDirty = true
        }
        shown[i] = showCard
        anchorVisible[i] = visible
        if (anchor && onScreen) { lastAnchor[i].x = anchor.x; lastAnchor[i].y = anchor.y }
        if (!visible) {
          if (selectedRef.current === hotspot.id && !focusing) close(Boolean(card?.contains(document.activeElement)))
          else if (!focusing && !keyboardFocus && card?.contains(document.activeElement)) restoreFocus(hotspot.id)
        }
      }
      // Measure only after visibility/size changes, never a layout read per moving anchor.
      if (sizeDirty) {
        for (let i = 0; i < cards.current.length; i++) {
          const card = cards.current[i]
          if (!card || card.hidden) continue
          sizes[i].width = card.offsetWidth
          sizes[i].height = card.offsetHeight
        }
        sizeDirty = false
      }
      // Priority: the selected part first, then narrative order. The layout drops anything that
      // would cross, so a second card can never put a crossing leader on screen.
      const order = TORQUE_HOTSPOTS.map((_, i) => i)
      if (selectedRef.current) order.sort((a, b) => Number(TORQUE_HOTSPOTS[b].id === selectedRef.current) - Number(TORQUE_HOTSPOTS[a].id === selectedRef.current))
      for (const i of order) {
        if (!shown[i] || !Number.isFinite(lastAnchor[i].x)) continue
        inputs.push({ id: TORQUE_HOTSPOTS[i].id, anchor: lastAnchor[i], width: sizes[i].width, height: sizes[i].height })
      }
      const narrow = innerWidth < 600
      const placements = layoutTorqueCallouts(inputs, {
        width: innerWidth, height: innerHeight,
        top: narrow ? 16 : 24, bottom: narrow ? 104 : 96, side: narrow ? 12 : 28,
      })
      for (let i = 0; i < TORQUE_HOTSPOTS.length; i++) {
        const hotspot = TORQUE_HOTSPOTS[i]
        const card = cards.current[i]
        const line = leaders.current[i]
        const reticle = reticles.current[i]
        const placement = placements.find(item => item.id === hotspot.id)
        const focused = selectedRef.current === hotspot.id || Boolean(card?.contains(document.activeElement))
        const reveal = focused ? 1 : torqueCalloutReveal(hotspot.id, sample?.progress ?? 0)
        if (card) {
          if (placement && shown[i]) {
            card.style.transform = `translate3d(${placement.left.toFixed(1)}px, ${placement.top.toFixed(1)}px, 0)`
            card.dataset.side = placement.side > 0 ? 'right' : 'left'
            card.style.opacity = String(Math.min(1, reveal * 1.6))
            card.style.visibility = 'visible'
          } else if (!card.hidden) {
            // Laid out away (would cross another leader): keep it out of sight, still focusable
            // only if it already holds focus.
            card.style.visibility = card.contains(document.activeElement) ? 'visible' : 'hidden'
          }
        }
        const drawLeader = Boolean(placement && anchorVisible[i])
        line?.setAttribute('visibility', drawLeader ? 'visible' : 'hidden')
        reticle?.setAttribute('visibility', drawLeader ? 'visible' : 'hidden')
        if (!drawLeader || !placement) continue
        const [a, e, s] = placement.leader
        line?.setAttribute('points', `${a.x.toFixed(1)},${a.y.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)} ${s.x.toFixed(1)},${s.y.toFixed(1)}`)
        line?.setAttribute('stroke-dashoffset', String(1 - reveal))
        reticle?.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) scale(${(.4 + .6 * reveal).toFixed(3)})`)
      }
      // Runtime can release focus on scroll/free-look. Reconcile only discrete selection.
      if (sample?.focusId === selectedRef.current) focusRequest.current.acknowledged = true
      if (sample && selectedRef.current && sample.focusId !== selectedRef.current &&
          (focusRequest.current.acknowledged || now - focusRequest.current.at > 300)) {
        const previous = selectedRef.current
        selectedRef.current = null
        setSelected(null)
        if (root.current?.contains(document.activeElement)) restoreFocus(previous)
      }
      raf = requestAnimationFrame(tick)
    }
    const visibility = () => {
      cancelAnimationFrame(raf)
      raf = 0
      if (!document.hidden) { sizeDirty = true; raf = requestAnimationFrame(tick) }
    }
    document.addEventListener('visibilitychange', visibility)
    visibility()
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', keydown)
      document.removeEventListener('visibilitychange', visibility)
      if (selectedRef.current) requestTorquePartFocus(null)
    }
  }, [])

  // The scene's stage is aria-hidden for its canvas/posters. Portal the interactive DOM
  // outside that ancestor rather than trying to override inherited aria-hidden.
  return createPortal(
    <div ref={root} className="torque-inspection-overlay" data-torque-overlay="">
      {shaft.visible && <div className="torque-shaft-hud" data-torque-shaft-time={shaft.time}>
        <ShaftStoryLayer time={shaft.time} reducedMotion={false} />
      </div>}
      <svg className="torque-hotspot-leaders" aria-hidden="true">
        {TORQUE_HOTSPOTS.map((hotspot, i) => <g key={hotspot.id} data-torque-leader={hotspot.id}>
          <polyline ref={node => { leaders.current[i] = node }} visibility="hidden"
            pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
          <g ref={node => { reticles.current[i] = node }} className="torque-callout-reticle" visibility="hidden">
            <circle r="9" />
            <path d="M-15 0 H-11 M11 0 H15 M0 -15 V-11 M0 11 V15" />
            <circle className="torque-callout-reticle-core" r="3.2" />
          </g>
        </g>)}
      </svg>
      <div className="torque-hotspot-layer" role="group" aria-label="Engineering part callouts">
        {TORQUE_HOTSPOTS.map((hotspot, i) => <section key={hotspot.id} hidden
          ref={node => { cards.current[i] = node }} className="torque-hotspot" data-torque-hotspot={hotspot.id}>
          <button ref={node => { buttons.current[i] = node }} type="button"
            aria-pressed={selected === hotspot.id} aria-expanded={selected === hotspot.id}
            aria-controls={`torque-part-${hotspot.id}`} aria-label={`Focus ${hotspot.title}, ${hotspot.part}. ${hotspot.summary}`}
            onClick={() => select(selectedRef.current === hotspot.id ? null : hotspot.id)}>
            {hotspot.fcf && <Frame cells={hotspot.fcf} label={hotspot.fcfLabel} />}
            <strong className="torque-callout-name">{hotspot.title}</strong>
            <span className="torque-hotspot-part">{hotspot.part}</span>
            <span className="torque-callout-note">{hotspot.summary}</span>
          </button>
          <div id={`torque-part-${hotspot.id}`} hidden={selected !== hotspot.id} className="torque-hotspot-detail">
            <p>{hotspot.detail}</p>
            <button type="button" onClick={() => { select(null); buttons.current[i]?.focus({ preventScroll: true }) }}>Return to story view</button>
          </div>
        </section>)}
      </div>
    </div>, document.body,
  )
}
