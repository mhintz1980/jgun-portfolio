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
import {
  createMetrologyWorkbenchProps,
  type MetrologyWorkbenchPropsRuntime,
} from './MetrologyWorkbenchProps'

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
  const workbench = useRef<MetrologyWorkbenchPropsRuntime | null>(null)
  const viewport = useRef(new Vector2())
  const latest = useRef({ frame, context, onCleanupFailure, onRuntime })
  latest.current = { frame, context, onCleanupFailure, onRuntime }

  // Allocate after commit, not useMemo/render: StrictMode cleanup then remount
  // creates a fresh presentation while preserving the parent's borrowed bake.
  useLayoutEffect(() => {
    const presentation = createPrivateSheetRuntime(baked, errors => latest.current.onCleanupFailure(errors))
    const propsRuntime = createMetrologyWorkbenchProps()
    const onWindowPointer = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      propsRuntime.onPointerMove(ndcX, ndcY)
    }
    try {
      mount.current!.add(presentation.group)
      mount.current!.add(propsRuntime.group)
      // Compile hidden rupture materials against the installed lights/environment
      // before their first reveal. This is synchronous setup, never a beauty render;
      // restore visibility even if compilation throws. Avoid compileAsync's polling
      // lifetime, which cannot be cancelled when StrictMode disposes the materials.
      const visible = presentation.group.visible
      const propsVisible = propsRuntime.group.visible
      presentation.stats.shaderWarmReady = 0
      try {
        presentation.group.visible = true
        propsRuntime.group.visible = true
        // The group is already attached: compile the scene once so its point
        // light is not counted again as both target-scene and subtree lighting.
        gl.compile(scene, camera)
        presentation.stats.shaderWarmReady = 1
      } finally {
        presentation.group.visible = visible
        propsRuntime.group.visible = propsVisible
      }
      runtime.current = presentation
      workbench.current = propsRuntime
      window.addEventListener('pointermove', onWindowPointer, { passive: true })
      window.addEventListener('pointerdown', onWindowPointer, { passive: true })
      window.__metrologyWorkbench = {
        snapshot: () => propsRuntime.snapshot(),
        nudgeProp: (id, ix, iy, iTheta) => propsRuntime.nudgeProp(id, ix, iy, iTheta),
        moveCursorNdc: (ndcX, ndcY) => propsRuntime.onPointerMove(ndcX, ndcY),
      }
      latest.current.onRuntime(presentation)
    } catch (error) {
      window.removeEventListener('pointermove', onWindowPointer)
      window.removeEventListener('pointerdown', onWindowPointer)
      if (runtime.current === presentation) runtime.current = null
      if (workbench.current === propsRuntime) workbench.current = null
      propsRuntime.dispose()
      presentation.dispose()
      throw error
    }
    return () => {
      window.removeEventListener('pointermove', onWindowPointer)
      window.removeEventListener('pointerdown', onWindowPointer)
      if (window.__metrologyWorkbench) delete window.__metrologyWorkbench
      if (runtime.current === presentation) runtime.current = null
      if (workbench.current === propsRuntime) workbench.current = null
      try { latest.current.onRuntime(null) } finally {
        propsRuntime.dispose()
        presentation.dispose()
      }
    }
  }, [baked, gl, camera, scene])

  // Parent owns conductor/pose/camera. Priority 0 consumes their settled inputs;
  // this callback never writes model/camera transforms or starts another loop.
  useFrame(({ gl, camera }) => {
    const presentation = runtime.current
    if (!presentation) return
    gl.getDrawingBufferSize(viewport.current)
    const inputs = latest.current
    const frameInput = inputs.frame()
    presentation.apply(frameInput, inputs.context, viewport.current)
    workbench.current?.update(frameInput, inputs.context, camera)
  })

  return <group ref={mount} name="private-sheet-presentation-host" dispose={null} />
}
