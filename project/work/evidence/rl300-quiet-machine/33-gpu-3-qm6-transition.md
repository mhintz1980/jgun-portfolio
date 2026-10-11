# 33 - GPU-3 run: QM6 page-transition verifier (JG-033 Quiet Machine integration)

Run date 2026-10-10. Seat: GPU-2/GPU-3 worker (Sonnet 5.5). Measurement run: the only tracked-file edits were the two spec'd mutations (`quiet-machine/index.html`, `src/shared/pageFade.ts`), each restored with `git restore` and verified by sha. Nothing staged, committed, stashed or pushed. This file and `33-gpu-3/` are untracked, for the orchestrator to commit.
Scratch scripts (not committed): `C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/df06f954-a691-4644-b235-2da4781e90da/scratchpad/gpu/` (`run-pt.sh`, `hashcheck2.sh`, `findpid.ps1`, `casetable.mjs`, `videos3.mjs`).

## Identity

| Item | Value |
|---|---|
| HEAD | `275a4c0ad7a1212b20a38fda630394cac88605ab`, `quiet-machine/integration` (unchanged throughout) |
| ORIG_QM (`dist/quiet-machine/index.html` after `npm run build` at HEAD) | `e05687cdd6a79471c85cc4a73a7e1c62d45b4d7aba33fa66054c815a6b5c33c1` |
| ORIG_ROOT (`dist/index.html`) | `b850f0c8346805bb436305f2879aea3c0e5923ff41c51276736ef32353969495` (same two values as GPU-2: the build is deterministic) |
| Browser | Chrome 154.0.8037.98, ANGLE/D3D11 (the verifier's own launch) |
| Hash method | `curl -s URL -o file` then `sha256sum`, compared with the dist file (`hashcheck2.sh`); accepted by the coordinator. Before EVERY verifier run: `HASHCHECK MATCH` for `/quiet-machine/` and `/` (files `33-gpu-3/<run>.hashcheck.txt`) |
| PID method | process list (exact command line, creation time, parent bash), port verified free by `curl` exit 7 before and after each server; kill by PID with `/T` only |

Served shas per run (served == dist for both pages at each):

| Run | `/quiet-machine/` | `/` |
|---|---|---|
| base-1440x900, base-390x844, mut1-restored, mut2-restored | `e05687cd...c1` (ORIG_QM) | `b850f0c8...95` (ORIG_ROOT) |
| mut1-nowhite (Mutation 1 build) | `ec536865d5c789f80dea0b5e5993545ad89309e576604234ddf1b15246d630b2` | `b850f0c8...95` |
| mut2-persisted (Mutation 2 build) | `f0ba1bc85b897f34d2e523ad6fa4c3be9ab3401354c30a29f5ebb86af531b110` | `05db0894ed90aef1cbf807fbdd151c65d9b1c1c41908f3cec5799479ffc70474` |
| pre-qm6a (worktree `f68db769`, its own `dist`) | `56888526ccb430470c00ec00c43dd171cbde47379485d7da5879291ec44dde2f` | `6afa265196bfb5f91d15177119ca099408aa1c592ab7c92d0806fdb6da6a87b7` |

## Step 1: baseline at HEAD

Commands: `node scripts/verify-page-transition.mjs --url=http://localhost:4173 --viewport=<vp> --out=33-gpu-3/base-<vp>`; logs `base-1440x900.log`, `base-390x844.log` (exit code on the last line).

- **1440x900: exit 0, `RESULT: PASS`**, 7/7 PASS, `gateIncomplete: []`.
- **390x844: exit 0, `RESULT: PASS`**, 7/7 PASS, `gateIncomplete: []`.
- No case is UNVERIFIED at either viewport: `back` PASSED because bfcache was really used (below).

| Case | 1440x900 | 390x844 | Key measurement (1440x900 / 390x844) |
|---|---|---|---|
| fade-out | PASS | PASS | data-fade="out" 1 ms / 1.3 ms after click (limit 100); URL `/` 432 / 434 ms (limit 1450); one `shell-fade-out` animationend 400 ms after click |
| synthetic-arrival | PASS | PASS | `timeToReleaseMs` 2150 / 1926.6; DCL fade "in"; released for reason "ready"; attribute removed 2041.3 / 1831.2 ms after mount (bound 3600) |
| back | PASS | PASS | `persisted=true` / `persisted=true`; `disableBackForwardCacheFlagStillOnCommandLine=false` / `false`; judged from the pageshow snapshot; fade after settle null; 1 canvas, `ready`, no `.qm-poster` |
| reduced-motion-cut | PASS | PASS | click navigated to `/`; no `data-fade="out"`; no storage key |
| legacy-redirect | PASS | PASS | ended `/quiet-machine/?quality=lite`; history length 2 vs 2 for a direct load |
| no-white-frame | PASS | PASS | `darkFraction=1`, `brightFraction=0` (limit 0.2) / `darkFraction=1`, `brightFraction=0` |
| reduced-motion-arrival | PASS | PASS | data-fade never took a value; flag absent after load; poster rendered |

Full per-case tables with messages: `33-gpu-3/base-case-tables.md`; raw: `base-<vp>/report.json`.

## Mutation 1: no white frame (plan line 437)

Edit: `quiet-machine/index.html`: removed `html { background: #05070a; }` and `background: #05070a;` from the `html[data-fade]::after` rule (`33-gpu-3/mut1.diff`). Built (exit 0), served, hash check MATCH against the mutated dist (`ec536865...`). Run at 1440x900 only: `33-gpu-3/mut1-nowhite/`.

MUTATION-1 RED: yes (`no-white-frame` FAIL, exit 1; darkFraction 0.0039, brightFraction 0.9904, limit 0.2; message "the inline head block does not cover the page on its own"; every other case PASS)

Restored with `git restore quiet-machine/index.html` (`git status --porcelain --untracked-files=no` empty), rebuilt, restarted, rerun at 1440x900 (`33-gpu-3/mut1-restored/`): exit 0, 7/7 PASS, `no-white-frame` PASS with darkFraction 1, brightFraction 0. `sha256sum dist/quiet-machine/index.html` = `e05687cdd6a79471c85cc4a73a7e1c62d45b4d7aba33fa66054c815a6b5c33c1` = ORIG_QM (`mut1-restored-dist-shas.txt`).

MUTATION-1 GREEN-AFTER: yes (exit 0, no-white-frame PASS, dark 1 / bright 0, restored sha equals ORIG_QM)

## Mutation 2: persisted clear (plan line 438)

Edit: `src/shared/pageFade.ts`: in `onPageShow`, removed `doc.documentElement.removeAttribute(ATTRIBUTE)` and `env.storage.removeItem(FADE_KEY)` and left `navigationSerial += 1` (`33-gpu-3/mut2.diff`). Built (exit 0; dist shas `f0ba1bc8...` / `05db0894...`), served, hash MATCH. Run at 1440x900 only: `33-gpu-3/mut2-persisted/`.

MUTATION-2 RED: yes (`back` FAIL, exit 1; bfcache used: `persisted=true`, `disableBackForwardCacheFlagStillOnCommandLine=false`; message `data-fade="out" left after Back (bfcache restore)`; pageshowFadeAfterSettle "out", flag still set; canvas 1, ready true; every other case PASS)

Restored with `git restore src/shared/pageFade.ts`, rebuilt, restarted, rerun at 1440x900 (`33-gpu-3/mut2-restored/`): exit 0, 7/7 PASS, `back` PASS with `persisted=true`. `dist/quiet-machine/index.html` = `e05687cd...c1` = ORIG_QM and `dist/index.html` = `b850f0c8...95` = ORIG_ROOT (`mut2-restored-dist-shas.txt`). `git status --porcelain --untracked-files=no` is empty.

MUTATION-2 GREEN-AFTER: yes (exit 0, back PASS persisted=true, both restored shas equal ORIG_QM and ORIG_ROOT)

## Case 7 red proof against a pre-QM6a build (`f68db769`)

- `git worktree add --detach C:/Users/Markimus/.buzz/REPOS/jgun-qm-f68db769 f68db769` (HEAD there `f68db769cd934ceee542427dfe6b7358ffed1d9f`).
- Ignored-untracked files under `public/models` in the main worktree (`git ls-files --others --ignored --exclude-standard public/models`): **none (empty list), so nothing was copied.** All 8 files were already present in the new worktree as tracked files (`Default.glb`, `knurling-tool.glb`, `m249-transformed.glb`, `manufacturing-core-full.glb`, `manufacturing-core-lite.glb`, `msp-enclosure.glb`, `rl300-lite.glb`, `role-map.json`); the poster PNGs under `public/images` are tracked too.
- Junction `node_modules` created with `mklink /J`; `node node_modules/vite/bin/vite.js build` (cwd = that worktree) exit 0; served from that worktree on 4173 after the main-worktree server was stopped; hash MATCH against that worktree's dist (`56888526...`, `6afa2651...`).
- Run from the main worktree: `verify-page-transition.mjs --url=http://localhost:4173 --viewport=1440x900 --out=33-gpu-3/pre-qm6a` (exit 1).

Case 7 (`reduced-motion-arrival`) measurements: `reducedMotionMatches: true`, `seededFlag` set, `observerProbeSeen: true`, `dataFadeValuesEverTaken: ["in","release"]`, `dataFadeMutations: 3`, `dataFadeAtEnd: null`, `flagAfterLoad: null`, `rendered: "poster"`, `posterCount: 1`, `canvasCount: 0`, no page errors. QM did render (poster path under reduced motion), so the case could observe the attribute.

CASE7-PRE-QM6A RED: yes (`reduced-motion-arrival` FAIL: data-fade took ["in","release"] under reduced motion on the pre-QM6a build; the same case PASSES at HEAD with the attribute never taking a value)

Other cases on the old build (read for information only): `fade-out` FAIL (the assign at 457.4 ms did not follow the animationend at 428 ms within 20 ms and came after the 450 ms fallback: the fallback, not the event, drove the navigation; the pre-QM6a `animationend` handling that QM6a changed), `synthetic-arrival`, `back`, `reduced-motion-cut`, `legacy-redirect`, `no-white-frame` PASS.

Cleanup: server stopped by PID; `curl` to 4173 exit 7; junction removed with `[System.IO.Directory]::Delete('...\jgun-qm-f68db769\node_modules')` (exit 0, path gone); `git worktree remove --force` exit 0; main-worktree `ls node_modules | wc -l` = **154** before and after (150 with the dotfiles excluded, which is the `/usr/bin/ls` count without `-A`); `git worktree list` has no `jgun-qm-f68db769`; the path no longer exists.

## Step 5: videos and frames (from the baseline runs; `videos3-log.json`)

All eight exist; none missing. `.webm` copies are kept beside each `.mp4`. Frames via `ffmpeg -ss`; durations via `ffprobe`.

| File (1440x900) | Case | Duration | | File (390x844) | Duration |
|---|---|---|---|---|---|
| `qm-to-root-fade.mp4` | fade-out | 4.64 s | | `qm-to-root-fade-390x844.mp4` | 4.12 s |
| `arrival-into-qm.mp4` | synthetic-arrival | 2.16 s | | `arrival-into-qm-390x844.mp4` | 2.00 s |
| `back-to-qm.mp4` | back | 4.84 s | | `back-to-qm-390x844.mp4` | 4.60 s |
| `reduced-motion-cut.mp4` | reduced-motion-cut | 0.24 s | | `reduced-motion-cut-390x844.mp4` | 0.28 s |

Each has `<name>-first.png`, `<name>-mid.png`, `<name>-last.png`. **The first frame of every video is pure white (mean luma 1.000)**: that is the recorder's initial about:blank frame before the first navigation (the verifier itself discards such frames in the white-frame case), not a page frame. Mean luma of the other frames, 1440x900: arrival mid 0.022 / last 0.114; fade-out mid 0.099 / last 0.024; back mid 0.099 / last 0.022; reduced-motion-cut mid 0.113 / last 0.031. The 390x844 set is within 0.01 of these.

## Not done / caveats

- Mutations were run at 1440x900 only, as the spec says; 390x844 was run at baseline only.
- Mutation 2 removed the attribute clear and the storage-flag clear (both are in the "persisted clear" block); it was not tested with only one of the two removed.
- The first frames of the case videos are the recorder's white lead-in (see above); judge the transition from the mid and last frames or the mp4.
- UNVERIFIED cases: none at any run.
- Pre-QM6a `fade-out` also failed (expected on an old build); not investigated beyond the verifier's message.

## Servers and ports

| Server | PID (child) | Purpose | Killed |
|---|---|---|---|
| 1 | 20672 (22500) | baseline, both viewports | yes (`taskkill //PID //T //F`) |
| 2 | 34944 (4056) | Mutation 1 build | yes |
| 3 | 12700 (22248) | Mutation 1 restored | yes |
| 4 | 2080 (17272) | Mutation 2 build | yes |
| 5 | 38104 (24840) | Mutation 2 restored | yes |
| 6 | 10068 (4280) | pre-QM6a worktree build | yes |

End state: final `npm run build` at HEAD exit 0; `dist/quiet-machine/index.html` = ORIG_QM and `dist/index.html` = ORIG_ROOT (`final-dist-shas.txt`). `curl` to 4173 and to 5199 exit 7 (free); `netstat` shows no LISTENING row for either. `git status --short` shows only untracked evidence paths (`32-gpu-2/`, `32-gpu-2-qm5-captures.md`, `33-gpu-3/`); `git status --porcelain --untracked-files=no` is empty; HEAD unchanged; no 0-byte files in the repo root; no stash made by this seat.
