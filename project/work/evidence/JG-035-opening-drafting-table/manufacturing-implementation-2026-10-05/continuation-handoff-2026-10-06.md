# JG-035 manufacturing implementation — recovered session handoff

Recovered October 6, 2026, America/New_York. The October 5 implementation session produced substantial working code and evidence. **Resume the implementation and its verification; do not restart from the older planning-only handoff.** This is a saved work-in-progress checkpoint, not final runtime/owner acceptance.

> **Final documentation closeout, 2026-10-06/07.** [final-docs-release.md](final-docs-release.md) released this seat; every parent execution named there has now finished — [final-docs-completed-results.md](final-docs-completed-results.md) is the completed-results record and [final-docs-closeout-glm-report.md](final-docs-closeout-glm-report.md) is this seat's closeout (the earlier [final-docs-glm-report.md](final-docs-glm-report.md) preparation report is preserved as historical). Read the current-state section below first; the recovery narrative underneath is preserved chronologically and describes an earlier state.

## Current verified state — final documentation reconciliation

All results below are read from the named records, not from earlier status prose. Root [GATES.md](../../../../../GATES.md) shows G0–G5 checked and G6 open.

**Owner policy (resolved).** Mark selected **posters throughout** for reduced motion: [reduced-motion-owner-decision-2026-10-06.md](reduced-motion-owner-decision-2026-10-06.md). Reduced-motion visitors receive static DOM narrative/posters and static inspection rasters; narrative CAD downloads and narrative WebGL/canvas mounting are excluded. Ordinary non-reduced full/lite behavior and the manufacturing motion contracts are unchanged. The old unanswered V4 policy is closed; the earlier 12/14 lifecycle failures stay historical with no assertion waiver.

**Current build.** Parent tests 43 files / 445 PASS ([posters-policy-tests-2026-10-06.log](posters-policy-tests-2026-10-06.log)); production build 703 modules, `index-CMn9ggEH.js` / `SceneCanvas-yQrQvntO.js` ([posters-policy-build-2026-10-06.log](posters-policy-build-2026-10-06.log)); hidden preview restarted after the build, PID 16784, `localhost:4173` HTTP 200.

**Opening (current full roster).** [runtime/opening-posters-policy-parent/summary.json](runtime/opening-posters-policy-parent/summary.json), finished 2026-10-07T00:07:08Z: exit 1, **5/6 cases PASS**. Desktop-full fails 110 expectations ("expected full tier … got lite" across forward/reverse/pinned) after the effective tier becomes lite; narrow, both reduced and both lite cases pass. All 6 cases have 0 console/page errors and 0 request failures. Both reduced cases directly record 0 CAD requests, 0 canvas elements, no connected/drawing GL context and stable poster/native-scroll/navigation. Non-reduced full/lite thresholds are unchanged. The cause is unestablished — no waiver and no machine-capacity/regression diagnosis; a hardware-only matching headless probe identifies AMD Radeon 780M/D3D11 ([runtime/parent-headless-renderer-info.json](runtime/parent-headless-renderer-info.json)) without establishing why full degrades. Current-build contract checks: B1/B2 31/31 PASS ([posters-policy-b1b2-2026-10-06.log](posters-policy-b1b2-2026-10-06.log)); station2 contract PASS, 2,671,600 bytes, 7 roots/7 anchors ([posters-policy-station2-2026-10-06.log](posters-policy-station2-2026-10-06.log)).

**Lifecycle.** Unchanged verifier, current build: [runtime/lifecycle/posters-policy-parent/report.json](runtime/lifecycle/posters-policy-parent/report.json) — exit 0, **14/14 cases PASS, failures 0**, V1–V5 both widths. V4 now proves zero CAD requests in reduced startup and poster, constant warmed counts, and one real context-loss exit/dispose. V6 is closed from parent execution plus independent verifier/source reviews; [gates/runtime.md](gates/runtime.md) has V1–V6 checked. Mid-session toggling cannot revoke past downloads (useGLTF caches previously loaded assets).

**Shaft.** Manufacturing sources unchanged by the policy; parent rechecked all 17 source hashes and verifier `d26d491a…` against the paired prior reports: [runtime/shaft/contact-parent-run-1/report.json](runtime/shaft/contact-parent-run-1/report.json) and [contact-parent-run-2/report.json](runtime/shaft/contact-parent-run-2/report.json), each 16 cases, 12/12 gates, zero defects/harness exceptions; actual tiers desktop lite / narrow full. Those runs are **prior-build provenance** — they were not re-executed on the posters-policy build; the new policy/build is additional lifecycle evidence. Contact source `2f78847d…`; causal oracle 249,601 samples / 40 valid gains / 0 failures retained.

**Shaft, current build.** [runtime/shaft/posters-policy-parent/report.json](runtime/shaft/posters-policy-parent/report.json): exit 0, 16 cases, 12/12 S1–S8/N1–N4 gates, 0 defects, 0 harness limitations; all 17 recorded source hashes recompute equal against live source, and the actual creation/fetch variant is **FULL at both desktop and narrow**, with 13 completed-frame GPU/projection captures per viewport and 0 ordinary-case errors. This adds current-build FULL/FULL evidence; keep the prior paired runs as prior-build desktop-LITE/narrow-FULL coverage and do not relabel them.

**Ring and static.** [runtime/ring-contact-final/report.json](runtime/ring-contact-final/report.json) is 7/7 PASS, errors 0 (prior build); current-build lifecycle V5 proves ring rendering both widths. The 16 static WEBPs are unchanged; the full old/new 8-time CPU render-state equality and 16/16 PNG/WEBP hash audit ([static-shaft-2026-10-06/final-provenance/glm-report.md](static-shaft-2026-10-06/final-provenance/glm-report.md)) supports reuse and is **not** a new rendered-execution claim. Current-build static proof now exists: [runtime/static-posters-policy-parent/browser-report.json](runtime/static-posters-policy-parent/browser-report.json) — exit 0, **4/4 PASS**, failures/errors 0, every case with `glbRequests=[]` and zero narrative/inspection CAD requests; six visual parts, exact copy, 44 px controls, overflow/focus/keyboard/Return/Escape and genuine rasters pass. That is current DOM/raster-display evidence, not a regeneration of the 16 WEBPs; the copied historical checker retains old scope prose describing the earlier static-3D policy, while its actual request arrays are zero.

**Mechanical and core assets.** Final independent GLM G0 rerun/review SHIP for measurement implementation and the illustrative assembled study within the named inherited/sampled proxy limits — not machine-fit certification ([mechanical-review/final-glm-review.md](mechanical-review/final-glm-review.md)). Core export D4 independent SHIP; D1–D5 checked ([gates/core-assets.md](gates/core-assets.md)). The lite 0.053195 mm sampled-surface diagnostic remains failed/report-only with no waiver.

**Reviews.** [reduced-motion-posters-independent-review.md](reduced-motion-posters-independent-review.md): SHIP, now accepted on **direct browser observables** — the opening roster's reduced cases record `cadRequests: []`, `canvases: []`, harness GL contexts `connected: false` with zero draws, the truthful reduced-motion poster line, DOM station nav and no Lenis; the earlier code-inference caveat is closed. Final Fable seat exhausted HTTP429 without a verdict; the GLM final integration advisory ([final-glm-integration-review.md](final-glm-integration-review.md), SHIP at the earlier technical checkpoint) is an explicit substitution. Serving receipts are parent-owned.

## Pending and open

- **G6 is open solely for the required full opening acceptance.** The current full roster finished 5/6: desktop-full fails 110 expectations after the effective tier becomes lite; the cause is unestablished, and neither a waiver nor a machine-capacity/regression diagnosis is claimed. The prior headless 5/6 roster and headed failures remain historical records; headless is not a proven sole-cause fix.
- **Owner visual acceptance remains separate** and open.
- The lite 0.053195 mm core-surface diagnostic stays failed/report-only with no waiver. Protected `Default.glb` / `m249-transformed.glb` / `msp-enclosure.glb` hashes are unchanged. No commit, staging, push or deployment has occurred; the mixed index is unchanged (preservation check SHA-256 `fd9a32bf…`, rechecked by the parent at closeout) and `.scratch/` is never staged.

## Next action

Targeted opening performance diagnosis under the preserved policy and full-tier expectation, followed by owner visual review; rerunning an unchanged failure or waiving the full tier is not acceptance. A read-only rerun needs no rebuild when neither source nor `dist` changes; the `:4173` preview must be restarted after every actual rebuild. Commands are in "Existing commands" below.

## Where to resume

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`.

1. Follow `AGENTS.md`, `TODO.md`, `project/README.md`, and the measured animation spec session-start requirements.
2. Read `docs/jgun-manufacturing-inspection-plan.md` and `project/context/owner-specs/manufacturing-inspection-storyline-2026-10-05.md` for the accepted requirements.
3. Read **`project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/PLAN.md`**, its reconciled Tree And State table, latest Status Log, and `gates/`. The execution table and review-ledger acceptance summary were corrected on October 6; the older planning handoff is now explicitly historical and redirects here. Root `GATES.md` still leaves G0–G6 unchecked; that means overall acceptance is unfinished, not that implementation is absent.
4. Read the latest reviews/fix reports named below before deciding the next edit. Preserve all staged, unstaged, and untracked work.

## Recovery and preservation

Recovery directory: `C:/Users/Markimus/Documents/Codex/recovery/jgun-portfolio-20261006-030424/`.

It contains copies of changed/untracked non-ignored worktree files, binary-capable staged and unstaged patches, status/path inventories and a SHA-256 manifest. Accepted/exploratory CAD under `C:/Projects/CAD/jgun-input-shaft-hobbed/` is copied separately under `external-cad/`. The isolated `.scratch/knurling-final-review.md` review is preserved under `scratch-review/`; `.scratch/` is never staged or committed. See the recovery README and manifest for exact completed counts and checks.

Snapshot base: branch `codex/jg033-signature-shot`, HEAD `420198a0f818ef44fcf4428dd29ad9f7601fac69` (`feat(JG-035): add rigged knurling tool and implementation handoff`). The starting tree contained extensive older staged opening work plus newer manufacturing implementation. Recovery did not stage, commit, push, reset, or deploy application changes. Restore copies/patches only in a separate checkout at the recorded base; current files already contain the work.

The original productive session is local thread `01a10b57-ee57-7511-b487-47ab4e142b49`; the app's recent-thread list omitted it, so the local rollout was recovered directly:

- `C:/Users/Markimus/.codex/sessions/2026/10/05/rollout-2026-10-05T05-14-34-01a10b57-ee57-7511-b487-47ab4e142b49.jsonl`
- Continuation: `C:/Users/Markimus/.codex/sessions/2026/10/06/rollout-2026-10-06T00-37-40-01a10b57-ee57-7511-b487-47ab4e142b49_01a10f80-c890-7782-b6d1-8974d2e2d133.jsonl`
- G0 measurement worker: `C:/Users/Markimus/.codex/sessions/2026/10/05/rollout-2026-10-05T05-21-16-01a10b5e-0fe9-75a2-b2eb-22d6d8a58c89.jsonl`

The continuation contains the owner's request to reach a safe pause, write a handoff and commit. The recovery snapshot preserves the mixed tree without sweeping older staged changes into a commit. Determine a concrete manufacturing-owned commit set from `baseline.md`, the ownership contract and diffs before committing; do not use `git add .`, `-A`, or `-u`.

## Implemented progress and evidence

All paths below are relative to `project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/` unless prefixed with `src/`, `scripts/`, or `public/`.

| Area | Saved result | Evidence and remaining limit |
|---|---|---|
| G0 geometry | Hash-pinned occurrence/datum registry, source correspondence, measured support shift, neighbour classification | `geometry/`, `mechanical-review/housing-resolution.md`, `gates/assets.md`; whole G0 remains open |
| Tool clearance | Meridian v4 reports CERTIFIED 24/24 and deterministic reruns; supersedes invalid v3 | `camera/clearance-v4/`, `scripts/manufacturing/tool_clearance_meridian.py`; read residuals/response before mechanical acceptance |
| Study assets | Full/lite derived bundles now have eight named nodes, including legacy and approved housing witnesses | `assets/core-assets-report-v3.json`, `gates/core-assets.md`, `public/models/manufacturing-core-{full,lite}.glb`; D4 independent acceptance remains open |
| Shared lifecycle | Shell and narrative render restore implemented; double-recorded light restoration defect fixed | `gates/shell.md`, `src/scene/inspection/renderLease.ts`, `runtime/ring-preview-1/report.json` |
| Ring inspection | Contact/progression/withdrawal refinements; GLM sampler review SHIP; integrated and production ring checks 7/7 | `ring/independent-review-glm.md`, `runtime/ring-integrated-1/`, `runtime/ring-preview-1/`; reconcile stale gate checkboxes |
| Shaft script and tooling | Material cards/FAILED stamps, transcript, stock/tool progression implemented | `gates/shaft-script.md`, `gates/shaft-tools-progression.md`, `shaft-tools-progression-review-glm.md`; latter review SHIP |
| Shaft runtime | Factory/runtime integrated; cutter offset, previous-pass state, hob disposal and withdrawal-envelope findings fixed | `shaft-runtime-fix-sol-report.md`, `shaft-runtime-rereview-glm.md`; latest GLM SHIP is source review, not browser acceptance |
| Kinematics/camera | Startup/material-card findings fixed; latest analytic follow-integral correction delivered | `shaft-kinematics-camera-rereview-sol.md`, `shaft-follow-fix-glm-report.md`; final follow correction still needs fresh independent review |
| App integration | Input-shaft entry trigger, static story, dialog card layer, scene registration and rig lookup added | `src/components/{RingInspection,ShaftStoryLayer}.tsx`, `src/scene/inspection/InspectionScene.tsx`; app-wide integration acceptance open |

Important source groups are `src/scene/inspection/shaft/*`, `src/scene/inspection/{session,story,renderLease,ringRuntime}.*`, `src/state/inspectionStore.*`, shared camera/hero/inspection scene files, `scripts/manufacturing/*`, and `scripts/verify-manufacturing-inspection.mjs`. Many newer files are untracked in the original checkout. They are included in the recovery snapshot.

## Actual proof and open findings

**Fresh recovery-session checks:** `npm run typecheck` PASS; `npm test -- --run src/scene/inspection src/state/inspectionStore.test.ts` PASS, **15 files / 152 tests**. Logs are in the recovery directory. No browser, production rebuild, CAD re-export or opening roster was rerun during recovery. Historical checks below belong to their own recorded builds.

- Shared lifecycle verifier: **12/14 PASS twice**, in `runtime/lifecycle/report.json` and `run-1/`, `run-2/`. Both failures are reduced-motion desktop/narrow fetching the narrative `Default.glb`, `m249-transformed.glb`, and `msp-enclosure.glb`. Recorded cause is `src/App.tsx:37` (`canvasActive` permits reduced-motion narrative CAD loading). V4 needs the recorded scope/owner decision and a real fix/rerun; do not weaken the verifier. V6 parent rerun remains unchecked. The verifier itself received GLM SHIP.
- Shaft development smoke `runtime/shaft-smoke/dev-1/report.json` covered desktop+narrow, but had zero carriers / `assembled:false`. **Do not use it to claim finale success.** After the rig-lookup fix, `dev-2/report.json` proves desktop readiness **2164 ms**, five carriers, `missingCarriers:false`, `assembled:true`, support delta **2.750 mm**, and Return pose error **0**. Corrected narrow finale and fresh production shaft proof remain missing.
- `shaft-kinematics-camera-rereview-sol.md` found a follow-integral/startup mismatch (11.25-degree accumulated error). `shaft-follow-fix-glm-report.md` corrects the analytic eased-speed integral and turn wrapping, adds four regressions, and claims 102/102 focused tests/typecheck. Recovery's 152-test rerun passes the present inspection files; a fresh independent review of that final correction remains due.
- The dedicated shaft verifier producer did **not** deliver: `shaft-verifier-sol.log` ends with HTTP429 retry exhaustion. `shaft-verifier-spec.md` is the restart contract. `scripts/verify-manufacturing-inspection.mjs` exists for shared lifecycle; it is not a completed dedicated shaft verifier.
- Camera C2 (desktop/390×844 blockout) and C4 (budgets/commands), asset D4, overall integration/runtime review and owner visual acceptance remain open. Read `camera/clearance-v4/README.md` for lead-angle convention, approximately 31-micron land-overlap treatment and subsequent empty-mask guards. The earlier housing 3.687 mm finding was resolved as an invalid open-mesh parity sample, not accepted as real penetration.
- Earlier October 4 knurling README has now been corrected: its historical runtime report has 7/7 passing cases, with later technical SHIP recorded; that packet does not certify the newer study. Older opening quick proof failed because headless capture used lite instead of required full tier; it establishes no opening pass or renderer regression.

## Accepted boundaries

- Preserve approved **6 mm authored hob lead-out** and **+2.75 mm shaft-local Y support shift**, exactly once. Approved moved bearing/ring exports already contain the displacement. The 6 mm construction radius is not authenticated production hob OD/clearance.
- Accepted CAD files under `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/` match `manufacturing-story-plan-2026-10-05/approved-asset-baseline.md` by current independent hash check. Preserve them; derive fixes/compression in separate assets.
- Revised parts belong to the optional inspection study. Preserve `Default.glb`, narrative ladder/windows, measured coordinate conventions and exact saved-state restoration. Keep illustrative stress/history labels; do not claim solved FEA or production-machining truth from artwork.
- No final owner animation acceptance, deployment or push is recorded. Runtime proof, independent technical review and owner acceptance remain separate.

## First moves next session

1. Read the final follow fix and obtain its fresh independent review. The execution table and acceptance ledger are reconciled; finish remaining leaf-gate evidence without marking overall gates passed prematurely.
2. Finish the dedicated shaft verifier from `shaft-verifier-spec.md`; cover desktop+narrow corrected finale, all authored beats, direct seek/replay, restore/focus, lifecycle/resource disposal, denied fetch, real context loss and static modes.
3. Resolve the reduced-motion narrative-loading scope recorded under V4, then rerun the lifecycle verifier. Complete camera/budget and independent asset acceptance evidence.
4. Build from the real `.buzz/REPOS` checkout, restart `:4173` after the rebuild, obtain fresh production shaft/ring proof and opening regression evidence. Full six-case opening roster is final acceptance evidence only. Finish provider-diverse reviews and report owner visual acceptance separately.
5. Prepare a scoped manufacturing/recovery checkpoint commit using the ownership baseline; leave unrelated staged opening work intact. Push only after the repository's relevant evidence/check requirements are met; deployment requires its own authorization.

Existing commands:

```powershell
npm run typecheck
npm test -- --run src/scene/inspection src/state/inspectionStore.test.ts
npm run build
# Restart the production preview after rebuilding, then:
node scripts/verify-ring-inspection.mjs --url=http://localhost:4173 --out=<new-evidence-dir>
node scripts/verify-manufacturing-inspection.mjs --url=http://localhost:4173 --out=<new-evidence-dir>
# Confirm full-tier GPU and a dev server using localhost:
node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5199
```

Inspect each script's supported CLI flags before execution. Do not claim the dedicated shaft verifier exists merely from its spec.

## Documentation and graph follow-up — October 6

The recovery initially added a handoff plus three navigation banners. The subsequent owner-requested documentation pass corrected the stale status at its source:

- `TODO.md`, `project/README.md`, and `project/work/INDEX.md`: historical planning banners no longer instruct the next session to start implementation; current entry points target this recovered handoff.
- `docs/jgun-manufacturing-inspection-plan.md`: implementation-in-progress status, preserved planning review history and all seven unchecked overall acceptance gates.
- `docs/jgun-authorship-knurling-implementation-plan.md`: latest continuation link; old graph-access unavailability is historical, not a current tooling claim. Six unchecked historical execution items are preserved pending evidence reconciliation.
- `manufacturing-story-plan-2026-10-05/continuation-handoff.md`: explicitly historical/superseded; restart-G0 instruction replaced by resuming existing measurements and remaining review gaps.
- `authorship-knurling-implementation-2026-10-04/README.md`: historical 7/7 runtime PASS and technical SHIP recorded, with owner acceptance and newer-study proof distinguished.
- `manufacturing-implementation-2026-10-05/PLAN.md` and `review-ledger.md`: current leaf states, completed fixes/reviews, lifecycle 12/14, missing shaft verifier and source-only review limits replace stale in-flight/open-implementation summaries. Original chronological logs/reviews remain intact.
- `project/context/agent-skills.md` and the project knowledge map: correct real checkout, graph project name and coverage workflow. `C:/Projects/jgun-portfolio` is a junction to the `.buzz/REPOS` checkout. Verified service version is 0.10.8.

**Graph refreshed and verified:** query **`C-Users-Markimus-.buzz-REPOS-jgun-portfolio`**, full-mode generation **2026-10-06T16:12:35Z**, **5,820 nodes / 20,935 edges**, zero skipped files. Full record: [graph-refresh-2026-10-06.md](graph-refresh-2026-10-06.md). The new `createShaftRuntime` symbol resolves and its indexed source exactly matches the live function. Coverage inventory is complete (32/32 ignored-file records), but the checker still flags `metadata_changed`; use live-source verification for material claims. Two parser gaps remain: `scripts/deploy-studiomark.ps1:25–26`, `src/scene/rl300/QuietMachinePreview.tsx:64`.

Root `.cbmignore` now prunes the verification-evidence subtree, logs, generated drawing cache and Python bytecode from structural indexing. An unfiltered diagnostic produced about 16.5 million nodes and 17 GB memory use; excluding individual captures then overflowed coverage metadata. Whole-subtree pruning fixed that inventory. Runtime source, `scripts/` helpers and canonical plans/specs outside evidence remain indexed. **Read evidence packets and their helper scripts directly**, including this handoff; all are preserved, not deleted. The separate legacy alias `jgun-portfolio` remains an older registration and must not be assumed to share the refreshed generation. The graph is a navigation aid, not runtime/geometry certification.

Final documentation validation checked **265 local links**, all resolving, after correcting the broken agent-skills link to the root AGENTS.md. All 92 saved source/script files still match their recovery hashes; acceptance checkboxes are unchanged. No source/CAD implementation edits, staging, commit, deployment or push occurred in this documentation/graph pass. Final documentation and `.cbmignore` copies are retained with the original recovery backup.

## Agent routing and Gemini feedback retained

Owner asked to try `openrouter/google-gemini-flash` first, use fresh GLM quota and fall back to GPT-6.1 Sol on trouble. The prior session tried three Gemini seats; the logs/status record OpenRouter HTTP402 because requested output allowance exceeded available credit, leaving no final reports/gates. This is a route/credit failure, so it does not support a model-quality verdict. Partial tooling edits were preserved and later tested. GLM and Sol completed later leaves with cross-provider review. Repeated HTTP429/usage caps interrupted multiple seats, including the dedicated shaft verifier. Use `review-ledger.md` and per-seat logs for requested versus observed attribution; never infer served model or billing from request flags.

## Suggested skills

Read exact paths from `project/context/agent-skills.md` before entering their domains: `cad-scene-graph-rigging`, `webgl-telemetry-verifier`, `r3f-scroll-performance-guard`, `gsap-scrolltrigger`, `asset-and-bundle-hygiene`, and the project's review/orchestration skills. Structural graph metadata was stale for these new inspection files in the productive session: check current coverage and fall back to live source before asserting complete findings. Use `handoff` for the next closeout.
