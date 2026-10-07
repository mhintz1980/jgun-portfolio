# Leaf spec: G0 tool-envelope clearance v3 (producer)

Objective: produce a certifiable, reproducible clearance result for an illustrative disc shaper (grooved legacy shaft) and an illustrative hob (approved revised shaft), or an explicit, honest UNRESOLVED with the exact failing pair and pose. Accepted CAD is immutable; candidate tool dimensions may change, the shaft may not.

Files you own (create/modify only these):
- scripts/manufacturing/tool_clearance.py (new)
- project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/clearance-v3/ (new folder: outputs, logs, README.md)
- project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/camera.md (check C1 and C3 only, with evidence lines; leave C2/C4 as they are)
Do not modify camera/clearance.py, profile_study.py, blockout.py or any other existing evidence; do not touch src/, public/, Default.glb or CAD sources. Do not read TODO.md or queue docs: this spec is complete. No git operations.

Inputs (read-only): C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/input-shaft-assembly-parts-v1.blend (objects SHAFT_P001835_ORIG = legacy grooved, SHAFT_P001835_HOBBED_NEW = approved), and the hashes in project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/geometry/measurement-summary.json / source-registry.json. Read project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/method-review.md (the review you must satisfy), project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/geometry/FINDINGS.md, project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/tool-conventions.md, project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/profile-study.log (MATCHED_SHAPER N=20, pitch radius 15.5 candidate) and camera/clearance.py only for conventions. Blender: "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --factory-startup --python-exit-code 1 --python scripts/manufacturing/tool_clearance.py. Verify source SHA-256 before and after; fail if changed. Output only under camera/clearance-v3/.

Measured facts to use: shaft-local Y is the axis; 10 teeth, 36 deg pitch; tip r 6.0834, root r 4.2918; face start y 3.1749, functional face end y 9.5249. Legacy grooved shaft: relief groove floor r about 4.11-4.22 near y 10.92, journal r about 6.31-6.32 from about y 13.78. Approved: tooth-space floor ramps from root at y 9.525 to r 6.074 at y 13.78 (the authored 6 mm hob construction radius); journal r about 6.32 from y 14.18.

Required method (from method-review.md):
1. Work on a derived welded copy (1 um weld, in memory); sources untouched. Inside tests by winding number or 3-ray unanimous on the welded copy; report unsigned distance and containment separately. No nearest-normal sign on open shells.
2. Sections: exact plane-triangle polylines at y = 3.5, 6, 9 (10-fold averaged); confirm constant to about 0.003 mm.
3. Shaper (legacy shaft): derive the cutter flank from the meshing equation (contact where the profile normal passes the pitch point), N tool teeth with signed ratio -N/10 external generating; choose pitch radius above max |q.t| feasibility bound; Euclidean 2D distance (not radial gap). Stroke: cutter face plane travels axially from outside the face start through the functional face and into the legacy groove; report overtravel into groove, cutter-tip-to-groove-floor clearance, cutter-face-to-journal-step clearance at stroke end, relieved return offset, and infeed path. Include hub/clamp/arbor as simple cylinders sized to clear (state dimensions). Certify min_samples d - e_total >= margin with e_total = e_cad + e_tool + e_pose + e_grid computed per method-review, subdividing where needed.
4. Hob (approved shaft): single-start illustrative hob with outside radius chosen so that its swept envelope reproduces the approved ramp (fit the full floor profile y 9.525..13.78 vs y; report fitted R and residual). Use atan lead angle. Contact allowed only on the generated ramp within tolerance; require positive clearance (minus e_total) on the journal side from y 14.18, plus collars/arbor on the tilted axis and through infeed, feed, runout and withdrawal.
5. Out-of-domain samples must count as failures, never as +inf safe.
6. Output clearance-v3/report.json with: inputs+hashes, tool parameters, per pair minimum distance, pose, part names, e_total breakdown, margin, PASS/FAIL per pair, and an overall verdict CERTIFIED / UNRESOLVED; plus README.md (one page) and the exact command. Also a sanity check that the hob reproduces the authored ramp.

Verification: the command above exits 0 and prints a final line starting G0_CLEARANCE_V3; report.json parses; source hashes unchanged. Rerun once to confirm determinism (identical report minus timestamps).

Report back: changed paths, the command, verdict per pair with numbers, and anything unresolved. Never weaken a criterion to pass; an honest UNRESOLVED is acceptable.
REASONING: max
