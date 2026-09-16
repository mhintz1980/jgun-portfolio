import { RenderPass } from 'postprocessing'
import type { Camera, Scene } from 'three'

/** Stencil belongs to the scene target. Clear it there before counting each frame. */
export function createSectionRenderPass(scene: Scene, camera: Camera) {
  const pass = new RenderPass(scene, camera)
  pass.clearPass.setClearFlags(true, true, true)
  return pass
}
