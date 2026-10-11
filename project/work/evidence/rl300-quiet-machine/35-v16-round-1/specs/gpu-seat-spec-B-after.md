# GPU seat spec, run B: the after-build capture round (V16 materials + extras)

You are the single GPU seat again (Sonnet 5.5, high, `tier-worker`; you did run A). The orchestrator verifies every claim; report facts with evidence, not narrative. Soft token budget: 200k. You are the only seat allowed to use the GPU.

Repo (Git Bash `/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`), branch `quiet-machine/integration`, working tree contains the new runtime code (do not edit it). Use ABSOLUTE paths; do not `cd`.
Scratch: `C:\Users\Markimus\AppData\Local\Temp\claude\C--Users-Markimus--buzz-REPOS-jgun-quiet-machine\7a0ea69b-a024-4739-ae73-5eab43caed88\scratchpad\gpu` (your run-A scripts are there: reuse `common.mjs`, change only `E`).
Evidence dir (untracked): `project/work/evidence/rl300-quiet-machine/35-v16-round-1/` ; this run writes `after/`, `after-repeat/`, `before-at-closeup-u/`, and run file `run-B-after.md`.

## Builds under test (both prebuilt by the orchestrator; do NOT run `npm run build`)
- AFTER: `<scratch>/dist-after` (V16 materials + extras). Its `index.html` / `quiet-machine/index.html` sha256 are given in the orchestrator's message that sends you here.
- BEFORE: `<scratch>/dist-before` (HEAD `97e2d806`; `index.html` b850f0c8346805bb436305f2879aea3c0e5923ff41c51276736ef32353969495, `quiet-machine/index.html` e05687cdd6a79471c85cc4a73a7e1c62d45b4d7aba33fa66054c815a6b5c33c1). Run A proved this build renders byte-identically to the committed `32-gpu-2/` set, so render noise is 0 on that build: do not spend captures re-proving it.

## Hard rules (same as run A, restated)
- Server only via `.../35-v16-round-1/scripts/start-preview.mjs` / `stop-preview.mjs` (`--dist --port 4173 --pidfile --log`), PID recorded at launch. Port free proof before each start (`curl -s -o /dev/null --max-time 3 http://localhost:4173/; echo $?` prints `7`), `cmp` served `/` and `/quiet-machine/` against the dist's `index.html` files before capturing, stop with the helper, then prove the port free again. One server at a time. NEVER match processes by command line / image name / `pkill` / `taskkill /IM`; no `findpid.ps1`, no `netstat`.
- No edit of any tracked file, no `git add/commit/stash/push`. No `npm run build`. Create files with the Write tool; quote `>`/`=>` in one-liners; `python3` hangs (use node); stray 0-byte files `key`, `2`, `Promise` exist in the repo root: create none, delete none (also a 0-byte file whose name is `` `primitives.length` `` under `34-v16-assessment/specs/` is the orchestrator's to handle).

## Step 1: verifier gate (AFTER server)
Start the AFTER server, `cmp` check, then `BASE_URL=http://localhost:4173 node scripts/verify-jg033-preview.mjs` with stdout/stderr and exit code saved to `after/verify-jg033-preview.log`. Do NOT fix anything that is red: record and continue; report exact failing lines.

## Step 2: captures on the AFTER server (all `?quality=full` unless the name says lite)
Use `capture()` from `common.mjs` exactly as run A (same viewport screenshot, same `seekRest`), so every PNG has a sidecar JSON.
a. `after/u34-<vp>.png`, `after/u51-<vp>.png` for vp in `1440x900`, `390x844` (4 captures).
b. Repeat: close the browser, launch a NEW browser, load a fresh page, capture the same 4 names into `after-repeat/` (noise reference for the AFTER build).
c. Sheets: the 7 shots at the `SHOTS` midpoints for both viewports, tiles into `after/sheet-tiles/<vp>-shot<i>.png` (same naming as `32-gpu-2/sheet-tiles/`), and composed contact sheets `after/sheet-1440x900.png`, `after/sheet-390x844.png` using the same composition code as run GPU-2 (`34-v16-assessment/gpu-seat-scripts/phase-a.mjs` lines 29-45).
d. Lite check (`?quality=lite`): 390x844 at u .34 and .51 -> `after/lite-u34-390x844.png`, `after/lite-u51-390x844.png` (+ sidecars). The committed lite "before" frames are `32-gpu-2/lite-vs-full-tiles/u34-390x844-lite.png` and `u51-390x844-lite.png`.
e. Close-ups of the three new part groups, from the shot camera (the camera cannot be moved: it is a function of u):
   - Parts and world bboxes (glTF Y-up, metres, from the extras file / shipped file): dials `GAUGE_DIALS` x .4952..5474, y .7352..8128, z -.6825..-.4907 (two dials, z -.568..-.491 and -.683..-.605); `EXHAUST_CONNECTOR_PIPE` x .1243..2204, y 1.3775..1.8207, z -.4471..-.3662; `RL300-P-FFM-1001-1` x .389..468, y .613..994, z -1.134..-.982.
   - For each part, search u in 0..1 step .005 with `evaluateShot(u, vp is narrow)` from `src/scene/rl300/shot.ts` (position, target, fov, plane constant): project the 8 bbox corners with the shot camera (aspect = viewport w/h, same near/far as the scene: near .02, far 60). Score = projected bbox area inside the viewport, requiring all corners in front of the camera. For the dials and FFM additionally require `plane <= bbox.xMin - 0.02` (the +x shell is cut away there; they face +x). Pick the best u per part; write the whole search table to `after/closeup-search.json`.
   - Capture at that u with Playwright `deviceScaleFactor: 2` (the canvas caps its own DPR at 1.5, that is expected), 1440x900: save the full frame `after/closeup-<part>-full.png` and a crop `after/closeup-<part>.png` using `page.screenshot({ clip })` around the projected bbox padded by 40% (min 360x240 CSS px, clamped to the viewport), sidecar JSON with `{u, plane, bboxNdc, clip, tier, gpu}`. Parts: `dials`, `exhaust-connector`, `ffm-1001-1`.
   - If a part's projected area at its best u is below 0.2% of the viewport, say so plainly in the run file and still save the frame.
f. Cost: `after/cost.json`, array over every capture in a,d: `{name, viewport, u, tier, gpu, drawCalls, renderedTriangles, geometries, textures, batches: counts.batches, materials: counts.materials, sourceTriangles, keptTriangles, extraParts, extraTriangles, mappedParts, mappedPrimitives, unmappedMultiSlot, v16Applied}` (fields absent in a sidecar are written as null). Do not recompute; read them from the sidecars.
Stop the AFTER server (helper), port-free proof.

## Step 3: matching "before" frames at the close-up u (BEFORE server)
Start the BEFORE server (`dist-before`, `cmp` check), capture the SAME u values and viewport (1440x900, dsf 2 for crops, same `clip` rectangles) into `before-at-closeup-u/closeup-<part>-full.png` and `before-at-closeup-u/closeup-<part>.png` (+ sidecars) so the orchestrator can diff them. Stop the server, port-free proof.

## Run file `run-B-after.md` and report
HEAD, `node -v`, `describeLaunch()`, both dist hashes and the `cmp` results, PIDs started and killed (each server), verifier exit code and last 15 lines, a table of every file with size and resolved tier/`uMatchesRequest`, the three chosen close-up u with the in-frame area %, anything not done stated plainly. Report format: short, facts only.
