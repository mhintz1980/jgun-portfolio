# HANDOFF (2026-10-12a): QM9 skip-caps and K5 landed; S5 posters rendered on Modal; poster repoint waits on three owner answers

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, local only, nothing pushed. Another session shares this branch (torque-wrench "shell readiness" docs commits, e.g. `ad84ac05`, `2bef1960`): run `git log --format='%h %ad %s' --date=iso -8` and `git status --short` first.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend, this session | **Modal about USD 0.195** (estimates: 7 poster frames 0.1087 + 2-frame beat-4 re-render 0.0868; actual charge not read). **A second beat-4 re-render (about USD 0.0868) is needed and NOT run: it waits on the owner's go.** **0 spawns.** Local Blender 5.1 previews, local Chrome. Orchestrator Sonnet 5.5; Advisor (Opus 5.5) called 4 times (skip-caps scope, pre-commit, band root cause, handoff review) |
| Landed (local commits) | `190e18fd` QM9 skip caps while closed; `421634c2` K5 camera test + U.1 allowlist; `ca2e0c79` S5 evidence/scripts/summary |
| Astra | waived by the owner for the posters ("no astra needed this time") and for skip-caps |
| Owner decisions pending | (1) go (USD 0.0868) for the beat-4 v3 Modal render; (2) the three answers under "Poster repoint" below |

## What landed
- **`190e18fd` QM9 skip caps.** `SectionCaps.tsx` hides each section group while `plane.constant >= CLOSED_CUT`. Proof: caps on vs off at closed u differed by 2-16 isolated pixels (that was the look change the owner accepted); HEAD vs new build is 0 px at open u on desktop/portrait/tablet/lite. Closed frames: desktop 143 -> 119 draw calls, 1.21M -> 906k tris; lite 85 -> 61, 552k -> 247k. Verifier: `capTarget` asserted at open anchors only, closed-exterior caps check removed. No test added. Open frames still carry about 304k tris of cap passes, so the plan's "<= ~500k per device" is **still not demonstrated** (QM8/GPU-6). Plan edits 2-3 (`composed = !lite`, `ribbonTotalFor`) were deliberately not done. Evidence `42`/`43-qm9-skip-caps/`.
- **`421634c2` K5.** `shaft/camera.test.ts` "is C0 across the timeline" now asserts worst-case accumulators once per layout (2856 -> 191 ms, same thresholds). The U.1 allowlist gained `src/scene/inspection/shaft/camera\.test\.ts$` in the plan and the structure doc (owner option 1). The full `npm test` still timed out under load on `portalGeometry` ("no floor topology"), `handwriting`, `kinematics`, `v16Materials` full tier (5 s timeout, 97 node processes from other sessions); they pass alone or with `--testTimeout=60000`. One `testTimeout` raise in the vitest config would end it, but that is a shared-file ruling.
- **`ca2e0c79` S5 posters.** Evidence under `project/work/evidence/rl300-quiet-machine/38-s5-posters/` (scripts, data, specs, `fix/*.py`, `summary.md`). PNGs left untracked on purpose (about 25 MB).

## S5 posters (the original S5 session died at stage 3; the owner took it over)
All fixes live in `38-s5-posters/fix/fix_posters.py` (idempotent; `--save` writes the scratch blend; `B4_EXPOSURE` env sets the beat-4 exposure, default -0.8, other frames stay at the scene's -1.5).
1. **Glow band above the hex grille** (owner-reported): `REVEAL_FILL` (1.1 x 2.6 m area light at z 1.72) reached y -1.4, 45 mm outside the inlet face (y -1.355). Pulled in to y -1.2 (`size_y` 2.4, `location.y` 0). Not a material/normals fault (plain diffuse and flat shading both kept it; removing only that light removed it).
2. **Beat 4:** `PROPOSED_LOWER_INTAKE` is absent from the V16 blend (page builds it in `LowerIntake.tsx`, `prepareModel.ts` skips the GLB node and the liner `V2RL300-SAF-1047-5`). Rebuilt in the scratch blend from the page's boxes with a `SECTION_PLANE`-parented boolean cutter, page colours as plain Principled (NOT V16 materials), liner hidden. Cutaway (owner option b): five skid parts hidden on frame 584 only (`V2RLP-SK-4000-A-2`, `V2FTA-FP-46-RL-1000-1`, `V2RL300-SAF-1047-3`, `V2RL200-SAF-1051-9`, `V2RL300-FTS-2003-SAFE-1`), floor dropped to z -0.30 on 584, and scene exposure keyed to -0.8 EV on 584 only (see "Beat 4 brightness" below).
3. **Renders:** job `rl300_posters_v16_a`, frames 581-587, 1920x1080 Cycles/OIDN/96 spp, status `passed` -> `38-s5-posters/final/poster-01..07.png` (+ `contact-sheet-final.png`). `final/poster-04.png` is beat 4 **v1** (dark, the page camera under the floor, cutaway, intake rebuilt). `final/poster-04-bright.png` is **FAILED, do not use** (see below).
4. **V16 master:** the same `REVEAL_FILL` band is in the master. The master was NOT modified (sha256 `788ae2a2a2f784c5...` before and after). A patched COPY is at `C:\Projects\msp-render-pipeline-scene-prep\scratch\RL300-SAFE-photoreal-V16-review-fillfix.blend` (only that light changed: Size Y 2.6 -> 2.4, Location Y -0.1 -> 0.0). Equivalent manual fix in the owner's own Blender: select `REVEAL_FILL`, Light data Size Y = 2.4, Object Location Y = 0.0. The owner said he does not have Blender open (2026-10-12), so no unsaved edits are at risk; he asked me to "fix it", so a swap (master kept as a `.bak`) is permitted on his go, not before.

## Beat 4 brightness (the v2 failure and the v3 candidate)
- **v2 failed on Modal.** A 150 W area light under the chassis (frame 584 only) rendered `final/poster-04-bright.png` blown to near-white (mean luma 237 vs 93 for v1). The owner caught it. Cause: the light behaved about 19x stronger in the SAVED blend than in the in-memory preview I judged it on (the in-memory 150 W gave luma 123; the saved blend gave 237 at 150 W, 126 at 8 W), and at any energy it added a uniform haze (lifted blacks) rather than lighting. The cause of the in-memory/saved difference was not found. The saved blend rendered locally matches Modal exactly (237.5 both), so **preview from the saved blend, never from a same-session in-memory build**.
- **v3 (not yet rendered on Modal):** the light is gone; scene exposure is keyed on frame 584 only: -0.8 EV (others stay -1.5), `B4_EXPOSURE` env in `fix_posters.py`. Sweep -1.0/-0.6/-0.2 in `preview-fix/b4-exposure-sweep.png`; the saved blend is already in this state. Local check from the saved blend: frame 584 luma 93 -> 122, frames 581/583/585 unchanged vs the Modal finals. Preview: `preview-fix/beat4-v1-vs-v3.png`, `preview-fix/final-check-f584.png` (960x540). Modal job: `jobs/rl300_posters_v16_b4.json` (frames 583-584), estimate USD 0.0868, into a NEW output dir (`output/rl300_posters_v16_b4` exists: use another name or `--resume` is wrong here; delete or rename it first). Take only frame 584 and name it `final/poster-04-v3.png`.

## Poster repoint (QM7b/QM10): what is needed from the owner
Not started. The 7 renders are ready, but this is a **look change, not a file copy**, and needs three answers:
1. **Replace the shipped previews?** Today `public/images/rl300-{exterior,section,intake}-preview.png` are live-page captures (blue shell, 3 `PosterId`s: `exterior`/`section`/`intake` in `beats.ts`). The new set is 7 photoreal orange V16 renders, one per beat. Do they replace the three blue previews on the reduced-motion/poster tier (plan QM7b: `rl300-shot-01..07-poster.png`, `PosterId` becomes 7 ids, verifier `CAPTURE_POSTERS` block and `preview.test.ts` midpoint test change)? Orange stills on a page whose live canvas is a blue shell is a visible mismatch only he can rule on. **If he picks the renders:** the plan's QM7b `CAPTURE_POSTERS=1` block (GPU-7) writes live-page screenshots to the same `public/images/rl300-shot-0N-poster.png` names, so a later capture run would silently overwrite the renders with blue captures. Remove that block (or point it elsewhere) in the same commit, and do not run `CAPTURE_POSTERS=1` afterwards.
2. **Size/format.** 7 x about 2.4 MB PNG is about 17 MB of `public/`. Recommend 1600 px wide WebP (or JPG), about 150-250 KB each. Needs his OK.
3. **Beat 4 v3** (local preview `preview-fix/beat4-v1-vs-v3.png`, `preview-fix/final-check-f584.png`): accept the look, then give the go for the Modal render (about USD 0.0868; two frames 583-584 because the dispatcher refuses one-frame plans; keep only 584).
Then the work is QM7b's file list only (`src/scene/rl300/beats.ts`, `QuietMachinePreview.tsx`, `preview.test.ts`, `scripts/verify-jg033-preview.mjs`, `public/images/rl300-*`; all U.1-allowlisted), plus the usual gates, and the keep-this rule: `.qm-hotspot-layer { display: none !important }` stays in the `CAPTURE_POSTERS` block. Prefer the plan's QM7b spec over editing from memory.

## Uncommitted at the stop
- `38-s5-posters/fix/fix_posters.py` (beat-4 fill, cutaway) and `summary.md` (updated): committed in the wrap commit.
- Untracked, on purpose: `38-s5-posters/final/*.png`, `preview/`, `preview-fix/`, `fix/exp-*.png`.
- Outside the repo: `C:\Projects\msp-render-pipeline-scene-prep\jobs\rl300_posters_v16_b4.json` (new, untracked there), `output/rl300_posters_v16_a/` and `output/rl300_posters_v16_b4/` (Modal results), `scratch/rl300-posters-v16.blend` (+`.blend1`), `scratch/RL300-SAFE-photoreal-V16-review-fillfix.blend`. A re-run into an existing `output/` dir aborts unless `--resume`.

## Open items (unchanged unless stated)
1. Poster repoint, above.
2. QM8 attribution / GPU-6 triangle acceptance: deferred; a new measurement script breaks the test rule unless a test is removed.
3. Motion plan S3 (needs his ruling on look change) and S4.
4. V16 vs shipped frame shifts (`35-v16-round-1/asset2/audit.md`): his call.
5. Header wraps to 3 rows at phone width (look ruling).
6. Lite still skips `rl300-extra-parts.glb` (no gauge dials, fused MAN mesh).
7. Test debt: the eager "keeps reservoir occurrences on their CAD finish through the real prepareModel pipeline" test; the load-timeouts listed above (K5 itself is fixed).

## Traps (new)
- The Modal dispatcher needs `sequence.timeline` of at least 2 frames and `--set` does not narrow the range; clone the manifest and edit `frame_start`/`frame_end`.
- A dry run creates its output dir: delete it before `--execute`. Unset the proxy env vars (`HTTP_PROXY` etc.) first.
- Heredocs eat backslashes again: `'\\'` in a Python script written via heredoc became a syntax error; use the Write tool for `.py`.
- Node on Windows rejects `/c/...` paths: pass relative or `C:/...`. The working directory drifts after `cd`: use absolute paths.
- `ray_cast` in `--background` Blender is a fast way to find what hides what (see `fix/probe_*.py`); `TRACK_TO` still does not resolve in background.
- **Adding a light by script is not previewable in memory:** judge any new light, material or exposure change by rendering the SAVED blend (`fix/render_saved.py`, env `MODE`/`EXPO` for what-ifs) before spending on Modal. Check other frames did not move (luma vs the Modal finals).
- Floor: S5 hid `REVEAL_FLOOR` on beat 4; the saved blend now drops it to z -0.30 on frame 584 instead.

## Spawn ledger (this session)
| # | Work | Seat | Effort | Tokens |
|---|---|---|---|---|
| | none | | | 0 |
| | **This session** | | | **0 spawns** |
| | **All-time** | | | 2,975,689 (unchanged) |

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration; HEAD should be the commit titled "wrap: handoff 12a ..." or a descendant; the torque session's docs commits may sit between it and ca2e0c79). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; another session (torque-wrench shell readiness) shares this branch. Then read docs/HANDOFF-quiet-machine-2026-10-12a.md (all). QM9 skip-caps (190e18fd), K5 (421634c2) and the S5 poster renders are done; do not redo them.

Standing owner instruction (2026-10-11): add new tests, gate scripts, mutation proofs or extra validation only if a previous test can be eliminated; run only the existing required gates once; do not reply to preference statements, just apply them. Costs and decisions in line one, model named. Use the advisor (Opus) before building and before declaring done; do small edits yourself rather than spawning.

Task: ask me ONE question: (1) go for the beat-4 v3 Modal render (about USD 0.0868; local preview preview-fix/beat4-v1-vs-v3.png; he reported v2 failed as blown out), then the three poster-repoint answers from the handoff (replace the blue previews with the 7 orange renders?; WebP/JPG at what size; accept beat 4 v3). Also offer, once, to swap the V16 master with scratch/RL300-SAFE-photoreal-V16-review-fillfix.blend: he said he does not have Blender open, so a copy-over with a .bak of the master is safe if he says go. Do not start the repoint or any Modal run before he answers.

Constraints: torque wrench page and public/models/msp-enclosure.glb untouched; V16 master never overwritten by you; no push, PR or deploy; stage by explicit path; commit only after I approve PNGs or say go; kill only PIDs you started; one GPU; Modal only on an explicit go with the cost in line one; verify every report yourself.
```
