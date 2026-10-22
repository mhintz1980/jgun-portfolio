import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ShaftStoryLayer } from '../../components/ShaftStoryLayer'
import { TORQUE_HOTSPOTS, readTorqueOverlaySample, requestTorquePartFocus, type TorqueHotspotId } from './hotspotData'
import './torque-inspection-overlay.css'

const SHAFT_UPDATE_MS = 1000 / 15

/** DOM only: leaders track every rendered frame; the existing shaft presentation is capped
 * at 15 Hz. Nothing subscribes React inside Canvas or calls the allocating debug snapshot.
 */
export function TorqueInspectionOverlay() {
  const root = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLElement | null)[]>([])
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const leaders = useRef<(SVGPolylineElement | null)[]>([])
  const reticles = useRef<(SVGCircleElement | null)[]>([])
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
    let layoutDirty = true
    const endpoints = TORQUE_HOTSPOTS.map(() => ({ x: 0, y: 0 }))
    const observer = new ResizeObserver(() => { layoutDirty = true })
    for (const card of cards.current) if (card) observer.observe(card)
    const resize = () => { layoutDirty = true }
    window.addEventListener('resize', resize)
    root.current?.addEventListener('scroll', resize, true)

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

      for (let i = 0; i < TORQUE_HOTSPOTS.length; i++) {
        const hotspot = TORQUE_HOTSPOTS[i]
        const anchor = sample?.anchors.find(item => item.id === hotspot.id)
        const visible = Boolean(anchor?.visible && !showShaft && !sample?.manual &&
          Number.isFinite(anchor.x) && Number.isFinite(anchor.y) &&
          anchor.x >= 0 && anchor.x <= innerWidth && anchor.y >= 0 && anchor.y <= innerHeight)
        const focusing = selectedRef.current === hotspot.id && !showShaft && !sample?.manual
          && (sample?.focusId === hotspot.id || (!focusRequest.current.acknowledged && now - focusRequest.current.at < 300))
        const card = cards.current[i]
        // Preserve a real keyboard destination while the return camera clears
        // an occluder. Leaders still obey geometric visibility independently.
        const keyboardFocus = Boolean(card?.contains(document.activeElement) && sample
          && !showShaft && !sample.manual && sample.progress >= .46 && sample.progress <= .995)
        const showCard = visible || focusing || keyboardFocus
        if (card && card.hidden === showCard) {
          card.hidden = !showCard
          layoutDirty = true
        }
        const line = leaders.current[i]
        const reticle = reticles.current[i]
        line?.setAttribute('visibility', visible ? 'visible' : 'hidden')
        reticle?.setAttribute('visibility', visible ? 'visible' : 'hidden')
        if (!visible) {
          if (selectedRef.current === hotspot.id && !focusing) close(Boolean(card?.contains(document.activeElement)))
          else if (!focusing && card?.contains(document.activeElement)) restoreFocus(hotspot.id)
          continue
        }
        if (anchor) {
          reticle?.setAttribute('cx', String(anchor.x))
          reticle?.setAttribute('cy', String(anchor.y))
        }
      }
      // Measure only after visibility/layout changes, never a layout read per moving anchor.
      if (layoutDirty) {
        for (let i = 0; i < buttons.current.length; i++) {
          const button = buttons.current[i]
          if (!button || cards.current[i]?.hidden) continue
          const rect = button.getBoundingClientRect()
          endpoints[i].x = rect.left
          endpoints[i].y = rect.top + rect.height / 2
        }
        layoutDirty = false
      }
      for (let i = 0; i < TORQUE_HOTSPOTS.length; i++) {
        if (cards.current[i]?.hidden) continue
        const anchor = sample?.anchors.find(item => item.id === TORQUE_HOTSPOTS[i].id)
        if (!anchor) continue
        const end = endpoints[i]
        leaders.current[i]?.setAttribute('points', `${anchor.x},${anchor.y} ${end.x - 18},${end.y} ${end.x},${end.y}`)
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
      if (!document.hidden) { layoutDirty = true; raf = requestAnimationFrame(tick) }
    }
    document.addEventListener('visibilitychange', visibility)
    visibility()
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      root.current?.removeEventListener('scroll', resize, true)
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
        {TORQUE_HOTSPOTS.map((hotspot, i) => <g key={hotspot.id}>
          <polyline ref={node => { leaders.current[i] = node }} visibility="hidden" />
          <circle ref={node => { reticles.current[i] = node }} r="5" visibility="hidden" />
        </g>)}
      </svg>
      <div className="torque-hotspot-rail" role="group" aria-label="Engineering part callouts">
        {TORQUE_HOTSPOTS.map((hotspot, i) => <section key={hotspot.id} hidden
          ref={node => { cards.current[i] = node }} className="torque-hotspot" data-torque-hotspot={hotspot.id}>
          <button ref={node => { buttons.current[i] = node }} type="button"
            aria-pressed={selected === hotspot.id} aria-expanded={selected === hotspot.id}
            aria-controls={`torque-part-${hotspot.id}`} aria-label={`Focus ${hotspot.title}, ${hotspot.part}. ${hotspot.summary}`}
            onClick={() => select(selectedRef.current === hotspot.id ? null : hotspot.id)}>
            <strong>{hotspot.title}</strong>
            <span className="torque-hotspot-part">{hotspot.part}</span>
            {hotspot.id === 'stage2-planet'
              ? <span className="torque-hotspot-fcf" aria-label="Total runout less than .001 inch TIR">
                <span aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false">
                  <path d="M2.5 17.5 H17.5 M3.5 17.5 L11 5 M9.5 17.5 L17 5 M11 5 L7.6 6.4 M11 5 L11.6 8.6 M17 5 L13.6 6.4 M17 5 L17.6 8.6" />
                </svg></span><span>&lt; .001″ TIR</span>
              </span>
              : <span>{hotspot.summary}</span>}
            {hotspot.id === 'stage2-planet' && <span>ISO 1328 Grade A6</span>}
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
