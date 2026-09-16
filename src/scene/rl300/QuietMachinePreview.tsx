import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { clamp01, evaluateShot, SHOTS } from './shot'
import type { PreviewControl } from './QuietMachineScene'
import './quiet-machine.css'

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

export default function QuietMachinePreview() {
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current
  const params = new URLSearchParams(location.search)
  const [poster, setPoster] = useState(params.get('quality') === 'poster')
  const [ready, setReady] = useState(false)
  const [u, setU] = useState(reduced ? .52 : clamp01(Number(params.get('shot') ?? 0)))
  const control = useRef<PreviewControl>({ u, invalidate: () => {}, caps: true }).current
  const beat = evaluateShot(u, false).beat
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => setPoster(true), [])
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
    const lost = (e: Event) => { e.preventDefault(); setPoster(true) }
    const canvas = document.querySelector('.qm-stage canvas')
    canvas?.addEventListener('webglcontextlost', lost)
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', resume); canvas?.removeEventListener('webglcontextlost', lost) }
  }, [control, reduced, seek, ready])
  return <main className="qm-preview" data-reduced-motion={reduced}>
    <div className="qm-stage" aria-label="RL300 enclosure section study">
      {poster ? <div className="qm-poster"><img src={`/images/rl300-${POSTERS[beat]}-preview.png`} alt={SHOTS[beat].caption} /></div> :
        <SceneBoundary onError={onError}><Suspense fallback={null}><Scene control={control} onReady={onReady} onError={onError} lite={params.get('quality') === 'lite'} /></Suspense></SceneBoundary>}
    </div>
    <header className="qm-header"><a href="/">MARK HINTZ <span>ENGINEERING & DESIGN</span></a><span>RL300 / SECTION STUDY</span></header>
    <div className="qm-editorial">
      <p className="qm-eyebrow">THE QUIET MACHINE <span>0{beat + 1} / 0{SHOTS.length}</span></p>
      <h1>{SHOTS[beat].title}</h1><p className="qm-caption">{SHOTS[beat].caption}</p>
      <p className="qm-note">{SHOTS[beat].note}</p>
    </div>
    <footer className="qm-controls">
      <div className="qm-views" aria-label="Study views">{VIEWS.map(([label, at]) =>
        <button key={label} aria-pressed={beat === evaluateShot(at, false).beat} onClick={() => navigate(at)}>{label}</button>)}</div>
      <label className="qm-scrubber">REVEAL <input aria-label="Section reveal" type="range" min="0" max="1000" step="1" value={Math.round(u * 1000)} onChange={e => navigate(Number(e.target.value) / 1000)} /></label>
      <p className="qm-status" role="status">{poster ? 'STATIC SECTION STUDY' : !ready ? 'PREPARING THE MACHINE…' : reduced ? 'MANUAL STUDY · REDUCED MOTION' : 'SCROLL TO EXPLORE · REVERSE TO CLOSE'}</p>
    </footer>
  </main>
}
