import { useEffect, useRef } from 'react'
import { CHAPTERS, HOTSPOTS, MATERIAL_MODE_LABELS } from '../data/caseStudies'
import { getScrollState, setScrollState, telemetry, useScrollValue } from '../state/scrollStore'
import { useQuality } from '../state/qualityStore'
import type { MaterialMode } from '../types/portfolio'

const MODES: MaterialMode[] = ['solid', 'blueprint', 'exploded']

/**
 * Module 4 — floating telemetry HUD.
 *
 * Chapter label, material-mode switcher and hotspot panel are React-driven
 * (they change rarely). The 60 fps readouts — scroll %, camera datum
 * coordinates — are written straight into the DOM from a rAF loop so the HUD
 * never re-renders per frame.
 */
export function TechnicalHUD() {
  const chapter = useScrollValue('chapter')
  const materialMode = useScrollValue('materialMode')
  const hotspotId = useScrollValue('hotspotId')
  const { reducedMotion } = useQuality()

  // Escape closes an open hotspot detail panel (keyboard parity with [ X ]).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setScrollState({ hotspotId: null })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const progressRef = useRef<HTMLSpanElement>(null)
  const datumCoordsRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Reduced motion: ScrollRig never mounts, so scroll/camera telemetry is
    // static — skip the rAF loop entirely (the readouts below are hidden too).
    if (reducedMotion) return

    let frame = 0
    const tick = (): void => {
      const { progress } = getScrollState()
      if (progressRef.current) {
        progressRef.current.textContent = `SCROLL // ${String(Math.round(progress * 100)).padStart(3, '0')}%`
      }
      if (datumCoordsRef.current) {
        const cam = telemetry.camera
        datumCoordsRef.current.textContent = `CAM [ ${cam.x.toFixed(3)} ${cam.y.toFixed(3)} ${cam.z.toFixed(3)} ] · FOV ${cam.fov.toFixed(1)}°`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion])

  const chapterDef = CHAPTERS[chapter] ?? CHAPTERS[0]
  const hotspot = HOTSPOTS.find((def) => def.id === hotspotId) ?? null

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none font-mono text-[11px] tracking-widest text-cyan-300/90">
      {/* Scroll/chapter telemetry only makes sense when the scroll rig is
          live — under reduced motion the chapter tracker never runs, so these
          would freeze on stale values. Hide them; keep the mode switcher. */}
      {!reducedMotion && (
        <>
          {/* Top-left: chapter + scroll progress */}
          <div className="absolute left-5 top-5 space-y-1">
            <p className="text-cyan-200">{chapterDef.label}</p>
            <p>
              <span ref={progressRef}>SCROLL // 000%</span>
            </p>
          </div>

          {/* Top-right: live tolerance callouts + active datum */}
          <div className="absolute right-5 top-5 space-y-1 text-right">
            {chapterDef.callouts.map((callout) => (
              <p key={callout}>{callout}</p>
            ))}
            <p className="text-cyan-200">DATUM: {chapterDef.datum}</p>
          </div>

          {/* Bottom-left: camera telemetry (datum coordinates) */}
          <div className="absolute bottom-5 left-5">
            <p>
              <span ref={datumCoordsRef}>CAM [ 0.000 0.000 0.000 ]</span>
            </p>
          </div>
        </>
      )}

      {/* Bottom-right: material mode switcher */}
      <div className="pointer-events-auto absolute bottom-5 right-5 flex flex-col items-end gap-1">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={materialMode === mode}
            onClick={() => setScrollState({ materialMode: mode })}
            className={`cursor-pointer px-2 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
              materialMode === mode
                ? 'bg-cyan-300/20 text-cyan-100'
                : 'text-cyan-400/70 hover:text-cyan-200'
            }`}
          >
            {MATERIAL_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Bottom-center: selected hotspot detail */}
      {hotspot && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 w-[min(28rem,80vw)] -translate-x-1/2 border border-cyan-400/40 bg-black/70 p-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <p className="text-cyan-100">
              {hotspot.kind === 'inspect' ? '◉ INSPECT' : '◎ DATUM POINT'} · {hotspot.label}
            </p>
            <button
              type="button"
              aria-label="Close hotspot detail"
              onClick={() => setScrollState({ hotspotId: null })}
              className="cursor-pointer text-cyan-400/70 outline-none hover:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              [ X ]
            </button>
          </div>
          <p className="mt-2 font-sans text-xs normal-case tracking-normal text-zinc-300">
            {hotspot.detail}
          </p>
        </div>
      )}
    </div>
  )
}
