# GPU seat spec, round 2 capture (connector on boss, stack aligned, CPM panels kept, MAN V16 pieces)

You are the single GPU seat (Sonnet 5.5, high, `tier-worker`). The orchestrator verifies every claim; report facts, not narrative. Soft budget 120k tokens. Owner standing rule: NO new tests, gate scripts or extra validation; do only what is listed.

Repo `/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine` (branch `quiet-machine/integration`). Absolute paths, no `cd`. Do not edit any tracked file; no git add/commit/stash; no `npm run build` (already built).
Round-1 method, helpers and scripts: `35-v16-round-1/specs/gpu-seat-spec-B-after.md` (read it; this spec only lists what changes), `35-v16-round-1/scripts/{start-preview,stop-preview,diffmap}.mjs`, and the round-1 capture code `OLD/gpu/common.mjs` + `phase-b.mjs` where `OLD=C:\Users\Markimus\AppData\Local\Temp\claude\C--Users-Markimus--buzz-REPOS-jgun-quiet-machine\7a0ea69b-a024-4739-ae73-5eab43caed88\scratchpad`. Copy what you need into your own scratch (`<NEW>/gpu2`, `NEW=C:\Users\Markimus\AppData\Local\Temp\claude\C--Users-Markimus--buzz-REPOS-jgun-quiet-machine\3005ef7b-b0b4-415a-93b5-a184f3119b26\scratchpad`); change only the output dir `E` to `35-v16-round-1/round2/`.

## Builds
- ROUND2 (under test): `NEW/dist-after2` (sha256 of its two `index.html` files are in the orchestrator's message).
- ROUND1 (frames for "before" where round 1 has none): `OLD/dist-after`. Its `index.html` sha256 must be `0057d31d7fb8945c42f94965fe1c6152127559c9d2f6e7f91bc365b4a4a18300` and `quiet-machine/index.html` `cda4c16ea837779af8592e0c26482e18b979c889e2e2c12bba431fb0c6ebadd8` (from `run-B-after.md`). If either differs, stop Step 3 and report.
- Between round 1 and ROUND2 the other (shell) track committed to the same branch; I checked it: `PageNav` still lists the same three pages on `/quiet-machine/`, so no on-page DOM difference is expected. If a diff changes pixels outside the canvas, say which region.

## Hard rules (unchanged)
Servers only through the start/stop helpers (`--dist --port 4173 --pidfile --log`); PID recorded at launch; prove port free (`curl -s -o /dev/null --max-time 3 http://localhost:4173/; echo $?` prints 7) before each start and after each stop; one server at a time; `cmp` served `/` and `/quiet-machine/` against the dist before capturing. NEVER match processes by command line / image name; no pkill, taskkill /IM, findpid.ps1, netstat. Create files only with the Write tool (heredocs and unquoted `>` in node -e one-liners create stray 0-byte files; python3 hangs: use node). If a stray 0-byte file appears in the repo root or under `34-v16-assessment/specs/`, do not delete it: list it in the report.

## Step 1: verifier (ROUND2 server), once
`BASE_URL=http://localhost:4173 node scripts/verify-jg033-preview.mjs`; save stdout/stderr + exit code to `round2/verify-jg033-preview.log`. Do not fix anything red; report the exact failing lines. Also report the draw-call numbers it prints (full and lite) against the pins 150 / 90.

## Step 2: captures on ROUND2 (all `?quality=full`, 1440x900; same `capture()`/`seekRest` as round 1, sidecar JSON for every PNG)
a. `round2/u34-1440x900.png`, `round2/u51-1440x900.png`.
b. Uncut connector + stack close-up: u 0.225, dsf 2, same clip `{x:713,y:146,width:360,height:282}` as round 1 -> `round2/closeup-exhaust-connector-uncut-full.png` and `round2/closeup-exhaust-connector-uncut.png`.
c. CPM panels: part bboxes from `public/models/msp-enclosure.glb` nodes `RL300-CPM-3001-1` and `RL300-P-CPM-2001-1` (use `OLD/gpu/glb-aabb.mjs`, glTF Y-up metres). Search u 0..1 step .005 with `evaluateShot` from `src/scene/rl300/shot.ts` exactly as round 1 (all 8 corners in front, in-viewport projected area, require `plane <= bbox.xMin - 0.02` so the cut plane is beyond the panels), once per part and once for the union; pick the best union u. Save the table to `round2/closeup-search-round2.json`. Capture `round2/closeup-cpm-full.png` + crop `round2/closeup-cpm.png` (dsf 2, clip = projected union bbox padded 40%, min 360x240).
d. MAN pump: the 8 mesh nodes under the `PUMP_HOUSING` root of `public/models/rl300-extra-parts.glb` (select by the root, not by a name glob; their world bbox union), same search and criterion, capture `round2/closeup-man-full.png` + `round2/closeup-man.png`. The area score ignores occlusion: if the pump is hidden behind the shell/other parts in the full frame at the best u, take the next-best u that shows it and state which u you used and why.
e. cost: `round2/cost.json` for every capture above (same fields as round 1; absent -> null).
Stop server, port-free proof.

## Step 3: ROUND1 frames at the new close-up u (ROUND1 server, `OLD/dist-after`)
Same u and clips as 2c and 2d -> `round2/round1-closeup-cpm{,-full}.png`, `round2/round1-closeup-man{,-full}.png` (+ sidecars). Stop server, port-free proof. (u34/u51 and the uncut connector already have round-1 frames in `35-v16-round-1/after/`.)

## Step 4: diffs (`diffmap.mjs before after out 8`; noise is 0, any change is real)
`round2/diff/` : u34-1440x900, u51-1440x900, closeup-exhaust-connector-uncut (vs `after/`), closeup-cpm and closeup-man (vs `round2/round1-*`). Report changedPct/maxDelta per pair.

## Report (short)
HEAD, both dist sha256 + cmp results, PIDs started/killed, verifier exit code + draw-call lines, table of every PNG (size, sidecar tier/u), chosen u + in-frame area % for CPM and MAN, diff table, stray files found, anything not done.
