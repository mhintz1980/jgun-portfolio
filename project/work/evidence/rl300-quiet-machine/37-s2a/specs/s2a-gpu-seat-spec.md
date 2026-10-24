# S2a GPU seat spec: byte-regression captures (Sonnet 5.5, high, tier-worker). Baseline now; "after" run follows by message.

You are the single GPU seat. The orchestrator verifies every claim; report facts. Soft budget 100k tokens. Owner standing rule: NO new tests or gate scripts; a capture script is allowed, a validation framework is not.

Repo `/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`. Absolute paths, no `cd` into the repo. Do not edit any tracked file; no git add/commit/stash; no `npm run build` (builds are prebuilt scratch dists).
Reuse the round-2 capture code: `NEW/gpu2/common.mjs` (`capture()`, `seekRest`, sidecars) where `NEW=C:\Users\Markimus\AppData\Local\Temp\claude\C--Users-Markimus--buzz-REPOS-jgun-quiet-machine\3005ef7b-b0b4-415a-93b5-a184f3119b26\scratchpad`; helpers `project/work/evidence/rl300-quiet-machine/35-v16-round-1/scripts/{start-preview,stop-preview}.mjs`; Round-2 spec `.../35-v16-round-1/specs/gpu-seat-spec-round2.md` explains the rules and helper args. Copy what you need into `NEW/gpu3`; evidence goes to `project/work/evidence/rl300-quiet-machine/37-s2a/`.

## Hard rules
Servers only via the helpers (`--dist --port 4173 --pidfile --log`), PID recorded at launch, one server at a time. Before EACH start prove ports 4173, 5199 AND 4191 all return curl exit 7 (`curl -s -o /dev/null --max-time 3 http://localhost:<p>/; echo $?`); 4191 is another session's: never use or touch it. `cmp` served `/` and `/quiet-machine/` against the dist's `index.html` before capturing. Stop with the helper; prove 4173 free after. NEVER match processes by command line or image name (no pkill, taskkill /IM, findpid.ps1, netstat). Create files only with the Write tool; python3 hangs (use node); list any stray 0-byte file you see, delete none.

## Run 1: BASELINE (now)
Build under test: `NEW/dist-after2` (sha256 `index.html` 2cc75fe7fe971d8a8245b9e93669ae12d345456bee379d637574fe185cbf4425, `quiet-machine/index.html` f757d3fd167ffef9db8a15af79fcf037aea4813ea40790eb3c298a813521b7b9). It is the pre-S2a build (HEAD `0c345b70`; render inputs unchanged since).
Captures: `?quality=full`, u in {0, .12, .2, .27, .41, .51, .61, .76, .89, .97, 1} at BOTH 1440x900 and 390x844, dsf 1, same `capture()`/`seekRest` as round 2, with sidecar JSON. Names `37-s2a/baseline/u<NNN>-<WxH>.png` where NNN = u*1000 zero-padded (`u000`, `u120`, `u200`, ..., `u1000`). 22 PNGs + 22 sidecars.
Then write `37-s2a/baseline/SHA256.txt` (sha256 of every PNG, one per line).

## Run 2: AFTER (later, the orchestrator will message you with a new dist path and sha256s)
Same captures into `37-s2a/after/`, same names. Then compare: PNG sha256 pairs (list any mismatch), and sidecar fields. Compare ONLY deterministic fields (u, plane, tier, drawCalls, renderedTriangles, geometries, textures, counts.*, extra*/mapped*); list which fields you excluded (timing fields like `frameResponseMs`, `renderCpuMs`, timestamps differ per run). If any PNG differs, run `35-v16-round-1/scripts/diffmap.mjs before after out 8` for that pair into `37-s2a/diff/` and report changedPct.

## Report (short)
HEAD, dist sha256 + cmp results, ports proven free (all three, each start), PIDs started/killed, table or count of files, sha256 of two sample PNGs, anything not done.
