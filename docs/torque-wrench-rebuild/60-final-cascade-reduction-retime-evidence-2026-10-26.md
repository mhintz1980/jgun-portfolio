# JG-035 final cascade evidence (execution 2026-10-26–27)

Plan: [59](59-final-cascade-reduction-retime-plan-2026-10-26.md). Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`. HEAD `57e903d6f9f4578916b1271cfb818cc19aef0a9e`, empty index. No staging/commit/push/deploy/protected-asset regeneration. Existing dirty tree and `.scratch` preserved. Owner visual acceptance **OPEN**.

## Implemented source contract

- Physical carriers 1/.2/.04/.008/.0016 (order 1/2/5/3/4); output .0016; derived input/output 3250:1. Positive stored local planet magnitudes 3.5, 10/3, 36/13, 52/11, 6 with existing runtime minus sign. Later 5:1 reductions are cinematic; no manufacturing claim.
- Startup and 0–40.2 s unchanged. Drive 90→270→420→1000°/s in the corrected cage fades; analytic integral 21.9729166667 Stage 1 turns. Output 12.6564° total, terminal 1.6°/s. Deliberately slow late stages accepted by default; owner perception remains open.
- Both clocks/duration clamps end at 66.9 s; no orbit-count requirements. Exterior restoration 65.4–66.9. Physical-distance clock with 5% transition shoulders, constant interiors and multiplier 24.095648. Major-window allocation ratios pass 1.5×±2% source checks. Earlier native offsets unchanged.
- Common unwrapped phase and the fixed shaft index transfer to source carrier/planet/input/output meshes. The held phase survives explosion/close without rewinding or independently wrapping meshes. Return phase control now translates supports only.
- Camera azimuth finishes at 43.5, then holds; 76 mm straight dolly 52.2–66.9. The 2° trial and exact-axis diagnostic both expose some upstream planet pixels through rotating/perforated downstream cages.

## Verification completed so far

1. Focused tests **242/242 PASS**, `output/final-cascade-unit.json`. Includes reference-relative Stage 1 residual <1e−9, exact planet laws, deterministic seeks, physical window budget, takeover phase and allocation-free runtime samplers. Production build/typecheck PASS; existing >500 KB chunk advisory remains.
2. Camera 0–40.2 s: 28,947+ samples across three aspects have the same Node/V8 SHA-256 as a reconstruction of the original continuation anchors: `d855cf12ff6f4ab94278e3bf1890b249cd315611f312e20a9b1a398956afef2d`. The post-40.2 anchors alone were changed.
3. Fresh preview port 5293; served production module hashes match local `dist`. Restarted after each rebuild. Initial verifier attempts 1/2 failed a too-tight native pixel seek tolerance before collecting masks; iteration 3 records the corrected quantized seeks.
4. Depth-tested full-resolution RGBA8 feature proof: all occurrences/material groups, original occluder shaders/depth/alpha, feature-only black/white identity differences, beauty removal A/B, threshold exactly zero, repeat and restoration controls. Complete input shaft/cages/planet meshes are conservative feature supersets; no sampled tooth-band endpoints. This is scene-direct evidence; composer/DOM are excluded. It proves contributions only at recorded poses/resolutions.
5. **2° trial FAILS sampled alias gate**: `output/playwright/final-cascade-2026-10-26/iteration3/report.json`. At 57.9 s, Stage 1 planets contribute 2489 identity-mask and 2489 beauty pixels at a nominal .375 feature period/frame; at 59.6 s 947 pixels also contribute while over limit. Frame-by-frame cadence proof remains required. Pixel images accompany every sample.
6. **Exact-axis diagnostic also FAILS**: `output/playwright/final-cascade-2026-10-26/axis0-trial/report.json`. Occlusion does not remain complete over rotating cage phases. No upstream fades have been applied.

## Concrete owner decision: upstream fades

To satisfy the specified drive without changing the approved Stage 1 law or manufacturing geometry, proposed narrowly scoped fades are:

| Feature | Proposed fade | Reason |
|---|---|---|
| Approved input shaft (both 10-tooth and sixfold features) | 52.2–53.1 s, incoming Stage 2 cage fade | Must contribute zero before the 270°/s ramp |
| Stage 1 planets, all occurrences | 52.2–53.1 s | Already over .35 period at 270°/s/60 Hz; they reappear through later cage holes |
| Stage 1 cage / P001836 integral sun | 55.5–56.4 s, incoming Stage 5 cage fade | Must contribute zero before the 1000°/s ramp |

**Owner approved on 2026-10-27: "I approve the upstream fades"**, also selecting "Approve these upstream fades" in the proposal question. These exact fades are now implemented analytically in `schedule.ts`, with separate carrier/planet/input opacities and unchanged transforms/ratios, drive ramps, pre-40.2 sequence and main housing. Deterministic reverse seeks are tested. Source aliases returning at the .845 handoff inherit the held phase; source exterior does not receive an added fade or angle reset.

Expanded focused suite after the approved fades: **262/262 PASS**, `output/final-cascade-final-unit.json`. The physical clock now budgets every planet/cage/hold/component boundary, not only the major stage boundaries. The source inherits the held phase while retaining original explosion/close display increments around it. Broader suite before the last source refinements: 1239 passed / 4 failed. Two stale duration expectations were corrected and pass in the focused suite; cadGate's concurrent module-load failure passes in isolation. The source-geometry/drawing hash mismatch is in the pre-existing `nodeRoles.ts` dirty work (not modified in this execution); do not claim the full suite clean. Final headed/dense and opening evidence will be recorded below.

## Execution notes

**Owner review checkpoint, 2026-10-27:** Owner requested review before further verification. Verification is paused; the fresh preview remains available at `http://localhost:5293/torque-wrench/?quality=full`. Cached-rig lifecycle correction is implemented: immutable input/ring rest angles survive factory recreation, and host installation/cleanup restore the prefix pose. The expanded 262-test focused suite passes after that fix; the production build contains it. The fresh post-fix full browser/opening roster is unfinished and must not be reported PASS. Earlier `final-approved` recordings are pre-fix evidence (desktop/full and both narrow cases completed dense replay; desktop/lite stopped after 619 frames due native seek drift). The new `final-verified` run was stopped at the owner's request. Continue verification only after the owner resumes it; preserve this review checkpoint and all existing boundaries.

Four native subagents were dispatched with disjoint ownership; all ended in provider failures (three 429, one 502/DNS). Clock/proof partial edits were recovered and integrated locally. No independent final reviewer result is available; do not infer SHIP. API-equivalent cost receipt: unavailable (no observed token usage/rate accounting).
