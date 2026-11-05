import { Easing, interpolate } from 'remotion'

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** 0→1 over [a, b] with an ease (default: expo-ish out). */
export const ramp = (f: number, a: number, b: number, easing: (t: number) => number = EASE.out) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  draw: Easing.bezier(0.55, 0, 0.3, 1), // the site's name-draw curve
  in: Easing.bezier(0.7, 0, 0.84, 0),
  linear: (t: number) => t,
} as const
