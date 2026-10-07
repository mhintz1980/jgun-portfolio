# Leaf spec: G1 runtime lifecycle verifier (producer)

Objective: write and run an independent real-browser verifier for the shared inspection lifecycle as integrated today (ring story only; the shaft story has no runtime yet and must not be faked). It proves or disproves gates V1-V5 below with same-session telemetry and command output.

Files you own (create/modify only these): scripts/verify-manufacturing-inspection.mjs, project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle/ (outputs), project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/runtime.md (check boxes only with real evidence lines). Do not modify src/, existing scripts (including scripts/verify-ring-inspection.mjs), public/, or other evidence. Other sessions' staged/unstaged changes exist: never revert or stage anything; no git operations. Do not read TODO.md or queue docs: this spec is complete. If you need a probe field that does not exist, do NOT add it to src; record it as a missing-probe defect with file:line in your report and in the gates file evidence.

Gates (verbatim):
# Gates: Independent inspection runtime verification

Scope: Real-browser lifecycle and ring evidence against the shared integration. Do not edit scene/store/shell ownership.

- [ ] V1: Negative-priority sample and camera consume the same frame/time; paused camera is stable and compile/warm readiness precedes playback.
  EVIDENCE: pending
- [ ] V2: Hidden/visible preserves manual pause; direct seek and replay remain deterministic, endpoint ownership holds until Return.
  EVIDENCE: pending
- [ ] V3: Loading exit/re-entry, stale completion and error/retry restore exact saved context, scroll and focus in desktop and narrow entry modes.
  EVIDENCE: pending
- [ ] V4: Five warmed cycles show no monotonic owned-resource growth; reduced/poster states avoid CAD/tool fetches, context loss exits once.
  EVIDENCE: pending
- [ ] V5: Ring actual contact, OD-only relief, withdrawal-before-fade and finished black hold have same-session telemetry and nonblank rendered evidence.
  EVIDENCE: pending
- [ ] V6: Parent reruns the script and different-provider review sees actual implementation/evidence; discrepancies remain failures rather than weakened checks.
  EVIDENCE: pending



Read for interfaces: project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/lifecycle-contract.md sections 9-11 (V1-V11 definitions), src/state/inspectionStore.ts (window.__inspection telemetry, lifecycle functions), src/scene/inspection/InspectionScene.tsx (driver at useFrame priority -10, integration telemetry fields sampledTime/sampleStamp/cameraSampleTime/cameraSampleStamp/renderOwned/restoreObserved/restoreProjectionError/restoreStateError/compileReady/warmReady), src/scene/inspection/ringRuntime.ts and src/scene/CameraRig.tsx for proof hooks (window.__inspectionProof seek/mask/progress etc.), src/components/RingInspection.tsx for DOM labels, and scripts/verify-ring-inspection.mjs for the established Playwright setup (chromium channel chrome, --use-angle=d3d11, background throttling disabled, ?chapter=1&inspectionProof=1, trigger button 'Inspect the finish', loseContext helper). Optional skill references: C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md.

Cases to implement (desktop 1440x960 and narrow 390x844 unless stated):
1. Ordering/readiness (V1): after entry, record status transitions (loading -> compiling -> ready) and that Play is unavailable before ready; renderer program count (window.__threeRenderer?.info.programs?.length or equivalent; discover what is exposed) does not grow over 60 frames after ready; while paused, camera matrixWorld identical across 3 frames; sampledTime equals cameraSampleTime each frame you read.
2. Pause/hidden (V2): pause, override document.visibilityState to hidden + dispatch visibilitychange, wait 2 s, visible again: time unchanged and still paused. Play, hide 3 s, show: time advance below 0.1 s. Direct seek to several times then compare with continuous play digest where available; seek to duration holds active with Return available, no auto-exit.
3. Restore (V3): from blueprint and exploded entries, capture scrollY, camera matrixWorld, materialMode/stage telemetry, scene background/fog/env/light visibility (via window.__threeScene if exposed), then enter, play partway, Return; compare (camera within 1e-6, others exact); focus returns to trigger. Same via Escape. Delayed-load Return: route-hold the knurling-tool.glb, enter, Return immediately, re-enter, then release the held response: no duplicate root attached, camera unchanged, telemetry session equals the new epoch, zero console errors. Error/retry: abort the tool request so loading fails, verify error status, Return works, Try again works.
4. Census (V4): after warm-up, five enter/play 1 s/Return cycles; record renderer.info.memory geometries/textures and inspection resources telemetry per cycle; fail on monotonic growth across all five. Reduced motion and poster (WebGL2 undefined) make no .glb tool requests. loseContext mid-play: exit happens once, dialog closes, no console errors other than the expected context-lost warning (record it).
5. Ring rendering (V5): at contact time (read the authored window from telemetry or timeline exports rather than hard-coding stale values), black-finish hold and end, take screenshots and compute nonblank pixel statistics on the canvas region; telemetry rollerClearance at contact below 2e-5 m; tool invisible once clearance reached and finish held.

Run against the running dev server: node scripts/verify-manufacturing-inspection.mjs --url=http://localhost:5199 --out=project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle. Write report.json with per-case pass/failures/errors and a short README.md. Never weaken a check to pass; report real defects with file:line.

Report back: changed paths, command, per-case results, and concrete defects.
REASONING: high
