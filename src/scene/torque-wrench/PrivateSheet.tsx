import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Vector2 } from 'three'
import type { ExtractionContext } from '../drawing/poseCore'
import type { SheetBakeResult } from '../drawing/sheet/sheetBake'
import {
  createPrivateSheetRuntime,
  type DrawingFrameInput,
  type PrivateSheetRuntime,
} from './privateSheetRuntime'

export interface PrivateSheetProps {
  baked: SheetBakeResult
  frame: () => DrawingFrameInput
  context: ExtractionContext
  onCleanupFailure: (errors: readonly unknown[]) => void
  onRuntime: (runtime: PrivateSheetRuntime | null) => void
}

/** Parent supplies a stable bake and writes context before this presentation frame. */
export function PrivateSheet({ baked, frame, context, onCleanupFailure, onRuntime }: PrivateSheetProps) {
  const { gl, camera, scene } = useThree()
  const mount = useRef<Group>(null)
  const runtime = useRef<PrivateSheetRuntime | null>(null)
  const viewport = useRef(new Vector2())
  const latest = useRef({ frame, context, onCleanupFailure, onRuntime })
  latest.current = { frame, context, onCleanupFailure, onRuntime }

  // Allocate after commit, not useMemo/render: StrictMode cleanup then remount
  // creates a fresh presentation while preserving the parent's borrowed bake.
  useLayoutEffect(() => {
    const presentation = createPrivateSheetRuntime(baked, errors => latest.current.onCleanupFailure(errors))
    try {
      mount.current!.add(presentation.group)
      // Compile hidden rupture materials against the installed lights/environment
      // before their first reveal. This is synchronous setup, never a beauty render;
      // restore visibility even if compilation throws. Avoid compileAsync's polling
      // lifetime, which cannot be cancelled when StrictMode disposes the materials.
      const visible = presentation.group.visible
      presentation.stats.shaderWarmReady = 0
      try {
        presentation.group.visible = true
        // The group is already attached: compile the scene once so its point
        // light is not counted again as both target-scene and subtree lighting.
        gl.compile(scene, camera)
        presentation.stats.shaderWarmReady = 1
      } finally { presentation.group.visible = visible }
      runtime.current = presentation
      latest.current.onRuntime(presentation)
    } catch (error) {
      if (runtime.current === presentation) runtime.current = null
      presentation.dispose()
      throw error
    }
    return () => {
      if (runtime.current === presentation) runtime.current = null
      try { latest.current.onRuntime(null) } finally { presentation.dispose() }
    }
  }, [baked, gl, camera, scene])

  // Parent owns conductor/pose/camera. Priority 0 consumes their settled inputs;
  // this callback never writes model/camera transforms or starts another loop.
  useFrame(({ gl }) => {
    const presentation = runtime.current
    if (!presentation) return
    gl.getDrawingBufferSize(viewport.current)
    const inputs = latest.current
    presentation.apply(inputs.frame(), inputs.context, viewport.current)
  })

  return <group ref={mount} name="private-sheet-presentation-host" dispose={null} />
}
