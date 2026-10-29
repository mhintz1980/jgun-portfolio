# Close tool framing, suspended callouts and drivetrain camera consultation

Owner direction, 2026-10-28, after preview67:

1. Tighten shaper framing onto cutter and input shaft gear. The long arbor was requested to imply machine attachment, not to show its complete length. Its remote end should remain outside the view; retain the 4.5-inch added shaft and 8 mm cutter.
2. Suspend ring-switch and second-stage planet callouts. Preserve all identities, copy, features, source anchors, layout and reactivation data. Their jittering leaders are not accepted. No deletion and no attempt to redesign them now.
3. Current private drivetrain cascade is too axial and flat. Consult the existing Mastering cinemetography notebook about an approximately parallel rail offset by a couple inches or more; report its recommendation and have Astra/Opus assess it. Do not silently implement a new drivetrain camera before presenting the recommendation. Pacing is acceptable: preserve it, including carrier reveal, mechanical clocks and phase.

## Ownership / sequencing

| Lane | Configured seat | Exact writes | Done evidence |
|---|---|---|---|
| Shaper close framing and integration | Parent | InspectionDirector.ts/test, dedicated capture script if needed, docs/evidence | Native-scroll tool captures with gear/cutter readable and remote arbor tip outside view |
| Label suspension | tier-worker / GPT-6.1-Sol / high | hotspotData.ts/test; directly related callout test only if required; label-worker.md | Both callouts inactive through shared gates; complete data retained; LCD unaffected |
| Notebook consultation | Parent | notebook prompt/answer evidence only | ID-pinned existing notebook/conversation, ready sources, source-referenced answer |
| Proposal arbitration | Opus-5.5 / high | Read-only | Distinguish creative recommendation, feasibility and open implementation decision |

## Checkpoint

- [x] Read current owner direction, source and graph coverage; preserve dirty checkout.
- [x] Authenticated NotebookLM 0.8.5: status ok, token_fetch true. Existing notebook 91d25fae-4390-417a-bbaf-5b7c9734826c verified as Mastering cinemetography. Eight ready sources; failed source 8d828d61-cff3-4cc4-a512-0d4c99d5c48e excluded.
- [x] Save notebook prompt and consultation result; report recommendation.
- [x] Astra assessment of the recommendation (Opus attempt failed authentication).
- [x] Tighten shaper view; installed-geometry crop checks pass desktop/narrow and desktop captures show the intended offscreen continuation.
- [x] Suspend two callouts without deleting data; focused checks and desktop native visibility observations.
- [x] Identify rebuilt preview and show changes. Full six-case validation waits for visual direction.

Measured source clue: the cascade anchor's elevation is -74 degrees relative to the radial plane, leaving the camera ~16 degrees from the shaft axis. At .22 m standoff, radial offset is .22*cos(74deg) = .06064 m, already ~2.4 inches. Offset alone is insufficient; evaluate axial camera-to-target lead and the resulting viewing obliquity. Preserve the approved ordinary rail concept, mechanical law, order, materials/lighting and pacing. No DoF, history damping, cutaways or unrequested motion changes.

No staging, commit, push, deployment, protected GLB or .scratch changes. Previous preview approvals do not establish owner visual acceptance. Parent owns build/browser resources; no active prior worker ownership.

## Implementation and actual evidence

Shaper framing now centers the work gear/cutter at the earlier close standoff, rather than lowering its target to fit the entire long arbor. The real remote terminal cap of the installed shank stays outside the viewport across a dense cutting-window sweep on desktop and narrow. Tool geometry, rake/clock, motion, cascade pacing and drivetrain camera source are unchanged.

Callouts `ring-switch` and `stage2-planet` join the existing `clutch-housing` disabled set. All data and anchors/layout remain in place. Re-enable by removing the chosen IDs and updating expected gate tests. LCD remains active. Sol/high delivered the scoped configuration/tests; data-preservation comparison passed. Combined source checks: 61/61 (48 InspectionDirector, 13 hotspotData). Build including TypeScript passed; git diff --check passed.

Initial preview before narrow refinement: Scene-lNlhLu8b.js. **Final preview:** `dist/assets/Scene-CSK9wDgM.js`, SHA-256 `46dabc4f0a55f373ea64d95972e78c324af5a0c19fb119c9195bf8c1f4a6e1a5`; HTML SHA-256 `9320e7a16451f08dfd9ed4878e98738027d3997e60c59bf18ec318e3c36b2711`. Final refinement retested61/61, rebuilt successfully; identified task preview PID36608 stopped and :4173 restarted after rebuild. HEAD unchanged at57e903d6f9f4578916b1271cfb818cc19aef0a9e, index empty, protected GLB/.scratch tracked diff empty.

First focused galleries: `output/playwright/owner-visual-preview-2026-10-28/focused-tool-labels/` and `focused-tool-labels-narrow/`. Seven full-tier captures each, zero errors. At page .52 and .915 all suspended callout cards report visible=false; at .99 LCD alone remains visible=true on both aspects. Narrow inspection exposed the work gear too near the left edge; a final target refinement prioritizes work gear/contact over the far cutter periphery. Final identified-build captures pending. This is focused preview evidence, not a full same-build six-case PASS.

**Final captures:** `output/playwright/owner-visual-preview-2026-10-28/owner-focus-final/` and `owner-focus-final-narrow/`, seven full-tier native-scroll samples each on the identified final build, zero errors. Both suspended callout cards AND SVG leader/reticle visibility remain false at every captured checkpoint; LCD remains visible at .99 in both viewports. Remote arbor-cap crop is asserted against real installed tool geometry on desktop/narrow in the focused source suite. Rendered close views show the work gear and cutter with the arbor continuing offscreen. No full six-case validation or owner visual approval is claimed.

Local galleries: `http://127.0.0.1:4184/owner-focus-final/index.html` and `http://127.0.0.1:4184/owner-focus-final-narrow/index.html`. Task-owned static gallery server restarted after confirming the earlier instance was unavailable. The source application remains on localhost:4173. No new video is claimed in this focused-still iteration.

## NotebookLM recommendation and Astra assessment

Research evidence lives in `project/work/evidence/torque-wrench-rebuild/68-owner-focus-labels-camera-2026-10-28/`. NotebookLM's corrected recommendation is a **straight parallel rail with a fixed oblique view**, with camera and target moving together and no animated yaw required. Its 75 mm radial/75 mm axial example gives45degrees; Astra agrees with the concept but recommends a **55–65-degree** candidate for better depth and the repository's explicit parallax guard. Its starting pose is100mm total radial offset,57.7mm axial lead,60degrees off-axis,115.5mm standoff, output-side sign preserved. Fit and C1 handoffs remain unrendered/unproven; preserve all timing.

The private drivetrain path has NOT been changed in this wave. This recommendation is ready for the owner to select before a 3–4-still candidate preview. Notebook prompts, answer corrections, grounding limitations and Astra's full bounded assessment are saved. No new NotebookLM source/notebook/note or conversation reset was made.

Owner-readable proposal: `project/work/evidence/torque-wrench-rebuild/68-owner-focus-labels-camera-2026-10-28/camera-recommendation.md`. Opus attempted the requested arbitration but returned401OAuth before delivery; already-authorized Astra/medium completed it. This was concept arbitration, not an adversarial review. No adversarial review was run for the reversible label/framing changes. Configured Sol/high handled label suspension; parent integrated and verified.
