# Independent shaft verifier review — 2026-10-06

**FIX-FIRST.** Reviewed current verifier, producer spec, retained-stock contract review, readiness report, diagnostic JSON, and targeted source anchors using the WebGL telemetry skill. No producer transcript, browser, GPU, build, or server use. `node --check scripts/verify-shaft-inspection.mjs` passed.

## Coverage and justified corrections

All S1–S8 and N1–N4 have desktop/narrow execution paths. Exact floating seek uses the native setter and input/change events; observation waits for a completed render with matching sampled/camera times and stamps, then two further frames. S2 uses 0.05-second checkpoints, captured live progression uniforms, retained-depth counts, wholly non-engaged interval scans, no stock advance/engagement on returns, gain-to-engagement checks, and previous-pass depth uniforms. Current shader source applies that depth ahead of the leading face (`progression.ts:286`). The retained-stock correction is supported by its independent contract review.

Per-time paused slow-exit stability retains the spec's three-frame requirement. Cross-window drift is legitimately report-only: `camera.ts:65–66` deliberately changes distance/FOV/target between 7.2 and 9.7. S7's camera tolerance remains 1e-6; 1e-9 projection/FOV tolerances accommodate diagnostic float64 noise around 1e-15, while discrete scene state and restore-error telemetry remain exact. Settled-to-settled sampling is justified, but needs fresh runtime confirmation.

S3–S6 cover cards/stamps/stress, hobbing/runout, supports/finale/narrative hiding, chapter seek/play equivalence, and replay. S7 covers both modes, Return/Escape, and three warmed resource cycles. N1 tests denied fetch/retry; N2 delivers successful stale bytes across epochs; N3 uses real context loss plus root-removal/chip-geometry-disposal sentinels and zeroed owned counters, not the ring disposal counter; N4 preserves manual pause.

## Required corrections before acceptance

1. **Network scope:** `fresh` listens only for manufacturing-core requests; `staticCase` therefore cannot prove poster zero-CAD or reduced-motion zero inspection requests. Inventory all CAD requests from navigation through exit. Assert poster zero CAD, and reduced zero manufacturing/knurling inspection requests; distinguish permitted reduced-motion narrative assets. Keep these assertions separate.
2. **Target render evidence:** `capture:298` counts study meshes before checking ancestor visibility; S8 then checks only aggregate mesh counts/global canvas variance. Hidden/offscreen shaft targets can pass. Assert the beat's correct legacy/approved shaft target is visible and intersects the viewport, with a target draw witness or isolated target pixel proof tied to the captured session/time/frame. Preserve existing nonblank statistics.
3. **Independent exact-copy oracle:** S3 obtains its expected strings from the same authored sampler the UI uses. Add the spec's literal four material strings, FAILED timing, attribution/recap/stress captions as independent expectations; retain telemetry agreement.
4. **Entry/tier binding:** accepting one full/lite request is justified by adaptive quality, but either filename alone is insufficient. Record/assert the effective tier at runtime creation (`InspectionScene.tsx:110`; asset selection `shaftRuntime.ts:271`) against the requested variant. Assert actual blueprint entry mode, as the exploded case already does.
5. **Correct defect anchors:** nonexistent `InspectionController.ts:1` should map camera restoration to `src/scene/CameraRig.tsx:229`. Historical poster throw maps to current `story.ts:88`, entry `inspectionStore.ts:53`, trigger `RingInspection.tsx:155`, registration `InspectionScene.tsx:16`; `story.ts:44` is not its throw. Preserve original diagnostic JSON and annotate corrected mappings in new evidence. Use field-specific telemetry anchors (`shaftRuntime.ts:422–430`) instead of assigning every symptom to count publication at 421.
6. **Visible failure:** N1 must assert visible error content. Error telemetry and an enabled retry button alone do not prove the required visible error.

## Runtime-dependent open checks

Diagnostic gates S1/S2/S7/S8/N3 failed; S3–S6/N1/N2/N4 passed. Its verifier SHA differs from current source. Two agreeing production runs remain required, especially complete S2 uniforms/causal sweep, desktop restore (previous delta 1.402e-4), desktop N3 settle timeout, and rebuilt poster entry/network/focus. No runtime acceptance is granted here.
