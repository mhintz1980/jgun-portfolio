/**
 * Host-level ordering fixtures for the collector wired the way RuntimeWorld wires it.
 * These drive the real runtime factories, not a stand-in, so the emission order under
 * review is the order the page actually takes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CylinderGeometry, Group, Mesh, MeshBasicMaterial, Object3D, Scene } from 'three'
import { createStorySession } from '../inspection/session'
import { createShaftRuntime } from '../inspection/shaft/shaftRuntime'
import { createRingRuntimeCore, createRingRuntimeProbe } from '../inspection/ringRuntimeCore'
import type { StoryContext } from '../inspection/story'
import { createInspectionFailureCollector } from './inspectionFailure'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

function context(): StoryContext {
  return { gl: { toneMappingExposure: 1 } as StoryContext['gl'], scene: new Scene(), hero: new Scene(), rig: null, tier: 'full', aspect: 1440 / 900 }
}

describe('collector at the private host wiring', () => {
  it('shaft async download failure emits the session primary first and labeled disposal cleanups after it', async () => {
    const reports: unknown[] = []
    const failures = createInspectionFailureCollector(error => reports.push(error))
    const fail = vi.fn((error: unknown) => failures.primary(error))
    const session = createStorySession('shaft', { id: 91, current: () => true, fail })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })))
    const runtime = createShaftRuntime(session, context(), {
      onCleanupFailure: list => failures.cleanupMany(list.map(failure => ({ phase: failures.phase(), ...failure }))),
    })
    failures.loading()
    // Installed after construction: Object3D.add() itself calls removeFromParent(), so the fault
    // must be armed only for the disposal that follows the load failure.
    const rootCleanup = new Error('scene-root cleanup failed')
    let armed = true
    const realRemove = Object3D.prototype.removeFromParent
    vi.spyOn(Object3D.prototype, 'removeFromParent').mockImplementation(function (this: Object3D) {
      if (armed) { armed = false; throw rootCleanup }
      return realRemove.call(this)
    })

    const primary = await runtime.ready.then(() => null, (error: unknown) => error)
    expect(primary).toBeInstanceOf(Error)
    expect(fail).toHaveBeenCalledOnce()
    // The factory called session.fail before its own disposal, so nothing may be emitted yet.
    expect(reports).toHaveLength(0)

    failures.reject(primary)
    expect(reports).toHaveLength(1)
    const emitted = reports[0] as AggregateError & { cleanupFailures: Array<{ resource: string; phase: string }> }
    expect(emitted).toBeInstanceOf(AggregateError)
    expect(emitted.errors[0]).toBe(primary)
    expect(emitted.errors).toContain(rootCleanup)
    expect(emitted.cause).toBe(primary)
    expect(emitted.cleanupFailures.map(failure => failure.resource)).toContain('scene-root')

    // Cancellation and idempotent disposal must not emit the same failure twice.
    session.cancel()
    runtime.dispose()
    failures.disposed()
    expect(reports).toHaveLength(1)
  })

  it('ring async download failure reports the load error once, and later disposal is a cleanup-only aggregate', async () => {
    const reports: Array<AggregateError & { cleanupFailures?: unknown[] }> = []
    const failures = createInspectionFailureCollector(error => reports.push(error as AggregateError))
    const session = createStorySession('ring', { id: 92, current: () => true, fail: failures.primary })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))

    const geometry = new CylinderGeometry(0.029, 0.029, 0.019, 32).rotateX(Math.PI / 2)
    const material = new MeshBasicMaterial({ color: '#123456' })
    const mesh = new Mesh(geometry, material), source = new Group()
    source.add(mesh); source.updateWorldMatrix(true, true)
    const runtime = createRingRuntimeCore(session, context(), {
      source, meshes: [mesh], initialTime: 0, getEntryElapsed: () => 0,
      probe: createRingRuntimeProbe(),
      onCleanupError: report => failures.cleanup(report),
    })
    failures.loading()

    const primary = await runtime.ready.then(() => null, (error: unknown) => error)
    expect(primary).toBeInstanceOf(Error)
    expect(reports).toHaveLength(0)
    failures.reject(primary)
    expect(reports).toHaveLength(1)
    // No cleanup to attach, so the primary is emitted verbatim rather than wrapped.
    expect(reports[0]).toBe(primary)

    // A throwing scene-root cleanup during final disposal is reported on its own, without
    // resurrecting the already-reported load error.
    const cleanup = new Error('ring scene-root cleanup failed')
    let armed = true
    const realRemove = Object3D.prototype.removeFromParent
    vi.spyOn(Object3D.prototype, 'removeFromParent').mockImplementation(function (this: Object3D) {
      if (armed) { armed = false; throw cleanup }
      return realRemove.call(this)
    })
    failures.disposing()
    runtime.dispose()
    failures.disposed()
    expect(reports).toHaveLength(2)
    expect(reports[1].errors).toEqual([cleanup])
    // The ring factory labels its own disposal phase as 'runtime'; the resource label must survive.
    expect(reports[1].cleanupFailures?.[0]).toMatchObject({ resource: 'scene-root' })
  })
})
