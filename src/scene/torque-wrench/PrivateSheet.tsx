import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
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
}

/** Parent supplies a stable bake and writes context before this presentation frame. */
export function PrivateSheet({ baked, frame, context, onCleanupFailure }: PrivateSheetProps) {
  const mount = useRef<Group>(null)
  const runtime = useRef<PrivateSheetRuntime | null>(null)
  const viewport = useRef(new Vector2())
  const latest = useRef({ frame, context, onCleanupFailure })
  latest.current = { frame, context, onCleanupFailure }

  // Allocate after commit, not useMemo/render: StrictMode cleanup then remount
  // creates a fresh presentation while preserving the parent's borrowed bake.
  useLayoutEffect(() => {
    const presentation = createPrivateSheetRuntime(baked, errors => latest.current.onCleanupFailure(errors))
    try {
      mount.current!.add(presentation.group)
      runtime.current = presentation
    } catch (error) {
      presentation.dispose()
      throw error
    }
    return () => {
      if (runtime.current === presentation) runtime.current = null
      presentation.dispose()
    }
  }, [baked])

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
