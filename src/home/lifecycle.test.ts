import { describe, expect, it } from 'vitest'
import { LIFECYCLE_STAGES } from './content'
import { FIRST_PRODUCTION_STAGE, NEW_PUMP, advance, assignSerial } from './lifecycle'

const COUNT = LIFECYCLE_STAGES.length

describe('pump lifecycle demo', () => {
  it('has eight stages, with Fabrication as the first production stage', () => {
    expect(COUNT).toBe(8)
    expect(LIFECYCLE_STAGES[FIRST_PRODUCTION_STAGE]).toBe('Fabrication')
    expect(LIFECYCLE_STAGES[0]).toBe('Unscheduled')
    expect(LIFECYCLE_STAGES[COUNT - 1]).toBe('Closed')
  })

  it('lets a pump be scheduled without a serial number, then stops it at the gate', () => {
    const scheduled = advance(NEW_PUMP, COUNT)
    expect(scheduled.ok).toBe(true)
    expect(scheduled.state.stage).toBe(1)
    const blocked = advance(scheduled.state, COUNT)
    expect(blocked).toEqual({ ok: false, state: scheduled.state, reason: 'no-serial' })
  })

  it('walks every stage in order once a serial number is assigned, and stops at Closed', () => {
    let state = assignSerial(NEW_PUMP)
    const visited = [state.stage]
    for (let i = 0; i < 20; i++) {
      const result = advance(state, COUNT)
      if (!result.ok) {
        expect(result.reason).toBe('closed')
        break
      }
      state = result.state
      visited.push(state.stage)
    }
    expect(visited).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('assigning a serial twice changes nothing', () => {
    const once = assignSerial(NEW_PUMP)
    expect(assignSerial(once)).toBe(once)
  })
})
