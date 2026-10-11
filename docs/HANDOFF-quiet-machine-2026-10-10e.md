# HANDOFF (e): GPU-2 + GPU-3 ran, owner rulings pending, QM7 not started, 2026-10-10

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, HEAD `275a4c0a`, **nothing committed this session, nothing staged, nothing pushed**. Read this, then `docs/HANDOFF-quiet-machine-2026-10-10d.md` "GPU-2 + GPU-3 notes" is now done; the carried follow-ups table there still stands.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend (metered) | **279,957 tokens** this session: one Sonnet 5.5 `tier-worker`, effort high, GPU-2 leg 216,042 + GPU-3 leg about 63,915 (the resumed seat's notice is cumulative; settled by run-file timestamps 12:37:15 and 12:49:26 against durations 1,532 s then 2,256 s). All-time **2,113,574** (1,833,617 + this). Advisor (Opus 5.5) x2 and orchestration unmetered. No Opus or Haiku spawn |
| GPU-3 | **PASS**: 7/7 cases at 1440x900 and 390x844 on HEAD, nothing UNVERIFIED. Mutation 1 RED (no-white-frame dark 0.0039 / bright 0.9904, restored GREEN). Mutation 2 RED (`back`, `persisted=true`, restored GREEN). Case 7 (`reduced-motion-arrival`) RED on `f68db769`; `fade-out` also RED there (fallback fired, not `animationend`) |
| GPU-2 | verifier exit 0 (9 cases, only the 2 known stale-lite WARNs). Captures: `32-gpu-2/` |
| Owner decisions | (1) stale `rl300-lite.glb`; (2) intake framing at u .51; (3) end card copy and nav look (4 measured defects); (4) group A/B (unblocks QM7) |

## Measured facts for the rulings
- **Lite vs full (same u, same viewport):** lite 245,092 source triangles vs full 440,668; airway helper 24 vs 28; cap triangles 165,216 vs 154,554; textures 2 vs 4; shadows off in lite; 6.3-10.8 % of pixels differ. Every group A/B capture is `?quality=full`; sidecar `.json` beside each PNG records the resolved tier (derived from the GLB requested; the proof object has no tier field).
- **Intake ndc 21-26:** x extent of model-AABB corner 5, world (0.793, 0, 1.683), only 0.058 m ahead of the camera image plane. All 8 corners are in front of the camera. Camera (1.05, -0.13, 1.05) is 0.288 m outside the loose model box, beside its +x face and below the floor. That is a verifier artifact of projecting the whole-model box in a close-up; the owner's question is whether the u .51 framing (camera beside and under the machine, looking at its underside) is the shot he wants.
- **Header/nav/end card at 390 px:** (a) no "01"/"03" numbers render (plan line 398 says they should); (b) the end card and header nav link `/quiet-machine/` to itself with `data-fade` and `aria-current="page"`; (c) 2 `nav` landmarks at u .98, both labelled "Pages"; (d) header/editorial overlap 346 x 24.5 px at 390x667 (3.2 px high at 390x844), same on all 7 shots.
- **Not togglable at runtime:** reservoir 1019 policy (absent from `proof.parts`, default `section` policy, deepest cut plane -0.15 never reaches it) and chevron isolation response; both shown as current state.

## Run-method facts (for the next GPU seat)
- `curl -s URL | sha256sum` is off by one byte (CRLF) in this shell; use `curl -o file` + `cmp` against `dist/...`. The verifier's served-body assertion also passed.
- `netstat -ano` and `Get-NetTCPConnection` did **not** show the vite preview listener from the seat's shell. The seat found the PID from the process list (exact command line, creation time, child of its own bash) and killed by PID only. Use `curl` exit 7 to prove a port free. The session-start "ports free" check therefore proved nothing; the per-run hash check was the real guard.
- Case 7 red proof needed no GLB copy: `git ls-files --others --ignored --exclude-standard public/models` was empty at `f68db769` (all 8 model files tracked there).
- All four GPU-3 MP4s begin with one white frame (0.04 s, the recorder's about:blank lead-in). `*-trim.mp4` and `*-trim-{first,mid,last}.png` start at the first frame below luma 0.85; originals kept. The fade-out clip is clicked before the scene is ready (mid frame reads "PREPARING THE MACHINE..."). `reduced-motion-cut` is 0.24 s by design (a cut), so judge it from its trim mid/last PNGs.
- Mutation 2 removed both clears (attribute and storage flag) together; removing only one was not tested.
- The static-gate threshold for `reduced-motion-cut.mp4` was lowered from 1 s to 0.1 s after it failed on that expected duration.
- No separate refuting agent ran this session. Verification was the static gate files (`GATES-gpu2.md`, `GATES-gpu3.md`, session scratchpad) plus a direct `report.json` re-read.

## Hygiene
- Two 0-byte strays `key` and `JSON.parse(k))` appeared at 12:12:23.165 / .170 during the GPU-2 seat's run (session-start status was clean; no command the seat issued contained those strings). Names equal the tokens after `=>` on `scripts/verify-jg033-preview.mjs` lines 215 and 217 and were created 5 ms apart. Hypothesis, unproven: something passed displayed output through a shell. Deleted by the orchestrator (0 bytes, untracked, created in-session). No further action.
- Evidence is untracked: `project/work/evidence/rl300-quiet-machine/32-gpu-2/` (48 MB, includes `.webm`, tiles, `panel-candidates/`), `33-gpu-3/` (8 MB), and the two run files. Default plan: prune `.webm` copies, tiles and candidates before the evidence lands with QM7 (the owner can say keep). The QM6 mutation lines go into `qm-commit-gates.md` in that commit.
- Torque wrench page untouched (no tracked file changed; `git status` shows only untracked evidence).
- Owner rulings do not finish the end card, nav or fade: they still need Astra at GPU-8.

## Spawn ledger (this session, metered)
| # | Work | Seat | Effort | Tokens |
|---|---|---|---|---|
| 17 | GPU-2 run | Sonnet 5.5 (`tier-worker`) | high | 216,042 |
| 17b | GPU-3 run (same seat, resumed) | Sonnet 5.5 | high | about 63,915 (cumulative notice 279,957) |
| | **This session** | | | **279,957** |
| | **All-time** | | | **2,113,574** |
