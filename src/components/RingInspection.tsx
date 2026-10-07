import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { enterInspection, exitInspection, getInspectionStory, inspection, playInspection, retryInspection, seekChapter, seekInspection, setInspectionSuspend, useInspection } from '../state/inspectionStore'
import { ringStory } from '../scene/inspection/story'
import { shaftStory } from '../scene/inspection/shaft/story'
import { useQuality } from '../state/qualityStore'
import { useScrollValue } from '../state/scrollStore'
import { ShaftStoryLayer } from './ShaftStoryLayer'
import { StaticShaftStory } from './StaticShaftStory'
import { useNativeScrollChapter } from './staticChapter'
import './RingInspection.css'

function StaticFinish() {
  return <figure className="ring-static">
    <svg viewBox="0 0 520 220" role="img" aria-label="Smooth ring and diamond finish schematic. Knurl covers the outer diameter band; bore and shoulders remain smooth.">
      <defs><pattern id="ring-diamonds" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 6L6 0L12 6L6 12Z" fill="none" stroke="#9babb4" strokeWidth="1.5" /></pattern></defs>
      <g fill="#1a222b" stroke="#b3c0cc" strokeWidth="2"><rect x="35" y="50" width="170" height="105" rx="24" /><rect x="315" y="50" width="170" height="105" rx="24" /><path d="M39 78H201M39 128H201M319 78H481M319 128H481" /></g>
      <rect x="319" y="80" width="162" height="46" fill="url(#ring-diamonds)" />
      <path d="M230 104H290M280 94L290 104L280 114" stroke="#74d6ee" fill="none" />
      <g fill="#d5e0e9" fontSize="14" textAnchor="middle"><text x="120" y="190">Smooth black</text><text x="400" y="190">Knurled black</text></g>
    </svg>
    <figcaption>Finish schematic · smooth shoulders and bore preserved.</figcaption>
  </figure>
}

/** DOM-only shaft study for poster and reduced-motion sessions: no WebGL and no CAD download. */
function StaticShaft() {
  return <StaticShaftStory />
}

/** Drives the card layer from the shared playhead; re-renders only when the time changes. */
function ShaftStoryHost() {
  const [time, setTime] = useState(inspection.time)
  useEffect(() => {
    let frame = 0
    const tick = () => { setTime(previous => previous === inspection.time ? previous : inspection.time); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <ShaftStoryLayer time={time} reducedMotion={false} />
}

export function RingInspection() {
  const state = useInspection()
  const { tier, reducedMotion } = useQuality()
  const progress = useScrollValue('progress')
  const panel = useRef<HTMLDivElement>(null)
  const returnButton = useRef<HTMLButtonElement>(null)
  const seek = useRef<HTMLInputElement>(null)
  const playhead = useRef<HTMLOutputElement>(null)
  const [phase, setPhase] = useState('Smooth black')
  const staticMode = tier === 'poster' || reducedMotion
  const nativeChapter = useNativeScrollChapter(staticMode)
  const story = getInspectionStory()
  const controlEpoch = state.epoch

  useEffect(() => {
    if (!state.active) return
    const target = state.trigger
    const storyId = state.storyId
    const epoch = state.epoch, scrollX = state.scrollX, scrollY = state.scrollY
    const html = document.documentElement
    const overflow = html.style.overflow
    document.body.classList.add('ring-inspection-open')
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void; isStopped: boolean; scrollTo(y: number, options: object): void } }).__lenis
    const wasStopped = lenis?.isStopped
    lenis?.stop()
    html.style.overflow = 'hidden'
    const outside = new Map<HTMLElement, boolean>()
    const isolate = () => {
      for (const node of document.body.children) {
        if (!(node instanceof HTMLElement) || node.classList.contains('ring-inspection-portal') || outside.has(node)) continue
        outside.set(node, node.inert); node.inert = true
      }
    }
    isolate()
    const observer = new MutationObserver(isolate)
    observer.observe(document.body, { childList: true })
    const chrome = [...(document.getElementById('root')?.children ?? [])].filter(node => !node.querySelector('canvas')) as HTMLElement[]
    const opacity = chrome.map(node => node.style.opacity)
    chrome.forEach(node => { node.style.opacity = '0' })
    returnButton.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); exitInspection(); return }
      if (event.key !== 'Tab') return
      const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input')
      if (!controls?.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    const onFocus = (event: FocusEvent) => { if (!panel.current?.contains(event.target as Node)) returnButton.current?.focus({ preventScroll: true }) }
    const onVisibility = () => setInspectionSuspend(document.hidden ? 'hidden' : 'none', epoch)
    const guardScroll = () => { if (window.scrollY !== scrollY || window.scrollX !== scrollX) window.scrollTo(scrollX, scrollY) }
    const preventScroll = (event: Event) => { if (!panel.current?.contains(event.target as Node)) event.preventDefault() }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    onVisibility()
    window.addEventListener('scroll', guardScroll)
    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    const timer = window.setInterval(() => {
      if (document.hidden || !inspection.active || inspection.epoch !== epoch) return
      const probe = (window as unknown as { __inspection?: { phase: string } }).__inspection
      if (probe) setPhase(probe.phase)
      updatePlayhead()
    }, 150)
    updatePlayhead()
    return () => {
      clearInterval(timer)
      observer.disconnect()
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', guardScroll)
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
      html.style.overflow = overflow
      document.body.classList.remove('ring-inspection-open')
      outside.forEach((inert, node) => { node.inert = inert })
      chrome.forEach((node, i) => { node.style.opacity = opacity[i] })
      lenis?.scrollTo(scrollY, { immediate: true, force: true })
      window.scrollTo(scrollX, scrollY)
      if (!wasStopped) lenis?.start()
      const available = (node: HTMLElement | null): node is HTMLElement => Boolean(node?.isConnected && !node.closest('[inert]') && node.getClientRects().length && !node.hasAttribute('disabled'))
      const replacement = document.querySelector<HTMLElement>(`.ring-inspection-entry button[data-story="${storyId}"]`) ?? document.querySelector<HTMLElement>('.ring-inspection-entry button')
      const fallback = document.querySelector<HTMLElement>('[data-chapter="0"]') ?? document.querySelector<HTMLElement>('main') ?? document.body
      const focus = available(target) ? target : available(replacement) ? replacement : fallback
      const tabindex = focus.getAttribute('tabindex')
      if (tabindex === null && !focus.matches('button,input,select,textarea,a[href],summary,[contenteditable="true"]')) {
        focus.setAttribute('tabindex', '-1')
        focus.addEventListener('blur', () => { if (focus.getAttribute('tabindex') === '-1') focus.removeAttribute('tabindex') }, { once: true })
      }
      focus.focus({ preventScroll: true })
    }
  }, [state.active, state.epoch])

  function updatePlayhead() {
    const text = `${inspection.time.toFixed(1)} / ${inspection.duration.toFixed(1)} s`
    if (seek.current) {
      seek.current.value = String(inspection.time)
      seek.current.setAttribute('aria-valuetext', text)
    }
    if (playhead.current) playhead.current.value = text
  }

  useEffect(() => {
    if (state.active && staticMode && !state.static) { setInspectionSuspend('context'); exitInspection() }
  }, [state.active, state.static, staticMode])

  return <>
    {(state.active || (staticMode ? nativeChapter < 2 : progress > ringStory.entryWindow[0] && progress < ringStory.entryWindow[1])) && <div className="ring-inspection-entry" style={{ visibility: state.active ? 'hidden' : 'visible' }}>
      <div><span>P003068 · Ring Switch</span><button data-story={ringStory.id} onClick={event => enterInspection(event.currentTarget, staticMode)} aria-haspopup="dialog">Inspect the finish <span aria-hidden="true">↗</span></button></div>
      <div><span>P001835 · Input Shaft</span><button data-story={shaftStory.id} onClick={event => enterInspection(event.currentTarget, staticMode, shaftStory.id)} aria-haspopup="dialog">Inspect the input shaft <span aria-hidden="true">↗</span></button></div>
    </div>}
    {state.active && createPortal(<div className={`ring-inspection-portal ${state.static ? 'ring-inspection-static' : ''}`}>
      {state.kind === 'shaft' && !state.static && <ShaftStoryHost />}
      <div ref={panel} className="ring-inspection-dialog" role="dialog" aria-modal="true" aria-labelledby="ring-inspection-title" aria-describedby="ring-inspection-description">
        <header><div><p>{state.kind === 'ring' ? 'P003068' : 'P001835'} / MANUFACTURING</p><h2 id="ring-inspection-title">{state.kind === 'ring' ? 'Ring Switch' : 'Input Shaft'}</h2></div><button ref={returnButton} onClick={exitInspection}>← Return to narrative</button></header>
        <div className="ring-inspection-copy"><p id="ring-inspection-description">{state.kind === 'ring' ? 'A smooth surface becomes a tactile diamond grip. The shoulders and bore stay smooth.' : 'A revised shaft and its supports, shown in an assembled study.'}</p></div>
        {state.static && (state.kind === 'shaft' ? <StaticShaft /> : <StaticFinish />)}
        <footer>
          {state.static ? (state.kind === 'shaft' ? null : <ol><li>Smooth black → aluminium</li><li>Paired rollers traverse the outer band</li><li>Rollers clear the OD before withdrawal</li><li>Knurled black → assembly</li></ol>) : <>
            <p role="status" aria-live="polite">{state.status === 'loading' || state.status === 'compiling' ? 'Preparing the study…' : state.status === 'error' ? 'The study could not load. Return or try again.' : phase}</p>
            <div className="ring-inspection-seek">
              <label htmlFor="inspection-seek">Seek</label>
              <output ref={playhead} htmlFor="inspection-seek" aria-live="off">{state.time.toFixed(1)} / {state.duration.toFixed(1)} s</output>
              <input ref={seek} id="inspection-seek" type="range" min="0" max={state.duration} step="0.01" defaultValue={state.time} disabled={state.status !== 'ready'} onChange={event => { seekInspection(event.currentTarget.valueAsNumber, controlEpoch); updatePlayhead() }} />
            </div>
            {story.chapters.length > 1 && <nav aria-label="Study chapters" className="ring-inspection-chapters">{story.chapters.map((chapter, index) => <button key={chapter.id} disabled={state.status !== 'ready'} aria-current={state.time >= chapter.start && (state.time < chapter.end || index === story.chapters.length - 1) ? 'step' : undefined} onClick={() => { seekChapter(index, controlEpoch); updatePlayhead() }}>{chapter.label}</button>)}</nav>}
            <div className="ring-inspection-controls">
              <button disabled={state.status !== 'ready'} onClick={() => playInspection(false, controlEpoch)}>{state.userPlaying ? 'Pause' : 'Play sequence'}</button>
              <button disabled={state.status !== 'ready'} onClick={() => { playInspection(true, controlEpoch); updatePlayhead() }}>Replay</button>
              {state.status === 'error' && <button onClick={() => retryInspection(controlEpoch)}>Try again</button>}
            </div>
          </>}
          <p className="ring-inspection-note">{state.kind === 'ring' ? 'Cinematic finish study. Tooling proportions are reference based.' : 'Revised assembly study. Return restores the original narrative.'}</p>
        </footer>
      </div>
    </div>, document.body)}
  </>
}
