# HANDOFF (2026-10-12d): two jobs for the next session, V16 frame shifts and S4 background; neither started

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, local only, nothing pushed. HEAD at write time `1977bfb8` (owner-review session's docs commit) on top of `174658b2` (lite extras). Other sessions share this tree and the torque worktree: run `git log --format='%h %ad %s' --date=iso -8` and `git status --short` first. This file supersedes the "V16 frame shifts" section of [HANDOFF-quiet-machine-2026-10-12b.md](HANDOFF-quiet-machine-2026-10-12b.md), whose premise (audit data gone) was wrong.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend this session | **USD 0**, 0 spawns, local GPU only. Orchestrator Sonnet 5.5; Advisor (Opus 5.5) about 9 calls |
| Job 1: V16 frame shifts | **new estimate 40-55k tokens on Sonnet 5.5 (mine, unanchored), over your 30k cap.** Your correction removed the Blender dump and loader rebuild; what is left is a per-part offset table, the apply in `prepareModel.ts`, PNGs, gates, a ruling. **The cap needs your raise before this starts** |
| Job 2: S4 background | you said "do it" and want the final result for final approval. Plan estimate **300-450k tokens**, budget **approved**, baseline p95 **11.6 ms** (desktop full). Full tier only: lite gets no background layers (your pin raise) |
| Reviewer | Opus 5.5 advisor stood in for Astra per change (draw-on, header, lite extras). **Not a general waiver**: ask once whether it stands in for S4 candidates and the V16 shifts |
| Done today | S3 approved (`f5e8ac79`, `431d23ef`); phone header `4d1ee94a`; GPU-6 desktop baseline `cc0dda93`; lite extras `174658b2`. S3b: no more transitions ("done for now") |

## Where things stand (verified from git, not from reports)
- Committed this session: `f5e8ac79` S3a ribbon weight gating; `431d23ef` S3b air draw-on ease-out; `4d1ee94a` phone header on one row; `cc0dda93` GPU-6 and S4 baselines; `174658b2` lite loads the extras (pin `< 95`, lite `keptTriangles < 260000`, actual 253,533).
- Untracked on purpose: `45-s3b-drawon/frames/`, `48-lite-extras/frames/` (scratch captures), `38-s5-posters/final/` (poster PNGs, the poster session's).
- Gates last run green at `174658b2`: typecheck, full vitest 50 files / 701 tests (`--testTimeout=60000`), build, `check:station2`, `verify-jg033-preview` (needs a fresh `npm run build`; it hashes `dist/quiet-machine/index.html`), ribbon-clipping, U.1/U.2; page-transition 390x844 at `4d1ee94a`.

## Job 1: V16 frame shifts (approved, cost raise needed)
**Correction from the owner's review session (verified):** `asset2/v16-bboxes.json` (614 V16 mesh objects, glTF-frame world bboxes) and `asset2/scripts/load.mjs` are tracked (`1977bfb8`). `node project/work/evidence/rl300-quiet-machine/35-v16-round-1/asset2/scripts/audit.mjs <out.md> [--json]` reproduces `audit.md`. The master was re-saved as the fillfix; a read-only re-dump gave 0 mm and 0 triangle deltas (`asset2/fillfix-check-2026-10-12.md`). **Do not re-dump from Blender.** I ran the audit this session: it works; `--json` returns `{fused, rows, unmatchedShipped, v16NotShipped}` where `rows` is per root group `{root, n, m:[dx,dy,dz] mm, flag}` (e.g. `904j-e28t_eng`, 33 matched, +14.95 mm z), not per part.

**What to do (shipped `msp-enclosure.glb` and `rl300-lite.glb` stay untouched):**
1. Start with the coherent groups only: `904j-e28t_eng` (34 parts, +14.9 mm z), `RL300-CPM-3000` and `RL300-P-FFM-1000` (+14.0 mm z), singles `26-01305-1` (+14.9), `RM100-PX1029008D-1` (+14.5). Audit values are shipped MINUS V16, so the correction is a translation of **-0.0149 / -0.0140 m in z** (glTF axes). Leave `COMPOSITE_PANELS` (16 parts, +94 mm x), `ENCLOSURE_CHASSIS` (36 bolts, +9.1 mm z), `PUMP_HOUSING` tie-downs (+29 mm y), `RL200-SIF-1019-1` (+5.0): scattered, not a frame shift; ask before touching them.
2. Per-part names: derive from `asset2/v16-bboxes.json` plus the root map in `34-v16-assessment/data/v16-objs.json` (the same inputs `audit.mjs` uses), sanitized names (`san()` in `audit.mjs`) match GLTFLoader node names. A scratch node script is enough; the output is a small data table.
3. Apply in `src/scene/rl300/prepareModel.ts` the way `EXHAUST_STACK_OFFSET` is (line ~378: `geometry.translate(...)` on the baked world-frame positions, before bounds and merge; both tiers carry the same nodes). One new data file or a const table in that file; U.1 allows `src/scene/rl300/`. A new file adds one case to `shellBoundary.test.ts` automatically (+1 test total, no test written).
4. **Trap to resolve first:** the extras were built with frame shifts to match the shipped frame: the V16 MAN assembly (`PUMP_HOUSING` root, +0.0141 z, handoff 11a) and `EXHAUST_STACK_OFFSET = [0.4, 0, -0.0496]` includes a +0.0154 frame shift. If the engine group moves -14.9 mm toward V16, those extras must move with it or they will sit 15 mm off the engine. Decide and show the numbers before editing.
5. Proof: before/after PNGs at the engine (u .2, .34, .58, .825; desktop full and lite 1440x900; one 390x844), same-build baseline from HEAD (do not compare across other changes; the baseline must be a build of the commit before your edit). Existing gates once. Opus ruling and your approval before any commit.
6. Constraints: no new tests or gate scripts (a swap for a removed test only); `public/models/msp-enclosure.glb` untouched; torque page and `src/shared` untouched.

## Job 2: S4 layered background (full tier only; "do it", final result for your approval)
Approved budget (plan section 7): full <= +5 draw calls (inside `< 150`; worst sampled open frame today 142), <= 100 added triangles, <= 3 new materials, <= 8 MB texture memory (blue-noise 64x64 RGBA8 = 16 KB; a 1024x512 layer = about 2 MB, 2.7 MB mipped). **Lite: no layers.** Frame time: desktop p95 within +1.0 ms of **11.6 ms** (`47-gpu6-baseline/`, AMD Radeon 780M, same method), no fps loss, uncapped timing before and after.
Plan S4 (motion plan section 3): `BackgroundDirector` plus 2-3 depth layers driven by `u` at their own parallax rates; gamma-correct radial base gradient with blue-noise dither; continuous blend of layer opacity, offset and colour across beats with no snaps at beat edges; optional pointer layer (second-order dynamics, suppressed while reading; needs the `< 150` pin moved first, which is an edit to an existing assert); offline still of the background for the poster and reduced-motion paths with no live layers there; rejected candidates are removed, not flagged off.
Starting point today: `<color attach="background" args={['#101b24']}>` at `QuietMachineScene.tsx:167`; `RoomEnvironment` lights only. Posters are WebP stills (`rl300-shot-0N-poster.webp`); the poster path must stay zero-canvas.
Ownership (plan section 5): Background seat writes `BackgroundDirector.ts` and layer files; Scene seat `QuietMachineScene.tsx`. One writer per file: do not run Job 1 and Job 2 in parallel, both can touch `prepareModel.ts`/scene files. Job 1 first (small), then Job 2.
Per candidate: PNGs at the S3 u values plus a motion clip (Playwright `recordVideo`, wheel notches), Opus ruling, your approval. Report draw calls, triangles, material count and p95 before/after, labelled as "worst sampled".

## Resources and traps
- One GPU; ports: start servers with `35-v16-round-1/scripts/start-preview.mjs --dist <dir> --port <p> --pidfile --log`, stop with `stop-preview.mjs --pidfile --port <p>` (it defaults to 4173; always pass `--port`). Ports 4291-4299 were used and released this session.
- Scratch builds: `git archive HEAD src public quiet-machine index.html vite.config.ts package.json tsconfig.json | tar -x -C <scratch>`, junction `node_modules` (`cmd //c mklink /J`), `vite build --outDir`. `git worktree add` fails (path too long).
- `python3` is a hanging stub; recursive `grep -r` over `project/work/evidence` hangs; `rm -rf` with a shell variable is blocked by the safety hook (use literal paths or avoid). `rtk proxy git ...` shows real `git status`/`diff` output when the rtk filter mangles it.
- Evidence numbering used so far: 44 S3a, 45 S3b draw-on, 46 header, 47 GPU-6, 48 lite extras. Next free: 49.
- ICM entries stored this session under `decisions-jgun-quiet-machine` and `context-jgun-quiet-machine` (S3, header, GPU-6, lite extras, S4 budget, Opus-for-Astra scope).

## Open items carried
Another S3b transition only if named; QM8 per-pass attribution script (breaks the test rule unless a test is removed; desktop acceptance already closed); the eager `prepareModel` reservoir test and load-timeout tests (pass with `--testTimeout=60000`); phone not measured (you ruled desktop only is enough).

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration, local only). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; the S5 poster session and the torque session share this tree or its neighbours. Then read docs/HANDOFF-quiet-machine-2026-10-12d.md (all). It supersedes the V16 section of 12b; read 12b line one for the day's approvals, and do not redo S3, the phone header, GPU-6 or the lite extras (all committed).

Standing owner instructions: add new tests, gate scripts or extra validation only if a previous test can be eliminated; run only the existing required gates once each; costs and decisions in line one with the model named; use the advisor (Opus) before building and before declaring done; small edits yourself, no spawns by default; no push, PR or deploy; stage by explicit path; commit only on my explicit go; verify every report yourself; torque page, src/shared and public/models/msp-enclosure.glb untouched; one GPU.

Task: put in line one the cost for Job 1 (V16 frame shifts: coherent groups only, 40-55k tokens on Sonnet 5.5, over my 30k cap) and ask me ONE question: (a) raise the cap and run Job 1 now; (b) skip Job 1 and start Job 2 (S4 background, full tier only, 300-450k tokens, budget already approved); (c) both, Job 1 first. Also ask once whether Opus stands in for Astra for these two jobs. Do nothing before I answer. Show me the final result of each job for approval; commit only after I approve the PNGs (and motion clips for S4).
```
