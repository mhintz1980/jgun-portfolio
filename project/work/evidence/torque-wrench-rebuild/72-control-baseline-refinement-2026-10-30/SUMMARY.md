# Control-baseline refinement — 2026-10-30

Owner review: all eight items in handoff 71 approved individually. Item 5 explicitly
requires this refinement. Owner accepted option 1 for the study-only hob runout:
retain geometry/framing and document its measured residual. Final visual acceptance
and full verification are separate gates.

Subsequent owner decision, 2026-10-30: Mark approved all current changes and
requested commit and push before returning with further notes. Current owner
approval is complete. The technical failures and pending campaigns recorded here
remain open; approval does not establish a passing runtime roster.

## Result

Controls now reuse the same patched material/program, switching uniforms between
empty-band, authenticated-band, and whole-shaft selections. Identity black/white
also uses a uniform instead of separate compiled RGB expressions. Full-band controls
require exact equality of the black, white, and removal RGBA buffers, plus stable
empty baselines. Null controls require zero identity and beauty pixels. Thresholds
were not relaxed; malformed production feature contracts still reject empty bands.

The first same-program run fixed the null baseline but reproduced a one-pixel
positive-control discrepancy at desktop 44.4 s and narrow 40.2 s. Therefore the old
compiler-only explanation was insufficient. The shared feature-datum varying now
uses centroid interpolation to avoid extrapolation outside partially covered MSAA
triangles. Matching vertex/fragment declarations and the program cache key changed.
This is diagnostic rendering only; production geometry, materials, timing, lighting,
camera paths and mechanical laws are unchanged.

Official interpolation reference:
https://raw.githubusercontent.com/KhronosGroup/OpenGL-Refpages/main/gl4/interpolateAtCentroid.xml
states that centroid sampling lies inside both the pixel and the primitive. The
installed Three.js 0.185.1 WebGLProgram source converts varying to GLSL ES 3 in/out.
Centroid interpolation does not establish per-sample classification at band edges.

## Targeted runtime proof

Command (fresh production build, newly started task-owned preview on 5293):

```powershell
node scripts/diagnose-high-low-features.mjs --url=http://localhost:5293/torque-wrench/ --times=40.2,44.4 --out=output/high-low-feature-proof/control-centroid-2026-10-30
```

- Desktop 1440x900 and narrow 390x844; 12 samples each (forward/reverse at the two
  targeted times plus the diagnostic's four source-takeover/late checkpoints).
- Six forward control sets per aspect: all positive full-band and null controls pass.
- Zero page/console errors, zero camera reverse error, zero subject reverse error.
- Served module hashes matched the local build in both contexts.
- `Scene-DKyzXd2k.js` SHA-256:
  `d5bafd68db1e36d4836963e0676bc4bd39adedad4f4c23cd703ce173216f9a81`.
- Diagnostic `executionComplete: true`; `aliasAccepted: false` intentionally.

Raw reports/images remain ignored output:
`output/high-low-feature-proof/control-refinement-2026-10-30/` (before centroid) and
`output/high-low-feature-proof/control-centroid-2026-10-30/` (final targeted proof).
This diagnostic is not a full roster or dense alias acceptance.

## Static checks

- 82 focused tests passed after the same-program implementation.
- Final centroid shader/mask tests: 9 passed.
- Typecheck and final production build passed.
- Verifier Node tests: 24 passed.
- Independent agent review supported centroid testing and identified verifier
  coverage/reachability issues; runtime evidence above is the deciding evidence.

## Full verification

Full camera/HUD assertion runs completed at 1440x900 and 390x844: both FAIL, each
with 29 samples, 28 gates and zero browser errors. Three assertions fail on each:
`die close-up dolly .4805`, `ghost plateau 27.5%`, and
`three accessible focus callouts`. Camera and subject reverse error are both zero
at every replay checkpoint. Manual shaft HUD/subject-clock assertions pass.
Raw reports: `output/playwright/torque-camera-hud-2026-10-21/after/runtime.json`
and `after-narrow/runtime.json`. Scene behavior and failing thresholds were retained.

Cascade defines four cases (desktop/narrow x full/lite), not the six claimed by
the inherited handoff. The current page roster defines six. Report actual coverage;
never relabel four cases as six. Accepted runout residuals remain measured and can
still fail existing strict alias gates. The inherited 66.9 s source-takeover C1 stop
and opening-specific verification remain open. Owner approval was subsequently
granted as recorded above.

Verifier repairs before the full campaigns: cascade now selects the nearest
reachable integer native-scroll position and records its mapping, retaining strict
2e-6 replay and .003 s time tolerances. Empty production module lists fail.
The first headed attempt still failed at warm-up because actual CSS scroll landings
can be fractional (e.g. request 60229, observed 60228.875). The final harness predicts
the expected progress from observed DOM scrollY and the DOM range, independently of
scene telemetry, and records requested/observed positions. Strict replay tolerances
remain unchanged. Initial failed run: `output/playwright/cascade-control-refinement-2026-10-30-full/`;
corrected rerun: `output/playwright/cascade-control-refinement-2026-10-30-full-r2/`.
The legacy opening verifier also has a wrong peak-flex checkpoint and a silently
skippable tier comparison. Its attempted run revealed a more fundamental issue:
root now redirects to the private route, which has no legacy `__drawingProof`,
`__telemetry`, or `__sheetStats`. Its first desktop/narrow cases produced no
checkpoints; the incompatible run was stopped. No changes to that legacy verifier
are retained. Its full opening-specific gate remains open pending a compatible
runner. Current page verification uses `verify-page-cinematography.mjs`, which
defines all six private-route cases. It is not silently equated with every legacy
opening assertion. Retained cascade repairs change evidence collection, not scene
behavior or alias thresholds.

## Closeout report reconciliation — 2026-10-30

Existing reports were inspected at closeout; these campaigns were not rerun:

- `output/playwright/cascade-control-refinement-2026-10-30-full-r2/report.json`
  finished at 21:09:29 UTC. All four cases completed, overall `pass: false`.
  `sampledPixelAlias`, `windowPixels` and `densePixels` fail; mesh, browser-error
  and takeover gates pass. Dense replay stops at the first failing input-sun
  pose around 55.83–55.86 s; desktop also records an input-sixfold failure.
  Exhaustive dense replay remains open. The passing takeover gate does not
  establish C1 continuity.
- `output/playwright/page-cinematography/control-refinement-2026-10-30-full/report.json`
  was last written at 21:39:45 UTC, status `FAIL`. Desktop-full completed with
  33 framing failures, 11 HUD-clearance failures and reverse/random beauty
  mismatches. Desktop-lite is incomplete; the other four selected cases have
  no results. The six-case roster is incomplete and failing.
- No cascade or page-cinematography verifier process was running at closeout.

Fresh Git-checkpoint checks: 55 focused tests (mask, final cascade, shaft camera,
schedule), 18 page-verifier Node tests, both modified verifier scripts' Node syntax
checks and the production build (including TypeScript) all PASS. These checks do
not replace the runtime campaigns above. Raw reports/images remain ignored; this
summary preserves their actual status in a committed path.
