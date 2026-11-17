import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Vector2 } from 'three'
import type { ExtractionContext } from '../drawing/poseCore'
import type { SheetBakeResult } from '../drawing/sheet/sheetBake'
import { createMetrologyWorkbenchProps, type MetrologyWorkbenchPropsRuntime } from './MetrologyWorkbenchProps'
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
  const metrology = useRef<MetrologyWorkbenchPropsRuntime | null>(null)
  const viewport = useRef(new Vector2())
  const latest = useRef({ frame, context, onCleanupFailure, onRuntime })
  latest.current = { frame, context, onCleanupFailure, onRuntime }

  // Allocate after commit, not useMemo/render: StrictMode cleanup then remount
  // creates a fresh presentation while preserving the parent's borrowed bake.
  useLayoutEffect(() => {
    const presentation = createPrivateSheetRuntime(baked, errors => latest.current.onCleanupFailure(errors))
    const propsRuntime = (() => {
      try { return createMetrologyWorkbenchProps() }
      catch (error) { presentation.dispose(); throw error }
    })()
    let alive = true
    const pointer = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      if (rect.width && rect.height) propsRuntime.onPointerMove(
        (event.clientX - rect.left) / rect.width * 2 - 1,
        -(event.clientY - rect.top) / rect.height * 2 + 1,
      )
    }
    const probe = {
      snapshot: propsRuntime.snapshot,
      nudgeProp: propsRuntime.nudgeProp,
      moveCursorNdc: propsRuntime.onPointerMove,
      setMeasurementHidden: propsRuntime.setMeasurementHidden,
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
      metrology.current = propsRuntime
      window.__metrologyWorkbench = probe
      window.addEventListener('pointermove', pointer, { passive: true })
      void propsRuntime.startLoading(() => {
        if (!alive) return
        const visible = propsRuntime.group.visible
        try { propsRuntime.group.visible = true; gl.compile(scene, camera) }
        finally { propsRuntime.group.visible = visible }
      })
      latest.current.onRuntime(presentation)
    } catch (error) {
      if (runtime.current === presentation) runtime.current = null
      if (metrology.current === propsRuntime) metrology.current = null
      alive = false
      window.removeEventListener('pointermove', pointer)
      if (window.__metrologyWorkbench === probe) delete window.__metrologyWorkbench
      try { propsRuntime.dispose() } finally { presentation.dispose() }
      throw error
    }
    return () => {
      alive = false
      metrology.current = null
      window.removeEventListener('pointermove', pointer)
      if (window.__metrologyWorkbench === probe) delete window.__metrologyWorkbench
      propsRuntime.dispose()
      if (runtime.current === presentation) runtime.current = null
      try {
        latest.current.onRuntime(null)
      } finally {
        presentation.dispose()
      }
    }
  }, [baked, gl, camera, scene])

  // Parent owns conductor/pose/camera. Priority 0 consumes their settled inputs;
  // this callback never writes model/camera transforms or starts another loop.
  useFrame(({ gl }, delta) => {
    const presentation = runtime.current
    if (!presentation) return
    gl.getDrawingBufferSize(viewport.current)
    const inputs = latest.current
    const frameInput = inputs.frame()
    presentation.apply(frameInput, inputs.context, viewport.current)
    metrology.current?.update({ ...frameInput, delta }, inputs.context, camera)
  })

  return <group ref={mount} name="private-sheet-presentation-host" dispose={null} />
}
