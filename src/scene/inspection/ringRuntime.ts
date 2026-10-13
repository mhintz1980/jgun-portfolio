import { inspection, inspectionTelemetry } from '../../state/inspectionStore'
import { createRingRuntimeCore, type RingRuntimeCore } from './ringRuntimeCore'
import type { StoryContext, StoryRuntime } from './story'
import type { StorySession } from './session'

declare global {
  interface Window {
    __inspectionProof?: {
      seek(time: number, entryElapsed?: number): void
      mask(enabled: boolean): void
      progress(value: number | null): void
    }
  }
}

/** Legacy store adapter: the core is root-free, while this factory preserves the public proof port. */
export function createRingRuntime(session: StorySession, ctx: StoryContext): StoryRuntime {
  if (!inspection.source) throw new Error('P003068 CAD surface is unavailable')
  const runtime = createRingRuntimeCore(session, ctx, {
    source: inspection.source,
    meshes: inspection.meshes,
    initialTime: inspection.time,
    getEntryElapsed: () => inspection.entryElapsed,
    probe: inspectionTelemetry,
    // The legacy API has no cleanup-error surface; keep its old signature and swallow reports.
    onCleanupError: () => {},
  }) as RingRuntimeCore
  const global = (typeof window !== 'undefined' ? window : {}) as unknown as Record<string, unknown>
  const proof = {
    seek(time: number, entryElapsedValue = 2) {
      inspection.playing = false; inspection.entryElapsed = entryElapsedValue
      inspection.time = Math.max(0, Math.min(inspection.duration, time))
    },
    mask: runtime.mask.bind(runtime),
    progress: runtime.progress.bind(runtime),
  }
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('inspectionProof')) global.__inspectionProof = proof
  const dispose = runtime.dispose.bind(runtime)
  runtime.dispose = () => {
    if (global.__inspectionProof === proof) delete global.__inspectionProof
    dispose()
  }
  return runtime
}
