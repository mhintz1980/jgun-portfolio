# JG-042 final committed candidate — 2026-11-06

> Historical pre-release verification receipt. The later authorized production
> release and live checks are recorded in [release-2026-11-06/README.md](release-2026-11-06/README.md).
> Its deployed source and artifact are the exact candidate identified below.

Implementation source: **`8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a`**. Three local task commits: fff71e0 (implementation/intake), aa4814b (review fixes), 8d8f045 (final bounded review/evidence). Fast-forwarded into the requested original `torque-wrench/rebuild` checkout after verifying its tracked tree was clean and its HEAD remained the pinned 6ec4fe06. No push, upload or deployment. This receipt and candidate-final-identity.json are local verification outputs created after the source commit, not changes required by its application code.

## Plan and implementation status

Accepted/promoted as [JG-042](../../plans/JG-042-portfolio-performance.md), with TODO/INDEX registration. Conditional implementation executed for the bounded measurement/hygiene scope; this is separate from full portfolio performance completion. P01 source/live/artifact ownership pinned; P02 new measurement contract and natural/cache-condition records produced; P03 four NEW exact local-only exclusions accepted in addition to the existing M249 exclusion; P04 late-fetch classification established with cost attribution still unresolved. P05/P06/P07/P09 deferred without adoption. P08 closed without implementation for measured already-late paths. P10 fresh Sonnet review **ACCEPT**, limitations retained. P11 release approval remains absent. Overall TODO stays open for deferred experiments/full performance budgets and any separately approved release.

## Exact committed-tree checks

Detached checkout `C:/Users/Markimus/.codex/worktrees/jg042-performance/verify-fff71e0` moved to the exact final source above, with only a node_modules junction. No tracked changes.

- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node --test scripts/*node-test.mjs` (all seven enumerated pure Node files): **42/42 PASS**, zero failures.
- `node node_modules/vite/bin/vite.js build` after typecheck: exit 0, 794 modules, 9.05 s. Existing large-chunk warning remains.
- `node scripts/verify-launch-dist.mjs --dist=dist`: 156 files / 53 required assets PASS; zero M249 and hashed Draco copies.
- Full [candidate-final-identity.json](candidate-final-identity.json): source is exact final commit, clean tracked source provenance, lock SHA-256 and complete source-input/file arrays. Artifact manifest **`f624a566bd5571ecef8a0dab052d7b13dc066efc11452f3241b241836c6b7bef`**, **105,943,955 bytes**. All 156 output files match the pinned clean local baseline, including routes, runtime bundles, models, decoders, fonts and cache headers.

## Measured results and limits

- Original natural roster: **60/60 functionally valid**, five cold/same-context repeat pairs per desktop/narrow × home/QM/torque. Raw rows preserved; machine-readable summary excludes the original narrow torque timing group due tail build overlap and names the post-run annotation rule.
- Separate uncontended narrow torque roster: **10/10 functionally valid**, five replacement pairs. No performance-gain claim. Readiness observation has up to 1000 ms polling resolution plus evaluation latency.
- Valid/missing/stale drawing-cache fixtures: **6/6 PASS**, then **6/6 PASS** again after entry/scene/model/fixture/navigation identity hardening. Distinct fixture input hashes/versions; missing and stale intentionally share the live-fallback outcome. Interception disables browser HTTP caching, so these are not warm-cache timing results.
- Corrected trace/capture passed both readiness gates and forward/reverse checkpoints through .62–.825. AMD Radeon 780M / ANGLE D3D11 full tier observed. Snapshot positions were inspected by the parent; capture script itself asserts readiness/errors, not a full cinematic roster.
- Prevents **54,677,651 bytes** of local-only contamination when building from the original dirty workspace. This is a storage/deployment hygiene result; the clean baseline and candidate runtime bytes are identical. No speedup estimate.
- No full Lean-V1/contract-18 performance-budget, shader compilation, isolated decode/prep, GPU execution, power, hidden-tab, physical mobile or final visual acceptance. Home readiness is DOM-only and home/QM input checks prove document movement, not scene pixels.

## Review, preservation and release boundary

Owner selected Sonnet 5.5/high after GLM was unavailable. [Initial delivered review](fresh-review-sonnet-final.md), [disposition](review-disposition.md), [ACCEPT follow-up](fresh-review-sonnet-followup.md). Exactly two delivered review rounds; reviewer read a bounded pack and executed no tools. Parent independently checked material findings and ran the checks above. Failed/truncated routing attempts are recorded without a fabricated verdict. No third review claimed.

Untracked showcase/font originals remain untracked and preserved. Tracked showreel/bumper and referenced road textures remain unchanged pending lane coordination. JG-041, logo and other concurrent lanes are untouched. A stopped worker's draft was preserved at original-workspace `.scratch/jg042-worker-draft/performance-contract.mjs` before integration; it was not adopted or staged. Original proposal/prompt were moved out of inbox into the historical research evidence folder after canonical promotion. Large raw CDP traces/provider responses remain local, unstaged in the isolated execution workspace.

Live identity was confirmed as deployment e796fe69-b95b-4de9-93b1-cdfd2844b343 / source f83f4ba3, entry torque-wrench-BsY9og6w.js / Scene-CgT8NRm_.js. No release action was performed. An owner can review this exact candidate before separately approving P11. Rollback is a new revert of only the three JG-042 commits followed by a fresh build; never rewrite shared history or remove concurrent changes.

Final post-integration revalidation: Cloudflare canonical deployment remains e796fe69 / f83f4ba3. Original checkout HEAD is 8d8f045b with zero tracked changes; all 156 final artifact entries exactly equal baseline entries; no public media or scratch paths were committed. The preserved worker draft exists at the recorded scratch location. Only local verification outputs/historical research and pre-existing untracked lane material remain outside the commits.
