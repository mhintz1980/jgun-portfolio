# Fresh review — atomic lifecycle baseline/dispatch

Date 2026-10-09. CPU source review of the scripts/verify-manufacturing-inspection.mjs
working-tree diff; node --check exit 0.

## Verdict

**SHIP (source).** Runtime V2 rerun remains pending.

## Findings

- Atomicity: atomicHiddenBaselineAndDispatch (:221-243) captures baselineAt,
  then playhead/recorder/frame clones, applies the synthetic hidden getters,
  stamps dispatchAt, and dispatches visibilitychange inside one browser JS
  turn. No CDP or frame turn can elapse between baseline and dispatch; the
  baseline is never recaptured, and baselineToDispatchMs is recorded (:654).
- Evidence: hiddenEvidenceSnapshot persists playhead plus emitted and
  synchronous tuples and the last rendered frame at immediate-post-dispatch,
  acknowledged, and post-window points. Acknowledgment requires
  __inspection.suspend === 'hidden' within 500 ms (50 ms polling) and records
  wait time/error instead of passing vacuously.
- Bound preserved: hiddenAdvance >= 0 && < 0.1 s is unchanged (:690). Both V2
  conditions are evaluated only after evidence persistence; joined failures
  prevent one failure from masking the other.
- The diff adds no producer self-claims; runtime classification awaits the
  parent rerun.
