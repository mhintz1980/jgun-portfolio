# Shared-shell delivery source verification — 2026-10-11

Source commit: `6f4ee77f2fcf2465f79e2006b87325dee1a46a44`. Authorized merge target: `9edfa552c689cb5526e5610e4dc6e8c16e82e743`. Workspace: JG-038 torque worktree only. Checks used `git show 6f4ee77f:<path>`, not the handoff's claims. A native `tier-reader` configured Luna/high performed the bulk audit; parent corroborated registry/navigation/poster/guard/private-topology and lifecycle source. Configured model is not independent backend proof.

## Stage 0 item 2 — source confirmations

| Subrequirement | Result | Source at `6f4ee77f` |
| --- | --- | --- |
| Shell delivery | Code exists in shared Git objects; local integration pending when this report was written. | `src/shared/pages.ts:4`; `src/shared/pageFade.ts:207`; `src/shared/PosterImage.tsx:15` |
| Exact exports | Confirmed: registry/tier API; fade install/navigation/release/prefetch; generic nav; poster types/map validation/image; poster guard. | `src/shared/pages.ts:4,8,31,88,95,109`; `src/shared/pageFade.ts:111,118,133,207,250,265,287`; `src/shared/PageNav.tsx:18,43`; `src/shared/poster.ts:13,21,28,55,82`; `src/shared/PosterImage.tsx:6,15`; `src/shared/posterGuard.ts:91` |
| Lifecycle | Confirmed in source: install returns click/pageshow uninstall, navigation serial invalidates stale recovery, bfcache clears state. `releaseFadeWhen` is bounded polling with no cancel return; shorter-lived torque mounts must account for it. | `src/shared/pageFade.ts:126–185,232–247,250–283` |
| Fade behavior | Confirmed in source: reduced-motion immediate navigation; one assignment after root animation/fallback; readiness release with cap; failure recovery. Fresh runtime behavior is not proven by source. | `src/shared/pageFade.ts:133–185,250–283`; `quiet-machine/index.html:5–25` |
| Navigation behavior | Confirmed in source: reserved rows render spans, live links carry `data-fade`, public navigation filters private rows at every variant. | `src/shared/PageNav.tsx:18–32,43–55`; `src/shared/pages.ts:88–100` |
| Poster interface | Confirmed in source: beat/chapter ID, alt, desktop/narrow raster dimensions, status and offline-render provenance; generic image; guard rejects missing/invalid evidence and CAD requests. Final torque art is future work. | `src/shared/poster.ts:10–36,42–79`; `src/shared/PosterImage.tsx:6–27`; `src/shared/posterGuard.ts:8–10,34–79,91–115` |
| Private-entry integration contract | Confirmed in source: torque ID is private/reserved with null href/input and `fadeIn: true`; public nav excludes it; active private entries require real head noindex, no redirects to private pages. Activation is Stage 1 and was not performed. | `src/shared/pages.ts:68–90`; `src/shared/pageTopology.test.ts:39–43,110–126,372–417`; `quiet-machine/index.html:5–25` |

Poster mount observation is for document canvases, not workers/OffscreenCanvas or never-inserted canvases. Post-load counts alone cannot prove never mounted. Keep init-script observation and complete request evidence in future cold-load gates.

## Review and test provenance before local integration

The handoff reports two independent Astra review rounds; round 2 was ACCEPT WITH FIXES, followed by fixes in `6f4ee77f`. No round 3. The fixes were checked by the shell owner's reported 233 shared tests and clean tsc, not a third Astra review. Before the authorized post-merge commands, these test results were not run by this torque session. Historical GPU transition evidence is not a fresh readiness run.

The authorizing user explicitly permits one local merge only if it does not touch uncommitted work; no stash/reset/clean/switch. Read-only preflight found 625 incoming paths with no exact overlap against dirty tracked or untracked files. `git merge-tree --write-tree --name-only HEAD 9edfa552` returned exit 0 and tree `6093ef075ef01b73bf1df3fe92148c1f52d53920`, predicting no conflicts without changing the index/worktree/branch. No non-sample merge hooks were found. Actual merge and tests remain to be recorded below.

V16 materials `90bc07d2` and its evidence are incoming history acknowledged by the owner; no V16 source was edited by this torque session. Quiet Machine retains its inline poster. Shared files, Vite config, head shell block, and private activation must not be edited here under this task.

## Executed local integration and CPU checks

- Exactly one merge invocation: `git merge --no-overwrite-ignore --no-edit 9edfa552c689cb5526e5610e4dc6e8c16e82e743`. Exit 0; commit `92bafba51e66a3d0cc9ca6475e61bd2ea3ad1542`; parents `f4671e85e587e879eb435fa7db72af8519dd129d` and `9edfa552c689cb5526e5610e4dc6e8c16e82e743`. No conflict and no blocking file list.
- Immediately before/after merge, SHA-256 checked every existing dirty tracked/untracked file (90 files). All contents unchanged. No stash/reset/clean/switch; ignored-file overwrite was disabled.
- After merge: `npx vitest run src/shared`, Vitest v4.1.11, exit 0. **8 test files passed; 233 tests passed; 0 failed.** Runner duration 3.42 seconds. CPU-only tests; no browser/server/build.
- After merge: `npx tsc --noEmit`, exit 0, **zero diagnostics**. No shared fixes or other product edits.
- `git diff 6f4ee77f HEAD -- src/shared vite.config.ts quiet-machine/index.html src/quiet-machine-main.tsx` is empty; merged shell matches the delivered commit on those surfaces. Dirty diff against HEAD under `src/shared`, Vite, the HTML head, and V16 source is empty. Index has no outstanding staged changes.
- Source delivery and CPU contracts pass. No exact change request to `src/shared` is needed for this task. `releaseFadeWhen` and mount-observer limitations above remain relevant to future torque lifecycle/runtime proof.
- The torque row remains `reserved: true`, `href: null`, `htmlEntry: null`, `fadeIn: true`, `private: true`. Stage 1 activation was not performed. No build, browser, capture, server, GPU, push, deploy, or publication.
- Stage 0 stays open: resource coordination and fresh runtime readiness, plus numerical budgets/verification matrix. The owner explicitly said not to start those in this task.

Actual token expenditure is not exposed by this session's tools; no measured token total is claimed. The supplied 25–40k estimate is a proposal estimate, not actual usage.
