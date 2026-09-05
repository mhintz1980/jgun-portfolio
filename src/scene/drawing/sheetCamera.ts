import { Vector3 } from 'three'
import {
  SHEET_FOV,
  SHEET_ROTATION,
  SHEET_ZONES,
  type DrawingLayout,
} from './drawingGeometry'
import { INTRO_PHASES, smooth01 } from './introTimeline'

/**
 * Intro camera framing over the sheet.
 *
 * The sheet lies flat in the world XZ plane with its normal on +Y, so every intro pose is
 * "directly above a point on the print". The camera's up vector is handled by CameraRig,
 * which starts it on the sheet's printed-up axis and rolls it to world up as the view
 * stands into the CH.01 hero perspective.
 *
 * Desktop holds one fitted pose for the whole intro: the sheet fills 92% of viewport height
 * and roughly 67% of its width on 16:9, leaving the dark backdrop margin left and right.
 * That margin is intended — the border and title block are never cropped.
 *
 * Narrow viewports (390 x 844) cannot read a fitted C sheet, so the intro becomes a
 * scroll-driven push-in and pan (owner ruling 2026-09-05, Item 7.5):
 *   establishing whole sheet -> push in to the title block -> pan across the view block ->
 *   settle on the primary elevation before the pulse starts.
 * The sheet stays landscape and right-way-up throughout; there is no portrait arrangement.
 */

const FOV_RADIANS = (SHEET_FOV * Math.PI) / 180
const VISIBLE_HEIGHT_PER_METRE = 2 * Math.tan(FOV_RADIANS / 2)

/** Camera distance that fits `width` sheet-metres across the viewport, plus a margin. */
function distanceForWidth(width: number, aspect: number, margin: number): number {
  return (width * (1 + margin)) / (VISIBLE_HEIGHT_PER_METRE * Math.max(aspect, 1e-3))
}

/** Sheet-plane point -> world. Sheet +X maps to world -Z and sheet +Y maps to world -X. */
export function sheetPointToWorld(x: number, y: number, out: Vector3): Vector3 {
  return out.set(x, y, 0).applyMatrix4(SHEET_ROTATION)
}

interface Station {
  /** Intro-normalized scroll time this station is reached. */
  t: number
  /** Sheet-plane point the camera looks at. */
  x: number
  y: number
  /** Camera height above the sheet. */
  distance: number
}

const centreOf = (zone: { x: number; y: number; w: number; h: number }): [number, number] => [
  zone.x + zone.w / 2,
  zone.y + zone.h / 2,
]

/**
 * Station list for the narrow-viewport pan. Everything is derived from the sheet zones and
 * the viewport aspect, so a different phone width re-fits rather than drifting off the sheet.
 */
function narrowStations(layout: DrawingLayout, aspect: number): Station[] {
  const [titleX, titleY] = centreOf(SHEET_ZONES.titleBlock)
  const [viewsX, viewsY] = centreOf(SHEET_ZONES.views)
  const primary = layout.views[0]
  return [
    { t: 0, x: 0, y: 0, distance: distanceForWidth(layout.width, aspect, 0.06) },
    { t: 0.08, x: 0, y: 0, distance: distanceForWidth(layout.width, aspect, 0.06) * 0.63 },
    { t: 0.16, x: titleX, y: titleY, distance: distanceForWidth(SHEET_ZONES.titleBlock.w, aspect, 0.02) },
    { t: 0.26, x: viewsX, y: viewsY, distance: distanceForWidth(SHEET_ZONES.views.w, aspect, 0.02) },
    {
      t: INTRO_PHASES.pulseStart,
      x: layout.primaryCenter.x,
      y: layout.primaryCenter.y,
      distance: distanceForWidth(primary.rect[2], aspect, 0.06),
    },
  ]
}

const scratch = new Vector3()

/**
 * Write the intro camera pose for intro-normalized scroll time `t`.
 * Returns the framing distance so telemetry can record the push-in.
 */
export function introCameraPose(
  layout: DrawingLayout,
  aspect: number,
  t: number,
  outPosition: Vector3,
  outTarget: Vector3,
): number {
  if (!layout.narrow) {
    outTarget.set(0, 0, 0)
    outPosition.set(0, layout.fitDistance, 0)
    return layout.fitDistance
  }

  const stations = narrowStations(layout, aspect)
  let from = stations[0]
  let to = stations[0]
  for (let i = 1; i < stations.length; i += 1) {
    if (t >= stations[i].t) continue
    from = stations[i - 1]
    to = stations[i]
    break
  }
  if (t >= stations[stations.length - 1].t) {
    from = stations[stations.length - 1]
    to = from
  }
  const span = to.t - from.t
  const k = span > 1e-6 ? smooth01((t - from.t) / span) : 1
  const distance = from.distance + (to.distance - from.distance) * k
  // Never frame off the sheet: clamp the look-at point so the visible rectangle stays inside
  // the paper. When the visible rectangle is larger than the sheet on an axis, the clamp
  // collapses to 0 and the sheet is centred on that axis, which is what a portrait viewport
  // does vertically with a landscape sheet.
  const visibleHeight = VISIBLE_HEIGHT_PER_METRE * distance
  const visibleWidth = visibleHeight * aspect
  const limitX = Math.max(0, (layout.width - visibleWidth) / 2)
  const limitY = Math.max(0, (layout.height - visibleHeight) / 2)
  const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))
  const x = clamp(from.x + (to.x - from.x) * k, limitX)
  const y = clamp(from.y + (to.y - from.y) * k, limitY)
  sheetPointToWorld(x, y, outTarget)
  outPosition.copy(outTarget).add(scratch.set(0, distance, 0))
  return distance
}
