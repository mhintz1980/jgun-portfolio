import { BEATS, collectKeys, WINDOWS, type Vec3, type Win } from './beats'

/** RL300 "The Quiet Machine" camera sequence. Local study progress only — this never
 *  feeds the portfolio's narrative/GSAP clock, and `u` is RL300-local, not global. */
export const clamp01 = (x: number) => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0))
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Measured world bounds of `public/models/msp-enclosure.glb` (POSITION accessor extrema
 *  through the node transforms): x ±0.800, y 0 → 2.107, z ±1.683. Every camera endpoint
 *  below is authored against these, not against eyeballed numbers. */
export const MODEL_BOUNDS = { min: [-.8, 0, -1.683], max: [.8, 2.107, 1.683] } as const

/** Clip keeps `x ≤ plane.constant`. `+0.85` clears the model entirely (closed exterior);
 *  `-0.15` is the deepest the sequence ever cuts, past the centreline. */
export const CLOSED_CUT = .85
export const DEEPEST_CUT = -.15

/** The authored shots, one per beat record in `beats.ts`. `from`/`to` are RL300-local progress;
 *  the titles and notes are the editorial overlay's source of truth, so the copy cannot drift
 *  from the camera. */
export const SHOTS = BEATS.map(({ title, note, from, to, caption }) => ({ title, note, from, to, caption }))

/** Camera keyframes, flattened from the beat records in beat order. The eye stays on the +x
 *  side throughout — the clip removes the near wall, so the section is only legible from
 *  there — and never enters the model envelope (every `position[0]` clears
 *  `MODEL_BOUNDS.max[0]`). Lens language follows the plan: 30–34° for exteriors, 36–40° when
 *  close or deliberately wider. Minimal roll, no whips. */
const KEYS = collectKeys(BEATS)

/** `smooth` over a named window. */
export const smoothWindow = (w: Win, x: number) => smooth(w[0], w[1], x)

/** Section reveal: opens across shot 02, holds open through 03–06, closes across 07.
 *  Written as one expression so it stays a pure function of `u` and reverses exactly. */
export const cutAt = (u: number) => smoothWindow(WINDOWS.cutOpen, u) - smoothWindow(WINDOWS.cutClose, u)

/** How far shot 04's underside pass has been entered. Kept as a named signal so the
 *  lower-intake dressing can key off the camera rather than re-deriving a window. */
export const undersideAt = (u: number) => smoothWindow(WINDOWS.undersideIn, u) - smoothWindow(WINDOWS.undersideOut, u)

export const shotIndexAt = (u: number) => {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (u >= SHOTS[i].from) return i
  return 0
}

export function evaluateShot(progress: number, portrait: boolean) {
  const u = clamp01(progress)
  let i = KEYS.length - 2
  while (i > 0 && u < KEYS[i].at) i--
  const a = KEYS[i], b = KEYS[i + 1]
  const t = smooth(a.at, b.at, u)
  const position = [0, 0, 0] as Vec3
  const target = [0, 0, 0] as Vec3
  for (let k = 0; k < 3; k++) {
    position[k] = a.position[k] + (b.position[k] - a.position[k]) * t
    target[k] = a.target[k] + (b.target[k] - a.target[k]) * t
  }
  let fov = a.fov + (b.fov - a.fov) * t
  // Portrait is a separately framed camera; pull back and open the lens so the stage
  // still holds the assembly at 390px without re-authoring every endpoint.
  if (portrait) {
    const distance = 1.22
    for (let k = 0; k < 3; k++) position[k] = target[k] + (position[k] - target[k]) * distance
    fov += 4
  }
  const cut = cutAt(u)
  return {
    u, cut, underside: undersideAt(u),
    plane: CLOSED_CUT + (DEEPEST_CUT - CLOSED_CUT) * cut,
    position, target, fov, beat: shotIndexAt(u),
  }
}
