# JG-038 — local Stage 0 shell readiness run

Run 2026-10-11, 17:24:37–17:25:58 America/New_York (`21:24:37–21:25:58Z`). Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`, HEAD `8945fa95cc70b74bdcc9da27cc0573c3d1157da4`, with existing dirty/untracked planning work preserved.

Owner instruction: finish Stage 0, prepare matrix/budgets for review, coordinate local resources and complete permitted readiness checks, preserving dirty work and protected/shared-shell/V16 boundaries. This run exercises delivered shell functionality on this worktree. It is not private torque-page runtime or performance acceptance.

## Executed checks

| Check | Result | Direct evidence |
|---|---|---|
| Shared tests | PASS — 8 files / 233 tests | `shared-tests.log` |
| Typecheck | PASS — exit 0, empty diagnostics | `typecheck.log` |
| Production build | PASS — exit 0, 12.773s | `build.log` |
| Transitions, 1440×900 | PASS — all 7, `gateIncomplete: []` | `1440x900/report.json`, `transitions-1440x900.log` |
| Transitions, 390×844 | PASS — all 7, `gateIncomplete: []` | `390x844/report.json`, `transitions-390x844.log` |
| Served/build identity | PASS — 25 HTML/JS/CSS file hashes matched before and after | `readiness.json` |
| Product source preservation | PASS — 274 source/config/script/public file hashes unchanged | `readiness.json` |
| Existing repository `dist/` | Unchanged | `readiness.json` |
| Task preview shutdown | Stopped; port 4193 released | `readiness.json`, parent post-run process/port check |

Seven cases are fade-out, synthetic-arrival, Back/bfcache, reduced-motion cut, legacy redirect, no-white-frame and reduced-motion arrival. All passed in both viewports with installed Chrome `154.0.8037.98`, headless, harness device DPR1. Back was PASS, not the harness's permitted UNVERIFIED exception. The no-white-frame case is the existing empty-stylesheet still test, not a CDP screencast. These limitations remain inherited from the unchanged verifier.

Build reported the existing >500kB chunk-size warning. No numerical bundle/performance acceptance is inferred. Browser GL renderer was not recorded; ANGLE/enabled-GPU launch arguments are not proof of hardware rendering. No V16 scene gate was run or accepted.

The existing transition harness recorded generic resource 404 console warnings in fade-out, synthetic-arrival and Back at both viewports. A separate bounded request-URL triage on the same unchanged scratch build identified `GET /models/rl300-extra-parts.glb` returning 404 in the default Quiet Machine path; root and explicit Quiet Machine lite had no HTTP/page errors in that 8s observation. [request-triage.json](request-triage.json) records exact requests, browser version, times and stopped preview. This identifies the reproduced warning, not every possible error under all inputs. Shell roster PASS is supported; an error-free Quiet Machine scene is not claimed. The missing asset belongs to the existing Quiet Machine/V16 track and is recorded for its owner without editing shared/product files or messaging another chat. It is outside the shell transition acceptance predicates and private torque readiness scope.

Direct source confirms `src/scene/rl300/QuietMachineScene.tsx:70–72` skips this extras request in lite and resolves `null` on full-path load failure, retaining the main model; the asset is absent from this worktree's `public/models/`. This explains the bounded warning/fallback observed, without approving V16 geometry/material behavior or altering its owner's work.

## Resource coordination and provenance

Pre-run scoped process inventory found no Blender render/Vite/build/capture candidate; ports 4173/4191/4193/5199 had no listeners. Other user applications, Node transports and Blender MCP transports were left running. Sequential shared tests, tsc, build and two browser rosters used a bounded task-owned window. This is not an exclusive system-wide GPU reservation; future performance runs must recheck background load.

Scratch output: `.scratch/torque-stage0-20261011-01a12c92/dist`. Preview: `http://127.0.0.1:4193`, strict port; PID `32628`, launched hidden. A new preview was started after this build, then stopped in the harness `finally`; the post-run check found no task verifier/server process and no listeners on the four scoped ports. No unrelated process was stopped. Scratch is never committed.

The evidence-only orchestration harness is `.scratch/torque-stage0-20261011-01a12c92/run-readiness.mjs`; its SHA-256 is in `readiness.json`. That report records exact Node command arguments, log/report hashes, all 66 output hashes, before/after served hashes, 274 product source hashes, times, browser versions and stated scope. Production dependencies were already installed; no install, configuration or source patch occurred.

Device observation: Nimo N177L / AMD Radeon 780M, driver `32.0.31041.1004`, RAM `30,936,129,536` bytes; Windows 11 Home Insider Preview `10.0.26340`; Balanced power plan, battery status 2/AC and 58% at observation. Node `22.19.0`, Vite `7.3.6`, Playwright `1.56.1`. Refresh rate and browser GL were not certified by this shell run.

Official Vite CLI and Playwright browser-channel docs were consulted, with installed CLI/type definitions confirming local Vite7 `--outDir`/preview and Chrome channel behavior. The context-mode fetch path failed due to missing `turndown`; direct official-page fetch plus installed source was used without changing the tool installation.

## Disposition

Delivered shared-shell readiness is demonstrated at this run's scope. S0.3 is complete for the authorized readiness window and released resources; future runs require a fresh availability check. The [proposed matrix and phase budgets](../../../../../../docs/torque-wrench-rebuild/18-stage0-verification-contract-proposal.md) are ready for owner review. S0.7 remains pending numerical/matrix approval. S0.6 remains the continuing domain-entry requirement. Stage 0 is ready for that approval checkpoint; G0–G9 stay open.

No private torque entry/activation, private shared-PosterImage browser integration, mutation red-proofs, mobile-hardware performance, torque narrative runtime or performance/effects/owner acceptance is covered. No shared-source/V16/protected-checkout edits, cross-checkout access, Git mutation, messaging, deployment or publication occurred.
