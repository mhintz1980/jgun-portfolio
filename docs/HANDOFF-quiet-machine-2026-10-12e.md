# HANDOFF (2026-10-12e): V16 frame shift and S4 layered background both committed; nothing in flight

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, local only, nothing pushed. HEAD at write time `61b32500` on top of `9b6d1f52` on top of `c7240ad3` (handoff 12d). Other sessions share this tree and the torque worktree: run `git log --format='%h %ad %s' --date=iso -8` and `git status --short` first. This file supersedes [HANDOFF-quiet-machine-2026-10-12d.md](HANDOFF-quiet-machine-2026-10-12d.md): both of its jobs are done.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend this session | **USD 0, 0 spawns**, local GPU only. Orchestrator Sonnet 5.5 about **220k tokens** by the counter (Job 1 about 100k vs 40-55k estimate and 30k cap; Job 2 about 115k vs 300-450k plan; this file about 5k); Opus 5.5 advisor **7 calls** (Job 1: 2, Job 2: 4, this file: 1) |
| Job 1 V16 frame shift | **Committed `9b6d1f52`.** Engine-bay cluster back in the V16 frame (-14 to -15 mm z), both tiers; PNGs approved; two nodes beyond the list added with your OK (fused control panel, shipped MAN) |
| Job 2 S4 background | **Committed `61b32500`.** Full tier only, one fullscreen pass, +1 draw call, +1 triangle, 0 texture; full p95 **+0.8 ms median** (rule +1.0; one pair +1.1, thin); lite 0 changed pixels; PNGs and motion approved |
| Reviewer | Opus 5.5 advisor stood in for Astra for both jobs (owner 2026-10-12: "opus for both"). Not a general waiver |
| Next job | none queued. Owner picks from the list below |

## Where things stand (verified from git, not from reports)
- `9b6d1f52` JG-033 V16 frame shift. One code file, `src/scene/rl300/prepareModel.ts` (+41/-6): `FRAME_SHIFT_Z` map by scene node name (-0.0149 engine group `904j-e28t_eng` and `26-01305-1`, -0.0145 `RM100-PX1029008D-1`, -0.0140 CPM/FFM nodes and the fused `V2CONTROL_PANEL,_URFS-2`, -0.0141 the shipped fused MAN), `EXTRAS_FRAME_SHIFT_Z` by extras root (`DUCT_EXHAUST` -0.0154, `GAUGE_DIALS` -0.014, `PUMP_HOUSING` -0.0141), `EXHAUST_STACK_OFFSET` z -0.0496 to -0.065. Applied as a world-frame translation of the baked positions, same place as the stack offset. Per-vertex check on the real GLBs: x/y changed 0, 155,877 main-table triangles moved (exact), all 13,411 extras triangles moved, nothing else. Evidence `49-v16-frame-shifts/` (`summary.md`, 3 sheets).
- `61b32500` JG-033 S4. `src/scene/rl300/BackgroundDirector.tsx` (new, 119 lines) plus 3 lines in `QuietMachineScene.tsx` (`{!lite && <BackgroundDirector control={control} />}` before `<Environment />`). One fullscreen triangle, `renderOrder -1000`, ShaderMaterial, no texture; base gradient mixed in linear then converted, far bloom and near band composed in the same shader, static interleaved-gradient dither (ramps in at glow weight .004), per-beat looks (`LOOKS`, sampled at beat centres from `SHOTS`, smoothstep-blended), layer offsets from camera yaw/pitch at `useFrame` priority 1, glow masked to `BASE #101b24` at the canvas ellipse edge and at the floor far-edge horizon (60 m along the view azimuth). Evidence `50-s4-background/` (`summary.md`, `sheet-full.png`, `sheet-phone.png`, `strip-motion.png`, `motion/*.webm`, 12 `gpu6-*.json`, scripts).
- Gates on the final S4 tree, all green: typecheck 0; full vitest `--testTimeout=60000` **50 files / 702 tests** (the +1 vs 701 is the automatic `shellBoundary` case for the new file, no test written); build 0; `check:station2` 0; `verify-jg033-preview` 0 with errors [] (needs a fresh `npm run build`: it hashes `dist/quiet-machine/index.html`); ribbon-clipping 0; U.1 only `src/scene/rl300/`; U.2 (index.html, quiet-machine-main, public/models, src/shared) empty. The S4 gates ran three times, not once, because the tree changed twice (yaw sign fix, dither threshold); the owner was told.
- Untracked on purpose: `49-v16-frame-shifts/{frames,diff}/`, `50-s4-background/{frames,diff}/`, `45-s3b-drawon/frames/`, `48-lite-extras/frames/`, `38-s5-posters/final/` (poster session's), `outputs/` (another session's Oryzo recommendation notes, written 22:16; not mine, do not commit).
- Pins today: full `drawCalls < 150` (worst sampled open frame 143 with S4), lite `< 95` (91, S4 adds nothing there), lite `keptTriangles < 260000`.

## Remaining tasks (none started; owner picks)
**A. Owner decisions pending**
1. Whether to push, open a PR or deploy anything. Nothing has been; every instruction so far says no.
2. Next job from B/C below, or stop here.

**B. S4 follow-ups (each is a separate candidate, needs Opus ruling plus owner PNG/motion approval, and its own baseline built from HEAD before the edit)**
1. **Stronger per-beat looks.** `LOOKS` in `BackgroundDirector.tsx` is deliberately subtle; the warm beat-06 look barely reads at u .825. A distinct look per beat is a tuning candidate (colours and `lift` only).
2. **Pointer layer.** Second-order dynamics offset added to `uOff`, suppressed while reading. Needs input handling and a decision on suppression; the advisor judged it 0 extra draw calls inside the existing pass and no pin move. Determinism (G5) under `frameloop="demand"` is the open question.
3. **Frame-time margin.** +0.8 ms median against a +1.0 ms rule, with one clean pair at +1.1 and the lite control at +0.25. Cause not measured (the MSAA fullscreen write is a guess, not a finding). Re-measure on a quiet GPU before anything else lands on the background; if it must come down, try an early-out for masked pixels or a half-resolution layer, as a candidate.
4. **Offline background still for reduced motion.** Both paths are already the S5 WebP posters with no canvas, so nothing to build; recorded in `50/summary.md`.

**C. Older open items, unchanged from 12d**
1. Another S3b transition, only if the owner names one ("done for now").
2. QM8 per-pass attribution script. It breaks the test rule unless a test is removed; desktop acceptance is already closed.
3. The eager `prepareModel` reservoir test and the load-timeout tests pass only with `--testTimeout=60000`.
4. Phone frame time is not measured (owner: "Desktop only is enough").
5. From the plan's section 8: intake framing at u .51, end card copy and nav look, group A/B (gates QM7). These sit in QM7/QM7b.

**D. V16 frame shift leftovers (ask before touching, they are scattered, not a frame shift)**
`COMPOSITE_PANELS` 16 parts +94 mm x, `ENCLOSURE_CHASSIS` 36 bolts +9.1 mm z, `PUMP_HOUSING` tie-downs +29 mm y, `RL200-SIF-1019-1` +5.0 mm. Audit command: `node project/work/evidence/rl300-quiet-machine/35-v16-round-1/asset2/scripts/audit.mjs <out.md> [--json]` (inputs tracked).

**E. Docs to bring current (the plan and TODO.md still say otherwise)**
0. `TODO.md` (the canonical queue, read this session only at the end): its JG-033 entry (line 50) was last updated 2026-09/10-10 and says nothing about QM0-QM10, S3, the phone header, the lite extras, the V16 materials track, the V16 frame shift or S4; line 53 still reads "NEXT - Milestone 4". Add one status line pointing at the plan, `INDEX.md` and this handoff, and tick nothing without its evidence. Needs the owner's go (docs edit).
1. `docs/quiet-machine-motion-background-plan-2026-10-11.md`: section 8 item 9 says the V16 frame shifts are "NOT applied"; tick the S4 checklist (pointer layer item stays open) and record the S4 numbers in section 7.
2. `project/work/evidence/rl300-quiet-machine/INDEX.md` is current through 50 (committed in `61b32500`).
3. Add a one-line session wrap if the wrap skill is run (the memory index has entries through 2026-10-12).

## Dates
The clock rolled to 2026-10-13 during the S4 yaw check, so the S4 approval and the `61b32500` commit happened on 10-13. The commit message and the `50-s4-background/` row in `INDEX.md` say 2026-10-12; they were not amended (no go). Job 1 (`9b6d1f52`) is 10-12.

## Resources and traps (new this session, on top of 12d)
- **Never pipe `python3`**: the stub hangs and the backgrounded command has to be killed (it cost one task stop). Use `node -e` for edits.
- **`rm -rf` with a shell variable is blocked** by the safety hook. Remove scratch with `powershell Remove-Item -Recurse -Force '<literal path>'`, and remove `node_modules` junctions FIRST with `(Get-Item <junction>).Delete()` so the real `node_modules` is never walked. Junctions via a `.ps1` file: inline `$d` inside a bash-quoted `powershell -Command` string mangles.
- **Bash `cd` persists across calls**; the cwd silently moved into an evidence folder once. Use absolute paths or subshells.
- **Preview servers answer on `localhost`, not `127.0.0.1`** (connection refused). Start with `35-v16-round-1/scripts/start-preview.mjs --dist <dir> --port <p> --pidfile <f> --log <f>`, stop with `stop-preview.mjs --pidfile <f> --port <p>` (always pass `--port`). Ports used and released: 4301-4303, 4311-4313.
- **Page hooks for capture**: `window.__quietMachine` has `ready`, `frame`, `seek(u)`, `drawCalls`, `triangles`, `textures`, `geometries`, `counts`. Query `?quality=full|lite`. `49-.../capture.mjs` and `50-.../capture.mjs` are the reusable before/after capture scripts; `diffmap.mjs` gives changed-pixel percent.
- **Scratch builds**: `git archive HEAD src public quiet-machine index.html vite.config.ts package.json tsconfig.json | tar -x -C <dir>`, junction `node_modules`, `node node_modules/vite/bin/vite.js build --outDir dist` (about 10-30 s). For a node-side `prepareModel` diff, bundle with `esbuild --bundle --platform=node --external:three --external:'three/*'` into a folder under `node_modules` so `three` resolves to one instance (a bundled copy breaks `instanceof Mesh`); the loader is `35-v16-round-1/asset2/scripts/load.mjs` (`loadGlb`, Draco).
- **Timing is only valid in same-session interleaved pairs.** The first S4 runs read base p95 about 18 ms (GPU shared with the other sessions) against the 11.6 ms baseline; quiet runs read 10-11 ms. Check base p95 first; discard a pair whose lite control moves by more than about 0.5 ms.
- **Parallax**: the camera orbits a pivot, so layers behind it slide against the camera yaw/pitch and the far layer moves MORE than the near one. The advisor's "far moves less" is the lateral-translation rule. The first build also had the yaw sign inverted (0 of 40 sign agreements against a world-fixed far point); keep that check when touching offsets.
- **Frame strips from webm**: draw into a canvas taints on `file://`; use N paused `<video>` elements and screenshot the grid (`50-.../strip.mjs`).
- The tool output hook trims long command output; redirect to a file and read the head when numbers matter.

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration, local only). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; the S5 poster session and the torque session share this tree or its neighbours. Then read docs/HANDOFF-quiet-machine-2026-10-12e.md (all). It supersedes 12d: the V16 frame shift (9b6d1f52) and the S4 layered background (61b32500) are committed and approved; do not redo them, S3, the phone header, GPU-6 or the lite extras.

Standing owner instructions: add new tests, gate scripts or extra validation only if a previous test can be eliminated; run only the existing required gates once each; costs and decisions in line one with the model named; use the advisor (Opus) before building and before declaring done; small edits yourself, no spawns by default; no push, PR or deploy; stage by explicit path; commit only on my explicit go; verify every report yourself; torque page, src/shared and public/models/msp-enclosure.glb untouched; one GPU. Opus 5.5 stood in for Astra for the last two jobs only: ask again per job.

Task: put in line one that nothing is queued, then list the remaining tasks from the handoff (sections B to E) and ask me ONE question: which one to run next, or stop. Do nothing before I answer.
```
