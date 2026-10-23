# HANDOFF (2026-10-11e): QM9b lite GLB regenerated and landed locally; skip-caps-while-closed is next in QM9

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, local only, nothing pushed. The lite commit is `114c36b3` (`JG-033 QM9b (lite): ...`); the wrap commit sits on top of it. Untracked: `project/work/evidence/rl300-quiet-machine/38-s5-posters/` (**another session's S5 work, last written 15:35; do not touch**). Ports 4173/5199/5301/5302 free at the stop.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend, this session | **0 spawns, 0 GPU/Modal jobs**, about 17 s of local Blender 5.1, local builds and Playwright. Orchestrator Sonnet 5.5; Advisor (Opus 5.5) called 3 times (scope, pre-ask review, pre-done review) |
| Landed | `114c36b3` regenerated `rl300-lite.glb`, `KNOWN_STALE_LITE` removed; wrap commit: U.1 allowlist amendment plus this handoff |
| Owner decision pending | which next, see "Open items" (nothing blocking) |
| Astra | "Approved. Go" was taken as the waiver for the lite swap, and the owner confirmed it was right to run it |

## What landed
- **`114c36b3` QM9b (lite).** `scripts/build-jg033-lite.py` guards on the source hash (pin was `a48c12e5` = `fe8ca644`, 2026-09-22; `msp-enclosure.glb` became `c1c919ab` in `15fd4884`, 2026-09-24: +5 nodes `PUMP_HOUSING.001`, `PUMP_END_CASTSTEEL-1`, `PROPOSED_LOWER_INTAKE`, `PROPOSED_COLLECTOR_DUCT_OUTLET`, `V2RL300-SAF-1047-5_PROPOSED_LOUVERS`, and `DUCT_INTAKE_AIRWAY` 24 -> 28). The guard refused to run, which is why lite was stale. Re-pinned to `c1c919ab` in the builder and in `scripts/verify-jg033-lite-asset.mjs`; rebuilt with Blender 5.1 (same glTF exporter v5.1.19 as the old lite). Result: 245,092 -> 241,770 triangles (< 248k), 1,186,488 bytes, lite caps **152,008 = full**, airway 28 on both tiers, 560 occurrences, max transform delta 4e-7, 85/85/65/84 draw calls at 390x844 (gate < 90). V16 material mapping on lite unchanged (`mappedParts`, `mappedPrimitives`, `protectedPrimitives`, `v16Applied` identical).
- Verifier: `KNOWN_STALE_LITE`, `warnStale` and their comments removed from `verify-jg033-preview.mjs`; cap equality is a plain `assert.equal`; airway is `108 + 28` on both tiers. The RULING-only lite-vs-full compare stays (`keep` parts are still decimated).
- `v16Materials.test.ts` lite pins moved (`cappedTriangles` 152008, `batches` 43, `unmappedMultiSlot` 48). No test added.
- **Wrap commit:** U.1 allowlist in `project/work/plans/JG-033-quiet-machine-integration.md` (and the structure doc copy) now also lists `scripts/(build-jg033-lite\.py|verify-jg033-lite-asset\.mjs)$`, because the re-pin touches both. Owner ruled it.
- Evidence `42-qm9-lite/`: `summary.md`, `lite-before-after.png`, `lite-diff-crops.png` (before | after | changed mask), `lite-reassess.mjs` (hash history, node and triangle diff), `lite-probe.mjs`. Ledger section "QM9 lite GLB regeneration" in `qm-commit-gates.md`.

## Gates (last runs, at `114c36b3`)
tsc 0; npm test **701 passed** (50 files); build 0; check:station2 0; verify-jg033-preview exit 0, errors [], no stale warnings, `INTAKE_NDC.lite` unchanged (6.524); U.4 `cssEqual` true, `sourcesEqual` true (per-chunk `qm-preview` false is expected); U.2 `hunks=1 removed=0 first=<!-- shell:begin --> last=<!-- shell:end -->`. **U.1** listed the two lite scripts, which is now allowlisted; re-run it on the next commit to confirm it prints nothing and ends `U.1 grep exit: 1`. `verify-page-transition` not run (nav and fade untouched).

## Rulings in force
- Standing test rule: tests, gates and proofs only as a swap for removing a redundant one; run existing required gates once (memory `feedback-minimal-testing`). Commit locally only after he approves PNGs or says go; stage by explicit path; no push, PR or deploy.
- D1 is closed: lite regenerated. Scroll length unlocked, **`QM_LENGTH_VH` 900 provisional**, not confirmed on a forward recording.
- Torque wrench page and `public/models/msp-enclosure.glb` untouched.
- Unruled copy items (kept as shown): the hotspot card repeats the left column at u .51; badge window .30-.90 also shows on beat 06.

## Open items, none started
1. **QM9 proper: skip cap passes while the section is closed** (`SectionCaps.tsx`). Needs a zero-pixel-delta proof at closed u (a non-zero delta means caps were visible while "closed", a look change that needs his ruling). `probe.capTarget` is only set inside the cap's `onAfterRender`, so the verifier's `capTarget` asserts at u 0 / 1 must move to open anchors (an edit to an existing assert, not a new one). Lite policy itself already holds (DPR 1, no shadows, composer opt-in via `?composer=`, 9 ribbons at 390 wide from `RIBBON_COUNT`).
2. **QM8 attribution / GPU-6 triangle acceptance: deferred.** `scripts/measure-qm-render-passes.mjs` was never built; a new measurement script breaks the test rule unless a test is removed. The plan's "pass = triangles <= ~500k" is not demonstrated per device; say so rather than imply it.
3. **Unattributed look change:** at u 0 and .2 the lite roof panel and louver band show different highlights (a few edge pixels) after the regenerate. He approved the PNGs; no named part was found. Compare lite against full at 390x844 if it is ever questioned.
4. **Lite has no extras:** lite still skips `rl300-extra-parts.glb` (no gauge dials, fused MAN mesh); the regenerate does not change that tier difference. His call if he wants it.
5. **S5 posters:** another session's (`38-s5-posters/`). Verify with `git log` and mtimes before touching `public/images/rl300-*`, `POSTERS` or `beats.ts` poster ids. Then the **QM7b/QM10 poster repoint** (keep the `.qm-hotspot-layer { display: none !important }` line in the `CAPTURE_POSTERS` block).
6. **Motion plan S3** (per-section state, needs his ruling whether it may change the look) and **S4** (layered background, needs budget numbers and Astra per candidate).
7. **V16 vs shipped frame shifts** (`35-v16-round-1/asset2/audit.md`): his call.
8. **Header at phone width still wraps to 3 rows** (tighter is a look ruling).
9. **Test debt:** the eager "keeps reservoir occurrences on their CAD finish through the real prepareModel pipeline" test; `shaft/camera.test.ts` K5 "is C0 across the timeline" times out at 5 s under full-suite load (passes alone in ~2 s).

## Traps (new or carried)
- **The lite regenerate pipeline, if the source GLB changes again:** copy `build-jg033-lite.py` to scratch with `sed` on `^ROOT =`, `^OUTPUT =` and the hash pin, run `blender --background --factory-startup --python <copy>` (Blender 5.1, ~17 s), then run a scratch copy of `verify-jg033-lite-asset.mjs` with `three` loaded through `createRequire('<repo>/package.json')`. Build the site to a scratch `--outDir` and overwrite `<scratch>/models/rl300-lite.glb` to preview before touching `public/`. Do not use `verify-jg033-preview` for that preview: its `liteAsset` hash assert reads `public/models/rl300-lite.glb`.
- `public/models/*.glb` is gitignored, but `rl300-lite.glb` is already tracked, so a plain `git add` works for a modified lite file; a brand-new GLB needs `git add -f`.
- `stop-preview.mjs` prints "PORT 4173 FREE" whatever port you used: curl your own port to confirm. Probe with `localhost`.
- The trim hook eats long tool output (it dropped the first lines of several results): write to a file and `head`/`tail` it, or route through `ctx_execute`. No `pngjs` in `node_modules`: diff PNGs in a Playwright page with canvas `getImageData`.
- `shellBoundary.test.ts` adds one case per file in `src/scene/rl300/`, so a new file there moves the test total by +1.
- **Files are CRLF.** A multi-line `old_string` in Edit and `$`/`.` in regex fail on `\r`. Use single-line anchors, or split on `\n` in node and edit by line. `git add` prints harmless "LF will be replaced by CRLF" warnings.
- Heredocs eat backslashes: write scratch scripts with `String.fromCharCode(92)` or file paths, not regex-escaped paths. `python`/`python3` hangs (Windows stub): use node.
- `scripts/check-qm-jgun-assets.mjs` needs `--base-root` and `--new-root` plus the two out dirs: `node scripts/check-qm-jgun-assets.mjs C:/Users/Markimus/.buzz/REPOS/qm-u4/base <new> --base-root C:/Users/Markimus/.buzz/REPOS/jgun-qm-base --new-root . --append project/work/evidence/rl300-quiet-machine/qm-commit-gates.md --label <id>`; build `<new>` with `npx vite build --sourcemap --manifest --emptyOutDir --outDir <new>`.
- Preview helpers: `project/work/evidence/rl300-quiet-machine/35-v16-round-1/scripts/{start,stop}-preview.mjs` (`--dist <repo>/dist --port <free> --pidfile --log`; pidfile, never match PIDs by command line). `verify-jg033-preview` takes `OUT=` and `BASE_URL=`.
- Playwright from a script outside the repo: `createRequire('<repo>/package.json')('playwright')`, `channel: 'chrome'`.
- Handoffs go stale in minutes when another session shares the branch: run `git log --format='%h %ad %s' --date=iso -8` and `git status --short` first.

## Spawn ledger (this session)
| # | Work | Seat | Effort | Tokens |
|---|---|---|---|---|
| | none | | | 0 |
| | **This session** | | | **0 spawns** |
| | **All-time** | | | 2,975,689 (unchanged, handoff 11a) |

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration; HEAD should be the wrap commit above 114c36b3 or a descendant). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; another session shares this worktree and is working on S5 posters (untracked project/work/evidence/rl300-quiet-machine/38-s5-posters/; do not touch it or public/images/rl300-*). Then read docs/HANDOFF-quiet-machine-2026-10-11e.md (all). S2b, the intake hotspot, the test-audit and the lite GLB regeneration are done and approved; do not redo them.

Standing owner instruction (revised 2026-10-11): add new tests, gate scripts, mutation proofs or extra validation only if a previous test can be eliminated; look for redundant or unnecessary tests and remove them; run only the existing required gates once (typecheck, npm test, build, check:station2, U.1/U.2/U.4, verify-jg033-preview, verify-page-transition when the nav or fade is touched); do not reply to preference statements, just apply them. Costs and decisions in line one, model named. Use the advisor (Opus) before building and before declaring done; do small edits yourself rather than spawning.

Task: ask me ONE question, which to do next: (a) QM9 skip cap passes while the section is closed (needs a zero-pixel-delta proof; moves the capTarget assert to open anchors), (b) motion plan S3 per-section state (needs my ruling whether it may change the look), (c) V16 vs shipped frame shifts (35-v16-round-1/asset2/audit.md), (d) wait for the S5 poster session and then do the QM7b/QM10 poster repoint, (e) the K5 camera.test.ts timeout flake and the eager "keeps reservoir occurrences..." test. Do not start any before I answer.

Constraints: torque wrench page and public/models/msp-enclosure.glb untouched; no push, PR or deploy; stage by explicit path; commit only after I approve PNGs or say go; kill only PIDs you started; one GPU; verify every seat report yourself; visual effects need Astra unless I waive it.
```
