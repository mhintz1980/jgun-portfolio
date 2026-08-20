import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useQuality } from '../state/qualityStore'

/**
 * On-brand boot/init readout for the GLB stream-in, shown while Suspense
 * resolves the hero assembly. Drives entirely off drei's useProgress (the
 * DefaultLoadingManager store), so every number is real bytes-tracked load
 * state — no fake progress.
 *
 * Degradation contract (mirrors qualityStore):
 *  - poster tier: never renders — there is no canvas, nothing streams.
 *  - reduced motion: static single-line percentage, no bar animation, no
 *    fade-out — the panel simply unmounts the moment loading completes.
 *  - The overlay is pointer-events-none and translucent at every phase, and a
 *    load fault auto-dismisses it after 4 s: a stalled or failed GLB can dim
 *    the stage but never block or hide the DOM narrative underneath.
 */

const ITEM_LABELS: Array<[RegExp, string]> = [
  [/Default\.glb/i, 'LOADING ASSY · RL-300 FULL'],
  [/gearbox/i, 'GEARBOX STAGE 1-2 · PLANETARY CLUSTER'],
  [/handle/i, 'HANDLE ASSY · MOTOR HOUSING'],
]

function itemLabel(url: string): string {
  for (const [pattern, label] of ITEM_LABELS) if (pattern.test(url)) return label
  const file = url.split('/').pop()
  return file ? `LOADING ${file.toUpperCase()}` : 'LOADING RESOURCE'
}

export interface BootPanelProps {
  progress: number
  loaded: number
  total: number
  log: string[]
  faults: number
  reducedMotion: boolean
  /** true once loading is complete and the panel is fading out. */
  ready: boolean
}

/**
 * Pure presentational panel (exported separately so the Node fallback check
 * can render it without a live loading manager or WebGL).
 */
export function BootPanel({ progress, loaded, total, log, faults, reducedMotion, ready }: BootPanelProps) {
  const pct = Math.min(100, Math.round(progress))
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-0 z-30 flex items-center justify-center font-mono text-[11px] tracking-widest text-cyan-300/90 ${
        reducedMotion ? '' : `transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`
      }`}
    >
      <div className="w-[min(24rem,80vw)] border border-cyan-400/40 bg-black/70 p-5 backdrop-blur">
        <p className="text-cyan-200">RL-300 SYSTEM BOOT</p>

        {reducedMotion ? (
          <p className="mt-3">INITIALIZING ASSEMBLY — {pct}%</p>
        ) : (
          <>
            <div className="mt-3 space-y-1 text-cyan-400/80">
              {log.map((line) => (
                <p key={line}>▸ {line}</p>
              ))}
            </div>
            <div className="mt-4 h-px w-full bg-cyan-400/20">
              <div
                className="h-px bg-cyan-300 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 flex justify-between text-cyan-400/70">
              <span>
                {loaded}/{Math.max(total, loaded)} RES
              </span>
              <span>{ready ? 'SYSTEMS NOMINAL' : `${pct}%`}</span>
            </p>
          </>
        )}

        {faults > 0 && (
          <p className="mt-3 text-amber-400/90">
            FAULT: {faults} RESOURCE(S) FAILED — CONTINUING WITHOUT
          </p>
        )}
      </div>
    </div>
  )
}

export function BootSequence() {
  const { tier, reducedMotion } = useQuality()
  const { active, progress, item, loaded, total, errors } = useProgress()
  const [phase, setPhase] = useState<'boot' | 'ready' | 'gone'>('boot')
  const [log, setLog] = useState<string[]>([])

  // Accumulate a short readout of what actually streamed (last 4 items).
  useEffect(() => {
    if (!item) return
    const line = itemLabel(item)
    setLog((prev) => (prev[prev.length - 1] === line ? prev : [...prev, line].slice(-4)))
  }, [item])

  // Completion: reduced motion unmounts instantly; otherwise show NOMINAL,
  // fade, then unmount.
  const done = progress >= 100 && !active
  useEffect(() => {
    if (!done || phase !== 'boot') return
    if (reducedMotion) {
      setPhase('gone')
      return
    }
    setPhase('ready')
    const timer = setTimeout(() => setPhase('gone'), 1100)
    return () => clearTimeout(timer)
  }, [done, phase, reducedMotion])

  // Fault guard: a failed GLB must never trap the overlay on screen.
  useEffect(() => {
    if (errors.length === 0 || phase === 'gone') return
    const timer = setTimeout(() => setPhase('gone'), 4000)
    return () => clearTimeout(timer)
  }, [errors.length, phase])

  if (tier === 'poster' || phase === 'gone') return null

  return (
    <BootPanel
      progress={progress}
      loaded={loaded}
      total={total}
      log={log}
      faults={errors.length}
      reducedMotion={reducedMotion}
      ready={phase === 'ready'}
    />
  )
}
