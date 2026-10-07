import { Matrix4, Quaternion, Vector3, type Object3D } from 'three'
import { MESH_AZ_RAD, type ShaftKinematicsFrame } from './kinematics'
import { HOB_LEAD_ANGLE_DEG, SHAPER_CENTRE_DISTANCE_MM, SHAPER_TIP_RADIUS_MM } from './toolSpec'

/** Fixed study world: origin (0,0,0), identity orientation. Bundle is already Y-up.
 * CAD millimetres (x,y,z) -> study metres (x,z,-y); never compose hero.matrixWorld.
 */
export function shaftLocalToStudy(out: Matrix4): Matrix4 {
  return out.set(0.001, 0, 0, 0, 0, 0, 0.001, 0, 0, -0.001, 0, 0, 0, 0, 0, 1)
}
export function studyToShaftLocal(out: Matrix4): Matrix4 { return shaftLocalToStudy(out).invert() }
export function shaftMmPoint(out: Vector3, x: number, y: number, z: number): Vector3 { return out.set(x * 0.001, z * 0.001, -y * 0.001) }
export function shaftMetrePoint(out: Vector3, x: number, y: number, z: number): Vector3 { return out.set(x, z, -y) }
export function studyPointToShaftMm(out: Vector3, x: number, y: number, z: number): Vector3 { return out.set(x * 1000, -z * 1000, y * 1000) }

const CAD_TO_STUDY = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)
const Y_AXIS = new Vector3(0, 1, 0)
const lead = HOB_LEAD_ANGLE_DEG * Math.PI / 180
const HOB_TILT = new Quaternion().setFromUnitVectors(Y_AXIS, new Vector3(Math.cos(lead), Math.sin(lead), 0))

/** Centre moves radially with infeed/backoff; its closest crest remains at cutterRho.
 * tools.ts centres the disc on its root; the leading face is at +thickness/2.
 */
export function placeShaper(out: Object3D, k: ShaftKinematicsFrame): void {
  const distance = SHAPER_CENTRE_DISTANCE_MM + k.cutterRho - (SHAPER_CENTRE_DISTANCE_MM - SHAPER_TIP_RADIUS_MM)
  shaftMmPoint(out.position, distance * Math.cos(MESH_AZ_RAD), k.strokeCentreY, distance * Math.sin(MESH_AZ_RAD))
  out.quaternion.setFromAxisAngle(Y_AXIS, k.cutterPhi).premultiply(CAD_TO_STUDY)
}
export function placeHob(out: Object3D, k: ShaftKinematicsFrame): void {
  shaftMmPoint(out.position, k.hobToolA * Math.cos(MESH_AZ_RAD), k.hobYc, k.hobToolA * Math.sin(MESH_AZ_RAD))
  out.quaternion.setFromAxisAngle(Y_AXIS, k.hobPhi).premultiply(HOB_TILT).premultiply(CAD_TO_STUDY)
}

/** G0 source-registry.json registration.approved_export_gltf_to_hero_rest, inverted.
 * rig.basePositions are in the original (un-recentered) GLTF model frame. Remove the
 * measured hero rest center before applying this inverse; no live world matrices.
 */
export function narrativeModelToStudy(out: Matrix4): Matrix4 {
  out.set(
    0.9868485331535339, 0.16164754331111908, 2.7993343057879116e-16, -0.07780782878398895,
    -0.16164754331111908, 0.9868485331535339, -4.663211247979686e-16, 0.0000010723084642449976,
    -3.516315667205359e-16, 4.149377504071382e-16, 1, 0.023340754210948944,
    0, 0, 0, 1,
  ).invert()
  // Right-multiply T(-hero_rest_center) without allocating a matrix.
  const e = out.elements, x = -0.07780783086387061, y = 0.000001072308505746522, z = 0.09254183464277439
  e[12] += e[0] * x + e[4] * y + e[8] * z
  e[13] += e[1] * x + e[5] * y + e[9] * z
  e[14] += e[2] * x + e[6] * y + e[10] * z
  return out
}
