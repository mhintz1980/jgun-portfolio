import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { HOTSPOTS } from '../data/caseStudies'
import { setScrollState, useScrollValue } from '../state/scrollStore'
import type { ChapterIndex, RoleMapEntry } from '../types/portfolio'

/**
 * Pure DOM hotspot marker (exported separately so the Node a11y smoke check
 * can render it without a canvas). A real <button>, so Enter/Space activate
 * natively; aria-pressed reflects the toggle; the cyan focus-visible ring
 * matches the HUD chrome instead of the browser default.
 */
export function HotspotButton({
  def,
  selected,
}: {
  def: (typeof HOTSPOTS)[number]
  selected: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => setScrollState({ hotspotId: selected ? null : def.id })}
      className={`pointer-events-auto cursor-pointer whitespace-nowrap border px-2 py-1 font-mono text-[10px] tracking-widest outline-none backdrop-blur transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        selected
          ? 'border-cyan-300 bg-cyan-300/20 text-cyan-100'
          : 'border-cyan-400/40 bg-black/50 text-cyan-300/90 hover:border-cyan-300'
      }`}
    >
      {def.kind === 'inspect' ? '◉ INSPECT' : '◎ DATUM POINT'} · {def.label}
    </button>
  )
}

/**
 * Module 4 — clickable 3D hotspot annotations.
 *
 * Anchors come from role-map.json (the pipeline's authoritative name/anchor
 * source: 316 part occurrences with world-space bbox centers). Rendered inside
 * the hero group so they track rotation and explosion. Degrades gracefully to
 * no hotspots if the role map is missing.
 */
export function Hotspots() {
  const [roleMap, setRoleMap] = useState<RoleMapEntry[]>([])
  const chapter = useScrollValue('chapter')
  const selected = useScrollValue('hotspotId')

  useEffect(() => {
    let alive = true
    fetch('/models/role-map.json')
      .then((response) => response.json() as Promise<RoleMapEntry[]>)
      .then((entries) => {
        if (alive) setRoleMap(entries)
      })
      .catch(() => {
        /* hotspots simply don't render without the role map */
      })
    return () => {
      alive = false
    }
  }, [])

  // The exporter prefixes some occurrence names with "occurrence of " while
  // others are bare part numbers (149 prefixed / 167 bare of 316). Exact
  // match wins; the normalized fallback only fires for names that have no
  // exact row, so existing anchors never shift when both forms exist.
  const normalizeOccurrence = (name: string): string => name.replace(/^occurrence of /i, '')

  const anchors = useMemo(() => {
    const byOccurrence = new Map(roleMap.map((entry) => [entry.occurrence, entry]))
    const byNormalized = new Map(
      roleMap.map((entry) => [normalizeOccurrence(entry.occurrence), entry]),
    )
    return HOTSPOTS.flatMap((def) => {
      const entry =
        byOccurrence.get(def.occurrence) ?? byNormalized.get(normalizeOccurrence(def.occurrence))
      return entry ? [{ def, entry }] : []
    })
  }, [roleMap])

  return (
    <>
      {anchors
        .filter(({ def }) => def.chapters.includes(chapter as ChapterIndex))
        .map(({ def, entry }) => (
          <Html
            key={def.id}
            position={entry.bboxCenter}
            center
            distanceFactor={0.35}
            zIndexRange={[40, 0]}
          >
            <HotspotButton def={def} selected={selected === def.id} />
          </Html>
        ))}
    </>
  )
}
