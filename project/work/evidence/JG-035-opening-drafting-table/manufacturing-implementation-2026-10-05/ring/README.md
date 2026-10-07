# Ring forming-coverage repair - producer evidence

Date: 2026-10-05. Current sampler patch passes its focused checks. Parent integration, fresh runtime proof and independent review remain open. No staging or commit in this repair.

This record supersedes the previous producer's 0.11 rad/s / two-turn sampler and its claim that full-circumference relief can follow a 12.6-degree traverse. Existing `runtime/` and `runtime-probe/` captures describe that rejected sampler; they do not verify this repair.

## Owned patch

- `src/scene/inspection/timeline.ts`: physically sufficient contact rotation, contact-history-limited axial relief, continuous analytic angle/rate, restored 16-pi endpoint, caller-owned spin output, bounded filtering fields.
- `src/scene/inspection/timeline.test.ts`: GLB-derived per-slice angular coverage, bandwidth requirements, deterministic seeking/output ownership, continuous angle/rate and retained contact/fade/finish tests.
- `ringGeometry.ts/test`, shared scene/camera/lifecycle and all GLBs were read but not edited.

Accepted contract: [manufacturing plan section 3](../../../../../../docs/jgun-manufacturing-inspection-plan.md). The original 12-second phase spine and 4.2-6.2-second axial traverse remain.

## Measured coverage

Immutable `public/models/knurling-tool.glb` SHA-256:
`e5bff99439eb6655ea9eda3929fcca2f3e388b98c5742dcef95c371423c8fbd8`.

The ring is 27.204217 mm wide with 1.6 mm smooth edge lands, leaving a 24.004217 mm worked band. Actual roller width is 7.5 mm, radius 11.5 mm; ring radius is 37.721828 mm. The scene's existing axial rescale gives 16.504217 mm centre travel over two seconds, or 8.252109 mm/s feed. Interior slices spend approximately 0.909 s within the footprint. Both contacts are opposite, so pi radians of engaged ring sweep are needed to cover a full circle.

The measured clip holds paired contact from clip 1.5 through 4.0 s. The retained mapping gives:
- First contact 3.8 s, stationary entry dwell 0.4 s through 4.2 s.
- Axial traverse 4.2-6.2 s. Ring speed throughout contact is 4 pi rad/s (two turns/s); the two-second traverse supplies four true turns.
- Far band edge first enters the footprint at 6.2 s. Reveal trails the leading edge by 0.255 s (pi sweep plus 2% interpolation margin), so full relief completes at 6.455 s.
- Both rollers remain engaged until 6.485714 s. Completion precedes loss of contact by 30.714 ms.
- Fade starts 7.7 s, only after measured clearance >= 10 mm, and ends 8.2 s.
- Black finish is complete from 9.3 s; return starts 10.5 s, giving 1.2 s of finished black relief.
- Ring angle reaches exactly 16 pi at 10.5 s and stays stopped through 12 s. Existing lifecycle tests remain unchanged.

The initial 7.5 mm footprint already receives enough rotation during entry dwell; its relief eases into view after 4.2 s. Subsequent axial slices reveal only after sufficient actual engaged sweep. At 6.2 s the far end is deliberately still unformed. A fully completed band at exactly 6.2 s is incompatible with the retained measured feed.

[coverage-report.json](coverage-report.json) records 257 axial slices sampled every 0.5 ms, 360 circumferential bins per slice, measured contact and footprint, first reveal and true sweep:
- Minimum engaged sweep at reveal: 3.204424507 rad (> pi).
- Every slice: all 360 angular bins contacted before relief reveal.
- Rejected producer replay: all 257 slices incomplete at its claimed reveal.
- Direct bore/end-face/land mask exclusions pass.

## Continuous, allocation-free sampler

`sampleSpin(time, out)` writes angle and rate into its required caller-owned output. `sampleInspection(time, out)` passes that same object through; neither function creates arrays, objects or vectors while sampling. Allocate `newFrame()` once per consumer, outside the frame loop.

Spin-up uses an integrated squared smoothstep plus endpoint-flat bump to pay the exact eight-turn angle budget. Contact runs at 4 pi rad/s, then eases to 0.5 rad/s over 0.4 s after separation and finally stops by 10.5 s. Angle/rate are continuous at all segment boundaries; shuffled/reverse seeking needs no accumulated history. The phase strings stay compatible with the existing spine.

## Precise integration requirements

1. Consume `f.knurl` directly in `ring.uniforms.progress.value`; keep the OD/bore/land shader mask. Do not rebuild a linear 4.2-6.2 reveal or force progress to one at traverse end. The existing measured axial rescale must remain consistent with the ring and roller widths above.
2. Keep `f.angle` as the true ring rotation and `rollerAngle(f.angle, ring.radius, measuredRollerRadius)` about each wheel's local Y after mixer sampling. Both external contacts counter-rotate at equal tangential speed. Never wrap or slow these angles to accommodate raster readability.
3. Apply `f.ringDetailScale` and `f.rollerDetailScale`, both finite in [0,1], to repeated-feature depiction. They are conservative temporal-bandwidth ratios based on the worst-case lite 30 fps, not lower physical speeds. At contact, ring/ridge rate is 384 Hz and the roller teeth rate is approximately 839.72069 Hz; fields are approximately 0.01953125 and 0.00893154. Raw angles can strobe if these fields are ignored.
4. For the OD normal map, filter/time-average the repeated detail across the true angular advance and attenuate high-frequency normal strength from its existing 1.5 baseline using `ringDetailScale`; preserve progress independently. At high speed the fine diamonds may soften nearly to their mean normal. Restore the full crisp formed relief as the field returns to one during the stop. Do not claim multiplying a frequency by this field actually slows the texture.
5. For the tool's 128-tooth wheels, blend/filter the repeated tooth depiction toward a smooth rolling envelope with `rollerDetailScale`, using only instance-owned materials/shaders or bounded derived depiction. Suppress aliased tooth edges as well as highlights; a material-only normal reduction cannot remove a sharp geometric tooth silhouette. Preserve measured contact radius, axial footprint, axes, handedness and true wheel rotation. The source prop GLB stays byte-for-byte immutable.
6. Apply `f.toolOpacity` to the mount-owned tool material clones, retaining the original per-material opacity multiplier. Switch transparency/depth-write appropriately during fading; keep `toolVisible` gating. Create/dispose resources outside the frame loop. Existing carry-out follows measured clearance.
7. Keep both-contact composition readable through the 3.8-4.2 dwell, and retain a single grazing reflection during the 9.3-10.5 black hold. Record versioned telemetry for spin, contact, progress, filtering fields and tool opacity. Seek/replay uses the same deterministic fields.
8. Run fresh integrated 30/60 fps contact, final-band, clearance/fade and black-hold proof, including narrow/lite; do not reuse the superseded runtime folders. Full forming can be true while sharp high-speed detail is intentionally filtered. Sampler success does not assert current renderer filtering or macro acceptance.

Shared `InspectionScene.tsx` currently uses the angle and progress but does not consume the filtering fields or tool opacity. That integration is explicitly outside this repair's ownership. No lifecycle expectation needs weakening.

## Reproduction and checks

Run from the real checkout:

`node project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/ring/coverage-evidence.mjs`

The script reads the immutable GLB, independently measures footprint/contact coverage, records source hashes, runs the entire focused inspection suite and TypeScript check, then rejects concurrent source changes during verification.

- [focused-inspection.json](focused-inspection.json): 23/23 tests, 4/4 files pass, including unchanged `lifecycle.test.ts`.
- [typecheck.log](typecheck.log): `tsc --noEmit` exit 0.
- [coverage-report.json](coverage-report.json): measured coverage, rejected-producer replay, source hashes and sampled frame fields.
- `git diff --check` for owned source: pass.
- Graph lookup returned no current inspection symbols. Coverage reported inspection files not tracked in its 2026-09-30 generation; direct current source was read for all conclusions.

Older runtime images and seven-case reports remain historical. Gate checkboxes remain pending parent integration and fresh independent review.
