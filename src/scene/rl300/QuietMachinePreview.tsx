import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { clamp01, evaluateShot, SHOTS } from './shot'
import type { PreviewControl } from './QuietMachineScene'
import { prefetchPage, releaseFadeWhen } from '../../shared/pageFade'
import { PageLink, PageNav } from '../../shared/PageNav'
import { pageHref, resolveEntryTier, type TierParam } from '../../shared/pages'
import './quiet-machine.css'

/** The one length knob: the page is this many viewport heights tall, and scroll progress is the shot. */
export const QM_LENGTH_VH = 900
/** Progress at which the continue card appears and the next page is prefetched. */
export const END_CARD_AT = .97

const Scene = lazy(() => import('./QuietMachineScene').then(m => ({ default: m.QuietMachineScene })))
/** Three poster frames cover seven shots; each shot names the one that stands for it, so
 *  the static fallback never asks for an image that was never captured. */
const POSTERS = ['exterior', 'section', 'section', 'intake', 'section', 'section', 'exterior'] as const
/** Scrubber anchors, not a shot list: the three stops the study is navigated by. */
const VIEWS: [string, number][] = [['Exterior', 0], ['Section', .2], ['Lower intake', .51]]

class SceneBoundary extends Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

/** First-paint mode from the visitor's motion preference and the query string. The tier comes from
 *  the shared `resolveEntryTier`: reduced motion is the poster path (never manual WebGL). There is
 *  no fixed pose, so `?shot=` is honoured. `tier` also rides on the outgoing page links. */
export function initialStudyMode(reducedMotion: boolean, search: string): { poster: boolean; tier: TierParam; u: number } {
  const params = new URLSearchParams(search)
  const tier = resolveEntryTier(search, reducedMotion)
  return { poster: tier === 'poster', tier, u: clamp01(Number(params.get('shot') ?? 0)) }
}

/** The fade-in is held until this is true: the poster path is ready as soon as it commits, the
 *  scene when it reports ready. A scene that errors turns `poster` true, which also releases. */
export function fadeReady(s: { poster: boolean; ready: boolean }): boolean {
  return s.poster || s.ready
}

export default function QuietMachinePreview() {
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current
  const mode = initialStudyMode(reduced, location.search)
  const [poster, setPoster] = useState(mode.poster)
  const [ready, setReady] = useState(false)
  const [u, setU] = useState(mode.u)
  const control = useRef<PreviewControl>({ u, invalidate: () => {}, caps: true }).current
  const stateRef = useRef({ poster: mode.poster, ready: false })
  const stageRef = useRef<HTMLDivElement>(null)
  const beat = evaluateShot(u, false).beat
  const onReady = useCallback(() => { stateRef.current.ready = true; setReady(true) }, [])
  const onError = useCallback(() => { stateRef.current.poster = true; setPoster(true) }, [])
  useEffect(() => { releaseFadeWhen(() => fadeReady(stateRef.current)) }, [])
  const prefetched = useRef(false)
  useEffect(() => {
    if (u < END_CARD_AT || prefetched.current) return
    prefetched.current = true
    const next = pageHref('jgun', mode.tier)
    if (next) prefetchPage(document, [next])
  }, [u, mode.tier])
  const seek = useCallback((value: number) => {
    const next = clamp01(value)
    control.u = next; setU(next); control.invalidate()
  }, [control])
  const navigate = useCallback((value: number) => {
    seek(value)
    if (!reduced) window.scrollTo({ top: clamp01(value) * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' })
  }, [reduced, seek])
  useEffect(() => {
    if (reduced) return
    if (new URLSearchParams(location.search).has('shot')) navigate(control.u)
    else if (window.scrollY > 0) seek(window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))
  }, [control, navigate, reduced, seek])
  useEffect(() => {
    const proof = { seek, render: () => control.invalidate(), setCaps: (enabled: boolean) => { control.caps = enabled; control.invalidate() }, ready: false }
    ;(window as any).__quietMachine = proof
    return () => { delete (window as any).__quietMachine }
  }, [control, seek])
  useEffect(() => {
    const scroll = () => { if (!reduced) seek(window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) }
    const resize = () => control.invalidate()
    const resume = () => { if (!document.hidden) control.invalidate() }
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', resume)
    // Captured on the stage, not on the canvas: the canvas is created after this effect first runs and a
    // canvas-keyed re-run lands after the scene reports ready, so a loss in that window was missed.
    const lost = (e: Event) => { e.preventDefault(); stateRef.current.poster = true; setPoster(true) }
    const stage = stageRef.current
    stage?.addEventListener('webglcontextlost', lost, true)
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', resume); stage?.removeEventListener('webglcontextlost', lost, true) }
  }, [control, reduced, seek])
  return <main className="qm-preview" data-reduced-motion={reduced} style={{ '--qm-length': `${QM_LENGTH_VH}vh` } as React.CSSProperties}>
    <div className="qm-progress" aria-hidden="true"><span style={{ transform: `scaleX(${u})` }} /></div>
    <div className="qm-stage" ref={stageRef} aria-label="RL300 enclosure section study">
      {poster ? <div className="qm-poster"><img src={`/images/rl300-${POSTERS[beat]}-preview.png`} alt={SHOTS[beat].caption} /></div> :
        <SceneBoundary onError={onError}><Suspense fallback={null}><Scene control={control} onReady={onReady} onError={onError} lite={mode.tier === 'lite'} /></Suspense></SceneBoundary>}
    </div>
    <header className="qm-header"><PageLink id="jgun" tier={mode.tier}>MARK HINTZ <span>ENGINEERING & DESIGN</span></PageLink><PageNav current="quiet-machine" tier={mode.tier} variant="header" /><span>RL300 / SECTION STUDY</span></header>
    <div className="qm-editorial">
      <p className="qm-eyebrow">THE QUIET MACHINE <span>0{beat + 1} / 0{SHOTS.length}</span></p>
      <h1>{SHOTS[beat].title}</h1><p className="qm-caption">{SHOTS[beat].caption}</p>
      <p className="qm-note">{SHOTS[beat].note}</p>
    </div>
    {u >= END_CARD_AT && <aside className="qm-endcard" aria-label="Continue"><PageNav current="quiet-machine" tier={mode.tier} variant="endcard" /></aside>}
    <footer className="qm-controls">
      <div className="qm-views" aria-label="Study views">{VIEWS.map(([label, at]) =>
        <button key={label} aria-pressed={beat === evaluateShot(at, false).beat} onClick={() => navigate(at)}>{label}</button>)}</div>
      <label className="qm-scrubber">REVEAL <input aria-label="Section reveal" type="range" min="0" max="1000" step="1" value={Math.round(u * 1000)} onChange={e => navigate(Number(e.target.value) / 1000)} /></label>
      <p className="qm-status" role="status">{poster ? 'STATIC SECTION STUDY' : !ready ? 'PREPARING THE MACHINE…' : 'SCROLL TO EXPLORE · REVERSE TO CLOSE'}</p>
    </footer>
  </main>
}
