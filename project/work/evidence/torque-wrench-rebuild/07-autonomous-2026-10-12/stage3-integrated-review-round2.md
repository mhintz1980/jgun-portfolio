# JG-038 Stage 3 integrated source review — round 2, 2026-10-13

**Verdict: NOT PASS — one FIX FIRST source blocker remains.** This bounded round re-reviews the four round-1 fixes, the focused manual-control/layout change, and only the source shape of the new proof hooks. It does not run or audit the full verifier rosters and closes no G0–G9 gate.

## Snapshot

- Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`; branch `torque-wrench/rebuild`; HEAD `4e620d48b4eb45a1e940f6b4684cf5e492fd6ab0`.
- Other writers remained active. This verdict reads the current uncommitted source changes, including the final opening-sampler refinement, rather than HEAD alone.
- Parent-reported context, not independently executed here: full CPU suite 73 files / 944 pass / 4 skip; TypeScript exit 0; boundary PASS; desktop/full mechanical parity on build f 3493 PASS / 0 FAIL / 0 UNVERIFIED; cutter build f completed all four physical cases with only the transport gzip-normalization defect, since fixed in the verifier. Final build-g runtime roster remained open when this review closed.

## Round-1 finding dispositions

### 1. Shaft host cleanup reporter — **NOT fully resolved**

The missing option is now supplied: `RuntimeWorld.tsx:245-249` passes `onCleanupFailure` to `createShaftRuntime`. The remaining defect is its terminal timing.

`RuntimeWorld.tsx:42-45` makes `reportFailure` one-way/terminal. The cleanup callback at `RuntimeWorld.tsx:246-248` calls it immediately. During synchronous factory construction, a tool/runtime cleanup failure therefore reaches React first and seals the failure path; the original factory exception is then rethrown, but the outer `useFrame` catch can no longer report it because `terminal.current` is already true. The shaft async path has the inverse problem: `shaftRuntime.ts` calls `session.fail(error)` before `runtime.dispose()`, so the primary error seals the terminal path before disposal cleanup failures can be reported.

This violates the explicit Stage 3 cleanup contract: preserve the original factory/load error, attempt every cleanup, and report cleanup failures separately without letting reporting replace or interrupt the primary error. It also drops the shaft `resource` label at `RuntimeWorld.tsx:247` by aggregating only `failure.error`.

**Required exact fix:** use a phase-aware collector rather than a direct terminal callback. While a factory/load outcome is pending, buffer `(resource, error)` cleanup failures. On synchronous factory throw, emit one terminal failure containing the primary error first plus buffered cleanup failures. On async ready rejection, drain cleanup failures produced by the internal disposal and aggregate them with the primary error. After successful construction, final unmount disposal may report a cleanup-only aggregate. Preserve resource/phase labels, attempt every sibling, and keep reporter exceptions non-interrupting. Add focused synchronous construction and async-ready fault fixtures for both orderings.

### 2. Shaft tool-factory cleanup forwarding — **resolved**

`shaftRuntime.ts:161,163` now forwards the same `options` object into `buildShaperCutter` and `buildHob`. Both builders register their construction/final disposers with that option, so the remaining issue is only the host reporter semantics tracked by finding 1 above.

### 3. Ring factory cleanup sink — **connection resolved, but sharing the same terminal-order blocker**

`ringRuntimeCore.ts:212-213` now forwards `createInspectionRing` cleanup reports into the core callback and preserves the more specific ring resource/phase union at `ringRuntimeCore.ts:61-65`. That closes the missing-sink defect.

The private host still passes `onCleanupError: report => reportFailure(report.error)` at `RuntimeWorld.tsx:225-229`. A ring construction-cleanup report can therefore seal the terminal path before the original `createInspectionRing` error reaches the host catch, masking the primary error and discarding the report's resource/phase label. Resolve it with the same phase-aware collector/primary-plus-cleanup aggregate required by finding 1.

### 4. Held opening crossing — **resolved**

`OpeningDirector.ts:24-34` now owns a page-local sampler cache keyed by both canonical progress and solved crossing. `RuntimeWorld.tsx:189-192` consumes it every frame, so a bake can invalidate a stationary frame without a host-local crossing guard. The regression at `OpeningDirector.test.ts:15-28` covers fallback at held `.435`, installation of a new `.865` crossing, identity caching, return to fallback, nonfinite rejection, and history-free retracement. No other opening math changed in the reviewed lines.

## Other focused checks

- **Manual inspection layout/focus:** `Story.tsx:42-52,79-83` uses `focus({ preventScroll: true })` for Escape and close-button return. `torque-wrench.css:244-266` pins the live inspection copy at the top and controls at the bottom while constraining panel overflow. Source follows the intended non-occluding control layout; actual interaction remains for the runtime roster.
- **Private ghost flags:** `RuntimeWorld.tsx:210-214` now preserves the legacy transparent-capable material and applies the legacy `depthWrite = opacity > 0.5` law instead of inventing a private transparency law. This aligns the source with the legacy host at `TorqueWrenchHero.tsx:322-328`.
- **Cutter arc source:** current authored values are desktop FOV 10.2° / target z `.0078` m and narrow FOV 24° / target z `.014` m. The data remains immutable, root-free, baseline outside the arc, and moves through the slow window. Real acceptance comes only from the runtime cutter evidence.
- **Proof hooks, source-only:** private census exposes actual commanded channels, base/current transforms, unit presence, dynamic planet lists, and attached ghost materials; the legacy opt-in hook exposes the applied channel tuple without importing root proof code into the private tree. The cutter verifier's frame predicate now includes both viewport bounds and NDC depth bounds. No source-level false-pass blocker was identified in the bounded hook inspection; script execution, report completeness, transport provenance, and runtime acceptance remain parent-owned and unverified here.

## Required before Stage 3 source exit

Resolve the single cleanup-ordering blocker in `RuntimeWorld.tsx` for both shaft and ring, with focused fault fixtures proving primary-first aggregation for synchronous construction and async load failure plus cleanup-only reporting for final disposal. Independent re-review of that exact change is still required.

No runtime proof, performance gate, Astra review, owner review, or G0–G9 gate is closed by this round-2 source review.
