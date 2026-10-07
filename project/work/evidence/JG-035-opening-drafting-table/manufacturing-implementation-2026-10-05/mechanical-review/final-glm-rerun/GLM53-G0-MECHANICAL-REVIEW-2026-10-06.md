# GLM-5.3 (high) independent G0 mechanical review - 2026-10-06

Reviewer: Z.ai GLM-5.3, reasoning high (as requested). Producer: OpenAI. Scope per brief: read-only except this folder and geometry/final-glm-rerun/; no edits to sources, plans, gates, index or user memory; no GPU/browser/build/server/git commands. Producer self-reviews were treated as claims, not proof.

## Verdicts
- Measurement implementation: SHIP
- Mechanical release (illustrative assembled study): SHIP within the named limits. NOT a machine-fit certification.

## Commands and exit codes (Blender 5.1.1, -b --factory-startup --python-exit-code 1)
1. --python scripts/manufacturing/measure_g0.py -- --out <packet>/geometry/final-glm-rerun ... EXIT=0; final line G0_MEASUREMENT baseline_matches=6. Log: ../../geometry/final-glm-rerun/run-measure-g0.log
2. --python scripts/manufacturing/classify_contacts.py -- --out <packet>/mechanical-review/final-glm-rerun/contact-classification.json ... EXIT=0; CLASSIFY_CONTACTS_DONE. Log: run-classify-contacts.log
3. measure_study_phase.py CLI has no output override (only --search-only). Executed measure_study_phase_rerun.py, a copy living only in this folder with exactly two line changes: ROOT = REVIEW.parents[6], and registry read from geometry/final-glm-rerun/source-registry.json (the GLM measure_g0 rerun registry). EXIT=0; STUDY_PHASE_DONE. Log: run-measure-study.log. Original mechanical-review/measure_study_phase.py untouched (line diff = only those 2 changes). Output study-phase.json is byte-identical to the producer file.

## Reproduction vs producer packet
- measure_g0: 6/6 pinned baseline SHA matches; Default.glb occurrence P001835-2 (node 72) mesh/accessors/bufferViews/BIN identical to isolated extract (sha 3903bcae...); decoded local vertex error 0.0 mm; saved world-matrix error 0. Tooth section y=6: harmonic 10, clocking delta 0.0 deg (0.1 deg sampling), tip 6.083382 / root 4.291830 mm, same-clock radial rms 0.000209 / max 0.002557 mm. Supports: K000210/K000211 +2.750000 mm (rigid residuals 2.1e-6 / 6.6e-7 mm); housing bore-shoulder native +2.750000 mm with bounds-center delta 0. Floor exit y=13.78 mm. Spring K000180 5.4610 mm. 162 meshes scanned, 40 surface checks. Source hashes unchanged after run. All values equal the packet.
- classify_contacts: all 10 pairs, both wrong-pair controls, 18-row gear sections and spring reproduce the producer file to all reported digits (see contact-classification.json here).
- study-phase: byte-identical JSON.

## Key mechanical numbers (mm; numeric screen 0.02, export/decode 0.002, y-bin 0.05)
- ring K000211 matched pair: legacy max 0.008978 -> approved 0.008949 (delta -0.000029); unanimous 0.008949. Pre-existing CAD fit; unchanged by the +2.75 mm move.
- bearing K000210 matched pair: 0.000000 both, 0 triangle crossings.
- housing P000725: raw sampled max 3.687295 (approved) but 0 triangle crossings on both pairs, unanimous/corroborated inside depth 0. Diagnostics: witness r=6.01 mm at Y=9.989 vs housing bore min r=19.2746 mm at the same Y (approx 13.26 mm radial air), nearest-normal test outside (+3.510), open shell (12,242 legacy / 12,260 approved boundary edges at 1 um weld) so ray parity is not a valid solid test, 2/9 odd-parity rays stable across eps 1e-5..1e-3. Artifact confirmed; no housing interference introduced. Note: the --housing-only rerun was not executed because it triggers an EEVEE section render, outside this CPU-background scope; the artifact-side statistics were independently reproduced by the full classify rerun.
- planets P000247 x4, same rest pose: legacy 0.530294 / 0.813953 / 0.530195 / 0.813953 vs approved 0.530284 / 0.813818 / 0.530353 / 0.813813; |delta| <= 0.00016; gear-section depth delta band [-0.0012, +0.0001]. Inherited CAD tooth clocking; not new interference.
- ROTOR-1 0.330886 -> 0.330728; K000131 0.004216/0.006360 -> 0.004318/0.006459 (below screen, both poses). Spring 5.4609 / 5.4610.
- Study (4 planets x 13 poses; sun teeth 10, measured planet harmonic 12, kinematic candidate -10/12): rest radial-proxy gaps -0.0033 / -0.0003 / -0.0021 / -0.0002; 13-pose cycle minima -0.0478 / -0.0483 / -0.0478 / -0.0483 (below the 0.02 screen, so cycle_proxy_feasible=False); full-mesh unanimous witnesses approved shaft-in-planet -0.0778 / -0.0702; one planet_in_shaft sample -1.5015 (P000247-1.002) consistent with the inherited 0.53-0.81 mm static interpenetration. These are sampled radial proxies at discrete poses using the illustrative -10/12 ratio: not Euclidean penetration, not a swept volume, not canonical narrative display turns.

## Hash outcomes
- Live vs packet source-registry: 16/17 identical. Sole drift: src/scene/TorqueWrenchHero.tsx live 6a4f0691c57f vs packet ccd5a5f41a - a narrative-integration file under separate concurrent ownership; not consumed by any measurement gate (recorded only). All CAD/GLB/blend inputs match.
- Default.glb 8b07246cf857...; p001835-hobbed.glb 043c96283365...; k000210-k000211-moved.glb 17569c9a52bf...; p000725-modified.glb cc6edfefbe83...; input-shaft-assembly-parts-v1.blend 88d1ce4ac7ca... - unchanged before/after all three runs.
- geometry/reviewer-rerun/source-registry.json present, source_hashes_unchanged_after_run=true, zero hash mismatches vs packet registry (classify_contacts precondition satisfied).

## Uncertainty and limits
- 0.02 mm is a conservative numeric contact screen (0.002 mm export/decode allowance), not a proven CAD chord error or manufacturing tolerance; sample maxima do not upper-bound unsampled penetration; no dynamic-rotation or tolerance-clearance certification.
- Production shaper/hob parameters (module, pressure angle, starts, swept envelope) remain unresolved; camera clearance acceptance (C2) and the kinematics source correction are separately owned and out of scope here.
- Bearing race separability is not established from topology; the native mesh has unwelded split edges (282,998 raw; 363 after 1 um weld) to be repaired only in derived copies.
- SHIP here means: the frozen geometry and the honestly labeled illustrative assembled study may proceed under the limits above. It does not imply or invent full machine-fit certification.

Observed Blender version: 5.1.1 (hash b70da489d7f4). Proxy-serving evidence is recorded by the caller separately.