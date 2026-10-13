/** Page-owned resources and cancellation; never owns borrowed cached CAD. */
export interface ResourceScope {
  readonly signal: AbortSignal
  current(): boolean
  own<T extends { dispose(): void }>(resource: T): T
  defer(cleanup: () => void): void
  dispose(): void
}

export function createResourceScope(onCleanupFailure: (errors: readonly unknown[]) => void): ResourceScope {
  const abort = new AbortController()
  const disposers: Array<() => void> = []
  const registered = new WeakSet<object>()
  let active = true
  const report = (failures: unknown[]) => {
    if (failures.length) {
      try { onCleanupFailure(Object.freeze(failures)) } catch { /* host policy cannot stop cleanup */ }
    }
  }
  const disposeOne = (cleanup: () => void) => {
    try { cleanup() } catch (error) { report([error]) }
  }
  return {
    signal: abort.signal,
    current: () => active,
    own(resource) {
      if (registered.has(resource)) return resource
      registered.add(resource)
      if (active) disposers.push(() => resource.dispose())
      else disposeOne(() => resource.dispose())
      return resource
    },
    defer(cleanup) {
      if (active) disposers.push(cleanup)
      else disposeOne(cleanup)
    },
    dispose() {
      if (!active) return
      active = false
      const failures: unknown[] = []
      try { abort.abort() } catch (error) { failures.push(error) }
      for (let i = disposers.length - 1; i >= 0; i--) {
        try { disposers[i]() } catch (error) { failures.push(error) }
      }
      disposers.length = 0
      report(failures)
    },
  }
}
