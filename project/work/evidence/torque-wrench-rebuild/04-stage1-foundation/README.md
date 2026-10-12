# JG-038 — Stage 1 private static foundation

Date: 2026-10-11 (America/New_York). Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`; branch: `torque-wrench/rebuild`; baseline HEAD: `8945fa95cc70b74bdcc9da27cc0573c3d1157da4`.

Stage 0 is closed under the owner's existing plan, ordered implementation and document 18 matrix/budget approval. G0–G9 remain open. This packet records Stage 1 work, not private-page runtime or owner visual acceptance.

## Ownership and model routing

- Runtime worker Franklin: explicit `zai/glm-5.3-flash`, High. Owns only new `src/torque-wrench-main.tsx`, `src/state/torqueWrenchStore.ts`, and the named Stage 1 files/tests under `src/scene/torque-wrench/`. No existing root runtime, shared files, V16, HTML head shell or Vite edits.
- Interface reviewer Banach: explicit `zai/glm-5.3`, High. Owns only `shell-activation-packet.md` in this evidence directory; product files are read-only. Prepares exact HTML/registry/input changes for the shell owner.
- Parent: integration, proportional CPU validation, preservation checks, `scripts/check-torque-stage1-boundary.mjs` and this evidence directory. After worker Round 1 fixes were complete, Franklin was closed and exact page-local ownership transferred to the parent for remount/failure-port refinements. No overlapping active writers.
- Named tier roles are pinned to Codex models, so default seats with explicit GLM overrides are used. These are behavioral ownership boundaries within inherited session permissions, not separate filesystem sandboxes. Tool configuration confirms requested model/effort; no independent provider telemetry is claimed.

The user explicitly prohibits Codex-native subagents without further approval. No such seat or isolated Codex dispatcher is launched. The user's GLM routing overrides the skill's Astra seat preference; independent GLM review does not close the plan's Astra/owner acceptance gates.

## Preservation baseline

Index empty; branch/HEAD match the requested continuation. Existing dirty tracked files: AGENTS.md, TODO.md, owner rulings 00, handoff 08, implementation plan 13, next-session prompt 14, and project/work/INDEX.md. Existing untracked research, plans and evidence remain owned by their prior writers. No cleanup, stash, reset, checkout, stage or Git delivery is authorized.

The 273 tracked files selected by `git ls-files -- src scripts public vite.config.ts package.json package-lock.json index.html quiet-machine/index.html`, sorted by JavaScript string ordering and hashed as path + NUL + raw content into one SHA-256, have baseline digest `bfbdf1f7a819c54366a6f757148517729cda7517f756137f036c36afb4e9dd79`. This exact selection is narrower than the Stage 0 274-file manifest; the counts are not interchangeable.

Additional preservation selection: the seven dirty tracked paths above plus `git ls-files --others --exclude-standard -- docs/torque-wrench-rebuild project/work/plans/JG-038-torque-wrench-rebuild.md project/work/evidence/torque-wrench-rebuild/03-stage0-readiness`. These 50 files have digest `87e56d8a8a88cd0e367b7fabe02121bb99c5f4ba34d5e269fb7d2c10b3f32d2d`, using the same path/NUL/raw-content recipe. New Stage 1 evidence is excluded.

Official React references read live: [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore), [lazy](https://react.dev/reference/react/lazy), [useEffect](https://react.dev/reference/react/useEffect). Key contracts: unsubscribe on cleanup; cached unchanged snapshots; lazy loaders execute at first render and reject to an error boundary; effects must mirror setup/cleanup including StrictMode's extra cycle. Shared shell sources/tests are the authority for internal fade/registry/poster interfaces.

## Resource snapshot before validation

Initial observation: free RAM 5.73 GB of 28.81 GB; sampled CPU load 71%; C: free disk 216.3 GB. 77 node and 16 Chrome processes observed, no Blender process in that named process query. Ports 4173/4191/4193/5199 had no listeners. Existing processes are not owned or stopped by this session. Refresh before build/browser/GPU work. No performance or hardware GL conclusion follows from this snapshot.

## Integration boundary

Shared registry and Vite inputs stay inactive in this session. The shell owner must coordinate the real private HTML, pinned head/fade block, registry activation and input verification together after the page-local module exists. See [shell activation packet](shell-activation-packet.md). No cross-chat message is authorized. This session can finish and review the private files and activation proposal without performing activation.

The activation packet is prepared. Parent independently compared the proposed `shell:begin` block against current Quiet Machine HTML after CRLF normalization: exact match. Proposed HTML has a real head `robots` meta (`noindex, nofollow`) and module `/src/torque-wrench-main.tsx`. The registry-derived input requires no Vite config change. Shared `pages.test.ts` and `pageTopology.test.ts` have activation pins that must change with the registry/HTML through the shell owner.

All ten product interface hashes in the packet match current source at preparation. The packet's parent README/checker hashes describe their preparation versions; those two parent-owned artifacts are being refined and are not frozen source identities.

## Verification status

The page-local foundation is implemented; [final CPU validation](validation.md) passes: source boundary, clean TypeScript, 13 files / 253 shared and Stage 1 tests, and scratch-only private JS module production build. See [independent source review](source-review.md) for its verdict and limits. **Stage 1 remains open pending coordinated HTML/registry activation and private runtime/topology verification. G0–G9 remain open.**

Banach's second/final GLM-5.3/High review passed the unactivated static foundation with no blocking source findings. It independently recomputed the 18 source-manifest hashes (18/18 match); command results are explicitly attributed to the parent rather than claimed as reviewer reruns. Both seats are closed. No Astra, owner visual/motion or runtime gate was closed by this source review.

The ordered DOM story, native inspection disclosure, static/reduced-motion tier path, page-local store, cleanup, lazy scene boundary and import/render failure fallback are present. The real narrative Scene is intentionally a zero-Canvas placeholder; offline art is pending. No conductor, Lenis/ScrollTrigger loop or renderer exists to clean up yet. Static/failure browser behavior and GPU resource disposal are future proofs. Temporary static presentation cannot pass final poster acceptance. Refresh audit 16 and reconciliation 17 before extraction; audit progress mappings before conductor tuning.

[Source manifest](source-manifest.json) pins the exact 18 new source/test/checker paths and their final SHA-256 contents. They consist of the JS entry, page-local store/test, 14 page-folder files (including five test surfaces across that folder/store), and parent import checker. The scratch build helper/output are working verification material and remain untracked/ignored scratch. Both GLM seats were direct default agents with explicit model/High overrides; no Codex-native subagent was launched.

Checker-only independent review by Banach found gaps in lazy-target resolution and the allowed import surfaces. Parent hardened the script to resolve and traverse the sole lazy Scene edge separately, reject root surfaces transitively, constrain eager packages to React, reject alternate module loaders/parse errors and verify referenced static assets. The page-local store is dependency-free at runtime. This source check is not proof of cold-load network, StrictMode/browser lifecycle or final poster acceptance.

Follow-up resource sample: 7.32 GB free RAM, CPU load 79%. Repository `dist/` is absent at the baseline; CPU checks may run serially, while browser/GPU and production building require a fresh suitability check. Node syntax check for the source-gate script passed. An earlier context-mode subprocess used its Bun `process.execPath`, so that command actually executed the checker and reported the expected absent-entry failure; the later explicit installed Node syntax check exited 0. No source result is inferred from the absent-entry check.

## Final preservation and next action

Final checks matched both baseline digests exactly: all 273 tracked product files and all 50 original dirty/untracked planning/Stage 0 evidence files. HEAD/branch unchanged, index empty, tracked `git diff --check` exit 0; `dist/` remains absent. Concurrent new `docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md` was identified and preserved, excluded from the original 50-file comparison. No shared-shell/V16/protected-checkout edits, stage, commit, push, PR, deployment, publication, cutover, archive or cross-chat message occurred.

Next action: the shell owner coordinates the exact HTML/registry/shared-test changes in `shell-activation-packet.md` after confirming current source hashes. The foundation module now exists and its CPU checks pass. No plan or budget reapproval is needed. After coordinated activation, refresh resources, build to a separate scratch output, then perform the private topology/static/failure/browser checks under the approved contract. Do not begin Stage 2 conductor tuning or later extraction before their prerequisite audits and Stage 1 exit.
