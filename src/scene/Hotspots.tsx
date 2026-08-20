import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { HOTSPOTS } from '../data/caseStudies'
import { setScrollState, useScrollValue } from '../state/scrollStore'
import type { ChapterIndex, RoleMapEntry } from '../types/portfolio'

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

  const anchors = useMemo(() => {
    const byOccurrence = new Map(roleMap.map((entry) => [entry.occurrence, entry]))
    return HOTSPOTS.flatMap((def) => {
      const entry = byOccurrence.get(def.occurrence)
      return entry ? [{ def, entry }] : []
    })
  }, [roleMap])

  return (
    <>
      {anchors
        .filter(({ def }) => def.chapters.includes(chapter as ChapterIndex))
        .map(({ def, entry }) => {
          const isSelected = selected === def.id
          return (
            <Html
              key={def.id}
              position={entry.bboxCenter}
              center
              distanceFactor={0.35}
              zIndexRange={[40, 0]}
            >
              <button
                type="button"
                onClick={() => setScrollState({ hotspotId: isSelected ? null : def.id })}
                className={`pointer-events-auto cursor-pointer whitespace-nowrap border px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur transition-colors ${
                  isSelected
                    ? 'border-cyan-300 bg-cyan-300/20 text-cyan-100'
                    : 'border-cyan-400/40 bg-black/50 text-cyan-300/90 hover:border-cyan-300'
                }`}
              >
                {def.kind === 'inspect' ? '◉ INSPECT' : '◎ DATUM POINT'} · {def.label}
              </button>
            </Html>
          )
        })}
    </>
  )
}
