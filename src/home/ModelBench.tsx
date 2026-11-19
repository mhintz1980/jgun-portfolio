import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SHOWCASE } from './content'
import type { BenchInfo, BenchMode, BenchPalette, BenchVariant } from './ModelBenchCanvas'

// A small inspection bench for one CAD model: drag to turn it, step it a notch at a time, switch
// between shaded and hidden-line display. three.js and the model load only once the bench is near
// the viewport, and rendering stops while it is off screen.

const ModelBenchCanvas = lazy(() => import('./ModelBenchCanvas'))

// Model files live here, not in content.ts: they are asset paths, not page copy.
const MODEL_URL: Record<BenchVariant, string> = {
  'gear-core': '/models/manufacturing-core-lite.glb',
  enclosure: '/models/rl300-lite.glb',
}

const FALLBACK_PALETTE: BenchPalette = { body: '#9aa4b0', paint: '#1d4e89', dark: '#2a3038', edge: '#14181d', paper: '#fbf9f4' }

function readPalette(element: HTMLElement): BenchPalette {
  const style = getComputedStyle(element)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    body: read('--bench-body', FALLBACK_PALETTE.body),
    paint: read('--bench-paint', FALLBACK_PALETTE.paint),
    dark: read('--bench-dark', FALLBACK_PALETTE.dark),
    edge: read('--bench-edge', FALLBACK_PALETTE.edge),
    paper: read('--bench-paper', FALLBACK_PALETTE.paper),
  }
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

class BenchBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface ModelBenchProps {
  variant: BenchVariant
  /** What the model is, for screen readers. */
  label: string
  caption: string
}

export default function ModelBench({ variant, label, caption }: ModelBenchProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [supported, setSupported] = useState(true)
  const [failed, setFailed] = useState(false)
  const [info, setInfo] = useState<BenchInfo | null>(null)
  const [mode, setMode] = useState<BenchMode>('shaded')
  const [nudge, setNudge] = useState({ seq: 0, dir: 1 })
  const [palette, setPalette] = useState<BenchPalette>(FALLBACK_PALETTE)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setSupported(webglAvailable())
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(query.matches)
    sync()
    query.addEventListener('change', sync)
    const visibility = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', visibility)
    return () => {
      query.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || typeof IntersectionObserver === 'undefined') {
      setNear(true)
      setVisible(true)
      return
    }
    // Start loading a screen early; render only while actually on screen.
    const loader = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) setNear(true) }, { rootMargin: '100% 0px' })
    const watcher = new IntersectionObserver((entries) => setVisible(entries[entries.length - 1].isIntersecting))
    loader.observe(frame)
    watcher.observe(frame)
    return () => {
      loader.disconnect()
      watcher.disconnect()
    }
  }, [])

  // The model takes its colours from the page theme.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const sync = () => setPalette(readPalette(frame))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const ready = useCallback((next: BenchInfo) => setInfo(next), [])
  const fail = useCallback(() => setFailed(true), [])
  const unavailable = !supported || failed
  const step = (dir: number) => setNudge((current) => ({ seq: current.seq + 1, dir }))

  return (
    <figure className="bench" data-mode={mode} data-ready={info ? '' : undefined} data-unavailable={unavailable ? '' : undefined}>
      <div
        ref={frameRef}
        className="bench-frame"
        role="img"
        aria-label={label}
        data-meshes={info?.meshes}
        data-triangles={info?.triangles}
      >
        <span className="bench-corner bench-corner-tl" aria-hidden="true" />
        <span className="bench-corner bench-corner-br" aria-hidden="true" />
        {unavailable ? (
          <p className="bench-note">{SHOWCASE.benchFallback}</p>
        ) : near ? (
          <BenchBoundary onError={fail}>
            <Suspense fallback={<p className="bench-note bench-note-loading">{SHOWCASE.benchLoading}</p>}>
              <ModelBenchCanvas
                url={MODEL_URL[variant]}
                variant={variant}
                mode={mode}
                palette={palette}
                running={visible && pageVisible}
                reducedMotion={reducedMotion}
                nudge={nudge}
                onReady={ready}
              />
            </Suspense>
          </BenchBoundary>
        ) : null}
      </div>
      {unavailable ? null : (
        <div className="bench-controls">
          <div className="bench-switch" role="group" aria-label={SHOWCASE.modeLabel}>
            <button type="button" aria-pressed={mode === 'shaded'} onClick={() => setMode('shaded')}>
              {SHOWCASE.modeShaded}
            </button>
            <button type="button" aria-pressed={mode === 'edges'} onClick={() => setMode('edges')}>
              {SHOWCASE.modeEdges}
            </button>
          </div>
          <div className="bench-steps">
            <button type="button" aria-label="Rotate one step left" onClick={() => step(-1)}>
              <span aria-hidden="true">‹</span>
            </button>
            <span className="bench-hint">{SHOWCASE.benchHint}</span>
            <button type="button" aria-label="Rotate one step right" onClick={() => step(1)}>
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      )}
      <figcaption className="bench-caption">{caption}</figcaption>
    </figure>
  )
}
