OBJECTIVE
Fix the confirmed 390x844 material-card collision in the shaft camera and finish independent asset/camera evidence reconciliation. Current decoded critical shaft action y3.2..14.2 projects x55.85..306.64,y193.69..516.59 while actual card column is x31.19..358.81,y156..339.97 (4140/C300) or156..293.78 (4340); 1522/1092 actual vertices intersect. Preserve desktop and all process laws.

FILES
src/scene/inspection/shaft/camera.ts
src/scene/inspection/shaft/camera.test.ts
project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/blockout-2026-10-06/
project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/assets/acceptance-2026-10-06/
project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/camera.md
project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/core-assets.md

INTERFACES
Read material-region-report.json, material-camera-candidates.json, candidate_material_camera.mjs, existing decoded asset reports and current camera/source. Measured candidate fovNarrow18.5,tgtNarrow[0,8.5,1] at t15/22.6 gives critical action x124.48..251.58,y352.46..516.14: card clearance12.49px, footer start529.5 clearance13.36px. Apply only after independently reproducing projection. Actual portal CSS places cards near top156px, contrary to old tests' bottom-band assumption. Tests must protect real measured card/header/footer exclusion without weakening existing continuity, stable material hold, safe frame, final-card, determinism or exact follow law.

CONSTRAINTS
You are not alone; do not revert others. No CSS/DOM/runtime/asset/CAD/source changes outside listed paths; no git or build/preview restart. Static worker owns RingInspection/StaticShaftStory/ShaftStoryLayer.css/public fallback. Verifier worker owns dedicated script/runtime/shaft. Self-contained spec, skip TODO/queue. Read C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md, r3f-scroll-performance-guard/SKILL.md, cad-scene-graph-rigging/SKILL.md, asset-and-bundle-hygiene/SKILL.md before domains. Preserve immutable sources and exactly one +2.75mm support shift; no ladder/process-law changes. Follow-fix independent review is SHIP; do not redo/falsify it. Existing D1-D3 gate evidence references old seven-node v2 whereas D5/current v3 has eight nodes. Reconcile only with independently decoded/hash-checked evidence; prior asset reports show both tiers PASS, but final README/gates are incomplete after429. Reclassify initial '-dom-overlay-bounds.png' capture appropriately; clean rasters require hidden DOM and same-session source proof. Parent rerun of clearance is camera/clearance-v4-parent-2026-10-06/report.json, CERTIFIED24/24, deterministic match except time/output path. Do not claim authentic production tooling. Do CPU/source/test work first; parent later rebuilds preview for actual current mobile framing proof. Clearly report ready/source diff and which runtime gates still await rebuilt proof rather than marking C2 prematurely. No unsolicited unrelated skill hygiene mutation.

VERIFICATION
npm test -- --run src/scene/inspection/shaft/camera.test.ts --maxWorkers=2
EXPECT: all assertions pass with unchanged timeouts; add meaningful exclusion regression using measured top card/footer bounds. Also npm run typecheck and independent projection check. Actual projected/rendered C2 acceptance needs parent rebuilt preview and same-session target proof. Assets acceptance must reference current eight-node hashes and metrics.

REASONING: high
