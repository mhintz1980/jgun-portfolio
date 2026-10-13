import { expect, it, vi } from 'vitest'
import { createInspectionFailureCollector } from './inspectionFailure'

it('keeps a synchronous primary first when cleanup reports before the throw', () => {
  const report = vi.fn(), failures = createInspectionFailureCollector(report)
  const primary = new Error('factory failed'), cleanup = new Error('partial geometry failed')
  failures.cleanup({ phase: failures.phase(), resource: 'tool-geometry', error: cleanup })
  expect(report).not.toHaveBeenCalled()
  failures.reject(primary)
  const emitted = report.mock.calls[0][0]
  expect(emitted.errors).toEqual([primary, cleanup])
  expect(emitted.cause).toBe(primary)
  expect(emitted.cleanupFailures).toEqual([{ phase: 'construction', resource: 'tool-geometry', error: cleanup }])
  expect(Object.isFrozen(emitted.cleanupFailures)).toBe(true)
})

it('waits for async readiness rejection to include disposal faults after session.fail', async () => {
  const report = vi.fn(), failures = createInspectionFailureCollector(report)
  const primary = new Error('parse failed'), cleanup = new Error('parsed material failed')
  failures.loading()
  const ready = Promise.resolve().then(() => {
    failures.primary(primary) // actual runtime's session.fail runs before internal dispose
    failures.cleanup({ phase: failures.phase(), resource: 'material', error: cleanup })
    expect(report).not.toHaveBeenCalled()
    throw primary
  })
  await ready.catch(failures.reject)
  expect(report).toHaveBeenCalledOnce()
  expect(report.mock.calls[0][0].errors).toEqual([primary, cleanup])
  expect(report.mock.calls[0][0].cleanupFailures[0].phase).toBe('load')
})

it('reports cleanup-only final and late disposal without a reporter interrupting siblings', () => {
  const seen: unknown[] = [], report = vi.fn(error => { seen.push(error); throw new Error('reporter failed') })
  const failures = createInspectionFailureCollector(report)
  failures.resolve()
  failures.disposing()
  const a = new Error('geometry'), b = new Error('texture')
  expect(() => {
    failures.cleanup({ phase: failures.phase(), resource: 'geometry', error: a })
    failures.cleanup({ phase: failures.phase(), resource: 'texture', error: b })
    failures.disposed()
  }).not.toThrow()
  expect(report).toHaveBeenCalledOnce()
  expect((seen[0] as AggregateError).errors).toEqual([a, b])
  failures.cleanupMany([{ phase: 'dispose', resource: 'late-texture', error: b }])
  expect(report).toHaveBeenCalledTimes(2)
  expect((seen[1] as AggregateError).errors).toEqual([b])
})

it('preserves primary identity without cleanup and flushes cleanup on canceled pending load', () => {
  const report = vi.fn(), failed = createInspectionFailureCollector(report), primary = new Error('primary')
  failed.reject(primary); failed.reject(primary)
  expect(report).toHaveBeenCalledOnce(); expect(report.mock.calls[0][0]).toBe(primary)
  const canceled = createInspectionFailureCollector(report), cleanup = new Error('late allocation')
  canceled.loading(); canceled.cleanup({ phase: canceled.phase(), resource: 'geometry', error: cleanup })
  canceled.disposed()
  expect(report.mock.calls[1][0].errors).toEqual([cleanup])
})
