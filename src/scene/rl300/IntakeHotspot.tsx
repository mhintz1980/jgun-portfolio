import { useEffect, useRef, useState } from 'react'
import { evaluateShot } from './shot'
import { BEATS, WINDOWS } from './beats'

/** Centre of the lower intake's louvre liner, world metres: the intake group sits at (0, .205, .03)
 *  and the liner's centre is (0, -.033, .5975) inside it (`LowerIntake.tsx`). */
export const INTAKE_ANCHOR = [0, .172, .6275] as const

/** The beat the badge points at. The click seeks to its first camera key (the underside pass)
 *  and the card copy is its own caption and note, so re-timing or re-wording the beat in
 *  `beats.ts` moves the badge's target with it. */
const INTAKE_BEAT = BEATS.find(beat => beat.id === 'second-breath')!
export const INTAKE_SEEK = INTAKE_BEAT.keys[0].at

/** The badge shows while the section is fully open: from the cut's last frame to the close's first. */
const SHOWN_FROM = WINDOWS.cutOpen[1]
const SHOWN_TO = WINDOWS.cutClose[0]

/** Screen position of the intake anchor inside a `width` x `height` stage at progress `u`. Plain
 *  math on the shot's own camera (look-at basis, +Y up, vertical fov), no `three`: this module is
 *  in the page's eager graph, and `three` is only meant to load with the lazy scene. */
export function projectIntake(u: number, width: number, height: number): { x: number; y: number; shown: boolean } {
  const none = { x: 0, y: 0, shown: false }
  if (!(width > 0 && height > 0) || u < SHOWN_FROM || u > SHOWN_TO) return none
  const { position, target, fov } = evaluateShot(u, width < 600)
  let fx = target[0] - position[0], fy = target[1] - position[1], fz = target[2] - position[2]
  const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl
  // right = forward x up(0,1,0); up' = right x forward
  let rx = -fz, ry = 0, rz = fx
  const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx
  const dx = INTAKE_ANCHOR[0] - position[0], dy = INTAKE_ANCHOR[1] - position[1], dz = INTAKE_ANCHOR[2] - position[2]
  const depth = dx * fx + dy * fy + dz * fz
  if (depth <= 0) return none
  const tan = Math.tan(fov * Math.PI / 360)
  const ndcX = (dx * rx + dy * ry + dz * rz) / (depth * tan * (width / height))
  const ndcY = (dx * ux + dy * uy + dz * uz) / (depth * tan)
  if (Math.abs(ndcX) > .94 || Math.abs(ndcY) > .94) return none
  return { x: (ndcX * .5 + .5) * width, y: (.5 - ndcY * .5) * height, shown: true }
}

/** One badge at the lower intake. A click seeks to the intake view and opens a detail card;
 *  Escape or Close dismisses it. The layer fills the stage and lets pointer events through. */
export function IntakeHotspot({ u, onSeek }: { u: number; onSeek: (u: number) => void }) {
  const layer = useRef<HTMLDivElement>(null)
  const badge = useRef<HTMLButtonElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const measure = () => { const el = layer.current; if (el) setSize({ width: el.clientWidth, height: el.clientHeight }) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const at = projectIntake(u, size.width, size.height)
  const card = open && at.shown
  useEffect(() => { if (!at.shown) setOpen(false) }, [at.shown])
  useEffect(() => {
    if (!card) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); badge.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [card])
  return <div className="qm-hotspot-layer" ref={layer}>
    {at.shown && <button ref={badge} className="qm-hotspot" style={{ left: at.x, top: at.y }} aria-label="Lower intake: details" aria-expanded={card}
      onClick={() => { onSeek(INTAKE_SEEK); setOpen(true) }}><span aria-hidden="true" /></button>}
    {card && <div className="qm-hotspot-card" role="dialog" aria-label="Lower intake">
      <p className="qm-hotspot-note">{INTAKE_BEAT.note}</p>
      <h2>{INTAKE_BEAT.title}</h2>
      <p>{INTAKE_BEAT.caption}</p>
      <button className="qm-hotspot-close" onClick={() => { setOpen(false); badge.current?.focus() }}>Close</button>
    </div>}
  </div>
}
