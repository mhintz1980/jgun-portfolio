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

type Vec3 = [number, number, number]

/** The seven authored shots. `from`/`to` are RL300-local progress; the titles and notes
 *  are the editorial overlay's source of truth, so the copy cannot drift from the camera. */
export const SHOTS = [
  { title: 'The object', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE', from: 0, to: .12,
    caption: 'A blue shell. A complex machine. One considered envelope.' },
  { title: 'The incision', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE', from: .12, to: .27,
    caption: 'A finished section edge reveals shell, insulation, equipment and the wall that carries them.' },
  { title: 'The main intake', note: 'RL300-SAFE · SUPPLY AIR', from: .27, to: .41,
    caption: 'The existing supply: one continuous path from louvre to plenum, with a direction you can read.' },
  { title: 'A second breath', note: 'LOWER INTAKE · DESIGN CONCEPT', from: .41, to: .61,
    caption: 'Proposed lower intake: open louvres feed a shallow duct and an outlet beneath the engine.' },
  { title: 'Two feeds, one exit', note: 'RL300-SAFE · AIR PATH', from: .61, to: .76,
    caption: 'Both supplies warm through the equipment region and join a single shared discharge.' },
  { title: 'Control the noise', note: 'RL300-SAFE · ACOUSTIC STRUCTURE', from: .76, to: .89,
    caption: 'Two distinct mechanisms: absorptive structure for the air path, isolation for the machine.' },
  { title: 'Resolve', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE', from: .89, to: 1,
    caption: 'The section closes, and the downstream transition takes ownership of the story.' },
] as const

/** Camera keyframes. The eye stays on the +x side throughout — the clip removes the near
 *  wall, so the section is only legible from there — and never enters the model envelope
 *  (every `position[0]` clears `MODEL_BOUNDS.max[0]`). Lens language follows the plan:
 *  30–34° for exteriors, 36–40° when close or deliberately wider. Minimal roll, no whips. */
const KEYS: { at: number; position: Vec3; target: Vec3; fov: number }[] = [
  // 01 The object — low, long-lens three-quarter; the approach reveals the chamber's depth.
  { at: 0, position: [4.3, .92, 4.55], target: [0, 1, .05], fov: 30 },
  { at: .12, position: [3.62, 1.06, 3.78], target: [0, 1.02, .05], fov: 30 },
  // 02 The incision — rise toward the section-facing side, equipment and wall together.
  { at: .27, position: [3.28, 1.78, 2.34], target: [0, 1.18, .1], fov: 34 },
  // 03 The main intake — track the existing intake/plenum side (DUCT_INTAKE, z .43…1.36).
  { at: .41, position: [3.95, 1.75, 3.15], target: [0, 1.25, .95], fov: 32 },
  // 04 A second breath — descend beside the skid to its underside (ISOLATION_MOUNTS, y 0….05)…
  { at: .51, position: [3.7, .28, 2.65], target: [0, .55, .8], fov: 33 },
  // …then arc back toward the engine.
  { at: .61, position: [4.05, .95, .45], target: [0, 1, .1], fov: 34 },
  // 05 Two feeds, one exit — wider, carrying both supplies to the shared discharge (DUCT_EXHAUST, z −1.68…−.30).
  { at: .76, position: [4.75, 1.55, -1.15], target: [0, 1.15, -.3], fov: 38 },
  // 06 Control the noise — the exposed acoustic structure (ACOUSTIC_BAFFLES, y 1.32…1.86) over the mounts.
  { at: .89, position: [3.45, 2.35, 2.45], target: [.05, 1.45, .85], fov: 31 },
  // 07 Resolve — pull back into the chamber for an exterior close.
  { at: 1, position: [4.26, 1.34, 4.06], target: [0, 1.05, .05], fov: 34 },
]

/** Section reveal: opens across shot 02, holds open through 03–06, closes across 07.
 *  Written as one expression so it stays a pure function of `u` and reverses exactly. */
export const cutAt = (u: number) => smooth(.13, .3, u) - smooth(.9, .99, u)

/** How far shot 04's underside pass has been entered. Kept as a named signal so the
 *  lower-intake dressing can key off the camera rather than re-deriving a window. */
export const undersideAt = (u: number) => smooth(.43, .51, u) - smooth(.51, .62, u)

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
