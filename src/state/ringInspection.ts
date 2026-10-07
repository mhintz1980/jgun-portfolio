/**
 * P003068 Ring Switch inspection macro — pure lifecycle state machine.
 *
 * Keeps the narrative context captured at entry so the exit can restore it, and
 * names exactly one phase at a time so the camera has a single owner. No React,
 * no three.js: the camera rig and the DOM controls both read this.
 */
export type RingInspectionPhase = 'idle' | 'entering' | 'inspecting' | 'exiting'

/** Narrative position captured when the visitor opens the inspection. */
export interface RingInspectionContext {
  /** Global paced scroll progress at entry. */
  progress: number
  chapter: number
  /** Hotspot selected at entry, restored on exit. */
  hotspotId: string | null
}

export interface RingInspectionState {
  phase: RingInspectionPhase
  /** Non-null for every phase except `idle`. */
  context: RingInspectionContext | null
}

export type RingInspectionEvent =
  | { type: 'enter'; context: RingInspectionContext }
  | { type: 'entered' }
  | { type: 'exit' }
  | { type: 'exited' }

export const RING_INSPECTION_IDLE: RingInspectionState = { phase: 'idle', context: null }

export function ringInspectionReducer(
  state: RingInspectionState,
  event: RingInspectionEvent,
): RingInspectionState {
  switch (event.type) {
    case 'enter':
      // Re-entry while active must not overwrite the stored context, or the
      // exit would restore the inspection pose instead of the narrative.
      return state.phase === 'idle' ? { phase: 'entering', context: event.context } : state
    case 'entered':
      return state.phase === 'entering' ? { ...state, phase: 'inspecting' } : state
    case 'exit':
      // Exit during `entering` is allowed (Escape mid-zoom); idle is a no-op.
      return state.phase === 'entering' || state.phase === 'inspecting'
        ? { ...state, phase: 'exiting' }
        : state
    case 'exited':
      return state.phase === 'exiting' ? RING_INSPECTION_IDLE : state
  }
}

/** True while the inspection owns the camera. */
export function ringInspectionOwnsCamera(state: RingInspectionState): boolean {
  return state.phase !== 'idle'
}

/**
 * Page scroll is ignored for the whole inspection so reverse/forward scroll
 * cannot move the narrative out from under the stored context. The exit
 * restores `context.progress`.
 */
export function ringInspectionAcceptsScroll(state: RingInspectionState): boolean {
  return state.phase === 'idle'
}
