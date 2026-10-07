import { afterEach, describe, expect, it, vi } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { captureNarrativeFade } from './narrativeFade'
import { inspectionLoadLease } from './loadLease'
import { waitForPrograms } from './compileLease'
import { inspection, notifyInspection, subscribeInspection } from '../../state/inspectionStore'
import { newFrame, sampleInspection } from './timeline'

afterEach(() => { vi.useRealTimers(); inspection.active = false })
describe('inspection lifetimes and restoration', () => {
  it('fades real mesh materials without changing original opacity, depth write or visibility', () => {
    const original = new MeshStandardMaterial({ opacity: .15, transparent: true, depthWrite: false })
    const compile = original.onBeforeCompile
    const group = new Group(), mesh = new Mesh(new BoxGeometry(), original), hidden = new Mesh(new BoxGeometry(), original)
    hidden.visible = false; group.add(mesh, hidden)
    let disposed = 0
    const fade = captureNarrativeFade(group, [])
    const clone = mesh.material as MeshStandardMaterial
    clone.addEventListener('dispose', () => disposed++)
    expect(clone.onBeforeCompile).toBe(compile)
    fade.apply(.5, false); expect(clone.opacity).toBeCloseTo(.075); expect(mesh.visible).toBe(true)
    fade.apply(0, false); expect(mesh.visible).toBe(false)
    fade.apply(.5, true); expect(mesh.visible).toBe(true); expect(hidden.visible).toBe(false)
    expect(original.opacity).toBe(.15); expect(original.transparent).toBe(true); expect(original.depthWrite).toBe(false)
    fade.restore(); fade.restore()
    expect(mesh.material).toBe(original); expect(mesh.visible).toBe(true); expect(hidden.visible).toBe(false); expect(disposed).toBe(1)
    mesh.geometry.dispose(); hidden.geometry.dispose(); original.dispose()
  })
  it('keeps the return angle stopped and bounds the prior deceleration velocity', () => {
    for (let t = 10.5; t < 12; t += .01) expect(sampleInspection(t + .01, newFrame()).angle - sampleInspection(t, newFrame()).angle).toBeCloseTo(0, 10)
    for (let t = 8.2; t < 10.49; t += .01) expect((sampleInspection(t + .01, newFrame()).angle - sampleInspection(t, newFrame()).angle) / .01).toBeLessThan(3)
    expect(sampleInspection(12, newFrame()).angle / (2 * Math.PI)).toBeCloseTo(8)
  })
  it('rejects canceled and stale epoch failures while permitting the current load to fail', () => {
    inspection.active = true; inspection.epoch = 10; inspection.status = 'loading'
    const old = inspectionLoadLease(10); old.cancel()
    inspection.epoch = 11; inspection.status = 'ready'; old.fail(new Error('late abort'))
    expect(inspection.status).toBe('ready')
    const stale = inspectionLoadLease(10); stale.fail(new Error('old epoch'))
    expect(inspection.status).toBe('ready')
    const current = inspectionLoadLease(11); current.fail(new Error('recoverable load'))
    expect(inspection.status).toBe('error'); expect(inspection.error).toBe('recoverable load')
  })
  it('publishes delayed CAD readiness as a discrete lifecycle notification', () => {
    let reads = 0
    const unsubscribe = subscribeInspection(() => { if (inspection.source) reads++ })
    inspection.source = null; notifyInspection(); expect(reads).toBe(0)
    inspection.source = new Group(); notifyInspection(); expect(reads).toBe(1)
    unsubscribe(); inspection.source = null
  })
  it('stops async shader polling before accessing disposed renderer properties', async () => {
    vi.useFakeTimers()
    const material = new MeshStandardMaterial(), programFor = vi.fn(() => undefined)
    const promise = waitForPrograms(new Set([material]), programFor, () => true)
    await vi.runAllTimersAsync(); expect(await promise).toBe(false); expect(programFor).not.toHaveBeenCalled()
    const disposed = waitForPrograms(new Set([material]), programFor, () => false)
    await vi.runAllTimersAsync(); expect(await disposed).toBe(true)
    material.dispose()
  })
})
