# Stage 3 integration checkpoint — 2026-10-13

JG-038 private torque-wrench rebuild, workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`. This is a verified integration checkpoint, not a Stage 3 exit or G0–G9 closure.

## Delivered integration

- Root-free drawing pose/bake extraction and factory-safe rollback from the externally prepared D-core/D-bake lane, integrated behind the private CAD gate. Independent round 2 returned PASS in `parallel-drawing-second-review.md`.
- Root-free ring and shaft inspection cores; legacy adapters retain their public behavior. Ring factory partial allocations, shaft synchronous construction, parsed-tool cleanup, and tool geometry ownership now attempt every owned release and preserve original errors.
- M1 wrench mechanics extracted verbatim from the legacy hero and driven by canonical `MechanismDirector` channels. The hero adapter preserves loader/store/GSAP/material/idle behavior.
- Pure opening, mechanism, and inspection samplers; explicit shaft-study play/pause/seek controls; one private R3F Canvas and one camera writer in `RuntimeWorld.tsx`.
- Private sheet presentation consumes a borrowed `SheetBakeResult`, explicit `DrawingFrameInput`, and parent-owned `ExtractionContext`; it owns only presentation resources.
- The live Canvas capability check now happens before mount. R3F's DOM `fallback` is no longer used as an initialization-failure callback. Automatic tier/failure downgrade preserves an already-open disclosure while stopping explicit playback; user Escape/close still restores trigger focus.

## Exact verification

- TypeScript: `npx tsc --noEmit` exit 0, no output.
- Full CPU suite: 73 files PASS, 947 tests PASS, 4 pre-existing skips (`.scratch/jg038-stage3-final-full-tests.log`; scratch log, not acceptance evidence).
- Source import boundary: `node scripts/check-torque-stage1-boundary.mjs` PASS with exactly one lazy edge `cadGate.ts -> ./Scene`; no root runtime/store value edge.
- Production build: `.scratch/jg038-stage3-20261012-a`, aggregate SHA-256 `7ea5c88aedf4cbe7eee07755d4efd2decd0b9004d885fbbca337dec8e085a05c` (77 files / 34,357,030 bytes).
- Entry `assets/torque-wrench-CooSRxLs.js`: SHA-256 `8f84cde8c6998d59056faab5d09f78c997635dbd0be49c0e982c2b3d03a6c716`.
- Lazy Scene `assets/Scene-DkH1B4uZ.js`: SHA-256 `334196936862bf0394990aaca51eb0b8c33751ba4c7451503584e3a4f2c7b00a`.
- Eager private closure: four JS chunks / 217,063 bytes, zero drawing markers; all drawing/rig/inspection code is lazy.

Final exact-build browser reports:

- Static/fallback: `../05-stage1-integration/runtime/stage3-static-d.json` PASS 14/14 cases, 396/396 assertions; SHA-256 `c6e67d871434128ef9f6855d685607c6796d9d387afd55d550247652970803fd`.
- Timeline/conductor: `runtime-timeline/stage3-full-d.json` PASS 17/17 cases, 382/382 assertions; SHA-256 `9ceff60dc3c4cd6e507141e4b4685f02aaa67e30e3490280511ca345b7e2f150`.
- Drawing-specific integration: `drawing-runtime-integration-stage3-final.json` 5 PASS / 0 FAIL / 1 UNVERIFIED; SHA-256 `ebefb6c18b3436ca141f37072c50593f32de21e3518347bbf320f590f3f42f8a`. It proves eager/lazy isolation, live private mount, frozen precompute/inventory match, registration max 8.79e-5 m, annotation pixels, and real context-loss fallback. BFCache was not restored and remains unproved.

The timeline harness now waits for the live world and initial sheet bake before input. This preserves the Stage 2 three-second post-input settling contract while keeping initial bake responsiveness a separate G8 concern; the observed cold bake can block the main thread for multiple seconds.

## Remaining before Stage 3 exit / later gates

- Independent integrated-source review `stage3-integrated-review.md` must resolve any FIX FIRST findings; partial host/ring/drawing reviews are not a substitute.
- Runtime cutter framing, occlusion/clearance, user-control operation in the real inspection window, and matched mechanical parity remain unaccepted.
- StrictMode/remount cleanup stress, zero-frame React churn, BFCache, hardware/adapter coverage, performance budgets, final art, Astra effects review, and owner visual/full-motion review remain open.
- Stage 4 opening/pit recovery has not begun. No G0–G9 gate is closed by this checkpoint.
