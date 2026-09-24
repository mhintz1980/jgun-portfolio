# Mid-path ruling executed, reviewed SHIP×2 — awaiting owner ruling

Executes handoff 19 §2/§3 (owner mid-path ruling 2026-09-23 ~17:30). Branch
`codex/jg033-signature-shot` @ `6510b9e`; all work uncommitted in tree (fix1 entry +
mid-path are ONE deliverable — staging the three files stages both, by design).

## 1. What shipped in the tree

- `src/scene/rl300/flow.ts` — `SPINES.main` now 19 points: waypoints 0–4 (owner-approved
  entry) unchanged; 5 apex just aft of the cut; 6–7 descending forward to the hairpin tip
  under the canopy leading edge; 8–9 the loop back up and aft; 10 out through the pocket
  mouth; 11–13 turning aft under the canopy lip; 14–16 the long aft descent; 17–18
  descending to `[-.327, 1.003, -.727]`, which sits on the merged discharge spine
  (measured ≈ .0024 from the merged curve; test pins ≤ .005). `lower`/`merged` untouched.
  Architect design metrics (sweep `.scratch/entry-fix/midpath/{sweep,opt,gen,final}.*`):
  max 28 mm off the owner's red curve, min curvature radius 58 mm, max 11° between
  rendered segments, 30 mm min wall clearance.
- `src/scene/rl300/AirRibbons.tsx` — `AIR_SAMPLES` 72 → 144 (exported; 72 was too coarse
  on the hairpin: 21°/segment); per-sample world-up ribbon frame replaced by
  `transportFrames` parallel transport (anchor = first non-steep sample keeps the legacy
  frame there, forward+backward projection propagation, legacy fallback below 1e-6).
  Kills the sideways ribbon flip (up to 61 mm in one sample) at every |tangent.y| ≥ .92
  switch. Entry fan offsets preserved to 1.4e-16 (architect + reviewer measured).
- `src/scene/rl300/preview.test.ts` — corridor test re-mapped to 19 points; new test
  `follows the owner mid-path ruling…` (fidelity ±.035 both directions vs OWNER_MID_RED,
  smoothness ≤ 15° turn / ≥ .050 circumradius, solid-edge wall clearance ≥ .015, merged
  handoff ≤ .005); new test `moves every ribbon continuously…` (offset jump ≤ .015 —
  legacy frame fails at .0609, so it has teeth); entry-band test now uses AIR_SAMPLES.

## 2. Pair-dispatch record

| Seat | Vendor/model | Outcome | Proof |
|---|---|---|---|
| midpath-impl (18:41–19:05, 1420 s) | GLM `zai/glm-5.3-flash` via ocx/codex | implemented all three files; own verify: tsc clean, vitest 91 passed (1 scratch copy of the test it made mid-run failed the file-level run — spurious, copy since deleted) | seatwrap ledger `midpath-impl`; ocx-logs.json (glm-5.3-flash, 200s) |
| midpath review (2nd attempt 19:15–19:45) | DeepSeek `deepseek/deepseek-flash` | **SHIP** — see §3 | review-deepseek2.log; ocx logs conv k8340a…, 69 rows HTTP 200 |
| fix1 review (pending from handoff 19) | GLM `zai/glm-5.3-flash` | **SHIP** — 3 minors, folded into the guard fix / record below | review-glm-fix1.report.md |
| midpath-guards (19:52–19:55) | DeepSeek | 4 non-vacuity guards applied exactly as spec'd; own verify tsc 0, 9 files/94 tests/0 failed; 20,010 tokens | spec `.scratch/entry-fix/midpath/spec-guards.txt`, ledger `midpath-guards` |
| guards review (19:57–20:06) | GLM `zai/glm-5.3-flash` | **SHIP, zero defects** — 6 failed attacks, executed teeth harness (each guard throws under forced vacuity while the old assertions pass vacuously on Infinity), diff-faithfulness proven byte-level | review-glm-guards.{log,report.md}; ocx logs zai rows |

Guard-seat incident (architect-side): the seat wrote its added lines with bare LF into the
CRLF file (27 bare-LF lines); the guards spec had dropped the impl spec's line-endings
constraint. Architect normalized the file back to uniform CRLF (367/0) — content
untouched — and re-ran gates (tsc 0, 94/94). The reviewer verified no bare LF remains.
Guard-only diff for review: `guards.diff` (+11/−2), pre-image
`review-guards/pre-preview.test.ts.pre` (renamed from `.ts` after the GLM reviewer showed
vitest's default include collects it and it fails to load — its `./prepareModel` import
can't resolve from that directory; content preserved).

**Final suite state (architect, 20:11): `npx vitest run --configLoader runner` = 10 files /
97 tests / 0 failed** — 8 src files / 91 tests plus two PASSING review harnesses under
.scratch (`review-fix1/teeth.test.ts` +3, `review-guards/vacuity.test.ts` +3). Untracked,
local-only; they will disappear when .scratch is cleaned. tsc exit 0.

seatwrap note: `midpath-guards` row shows `verify_rerun_exit=1` — the wrapper's re-run of
`npx tsc --noEmit && npx vitest run` dies on Windows cmd `&&` quoting ("fails was
unexpected at this time"); it is a wrapper-shell artifact, not a test failure. Seat's own
run + architect re-run both green.

Orchestration notes: the dispatching session died ~19:42; the DeepSeek review process was
orphaned but ran to completion and wrote its verdict at 19:45 — recovered by this session,
no re-dispatch needed. First review attempt died to provider rate limits (resume spec
`spec-review-resume.txt`). Reviewer's diff-faithfulness attack resolved by its own
`diffcheck.out`: impl.diff (143/33) is the mid-path-only delta vs the fix1 base snapshot;
live `git diff HEAD` (209/34) = fix1 + mid-path; `implDiffHasButGitLacks` empty.

## 3. Review findings (both SHIP)

DeepSeek (mid-path), 9 failed attacks with executed evidence (probes under
`.scratch/entry-fix/midpath/review/`): waypoints byte-exact; transport algorithm
line-by-line correct, 0 fallbacks on real spines, handedness +1 everywhere; NaN/degenerate
paths clean; entry preservation 1.4e-16; no frame aliasing (0.0 vs fresh-vector
reference); continuity teeth real; no vacuous ranges; mutation sensitivity proven at
predicate level (old 13-pt spine → 0.305 ≫ .035); nothing in src/scripts assumed 72
samples; scope clean.

- **minor (fixed, reviewed SHIP)**: wall-loop `exit` unguarded → latent vacuity. Fixed by
  the guard seat together with the fix1 review's two vacuity findings (envelope minima,
  entryEnd); GLM adversarial review of the guards: SHIP, zero defects, teeth executed.
- **minor (owner-note, no action)**: entry *centerline* shifts ≤ 1.93 mm in its last
  ~30 mm (z .87–1.55; 0.7 mm for z ≥ 1.0) because re-fitting waypoint 5 re-parameterizes
  the Catmull-Rom tangent at approved waypoint 4. Entry *offsets* exactly preserved; the
  frame change contributes exactly 0. Inherent to the architect's own waypoints; fix only
  if ±2 mm at z ≈ .9 matters to the owner (would require duplicating waypoint 4).

GLM (fix1): (1) corridor-test edit beyond spec's "do not change" was a spec-vs-history
artifact — the spec's claimed pre-state never existed in git; edit is the exact index
shift. Recorded, no action. (2)+(3) envelope-minima and `entryEnd` vacuity → fixed by the
guard seat. Cosmetic leftover: the entry-test wall-gate comment ("belongs to the unchanged
corridor waypoints") is stale on the 19-point spine.

## 4. Verification state (architect; final pass 20:11)

- `npx tsc --noEmit` — exit 0. `npx vitest run --configLoader runner` — **10 files /
  97 tests / 0 failed** (src = 8 files / 91; +6 from two passing review harnesses under
  .scratch — untracked, local-only; see §2 final suite note).
- Build + server: dist rebuilt 19:05–19:08, :4173 restarted after rebuild (house rule),
  listening. Tree unchanged since (test-only work after).
- Captures: `.scratch/entry-fix/midpath/{before,after}/study-u0_{05,34,4,425,45,51,7,82,95}.png`
  (before = served fix0 build; after = fix1+mid-path), `compare-u0_425.png` (owner ruling
  | before | after contact sheet), `overlay-u0_425.png`, `pixdiff.json`: **0.000% changed
  at u .05/.95** (no-ribbon stops), 0.559–1.899% at mid stops, bboxes confined to the duct
  corridor — changes beyond ribbons ≈ 0.

## 5. Owner packet (this is what Mark rules on)

- `.scratch/entry-fix/midpath/compare-u0_425.png` — ruling image | before | after at the
  ruling camera (u .425).
- Entry note (handoff 19 §1 decision 4): owner approved the ENTRY on the *fix0* build;
  the tree holds *fix1* (same shape, entry strand ~60 mm lower, riding his middle blue
  line). If he prefers the higher fix0 entry, relax the middle-strand pin threshold —
  never silently move pinned waypoints back.
- After owner approval: commit the three source files + this evidence doc together
  (both ruling PNGs are already tracked in `6510b9e`; NEVER commit `.scratch/`,
  `.codex/`, `.zcodeignore`), then route the Astra packet (handoff 18 §AFTER).

## 6. Still open (unchanged from handoff 19 §4)

JG-034 (blocks `verify-jg032-station2-thermal.mjs`), JG-033 main-page integration,
radiator-fan treatment, v4 node-rename pass. Spine-only change: triangle-census/AABB/
sha256 gates untouched.
