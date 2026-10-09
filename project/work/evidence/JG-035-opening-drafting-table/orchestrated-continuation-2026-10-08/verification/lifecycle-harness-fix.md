# Lifecycle V2 verifier-only evidence correction

Changed only `scripts/verify-manufacturing-inspection.mjs` and this record. No application, visibility behavior, production source, or threshold changed.

V2 takes its playing baseline and dispatches synthetic hidden in one page evaluation. It stamps `baselineAt`, clones the inspection playhead, compact recorder tuples/statuses/errors, and last rendered frame, applies the same visibilityState/hidden property definitions as setHidden, stamps `dispatchAt`, then dispatches visibilitychange. No CDP or browser-frame turn intervenes. This baseline is never recaptured, and the original total hidden-window assertion remains exactly `hiddenAdvance >= 0 && hiddenAdvance < 0.1`.

After dispatch, the verifier captures an immediate snapshot, then bounded-waits up to exactly 500 ms (50 ms polling) for `__inspection.suspend === 'hidden'`. It captures pre-dispatch, immediate-post, acknowledged/timeout, and after-3-second snapshots before any throwing condition. Each snapshot stores playhead state, recorder tuples and synchronous tuples, recorder errors/statuses, and the last rendered frame’s sequence, sample/camera stamps, sampled times, and draw calls in `measures.hiddenPlayingEvidence`.

Acknowledgment failure is distinct from excessive advance. Both are evaluated after evidence persistence, so one cannot mask the other. The runtime classification remains inconclusive until a future GPU-enabled rerun measures acknowledgment.
