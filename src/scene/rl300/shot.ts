/** Milestone-2 local preview. Never feeds the portfolio's narrative/GSAP clock. */
export const clamp01 = (x: number) => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0))
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function evaluateShot(progress: number, portrait: boolean) {
  const u = clamp01(progress)
  const cut = smooth(.12, .48, u)
  const underside = smooth(.64, .94, u)
  const position = [
    4.8 - underside * 3.1,
    2.9 - underside * 3.0,
    4.9 - underside * 3.0,
  ] as [number, number, number]
  const target = [0, 1.02 - underside * .9, .02 + underside * .43] as [number, number, number]
  const framing = .85 + underside * .15
  for (let i = 0; i < 3; i++) position[i] = target[i] + (position[i] - target[i]) * framing
  // Portrait is a separately framed camera; keep the full assembly in the stage.
  if (portrait) {
    const distance = 1.25
    for (let i = 0; i < 3; i++) position[i] = target[i] + (position[i] - target[i]) * distance
  }
  return { u, cut, underside, plane: .85 - cut * 1.0, position, target, fov: 36,
    beat: underside > .5 ? 2 : cut > .5 ? 1 : 0 }
}
