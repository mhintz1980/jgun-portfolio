import type { StoryKind } from './story'

export interface StorySession {
  readonly id: number
  readonly kind: StoryKind
  readonly signal: AbortSignal
  current(): boolean
  fail(error: unknown): void
  own<T extends { dispose(): void }>(resource: T): T
  borrowShared(key: string): () => void
  cancel(): void
}
export interface StorySessionLifecycle {
  readonly id: number
  current(): boolean
  fail(error: unknown): void
}
const sharedReferences = new Map<string, number>()
export function sharedStoryRefCount(key: string): number { return sharedReferences.get(key) ?? 0 }

// Explicit host callbacks keep the session and descriptor modules independent of the store.
export function createStorySession(kind: StoryKind, lifecycle: StorySessionLifecycle): StorySession {
  const controller = new AbortController()
  const owned = new Set<{ dispose(): void }>()
  const disposed = new WeakSet<object>()
  const borrowed = new Set<() => void>()
  let cancelled = false
  function dispose(resource: { dispose(): void }) {
    if (disposed.has(resource)) return
    disposed.add(resource)
    // One broken resource must not prevent abort/restore or the remaining releases.
    try { resource.dispose() } catch { /* Context loss can make resource cleanup fail. */ }
  }
  const current = () => !cancelled && lifecycle.current()
  return {
    id: lifecycle.id, kind, signal: controller.signal, current,
    fail(error) { if (current()) lifecycle.fail(error) },
    own(resource) {
      if (!current()) dispose(resource)
      else owned.add(resource)
      return resource
    },
    borrowShared(key) {
      if (!current()) return () => {}
      sharedReferences.set(key, sharedStoryRefCount(key) + 1)
      let released = false
      const release = () => {
        if (released) return
        released = true
        const count = sharedStoryRefCount(key) - 1
        if (count > 0) sharedReferences.set(key, count)
        else sharedReferences.delete(key)
        borrowed.delete(release)
      }
      borrowed.add(release)
      return release
    },
    cancel() {
      if (cancelled) return
      cancelled = true
      controller.abort()
      owned.forEach(dispose); owned.clear()
      borrowed.forEach(release => release()); borrowed.clear()
    },
  }
}

/** Feed only visible loading/compiling time; hidden wall time is never a deadline input. */
export function createVisibleLoadDeadline(session: StorySession, timeoutMs: number) {
  let elapsed = 0, expired = false
  return {
    advance(deltaMs: number, visible: boolean) {
      if (expired || !visible || !session.current() || !Number.isFinite(deltaMs) || deltaMs <= 0) return
      elapsed += deltaMs
      if (elapsed >= timeoutMs) { expired = true; session.fail(new Error('The inspection could not load. Return or try again.')) }
    },
  }
}
