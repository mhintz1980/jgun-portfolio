# 31 - GPU-1 run: QM4 entry smoke (JG-033 Quiet Machine integration)

Run date 2026-10-10. Seat: GPU-1 worker (Sonnet 5.5). Ports granted by the owner: 4173 (vite preview), 5199 (dev smoke). Measurement run only: no tracked file edited, nothing committed, staged or pushed. This file and `31-gpu-1/` are untracked, for the orchestrator to commit with QM5.

Scratch scripts (not committed, in the session scratchpad `C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/31bfe812-437c-47f6-9d0c-de80c3fe23d9/scratchpad/`): `capture.mjs` (plan stop-0 block plus guard read-out), `compare-plan.mjs` (plan compare block verbatim), `compare-extra.mjs` (blank test, sizes, guards), `redirect-header.mjs`, `histcal.mjs`, `dev-mount.mjs`, `deepdiff.mjs`, `summ-opening.mjs`. GL launch args in every script are those of `verify-jg033-preview.mjs`: `channel: 'chrome'`, `--use-gl=angle --enable-gpu --ignore-gpu-blocklist`.

## Part 0

Asset parity (CPU). Worktree `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, `git rev-parse HEAD` = `c41f499b8bc16bf04ba4cce7f78d5dedd4a1b4f5`.

| Command | Exit | Output |
|---|---|---|
| `rtk proxy git ls-files --others --ignored --exclude-standard public/models` | 0 | (empty) |

**Empty diff.** No ignored-and-untracked file under `public/models/`, so nothing was copied into `$U4/base/models/`. Cross-checks (file names and byte sizes identical in three places: this worktree `public/models`, base worktree `jgun-qm-base/public/models`, and `qm-u4/base/models`): `Default.glb` 10671700, `knurling-tool.glb` 1798620, `m249-transformed.glb` 892092, `manufacturing-core-full.glb` 678008, `manufacturing-core-lite.glb` 415424, `msp-enclosure.glb` 2671600, `rl300-lite.glb` 1139588, `role-map.json` 83136. All 8 are tracked (`git ls-files public/models` lists all 8). Byte-hash comparison was not run (sizes and the tracked list only).

Base worktree HEAD: `666cbf23d490352dc549b4730d3e9d14e042a5a4` (detached). `sha256sum qm-u4/base/index.html` = `592e9ee6289566a2b4e5a77326b445f08d336396085abc7e263fff97ff00f027`.

## Part 1

Base arm. `npx vite preview --strictPort --port 4173 --outDir C:/Users/Markimus/.buzz/REPOS/qm-u4/base`, run from `jgun-qm-base`. Server answered 200 on `/`.

**verify-jgun-opening --quick (base).** `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:4173 --out=C:/Users/Markimus/.buzz/REPOS/qm-u4/gpu1-jgun-base` from `jgun-qm-base`. The script supports `--out` (its own `arg('out')`); output written to that directory (273 files; `summary.json` 25.7 MB, `desktop.json`, `narrow.json`, 135 PNG+JSON per case). **Exit code 1.** Log tail:

```
static contract: 92 checks, 0 failures
desktop: ready in 21972 ms
desktop: FAIL (90 failures)
narrow: ready in 4157 ms
narrow: FAIL (1 failures)
```

Deciding lines (digest at `31-gpu-1/part1-jgun-opening-base.digest.json`):

| Case | passed | failures | messages (counts) |
|---|---|---|---|
| desktop 1600x900 | false | 90 | `desktop-forward##: expected full tier for browser evidence, got lite` x46; `desktop-pinned##: expected full tier for pinned phase evidence, got lite` x43; `desktop-forward##: lightning pixel proof failed (mesh visibility, fixed camera, contour, or bright-pixel delta)` x1 |
| narrow 390x844 | false | 1 | `narrow-forward##: lightning pixel proof failed (...)` x1 |

`summary.json`: `passed: false`, `staticContract {checks 92, failures 0, limitations 0}`, `contextLosses 0` both cases, `browser: "installed Chrome, ANGLE/D3D11 (hardware)"`, `browserVersion 154.0.8037.98`, `flexTierComparison: compared false` for both. The desktop case ran on the **lite** quality tier (that is the 89 "expected full tier" failures); this is the baseline the QM4 arm is compared against, not a QM defect.

**Stop-0 capture, base arm.** `http://localhost:4173/?study=rl300&shot=0`, twice, 1440x900 dsf 1, `.qm-header, .qm-editorial` hidden via `addStyleTag`, `.qm-stage` locator screenshot (1109x702). Both exit 0:

| File | sha256 |
|---|---|
| `31-gpu-1/qm-stop0-base-a.png` | `4d52f3100fb0d53d485a2414891443d9928ec9e6013733dc4eabf21ce69addcb` |
| `31-gpu-1/qm-stop0-base-b.png` | `4d52f3100fb0d53d485a2414891443d9928ec9e6013733dc4eabf21ce69addcb` |

Provenance of the base arm: both base captures end at `href` `http://localhost:4173/?study=rl300&shot=0` (`*.guard.json`); a QM4 build would have redirected to `/quiet-machine/`, so this shows the base build was the one served.

Server stopped by PID (`taskkill //PID 30388 //F //T`, 4 processes ended); afterwards `fetch http://localhost:4173/` gave ECONNREFUSED.

## Part 2

QM4 arm. HEAD `c41f499b8bc16bf04ba4cce7f78d5dedd4a1b4f5`.

**Build.** `npm run build` exit 0 ("built in 11.21s"; log `31-gpu-1/part2-build.log`; chunk-size warning for `BufferGeometryUtils` 739 kB is the known three-core chunk). `git status --porcelain --untracked-files=no` immediately after the build: empty.

```
1a5bb750a0befddd76e210aba04bb61070b070f048c86c991c431f4d4a892705 *dist/index.html
c6f82f47b9c38a9b1d2d42c486b22ac1ec320feab433c1b5453cf10ea4df8156 *dist/quiet-machine/index.html
```

Preview restarted on 4173 after the rebuild (`npx vite preview --strictPort --port 4173`, this worktree). Served `/quiet-machine/` HTML sha256 equals the dist file (`c6f82f47...`), checked in the redirect step below.

**(a) `BASE_URL=http://localhost:4173 OUT=.../31-gpu-1/jg033-preview node scripts/verify-jg033-preview.mjs` - exit 1 (FAIL).**
It fails on the very first capture (desktop, shot `exterior`), before any reduced-motion or context-loss block runs. Log (`31-gpu-1/part2a-verify-jg033-preview.log`, `31-gpu-1/jg033-preview/report.json`):

```
"failure": "AssertionError [ERR_ASSERTION]: only liner, airway helper and ruled removals omitted\n\n596 !== 592\n",
"build": "c6f82f47b9c38a9b1d2d42c486b22ac1ec320feab433c1b5453cf10ea4df8156",
"composer": "direct", "ruledParts": 24, "checks": {}, "errors": []
```

Source of the assertion: `scripts/verify-jg033-preview.mjs` lines 106-107: `sourceTriangles - keptTriangles` (actual 596) vs `108 + 24 + removedTriangles` (expected 592, with `removedTriangles` pinned to 460 on line 108). So the model reports 4 more omitted triangles than the verifier's constants allow. Evidence on where it comes from, read from git (not re-run): `git diff --stat 666cbf23 c41f499b` shows `src/scene/rl300/prepareModel.ts` and `public/models/*` unchanged between base and HEAD, and the diff hunks of `scripts/verify-jg033-preview.mjs` between base and HEAD do not touch lines 105-108 (the `108 + 24` text dates from `fe8ca644`, 2026-09-22; prepareModel last changed 2026-09-24). Reading: the mismatch predates QM0-QM4 (a stale verifier constant or a model change after the constant was set); this is an inference, not a measurement, because the verifier was not run against the base build. Hypothesis for the QM4-fix author (unmeasured): if the liner (108) and the removals (460) are right, the airway-helper term works out to 28, not 24. The `108 + 24` text dates from `fe8ca644` (2026-09-22); `15fd4884` (2026-09-24, "integrate the owner's Blender export") later changed `prepareModel.ts` and `msp-enclosure.glb`: inspect that commit first. No earlier report with `captures[].telemetry.counts` was found (`output/playwright/quiet-machine/` does not exist in either worktree; the two `captures.json` files under this evidence dir carry no `counts`). Product and verifier were not edited. Consequences: the 4 cases (desktop/portrait/tablet/lite), `ruledParts` assertions beyond the 24 found, the QM3 `reducedMotionPoster` block and the `contextLoss` block did **not execute**: **UNVERIFIED**. `report.json` has `captures: []`. One PNG exists: `jg033-preview/desktop-exterior.png`.

**(b) `BASE_URL=http://localhost:4173 node scripts/verify-jg033-ribbon-clipping.mjs` - exit 0 (PASS).** All 7 assertions pass (`main clipping enabled`, `merged clipping enabled`, `lower clipping disabled`, `main exclusion changes pixels`, `merged exclusion changes pixels`, `restore matches baseline`, `lower no-plane invalidate is inert`); main/merged `changed 19281, fraction 0.024766, meanChannelDelta 2.4648`; restore and lower `changed 0`. Log `31-gpu-1/part2b-verify-jg033-ribbon-clipping.log`.

**(c) Stop-0 capture, QM4 arm.** `http://localhost:4173/quiet-machine/?shot=0` -> `31-gpu-1/qm-stop0-qm4.png`, exit 0, 1109x702, sha256 `4d52f3100fb0d53d485a2414891443d9928ec9e6013733dc4eabf21ce69addcb` (byte-identical to both base captures).

**(d) Compare** (plan block run verbatim from this worktree, exit 0; file `31-gpu-1/part2d-compare.json`):

```
{"noise":{"changed":0,"fraction":0,"meanChannelDelta":0},"diff":{"changed":0,"fraction":0,"meanChannelDelta":0},"limit":0.01,"pass":true}
```

Guards, read in the page after the style tag and the 500 ms wait, immediately before the screenshot (`31-gpu-1/*.guard.json`, `part2d-guards-and-blank.json`):

| Arm | `.qm-poster` element | `html[data-fade]` | `__quietMachine.ready` | frame | canvas in `.qm-stage` | range value | console/page errors | non-flat fraction vs #101b24 (>8) |
|---|---|---|---|---|---|---|---|---|
| base-a | absent | null | true | 5 | yes | "0" | none | 0.6197 |
| base-b | absent | null | true | 5 | yes | "0" | none | 0.6197 |
| qm4 | absent | null | true | 5 | yes | "0" | none | 0.6197 |

Pass rule: `diff.fraction 0 <= max(0.01, 2 * noise.fraction 0) = 0.01` holds; `noise.fraction 0 <= 0.01` so the run is valid; base capture not blank (0.6197 > 0.05); all guards hold in both arms. `meanChannelDelta`: noise 0, diff 0. Caveat: a noise floor of exactly 0 and three byte-identical PNGs show the stop-0 pose at u=0 is fully deterministic in this setup; it does not exercise any non-zero pixel difference.

**(e) Redirect smoke** (fresh context; `31-gpu-1/part2e-g-redirect-header.json`): `GET /?study=rl300&quality=lite` first response 200 (the redirect is client side: `location.replace` in the `shell:redirect` block of `index.html`). Final URL `http://localhost:4173/quiet-machine/?quality=lite` (pathname `/quiet-machine/`, search `?quality=lite`, hash empty). `history.length` = **2**. Calibration (`part2e-history-calibration.json`): a direct load of `/quiet-machine/?quality=lite` and of `/?quality=lite` in a fresh context also give `history.length` 2 (initial about:blank counts as 1), so the redirect added no extra history entry. Page title `The Quiet Machine · RL300 Section Study`; `__quietMachine.ready` true, no `.qm-poster`, no `data-fade`, no page errors. Served `/quiet-machine/` HTML sha256 == `dist/quiet-machine/index.html` (`c6f82f47...`).

**(f) verify-jgun-opening --quick on the QM4 build.** `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:4173 --out=C:/Users/Markimus/.buzz/REPOS/qm-u4/gpu1-jgun-qm4`, run from this worktree. **Exit code 1** (same as Part 1). `git diff --stat 666cbf23 c41f499b -- scripts/verify-jgun-opening.mjs` is empty: the same verifier ran in both arms. Log tail:

```
static contract: 92 checks, 0 failures
desktop: ready in 19250 ms
desktop: FAIL (90 failures)
narrow: ready in 4257 ms
narrow: FAIL (1 failures)
```

Comparison base (Part 1) vs QM4 (`summary.json` to `summary.json`, full leaf walk, 557447 leaves, 14414 differ; machine output `31-gpu-1/part2f-jgun-opening-base-vs-qm4.diff.json`, 71 path patterns):

- Identical: `passed` (false/false), static contract (92/0/0), failure counts per case (90 and 1), `contextLosses` 0/0, `reducedMotion`, `width/height`, `cadRequests`, `flexTierComparison` (not compared in both). The failure lists are identical leaf for leaf: none of the 71 diff patterns is under `cases[].failures[]` (this is the raw-leaf diff; the digest counts above collapse checkpoint indices and are not the evidence for identity).
- Caveat on what "identical verdicts" covers: desktop ran on the lite tier in both arms, so the comparison is lite against lite. Full-tier JGUN desktop coverage is absent in both arms, and checks behind the tier gate may never have run in either.
- Differ, discrete: `started`/`finished` timestamps; `gitStart`/`gitEnd` ("" in base worktree vs the three strays plus the untracked evidence dir here); `navigation[].confidence.value` "high" (base) vs "low" (QM4) on one case.
- Differ, timing only: `coldLoadReadyMs` desktop 21972 -> 19250, narrow 4157 -> 4257; `domContentLoadedMs` desktop 323 -> 145; navigation entries (`responseStart`, `duration`, `transferSize` 995 -> 1234 bytes, `decodedBodySize` 2116 -> 2729: the HTML entry grew by the QM4 shell block, `navigationId`); per-checkpoint `at`, `settleMs`, `sheetStats.*Ms`, `gl[].draws`, `gl[].lastDrawAt`.
- Differ, numeric but physical: forward `checkpoints[]` camera/projected features differ by at most about 6e-8 (camera) and 1.2e-6 (projected feature coords), `registeredHold` at most 5e-9, with these exceptions: `rig.stageRot[]` max abs delta 0.2086 rad (5 values), `rig.planetRot` 0.730 rad (1 value). `pinnedCheckpoints[]` (86 of them) show larger deltas: camera x up to 0.0317, y 0.1078, z 0.0446, fov 1.046 deg; `captureRegistration.projectedFeatures` expected/actual up to 0.37 (normalised units); `errorPixels` up to 23.9. No same-build control pair was run in this session, so whether the pinned deltas are capture noise (they sit in the lite-tier run, where timing varies) or a build effect is **UNVERIFIED**. Since the failing verdicts and counts are identical in both arms, the QM4 build did not change pass/fail of any JGUN check that the base evaluates.

**(g) QM header at 390x844** (`/quiet-machine/`, default quality; `31-gpu-1/qm-header-390x844.png`, full viewport). Measured, not judged:

| Item | Value |
|---|---|
| `.qm-header` rect | x 22, y 22, width 346, height **73.5** px (bottom 95.5), `display:flex`, `flex-wrap:nowrap` |
| header `scrollWidth` / `clientWidth` | 346 / 346 (no overflow) |
| brand link `a` | x 22..126.7, h 50.5 (two lines: `MARK HINTZ` / `ENGINEERING & DESIGN`) |
| `nav.shell-nav.shell-nav-header` | x 126.7..266 (139.3 wide), h 73.5, a vertical list of 3 `li`: `TORQUE GUN` (h 19.5), `THE QUIET MACHINE` (h 39, wraps to 2 lines), `M249, in preparation` (h 15) |
| `RL300 / SECTION STUDY` span | x 266..368 (102 wide), h 21, y 48.3 |
| any of the 12 header nodes with `scrollWidth > clientWidth` | **none**. Inline anchors always report 0/0, so that test says nothing for them; the real nav-item measurement is the `li` boxes (139/139 each) and the `ul`/`nav` (139/139), plus the right edges (max 368 of 390) |
| any node's right edge past the 390 px viewport | none (max right 368) |
| `documentElement` `scrollWidth` vs `clientWidth` | no horizontal overflow |

**Dev smoke** (`npx vite --strictPort --port 5199`, this worktree, Vite v7.3.6; `31-gpu-1/part2-dev-smoke-status.txt`). `curl` status, same result with `Accept: */*` and `Accept: text/html`:

| Path | Status |
|---|---|
| `/` | 200 |
| `/quiet-machine/` | 200 |
| `/quiet-machine` (no slash) | **404** (mpa has no SPA fallback; Cloudflare no-slash redirect unverified, as the handoff says) |
| `/m249/` | 404 |
| `/definitely-not-a-page` | 404 |

Mount in the dev server (`waitUntil: 'load'`, `31-gpu-1/part2-dev-smoke-mount.json`): `/quiet-machine/` status 200, `window.__quietMachine.ready` true after 2360 ms (frame 3), canvas present in `.qm-stage`, no `.qm-poster`, no `data-fade`, no page errors, no console errors. Dev server stopped by PID (`taskkill //PID 38404 //F //T`, 2 node processes ended).

**Servers.** Both stopped by PID; afterwards `fetch` of `http://localhost:4173/` and `http://localhost:5199/` give ECONNREFUSED and no vite process remains (process list by command line). `netstat -ano | grep LISTEN | grep -E ':(4173|5199) '` printed nothing; but note that in this worker's shell `netstat -ano` never listed the preview listener even while it was serving (only 4 LISTENING rows total), so that command's empty output from this shell is not by itself proof; the ECONNREFUSED fetch and the process list are.

**Not done / UNVERIFIED.**
- `verify-jg033-preview.mjs` cases and the QM3 `reducedMotionPoster` and `contextLoss` blocks: did not run (stopped at the first assertion, see (a)). I did not patch the verifier or run a modified copy, per the spec.
- Whether the 596 vs 592 assertion also fails on the base build: not run (inferred only, from unchanged source).
- Part 0 compared names and sizes, not hashes.
- Same-build control pair for verify-jgun-opening pinned-checkpoint deltas: not run (recommended for the GPU-1 re-run, to size those deltas).
- Exit codes not captured: the history-calibration run (`histcal.mjs`) went through `tee`, so its exit status was not recorded (its JSON output was complete). The redirect/header script and the dev-mount script printed exit 0; the capture scripts printed `capture exit: 0`.
- No video, no 768x1024 viewport capture (not requested by the GPU-1 steps).

## Result

**FAIL:** `verify-jg033-preview.mjs` exits 1 at its first capture assertion (596 !== 592), so its 4 cases and the reduced-motion and context-loss blocks did not run; stop-0 parity (diff 0, noise 0), ribbon clipping, redirect and dev smoke pass. Per plan section E a failure is fixed by a `QM4-fix` commit and GPU-1 re-runs before QM5.

## Re-run after QM4-fix (orchestrator, same ports 4173, same build host; QM4-fix commit follows this section)

Diagnosis of the first FAIL (orchestrator, not the seat): the failure is **not a QM4 regression**. Run against the base build (`qm-u4/base`, `jgun-qm-base` cwd) `verify-jg033-preview.mjs` fails identically: `596 !== 592`. Cause: `DUCT_INTAKE_AIRWAY` in `public/models/msp-enclosure.glb` has 28 triangles (accessor count, measured), the verifier pinned 24; the lite asset `rl300-lite.glb` still has 24. The verifier was last edited 2026-09-22, the scene moved 2026-09-24/25 (`15fd4884`, `f4263f6f`) and nothing re-ran it. Clearing that exposed two more stale checks that also fail on the base build's scene, then one product defect:

| # | Finding | Kind | Fix in QM4-fix |
|---|---|---|---|
| 1 | airway helper 24 vs 28 (counted from the GLB accessors with a node script: `msp-enclosure.glb` DUCT_INTAKE_AIRWAY 28, `rl300-lite.glb` 24) | stale verifier constant (full) + stale lite asset | full pinned 28; lite 24 tolerated with a stderr WARN |
| 2 | `camera is inside the machine` at intake: worst ndc of the model box 21.586 desktop, 26.368 tablet, 6.502 portrait, 6.524 lite at the owner's stop-04 camera (`f4263f6f`). Whether that camera sits inside the shell is the owner's question at GPU-2, not settled here | stale verifier bound | intake shots pinned per viewport (`abs(worst - measured) < 0.5`), all other shots stay <= 2; a mutation proves the pin goes red |
| 3 | `lite must preserve every cap-counting triangle`: lite 165216 vs full 154554, so the lite capped set has 10,662 MORE triangles (lite asset is not derived from the current full asset) | **product data finding**, not fixed | tolerated ONLY at exactly 165216 / 154554 with a stderr WARN and a `knownStale` entry; any other value fails the run (mutation proves it) |
| 4 | QM3 `contextLoss` block: poster never shown after a synthetic `webglcontextlost` right at `__quietMachine.ready` | **product defect (QM3)** | listener moved to `.qm-stage` capture phase; test added |

Finding 4 detail (instrumented run, `addEventListener` hook): the preview attached its handler to `document.querySelector('.qm-stage canvas')` inside an effect keyed on React `ready`, so the listener was registered at t=1119 ms while `__quietMachine.ready` (set per frame) was already true; a loss in that window was missed and the poster never appeared (`poster:false`, canvas still mounted, status `SCROLL TO EXPLORE`). Standalone five-in-a-row probes won the race, the verifier lost it every time on a warm cache.

Re-run on the QM4-fix build (`npm run build` exit 0, preview restarted on 4173). Two passes: the first with the commit as first landed, the second (`qm4fix2-*` files) after review amended the verifier pins (findings 1-3 as described):

| Check | Result |
|---|---|
| `BASE_URL=http://localhost:4173 node scripts/verify-jg033-preview.mjs` | **exit 0**. Cases: desktop, portrait, tablet, lite, reducedMotionPoster, contextLoss, poster, asset-failure, lite-asset-failure all pass; `errors: []`; `knownStale`: 1 entry (finding 3) |
| `reducedMotionPoster` | pass: poster without a canvas, scroll inert, controls swap the poster (first real run of the QM3 block: PASS) |
| `contextLoss` | pass: webglcontextlost falls back to the poster (first run FAIL, finding 4; PASS after the fix) |
| `node scripts/verify-jg033-ribbon-clipping.mjs` | exit 0, `pass: true` |
| stop-0 `compare(base-a, qm4fix)` | `diff.changed 0, fraction 0, meanChannelDelta 0`; noise 0; limit 0.01; guards no `.qm-poster`, no `data-fade`, `__quietMachine.ready` true (`qm-stop0-qm4fix.png`) |

Not re-run after the fix (unchanged by it): redirect smoke, dev smoke, header capture, `verify-jgun-opening --quick`. **JGUN runtime arm: UNVERIFIED.** The opening verifier resolved the lite tier on desktop in both arms, so full-tier JGUN never ran, and the base-vs-QM4 deltas (camera y up to 0.108, fov 1.05 deg, planetRot 0.73 rad) have no same-build control pair, so noise vs change is not established. The stop-0 capture is the QM page, not the torque page, and says nothing about JGUN; only U.4 (JGUN source set and fetched CSS identical) speaks for it. The GPU release by the JG-035 session was relayed in the handoff and not re-confirmed this session; no process listened on 4173/5199 before the run.

## Result (re-run)

**PASS** after `QM4-fix`: verifier exit 0 with all nine cases, ribbon exit 0, stop-0 identical. Findings 1 and 3 are the stale lite asset (tolerated at exact measured values, WARN on every run, owner decision needed); finding 2 is pinned per viewport.
