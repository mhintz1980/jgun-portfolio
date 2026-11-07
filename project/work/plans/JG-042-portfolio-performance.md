# JG-042 — Portfolio performance plan (accepted 2026-11-06)

Status: ACCEPTED by Mark's receiving implementation prompt on 2026-11-06; P01–P10 conditional implementation and normal Task Intake authorized. After receiving the exact P11 candidate, Mark explicitly authorized deployment and necessary task actions on 2026-11-06. Release execution is recorded separately below.
Implementation status: bounded tooling/hygiene work executed and verified; fresh implementation review ACCEPT. P05/P06/P07/P09 deferred without adoption, P08 already-late path closed without change, P04 cost attribution and full performance-budget acceptance remain unresolved. P11 fulfilled for the owner-approved WIP candidate: production `00413abd` from source `8d8f045b`, verified 2026-11-07 (9/9 live publication smoke, 126/126 HTTP checks; [release execution](../evidence/JG-042-portfolio-performance/release-2026-11-06/README.md)). Overall task remains open; no speedup or final visual acceptance claimed. See [execution evidence](../evidence/JG-042-portfolio-performance/README.md). Generated from
Astra gpt-6-astra/xhigh strategic review (thread 01a1b020-7312-7462-8550-01da059929bb, zero tool
calls; raw output: evidence/portfolio-performance-2026-11-06/astra-review.md) over the validated
evidence set (repo-evidence + checker FINAL + deployed FINAL + recent-research + measured runs).

## 0. Baseline and identities (revalidate before any work)
- Local at plan time: HEAD 6ec4fe06 (merge origin/showreel-v3 into torque-wrench/rebuild), branch
  ahead 3, dirty tree (untracked evidence/scratch/public media).
- Live: deployment e796fe69 (2026-11-04, source f83f4ba3); live hashes torque-wrench-BsY9og6w.js /
  Scene-CgT8NRm_.js. Local dist (w7MdO7Wl / RwGtGsQb) has unverified build provenance; its source
  and build time were not recorded. Build a fresh isolated candidate in P01. Shared-hash matches
  (pageFade B4IAVBtS) do not prove whole-build identity.
- Validated measurements: torque desktop 1 cold (ready 5,829 ms; 27 requests; ~17.1 MiB transfer;
  15 long tasks totaling 8.18 s across a 10.6 s window — pre-ready ~3.7 s, one 2.353 s post-ready
  failed-scroll task, NO attribution), home desktop 4 cold (LCP 980/584/572/680 ms; CLS ~0.017),
  home narrow 1 cold (LCP 504 ms). No narrow-torque (rows hit /torque/ fallback — INVALID), no QM,
  no warm samples. Harness: Playwright 1.56.1 bundled Chromium (Chrome version unrecorded), GPU
  headless on AMD 780M, emulated viewport, throttled:false — lab-only evidence.
- Dominant payload: Default.glb 10,672,957 B live (no content-encoding, max-age=86400 + ETag),
  jgun-sheet-v2.bin.gz 4.01 MiB (max-age=0 must-revalidate), knurling-tool.glb 1.72 MiB,
  manufacturing-core 0.65 MiB — whether knurl/core are eager vs window-tail is UNRESOLVED (P04).
- Readiness (snapshot().ready + inspection.ready) is the repo metric; DOM LCP measures the shell
  only. inspection.ready was never reached in the captured run.

## 1. Audit summary (Astra Part A, condensed)
Solid: identity separation; caching broadly appropriate (hashed immutable 1y; HTML/sheet revalidate;
Default.glb 1-day + ETag; re-export needs a compatible cache/URL decision); ~111 MB video (tracked
showreel/bumpers plus ~52.8 MB untracked showcase assets), local-only gentilis font and ~15 MB
tracked road textures are a next-build
deploy/storage hazard (zero page-speed effect today — browsers never request them); shell LCP and
model readiness are different outcomes. Needs re-measurement: long-task attribution (CPU-bound claim
rejected; parse/Draco/GPU unproven), generalization beyond the n-of-one torque run, home long-task
investigation. Unresolved: knurl/core eagerness; live Scene chunk size. Discarded: /torque/ fallback
rows, mislabeled warm-home, blanket QM demand-mode work, shaft-tier leak (already tier-selected),
QM extra-parts deferral as ordinary optimization (owner decision — explain-only), CPU-bound
attribution, upgrade-as-ROI framing, ~300 ms Suspense claim as anything but a minor unverified
hypothesis.

## 2. Ordered implementation plan (Astra P01–P11; budgets are engineering-hour estimates)
Labels P01–P11 are plan labels, not issue IDs. Commands are proposed local invocations — confirm
interfaces in P01. Stage only each step’s explicit files; preserve concurrent lanes. TODO/INDEX
are untouched in this research session; normal Task Intake is authorized by the receiving prompt.

**P01 — Pin identities and ownership. Wave 0. Deps: none. Owner: release coordinator.**
Commands: `git status --short --branch`; `git rev-parse HEAD`; `git log --oneline origin/showreel-v3..HEAD`;
review package.json + measure.mjs; choose and record the intended current source after revalidation,
then establish an isolated checkout preserving the dirty
workspace; record live source/deploy/hashes, baseline source, dependency lock, build settings, lane
ownership (JG-041, showreel/logo). Budget 1–2 h. Acceptance: every later result cites source + built
assets. Confidence high. Rollback: remove the isolated checkout/records. Gate: no.

**P02 — Repair and codify the measurement contract. Wave 0. Deps: P01. Owner: harness
(measure.mjs, scripts/verify-torque-performance-contract.mjs).**
Make the contract reject fallback routes and missing identity; distinguish fresh-profile cold from
same-profile repeat; record actual browser version, tier, DPR, cache state, viewport, scroll success;
separate windows for HTTP transfer, boot/model prep, scene-ready, sustained scroll, idle. Initial
sampling budget: 5 cold/repeat pairs per chosen profile. Budget 4–6 h. Acceptance: Lean-V1 cold
roster + separate warm runs produce labeled comparable records. Confidence high. Rollback: revert
harness changes. Gate: no.

**P03 — Next-build media hygiene. Wave 1. Deps: P01–P02. Owner: build/excludePublicAssets.ts,
coordinated with video/logo/showreel + JG-041 owners.**
Targeted exclusions for unreferenced video (~111 MB) and the local-only font; tracked road textures
are a separate decision after reference/lane checks. Validate the filter against the ORIGINAL
workspace inventory (a clean checkout would conceal the untracked-media problem); never incidentally
stage the untracked showcase media. Tracked showreel/bumper exclusions require lane coordination.
Commands: edit exclusion list; `npm run build`; `rg --files dist`; stage only the exclusion
change. Budget 1–3 h. Acceptance: intended artifact excludes unauthorized material; required route
assets resolve; resulting build becomes the local experiment baseline. Confidence high (hygiene only,
no load-speed claim). Rollback: revert the exclusion change. Gate: no.

**P04 — Resolve attribution and late-study timing. Wave 1. Deps: P02–P03. Owner: harness +
temporary instrumentation.**
Capture request initiators/timing, model-prep spans, main-thread traces, rendering/GPU evidence; do
not infer GPU cost from JS task duration; exercise the .62–.825 study band to reach inspection.ready;
measure sustained scroll and stationary windows; hidden-tab behavior as energy proxy. Commands:
confirmed measure.mjs invocation; `rg -n "knurling-tool|manufacturing-core|inspection.ready" src`.
Budget 3–6 h. Acceptance: boot-critical vs later requests classified, else explicitly unresolved.
Confidence high (diagnostic value). Rollback: remove temporary instrumentation. Gate: measurement only.

**P05 — Constrained Default.glb export test. Wave 2. Deps: P04. Owner: model-export owner.
EXPERIMENT.**
`npx --no-install gltf-transform inspect public/models/Default.glb` first; preserve D1-AP names,
~13k load-bearing mesh expansions, primitive uniqueness; M249/MSP untouched (msp Blender-only);
accepted export ships under a NEW model URL with existing cache policy. Budget 8–16 h. Acceptance:
role-map + D1-AP tests pass, draw calls unchanged, visual parity, paired decode/prep + readiness
improvement beyond run variation — bytes alone never justify adoption. Confidence medium/low
(feasibility/benefit). Rollback: restore prior URL/reference + export. Gate: yes.

**P06 — Loader dependency removal test (KTX2/Meshopt). Wave 2. Deps: P04 + profile inspection;
independent of P05. EXPERIMENT.**
Inventory all assets reached through shared loaders (both tiers + QM) before removing anything;
preserve Draco dedupe + decoder path. Budget 3–6 h. Acceptance: measured production bytes drop, no
decode failures/404s, readiness within baseline variation. Confidence medium-low. Rollback: restore
imports/config, rebuild. Gate: yes.

**P07 — ContactRope DPR 3→2. Wave 2. Deps: P03–P04. Owner: ContactRope.tsx + home visual review.
EXPERIMENT (bounded visual, not arbitrary downgrade).**
Local comparison first; owner perceptual-parity check REQUIRED before adoption; fixed capture
conditions. Budget 1–3 h. Acceptance: owner-approved appearance + measured improvement in rendering
work or frame timing; if only appearance verified, performance result stays unresolved. Confidence
medium. Rollback: restore cap 3. Gate: yes.

**P08 — Conditional study-asset deferral. Wave 2. Deps: P04 confirms eager fetch + owner-relevant
cost. EXPERIMENT.**
If requests already occur late, close without implementation. Otherwise test loading early enough to
cover measured prep time before study entry, preserving tier selection and deterministic clocks.
Budget 4–8 h if eligible. Acceptance: startup improves with no blank study entry, no failed
fast/reverse scroll, no delayed inspection.ready, unchanged tier fetches; cold + repeat tested.
Confidence low until timing exists. Rollback: restore fetch initiation. Gate: yes.

**P09 — Dependency upgrades, separate lanes. Wave 2, lower priority. Deps: stable P03 baseline +
per-dep justification. EXPERIMENT.**
R3F 9.8.2 and three r187 are version facts only — benefits unproven. Check exact release changes
against current source usage; evaluate each independently, combine only if both qualify; stay off
v10 alpha. Commands: `npm view ...` then `npm install --save-exact ...` conditionally; full test +
build roster. Budget 3–6 h per dependency. Acceptance: documented compatibility/correctness or
measured benefit with roster passing. Confidence: availability high, performance benefit low.
Rollback: restore manifest+lockfile per lane. Gate: yes.

**P10 — Integration + fresh review. Wave 3. Deps: P05–P09 resolved (accepted/rejected/deferred).**
One production artifact against the pinned LOCAL baseline; verify visual parity, both readiness
gates, cache/URL behavior, exclusions, absence of unintended lane changes; fresh reviewer challenges
identity/attribution/model evidence. NOTE: DeepSeek adversarial review of this plan was UNAVAILABLE
after two HTTP 429 failures; no retry is pending. P10 requires a qualified fresh implementation
reviewer. Deferred optional experiments do not block an incremental verified WIP candidate; integrate
and review only the accepted changes in that candidate. Budget 4–6 h.
Acceptance: reproducible results, material findings resolved, remaining limitations listed.
Rollback: revert only this work's own accepted commits with `git revert`, then rebuild; never rewrite
shared history or remove others' changes. Gate: no new experiments.

**P11 — Separate release approval gate. Wave 4. Deps: P10. Owner: release owner (Mark).**
Present exact candidate source, artifact identity, accepted changes, measurements, limitations,
cache decision, rollback path; obtain approval only after this reviewable package exists; choose the
verified deployment command at that point. WIP publication allowed (owner policy 2026-10-31);
finished site not a prerequisite. Budget 0.5–1 h prep. Rollback: restore preceding deployable
artifact + compatible model references.

## 3. Assumptions (from Astra)
Scripts/tooling verified before use (commands above are not execution records); budgets/samples are
planning estimates; owner + fresh reviewer + devices assumed available — otherwise conclusions stay
lab-only; experiment success requires evidence beyond run variability; no invented thresholds;
no RUM infra, framework migration, blanket demand-render, or cloud sync-assets included.

## 4. Status boundaries
Accepted as JG-042. Research provenance and original receiving prompt remain in the original workspace's portfolio-performance-2026-11-06 evidence/inbox. TODO and registry updated in the isolated implementation branch. P01–P10 results are reported separately in the execution evidence. P11 was initially unapproved; Mark granted separate exact-candidate release authorization after reviewing the P11 package on 2026-11-06. The release execution record distinguishes authorization from actual deployment and verification. Full performance acceptance remains open.

## 5. Execution and lane decisions

Review routing update: GLM-5.3/high review returned no content before its 180-second deadline. Mark selected replacement `anthropic/claude-sonnet-5-5` / high for a bounded P10 review, at most one correction follow-up. Worker GLM contexts were stopped without deliverables; parent completed implementation. No silent model substitution or pending retry.

Source baseline `6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`; isolated branch `codex/jg042-performance`. Original dirty workspace preserved. Tracked showreel/bumper exclusions deferred pending lane coordination; road textures referenced by the logo lane remain. Apply only narrow local-only showcase/font exclusions. No runtime/caching/dependency change without experiment acceptance.

Owner selected saved codex-tiers setup: worker `zai/glm-5.3-flash` / high, fresh reviewer `zai/glm-5.3` / high; balanced OpenAI preference, standard review, overall approval off. Exact IDs/efforts callable; backend effort not independently observable; quota/pricing unverified. DeepSeek review unavailable after two 429s, no retry pending.
