import { Box3, Matrix4, Mesh, Vector3, type Object3D } from 'three'

/** Measure real support vertices in the registered study frame, independently of scene-root scale. */
export function measureSupportHandoff(source: readonly Object3D[], studyRoot: Object3D) {
  const pair = studyRoot.getObjectByName('shaft-rigid-support-pair')
  if (!pair || !['K000210', 'K000211'].every(part => source.some(node => node.userData.partNumber === part))) throw new Error('Both authenticated source/private supports are required')
  studyRoot.updateWorldMatrix(true, true)
  const inverse = studyRoot.matrixWorld.clone().invert(), transform = new Matrix4(), point = new Vector3()
  const bounds = (nodes: readonly Object3D[]) => {
    const box = new Box3()
    for (const node of nodes) {
      node.updateWorldMatrix(true, true)
      node.traverse(object => {
        if (!(object instanceof Mesh)) return
        transform.multiplyMatrices(inverse, object.matrixWorld)
        const positions = object.geometry.getAttribute('position')
        for (let i = 0; i < positions.count; i++) box.expandByPoint(point.fromBufferAttribute(positions, i).applyMatrix4(transform))
      })
    }
    if (box.isEmpty()) throw new Error('Support geometry is empty')
    return box
  }
  const sourceBounds = bounds(source), privateBounds = bounds([pair])
  const sourceCenter = sourceBounds.getCenter(new Vector3()), privateCenter = privateBounds.getCenter(new Vector3())
  const difference = sourceCenter.clone().sub(privateCenter)
  return { sourceParts: [...new Set(source.map(node => node.userData.partNumber))], sourceCenter: sourceCenter.toArray(),
    privateCenter: privateCenter.toArray(), offset: difference.toArray() as [number, number, number], distance: difference.length(),
    sourceSize: sourceBounds.getSize(new Vector3()).toArray(), privateSize: privateBounds.getSize(new Vector3()).toArray() }
}
