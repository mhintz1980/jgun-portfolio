# 35 — Single-gearbox sequence pause handoff (2026-10-19)

## State

Workspace: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench
Branch: torque-wrench/rebuild
HEAD: 0f7e0f4d91894ce79f06a1d211d56f2678a37305

The owner-confirmed single-gearbox reorder is implemented as a stable source candidate. Its exact bytes are frozen in the parent evidence checkpoint. Static checks, production build and an initial served forward/reverse journey pass are complete. Independent GLM/Opus review, final native pacing evidence, identity-mask pixel proof and owner visual acceptance remain.

This is not a commit, merge, deployment or owner acceptance. No source writer is active.

## Read first

1. output/playwright/jg038-single-gearbox-20261019/resume-brief.md — compact reading map and current state.
2. output/playwright/jg038-single-gearbox-20261019/parent-checkpoint.md — frozen-byte state, exact results, open gates and gotchas.
3. docs/torque-wrench-rebuild/34-single-gearbox-owner-sequence-2026-10-19.md — owner decisions and boundaries first; consult its checklist when updating status.
4. output/playwright/jg038-single-gearbox-20261019/opus-strategy.md — binding APPROVE WITH REFINEMENTS decision; sections 1-6 supersede the worker plan where they differ.
5. output/playwright/jg038-single-gearbox-20261019/worker-plan.md — read only architecture and registration/camera sections; its mechanism mapping was superseded.
6. docs/torque-wrench-rebuild/30-argon-t1-completion-and-handoff-2026-10-19.md and 26-owner-corrections-2026-10-18.md only for a specific ownership or historical-intent dispute.
7. C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md before any runtime measurement claim.

Do not broadly reread TODO/history. The sequence spec and parent checkpoint are complete for this task.

## What changed

The host sequence is now:

ring study and fullAfter 120-degree ring traverse -> opposite-side camera approach -> hold the isolation angle while neighbours fade to black around the actual P001835 source shaft -> shaft-only orbit to cutter view -> all 43 seconds of the existing shaft story -> retire study housing/neighbours/witnesses/supports while the shaft remains -> shaft-only return to the identical isolation angle -> atomic source-shaft swap -> restore the same source gearbox -> orbit/zoom/explode -> close.

Key source additions:

- src/scene/torque-wrench/JourneyDirector.ts/.test.ts
- src/scene/torque-wrench/JourneyCamera.ts/.test.ts
- src/scene/torque-wrench/shaftJourneyRegistration.ts/.test.ts
- src/scene/torque-wrench/inspectionProof.test.ts
- src/scene/rig/nodeRoles.test.ts

Key modified source:

- RuntimeWorld.tsx, inspectionIsolation.ts/.test.ts, inspectionProof.ts, beats.ts/.test.ts, scrollPacing.ts/.test.ts, directorRegistry.test.ts, torque-wrench.css
- shaftRuntime.ts/.test.ts — private presentation/registration controls, default behavior preserved
- nodeRoles.ts — P001835 render-selection provenance while retaining original drawing input
- MechanismDirector.ts — owner-selected C2_SEQUENCE='fullAfter'

The exact changed/new hashes and baseline hashes are:

- output/playwright/jg038-single-gearbox-20261019/worker-stable-hashes.json
- output/playwright/jg038-single-gearbox-20261019/pause-source-hashes.json
- output/playwright/jg038-single-gearbox-20261019/baseline/source-hashes.json
- output/playwright/jg038-single-gearbox-20261019/baseline/starting-dirty.patch

The baseline includes unrelated pre-existing dirty work. Never reset it or stage a broad diff. The 57-file protected check currently has zero changes.

## Verification completed

- Parent tsc on frozen bytes: exit 0.
- Worker final focused suite: 63 files / 464 tests PASS.
- Parent frozen focused suite (torque-wrench + inspection + nodeRoles): 60 files / 450 tests PASS.
- Production build: PASS in 6.78 s; build hash stability was checked.
- Real Default.glb proof: P001835's 131 primitives produce one rendered bucket with 11,347 vertices; parent/material/mechanics conservation passes.
- Drawing proof: pre/post position count, SHA-256 and bounds are exactly equal via journeyDrawingMeshes.
- Real shaft registration: axis and tooth clocking near zero; axial datum error 1.56e-6 mm; measured hull clearance 0.1716 m.
- Served journey: 86 forward+reverse samples per desktop and narrow, zero page/console errors; **at most one visible gearbox and at most one visible shaft**, with ring-only and shaft-only stages intentionally showing neither of the other subject; no source/study co-visibility; no gear/explode before .855; forward/reverse camera and subject exact. Requested .62 crossed the threshold on desktop but landed just below it on narrow; requested .845 landed just below on both aspects. Exact swap parity therefore still requires the pixel proof listed below.
- Isolation/return camera residual: 8.02e-8 desktop and 5.88e-9 narrow. analyze-journey.py labels it failure only because its threshold is 1e-10; review this float residual, do not describe it as a visible jump.
- The parent preview was stopped after capture; no 5321 listener should be assumed in the next session.

Evidence:

- output/playwright/jg038-single-gearbox-20261019/pause-tests.log
- output/playwright/jg038-single-gearbox-20261019/pause-tsc-final.log
- output/playwright/jg038-single-gearbox-20261019/pause-build.log
- output/playwright/jg038-single-gearbox-20261019/worker-real-asset.json
- output/playwright/jg038-single-gearbox-20261019/worker-real-tests.log
- output/playwright/jg038-single-gearbox-20261019/drawing-census-before.json
- output/playwright/jg038-single-gearbox-20261019/drawing-census-current.json
- output/playwright/jg038-single-gearbox-20261019/journey-proof.json
- output/playwright/jg038-single-gearbox-20261019/journey-analysis.json
- output/playwright/jg038-single-gearbox-20261019/*.png
- output/playwright/jg038-single-gearbox-20261019/pause-git-status.txt
- output/playwright/jg038-single-gearbox-20261019/pause-diff-stat.txt

## Remaining work in order

1. Recheck worker-stable hashes against live source. No source writer is active; rehash before review.
2. Run the independent GLM/High adversarial review of source + evidence. Prompt: output/playwright/jg038-single-gearbox-20261019/glm-review-prompt.md. Use review-request.py if needed; it records hashes and receipts. Do not accept delivery prose as proof.
3. Opus/High final arbitration, no more than two review rounds.
4. Build the final evidence from the same reviewed bytes and restart 5321. Capture identity-mask/pixel proof at .62 and .845 shaft swaps, .585-.60 fade-out and .845-.855 fade-in. Verify camera I and registry alignment visually and instrumentally.
5. Recompute and record ring >=2x and relocated T6-C native-viewport bounds at 1440x900 and 390x844 with the final host pacing. Existing focused unit tests pass; final served metric table remains.
6. Review manual playback open/close and direct seek/reverse on served build.
7. Owner review at 5281 only after reviewer/Opus disposition. Reviewer/technical PASS is not owner acceptance.
8. Stage/commit only session-owned paths after owner direction; preserve unrelated dirty drift.

## Gotchas

- Journey registration: H = model.matrixWorld * measured source displacement * inverse(narrativeModelToStudy()). Apply once to the study root and once to the canonical camera. Do not append another center/CAD rotation or move lights twice.
- Camera I during the final explosion uses the separate assembled-transfer registration (cameraRegistration), not the live source pose. This prevents the returning shaft from pulling the camera during explosion.
- Canonical clipping planes are restored before every shaft apply and world-transformed once after it. Do not compound them on seeks.
- Source and study shafts/gearboxes are atomic visibility swaps. No translucent duplicate assembly.
- P001835's original node has no rendered geometry after consolidation. Use the selectable bucket. Drawing cache hashes vertex order; use model.userData.journeyDrawingMeshes for snapshotDrawing.
- The private shaft presentation is default-off. Do not change shared kinematics, camera or schedule to make only this page behave.
- The worker ended exit 1 before worker-delivery.md. Use parent-checkpoint.md and worker-stable-hashes.json; there is no stable worker delivery note.
- Existing 5321 process may be stale. Stopping its cmd wrapper does not stop the node listener; find the node process owning 5321, stop it after rebuild, restart with npm run preview -- --host localhost --port 5321 --strictPort.
- Vite preview binds localhost; use http://localhost:5321. Never touch or rebuild 5281.
- Full journey-proof takes about four minutes (172 samples). journey-analysis.py currently emits a false failure for the 8e-8 isolation pose residual.
- fullAfter replaced preview12. The old T5 red-camera G1 result remains historical; red exposure on the full traverse still requires final camera/pixel review.
- T7's old split-versus-morph question is superseded by the owner's explicit one-gearbox rule.
- C is technically accepted by Opus, but C evidence was captured on the pre-single-gearbox host. Under this new host, its clocks/limits still require final relocated verification.

## Skills to use next

- Parent orchestration: C:/Users/Markimus/.codex/skills/orchestration/SKILL.md
- Disjoint ownership/evidence: C:/Users/Markimus/.codex/skills/parallel-workstreams/SKILL.md
- Model/seat routing: C:/Users/Markimus/.codex/skills/codex-tiers/SKILL.md
- Runtime claims: C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md
- Rig/part identity and P001835: C:/Users/Markimus/.codex/skills/cad-scene-graph-rigging/SKILL.md
- R3F/scroll synchronization: C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md
- ScrollTrigger reference: C:/Users/Markimus/.codex/skills/gsap-scrolltrigger/SKILL.md
- Browser capture: C:/Users/Markimus/.codex/skills/playwright/SKILL.md
- Motion critique after implementation: C:/Users/Markimus/.agents/skills/review-animations/SKILL.md and improve-animations/SKILL.md

## Helper scripts / receipts

- output/playwright/jg038-single-gearbox-20261019/launch-worker.py — isolated single worker launcher with request/model log.
- output/playwright/jg038-single-gearbox-20261019/review-request.py — read-only GLM/Opus request with inputs hash manifest and receipt.
- output/playwright/jg038-followon-20261019/opus-decision.py — existing Opus 5.5/High receipt helper.
- output/playwright/jg038-single-gearbox-20261019/journey-proof.mjs — served sample/screenshot capture.
- output/playwright/jg038-single-gearbox-20261019/analyze-journey.py — structural journey checks.

The local OpenAI-compatible proxy was reachable at http://127.0.0.1:10100 during this session. Recheck before dispatch; do not claim a served model without the receipt/proxy evidence.

## Handoff recheck (2026-10-19)

- All 20 worker-stable hashes and all 279 pause-snapshot hashes match the live tree; `verify-preservation.py` reports 57 protected files and zero violations. No source or protected asset changed between pause and this recheck.
- `npx tsc --noEmit` exited 0. The focused suite re-ran successfully at 60 files / 450 tests; `npm run build` passed in 7.60 s. The pause build remains the recorded 6.78 s run.
- `journey-proof.json` was re-parsed: 86 samples per aspect, zero errors, never more than one visible gearbox or one shaft, with the expected ring-only/shaft-only gaps. The `analyze-journey.py` isolation residual remains 8.02e-8 desktop / 5.88e-9 narrow. Requested .62 crossed on desktop but landed just below on narrow; requested .845 landed just below on both aspects because of scroll rounding. This is why exact pixel parity at both swaps stays open.
- No5321 listener was present at recheck. Nothing is staged. The handoff requires a fresh build/restart before served work.

## Ready-to-paste prompt

Use docs/torque-wrench-rebuild/35-START-NEXT-SESSION-PROMPT-2026-10-19.txt.

