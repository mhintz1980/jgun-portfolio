# HANDOFF (2026-10-11d): S2b beat-local timing, intake hotspot and test-audit landed locally; next is an owner choice

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, local only, nothing pushed. HEAD is this handoff's own commit or a descendant of `8c646fbb`. Untracked: `project/work/evidence/rl300-quiet-machine/38-s5-posters/` (**another session's S5 work, last written 15:35; do not touch**). Ports 4173/5199 free at the stop.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend, this session | **0 spawns, 0 Modal/GPU render jobs.** Orchestrator Sonnet 5.5; Advisor (Opus 5.5) called 3 times (orchestration feasibility, hotspot pre-done, this wrap). Local Playwright captures only |
| Landed | `e2770620` S2b, `96b1099e` intake hotspot, `b4e3f156` plan ticks, `8c646fbb` test-audit (703 -> 700 tests) |
| Owner decision pending | which next, see "Open items" |
| Standing rule revised | tests/gates/proofs only as a swap for removing a redundant one; prune redundant tests; run existing required gates once (memory `feedback-minimal-testing`, ICM preferences) |

## What landed
- **S2b `e2770620`** `src/scene/rl300/beats.ts`: beats are authored beat-local. `BEAT_SPECS` carries `len` (ticks) per beat and every key `at` and window value in ticks from that beat's start; `resolveBeats` lays them end to end and resolves `(start + tick) / total`. At the authored total of 1000 ticks the resolved `BEATS`, `WINDOWS` and keys are **bit-identical** to the old literals (compared with a throwaway dump; no PNG exists because nothing changed visually). `Beat`, `BEATS`, `WINDOWS`, `collectKeys` keep their shapes, so no consumer changed. `phase` stays `u * 12` (owner ruling). Adding a beat re-spaces only by uniform compression unless `QM_LENGTH_VH` grows with it (the length knob is the owner's).
- **Hotspot `96b1099e`**: new `src/scene/rl300/IntakeHotspot.tsx` (imports only `react`, `./shot`, `./beats`; no `three`), mounted inside `.qm-stage` when not poster. Anchor `INTAKE_ANCHOR = [0, .172, .6275]` (intake group (0,.205,.03) + liner centre (0,-.033,.5975)). Click calls `navigate(INTAKE_SEEK)` where `INTAKE_SEEK` is the `second-breath` beat's first key (.51) and opens a card using that beat's note, title and caption. Escape and Close dismiss and return focus. Badge shows from `WINDOWS.cutOpen[1]` (.30) to `WINDOWS.cutClose[0]` (.90). Owner approved by PNG, Astra waived. Evidence `40-intake-hotspot/` (3 viewports x u .31/.51/.70/.82 + open card). Plain-math projection matched three's PerspectiveCamera to 0.0000 px in a throwaway check (not kept).
- **CAPTURE_POSTERS edit**: one line in `scripts/verify-jg033-preview.mjs` adds `.qm-hotspot-layer { display: none !important }` before the poster stage screenshot, so the badge is never baked into a poster. **The S5 session repoints that block**; keep that line when they do.
- **test-audit `8c646fbb`**: cut 3 tests (length-knob pin, `initialStudyMode` normal-motion duplicate, flow repeated-sample tautology), dropped a swallowed `expect` remnant, restated expects and brittle source regexes, and rebuilt the chevron `response` block from `WINDOWS`. `:96` (eager reservoir test) left. Report `41-test-audit/summary.md` + `findings.jsonl`. Two `documented-intent` tests (`:153` count pins, `:607` source pins) kept, "confirm before acting".
- Ledger sections for S2b and the hotspot appended to `qm-commit-gates.md`.

## Gates (last runs)
tsc 0; tests **700 passed** (plus the K5 flake below); build 0; check:station2 0; U.1 clean; U.2 `hunks=1 removed=0`; U.4 `cssEqual` true, `sourcesEqual` true; verify-jg033-preview exit 0, no errors. After the test-audit commit only tsc, `npm test` and U.1 were re-run (no runtime source changed). `verify-page-transition` not run (nav and fade untouched).

## Rulings in force
- Standing test rule as in line one. Commit locally only after he approves PNGs or says go; stage by explicit path; no push, PR or deploy.
- Visual effects elsewhere need Astra; he waived it for the V16 track, QM7, and the hotspot (PNG-only). Torque wrench page and `public/models/msp-enclosure.glb` untouched.
- D1 stale `rl300-lite.glb` kept stale until QM9. Scroll length unlocked, **`QM_LENGTH_VH` 900 provisional**, not yet confirmed on a forward recording.
- Open copy items he did not rule on (kept as shown): the hotspot card repeats the left column at u .51; badge window .30-.90 also shows on beat 06.

## Open items, none started
1. **S5 posters:** another session's (`38-s5-posters/`). Verify with `git log` and mtimes before touching `public/images/rl300-*`, `POSTERS` or `beats.ts` poster ids.
2. **QM7b/QM10 poster repoint** (depends on S5): repoint the `CAPTURE_POSTERS` writer and `POSTERS`, delete the 3 old `rl300-{exterior,section,intake}-preview.png`. (The hotspot commit is deliberately not called QM7b.)
3. **Motion plan S3** (per-section state, needs his ruling whether it may change the look) and **S4** (layered background, needs budget numbers and Astra per candidate). S2a and S2b are done.
4. **V16 vs shipped frame shifts** (`35-v16-round-1/asset2/audit.md`): his call.
5. **QM9** lite policy / lite GLB regeneration.
6. **Header at phone width still wraps to 3 rows**: clearance is fixed; tighter is a look ruling.
7. **Test debt left:** `:96` eager test; `shaft/camera.test.ts` K5 "is C0 across the timeline" times out at 5 s under full-suite load (passes alone in ~2 s; untouched file) -- raise its timeout or accept the flake.

## Traps (new or carried)
- `shellBoundary.test.ts` adds one case per file in `src/scene/rl300/`, so a new file moves the test total by +1 with no test written.
- **Files are CRLF.** A multi-line `old_string` in Edit and `$`/`.` in regex fail on `\r`. Use single-line anchors, or `[\s\S]*` in node.
- Heredocs eat backslashes (`replace(/\\/g` becomes a syntax error): write scratch scripts with `pathToFileURL`, not regex-escaped paths.
- The trim hook eats long tool output: route anything you must read through `ctx_execute` or a file tail. `python`/`python3` hangs (Windows stub): use node.
- `scripts/check-qm-jgun-assets.mjs` needs `--base-root` and `--new-root` plus the two out dirs: `node scripts/check-qm-jgun-assets.mjs C:/Users/Markimus/.buzz/REPOS/qm-u4/base <new> --base-root C:/Users/Markimus/.buzz/REPOS/jgun-qm-base --new-root .`; build `<new>` with `npx vite build --sourcemap --manifest --emptyOutDir --outDir <new>`. The `qm-preview` chunk's per-chunk `cssEqual: false` is expected; the top-level pair is the gate.
- Preview helpers: `project/work/evidence/rl300-quiet-machine/35-v16-round-1/scripts/{start,stop}-preview.mjs` (`--dist <repo>/dist --port 4173 --pidfile --log`; pidfile, never match PIDs by command line). Probe `localhost`. `verify-jg033-preview` takes `OUT=` and `BASE_URL=`.
- Playwright from a script outside the repo: `createRequire('<repo>/package.json')('playwright')`.
- Test-audit scanner `audit.mjs` needs `@babel/parser` next to it and `../all-audits/harness/excluded-dirs.json`; copied to scratch, not installed in the skill library.
- Handoffs go stale in minutes when another session shares the branch: run `git log --format='%h %ad %s' --date=iso -8` and `git status --short` first.

## Spawn ledger (this session)
| # | Work | Seat | Effort | Tokens |
|---|---|---|---|---|
| | none | | | 0 |
| | **This session** | | | **0 spawns** |
| | **All-time** | | | 2,975,689 (unchanged, handoff 11a) |

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration; HEAD should be the handoff 11d commit or a descendant). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; another session shares this worktree and is working on S5 posters (untracked project/work/evidence/rl300-quiet-machine/38-s5-posters/; do not touch it or public/images/rl300-*). Then read docs/HANDOFF-quiet-machine-2026-10-11d.md (all). S2b, the intake hotspot and the test-audit are done and approved; do not redo them.

Standing owner instruction (revised 2026-10-11): add new tests, gate scripts, mutation proofs or extra validation only if a previous test can be eliminated; look for redundant or unnecessary tests and remove them; run only the existing required gates once (typecheck, npm test, build, check:station2, U.1/U.2/U.4, verify-jg033-preview, verify-page-transition when the nav or fade is touched); do not reply to preference statements, just apply them. Costs and decisions in line one, model named. Use the advisor (Opus) before building and before declaring done; do small edits yourself rather than spawning.

Task: ask me ONE question, which to do next: (a) motion plan S3 per-section state (needs my ruling whether it may change the look), (b) QM9 lite policy / lite GLB regeneration, (c) V16 vs shipped frame shifts (35-v16-round-1/asset2/audit.md), (d) wait for the S5 poster session and then do the QM7b/QM10 poster repoint, (e) the K5 camera.test.ts timeout flake and the :96 eager test. Do not start any before I answer.

Constraints: torque wrench page and public/models/msp-enclosure.glb untouched; no push, PR or deploy; stage by explicit path; commit only after I approve PNGs or say go; kill only PIDs you started; one GPU; verify every seat report yourself; visual effects need Astra unless I waive it.
```
