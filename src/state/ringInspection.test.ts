import { describe, expect, it } from 'vitest'
import {
  RING_INSPECTION_IDLE,
  ringInspectionAcceptsScroll,
  ringInspectionOwnsCamera,
  ringInspectionReducer,
  type RingInspectionContext,
  type RingInspectionEvent,
  type RingInspectionState,
} from './ringInspection'

const ctx: RingInspectionContext = { progress: 0.31, chapter: 1, hotspotId: 'flange' }

const run = (events: RingInspectionEvent[], from: RingInspectionState = RING_INSPECTION_IDLE) =>
  events.reduce(ringInspectionReducer, from)

describe('ring inspection lifecycle', () => {
  it('walks idle → entering → inspecting → exiting → idle and restores the stored context', () => {
    const entered = run([{ type: 'enter', context: ctx }, { type: 'entered' }])
    expect(entered).toEqual({ phase: 'inspecting', context: ctx })
    const exiting = run([{ type: 'exit' }], entered)
    expect(exiting).toEqual({ phase: 'exiting', context: ctx })
    expect(run([{ type: 'exited' }], exiting)).toEqual(RING_INSPECTION_IDLE)
  })

  it('does not overwrite the entry context on repeat entry', () => {
    const other: RingInspectionContext = { progress: 0.9, chapter: 3, hotspotId: null }
    const state = run([{ type: 'enter', context: ctx }, { type: 'enter', context: other }])
    expect(state.context).toBe(ctx)
  })

  it('allows Escape during the entering zoom', () => {
    expect(run([{ type: 'enter', context: ctx }, { type: 'exit' }]).phase).toBe('exiting')
  })

  it('ignores out-of-order and idle events', () => {
    expect(run([{ type: 'exit' }])).toBe(RING_INSPECTION_IDLE)
    expect(run([{ type: 'entered' }])).toBe(RING_INSPECTION_IDLE)
    expect(run([{ type: 'exited' }])).toBe(RING_INSPECTION_IDLE)
    // `entered` arriving after exit began must not resurrect the inspection.
    const exiting = run([{ type: 'enter', context: ctx }, { type: 'exit' }, { type: 'entered' }])
    expect(exiting.phase).toBe('exiting')
  })

  it('can be re-entered after a full cycle', () => {
    const state = run([
      { type: 'enter', context: ctx },
      { type: 'entered' },
      { type: 'exit' },
      { type: 'exited' },
      { type: 'enter', context: ctx },
    ])
    expect(state.phase).toBe('entering')
  })

  it('owns the camera and blocks scroll in every phase but idle', () => {
    expect(ringInspectionOwnsCamera(RING_INSPECTION_IDLE)).toBe(false)
    expect(ringInspectionAcceptsScroll(RING_INSPECTION_IDLE)).toBe(true)
    for (const phase of ['entering', 'inspecting', 'exiting'] as const) {
      const state: RingInspectionState = { phase, context: ctx }
      expect(ringInspectionOwnsCamera(state)).toBe(true)
      expect(ringInspectionAcceptsScroll(state)).toBe(false)
    }
  })
})
