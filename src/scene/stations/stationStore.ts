/**
 * Bridge between the in-canvas StationDriver (which knows where things are on screen) and the
 * DOM ToleranceStations overlay (which owns the SVG + typography). The driver fills ONE
 * preallocated frame per render and hands it to whatever apply() the overlay registered —
 * no React state per frame, no allocation (repo rule).
 */

export interface StationFrame {
  /** Index into STATIONS, or -1 when no station is live. */
  index: number
  /** Local time 0..1 inside the station window. */
  u: number
  width: number
  height: number
  /** Screen px; `anchor[2]` is 1 when the anchor is in front of the camera. */
  anchor: [number, number, number]
  secondary: [number, number, number]
  /** Screen-space bounds of the whole model this frame: minX, minY, maxX, maxY. */
  model: [number, number, number, number]
  /** Projected drivetrain axis segment (S1 centreline): x1, y1, x2, y2, visible. */
  axis: [number, number, number, number, number]
}

export const stationFrame: StationFrame = {
  index: -1,
  u: 0,
  width: 1,
  height: 1,
  anchor: [0, 0, 0],
  secondary: [0, 0, 0],
  axis: [0, 0, 0, 0, 0],
  model: [0, 0, 0, 0],
}

type Apply = (frame: StationFrame) => void

let applyFn: Apply | null = null

export function registerStationOverlay(fn: Apply | null): void {
  applyFn = fn
}

export function pushStationFrame(): void {
  applyFn?.(stationFrame)
}
