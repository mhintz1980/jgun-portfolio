# HANDOFF (2026-10-11c): look items closed, QM7 end card landed locally; S5 is another session's; next is an owner choice

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, HEAD `1f92aa3a` (QM7, local, not pushed). Untracked: `docs/HANDOFF-quiet-machine-2026-10-11b.md`, this file, `project/work/evidence/rl300-quiet-machine/38-s5-posters/` (**another session's S5 work, last written 15:35; do not touch**). Ports 4173/5199 free at the stop.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend, this session | **0 spawns, 0 Modal/GPU render jobs.** Orchestrator Sonnet 5.5 only; Advisor (Opus 5.5) called once (QM7 pre-build). One local Playwright capture run (4 viewports) plus the existing verifiers |
| Landed | `1f92aa3a` QM7: end card + the 4 measured defects, owner-approved by PNG, Astra not consulted |
| Closed rulings | reservoir tone, panel 2a tone, chevron visibility: all **keep as-is** (no re-render) |
| Not built | `IntakeHotspot.tsx` and `scripts/verify-qm-intake-hotspot.mjs` (the plan's QM7 row). Owner asked only for end card + defects |
| Owner decision pending | which next, see "Open items" |

## What QM7 changed (`1f92aa3a`)
- `src/shared/PageNav.tsx`: additive optional props `label` (default "Pages"), `numbered`, `currentAsText`. Defaults reproduce the old markup, so `PageNav.test.tsx` and the torque-side contract (receipt `92bafba5`) are unchanged. Index span is `shell-nav-index`, current row is `<span class="shell-nav-current" aria-current="page">` (only when the page has an href).
- `src/scene/rl300/QuietMachinePreview.tsx`: header nav `numbered currentAsText`; end card = `<h2>` "Closed again." + body "The section closes and the enclosure is whole: one sealed housing around the engine, with its air path worked out inside it." + nav `label="More pages" numbered currentAsText`.
- `src/scene/rl300/quiet-machine.css`: `.shell-nav-current`, `.shell-nav-index`, `.qm-endcard-title/-body`; `.qm-editorial` top `max(12vh, 120px)` at <=600px (header bottom is 104.5 px at 390 wide).
- `src/scene/rl300/preview.test.ts`: two existing tests retargeted (no new tests, per standing rule).
- Evidence (committed): `project/work/evidence/rl300-quiet-machine/39-qm7-endcard/` (4 end-card PNGs, header PNGs, `probes-header-endcard.json` sweep of 7 beats x 4 viewports: zero overlaps, end card fits the viewport).
- Gates run once at the final build: tsc 0; 703/703 tests; build 0; check:station2 0; U.1 clean; U.2 1 hunk 0 removed; U.4 `cssEqual` and `sourcesEqual` true; `verify-jg033-preview` exit 0 (known-stale lite warnings only); `verify-page-transition` PASS at 1440x900 and 390x844.

## Rulings in force (his words, 2026-10-10/11)
- Standing (REVISED 2026-10-11, after this handoff was written): new tests, gate scripts, mutation proofs or extra validation only as a swap for eliminating a redundant one; look for redundant or unnecessary tests and remove them; run existing gates once; do not reply to preference statements, just apply them (memory `feedback-minimal-testing`). Commit locally only after he approves PNGs; stage by explicit path; no push/PR/deploy.
- D1 stale `rl300-lite.glb` kept stale until QM9. D2 camera views approved. D3 end card copy option 1 (done). D4 structural items approved, scroll length unlocked, **900vh provisional** (`QM_LENGTH_VH`, one constant; the owner has not yet confirmed it on a forward recording).
- Torque wrench page and `public/models/msp-enclosure.glb` untouched. Visual effects elsewhere still need Astra; the "Astra not consulted" waiver was for the V16 track and he approved QM7 by PNG.
- S5 poster direction (ICM, 2026-10-11): owner wants the section-beat posters to show the CUT machine, from V16 Cycles stills via Modal (`C:\Projects\msp-render-pipeline-scene-prep`, manifest `jobs/rl300_18_still_v16_a.json`). Another session is doing it.

## Open items, none started
1. **S5 posters:** owned by the other session (`38-s5-posters/`). Verify its state with `git log` and file mtimes before touching anything near `public/images/rl300-*` or `POSTERS`/`beats.ts`.
2. **QM7b / QM10 (depends on S5):** repoint the poster writer (the `CAPTURE_POSTERS` block in `verify-jg033-preview.mjs`) and `POSTERS` to the new stills; delete the 3 old `rl300-{exterior,section,intake}-preview.png`.
3. **Motion/background plan** `docs/quiet-machine-motion-background-plan-2026-10-11.md`: S1 + S2a are committed (`40a0b353`, not verified by me). **S2b (beat-local timing, visual gate)**, S3 (per-section state, needs his ruling whether it may change the look), S4 (layered background, needs budget numbers and Astra per candidate) all need his stage-by-stage approval.
4. **IntakeHotspot** (QM7 row remainder): badge at the lower intake, click seeks .51; not asked for yet.
5. **V16 vs shipped frame shifts** (`35-v16-round-1/asset2/audit.md`): his call, not changed.
6. **QM9** lite policy / lite GLB regeneration.
7. **Header at phone width still wraps to 3 rows** (brand, label, nav): clearance is fixed, but if he wants it tighter that is a look ruling.

## Traps new this session
- **The trim hook eats long tool output.** Anything that needs its output read (tests, greps, probes) goes through `ctx_execute` with a printed summary.
- **Bash cwd persists and drifted twice** (once into the evidence dir). Use absolute paths.
- **`python`/`python3` hangs** here (Windows stub). Use node for scripted edits; a heredoc with `python - <<EOF ... || node` hangs on the python half.
- **`scripts/check-qm-jgun-assets.mjs` needs `--base-root` and `--new-root`** as well as the two out dirs: `node scripts/check-qm-jgun-assets.mjs C:/Users/Markimus/.buzz/REPOS/qm-u4/base C:/Users/Markimus/.buzz/REPOS/qm-u4/new --base-root C:/Users/Markimus/.buzz/REPOS/jgun-qm-base --new-root C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`; build the new dir with `npx vite build --sourcemap --manifest --emptyOutDir --outDir .../qm-u4/new`.
- Playwright from a script outside the repo: use `createRequire('<repo>/package.json')('playwright')`; do not import by bare name. Probe script was scratch, not kept.
- Preview helpers: `project/work/evidence/rl300-quiet-machine/35-v16-round-1/scripts/{start,stop}-preview.mjs` (pidfile, never match PIDs by command line). Probe `localhost`, not `127.0.0.1`. `verify-jg033-preview` takes `OUT=` and `BASE_URL=` env vars; `verify-page-transition` takes `--url= --viewport= --out=`.
- Carried: handoffs go stale in minutes when another session shares the branch, so run `git log --format='%h %ad %s' --date=iso -8` and `git status --short` first.

## Spawn ledger (this session)
| # | Work | Seat | Effort | Tokens |
|---|---|---|---|---|
| | none | | | 0 |
| | **This session** | | | **0 spawns** |
| | **All-time** | | | 2,975,689 (unchanged, handoff 11a) |

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration; HEAD should be 1f92aa3a or a descendant). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; another session shares this branch and is working on S5 posters (untracked project/work/evidence/rl300-quiet-machine/38-s5-posters/; do not touch it or public/images/rl300-*). Then read docs/HANDOFF-quiet-machine-2026-10-11c.md (all). QM7 (end card + 4 defects) and the three look rulings are done and approved; do not redo them.

Standing owner instruction (revised 2026-10-11): add new tests, gate scripts, mutation proofs or extra validation only if a previous test can be eliminated; look for redundant or unnecessary tests and remove them; run only the existing required gates once (typecheck, npm test, build, check:station2, U.1/U.2/U.4, verify-jg033-preview, verify-page-transition when the nav or fade is touched); do not reply to preference statements, just apply them. Costs and decisions in line one, model named. Use the advisor (Opus) before building and before declaring done; do small edits yourself rather than spawning.

Task: ask me ONE question, which to do next: (a) motion plan S2b beat-local timing (docs/quiet-machine-motion-background-plan-2026-10-11.md, needs my stage approval), (b) IntakeHotspot (badge at the lower intake, click seeks u .51), (c) QM9 lite policy / lite GLB regeneration, (d) V16 vs shipped frame shifts (35-v16-round-1/asset2/audit.md), (e) wait for the S5 poster session and then do QM7b/QM10 poster repoint. Do not start any before I answer.

Constraints: torque wrench page and public/models/msp-enclosure.glb untouched; no push, PR or deploy; stage by explicit path; commit only after I approve PNGs or say go; kill only PIDs you started; one GPU; verify every seat report yourself; visual effects need Astra.
```
