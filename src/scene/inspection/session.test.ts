import { describe, expect, it, vi } from 'vitest'
import { createStorySession, createVisibleLoadDeadline, sharedStoryRefCount } from './session'

describe('inspection session resources', () => {
  it('aborts before disposing and disposes each owned resource once including late completions', () => {
    const session = createStorySession('ring', { id: 1, current: () => true, fail: vi.fn() })
    const dispose = vi.fn(() => expect(session.signal.aborted).toBe(true)), resource = { dispose }
    session.own(resource); session.own(resource)
    session.cancel(); session.cancel(); session.own(resource)
    const late = { dispose: vi.fn() }; session.own(late); session.own(late)
    expect(dispose).toHaveBeenCalledTimes(1); expect(late.dispose).toHaveBeenCalledTimes(1); expect(session.current()).toBe(false)
  })
  it('releases shared borrows without disposing the cache and tolerates a broken cleanup', () => {
    const session = createStorySession('ring', { id: 2, current: () => true, fail: vi.fn() })
    const other = createStorySession('ring', { id: 3, current: () => true, fail: vi.fn() })
    const release = session.borrowShared('cached-ring'); session.borrowShared('cached-ring'); other.borrowShared('cached-ring')
    expect(sharedStoryRefCount('cached-ring')).toBe(3)
    release(); release(); expect(sharedStoryRefCount('cached-ring')).toBe(2)
    session.own({ dispose() { throw new Error('lost context') } }); const dispose = vi.fn(); session.own({ dispose })
    expect(() => session.cancel()).not.toThrow(); expect(dispose).toHaveBeenCalledTimes(1)
    expect(sharedStoryRefCount('cached-ring')).toBe(1)
    session.borrowShared('cached-ring')(); expect(sharedStoryRefCount('cached-ring')).toBe(1)
    other.cancel(); expect(sharedStoryRefCount('cached-ring')).toBe(0)
  })
  it('only reports errors from the current, uncancelled session', () => {
    let active = true
    const fail = vi.fn(), session = createStorySession('shaft', { id: 4, current: () => active, fail })
    session.fail('current'); active = false; session.fail('stale'); active = true; session.cancel(); session.fail('cancelled')
    expect(fail).toHaveBeenCalledExactlyOnceWith('current')
  })
  it('counts visible load time once, ignores hidden time, and cannot fail a cancelled visit', () => {
    const fail = vi.fn(), session = createStorySession('ring', { id: 5, current: () => true, fail })
    const deadline = createVisibleLoadDeadline(session, 15000)
    deadline.advance(10000, true); deadline.advance(60000, false); deadline.advance(NaN, true); deadline.advance(-1, true)
    expect(fail).not.toHaveBeenCalled()
    deadline.advance(4999, true); expect(fail).not.toHaveBeenCalled()
    deadline.advance(1, true); deadline.advance(10000, true); expect(fail).toHaveBeenCalledTimes(1)
    const cancelled = createVisibleLoadDeadline(session, 1); session.cancel(); cancelled.advance(1, true)
    expect(fail).toHaveBeenCalledTimes(1)
  })
})
