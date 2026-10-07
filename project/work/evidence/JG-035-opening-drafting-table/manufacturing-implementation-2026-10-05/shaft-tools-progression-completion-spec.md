# Leaf spec: complete and verify shaft tools + progression (producer, takeover)

Context: a previous producer implemented the base spec project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shaft-tools-progression-spec.md (read it fully: objective, files, requirements 1-4 and verification all still apply) and stopped from a provider rate limit before final verification and before writing the gate file. Existing files: scripts/manufacturing/cutter_outline.mjs, src/scene/inspection/shaft/{cutterOutline.json,toolSpec.ts,tools.ts,tools.test.ts,progression.ts,progression.test.ts}. Current state: npx vitest run src/scene/inspection/shaft passes and npm run typecheck is clean.

Your job: audit every numbered requirement of the base spec against the actual code, fix gaps or defects you find, run the verification, and write the gate file. Specifically confirm with evidence:
- node scripts/manufacturing/cutter_outline.mjs runs, regenerates cutterOutline.json deterministically (same sha256 on two runs), tips clamp at 11.2032, roots at 15.5 - 6.0834 - 0.15, stock 0.005, <=360 points per tooth, and the envelope method uses roll steps <=0.02 deg and bins <=0.05 deg.
- toolSpec.ts constants equal project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/clearance-v4/report.json (note the certified hob after re-review: R 5.87, lead angle 5.5587 deg, infeed yc -4.195); a test enforces it by reading report.json.
- tools.ts triangle counts: cutter <= 12k, hob <= 20k, asserted in tests; geometry in metres; dispose releases geometries.
- progression.ts: final shaping state leaves samples unchanged; depth 0 puts face-band samples at OD and leaves the groove unchanged; hobbing at final yc reproduces approved floor within 0.01 mm; monotonic; allocation-free per call; shader patch markers present; stress overlay uniforms present.
Files you own: the six files above, plus project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/shaft-tools-progression.md (create: A1 outline derived and bounded, A2 constants equal report, A3 props within triangle budgets, A4 progression law tests, A5 typecheck/tests pass; check a box only with a real EVIDENCE line containing command output). Do not edit any other file. Other agents are working in parallel on other files: never revert or stage anything; no git operations. Do not read TODO.md or queue docs.

Verification: node scripts/manufacturing/cutter_outline.mjs (twice, compare sha256); npx vitest run src/scene/inspection/shaft; npm run typecheck.
Final message: changed paths, what you fixed and why, commands with results, anything unresolved.
REASONING: high
