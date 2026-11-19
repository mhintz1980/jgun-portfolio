// The stage rules shown in the PumpTracker case study, as a tiny model of the real app's
// invariants: stages run in order, one at a time, and production needs a serial number.

/** Index of the first production stage (Fabrication). Entering it needs a serial number. */
export const FIRST_PRODUCTION_STAGE = 2

export interface PumpState {
  stage: number
  serial: boolean
}

export type AdvanceResult =
  | { ok: true; state: PumpState }
  | { ok: false; state: PumpState; reason: 'no-serial' | 'closed' }

export const NEW_PUMP: PumpState = { stage: 0, serial: false }

/** Moves a pump to the next stage, or says why it cannot move. Never skips a stage. */
export function advance(state: PumpState, stageCount: number): AdvanceResult {
  if (state.stage >= stageCount - 1) return { ok: false, state, reason: 'closed' }
  const next = state.stage + 1
  if (next >= FIRST_PRODUCTION_STAGE && !state.serial) return { ok: false, state, reason: 'no-serial' }
  return { ok: true, state: { ...state, stage: next } }
}

export function assignSerial(state: PumpState): PumpState {
  return state.serial ? state : { ...state, serial: true }
}
