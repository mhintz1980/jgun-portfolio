// Kept free of three/R3F imports so App can test the URL without pulling the canvas chunk.
import type { StageModelPath } from '../../components/canvas/ProductStage'

const MODEL_PATHS: Record<string, StageModelPath> = {
  msp: '/models/msp-enclosure.glb',
}

/** True for `?debug=rig` (authoring studio) and `?rig=cinematic` (scroll-driven shot reel). */
export function isCinematicRigRequested(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get('debug') === 'rig' || params.get('rig') === 'cinematic'
}

/** The rig mounts the MSP enclosure. M249 is out of the launch build; `?model=` falls back here. */
export function resolveRigModel(search: string): StageModelPath {
  return MODEL_PATHS[new URLSearchParams(search).get('model') ?? ''] ?? MODEL_PATHS.msp
}
