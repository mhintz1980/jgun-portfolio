# Post-deployment cleanup plan — 2026-11-05

Status: researched execution proposal, independently reviewed and revised, prepared at Mark's request. Planning is authorized; cleanup has not started. This document replaces the [November 1 audit's](clutter-audit-2026-11-01.md) execution recommendations, not its historical measurements. No JG number is reserved by this proposal. At execution intake, allocate the next unused ID and update TODO/registry together without taking over another session's changes. The [current owner policy](../../context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md) remains authoritative for publication and evidence boundaries.

Workspace: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`.

## Objective and completion boundary

Finish a useful maintenance pass while HUD, showreel and logo work continue: make current instructions easy to find, make tooling dependencies reproducible, and remove only demonstrated disposable local output. Preserve runtime behavior, public/private page boundaries, owner references and proof. Legacy retirement has its own bounded milestone; it must not hold the useful first pass open indefinitely.

This request is to investigate and plan. It does not authorize this session to delete files, install dependencies, change application behavior, commit, push or deploy. The published site's availability is not evidence that all current source is deployed or that historical proof can be discarded.

## 1. Verified starting state

Read-only inspection on November 5:

- Branch `torque-wrench/rebuild`, HEAD `0b28422680738c8bfdd9e83b9543c3d7c888a38b`.
- Local upstream comparison was `0 ahead / 0 behind`; live `git ls-remote --heads origin torque-wrench/rebuild` returned the same full SHA. No fetch, merge or branch switch was performed.
- No staged or unstaged tracked changes at inspection. There were **31 non-ignored untracked files**, chiefly JG-040 capture reports/videos/scripts, two logo briefs, and `public/fonts/gentilis_bold.typeface.json`. Ignored scratch/output is additional material, not represented by this count.
- **321 tracked paths changed since the original audit's `723035b5`.** The old removal lists are candidates, not current deletion authority.
- The recorded production release is Cloudflare Pages `e796fe69-b95b-4de9-93b1-cdfd2844b343`, source `f83f4ba3c380ee93da105ea0d102d3bc08cc5a31`. Deployment uses direct upload; pushing Git does not upload a new build. See [release evidence](../evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md).
- Fresh HTTP requests to the apex site's five routes all returned 200; each HTML SHA-256 matched the corresponding `e796fe69.jgun-portfolio.pages.dev` HTML. `/armament/` retains its noindex meta. These are HTML identity checks, not a new browser/runtime acceptance run or a claim that all deployed asset bytes were revalidated.
- Local `dist/` matches the live root, homepage and armament HTML, but its wrench and Quiet Machine HTML differ. **Do not label it a deployed-build backup or remove it as stale.** First capture its identity and establish who uses it.

| Route | Live HTML SHA-256 | Current local dist HTML matches live |
|---|---|---|
| `/` | `c8a88803f0ba88418f83dfc09a9fd4db2be4a59ddd5e419d72aafdf406b15a19` | yes |
| `/home/` | `46454366736e307de517c95db35bcc9b97710a1b1eefd2cb7dfc847871341664` | yes |
| `/torque-wrench/` | `b71ac739469972db65118401640a1dd6a4c8c397b29fd1437a914463be8f60fc` | no |
| `/quiet-machine/` | `6e415e9dd6af4cce11c5058fc9332c41859f6d2d4128d423e52d6153f958bbcf` | no |
| `/armament/` | `a6843bcff5a796d3f59c245d1d3773e54421267d64b6b8eea83be33137f2b68d` | yes |

The recorded release passed isolated typecheck, 1,507 unit tests, 36 Node verifier tests, build/asset gate, 68 live HUD checks and 9 publication smoke cases. Those historical results do not verify HEAD's later tracker/showreel/logo work. No build or test was run during this planning pass.

## 2. What changed the cleanup recommendation

### Current consumers must all be included

1. The production MPA registry now includes `/home/`, `/torque-wrench/`, `/quiet-machine/`, `/armament/`, and redirect-only `/`. Root goes to `/home/` except the retained RL300 query route. Private armament is a text-only placeholder; preserve its current visibility, redactions and noindex behavior.
2. `lifecycle-census.html` is an intentional diagnostic entry outside `PAGES`.
3. `studiomark-logo.html` and `src/studiomark-logo-main.tsx` are active development entries outside `PAGES`. Their absence from the production registry does not make them abandoned.
4. `remotion/` is a separate tracked npm project with its own lockfile and scripts. It reads the site's `public/` and imports shared wrench and RL300 code. Examples: `remotion/src/three/Wrench.tsx` imports `src/scene/rig/nodeRoles.ts` and `wrenchMechanics.ts`; `QuietMachine.tsx` imports RL300 preparation, materials, caps, intake and ribbons. Its source and rendered showreel assets are KEEP.
5. Retained tests, TSX CLI tools and evidence-local one-shot scripts can consume code not reachable from a public page.

### Corrections to the original audit

- `build/excludePublicAssets.ts` intentionally excludes `models/m249-transformed.glb` from production. Missing M249 in dist is not a staleness test. Preserve both protected CAD assets and their documented export procedures.
- The audit's `scripts/**/*.{mjs,cjs,ts}` pattern misses `scripts/check-fallback.tsx`, which imports `App`, `BootPanel`, HUD and hotspots. Thus the Tier A claim "unreachable from everything" is not established.
- Live `RuntimeWorld.tsx` imports `buildWrenchRig`, `applyWrenchMechanics` and `roleMaterial`. Shared rig modules belong in KEEP, not in a legacy-only deletion bucket. Remotion adds another real consumer.
- Three named historical evidence GLBs are tracked, still byte-identical to their public counterparts, and total **2,892,052 bytes**: knurling tool 1,798,620; full core 678,008; lite core 415,424. Deleting them could reduce checkout bytes but does not shrink Git history, and can break evidence references. Keep them in this pass.
- The two Knip `file` warnings are direct `file:///C:/.../npm-cache/.../playwright/index.mjs` imports. A fresh `rg -n -F npm-cache scripts` finds **eight affected scripts**, including dynamic imports and `PLAYWRIGHT_MODULE` fallbacks the original count missed. Repair all retained operational import/fallback paths; do not install a package named `file`.
- Knip was run with `--no-exit-code`. Its exit 0 records tool execution, not an unused-code or dependency PASS. A new baseline must preserve diagnostic counts.
- `esbuild`, `draco3d` and `bidi-js` remain directly used but undeclared at the root. Current lockfile versions are 0.28.2, 1.5.7 and 1.0.3 respectively. Root `package.json` still has seven scripts and no Knip dependency/script/config.

### Documentation is a concrete maintenance problem

`TODO.md` is 86,177 bytes with 31 dated blockquote banners; `project/README.md` is 34,153 bytes with 24. The registry's JG-040 row still says Stage 2 has not started, while the knowledge map records Stage 3 as published. Reconcile these from owner rulings and dated evidence, not by treating every old banner as a current order.

## 3. Concurrent-work boundaries

Do not wait for all creative work to finish. Use a separate cleanup checkout for tracked implementation and narrow, writer-aware manifests for machine-local artifacts.

| Lane | Initial protection / ownership | How cleanup progresses independently |
|---|---|---|
| HUD/tracker | `src/scene/torque-wrench/**`, `src/ui/**` and relevant styles; all `project/work/evidence/JG-040-hud-d-inline/**`; corresponding output runs | Documentation/tooling work avoids runtime files. Legacy deletion must prove no inbound use from this lane. Recheck actual changed paths before integration. |
| Homepage / private armament | `src/home/**`, page HTML, `public/home/**`, shared page registry, privacy/redaction tests | Keep behavior/assets; use topology and launch gates only when affected. |
| Logo / bumper | `studiomark-logo.html`, `src/studiomark-logo-main.tsx`, `src/scene/studiomark-logo/**`, `project/work/evidence/studiomark-logo/**`, prototype fonts including the untracked Gentilis file | Include dev entries in reachability. Do not stage, relocate or delete these files. |
| Showreel | `remotion/**`, `public/video/**`, its referenced public media and shared rig/RL300 modules | Include its consumer graph; no mass render, package upgrade or creative changes for cleanup. |
| Machine-local work | Current `dist/`, all `.scratch/`, active output prefixes, preview/render processes | Inventory only until the owner of a specific run has released it. Do not stop services, replace dist or move live output. |
| Cleanup | New cleanup plan/evidence plus agreed documentation/tooling paths | One writer per shared document/lockfile; unrelated lanes continue. A busy path is skipped/rescheduled, not a reason to abandon other batches. |

At execution start, create an attached managed worktree at the then-current pushed baseline, on a `codex/` branch. Keep shared-checkout edits untouched. Do not copy untracked creative work into that branch. Root `node_modules` may be junctioned for the required isolated commit check only when its dependency set matches; package/lock changes require a separate clean installation in the cleanup checkout. Keep the Remotion dependency environment separate.

Use a cleanup-owned preview on an unused port and write checks to a cleanup-owned output prefix. After every rebuild, restart that preview before sampling it; never keep a stale preview against rotated asset hashes. Do not stop or replace the ongoing session's `:4173` server. When inspecting wrench runtime, wait for `window.__torqueWorld.snapshot().ready` and, in the inspection band, `inspection.ready` before sampling overlay/cinematography ports. A post-load null sample is not a regression finding by itself.

Before each integration/commit, recheck remote SHA, source checkout status and file ownership. Stage only session-owned paths. Run isolated typecheck and pure Node tests on the actual proposed commit tree, not just the richer shared working tree. Verify member use as well as imports; disclose any deliberate mixed-lineage files. Apply repository instructions for isolated checkout/junction handling. Do not use `git clean`, reset the shared tree, mass-stage, rewrite history or deploy to achieve cleanup.

## 4. Storage policy and initial keep list

Current inventory is a logical file-byte measurement, excluding reparse-point traversal. It is not disk allocation, deduplicated physical usage, Git object storage or a guaranteed reclamation estimate. These are snapshots, not stable targets while other sessions write output.

| Area | Files | Logical bytes |
|---|---:|---:|
| `output/` | 25,438 | 14,661,944,169 |
| `project/work/evidence/` | 17,416 | 7,038,155,298 |
| `.scratch/` | 4,526 | 1,807,278,467 |
| `docs/` | 317 | 195,374,289 |
| `public/` | 127 | 47,297,407 |
| `dist/` | 146 | 29,873,607 |
| `remotion/` excluding dependency junction targets | 54 | 1,698,801 |

The file-age screen used local last-write time before **2026-10-22T00:00:00-04:00** (2026-10-22T04:00:00Z), a 14-calendar-day cutoff from November 5. It found **916 output files / 394,657,334 bytes**, about 376.4 MiB, **before** keep-list exclusions and whole-run eligibility. This is an upper bound for that file-age screen, not permission to remove these files or an estimate of actually reclaimable whole runs. The original ~13 GB claim is not supported by this retention window.

Largest child areas under `output/playwright/` are prioritization targets for manifest inspection, not deletion selections:

| Area | Logical bytes | Initial disposition |
|---|---:|---|
| `owner-corrections/` | 4,131,673,578 | inspect run-level evidence/owner-review links; no blanket removal |
| `page-cinematography/` | 3,335,216,406 | pin evidence 73 final/recovery and any other cited runs |
| `page-cinematography-2026-10-28/` | 2,304,576,067 | inspect historical claims and active review state |
| `final-cascade-2026-10-26/` | 2,063,420,222 | inspect cited cascade proof before identifying disposable trials |
| `cascade-control-refinement-2026-10-30-full-r2/` | 1,024,141,923 | inspect evidence 70/72/73 links and frame provenance |
| `jg040-corrections-narrow2/` | 272,135,844 | hold: recent HUD evidence |
| `owner-visual-preview-2026-10-28/` | 193,799,452 | hold pending reference/owner-review classification |
| `jg040-stage3-20261104/` | 171,457,938 | pin: reviewed/released build and uploaded bundle |

No run above is approved for deletion by this plan. `output/high-low-feature-proof/` also contains cited evidence and remains held. Bulk identical frames can carry checkpoint/replay meaning; byte equality alone does not justify deleting their paths. The three tracked GLB-copy bytes in §2 were independently rechecked by the parent; they total 2.89 MB, not the old 6.3 MB estimate. JG-040 has 13 tracked evidence files as well as active untracked material; neither class is automatically disposable.

Initially pin these complete sets, including reports, raw FAIL/partial results, journals, referenced captures, scripts, build identity and uploaded bundles:

- Evidence 70/72/73/74 and their cited output, including `output/high-low-feature-proof/73-same-program/`, `73-terminal-final/`, `output/playwright/page-cinematography/73-reconciliation-final/`, `73-narrow-lite-recovery/`, `output/playwright/torque-camera-hud-73-final/`, and `output/playwright/torque-camera-hud-2026-10-21/after/`.
- `output/playwright/studiomark-wip-2026-10-31/` and all original failed/local recovery cases referenced by evidence 74.
- JG-039 homepage proof: `output/playwright/studiomark-home-release-local/`, `studiomark-home-release-production/`, `home-header/` and the release evidence record.
- All JG-040 review/release sets, especially `output/playwright/jg040-stage3-20261104/release/`, which contains the archived exact uploaded bundle, and all currently active tracker output. Expand paths from release/report references; this list is a seed, not an exhaustive allowlist.
- Owner-supplied media, docs images, original audit/raw Knip results, all tracked evidence assets and all current untracked/ignored creative material.

For any future storage action, first create a per-run manifest with original absolute/relative path, bytes, newest modification, tracked/ignored status, producing script, current writer/use status, source/build identity, inbound references, keep/archive/delete reason and destination/restore mapping. Follow references in JSON and scripts as well as Markdown; inspect root/site, Remotion, development prototypes and evidence scopes. A grep miss alone is not proof of disposability.

- **Keep:** cited proof, accepted or failed baselines, active writer output, known owner references, unknown ownership.
- **Archive:** inactive but valuable historical runs/scratch. Proposed root: `C:\Users\Markimus\.buzz\backups\jgun-torque-cleanup-2026-11-05\`. Check available space first. Preserve relative paths and verify SHA-256 and restoration of a representative complete run before removing any original. Same-volume relocation alone frees no disk space; compression savings must be measured, and substantial offloading requires a different volume/store selected for that purpose.
- **Delete:** only explicitly enumerated, inactive, unreferenced, reproducible disposable runs after the manifest and keep-list check. Exclude archives/pinned paths by resolved path, verify the target stays inside the intended allowed root, reject reparse points and recheck file stability/writer status immediately before acting. Use native PowerShell `-LiteralPath` operations. If anything changed, skip that run and refresh its manifest.
- A 14-day age rule is a candidate filter for disposable runs, never blanket deletion authority or a promised GB figure. Whole-run retention uses the run's newest file; old files inside an active/new run do not qualify it.
- Keep raw evidence filenames resolvable. Contact sheets are optional navigation aids, not replacements for original frames or approval to deduplicate an evidence packet.

## 5. Execution batches and done criteria

### B0 — baseline and isolation (15–25 minutes)

- [ ] Recheck pushed HEAD, release record/live route identity, working/index/untracked state and active render/capture destinations.
- [ ] Record a path/hash baseline and keep list; identify the archived deployed bundle separately from current dist.
- [ ] Register the maintenance task using the next unused JG ID, with the approved bounded scope, in the cleanup branch. Do not mark old tasks complete.
- [ ] Create/reuse a suitable isolated cleanup worktree. Record baseline test failures separately from regressions.

Done: reproducible baseline and ownership boundaries exist; no ongoing files are absorbed or overwritten.

### B1 — status/navigation cleanup (30–45 minutes; depends on B0)

Write scope: `TODO.md`, `project/README.md`, `project/work/INDEX.md`, an archived status-history document and a concise current-status record under `project/context/` if needed. Change root `README.md` or deployment status only for demonstrably stale navigation, not a general rewrite.

- [ ] Keep TODO as the current queue and the knowledge map as navigation. Put current release/task state in one concise linked record; link latest evidence instead of copying test rosters into every file.
- [ ] Move duplicated dated narratives into a dated historical record, preserving text, dates, source provenance and relative link resolution. Keep or redirect existing anchors used elsewhere.
- [ ] Reconcile JG-039/JG-040 status against owner rulings and Stage 3 release evidence; retain post-release November 5 tracker work as a later state. Preserve open visual/technical gates, deferred phone framing and older raw failures.
- [ ] Preserve every unchecked task unless a newer owner decision/evidence explicitly supersedes it. Classify contradictory old prose as history with a replacement pointer; do not silently delete a task or manufacture acceptance.
- [ ] Check local links/anchors touched by the move and inspect the diff. No browser/build rerun for prose-only changes.

Done: a new agent can identify current release, ongoing tasks and next action without reading dozens of banners; historical evidence and task obligations remain accessible.

### B2 — tooling reproducibility and a trustworthy unused-code baseline (35–60 minutes; after B0, serialized with other package writers)

Write scope: root `package.json`/`package-lock.json`, a maintained Knip config, retained operational scripts with personal-cache imports/fallbacks, and cleanup evidence. No source/export trimming. The eight currently confirmed script paths are `scripts/capture-b1b2-baseline.mjs`, `scripts/capture-rl300-baseline.mjs`, `scripts/verify-b1b2-rebuild.mjs`, `scripts/verify-b1b2-supplemental.mjs`, `scripts/verify-jg027-lcd-cluster.mjs`, `scripts/verify-jg028-handle-realism.mjs`, `scripts/verify-jg031-gear-rotation.mjs`, and `scripts/verify-jg032-station2-thermal.mjs`. Re-enumerate the current set before editing; apply the same classification to newly discovered operational tools.

- [ ] Declare directly used `esbuild`, `draco3d` and `bidi-js` as dev dependencies at compatible existing lockfile versions where possible; no incidental framework upgrades. Do not remove Tailwind, vendored Draco, Higgsfield workflows or type contracts on a static warning.
- [ ] Replace every personal-cache Playwright import/default with the installed package import or an explicitly portable resolver; preserve a deliberate `PLAYWRIGHT_MODULE` override where used. Inventory direct, dynamic and computed/fallback imports in retained operational tools across root scripts and other current entry/tool scopes. Historical evidence text/code remains provenance, not a reason to rewrite archived results. A possible future B4 retirement does not exempt a script still retained/documented when B2 closes: repair its operational default now, or close its actual retirement explicitly before claiming the stronger outcome.
- [ ] Pin the recorded Knip version 6.44.1 for a reproducible first comparison, or deliberately select/document another supported version; never use `@latest` in repeatable instructions.
- [ ] Cover all production HTML entries plus lifecycle census, active logo entry, source/scripts/tests including retained `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` and `.cjs` tools, configs/build source, and the separate Remotion entry/workspace with its own dependency boundary. Include CSS/JSON handling and runtime string-path asset exceptions explicitly. Do not suppress the legacy root before measuring its retained tooling consumers.
- [ ] Run/report Knip diagnostics as a nonblocking baseline first. Keep counts, exclusions and known false positives. A forced zero exit code is not a clean report; do not add blanket ignores to achieve green.
- [ ] Validate a clean install against the changed lockfile, root typecheck, the five pure Node verifier suites and affected dependency-using tests. Use syntax/import resolution checks for repaired scripts without starting their full old campaigns.

Done: directly used tooling packages are declared, no retained operational script depends on a personal npm-cache path (including when overrides are unset), and the unused-file baseline covers every retained application/tool consumer. Save fresh source-search/Knip output plus syntax/module-resolution checks for the affected scripts. Classify any remaining historical/comment-only cache references rather than conflating them with operational dependencies. B2 cannot claim completion by listing unrepaired operational tools as candidates for the later B4 milestone.

### B3 — manifest-driven local storage cleanup (30–60 minutes plus measured archive I/O; depends on B0)

Write scope: cleanup manifests/restore records and explicitly enumerated inactive machine-local output only. Begin inventory in parallel with B1/B2, but perform moves/deletes sequentially after reference/writer checks.

- [ ] Materialize the keep-list closure from evidence 70/72/73/74 and JG-039/040 release reports; pin the exact uploaded bundle.
- [ ] Review the largest run-level unpinned candidates, not every frame and not whole `output/` by date. Record bytes eligible before/after pin exclusions.
- [ ] Verify archive hashes/restore path for valuable inactive material before removing original files. Do not move active `.scratch/` projects, current dist, logo/HUD/showreel work or tracked duplicate assets.
- [ ] Delete only approved disposable manifest rows after immediate stability/path checks. Preserve summaries and referenced raw proof in place or through an explicit documented resolver.
- [ ] Report actual source bytes removed, archive bytes added, net same-volume bytes saved and remaining kept bytes separately. Confirm pinned targets and current writers' directories still resolve.

Done: an auditable list explains every removal, actual savings are measured, active work and proof remain accessible. A correct empty deletion set is acceptable; do not invent savings to meet the old audit estimate.

### B4 — retire obsolete root application and its obsolete tools (separate 2–4 hour task; depends on B2)

- [ ] Generate a fresh per-file matrix: production-used, prototype/showreel-used, tooling/test-used, reserved, historical reference, or no retained consumers. Record complete inbound uses and dynamic/string references with direct-source fallback for index gaps.
- [ ] Keep `src/scene/rig/**` and shared RL300/inspection/drawing modules whenever any retained consumer needs them. Do not delete a directory from a legacy label.
- [ ] Inventory `src/main.tsx`, `src/App.tsx`, the old manifest e2e spec, `scripts/check-fallback.tsx`, `src/data/glb-manifests.json` and old verifiers as a connected set. Decide which tests are obsolete and which guarantees need equivalent current-entry tests before retiring them. Do not remove meaningful mechanical, fallback, replay or privacy checks to clear failures.
- [ ] Remove only closed subsets, in a dedicated commit with a manifest and historical recovery reference. Prefer Git's existing history plus explicit source-commit paths over copying inactive TS into a location still typechecked. Update current run instructions/links; preserve historical evidence provenance.
- [ ] Run isolated root typecheck, affected tests and pure Node tests, production build/asset gate, focused desktop/narrow/reduced-motion smoke for public pages and armament visibility/noindex. Validate Remotion typecheck/tests if any shared import closure is affected; render a targeted still only if an actual rendering behavior changed, not a full film by default.

Done: obsolete entry/tools are removed without breaking retained imports/member use, coverage guarantees or assets. Unresolved files stay KEEP with a reason. This milestone is not prerequisite to closing B1–B3.

### B5 — integrate and report (15–25 minutes; after each ready tracked batch)

- [ ] Fresh independent review proportional to changed code/deletion scope. Resolve evidence-backed findings; do not expand cleanup into design work.
- [ ] Rebase/integrate only against the then-current target with coordination on shared docs/lockfiles. Recheck actual proposed commit in isolation, including pure Node tests and typecheck per AGENTS. With dependency changes use that commit's installed lockfile; a shared junction alone does not prove a clean install.
- [ ] Keep documentation, dependency/tooling changes and any legacy deletion in separate reviewable commits. Stage explicit owned paths only. Record actual checks, failures and deferred work in linked evidence.
- [ ] No production upload for local storage/docs alone. Any later deployment is a separate intentional release under the existing runbook and owner authorization; never upload current shared dist simply because cleanup finished.

## 6. Schedule, delegation and limits

Recommended order: **B0 → B1 → B2 → B3**, then close the useful first pass; **B4 separately**, followed by its integration. B3 inventory can overlap B1/B2. Never run concurrent lockfile edits, full tests/renders or writers against the same output prefix.

Budget **about 2–3 hours for B0–B3 and focused integration**, plus archive I/O if large valuable runs are moved/compressed. **B4 adds roughly 2–4 hours.** These are planning allowances, not a guarantee. The earlier 1–2 hour estimate did not account for the separate showreel/prototype consumers or current concurrency. Do not spend hours generating contact sheets or running full cinematic rosters merely to clean storage/docs.

| Work | Seat / launch | Effort | Dependency / reason |
|---|---|---|---|
| Current scope, plan and integration decisions | Current parent, local | Current setting | Planning consequences and concurrency decisions remain local; this does not switch parent model. |
| Bounded storage inventory | `zai/glm-5.3-flash`, direct default-role subagent | low | Read-only; independent of parent source/status inspection. |
| Saved plan review | `zai/glm-5.3`, fresh direct default-role subagent | high | After draft; challenge deletion/proof, consumer coverage and concurrency. |
| Later mechanical implementation | Saved worker `zai/glm-5.3-flash`, direct role | high | After execution scope is active; one writer per batch. No worker launched during planning. |

Mark selected **Keep saved setup** during this pass. OpenAI usage balanced; review standard; overall approver off. Model/effort settings are requested overrides; backend effort is not independently observed. Prices, quota and savings are unverified; no extra frontier child is requested. A failed selected seat is not permission to silently switch provider/model.

Graph-assisted inspection used project `jgun-torque-wrench-rebuild`, generation `2026-11-04T04:03:43Z`, not watched. `RuntimeWorld` has changed since index; evidence/output and many public assets are excluded; several CSS/TS files have partial parses. Current source reads/rg were used for the material imports and entrypoints above. This is not an exhaustive current dead-code proof; B2/B4 explicitly establish that proof before deletion.

Planning verification: Git/remote identity; current owner policy, queue/map/registry and animation-spec §5–5.4; actual page/build entry inventory; selected direct imports and package declarations; five-route live/recorded deployment HTML comparison; focused storage inventory and duplicate spot-checks. No cleanup, installs, tests, rendering, commits, pushes or deployments performed.

## 7. Final planning checklist

- [x] Refresh pushed state and deployment distinction.
- [x] Preserve active lanes; include Remotion and dev-only logo consumers.
- [x] Correct original audit's unsafe dependency/deletion assumptions.
- [x] Define independently deliverable batches and proportional checks.
- [x] Attach exact storage inventory/age cutoff and clarify candidate-only savings.
- [x] Independent plan review completed and material findings resolved or retained explicitly.
- [ ] Execution intake and actual cleanup (future work; not performed by this planning pass).

## 8. Independent review record

Fresh reviewer: `zai/glm-5.3`, requested effort high, direct configurable role, separate context from the OpenAI parent author. Standard risk-focused review; no additional approval seat.

The reviewer returned **REVISE with one material finding**: B2 scoped only two direct cached Playwright imports while its completion criterion covered all retained scripts. It independently found eight current root-script occurrences, including dynamic/environment-fallback forms. The parent confirmed all eight through a fresh literal source search and revised §2/B2 to enumerate them, include operational fallbacks, require a fresh inventory/resolution check, and prohibit deferring a still-operational tool's repair to a hypothetical B4 retirement. This closes the identified scope/acceptance mismatch in the plan; no actual script repair has happened.

The reviewer found the remaining deletion/proof/concurrency design sound: it checked the release record and local archived 112-file uploaded bundle; active logo/lifecycle entries, Remotion shared imports, tracked asset protections and raw failure retention; isolated commit/member-use checks, clean dependency installation, and preview/readiness boundaries. It relied on parent-checked live HTML/byte totals for those stated facts and did not perform an exhaustive dead-code audit or any build/test/install/write. The initial review was timeboxed after source-backed material findings were sufficient. No second full review was requested; the parent verified and applied the bounded correction above.
