/** Outcome-aware reporting for factories that clean up before rejecting readiness. */
export interface InspectionCleanupFailure {
  readonly phase: string
  readonly resource: string
  readonly error: unknown
}

export function createInspectionFailureCollector(report: (error: unknown) => void) {
  let phase: 'construction' | 'load' | 'dispose' = 'construction'
  let pending = true
  let primary: unknown
  let hasPrimary = false
  const cleanups: InspectionCleanupFailure[] = []
  const emit = (error: unknown) => {
    try { report(error) } catch { /* Reporting cannot replace an original error or interrupt disposal. */ }
  }
  const drain = (error?: unknown, withPrimary = false) => {
    const failures = Object.freeze(cleanups.splice(0))
    if (!withPrimary && !failures.length) return
    if (withPrimary && !failures.length) { emit(error); return }
    const combined = new AggregateError([
      ...(withPrimary ? [error] : []), ...failures.map(failure => failure.error),
    ], withPrimary ? 'Inspection failed with cleanup failures' : 'Inspection cleanup failed',
    withPrimary ? { cause: error } : undefined)
    Object.defineProperty(combined, 'cleanupFailures', { value: failures, enumerable: true })
    emit(combined)
  }
  return {
    phase: () => phase,
    loading() { phase = 'load' },
    disposing() { pending = true; phase = 'dispose' },
    cleanup(failure: InspectionCleanupFailure) {
      cleanups.push(Object.freeze({ ...failure }))
      if (!pending) drain()
    },
    cleanupMany(failures: readonly InspectionCleanupFailure[]) {
      for (const failure of failures) cleanups.push(Object.freeze({ ...failure }))
      if (!pending) drain()
    },
    primary(error: unknown) {
      if (!pending) { emit(error); return }
      if (!hasPrimary) { primary = error; hasPrimary = true }
    },
    reject(error: unknown) {
      if (!pending) return
      if (!hasPrimary) { primary = error; hasPrimary = true }
      pending = false; phase = 'dispose'
      drain(primary, true)
    },
    resolve() {
      if (!pending) return
      pending = false; phase = 'dispose'
      drain(primary, hasPrimary)
    },
    disposed() {
      // Cancellation is not a primary load failure; still expose all cleanup faults.
      pending = false; phase = 'dispose'
      drain()
    },
  }
}
