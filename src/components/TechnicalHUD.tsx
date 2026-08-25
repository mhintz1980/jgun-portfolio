import { useEffect, useRef } from 'react'
import { CHAPTERS, HOTSPOTS, MATERIAL_MODE_LABELS } from '../data/caseStudies'
import { getScrollState, setScrollState, telemetry, useScrollValue } from '../state/scrollStore'
import { useQuality } from '../state/qualityStore'
import type { MaterialMode } from '../types/portfolio'

const MODES: MaterialMode[] = ['solid', 'blueprint', 'exploded']

/**
 * Module 4 — floating telemetry HUD & Continuous Scroll-to-Release UX.
 *
 * Chapter label, material-mode switcher and hotspot panel are React-driven
 * (they change rarely). The 60 fps readouts — scroll %, camera datum
 * coordinates — are written straight into the DOM from a rAF loop so the HUD
 * never re-renders per frame.
 *
 * Continuous Scroll UX:
 * When a visitor inspects a subassembly, any mouse wheel movement, touch drag,
 * or scroll navigation automatically and seamlessly releases inspect focus,
 * smoothly returning the visitor to the scrollytelling path without trapping
 * them behind a modal or mandatory close button.
 */
export function TechnicalHUD() {
  const chapter = useScrollValue('chapter')
  const materialMode = useScrollValue('materialMode')
  const hotspotId = useScrollValue('hotspotId')
  const { reducedMotion } = useQuality()

  // Continuous Scroll Release: wheel, touch drag, and keyboard navigation seamlessly
  // release inspect mode so the user is never trapped behind an inspect overlay.
  useEffect(() => {
    if (!hotspotId) return

    // 1. Wheel scroll release (small threshold prevents jitter)
    const onWheel = (e: WheelEvent): void => {
      if (Math.abs(e.deltaY) > 2 || Math.abs(e.deltaX) > 2) {
        setScrollState({ hotspotId: null })
      }
    }

    // 2. Touch swipe release
    let touchStartY = 0
    let touchStartX = 0
    const onTouchStart = (e: TouchEvent): void => {
      if (e.touches[0]) {
        touchStartY = e.touches[0].clientY
        touchStartX = e.touches[0].clientX
      }
    }
    const onTouchMove = (e: TouchEvent): void => {
      if (e.touches[0]) {
        const dy = Math.abs(e.touches[0].clientY - touchStartY)
        const dx = Math.abs(e.touches[0].clientX - touchStartX)
        if (dy > 6 || dx > 6) {
          setScrollState({ hotspotId: null })
        }
      }
    }

    // 3. Keyboard navigation & Escape release
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key === 'Escape' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'PageDown' ||
        event.key === 'PageUp'
      ) {
        setScrollState({ hotspotId: null })
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [hotspotId])

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
                ? 'bg-cyan-300/20 text-cyan-100 ring-1 ring-cyan-400/40'
                : 'text-cyan-400/70 hover:text-cyan-200'
            }`}
          >
            {MATERIAL_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Bottom-center: selected hotspot detail card with continuous scroll hint */}
      {hotspot && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 w-[min(30rem,88vw)] -translate-x-1/2 border border-cyan-400/50 bg-black/85 p-4 shadow-[0_0_25px_rgba(0,229,255,0.25)] backdrop-blur-md">
          <div className="flex items-start justify-between gap-4 border-b border-cyan-400/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff] animate-pulse" />
              <p className="font-semibold text-cyan-100">
                {hotspot.kind === 'inspect' ? '◉ SUBASSEMBLY INSPECTION' : '◎ GD&T DATUM REFERENCE'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close hotspot detail"
              onClick={() => setScrollState({ hotspotId: null })}
              className="cursor-pointer font-mono text-cyan-400/70 outline-none transition-colors hover:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              [ ESC · X ]
            </button>
          </div>

          <div className="mt-2.5">
            <p className="font-mono text-xs tracking-wider text-cyan-200">{hotspot.label}</p>
            <p className="mt-1.5 font-sans text-xs normal-case tracking-normal leading-relaxed text-zinc-300">
              {hotspot.detail}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-cyan-400/20 pt-2 font-mono text-[9px] text-cyan-400/60">
            <span>OCCURRENCE: {hotspot.occurrence}</span>
            <span className="text-cyan-300/80">SCROLL TO RESUME FLIGHT ▸</span>
          </div>
        </div>
      )}
    </div>
  )
}
