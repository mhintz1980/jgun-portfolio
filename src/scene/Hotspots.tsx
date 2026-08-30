import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import { EXPLODE_OFFSETS, HOTSPOTS } from '../data/caseStudies'
import { characteristicKey, GdtSymbol } from '../components/GdtSymbols'
import { setScrollState, telemetry, useScrollValue } from '../state/scrollStore'
import type { ChapterIndex, HotspotDef, RoleMapEntry } from '../types/portfolio'

/** Module-level reusable vectors (r3f-scroll-performance-guard — zero GC). */
const _worldPos = new Vector3()
const _proj = new Vector3()

/**
 * Cross-anchor placement registry (JG-021 remediation): when the portrait
 * vertical bias composes the subject high, several badges clamp into the same
 * top band; each newly placed badge stacks below the ones placed earlier in
 * the SAME frame. Cleared on the clock epoch (identical for every useFrame
 * callback in one render pass), so responsive badges can never feed each
 * other's positions across frames and drift. Still pure ref mutation.
 */
const _placedBadges = new Map<string, { x: number; y: number; w: number; h: number }>()
let _badgeFrameEpoch = -1

/**
 * 2D nominal screen displacement and explosion offsets for Station 1 hotspots.
 */
const HANDLE_UNIT_OFFSET = EXPLODE_OFFSETS.handle
const HOTSPOT_CONFIG: Record<string, { dx: number; dy: number; unitOffset: number; offset?: [number, number, number] }> = {
  rotor: { dx: 220, dy: -100, unitOffset: HANDLE_UNIT_OFFSET, offset: [0, 0, -0.0315] },
  'motor-housing': { dx: 220, dy: 70, unitOffset: HANDLE_UNIT_OFFSET, offset: [0, 0, -0.019] },
  flange: { dx: 220, dy: -130, unitOffset: HANDLE_UNIT_OFFSET, offset: [0, 0.028, 0] },
  'gearbox-housing': { dx: 220, dy: 90, unitOffset: 0, offset: [0, 0.032, 0] },
  mcu: { dx: -220, dy: -90, unitOffset: HANDLE_UNIT_OFFSET, offset: [-0.003, 0, 0.002] },
  lcd: { dx: 200, dy: -100, unitOffset: HANDLE_UNIT_OFFSET, offset: [-0.003, 0, -0.006] },
  lipo: { dx: -220, dy: 90, unitOffset: HANDLE_UNIT_OFFSET, offset: [0.003, 0, 0.004] },
}

/**
 * Pure DOM hotspot marker (exported separately for test harnesses / Node smoke checks).
 * A real <button>, so Enter/Space activate natively; aria-pressed reflects toggle;
 * cyan focus-visible ring matches HUD chrome.
 */
export function HotspotButton({
  def,
  selected,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  def: HotspotDef
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
      className={`group pointer-events-auto cursor-pointer select-none max-w-[calc(100vw-32px)] md:max-w-none border px-2.5 py-1.5 font-mono text-[10px] tracking-widest outline-none backdrop-blur-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        selected
          ? 'border-cyan-300 bg-cyan-950/95 text-cyan-100 shadow-[0_0_20px_rgba(0,229,255,0.5)] ring-1 ring-cyan-400/60'
          : 'border-cyan-400/60 bg-black/85 text-cyan-300 hover:border-cyan-300 hover:bg-black/95 hover:text-cyan-100 hover:shadow-[0_0_15px_rgba(0,229,255,0.35)]'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-200 ${
            selected
              ? 'bg-cyan-300 shadow-[0_0_8px_#00e5ff] ring-2 ring-cyan-400/50'
              : 'bg-cyan-400/70 group-hover:bg-cyan-300'
          }`}
        />

        {/* 1. ASME Y14.5 Boxed Datum Flag: [ -A- ] */}
        {datumLetter && (
          <span className="inline-flex h-5 min-w-[22px] shrink-0 items-center justify-center border border-cyan-300 bg-cyan-950/80 px-1 font-mono text-[11px] font-bold text-cyan-100 shadow-[0_0_8px_rgba(0,229,255,0.4)]">
            -{datumLetter}-
          </span>
        )}

        {/* 2. ASME Y14.5 Segmented Feature Control Frame — the leading
            compartment carries the characteristic SYMBOL (GdtSymbol), never
            the spelled-out word (JG-021 remediation); non-Y14.5 spec frames
            (e.g. 'ATTENUATION') legitimately stay as text. */}
        {frame ? (
          <div className="inline-flex shrink-0 items-center border border-cyan-300/90 bg-cyan-950/40 text-cyan-100">
            {frame.characteristic && (
              <span
                className="flex h-5 items-center justify-center border-r border-cyan-300/70 px-1.5 font-mono text-[10px] font-semibold"
                title={frame.characteristic}
              >
                {characteristicKey(frame.characteristic) ? (
                  <GdtSymbol name={frame.characteristic} />
                ) : (
                  frame.characteristic
                )}
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
        <span className="truncate font-semibold tracking-wider text-cyan-100/95">{def.label}</span>

        {/* 4. Process Note */}
        {processNote && !frame && !datumLetter && (
          <>
            <span className="hidden text-cyan-400/40 sm:inline">·</span>
            <span className="hidden text-[9px] text-cyan-300/70 sm:inline">{processNote}</span>
          </>
        )}
      </div>
    </button>
  )
}

/**
 * Static SVG leader line presentation for standalone / SSR / fallback rendering.
 */
export function SpatialLeaderLine({
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
  const shelfLength = 60
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

      <g>
        <line x1="-8" y1="0" x2="8" y2="0" stroke={strokeColor} strokeWidth="1" />
        <line x1="0" y1="-8" x2="0" y2="8" stroke={strokeColor} strokeWidth="1" />
        <circle cx="0" cy="0" r="2" fill={active ? '#00e5ff' : '#38bdf8'} />
      </g>

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

export interface SpatialHotspotAnchorProps {
  def: HotspotDef
  selected: boolean
  position?: [number, number, number]
  anchorOffset?: [number, number, number]
  unitOffset?: number
  visible?: boolean
  nominalDx?: number
  nominalDy?: number
}

/**
 * Unified Safe-Area Spatial Hotspot Anchor (JG-021 WS4).
 *
 * Dynamically projects 3D CAD occurrence coordinates into screen space inside useFrame,
 * clamps badge positions into responsive safe-area margins (desktop and 390x844 mobile),
 * adjusts leader line doglegs, and mutates DOM transforms directly on refs (zero React re-renders).
 */
export function SpatialHotspotAnchor({
  def,
  selected,
  position = [0, 0, 0],
  anchorOffset = [0, 0, 0],
  unitOffset = 0,
  visible = true,
  nominalDx,
  nominalDy,
}: SpatialHotspotAnchorProps) {
  const groupRef = useRef<Group>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const badgeWrapperRef = useRef<HTMLDivElement>(null)
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const tickRef = useRef<SVGLineElement>(null)
  const [hovered, setHovered] = useState(false)

  const { camera, size } = useThree()

  useFrame((frameState) => {
    if (!groupRef.current || !containerRef.current || !badgeWrapperRef.current || !buttonContainerRef.current) return

    // Per-frame registry reset (clock epoch is shared by all useFrame calls
    // in one render pass) — see _placedBadges note above.
    if (frameState.clock.elapsedTime !== _badgeFrameEpoch) {
      _badgeFrameEpoch = frameState.clock.elapsedTime
      _placedBadges.clear()
    }

    if (!visible) {
      containerRef.current.style.display = 'none'
      return
    }

    // Dynamic axial explosion offset if configured (Station 1 handle extraction)
    const explode = telemetry.rig.explodeFactor
    const offsetZ = unitOffset * explode
    groupRef.current.position.set(
      position[0] + anchorOffset[0],
      position[1] + anchorOffset[1],
      position[2] + anchorOffset[2] + offsetZ,
    )

    // 1. Get 3D world position of anchor
    groupRef.current.getWorldPosition(_worldPos)

    // 2. Project to NDC (-1 to +1)
    _proj.copy(_worldPos).project(camera)

    // 3. Frustum & depth culling: hide if behind camera or outside visible frustum
    if (_proj.z < -1.0 || _proj.z > 1.0 || _proj.x < -1.3 || _proj.x > 1.3 || _proj.y < -1.3 || _proj.y > 1.3) {
      containerRef.current.style.display = 'none'
      return
    }
    containerRef.current.style.display = 'block'

    // 4. Convert NDC to viewport pixel coordinates
    const ax = (_proj.x * 0.5 + 0.5) * size.width
    const ay = (-_proj.y * 0.5 + 0.5) * size.height

    // 5. Safe area bounds (mobile safeTop clears the station-nav row — the
    // badge renders 14 px above `by`, and the nav ends at y ≈ 61 on 390×844).
    const isMobile = size.width <= 768
    const safeLeft = isMobile ? 12 : 24
    const safeRight = size.width - (isMobile ? 12 : 24)
    const safeTop = isMobile ? 80 : 60
    const safeBottom = size.height - (isMobile ? 70 : 60)

    // Dynamic measurement of badge width from real DOM
    const badgeW = buttonContainerRef.current?.offsetWidth || (isMobile ? 220 : 380)
    const badgeH = buttonContainerRef.current?.offsetHeight || 32

    // 6. Responsive side selection: prefer nominalDx or screen side
    let isRight = nominalDx !== undefined ? nominalDx > 0 : ax < size.width * 0.5

    // Auto-flip only when nominalDx is not specified and badge clips offscreen
    if (nominalDx === undefined) {
      if (isRight && ax + 25 + badgeW > safeRight && ax - 25 - badgeW >= safeLeft) {
        isRight = false
      } else if (!isRight && ax - 25 - badgeW < safeLeft && ax + 25 + badgeW <= safeRight) {
        isRight = true
      }
    }

    // 7. Clamp badge coordinates strictly within safe area
    const spanX = isMobile ? 20 : (nominalDx ? Math.abs(nominalDx) : 150)
    let bx = isRight ? ax + spanX : ax - spanX
    if (isRight) {
      bx = Math.max(safeLeft, Math.min(bx, safeRight - badgeW))
    } else {
      bx = Math.min(safeRight, Math.max(bx, safeLeft + badgeW))
    }

    const spanY = nominalDy !== undefined ? nominalDy : (ay > size.height * 0.5 ? -60 : 60)
    let by = ay + spanY
    by = Math.max(safeTop, Math.min(by, safeBottom - badgeH))

    // 7.5 Vertical stacking against badges placed earlier this frame (JG-021
    // remediation): clamping alone lets several badges land on the same top
    // rows when the subject composes high; push each subsequent badge below
    // the live ones. The registry stores RENDERED rects — left-side badges
    // paint at bx - badgeW (translateX(-100%)) and every badge paints 14 px
    // above `by`, so wrapper-space comparison would miss real overlaps.
    const renderX = isRight ? bx : bx - badgeW
    let stacking = true
    let guard = 0
    while (stacking && guard++ < 12) {
      stacking = false
      for (const [key, rect] of _placedBadges) {
        if (key === def.id) continue
        const overlaps =
          renderX < rect.x + rect.w - 4 &&
          rect.x < renderX + badgeW - 4 &&
          by - 14 < rect.y + rect.h + 6 &&
          rect.y < by - 14 + badgeH + 6
        if (overlaps) {
          by = rect.y + 14 + rect.h + 6
          stacking = true
        }
      }
      by = Math.min(by, safeBottom - badgeH)
    }
    _placedBadges.set(def.id, { x: renderX, y: by - 14, w: badgeW, h: badgeH })

    const dx = bx - ax
    const dy = by - ay

    // 8. Dynamic SVG leader line path
    const elbowX = dx * 0.45
    const shelfLength = Math.min(60, Math.max(20, Math.abs(dx) * 0.35))
    const shelfEndX = isRight ? dx + shelfLength : dx - shelfLength

    if (pathRef.current) {
      pathRef.current.setAttribute('d', `M 0 0 L ${elbowX} ${dy} L ${shelfEndX} ${dy}`)
    }
    if (tickRef.current) {
      tickRef.current.setAttribute('x1', `${dx}`)
      tickRef.current.setAttribute('x2', `${dx}`)
      tickRef.current.setAttribute('y1', `${dy - 6}`)
      tickRef.current.setAttribute('y2', `${dy + 6}`)
    }

    // 9. Mutate badge container transform (zero React re-render)
    badgeWrapperRef.current.style.transform = `translate3d(${dx}px, ${dy - 14}px, 0)`
    badgeWrapperRef.current.style.transformOrigin = isRight ? 'left center' : 'right center'
    buttonContainerRef.current.style.transform = isRight ? 'none' : 'translateX(-100%)'
    buttonContainerRef.current.style.transformOrigin = isRight ? 'left center' : 'right center'
  })

  const active = selected || hovered
  const strokeColor = active ? '#00e5ff' : 'rgba(34, 211, 238, 0.65)'
  const strokeWidth = active ? 1.5 : 1.1

  return (
    <group
      ref={groupRef}
      position={[
        position[0] + anchorOffset[0],
        position[1] + anchorOffset[1],
        position[2] + anchorOffset[2],
      ]}
    >
      <Html
        center={false}
        zIndexRange={[40, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div ref={containerRef} className="relative">
          {/* Dynamic SVG Leader Line */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            style={{ width: 1, height: 1 }}
          >
            <g>
              <line x1="-8" y1="0" x2="8" y2="0" stroke={strokeColor} strokeWidth="1" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke={strokeColor} strokeWidth="1" />
              <circle cx="0" cy="0" r="2" fill={active ? '#00e5ff' : '#38bdf8'} />
            </g>
            <path
              ref={pathRef}
              d="M 0 0 L 60 -40 L 100 -40"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={active ? 'leader-line-flow' : undefined}
            />
            <line
              ref={tickRef}
              x1="100"
              y1="-46"
              x2="100"
              y2="-34"
              stroke={strokeColor}
              strokeWidth={strokeWidth + 0.5}
              opacity={active ? '1' : '0.75'}
            />
          </svg>

          {/* Imperatively positioned badge wrapper */}
          <div
            ref={badgeWrapperRef}
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              transform: 'translate3d(120px, -40px, 0)',
            }}
          >
            <div ref={buttonContainerRef}>
              <HotspotButton
                def={def}
                selected={selected}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              />
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}

/**
 * Module 4 — Station 1 clickable 3D spatial hotspot annotations with dynamic safe-area leader lines.
 */
export function Hotspots() {
  const [roleMap, setRoleMap] = useState<RoleMapEntry[]>([])
  const chapter = useScrollValue('chapter')
  const progress = useScrollValue('progress')
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
    const rowsFor = (name: string): RoleMapEntry[] => {
      const exact = roleMap.filter((entry) => entry.occurrence === name)
      if (exact.length > 0) return exact
      const normalized = normalizeOccurrence(name)
      return roleMap.filter((entry) => normalizeOccurrence(entry.occurrence) === normalized)
    }
    return HOTSPOTS.filter((h) => h.chapters.includes(0) || h.chapters.includes(1) || h.window).flatMap((def) => {
      const rows = rowsFor(def.occurrence)
      if (rows.length === 0) return []
      let entry = rows[0]
      if (rows.length > 1) {
        if (def.pickNear) {
          const [px, py, pz] = def.pickNear
          entry = rows.reduce((best, row) => {
            const d = (r: RoleMapEntry): number =>
              (r.bboxCenter[0] - px) ** 2 + (r.bboxCenter[1] - py) ** 2 + (r.bboxCenter[2] - pz) ** 2
            return d(row) < d(best) ? row : best
          }, rows[0])
        } else {
          console.warn(
            `[Hotspots] ${def.occurrence} matches ${rows.length} role-map rows with no pickNear — using the first`,
          )
        }
      }
      return [{ def, entry }]
    })
  }, [roleMap])

  return (
    <>
      {anchors
        .filter(
          ({ def }) =>
            (def.window
              ? progress >= def.window[0] && progress <= def.window[1]
              : def.chapters.includes(chapter as ChapterIndex)),
        )
        .map(({ def, entry }) => {
          const config = HOTSPOT_CONFIG[def.id] ?? { dx: 180, dy: -80, unitOffset: 0 }
          return (
            <SpatialHotspotAnchor
              key={def.id}
              def={def}
              position={entry.bboxCenter}
              anchorOffset={config.offset}
              unitOffset={config.unitOffset}
              nominalDx={config.dx}
              nominalDy={config.dy}
              selected={selected === def.id}
            />
          )
        })}
    </>
  )
}

