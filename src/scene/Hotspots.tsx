import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { HOTSPOTS } from '../data/caseStudies'
import { setScrollState, telemetry, useScrollValue } from '../state/scrollStore'
import type { ChapterIndex, RoleMapEntry } from '../types/portfolio'

/**
 * 2D screen offset configuration and explosion offset per hotspot ID.
 * dx/dy: screen-space pixel displacement from 3D anchor to HTML datum badge.
 * unitOffset: axial explosion offset in meters (tracks moving subassemblies).
 * Dramatic offsets give generous clearance from CAD geometry.
 */
const HOTSPOT_CONFIG: Record<string, { dx: number; dy: number; unitOffset: number }> = {
  rotor: { dx: 260, dy: -110, unitOffset: -0.331 },
  'motor-housing': { dx: -240, dy: -95, unitOffset: -0.331 },
  flange: { dx: 270, dy: -125, unitOffset: -0.269 },
  'gearbox-housing': { dx: 250, dy: 110, unitOffset: 0 },
  mcu: { dx: -250, dy: -105, unitOffset: -0.331 },
  lcd: { dx: 240, dy: -120, unitOffset: -0.331 },
  lipo: { dx: -240, dy: 105, unitOffset: -0.331 },
}

/**
 * Pure DOM hotspot marker (exported separately so the Node a11y smoke check
 * can render it without a canvas). A real <button>, so Enter/Space activate
 * natively; aria-pressed reflects the toggle; the cyan focus-visible ring
 * matches the HUD chrome instead of the browser default.
 */
export function HotspotButton({
  def,
  selected,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  def: (typeof HOTSPOTS)[number]
  selected: boolean
  style?: React.CSSProperties
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const datumLetter = def.annotation?.datum
  const frame = def.annotation?.frame
  const processNote = def.annotation?.processNote

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${def.label} · ${def.detail}`}
      onClick={() => setScrollState({ hotspotId: selected ? null : def.id })}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      className={`group pointer-events-auto cursor-pointer select-none whitespace-nowrap border px-2.5 py-1.5 font-mono text-[10px] tracking-widest outline-none backdrop-blur-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        selected
          ? 'border-cyan-300 bg-cyan-950/95 text-cyan-100 shadow-[0_0_20px_rgba(0,229,255,0.5)] ring-1 ring-cyan-400/60'
          : 'border-cyan-400/60 bg-black/85 text-cyan-300 hover:border-cyan-300 hover:bg-black/95 hover:text-cyan-100 hover:shadow-[0_0_15px_rgba(0,229,255,0.35)]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-200 ${
            selected
              ? 'bg-cyan-300 shadow-[0_0_8px_#00e5ff] ring-2 ring-cyan-400/50'
              : 'bg-cyan-400/70 group-hover:bg-cyan-300'
          }`}
        />

        {/* 1. ASME Y14.5 Boxed Datum Flag: [ -A- ] */}
        {datumLetter && (
          <span className="inline-flex h-5 min-w-[22px] items-center justify-center border border-cyan-300 bg-cyan-950/80 px-1 font-mono text-[11px] font-bold text-cyan-100 shadow-[0_0_8px_rgba(0,229,255,0.4)]">
            -{datumLetter}-
          </span>
        )}

        {/* 2. ASME Y14.5 Segmented Feature Control Frame */}
        {frame ? (
          <div className="inline-flex items-center border border-cyan-300/90 bg-cyan-950/40 text-cyan-100">
            {frame.characteristic && (
              <span className="flex h-5 items-center justify-center border-r border-cyan-300/70 px-1.5 font-mono text-[10px] font-semibold">
                {frame.characteristic}
              </span>
            )}
            {frame.cells.map((cell, idx) => (
              <span
                key={`${cell}-${idx}`}
                className="flex h-5 items-center justify-center border-r border-cyan-300/70 px-1.5 font-mono text-[10px] font-semibold last:border-r-0"
              >
                {cell}
              </span>
            ))}
          </div>
        ) : null}

        {/* 3. Label / Subassembly Title */}
        <span className="font-semibold tracking-wider text-cyan-100/95">{def.label}</span>

        {/* 4. Process Note */}
        {processNote && !frame && !datumLetter && (
          <>
            <span className="text-cyan-400/40">·</span>
            <span className="text-[9px] text-cyan-300/70">{processNote}</span>
          </>
        )}
      </div>
    </button>
  )
}

/**
 * Dynamic SVG leader line connecting 3D occurrence coordinates (0, 0) to the
 * HTML datum badge (dx, dy). Features:
 * - Small orthographic feature mark at the measured anchor.
 * - Thin dogleg extension line with a horizontal datum shelf.
 * - Restrained highlight on hover/active.
 * - Terminal tick at the frame intersection.
 */
function SpatialLeaderLine({
  dx,
  dy,
  selected,
  hovered,
}: {
  dx: number
  dy: number
  selected: boolean
  hovered: boolean
}) {
  const isRight = dx > 0
  const elbowX = dx * 0.45
  const shelfLength = 80
  const shelfEndX = isRight ? dx + shelfLength : dx - shelfLength

  const active = selected || hovered
  const strokeColor = active ? '#00e5ff' : 'rgba(34, 211, 238, 0.65)'
  const strokeWidth = active ? 1.5 : 1.1

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      style={{ width: 1, height: 1 }}
    >
      <defs>
        <filter id={`glow-${dx}-${dy}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00e5ff" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* 1. 3D Anchor Reticle at (0, 0) */}
      <g>
        {/* Orthographic feature cross and center mark; no decorative radar treatment. */}
        <line x1="-8" y1="0" x2="8" y2="0" stroke={strokeColor} strokeWidth="1" />
        <line x1="0" y1="-8" x2="0" y2="8" stroke={strokeColor} strokeWidth="1" />
        <circle cx="0" cy="0" r="2" fill={active ? '#00e5ff' : '#38bdf8'} />
      </g>

      {/* 2. Dogleg Leader Line + Datum Shelf */}
      <path
        d={`M 0 0 L ${elbowX} ${dy} L ${shelfEndX} ${dy}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={active ? `url(#glow-${dx}-${dy})` : undefined}
        className={active ? 'leader-line-flow' : undefined}
      />

      {/* 3. Terminal datum tick at badge junction */}
      <line
        x1={dx}
        y1={dy - 6}
        x2={dx}
        y2={dy + 6}
        stroke={strokeColor}
        strokeWidth={strokeWidth + 0.5}
        opacity={active ? '1' : '0.75'}
      />
    </svg>
  )
}

/**
 * Single Spatial Hotspot Item.
 * Tracks 3D position with live explosion offsets and renders a horizontal drawing-style leader/frame.
 */
function HotspotAnchor({
  def,
  entry,
  selected,
}: {
  def: (typeof HOTSPOTS)[number]
  entry: RoleMapEntry
  selected: boolean
}) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const config = HOTSPOT_CONFIG[def.id] ?? { dx: 220, dy: -90, unitOffset: 0 }
  const anchorOffset = def.annotation?.anchorOffset ?? [0, 0, 0]

  // 60 fps tracking of explosion translation so anchor coordinates follow exploded CAD parts
  useFrame(() => {
    if (!groupRef.current) return
    const explode = telemetry.rig.explodeFactor
    const offsetZ = config.unitOffset * explode
    groupRef.current.position.set(
      entry.bboxCenter[0] + anchorOffset[0],
      entry.bboxCenter[1] + anchorOffset[1],
      entry.bboxCenter[2] + anchorOffset[2] + offsetZ,
    )
  })

  const isRight = config.dx > 0

  return (
    <group
      ref={groupRef}
      position={[
        entry.bboxCenter[0] + anchorOffset[0],
        entry.bboxCenter[1] + anchorOffset[1],
        entry.bboxCenter[2] + anchorOffset[2],
      ]}
    >
      <Html
        center={false}
        distanceFactor={0.38}
        zIndexRange={[40, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="relative"
        >
          {/* Responsive SVG Leader Line connecting (0,0) to badge */}
          <SpatialLeaderLine
            dx={config.dx}
            dy={config.dy}
            selected={selected}
            hovered={hovered}
          />

          {/* Horizontal orthographic datum/frame surface. */}
          <div
            style={{
              position: 'absolute',
              left: `${config.dx}px`,
              top: `${config.dy - 14}px`,
              transform: isRight ? 'none' : 'translateX(-100%)',
              transformOrigin: isRight ? 'left center' : 'right center',
            }}
          >
            <HotspotButton
              def={def}
              selected={selected}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            />
          </div>
        </div>
      </Html>
    </group>
  )
}

/**
 * Module 4 — clickable 3D spatial hotspot annotations with dynamic SVG leader lines.
 *
 * Anchors come from role-map.json (the pipeline's authoritative name/anchor
 * source: 316 part occurrences with world-space bbox centers). Rendered inside
 * the hero group so they track rotation and explosion.
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

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const rotor = anchors.find(({ def }) => def.id === 'rotor')
    const motor = anchors.find(({ def }) => def.id === 'motor-housing')
    if (!rotor || !motor) return
    const rotorOffset = rotor.def.annotation?.anchorOffset ?? [0, 0, 0]
    const motorOffset = motor.def.annotation?.anchorOffset ?? [0, 0, 0]
    const same = rotorOffset.every((value, index) =>
      Math.abs(value - motorOffset[index]) < 0.0001,
    ) && rotor.entry.bboxCenter.every((value, index) =>
      Math.abs(value - motor.entry.bboxCenter[index]) < 0.0001,
    )
    if (same) console.warn('[Hotspots] rotor and motor-bore anchors coincide')
  }, [anchors])

  return (
    <>
      {anchors
        .filter(({ def }) => def.chapters.includes(chapter as ChapterIndex))
        .map(({ def, entry }) => (
          <HotspotAnchor
            key={def.id}
            def={def}
            entry={entry}
            selected={selected === def.id}
          />
        ))}
    </>
  )
}
