import type * as THREE from 'three'

/** Imperative handle the rig drives per frame. Every method mutates in place —
 * zero allocation per call (JG-023 contract; adversarial target 4). */
export interface BackdropLayerHandle {
  /** 0..1. Implementation must also set mesh.visible = alpha > 0.001. */
  setAlpha: (alpha: number) => void
  /** Copies the given linear-space colors into the layer's uniforms in place
   * (copy/lerp into existing Color objects — never allocate). */
  setPalette: (top: THREE.Color, bottom: THREE.Color, accent: THREE.Color) => void
  /** Camera-locked fiction: positions the layer its own depth along the
   * camera's view axis. Called every frame by BackdropRig. */
  syncToCamera: (camera: THREE.Camera) => void
}

export interface BackdropLayerProps {
  /** Plane size (world units). Sufficient default: 240. */
  size?: number
}
