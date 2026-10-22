import { useEffect } from 'react'
import * as THREE from 'three'

export type Vec3Tuple = [number, number, number]

export interface GLBNodeRecord {
  path: string
  name: string
  type: string
  materialName: string
  vertexCount: number
  bboxSize: Vec3Tuple
  bboxCenter: Vec3Tuple
  explodeVector: Vec3Tuple
}

/** How the stage normalised the model before auditing (bbox values are in stage space). */
export interface GLBStageFit {
  scale: number
  offset: Vec3Tuple
  sourceSize: Vec3Tuple
}

export interface GLBManifest {
  modelPath: string
  assemblyCenter: Vec3Tuple
  totalMeshes: number
  totalVertices: number
  uniqueMaterials: string[]
  stageFit?: GLBStageFit
  nodes: GLBNodeRecord[]
}

declare global {
  interface Window {
    __GLB_MANIFESTS__?: Record<string, GLBManifest>
    __CopyGLBManifest__?: (modelPath?: string) => string
  }
}

const round3 = (value: number): number => Number(value.toFixed(3))
const toTuple = (v: THREE.Vector3): Vec3Tuple => [round3(v.x), round3(v.y), round3(v.z)]

/**
 * Walks a loaded GLB scene without mutating its geometry or materials and returns the exact
 * mesh/material hierarchy. Each mesh also gets `userData.basePosition` (rest position),
 * `userData.explodeDirection` (world-space unit vector away from the assembly centroid) and
 * `userData.explodeDirectionLocal` (the same displacement expressed in the mesh parent's frame
 * for one world unit, so a scaled or rotated parent still moves the part along the world vector).
 */
export function auditGLBScene(
  scene: THREE.Object3D,
  modelPath: string,
  stageFit?: GLBStageFit,
): GLBManifest {
  const nodes: GLBNodeRecord[] = []
  const materialSet = new Set<string>()
  let totalVertices = 0

  const assemblyBox = new THREE.Box3()
  const assemblyCenter = new THREE.Vector3()
  const tempBox = new THREE.Box3()
  const tempSize = new THREE.Vector3()
  const tempCenter = new THREE.Vector3()
  const tempExplode = new THREE.Vector3()
  const tempParentInverse = new THREE.Matrix4()
  const tempLocalOrigin = new THREE.Vector3()
  const tempLocalTip = new THREE.Vector3()

  scene.updateWorldMatrix(true, true)
  assemblyBox.setFromObject(scene)
  assemblyBox.getCenter(assemblyCenter)

  const getPath = (obj: THREE.Object3D): string => {
    const parts: string[] = []
    let curr: THREE.Object3D | null = obj
    while (curr && curr !== scene) {
      parts.unshift(curr.name || `[${curr.type}]`)
      curr = curr.parent
    }
    return parts.join(' / ')
  }

  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return
    const mesh = child as THREE.Mesh
    const vCount = mesh.geometry?.attributes?.position?.count ?? 0
    totalVertices += vCount

    tempBox.setFromObject(mesh)
    tempBox.getSize(tempSize)
    tempBox.getCenter(tempCenter)

    // Outward radial/axial explosion vector from the assembly centroid.
    tempExplode.subVectors(tempCenter, assemblyCenter)
    if (tempExplode.lengthSq() < 0.0001) {
      tempExplode.set(0, 1, 0)
    } else {
      tempExplode.normalize()
    }

    if (!mesh.userData.basePosition) {
      mesh.userData.basePosition = mesh.position.clone()
    }
    mesh.userData.explodeDirection = tempExplode.clone()

    const parentMatrix = mesh.parent ? mesh.parent.matrixWorld : scene.matrixWorld
    tempParentInverse.copy(parentMatrix).invert()
    tempLocalOrigin.copy(tempCenter).applyMatrix4(tempParentInverse)
    tempLocalTip.copy(tempCenter).add(tempExplode).applyMatrix4(tempParentInverse)
    mesh.userData.explodeDirectionLocal = tempLocalTip.sub(tempLocalOrigin).clone()

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const matNames = mats
      .filter(Boolean)
      .map((m) => {
        const name = m.name || '[UnnamedMaterial]'
        materialSet.add(name)
        return name
      })
      .join(', ')

    nodes.push({
      path: getPath(mesh),
      name: mesh.name || '[UnnamedMesh]',
      type: mesh.type,
      materialName: matNames,
      vertexCount: vCount,
      bboxSize: toTuple(tempSize),
      bboxCenter: toTuple(tempCenter),
      explodeVector: toTuple(tempExplode),
    })
  })

  const manifest: GLBManifest = {
    modelPath,
    assemblyCenter: toTuple(assemblyCenter),
    totalMeshes: nodes.length,
    totalVertices,
    uniqueMaterials: Array.from(materialSet),
    ...(stageFit ? { stageFit } : {}),
    nodes,
  }

  if (typeof window !== 'undefined') {
    window.__GLB_MANIFESTS__ = window.__GLB_MANIFESTS__ ?? {}
    window.__GLB_MANIFESTS__[modelPath] = manifest

    window.__CopyGLBManifest__ = (targetPath = modelPath) => {
      const data = window.__GLB_MANIFESTS__?.[targetPath]
      const json = JSON.stringify(data, null, 2)
      navigator.clipboard?.writeText(json).catch(() => {})
      return json
    }
  }

  return manifest
}

export function useGLBSceneAuditor(
  scene: THREE.Object3D | null | undefined,
  modelPath: string,
  stageFit?: GLBStageFit,
): void {
  useEffect(() => {
    if (!scene) return
    auditGLBScene(scene, modelPath, stageFit)
  }, [scene, modelPath, stageFit])
}
