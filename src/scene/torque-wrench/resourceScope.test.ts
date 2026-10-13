import { describe, expect, it } from 'vitest'
import { createResourceScope } from './resourceScope'

describe('page resource scope', () => {
  it('aborts before reverse-order cleanup and attempts every resource once despite faults', () => {
    const events: string[] = []
    const reports: Array<readonly unknown[]> = []
    const scope = createResourceScope(errors => reports.push(errors))
    scope.signal.addEventListener('abort', () => events.push('abort'))
    scope.defer(() => events.push('first'))
    const broken = { dispose() { events.push('broken'); throw new Error('cleanup') } }
    scope.own(broken); scope.own(broken)
    scope.defer(() => { expect(scope.current()).toBe(false); events.push('last') })
    scope.dispose(); scope.dispose()
    expect(events).toEqual(['abort', 'last', 'broken', 'first'])
    expect(reports).toHaveLength(1)
    expect(Object.isFrozen(reports[0])).toBe(true)
    expect(reports[0]).toHaveLength(1)
  })

  it('disposes stale async results immediately and suppresses a reporting exception', () => {
    let calls = 0
    const scope = createResourceScope(() => { throw new Error('host') })
    scope.dispose()
    const stale = { dispose() { calls++; throw new Error('stale') } }
    expect(() => scope.own(stale)).not.toThrow()
    scope.own(stale)
    expect(calls).toBe(1)
    expect(scope.signal.aborted).toBe(true)
  })
})
