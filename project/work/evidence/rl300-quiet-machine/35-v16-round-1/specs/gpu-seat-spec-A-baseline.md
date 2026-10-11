# GPU seat spec, run A: baseline of the CURRENT build ("before-now")

You are the single GPU seat (Sonnet 5.5, high, `tier-worker`). The orchestrator verifies every claim, so report facts with evidence, not narrative. Soft token budget: 60k. You are the only seat allowed to use the GPU; a later message from the orchestrator will give you run B (the after-build); do not start it.

Repo (Git Bash `/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`), branch `quiet-machine/integration`, HEAD `97e2d806`. Use ABSOLUTE paths; do not `cd` (the shell persists cwd).
Scratch: `C:\Users\Markimus\AppData\Local\Temp\claude\C--Users-Markimus--buzz-REPOS-jgun-quiet-machine\7a0ea69b-a024-4739-ae73-5eab43caed88\scratchpad\gpu` (exists).
Evidence dir (untracked): `project/work/evidence/rl300-quiet-machine/35-v16-round-1/before-now/` and run file `project/work/evidence/rl300-quiet-machine/35-v16-round-1/run-A-baseline.md`.

## Why this run exists
The owner needs to tell render noise from a real material change. The committed "before" set (`32-gpu-2/`, other session, HEAD `275a4c0a`) has no source difference from HEAD `97e2d806` in `src`, `public`, `scripts`. This run re-captures the identical build NOW, so the orchestrator can measure session/driver drift (this run vs `32-gpu-2/`).

## Read first
1. `C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md` (runtime probes; Playwright via Node, no MCP).
2. `project/work/evidence/rl300-quiet-machine/34-v16-assessment/gpu-seat-scripts/common.mjs` (the capture helpers; `capture()` writes `<name>.json` beside each PNG) and `phase-a.mjs` lines 20-32 (how `u34`/`u51` were captured for `32-gpu-2/`). Reuse them unchanged: copy `common.mjs` into your scratch dir and change ONLY its `E` constant (to the evidence dir `.../35-v16-round-1/before-now`). Same viewport screenshot, same `seekRest`, same `?quality=full`.

## Hard rules
- Build under test: the prebuilt dist at `C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/7a0ea69b-a024-4739-ae73-5eab43caed88/scratchpad/dist-before` (do NOT run `npm run build`; do not touch the repo's `dist/`). Its `index.html` sha256 is `b850f0c8346805bb436305f2879aea3c0e5923ff41c51276736ef32353969495`, `quiet-machine/index.html` is `e05687cdd6a79471c85cc4a73a7e1c62d45b4d7aba33fa66054c815a6b5c33c1`.
- Server: ONLY with the orchestrator's helpers, which record the real PID at launch:
  - check the port first: `curl -s -o /dev/null --max-time 3 http://localhost:4173/; echo $?` must print `7`;
  - `node <repo>/project/work/evidence/rl300-quiet-machine/35-v16-round-1/scripts/start-preview.mjs --dist <dist-before> --port 4173 --pidfile <scratch>/gpu/pid-4173.txt --log <scratch>/gpu/preview-A.log`
  - served check: `curl -s -o <scratch>/gpu/served-qm.html http://localhost:4173/quiet-machine/` then `cmp` it against `<dist-before>/quiet-machine/index.html` (do not pipe curl into `sha256sum`: CRLF makes it off by one byte); same for `/` vs `index.html`. A mismatch means a foreign or stale server: stop and report.
  - stop: `node .../stop-preview.mjs --pidfile <scratch>/gpu/pid-4173.txt --port 4173`, then re-run the curl port check (exit 7).
  - NEVER match processes by command line, image name or `pkill`/`taskkill /IM`; do not use `findpid.ps1`, `netstat` or `Get-NetTCPConnection` to find PIDs. Kill only the PID in your pidfile. Port 5199 is not needed; do not start a dev server.
- You edit NO tracked file and run no `git add`/`commit`/`stash`/`push`. No `npm run build`.
- Shell traps: the rtk hook rewrites `git diff`/`git log`/`grep` output (use `rtk proxy <cmd>` for evidence); `python3` hangs (use `node`); create files with the Write tool, not heredocs; quote every `>` and `=>` in one-liners (stray 0-byte files `key`, `2`, `Promise` exist in the repo root: do not create more, do not delete those). At the end run `git status --short`; the only new untracked path must be the evidence dir/run file.

## Captures (the whole job)
For each viewport `1440x900` and `390x844`, each `u` in `.34` and `.51`: one capture named `u34-<vp>` / `u51-<vp>` (PNG + sidecar JSON from `capture()`) into `before-now/`. That is 4 PNGs + 4 JSONs. Then write `before-now/cost.json`: an array of `{name, viewport, u, tier, gpu, drawCalls, renderedTriangles, geometries, textures, batches: counts.batches, sourceTriangles: counts.sourceTriangles, keptTriangles: counts.keptTriangles}` read from the four sidecars (batches == one material per batch == the material count).
Also read the same fields from the committed `32-gpu-2/u34-1440x900.json` etc. and add a second array `committed` to `cost.json` for the same four names, plus `gpuSameAsCommitted: true|false` (compare the `gpu` strings).

## Run file `run-A-baseline.md` (short)
HEAD, `node -v`, `describeLaunch()` output (from `scripts/lib/browser-launch.mjs`), the two dist hashes and that `cmp` matched for both, PID started and killed, port state before/after, the table of four captures with `tier`, `uMatchesRequest`, `tierMatchesRequest`, `nonFlatFraction`, and `gpuSameAsCommitted`.

## Report format (short, facts only)
Server start/stop lines and `cmp` results; the four captures' tier/u flags; `cost.json` numbers for both arrays; anything not done, stated plainly; PIDs started and killed; port state at end.
