import type { Camera, Material, Scene, WebGLRenderer } from 'three'

/** Three r185 compileAsync polls a disposed material's currentProgram without a guard.
 * Retain its parallel compile and 10ms readiness polling, scoped to this canvas lifetime. */
export function compileWithLease(renderer: WebGLRenderer, scene: Scene, camera: Camera, cancelled: () => boolean): Promise<boolean> {
  const materials = renderer.compile(scene, camera)
  return waitForPrograms(materials, material => {
    const properties = renderer.properties.get(material) as { currentProgram?: { isReady(): boolean } }
    return properties.currentProgram
  }, cancelled)
}

export function waitForPrograms(materials: Set<Material>, programFor: (material: Material) => { isReady(): boolean } | undefined, cancelled: () => boolean): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (cancelled()) { resolve(false); return }
      try {
        for (const material of materials) {
          const program = programFor(material)
          // Retired finish clones are replaced by the following 1px warm render.
          if (!program) { materials.delete(material); continue }
          if (program.isReady()) materials.delete(material)
        }
        if (!materials.size) { resolve(true); return }
        setTimeout(check, 10)
      } catch (error) { reject(error) }
    }
    setTimeout(check, 10)
  })
}
