# 32 - GPU-2 run: QM5 capture pass (JG-033 Quiet Machine integration)

Run date 2026-10-10. Seat: GPU-2 worker (Sonnet 5.5). Measurement run only: no tracked file edited, nothing staged, committed, stashed or pushed. This file and `32-gpu-2/` are untracked, for the orchestrator to commit.
Scratch scripts (not committed): `C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/df06f954-a691-4644-b235-2da4781e90da/scratchpad/gpu/` (`common.mjs`, `phase-a.mjs`, `phase-b.mjs`, `phase-c.mjs`, `glb-aabb.mjs`, `hashcheck.sh`, `run-verify.sh`, `sidecars.mjs`).

## Identity

| Item | Value |
|---|---|
| HEAD (`rtk proxy git rev-parse HEAD`) | `275a4c0ad7a1212b20a38fda630394cac88605ab`, branch `quiet-machine/integration` |
| node | v22.19.0 |
| `describeLaunch()` | `installed Chrome, ANGLE/D3D11 (hardware)` (`launchBrowser`: `channel: 'chrome'`, `--use-angle=d3d11`; the verifier itself uses `--use-gl=angle --enable-gpu --ignore-gpu-blocklist`) |
| GPU string from the proof | `ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)` |
| `npm run build` | exit 0, "built in 15.99s" (`32-gpu-2/build.log`); `git status --porcelain --untracked-files=no` empty afterwards |
| `dist/index.html` sha256 | `b850f0c8346805bb436305f2879aea3c0e5923ff41c51276736ef32353969495` |
| `dist/quiet-machine/index.html` sha256 | `e05687cdd6a79471c85cc4a73a7e1c62d45b4d7aba33fa66054c815a6b5c33c1` |
| Served `/quiet-machine/` and `/` (byte-exact, `curl -o` to a file) | identical to the two dist hashes above, before the verifier and before every capture phase (A, B x2 reruns, C): `HASHCHECK MATCH` each time (`32-gpu-2/hashcheck-before-verifier.txt`) |
| Preview server | `node node_modules/vite/bin/vite.js preview --strictPort --port 4173`, PID **11576** (plus its child 9704), started and killed by this seat only |

**Hash-check method note.** The spec's literal `curl -s URL | sha256sum` does NOT match on this machine: piping curl output through this shell/hook turns the final `\r\n` into `\n` (3503 bytes instead of 3504; `od -c` of the tail shows `\r \n` vs `\n`). `curl -s URL -o file` followed by `sha256sum` matches the dist file byte for byte (`cmp` empty, same 3504 bytes). The verifier also asserts the served body hash equals `dist/quiet-machine/index.html` for every case and passed. I treated the pipe mismatch as a shell artefact, not a foreign server; all gating hashes use the `-o` form.
**PID note.** `netstat -ano` and `Get-NetTCPConnection` never listed the 4173 listener from this shell (same as GPU-1). The PID was taken from the process list: the single node process whose command line is exactly the command I issued, created at the launch minute, child of the background bash of that launch, with the port verified free before launch. Killed with `taskkill //PID 11576 //T //F` (killed 9704 and 11576).

## Step 1: `verify-jg033-preview.mjs`

`OUT=<32-gpu-2>/verify-jg033-preview BASE_URL=http://localhost:4173 node scripts/verify-jg033-preview.mjs > 32-gpu-2/verify-jg033-preview.log 2>&1` (OUT redirected into the evidence dir; `CAPTURE_POSTERS` not set).

- **Exit code 0.** `failure` absent, `errors: []`, `ruledParts: 24`, 28 captures (4 viewports x 7 shots).
- All cases pass: desktop, portrait, tablet, lite, reducedMotionPoster, contextLoss, poster, asset-failure, lite-asset-failure.
- Expected stderr WARN lines only (printed once per lite shot, 14 lines, two distinct): `WARN known-stale: lite cap triangles 165216 != full 154554 (...)` and `WARN known-stale: lite airway helper is 24 triangles, full is 28 (...)`. No other warning.
- `frameResponseMs` p50/p95 (ms): desktop 16.7/17.5, portrait 16.7/17.3, tablet 16.7/17.2, lite 16.7/17.3 (vsync-bound, not a perf claim).
- Last lines of the log: `"errors": []`, `}`, `exit=0`.

## Step 2: files (all `?quality=full` unless the name says lite)

Every PNG has a `<name>.json` beside it: `{tier, u, ready, viewport, url, ...}` plus counts, partCount, drawCalls, renderedTriangles, camera, cutPlane, nonFlatFraction vs #101b24, pngSha256. The `tier` is **derived from the GLB actually requested** (`msp-enclosure.glb` = full, `rl300-lite.glb` = lite); the proof object has no tier field. For every capture the resolved tier equals the requested one (`tierMatchesRequest: true`) and the proof `u` equals the requested u (`uMatchesRequest: true`, range slider value matches). No page or console errors in any capture. Screenshots are viewport screenshots (`page.screenshot()`, no `fullPage`), `deviceScaleFactor: 1`, 500 ms at rest and a frame counter confirmed idle before each.

| File | Bytes | Resolved tier |
|---|---|---|
| `u34-1440x900.png` | 352092 | full |
| `u34-390x844.png` | 121433 | full |
| `u51-1440x900.png` | 267388 | full |
| `u51-390x844.png` | 101940 | full |
| `sheet-1440x900.png` (7 tiles at SHOTS midpoints, 2 columns, tiles 960 px wide) | 1381306 | full |
| `sheet-390x844.png` (7 tiles, 4 columns, native size) | 741854 | full |
| `sheet-tiles/<vp>-shot1..7.png` (+json, the unlabelled tiles) | see dir | full |
| `intake-closeup-1440x900.png` | 282172 | full |
| `intake-closeup-768x1024.png` | 196757 | full |
| `intake-raw-1440x900.png` | 267388 | full |
| `intake-raw-768x1024.png` | 182131 | full |
| `reservoir-1019-vs-1020.png` (+ `reservoir-raw-1440x900.png`) | 340490 / 352092 | full |
| `chevrons.png` (+ `chevrons-raw-u840/u873/u900.png`) | 549899 | full |
| `panel-2a-current.png` (+ `panel-candidates/*.png`) | 807617 | full |
| `header-390x667.png` | 58428 | full |
| `header-390x844.png` | 70883 | full |
| `endcard-390x667.png` | 53265 | full |
| `endcard-390x844.png` | 67448 | full |
| `endcard-1440x900.png` | 189985 | full |
| `endcard-768x1024.png` | 144257 | full |
| `lite-vs-full-u34-1440x900.png` | 621740 | full+lite |
| `lite-vs-full-u34-390x844.png` | 206610 | full+lite |
| `lite-vs-full-u51-1440x900.png` | 447535 | full+lite |
| `lite-vs-full-u51-390x844.png` | 156855 | full+lite |
| `lite-vs-full-tiles/*.png` (+json) | see dir | full / lite |
| `lite-vs-full-telemetry.json` | - | - |
| `forward-reverse.webm` / `.mp4` | 4438264 / 7350002 | full |
| `forward-at-proposed-length.webm` / `.mp4` | 6689377 / 9011216 | full |
| `verify-jg033-preview/` (28 verifier PNGs + `report.json`), `verify-jg033-preview.log`, `build.log`, `probes-header-endcard.json`, `phase-*.json`, `videos-log.json`, `hashcheck-before-verifier.txt` | - | - |

SHOTS midpoints used (computed from `SHOTS` by importing `shot.ts`): .06, .195, .34, .51, .685, .825, .945. Shot 3 midpoint equals the u .34 hold and shot 4 the u .51 hold; the PNGs are byte-identical (same sha256).
**Sheet tool.** No sharp, canvas, pngjs or ImageMagick is installed (`ls node_modules`, `which magick`). The sheets, side-by-sides and overlays are composited with a Chromium page used as a canvas (data-URL images plus DOM labels); the 7 raw tiles are kept too. This goes beyond the spec's fallback ("otherwise write 7 tiles") and is named here so it is not mistaken for sharp output.

## Intake ndc finding (reproduces the verifier computation)

Computation: `worst = max(|ndc.x|, |ndc.y|)` over `__quietMachine.projection`, the 8 corners of the **model group's world AABB** (`Box3.setFromObject(model.group)`) projected through the live camera; it is the loose model box, not the LowerIntake mesh.

| | 1440x900 | 768x1024 |
|---|---|---|
| tier / u | full / .51 | full / .51 |
| stage canvas | 1108.8 x 702 | 768 x 593.9 |
| camera branch (`size.width < 600`) | landscape | landscape |
| camera / target / fov | (1.05, -0.13, 1.05) / (-0.2, 0.2, 0.6) / 38 | same |
| cut plane | -0.15 | -0.15 |
| ndc x extent | -21.586 .. 3.922 | -26.368 .. 4.791 |
| ndc y extent | -0.572 .. 11.104 | -0.572 .. 11.104 |
| worst |ndc| | **21.586** (x) | **26.368** (x) |

The pins in the verifier (21.586 desktop, 26.368 tablet) are reproduced to three decimals; portrait 6.502 and lite 6.524 are reproduced in the lite-vs-full run at 390x844. The 21-26 extent is the **x** extent of corner 5 = world (0.793, 0, 1.683) (the +x, floor, +z end corner), ndc (-21.586, 5.970, z .312). That corner lies **0.058 m in front of the eye** (view z -0.058, in front of the near plane .02), so the huge ndc is a near-zero depth denominator, not a sign flip: all 8 corners are in front of the camera (view z from -0.058 to -3.12), none behind. The camera is **outside** the AABB (x 1.05 is 0.257 beyond the +x face at 0.793, y -0.13 is 0.13 below the floor at 0), 0.288 m from the box, and on the cut-away side of the plane (plane keeps x <= -0.15). Reading: corner 5 is far off-axis (0.63 m from the camera in z) but only 0.058 m ahead of the camera's image plane, so the large value is a near-zero-depth projection; the camera is 0.288 m outside the loose model box, beside its +x face and below the floor, on the cut-away side, not inside the machine. The camera rebuild matches the proof position exactly and the reprojection of the unprojected corners matches to 1e-13.
Overlay: the RED rectangle is the verifier's AABB clipped to the viewport; its left, top and right edges are thousands of px off-screen, so only its bottom edge (ndc y -0.572, about y = 633 px at 1440x900) is visible as a horizontal line, and everything above it is inside the box. The CYAN dashed rectangle (the near-plane-clipped box) is identical to the numeric extents and equally off-screen. Numbers per corner are in `phase-b-intake.json`.

## Seat-flagged defects and probes (390x667 and 390x844; `probes-header-endcard.json`)

| # | Probe | Result (both viewports unless stated) |
|---|---|---|
| a | Does any "01"/"03" render in the nav or end card (plan line 398)? | **No.** Nav and end card text is exactly `TORQUE GUN`, `THE QUIET MACHINE`, `M249, in preparation`; the dumped text contains no digit at all (a word-boundary regex cannot be the evidence, the text is); no `::before`/`::after` content, no counters. (The only numerals on the page are the eyebrow `0N / 07`, outside the nav.) |
| b | End card links the current page to itself with `data-fade`? | **Yes.** In `.qm-endcard`, `THE QUIET MACHINE` is `href="/quiet-machine/"` (current path), `data-fade` present, `aria-current="page"`. The header nav does the same. `TORQUE GUN` is `/` with `data-fade`; `M249` is a non-link `shell-nav-reserved` span (not an anchor). |
| c | `nav` landmarks and labels | At u 0: **1** (`nav.shell-nav-header`, `aria-label="Pages"`). At u .98: **2**, both `aria-label="Pages"` (header + end card), both displayed and visible. |
| d | `.qm-header` vs `.qm-editorial` overlap | At **390x667**: header rect (22, 22)-(368, 104.5), editorial top 80: overlap **346 x 24.5 px** (area 8466 px^2), the same on all 7 shots (editorial `top: 12vh` is fixed; only its bottom changes). At 390x844 (editorial top 101.3): overlap 346 x 3.2 px. |

End card renders at u .98 on all four viewports (`.qm-endcard` present; `uMatchesRequest` true).

## Reservoir 1019 vs 1020 (`reservoir-1019-vs-1020.png`, u .34, 1440x900)

Runtime cannot toggle 1019: `PART_POLICY` is a static const and the proof has no setter. The image shows the current state: two crops (3x, pixelated) and the full frame with the projected GLB node AABBs (green 1019, red 1020). Telemetry: `V2RL300-SAF-RES-1020-SAFE-1` in `proof.parts`: policy `keep`, clipped false, repainted false, 348 triangles, x .2933 .. .5119 (matches the GLB-derived box x .293 .. .512). **`V2RL300-SAF-RES-1019-SAFE-1` is absent from `proof.parts`** (the proof lists only the 24 ruled parts); it takes the default `section` policy. GLB box 1019: x -.513..-.294, y 1.032..1.251, z .94..1.461. Derived: the deepest cut plane (-0.15) never reaches x <= -0.294, so the plane never intersects 1019 at any u. Occlusion was not tested; both crops show yellow bodies partly behind the white flanged pipes.

## Chevrons (`chevrons.png`, ev 25 sec 4)

No runtime toggle exists (the response is `uProgress`-gated in the fragment shader, +30% over u .856-.894; the ribbons proof exposes only clip overrides). Frames are current state at u .84 (before onset), .873 (peak), .90 (after). Camera and sound fronts also change between them, so the pixel diff in the chevron region (983-1321 x 632-765 px: fractions 0.78, 0.46, 0.74 for .873-vs-.84, .873-vs-.90, .84-vs-.90) is dominated by camera motion and says nothing about the response alone. At u .873 the three mounts on the kept side (x = -0.53) project to ndc y -0.685, -0.835, -1.018; the last is off-stage. The three at x = +0.53 are on the cut-away side. At full-frame scale the chevrons are small: that is the owner's visibility call, not a measurement.

## 2a panel (`panel-2a-current.png`, u .30)

`V2CONTROL PANEL, URFS-2` (single mesh, one material MSP_YELLOW_PAINT), world box x .417-.596, y .83-1.078, z -.67..-.475. Hidden behind the closed shell at u 0 and .1; visible as a plain yellow box from u .2 and not clipped at any open-section u (plane -0.15). The image shows a 5x crop and the full frame. Interim state, no Blender split; candidates u 0 .1 .2 .25 .3 .34 .9 1 are in `panel-candidates/`.

## Lite vs full geometry (`lite-vs-full-telemetry.json`; same u, same viewport)

| | full (`msp-enclosure.glb`) | lite (`rl300-lite.glb`) |
|---|---|---|
| sourceTriangles / keptTriangles | 440668 / 440072 | 245092 / 244500 |
| sourceMeshes / batches | 589 / 31 | 570 / 30 |
| airway helper (source - kept - 108 liner - 460 removed, derived) | 28 | 24 |
| cappedTriangles | 154554 | 165216 |
| openSectionTriangles / keptWhole / skippedRoots | 47390 / 9136 / 1 | 16329 / 9136 / 0 |
| parts in proof (24 ruled, same policy mix, same 19288 triangles) | 24 | 24 |
| rendered triangles, 1440x900 u .34 / .51 | 1201746 / 1186429 | 586852 / 577052 |
| rendered triangles, 390x844 u .34 / .51 | 1196562 / 1149786 | 581668 / 537210 |
| draw calls, 1440 u .34 / .51 | 111 / 98 | 74 / 62 |
| geometries / textures | 59 / 4 | 60 / 2 |
| intake worst ndc: 1440x900 u .51 | 21.586 | 22.880 |
| intake worst ndc: 390x844 u .51 | 6.502 | 6.524 |
| worst ndc at u .34 (1440 / 390) | 1.462 / 1.411 | 1.464 / 1.411 |
| pixel diff full vs lite (changed fraction, >8/channel): 1440 u .34 / .51; 390 u .34 / .51 | - | 10.8% / 9.5%; 9.8% / 6.3% |

One line (measured): lite is a different asset (245092 vs 440668 source triangles, airway helper 24 vs 28, caps 165216 vs 154554, textures 2 vs 4), the code turns shadows off for lite (`shadows={!lite}`), and 6.3-10.8% of pixels differ by more than 8 per channel at the same u and viewport; camera, cut plane and stage are the same in both tiers. Visual reading from one downscaled look at `lite-vs-full-u34-1440x900.png` (not measured per region): the yellow pump/reservoir bodies and flanged pipes read as different shapes with flatter shading, and the floor shadows are absent in lite. Recommendation (not a measurement): judge group A on full until the lite asset is regenerated.

## Step 3: videos (Playwright `recordVideo`, `size` = 1440x900, 25 fps, VP8 webm kept, `libx264 -pix_fmt yuv420p` mp4)

| File | Duration (`ffprobe`) | Notes |
|---|---|---|
| `forward-reverse.mp4` (.webm same) | 33.36 s | u 0 -> 1 in 12.0 s, hold 1 s, 1 -> 0 in 12.0 s, hold 1 s, linear, driven by `__quietMachine.seek` from an in-page rAF clock (the verifier's seek path); `scrollY` stays 0; `?quality=full`; ends at u 0, 1448 frames; about 5.4 s of load lead-in is in the video (it starts at context creation) |
| `forward-at-proposed-length.mp4` (.webm same) | 55.72 s | **real wheel scroll at 900vh**: 959 `mouse.wheel` events at about 150 px/s over the committed page (`scrollHeight` 8100 = 9 x 900, max scroll 7200); final `scrollY` 7200, u 1, range 1000, end card rendered; about 2 s lead-in; the video ends after a 2.5 s hold at the bottom |

Both pages loaded `msp-enclosure.glb` (full), zero page or console errors (`videos-log.json`).

## Not done / caveats

- The literal piped hash command mismatches (see method note); byte-exact checks all match.
- The lite asset is stale (known): every lite figure above describes the stale file, not a regenerated one.
- Chevron and reservoir "with/without" toggles do not exist at runtime; stated above rather than simulated.
- 1019 is not in the telemetry; its policy is read from `PART_POLICY` (default `section`).
- Occlusion of the reservoir and chevron crops was not tested; pixel-diff in the chevron region is confounded by camera motion.
- Repo root has two untracked 0-byte files `key` and `JSON.parse(k))`, mtimes 12:12:23.165 and .170 (within 5 ms). The session-start git status snapshot was clean, so they appeared during the session; no command this seat issued contains those strings. Fingerprint: the names equal the token after `=>` on `scripts/verify-jg033-preview.mjs` line 215 (`.map(k => JSON.parse(k))`) and line 217 (`([key]) => key`), the same cmd.exe-redirect pattern as the old `document.querySelector('.qm-poster` stray (lines 180/204). The trigger is likely a tool or hook handling a full Read of that file; not proven. Left untouched (`key` is on the protected list; the other's origin is unproven). The spec's strays `2` and the `document.querySelector('.qm-poster` file are not present.
- Extra, unrequested items in `32-gpu-2/` (48 MB total), for the orchestrator to keep or drop: `verify-jg033-preview/` (28 verifier PNGs + report.json), `panel-candidates/`, `sheet-tiles/`, `lite-vs-full-tiles/`, `*-raw*` frames, `chevrons-raw-*`, `phase-*.json`, `.webm` copies, `build.log`.
- GPU-3 not started.

## Servers

PID 11576 (and child 9704) started and killed by this seat. After the kill: `tasklist` finds no PID 11576; `curl http://localhost:4173/quiet-machine/` gives connection refused (exit 7); `netstat -ano` shows no LISTENING row for 4173 (only TIME_WAIT from my own connections) and no rows for 5199. Port 5199 was never used.
