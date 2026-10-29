# 100:1 cascade, measured cap and solid housing — execution evidence

**Final calibration update:** An additional same-build headed replay found a
narrow 160 RPM sun step of 18.179601° at rendered times 54.711206–54.730143 s.
Across the union of recorded cadences, the highest supported whole-RPM cap
is therefore **158**, with 159 replaying that interval at 18.065978° and 158
at 17.952356°. The production constant is lowered to 158. Stage 2 still gets
about 1.006 fully visible orbits in its unchanged 5.2-second window; output
rotation becomes 23.7° over 55.5–58 s. Fresh headed 158 confirmation passes
on both viewports; the four-case current-build r4 roster passes 23/23 per case. The
historical 160 figures below are retained as the calibration record.

Gemini-4-Argon completed its two review rounds and issued SHIP on the preceding
160 RPM implementation and passing r2 roster. That verdict predates the final
2 RPM calibration reduction; it must not be presented as review of the exact
158 RPM build. The ratio, reveal timing, camera and housing implementation are
unchanged by this conservative parameter adjustment. Its fresh source,
headed-playback and browser checks are recorded separately. No third review
round is added beyond the agreed two-round limit.

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`. HEAD remains
`57e903d6f9f4578916b1271cfb818cc19aef0a9e`. Owner visual acceptance OPEN.
This supersedes the all-stage orbit requirement and high input rates in 54/55.
The entire inherited dirty tree is retained. No staging, commit, push, deployment
or protected-asset regeneration is authorized or performed.

## Implementation

`src/scene/inspection/shaft/cascadeConfig.ts` owns the two adjustments:
`INPUT_TURNS_PER_OUTPUT_TURN = 100` and `INPUT_RPM_CAP = 158`.
Stage 1 sun/carrier/local-planet remains 5.2 : 1 : −3.5. The four downstream
reductions use `r = (5.2/T)^(1/4)`: carrier speeds in physical order are
`1, r, r², r³, r⁴`, with output following `r⁴`. The study no longer uses
`ROTATION_TURNS`; the main-world exploded-view sweep and offsets are unchanged.
The README and animation-spec record both independent ladders.

| Stage | Planet fade (s) | Carrier fade (s) | Input plateau RPM | Visible orbit before carrier |
|---|---|---|---:|---:|
| 2 | 42.4–43 | 48.2–48.8 | 126.4 | about 1.006; only full-orbit gate |
| 5 | 48.8–49.4 | 50.4–51 | 137.46 | about .101; report only |
| 3 | 51.4–52 | 52.8–53.4 | 148.52 | about .041; report only |
| 4 | 53.4–54 | 54.9–55.5 | 158 | about .024; report only |

The Stage 2 full-visibility window grows from 2 to 5.2 seconds because 126.4 RPM
at this reduction needs about 5.169 seconds for one orbit. Initial engagement
through 40.2 s remains intact. The camera's close orbit now ends at 48.2 s,
then follows the same straight dolly to the output. Total duration remains
58 s; output fades 55.5–56.5 s and exterior returns 57–58 s. Speed ramps and
angles remain closed form, continuous and reversible with no accumulated clock.

`MechanismDirector.ts` now assigns `ghostOpacity = 1` directly. Housing checks
read the material actually attached to P000245, including inspection clones,
rather than assuming the parked source material remains attached. Browser
proof includes commanded/applied opacity, depth writing, effective visibility,
and actual housing beauty contribution via A/B capture.

## Cap calibration history and limits

**Final 158 RPM confirmation:** Headed installed Chrome on the 60 Hz AMD780M
display passes all measured feature bounds at authored 1× in both viewports.
Desktop and narrow each capture 1129 frames; maximum input sun steps are
17.940487° and 17.615772° respectively (18° bound). Maximum callback gaps
are 17.5 / 17.9 ms. Each actually loaded JS module is fingerprinted against
dist, including `Scene-DSrp2Jop.js` SHA-256
`b609fabf60d24a366eb88c7801a814e656b02c7689d556a13e11e8da07ca79e4`.

Evidence: `output/playwright/owner-corrections/56-speed-158/measurement.json`
and `analysis.json`. The analysis includes all six warmed recorded cadences
(two original 160, two repeat 160 including its failure, and two actual 158).
An independent analytic sampler must reproduce every recorded angular step
within .00001° before replaying candidate 158 and next integer 159 at those
exact rendered times. No measured frame interval is omitted. All repeated
features pass at 158; 159 fails the union of measured cadences and also the
actual final desktop 158 cadence (18.054034° at 159). Actual headed confirmation
at the selected 158 cap is required separately on both viewports.

Reproduce analysis with `node scripts/analyze-cascade-speed.mjs output/playwright/owner-corrections/56-speed-158 output/playwright/owner-corrections/56-speed-final output/playwright/owner-corrections/56-speed-160-warm`.

The following paragraphs describe how the earlier provisional 160 cap was
measured and then superseded after the repeatability run.

The nominal pace is authored 1×: one study second per wall second, driven by
native `window.scrollTo` through the measured inverse inspection clock and
`window.__torqueNarrative.scrollFraction`. It takes 17.8 s to traverse the
continuation. This is a variable physical scroll pace: desktop 244.9–1015.5
CSS px/s, narrow 230.2–954.7 px/s. Measured physical allocation is 6386.1 px
desktop and 6003.8 px narrow. One viewport/second is a faster comparison
(about 7.1 s for the whole continuation), and was visibly aliased numerically.

`scripts/measure-cascade-features.mjs` decodes Draco triangles read-only and
counts radial cross-section periodicity. Planets P000247/P000248/P000069/P003046
measure 12/13/11/10 teeth. Integral suns P001836/P001837/P001849/P003045 measure
10/9/13/15 teeth. P001835 has 10 gear teeth and a separate sixfold feature region;
the tighter 10-tooth pitch controls. Live planet-array counts in physical
order are 4/4/4/4/5. The source GLB SHA-256 is unchanged; the detailed method,
sections, sample offsets and uncertainty are in
`output/playwright/owner-corrections/56-features/summary.json` and
`measurement-report.json` (20/20 geometry checks pass).

The owner's AMD Radeon 780M display reports 60 Hz (`Win32_VideoController.CurrentRefreshRate`),
matching the measured 16.7 ms browser cadence. At ideal 60 Hz, 160 RPM gives 16° per frame on the 10-tooth sun, below its
18° half-pitch bound. Headed installed Chrome, ANGLE/D3D11 at the measured
60 Hz cadence confirms a tighter native-quantization limit:

| Viewport | Captured frames | Maximum sun step | Median frame interval | Maximum callback gap |
|---|---:|---:|---:|---:|
| 1440×900 | 1128 | 17.956009° | 16.7 ms | 33.3 ms |
| 390×844 | 1129 | 17.816126° | 16.7 ms | 17.7 ms |

All measured intervals are included; none were discarded as outliers.
Every carrier, integral sun, local planet and absolute planet angular step
stays below half its measured feature period. The next integer RPM, 161,
replayed at the exact desktop constant-cap witness interval gives 18.068234°,
so 160 is the highest whole-RPM cap supported by this measured cadence.
This is a cadence replay bracket, not a separate headed recording at 161 RPM.
The full traces and derived per-feature maxima are in
`output/playwright/owner-corrections/56-speed-160-warm/measurement.json` and
`analysis.json`; reproduction uses `measure-cascade-speed.mjs --headed --nominal --no-video`
then `analyze-cascade-speed.mjs <evidence-directory>`.

The first cold recordings at 170 RPM failed. Ordinary frames reached 18.9°,
and desktop exterior restoration triggered a roughly 200 ms first-use shader
stall. A full unrecorded native traversal warms partial-alpha shader variants
before the final measurement. The 160 result confirms the warmed nominal
sequence, not universal freedom from cold-start jank, faster-scroll aliasing,
or different display scheduling. The probe reads the preceding rendered pose
in the scroll callback; a stall may be attributed to the following callback.
This does not omit the resulting angular step. Numerical alias bounds and
headed playback evidence do not close owner visual acceptance.

## Output rotation and source return

At the selected cap and T=100, output rotation from 55.5 to 58 s is 23.7°.
It rotates 14.22° before exterior restoration starts at 57 s. No half-turn
target exists. For the same 2.5 s output window:

| Input RPM | Output degrees at 100:1 |
|---:|---:|
| 158 (selected) | 23.7 |
| 160 (superseded) | 24 |
| 180 | 27 |
| 330 | 49.5 |
| 600 | 90 |
| 943 | 141.45 |

The accepted cap is 158 after repeated calibration; the remaining rows are measured-time
calculations, not accepted playback caps. A lower T or longer output interval
would increase output travel; neither is silently substituted for the owner’s
100:1 starting ratio.

The inherited common-scalar registration return still rewinds about 7.487
Stage 1 carrier turns across page .825–.845 (formerly about 31.2).
Applied endpoint carrier angle is about −47.0402 rad, returning to zero.
Mesh phase error stays around 3e-13 rad in settled return samples. The held
108° tooth index still resets at exact source takeover. Continuous return
frames and contribution captures remain part of the browser evidence; this
work does not claim a shortest-path return or triangle-level collision proof.

## Verification and independent review

- Source: 251 tests / 17 files pass, one worker; build/typecheck pass.
  Logs: `output/playwright/owner-corrections/56-source-tests.log`, `56-build.log`.
- Verifier r1 stopped after two assertion defects: hidden downstream angles
  were compared against the superseded ratio; the housing assertion inspected
  an unattached source material. Both are repaired with explicit applied-state
  and pixel evidence. No acceptance threshold was relaxed.
- Superseded 160 RPM build: desktop-full, narrow-full, desktop-lite and narrow-lite each
  pass 23/23 checks, 248 settled samples and four continuous forward/reverse
  sequences. No browser/HTTP/WebGL errors or context losses. Housing opacity
  and depth writing pass at 22 settled checkpoints per case; eight per-case
  A/B captures confirm actual housing pixels. Production entry/Scene hashes
  match dist, protected models match, index empty and HEAD unchanged.
  Report: `output/playwright/owner-corrections/56-ratio-solid-r2/report.json`.
  Command: `node scripts/verify-owner-corrections.mjs --run --refinement-only --fail-fast --url=http://localhost:5292/torque-wrench/ --out=output/playwright/owner-corrections/56-ratio-solid-r2`.
  This is the four live correction cases, not a new full F1–F4/static roster;
  no public stills were regenerated.
- Final 158 RPM build: 57 focused schedule/runtime/script tests pass and the
  new build/typecheck passes (`56-cap158-tests.log`, `56-cap158-build.log`).
  Headed confirmation is complete. Run r3 stopped at a stale verifier assumption
  that speed evidence has exactly two records; the complete calibration now has
  six. All other settled gates passed. The guard now requires both actual headed
  158 RPM viewports, validates every calibration channel and rejects alias-bound
  violations; offline negative cases cover those requirements. Final four-case
  r4 roster passes: desktop-full, narrow-full, desktop-lite and narrow-lite each
  23/23 checks, 248 settled samples and four continuous sequences; zero errors
  or context losses. Housing has at least 4787 desktop / 1544 narrow natural
  contribution pixels at the sampled explosion checkpoints. Ratios measure
  100:1 within floating precision; output is 23.707° desktop / 23.699° narrow.
  Later visible orbit fractions (stages 5/3/4) are approximately .1006/.0414/.0237;
  Stage 2 is 1.0061 desktop / 1.0060 narrow. Only Stage 2 has an orbit threshold.
  Report: `output/playwright/owner-corrections/56-ratio-solid-r4/report.json`.
  Command: `node scripts/verify-owner-corrections.mjs --run --refinement-only --fail-fast --url=http://localhost:5292/torque-wrench/ --out=output/playwright/owner-corrections/56-ratio-solid-r4`.
  Final report-only orbit assertion cleanup is covered by `56-cap158-tests-final.log`.
- Gemini-4-Argon independent round 1 supports the implementation and found the
  missing camera seam test, now fixed. Final round 2 issued SHIP on completed
  160 RPM browser proof before the final calibration reduction. Prompts,
  event logs and verdicts: `56-review-round1*` and `56-review-final*` under
  `output/playwright/owner-corrections/`. The precise review boundary is stated
  at the top; no exact-build 158 RPM independent SHIP is claimed.

The rebuilt preview remains running at `http://localhost:5292/torque-wrench/`.
Owner visual acceptance and broader historical gates stay OPEN. The empty
index, unchanged HEAD and protected model hashes are retained. All inherited
dirty work remains; no staging, commit, push, deployment or protected-asset
regeneration was performed.

Outside-repository rig/telemetry skill files still describe the old ghost
fade. They were read as historical guidance; owner instructions and current
repo spec supersede them. Those external files were not edited.
