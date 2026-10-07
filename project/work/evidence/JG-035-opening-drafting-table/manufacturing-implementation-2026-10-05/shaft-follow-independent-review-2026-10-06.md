# Independent camera-follow correction review — 2026-10-06

**Verdict: SHIP for the bounded analytic follow correction.** No blocking code finding. This closes the remaining startup-follow defect in `shaft-kinematics-camera-rereview-sol.md`; it does not close browser runtime, manufacturing, or owner visual acceptance.

Reviewer: independent OpenAI Codex subagent. Requested native model: GPT-6.1-Sol. The tools did not expose serving-model attribution, so this record does not claim observed model identity. Source review and calculations were performed independently of the GLM report.

## Scope and evidence

Read the current `kinematics.ts`, `kinematics.test.ts`, `camera.ts`, `camera.test.ts`, and `schedule.ts`; the GLM final report, Sol re-review, leaf gate including K7/K8, `shaft-follow-fix-spec.md`, and owner plan section 4. Read the R3F performance guard and WebGL telemetry skills. The newer fix spec explicitly requires the exact law integral and preservation of existing camera bounds.

Graph coverage metadata was changed for the source files and excluded the evidence subtree. Conclusions therefore rely on direct current source, not graph completeness. The numerical probe transpiled the current TypeScript modules in memory, loaded their current dependencies, and exercised exported functions. It wrote no source, test, or helper file. Only this review packet was created; no staging or commit.

## Deciding checks

1. **Startup and downstream constants are correct** (`kinematics.ts:312`, `kinematics.ts:321`). On 2..3 s, weight is 1 and rate is smoothstep S, so mf is the exact primitive of S. `mf(3)=0.5`, `mf(6)=3.5`, and `mf=m` on 2..6 s. The resulting follow span is `7*pi/16 = 78.75 degrees`, as required by the latest exact-integral fix spec. The earlier 90-degree quarter-orbit prose is superseded for this correction; it is not evidence of owner visual acceptance.

2. **Slowdown and recap obey the same derivative law** (`kinematics.ts:300`, `kinematics.ts:310`, `kinematics.ts:328`). Over 6..7.2 s the derivative is `(1-S)*(1-0.78*S) = 1-1.78*S+0.78*S^2`; the implemented polynomial primitive differentiates to that expression. Follow is constant over 7.2..11 s even while machining ramps up. On 11..12 s it integrates `4*S`, on 12..14 s it integrates 4, and on 14..15 s it integrates `4*(1-S)`. Before 2 and after 15 s follow is frozen; the later hob machining rate does not advance it because follow weight is zero.

3. **Independent finite differences and quadrature confirm the law.** On a 0.001 s grid across 0..15 s, maximum absolute error in `d(mf)/dt - followWeight*machiningRate` was:

   | Difference half-step h | Maximum error (machining s/s) |
   |---|---:|
   | 0.001 s | 3.9920e-6 |
   | 0.0001 s | 3.9931e-8 |
   | 0.00001 s | 6.2026e-10 |
   | 0.000001 s | 3.6782e-9 |

   The last increase is consistent with floating-point cancellation. Multiplying by `FOLLOW_GAIN` gives the corresponding azimuth-rate error. Independent 130,000-interval trapezoidal integration over 2..15 s gave `15.979657142872641`, differing from `FOLLOW_MF_TOTAL=15.979657142857143` by `1.55e-11`. Rate/weight joints at 2, 3, 6, 7.2, 9.6, 11, 12, 14 and 15 s match continuously; the checked-in K8 tests also exercise offset one-sided and straddling differences.

4. **Nearest-turn compensation preserves the camera path** (`camera.ts:40`, `camera.ts:72`, `camera.ts:159`). Final follow is `6.2751966858604575 rad`; the compensated nearest-turn offset is `-0.007988621319128697 rad` (about -0.4577 degrees). Post-15 anchors subtract that offset, and the camera adds the live frozen follow exactly once, yielding the authored machine azimuth plus one complete turn. Trigonometric position is consequently identical to the authored machine direction. The 14..15 handoff traverses about -21.4577 to +20 degrees smoothly, without a cancelled near-full turn. It neither reintegrates follow nor depends on seek history.

5. **Camera continuity independently satisfies existing bounds.** A 1/240 s sweep over 0..43 s at both 1440/900 and 390/844 gave maximum position step `0.0016952142 m < 0.005 m`. Maximum FOV step was `0.0601541 degrees` desktop and `0.0664038 degrees` narrow, both below 0.12 degrees. At authored anchors and target-follow joints, one-sided scalar derivative mismatch at h=1e-5 s was at most `0.000398435` (the largest component was FOV in degrees/s). The smoothstep anchor curves, continuous follow rate, and eased up vector establish C1 joins. Maximum absolute view/up dot was 0.552102, safely away from a parallel lookAt singularity. Existing framing, handoff, card-band, materials-hold and shuffled-seek tests all pass in the controlled rerun.

6. **Absolute-playhead contract remains intact.** `sampleShaftKinematics` writes the analytic follow into its caller-owned frame; `sampleShaftCamera` consumes that frame without a second clock, accumulator or damping. `schedule.ts` independently samples visibility and finale angle from the same input time; it does not re-integrate machining follow. No source change was required.

## Commands and results

- Independently ran `npm test -- --run src/scene/inspection/shaft`: 7 files, 101/102 tests passed; only the dense camera C0 test exceeded its unchanged 5000 ms timeout under concurrent verification load. There was no numerical assertion failure.
- Independently ran `npm run typecheck`: PASS, exit 0, `tsc --noEmit`.
- After the parent completed other test activity, independently reran `npm test -- --run src/scene/inspection/shaft --maxWorkers=2`: **PASS, 7 files / 102 tests**, exit 0, 5.14 s total. Camera suite: 10/10, 2103 ms; kinematics suite: 26/26, 1563 ms. No timeout or assertion was changed.
- Parent separately reported `npm test -- --maxWorkers=2`: PASS, 43 files / 440 tests, exit 0, 30.53 s. This is corroborating parent evidence, not this reviewer's independently executed full-suite result.

## Nonblocking documentation observations

`kinematics.test.ts:184` says the final azimuth below 2*pi means `FOLLOW_AZIMUTH_MOD` "no longer wraps." The current nearest-turn implementation does subtract 2*pi; the comment should instead distinguish the retired positive-range wrap from the nearest-turn representation. The assertion itself is correct.

The historical gate's K1 (`gates/shaft-kinematics-camera.md:17`) still describes normal rate throughout 2..6 s, and K5 (`:66`) still describes a pi/2 camera span. K7/K8 correctly record the subsequent changes. These older sections should be read as historical test records; consolidating their current summary would reduce ambiguity. Neither observation blocks the corrected numerical behavior.

## Reviewed source hashes

Hashes were unchanged between numerical inspection and final review verification:

| File under `src/scene/inspection/shaft/` | SHA-256 |
|---|---|
| kinematics.ts | 4509f6b247efc40b428c37ad4a8925add3a944c1e4d16fd978f62101d6cd874a |
| kinematics.test.ts | 378b32edf9e8f802577a34674e40ad0af97b3b796234dfcd9781b8ae7f8df5bc |
| camera.ts | dda159414f4c6d4c6af66dc541b91bfc2f4cc7d4a908e0a7691d1c7be7ccdb25 |
| camera.test.ts | 6afd5b4f28974b6a8175c1d46599df151bb76de35d296ef724a82d15caef4e66 |
| schedule.ts | ed1cecad00363b8788e0bcf4ccb54f2833ae707ee5648902fe2d9a5d8a8d37e5 |

No browser inspection was performed or inferred. The remaining runtime/owner gates stay open.
