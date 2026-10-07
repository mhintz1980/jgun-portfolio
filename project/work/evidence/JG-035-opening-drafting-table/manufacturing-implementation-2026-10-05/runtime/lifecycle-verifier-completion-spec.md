# Leaf spec: G1 lifecycle verifier completion (producer)

Context: scripts/verify-manufacturing-inspection.mjs was written by a previous producer to the base spec project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle-verifier-spec.md (read it: its objective, ownership rules, gates and cases all still apply) and stopped mid-iteration (provider limit). Its last report project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle/report.json mixes several partial runs (duplicate case names). Finish the verifier, run it cleanly, and report.

Parent findings from that partial report, to address:
1. window.__threeRenderer now exists (added by the parent next to __threeCamera in src/scene/SceneCanvas.tsx onCreated). Use renderer.info.programs.length and renderer.info.memory directly for V1/V4; drop or keep the createProgram counter only as a cross-check.
2. ring-rendering failed with "Cannot read properties of undefined (reading 'seek')": window.__inspectionProof is installed only after the ring runtime loads with ?inspectionProof=1; wait for window.__inspection?.loaded && window.__inspectionProof exactly as scripts/verify-ring-inspection.mjs does (that script passes 7/7 against the same server today; reuse its waits, trigger focus+Enter entry, mode buttons /BLUEPRINT WIREFRAME/ and /EXPLODED ASSEMBLY/, seek helper).
3. restore-desktop failed "materialMode blueprint -> undefined": find where material mode/stage state actually lives (grep src/state for materialMode and window.__ exposures such as __telemetry, __scroll, __rig) and read it from the real source; do not compare a field that is not exposed. If a needed field is truly not exposed, record a missing-probe defect with file:line, not a failure of the app.
4. Several timeouts waiting for Play/Pause/Return: the dialog's buttons are 'Play sequence', 'Pause', 'Replay', '← Return to narrative' (RingInspection.tsx); Play is disabled until status is ready. Wait for window.__inspection.status === 'ready' before clicking.
5. Each run must write a fresh report.json (no appending across runs) with one entry per case.

Ordering proof (important): while playing, on several consecutive frames read window.__inspection sampledTime/sampleStamp and cameraSampleTime/cameraSampleStamp in the same requestAnimationFrame callback after render; equality on every sampled frame proves the -10 driver ran before CameraRig in the same frame. Record the samples.

Files you own: scripts/verify-manufacturing-inspection.mjs, project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle/ (outputs; you may delete the stale report.json and stale PNGs there), project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/runtime.md (check V1-V5 only with real evidence). Do not modify src/ or any other script. No git operations. Do not read TODO.md or queue docs.

Server: Vite dev at http://localhost:5199 (running; do not restart it). Command: node scripts/verify-manufacturing-inspection.mjs --url=http://localhost:5199 --out=project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle . Run it to completion at least twice; results must agree.

Report back: changed paths, command, per-case pass/fail with the deciding numbers, and concrete app defects (file:line) separated from harness limitations. Never weaken a check to pass.
REASONING: high
