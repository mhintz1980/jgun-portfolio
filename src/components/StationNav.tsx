import { navigateToStation, SPATIAL_STATIONS } from '../state/scrollStore'
import { useNativeScrollChapter } from './staticChapter'

/**
 * Chapter -> station mapping, identical to TechnicalHUD's highlight rule
 * (station 1 covers CH.01/CH.02, station 2 is CH.03, station 3 is CH.04).
 */
function stationForChapter(chapter: number): number {
  if (chapter <= 1) return 0
  if (chapter === 2) return 1
  return 2
}

/**
 * JG-035 poster-tier station navigation. In the full-motion tiers the STATION
 * 01–03 controls live in TechnicalHUD — which also owns the camera/material
 * readouts the poster tier must never render (App unmounts it on degrade).
 * This minimal DOM-only nav preserves case-study station navigation when the
 * canvas is gone:
 *   - 3 persistent buttons reusing the shared navigateToStation() primitive,
 *     whose no-Lenis branch is plain window.scrollTo — no canvas dependency.
 *   - Active-station highlight derived from native scroll through the same
 *     pacedProgress axis the full-motion HUD's `chapter` uses (JG-026), so
 *     the two stay consistent.
 * Rendered only in the poster tier (see App.tsx); reduced motion keeps the
 * canvas and therefore TechnicalHUD's own controls.
 */
export function StationNav() {
  // ScrollRig never mounts in the poster tier, so the store's `chapter` stays
  // locked at 0 (JG-022) — derive it from native scroll instead.
  const chapter = useNativeScrollChapter(true)
  const activeStation = stationForChapter(chapter)

  return (
    <nav
      aria-label="Station navigation"
      className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2"
    >
      <div className="pointer-events-auto flex divide-x divide-cyan-400/30 border border-cyan-400/40 bg-black/80 backdrop-blur-sm rounded font-mono text-[10px] tracking-widest">
        {SPATIAL_STATIONS.map((st) => {
          const active = st.index === activeStation
          return (
            <button
              key={st.id}
              type="button"
              aria-label={`Navigate to ${st.label}: ${st.name}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => navigateToStation(st.index)}
              className={`cursor-pointer px-3 py-1.5 outline-none transition-colors rounded focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-black ${
                active
                  ? 'bg-cyan-400/20 text-cyan-200'
                  : 'text-cyan-400/60 hover:text-cyan-200'
              }`}
            >
              {st.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
