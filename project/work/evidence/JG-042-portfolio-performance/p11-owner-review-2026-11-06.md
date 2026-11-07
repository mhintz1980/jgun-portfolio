# JG-042 — exact candidate for owner P11 review

> Subsequent owner ruling, 2026-11-06: Mark explicitly granted deployment and
> necessary task actions after receiving this package. The review-time boundary
> below is preserved as history; see the [release execution record](release-2026-11-06/README.md)
> for authorization, actual upload results and verification. The artifact is unchanged.

Prepared 2026-11-06, America/New_York. Read-only identity checks ran around
22:11–22:12 EST (2026-11-07 03:11–03:12 UTC).

**Ready for Mark's review; P11 approval remains absent. No deployment or publishing
is authorized.** This package presents the retained, verified work-in-progress
candidate. It does not close JG-042's broader performance task or adopt a deferred
experiment. No new source changes, commits, pushes, builds or uploads were made
while preparing this package.

## Candidate and live identities

| Item | Revalidated value |
| --- | --- |
| Workspace | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench` |
| Branch | `torque-wrench/rebuild` |
| Original checkout HEAD | `8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a` |
| Live GitHub branch HEAD | `8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a`, from `git ls-remote --heads origin torque-wrench/rebuild` |
| Authoritative origin | `https://github.com/mhintz1980/jgun-portfolio.git` |
| Tracked checkout state | Clean; pre-existing untracked media, research and evidence preserved |
| Isolated verification checkout | `C:/Users/Markimus/.codex/worktrees/jg042-performance/verify-fff71e0`, detached at the same HEAD, tracked tree clean |
| Exact candidate artifact | `C:/Users/Markimus/.codex/worktrees/jg042-performance/verify-fff71e0/dist` |
| Artifact manifest SHA-256 | `f624a566bd5571ecef8a0dab052d7b13dc066efc11452f3241b241836c6b7bef` |
| Inventory | 156 files; 105,943,955 bytes |
| Lockfile SHA-256 | `82b0bf11b1a784134483ff33c82ff4c06d069abcc23571607fea83ca3566be4f` |
| Candidate torque entry | `/assets/torque-wrench-Cph-EaWd.js` |
| Candidate torque Scene | `/assets/Scene-CqjR5e0C.js` |
| Candidate home entry | `/assets/home-d0roOqed.js` |
| Candidate QM entry / Scene | `/assets/quiet-machine-hZhR18uC.js` / `/assets/QuietMachineScene-Dvev3np1.js` |
| Cloudflare project | `jgun-portfolio` |
| Canonical production deployment | `e796fe69-b95b-4de9-93b1-cdfd2844b343`, deploy stage successful |
| Live source metadata | `f83f4ba3c380ee93da105ea0d102d3bc08cc5a31`, clean, ad hoc trigger labelled `main` |
| Live torque entry | `/assets/torque-wrench-BsY9og6w.js` |
| Live torque Scene | `/assets/Scene-CgT8NRm_.js` |

The Cloudflare project reports `source: null` and production branch `main`; the
existing deployment was ad hoc. The Git branch push and Cloudflare upload are
distinct delivery actions. The `main` label in deployment metadata does not make
the legacy Git main branch the candidate source.

HTTP GET checks against `https://studiomark.dev/torque-wrench/`,
`https://www.studiomark.dev/torque-wrench/` and
`https://e796fe69.jgun-portfolio.pages.dev/torque-wrench/` all resolved successfully;
the apex redirected to www. Each returned the same HTML, entry and Scene bytes,
with HTTP 200 for HTML and both JavaScript files:

- HTML SHA-256: `b71ac739469972db65118401640a1dd6a4c8c397b29fd1437a914463be8f60fc`.
- Entry SHA-256: `fee2ae69e07a4219ddb92fd39b1f5a68e91bc3e54e1dfb3f83c0abfb98065eeb`.
- Scene SHA-256: `504ce68129d1ad32a9da1115b024d24ef6d34e0ba27b03a15b617486d09ee706`;
  898,364 bytes, `application/javascript`.

Live and local remain different releases. Their timing records must stay separate.

## Exact artifact revalidation in this continuation

Recomputed every retained production file's byte count and SHA-256, sorted the
full inventory using the owning identity script's ordering, and hashed its JSON.
The complete inventory exactly equals [candidate-final-identity.json](candidate-final-identity.json).
All 156 files also equal the retained clean baseline artifact at
`C:/Users/Markimus/.codex/worktrees/jg042-performance/baseline-dist`.

All 396 source-input hashes and the lockfile hash match in the isolated
verification checkout. The original checkout has the same input path set and
lockfile; 128 raw source hashes differ only in LF/CRLF representation, with zero
other content differences after line-ending normalization. The exact artifact
identity belongs to the isolated checkout and retained dist; it is not a claim
that a new build of the shared checkout was performed.

Re-ran the committed `scripts/verify-launch-dist.mjs` under Node against that
retained dist: **PASS**, 156 files, 53 required assets present, zero M249. No
rebuild was needed because all retained bytes still match. No preview server was
started by this continuation.

## What the owner would be reviewing

The three JG-042 commits are `fff71e0988de6d461c308c4ed8f31813f24329ad`,
`aa4814b9dd41920542c2b89f190d85a73bfa89eb`, and
`8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a`, on baseline
`6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`.

They deliver source/lock/artifact-bound measurement tooling, corrected cold/repeat
and cache-condition evidence, focused Node checks, and four precise build
exclusions:

- `fonts/gentilis_bold.typeface.json`.
- `video/studiomark-showcase-precision-revealed-poster.jpg`.
- `video/studiomark-showcase-precision-revealed.mp4`.
- `video/studiomark-showcase-precision-revealed.webm`.

The existing M249 exclusion remains. Original media are preserved. A prior build
using the original workspace inventory proved that these four exclusions prevent
54,677,651 bytes of local-only contamination. The clean baseline and candidate
production files are identical: **this is build hygiene, with no demonstrated
page-speed gain.** JG-042 changed no application runtime, model, dependency,
cache policy or model URL.

The full candidate also includes earlier work since live source `f83f4ba3`:
JG-040 HUD copy, mode pills, physical stage numbering, torque-path tracker and FOS
cutoff work; JG-041 maintenance/dependency declarations and documentation; and
merged showreel/logo/armament assets and source. Git reports 19 reachable commits
(including a merge) and 233 changed paths between the live source and candidate.
This is the complete branch candidate, not a release containing only JG-042.
Tracked showreel/bumper assets and referenced road textures remain included;
excluding them is deferred pending lane coordination. Existing showreel rework
directions remain open. Review of this package does not certify that lane complete.

## Verification and measurements

The [final committed-tree receipt](final-commit-verification.md) records exact
source `8d8f045b`: isolated typecheck exit 0, pure Node checks **42/42 PASS**, and
production build exit 0 (794 modules). Those checks were executed in the preceding
session; this continuation revalidated source/artifact hashes and the asset gate.
The existing large-chunk build warning remains.

Historical natural-startup observations below are medians of five observations
per condition, in milliseconds, rounded to the nearest millisecond. They are
local lab observations on the artifact now retained, not new measurements of
final source or live production and not an A/B speedup comparison.

| Profile / route | Fresh-context cold | Same-context repeat | Record |
| --- | ---: | ---: | --- |
| Desktop / home | 7,524 | 8,030 | Paired baseline |
| Desktop / quiet-machine | 1,831 | 1,777 | Paired baseline |
| Desktop / torque-wrench | 15,010 | 21,424 | Paired baseline |
| Narrow / home | 4,712 | 5,027 | Paired baseline |
| Narrow / quiet-machine | 1,984 | 1,931 | Paired baseline |
| Narrow / torque-wrench | 17,042 | 15,160 | Separate uncontended replacement |

The [paired baseline summary](paired-baseline/summary.json) names source
`6ec4fe06`; the [replacement summary](narrow-torque-uncontended/summary.json) names
`fff71e09`. Both bind to the exact artifact manifest above. The original roster
was 60/60 functionally valid, but all ten original narrow-torque timing values
are excluded for tail overlap with a build: 50 original timing records remain
eligible. The separate replacement roster was 10/10 functionally valid. Keep the
groups separate and preserve the raw excluded rows.

Readiness has up to 1,000 ms polling resolution plus evaluation latency. Home
readiness is DOM-only; home/QM input checks establish document movement, not pixel
response. Narrow profiles emulate a viewport on desktop hardware, not physical
mobile. Variability is substantial and repeats are not consistently faster.

Cache-condition diagnostics passed **6/6**, then **6/6** again after identity
hardening. Valid drawing cache uses the precomputed path; missing/stale fixtures
intentionally share the fallback outcome. Interception disables browser HTTP
caching, so these are functional diagnostics, not warm-cache timing evidence.

Corrected attribution capture reached both `snapshot().ready` and
`inspection.ready`, with forward/reverse checkpoints through .62–.825; observed
AMD Radeon 780M / ANGLE D3D11, full tier. This is focused functional evidence,
not a full cinematic or visual acceptance roster.

## Cache decision, deferred work and historical failures

Cache headers, model URLs and runtime behavior stay as verified. No immutable
caching was added to a mutable model URL. A future model export requires a new
versioned URL and compatible companion references.

| Plan item | Current disposition |
| --- | --- |
| P04 attribution | Study GLBs fetched after scroll input in observed paths. Isolated decode/prep, GPU execution, energy and hidden-tab cost attribution remain unresolved. |
| P05 model export | Deferred: no re-export, decoded expansion proof, readiness gain or parity evidence; inspect CLI failed ENOVERSIONS. |
| P06 loader removal | Deferred: prerequisite inventory exists, but no measured production-byte reduction and complete full/lite/QM readiness comparison. |
| P07 ContactRope DPR 3→2 | Deferred, not adopted; owner perceptual parity required before adoption. |
| P08 study fetch deferral | Closed without implementation for observed already-late paths; no additional startup saving established. |
| P09 R3F / three upgrades | Both deferred; no reproduced application defect or measured benefit justifies adoption here. |
| P10 independent review | Fresh Sonnet follow-up ACCEPT after corrections. Two delivered rounds; reviewer used a bounded pack and ran no checks. Parent executed verification. No third review pending. |
| P11 | This package is prepared; separate exact-candidate owner approval is still absent. |

Preserve these negative and incomplete results:

- Superseded research narrow-torque rows were **INVALID**, using `/torque/`
  fallback; old warm labels/wait signatures were invalid. Do not use them as
  current measurements.
- Two early replacement-harness smoke attempts remain **INVALID**; the third
  smoke passed 2/2. Corrections do not erase the failed attempts.
- The initial attribution capture remains partial/historical: one clock lagged
  at a checkpoint and boot byte checks contended with measurement. Its timings
  do not establish CPU/decode causation.
- The first delivered Sonnet report was **CHANGES_REQUIRED**, despite its
  historical `fresh-review-sonnet-final.md` filename. The separate follow-up is
  ACCEPT. Failed/unavailable GLM and DeepSeek attempts supply no verdict.
- Full Lean-V1 / contract-18 budgets, full cinematic gates, shader compilation,
  isolated decode/prep, GPU, energy, hidden-tab, physical-mobile and final owner
  visual acceptance remain unverified. Existing historical failures/deferred
  phone framing and provisional HUD directions are not converted to passes.

## Rollback and owner decision boundary

There is no deployment change to roll back now. For a future approved upload,
retain canonical production deployment `e796fe69-b95b-4de9-93b1-cdfd2844b343` as
the preceding release. Deployment rollback would restore that complete release
with its compatible model references; use the official Pages rollback contract
and recheck public identity at that time. No rollback API action was executed.

Source rollback is different: revert only the three JG-042 commits, newest first,
in new history, preserving unrelated/concurrent work, then verify and build the
result in isolation. That would undo JG-042 tooling/exclusions; it would not restore
the entire branch to the currently live source. Do not reset or force-push the
shared branch.

Mark may review this exact WIP source/artifact for P11 or select one deferred
experiment for further work. Deployment/publishing remains unauthorized unless
Mark explicitly changes that boundary after review. Any later release must
revalidate identities, follow the deployment runbook, choose the actual verified
upload command, and verify public URLs. A source/artifact change creates a new
candidate and needs an updated review package.

This package is a local, untracked review document. The final receipt and full
identity manifest are also local verification outputs; their presence here does
not imply they were in the earlier GitHub push. No concurrent media, scratch,
JG-041 or other lane files were staged, removed or rewritten.

## Evidence pointers

- [Accepted plan](../../plans/JG-042-portfolio-performance.md).
- [Execution evidence index](README.md), [integration](integration.md), and
  [verification results](verification-results.md).
- [Final isolated receipt](final-commit-verification.md) and
  [complete final identity](candidate-final-identity.json).
- [Attribution and dispositions](attribution-and-dispositions.md) and
  [experiment prerequisites](experiment-prerequisites.md).
- [Review disposition](review-disposition.md), [review receipt](review-receipt.md),
  [initial review](fresh-review-sonnet-final.md), and
  [ACCEPT follow-up](fresh-review-sonnet-followup.md).
- [Owner WIP/visual policy](../../../context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md).
