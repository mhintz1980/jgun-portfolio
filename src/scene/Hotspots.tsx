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
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${def.label} · ${def.detail}`}
      onClick={() => setScrollState({ hotspotId: selected ? null : def.id })}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      className={`group pointer-events-auto cursor-pointer select-none whitespace-nowrap border px-3 py-1.5 font-mono text-[10px] tracking-widest outline-none backdrop-blur-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        selected
          ? 'border-cyan-300 bg-cyan-950/90 text-cyan-100 shadow-[0_0_20px_rgba(0,229,255,0.5)] ring-1 ring-cyan-400/60'
          : 'border-cyan-400/50 bg-black/80 text-cyan-300/90 hover:border-cyan-300 hover:bg-black/95 hover:text-cyan-100 hover:shadow-[0_0_15px_rgba(0,229,255,0.35)]'
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full transition-all duration-200 ${
            selected
              ? 'bg-cyan-300 shadow-[0_0_8px_#00e5ff] ring-2 ring-cyan-400/50'
              : 'bg-cyan-400/70 group-hover:bg-cyan-300'
          }`}
        />
        <span className="font-bold tracking-wider">{def.kind === 'inspect' ? '◉ INSPECT' : '◎ DATUM'}</span>
        <span className="text-cyan-400/40">·</span>
        <span className="font-semibold text-cyan-100/95">{def.label}</span>
      </span>
    </button>
  )
}

/**
 * Dynamic SVG leader line connecting 3D occurrence coordinates (0, 0) to the
 * HTML datum badge (dx, dy). Features:
 * - 3D anchor reticle (crosshairs, center dot, radar ring).
 * - Chamfered dogleg elbow line with horizontal datum shelf.
 * - Glowing laser stroke with continuous pulse flow on hover/active.
 * - Terminal tick at the badge intersection.
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
        {/* Outer subtle crosshairs */}
        <line x1="-12" y1="0" x2="-5" y2="0" stroke={strokeColor} strokeWidth="1" opacity="0.8" />
        <line x1="5" y1="0" x2="12" y2="0" stroke={strokeColor} strokeWidth="1" opacity="0.8" />
        <line x1="0" y1="-12" x2="0" y2="-5" stroke={strokeColor} strokeWidth="1" opacity="0.8" />
        <line x1="0" y1="5" x2="0" y2="12" stroke={strokeColor} strokeWidth="1" opacity="0.8" />

        {/* Outer dashed radar ring */}
        <circle
          cx="0"
          cy="0"
          r="10"
          stroke={strokeColor}
          strokeWidth="0.9"
          strokeDasharray="3 2"
          fill="none"
          opacity={active ? '0.9' : '0.4'}
        />

        {/* Inner concentric ring */}
        <circle
          cx="0"
          cy="0"
          r="5"
          stroke={strokeColor}
          strokeWidth="1"
          fill={active ? 'rgba(0, 229, 255, 0.2)' : 'none'}
        />

        {/* Solid center datum dot */}
        <circle cx="0" cy="0" r="2.5" fill={active ? '#00e5ff' : '#38bdf8'} />

        {/* Active expanding pulse ring */}
        {selected && (
          <circle
            cx="0"
            cy="0"
            r="14"
            stroke="#00e5ff"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
            className="animate-ping"
          />
        )}
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
 * Tracks 3D position with live explosion offsets and renders dynamic leader line + angled 3D datum badge.
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

  // 60 fps tracking of explosion translation so anchor coordinates follow exploded CAD parts
  useFrame(() => {
    if (!groupRef.current) return
    const explode = telemetry.rig.explodeFactor
    const offsetZ = config.unitOffset * explode
    groupRef.current.position.set(
      entry.bboxCenter[0],
      entry.bboxCenter[1],
      entry.bboxCenter[2] + offsetZ,
    )
  })

  const isRight = config.dx > 0

  return (
    <group
      ref={groupRef}
      position={[entry.bboxCenter[0], entry.bboxCenter[1], entry.bboxCenter[2]]}
    >
      <Html
        center={false}
        distanceFactor={0.38}
        zIndexRange={[40, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="relative"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Responsive SVG Leader Line connecting (0,0) to badge */}
          <SpatialLeaderLine
            dx={config.dx}
            dy={config.dy}
            selected={selected}
            hovered={hovered}
          />

          {/* HTML Datum Badge with 3D CAD engineering plane perspective tilt */}
          <div
            style={{
              position: 'absolute',
              left: `${config.dx}px`,
              top: `${config.dy - 14}px`,
              transform: `${
                isRight ? 'none' : 'translateX(-100%)'
              } perspective(1000px) rotateY(${isRight ? '-16deg' : '16deg'}) rotateX(6deg) rotateZ(${
                isRight ? '-1.5deg' : '1.5deg'
              })`,
              transformOrigin: isRight ? 'left center' : 'right center',
              transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
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
