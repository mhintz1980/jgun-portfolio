import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { type Camera, Plane, Vector3 } from 'three'

/** The plotter pre-roll's two clip fronts, one per tab like the prepared model they sit on:
 *  linework exists left of `plot`, solid metal left of `fill`. They start as "keep everything",
 *  so a scene that never drives them renders exactly as before. */
export const DRAFT = {
  plot: new Plane(new Vector3(0, 1, 0), 1e6),
  fill: new Plane(new Vector3(0, 1, 0), 1e6),
}

/** Screen x far enough out that a front keeps (or drops) the whole frame. */
export const FRONT_ALL = 1e5
export const FRONT_NONE = -1e5

const MARGIN = 400
const a = new Vector3()
const b = new Vector3()
const probe = new Vector3()

/** Keep everything left of screen x `px`. The plane runs through the eye, so it projects to an
 *  exact vertical line at `px` whatever the view angle or lens shift (CameraRig's shiftX). */
export function setScreenFront(plane: Plane, camera: Camera, px: number, width = 1920) {
  if (px >= width + MARGIN || px <= -MARGIN) {
    plane.normal.set(0, 1, 0)
    plane.constant = px > 0 ? 1e6 : -1e6
    return
  }
  const x = (px / width) * 2 - 1
  a.set(x, -1, 0.5).unproject(camera)
  b.set(x, 1, 0.5).unproject(camera)
  plane.setFromCoplanarPoints(camera.position, a, b)
  probe.set(x - 0.25, 0, 0.5).unproject(camera)
  if (plane.distanceToPoint(probe) < 0) plane.negate()
}

/** Place it after <CameraRig>: it reads the camera this frame's rig just wrote. */
export function DraftFronts({ plotX, fillX }: { plotX: number; fillX: number }) {
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    camera.updateMatrixWorld()
    setScreenFront(DRAFT.plot, camera, plotX)
    setScreenFront(DRAFT.fill, camera, fillX)
  })
  return null
}
