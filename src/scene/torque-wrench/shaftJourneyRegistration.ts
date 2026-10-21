import { Box3, Matrix3, Matrix4, Mesh, Plane, Vector3, type Object3D } from 'three'
import { narrativeModelToStudy } from '../inspection/shaft/frame'
/** H = M Delta inverse(N). Delta is measured from the source bucket parent at rest. */
export function registerShaft(modelWorld: Matrix4, displacement: Matrix4, out: Matrix4): Matrix4 {
  out.copy(modelWorld).multiply(displacement).multiply(inverseNarrative)
  const e=out.elements, a=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],b=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],c=e[8]*e[8]+e[9]*e[9]+e[10]*e[10]
  const tolerance=1e-6*Math.max(a,b,c)
  if (!Number.isFinite(a+b+c) || a<=0 || Math.max(Math.abs(a-b),Math.abs(b-c),Math.abs(e[0]*e[4]+e[1]*e[5]+e[2]*e[6]),Math.abs(e[0]*e[8]+e[1]*e[9]+e[2]*e[10]),Math.abs(e[4]*e[8]+e[5]*e[9]+e[6]*e[10]))>tolerance) throw new Error('Shaft registration requires rigid or uniform scale')
  return out
}
const inverseNarrative = narrativeModelToStudy(new Matrix4()).invert()
export function measureShaftDisplacement(model: Object3D, parent: Object3D, rest: Matrix4, out: Matrix4): Matrix4 {
  model.updateWorldMatrix(true, true)
  return out.copy(model.matrixWorld).invert().multiply(parent.matrixWorld).multiply(rest)
}
/** Restore every coefficient before apply; shared plane references are transformed once. */
export function createJourneyPlanes() {
  const canonical = new Map<Plane, Plane>(), normal = new Matrix3()
  return {
    restore() { for (const [plane, source] of canonical) plane.copy(source) },
    transform(root: Object3D, h: Matrix4) {
      canonical.clear(); normal.getNormalMatrix(h)
      root.traverse(object => {
        if (!(object instanceof Mesh)) return
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          for (const plane of material.clippingPlanes ?? []) if (!canonical.has(plane)) canonical.set(plane, plane.clone())
        }
      })
      for (const plane of canonical.keys()) plane.applyMatrix4(h, normal)
    },
  }
}
export function effectiveMeshOpacity(mesh: Mesh): number {
  let node: Object3D | null = mesh
  while (node) { if (!node.visible) return 0; node = node.parent }
  let opacity = 0
  for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (mat.visible) opacity = Math.max(opacity, mat.opacity)
  return opacity
}
export function registrationScale(h: Matrix4): number[] {
  const e=h.elements
  return [new Vector3(e[0],e[1],e[2]).length(),new Vector3(e[4],e[5],e[6]).length(),new Vector3(e[8],e[9],e[10]).length()]
}

/** Lazy proof of the installed asset datums, before GPU stock removal. */
export function measureShaftLandmarks(source: Mesh, root: Object3D, h: Matrix4) {
  source.updateWorldMatrix(true, false); root.updateWorldMatrix(true, true)
  const inverse=h.clone().invert(),point=new Vector3(),matrix=new Matrix4()
  const bounds=(node:Object3D)=>{
    const box=new Box3()
    node.traverse(object=>{
      if(!(object instanceof Mesh)||object.name==='study-section-backface')return
      matrix.multiplyMatrices(inverse,object.matrixWorld)
      const attr=object.geometry.getAttribute('position')
      for(let j=0;j<attr.count;j++)box.expandByPoint(point.fromBufferAttribute(attr,j).applyMatrix4(matrix))
    })
    return box
  }
  const sourceBounds=bounds(source)
  const sourceAxis=new Vector3(0,0,1).transformDirection(source.matrixWorld)
  const studyAxis=new Vector3(0,0,1).transformDirection(h)
  return {method:'Undeformed installed asset bounds in study space; shader stock removal excluded',
    axisErrorDeg:sourceAxis.angleTo(studyAxis)*180/Math.PI,
    sourceBounds:[sourceBounds.min.toArray(),sourceBounds.max.toArray()],
    shafts:['study-legacyshaft','study-approvedshaft'].flatMap(name=>{
      const node=root.getObjectByName(name)
      if(!node)return []
      const box=bounds(node)
      return [{name,axialDatumErrorMm:[(box.min.z-sourceBounds.min.z)*1000,(box.max.z-sourceBounds.max.z)*1000]}]
    })}
}
