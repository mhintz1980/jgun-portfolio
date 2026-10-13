# Stage 3 failure-collector source review

Verdict: PASS

## Required properties

- **(a) Sync factory throw — PASS.** The collector starts pending, so construction cleanup reports queue without emitting. Each host catch calls `failures.reject(error)` before rethrow. The first error becomes `primary`; drain places it first in `AggregateError.errors` and sets `AggregateError.cause` to it (inspectionFailure.ts:17-27, 40-48; RuntimeWorld.tsx:225-231, 253-259). With no cleanup fault, the original error is emitted unchanged rather than wrapped.
- **(b) Async ready rejection — PASS.** The shaft failure path calls `session.fail(error)` while pending, then `runtime.dispose()`, then rethrows (shaftRuntime.ts:379-381). Disposal reports therefore queue behind the already-recorded primary. The ready rejection handler then calls `failures.reject`, producing one aggregate containing primary plus those cleanups (RuntimeWorld.tsx:263-266; inspectionFailure.ts:44-49). The ring ready rejection also flushes at most once through the same terminal reject path (RuntimeWorld.tsx:235-238).
- **(c) Final/late disposal — PASS.** `resolve()` closes load pending without inventing a primary. `disposing()` reopens only the disposal window; cleanup reports queue, and `disposed()` drains them without adding a primary. A cleanup arriving after disposition drains immediately as cleanup-only (inspectionFailure.ts:50-59, 32-39). Both host teardown blocks use this sequence (RuntimeWorld.tsx:233-238, 261-266); ring disposal continues through all cleanup stages and does not abort on an earlier fault (ringRuntimeCore.ts:328-340).
- **(d) Throwing reporter — PASS.** Reporting is isolated in `emit`, whose catch prevents a reporter throw from replacing the primary or interrupting the drain/disposal sequence (inspectionFailure.ts:14-16). Ring cleanup reporting has the same guard (ringRuntimeCore.ts:92-99), and the observed shaft cleanup callback path also catches reporter throws (shaftRuntime.ts:359-361).
- **(e) No duplicate emission — PASS.** Terminal operations are latched by `pending = false`, and drain splices the cleanup queue before emitting. The same primary cannot be emitted again by a later `reject`, `resolve`, or `disposed`. Distinct genuinely late cleanup faults remain visible as separate cleanup-only aggregates, which preserves evidence without duplicating the primary (inspectionFailure.ts:17-27, 44-59).
- **(f) Cancellation — PASS.** Cancellation/teardown uses `disposing`/`disposed` rather than recording a cancellation primary. When ready ends after ownership is gone, both hosts choose `failures.disposed`; ring stale parsed resources are released without treating cancellation as load failure (RuntimeWorld.tsx:235-238, 263-266; ringRuntimeCore.ts:250-254; inspectionFailure.ts:55-59).

## Defects

None found in the reviewed source ranges.

## Exact reviewed files

- src/scene/torque-wrench/inspectionFailure.ts
- src/scene/torque-wrench/RuntimeWorld.tsx — ring block lines 218-239 and shaft block lines 249-266
- src/scene/inspection/shaft/shaftRuntime.ts — async ready/failure ordering lines 335-381
- src/scene/inspection/ringRuntimeCore.ts — ready lines 199-260 and dispose lines 328-341

