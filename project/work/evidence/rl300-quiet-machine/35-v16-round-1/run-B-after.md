# Run B: after-build capture round (V16 materials + extras)

- HEAD `97e2d806` plus the orchestrator's uncommitted runtime changes (not edited by this seat); node v22.19.0
- `describeLaunch()`: "installed Chrome, ANGLE/D3D11 (hardware)"; GPU `ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)`
- AFTER dist-after: `index.html` 0057d31d7fb8945c42f94965fe1c6152127559c9d2f6e7f91bc365b4a4a18300, `quiet-machine/index.html` cda4c16ea837779af8592e0c26482e18b979c889e2e2c12bba431fb0c6ebadd8 (both match the message). `cmp` served `/`, `/quiet-machine/` and `/models/rl300-extra-parts.glb` against dist-after: all identical.
- BEFORE dist-before: b850f0c8346805bb436305f2879aea3c0e5923ff41c51276736ef32353969495 / e05687cdd6a79471c85cc4a73a7e1c62d45b4d7aba33fa66054c815a6b5c33c1; `cmp` served `/` and `/quiet-machine/`: identical.
- Servers (helpers only, pidfile): AFTER pid 40004 (killed with its tree via `taskkill /PID 40004 /T`), BEFORE pid 15796 (killed with its tree). Port 4173 curl exit 7 before and after each server. Final port state: free.
- Extras requested: every full-tier sidecar `glbsRequested` = `rl300-extra-parts.glb, msp-enclosure.glb`; both lite sidecars = `rl300-lite.glb` only.

## Verifier gate (unmodified `scripts/verify-jg033-preview.mjs`, AFTER server)
- Exit code 0, no `failure`, `errors: []`. Log: `after/verify-jg033-preview.log`; its own output (PNGs, report.json): `after/verifier-out/`.
- Run-environment deviation: the verifier hashes `dist/quiet-machine/index.html` and `public/models/{msp-enclosure,rl300-lite}.glb` relative to cwd. To keep the repo's dist/ untouched it ran with cwd = a scratch dir holding copies of dist-after's `quiet-machine/index.html` and those two GLBs (`gpu/verify-cwd`), `OUT` pointed at `after/verifier-out`.
- telemetry.drawCalls maxima (from `report.json` captures, 7 shots per config): full 149 (desktop 149, portrait 149, tablet 149) against `< 150`; lite 88 against `< 90`. Per config/shot: desktop exterior 149, section 148, intake 124, resolve 149; portrait 149/149/124/149; tablet 149/148/121/149; lite 88/88/67/88 (reverse shots identical).
- WARN lines (7 repeated pairs, all "known-stale"): `WARN known-stale: lite cap triangles 164542 != full 156052 (rl300-lite.glb is not derived from the current msp-enclosure.glb; owner: QM9 lite policy / asset decision)` and `WARN known-stale: lite airway helper is 24 triangles, full is 28 (rl300-lite.glb predates the 2026-09-24 export)`. No FAIL.

## Captures (all `?quality=full` unless lite; dsf 1; viewport screenshots)
| file | tier | tierMatchesRequest | uMatchesRequest | drawCalls | size |
|---|---|---|---|---|---|
| after/u34-1440x900.png | full | true | true | 148 | 334.4K |
| after/u51-1440x900.png | full | true | true | 124 | 261.3K |
| after/u34-390x844.png | full | true | true | 148 | 116.1K |
| after/u51-390x844.png | full | true | true | 124 | 96.5K |
| after/lite-u34-390x844.png | lite | true | true | 87 | 111.2K |
| after/lite-u51-390x844.png | lite | true | true | 67 | 91.5K |
| after-repeat/u34-1440x900.png, u51-1440x900, u34-390x844, u51-390x844 | full | true | true | 148/124/148/124 | 334.4K/261.3K/116.1K/96.5K |
| after/sheet-tiles/{1440x900,390x844}-shot1..7.png (14) | full | true | true | 145-149 / 124 at shot4 | 75.6K-374.2K |
| after/sheet-1440x900.png, after/sheet-390x844.png | composed | | | | 1322.5K, 713.3K |

- Noise reference: all four `after-repeat/` PNGs are byte-identical (sha256) to `after/` (new browser process, fresh page).
- `after/cost.json`: six captures; AFTER full: batches 50, materials 50, geometries 78, textures 4, sourceTriangles 447916, keptTriangles 447320, extraParts 11, extraTriangles 7248, mappedParts 513, mappedPrimitives 541, unmappedMultiSlot 36, v16Applied true. Lite: batches 43, materials 43, geometries 73, textures 2, source 245092, kept 244500, extraParts 0, mappedParts 490, mappedPrimitives 500, unmappedMultiSlot 47, v16Applied true.

## Close-ups (1440x900, dsf 2, from the shot camera; search table in `after/closeup-search.json`)
Bboxes read as glTF metres with the dropped leading "0." restored on the upper bounds (dials x .4952..0.5474, y .7352..0.8128; connector x .1243..0.2204, y 1.3775..1.8207; FFM x .389..0.468, y .613..0.994).
| part | chosen u | plane at u | in-frame area (bbox AABB in viewport) | clip (CSS px) |
|---|---|---|---|---|
| dials | 0.56 | -0.15 | 0.566% | x1080 y201 360x240 |
| exhaust-connector (spec-literal) | 0.455 | -0.15 | 0.892% | x1039 y0 360x355 |
| ffm-1001-1 | 0.575 | -0.15 | 1.345% | x1080 y261 360x335 |
| exhaust-connector-uncut (supplement) | 0.225 | 0.2622 | 0.552% | x713 y146 360x282 |

- No part is below the 0.2% floor (smallest: dials 0.566%). Padding: 40% of the projected bbox size on each side, min 360x240, clamped to the viewport.
- Flag: the spec's connector search has no plane term, and EXHAUST_CONNECTOR_PIPE is a `section` part (clipped where x > plane). At its best u (0.455) the plane is -0.15, left of the pipe (x .1243..0.2204), so the pipe is expected to be cut away there. The supplement `exhaust-connector-uncut` is the best u with plane >= xMax + 0.01 (u 0.225, plane 0.2622). Both are saved.
- Crop padding for the spec-literal connector hit the top of the viewport (clip y 0) and shows the page header text.
- BEFORE frames at the same u and clip (dist-before, same 4 names + `-full`): `before-at-closeup-u/` (extras are absent there by construction).

## Not done / notes
- Not run: the committed lite "before" frames were not re-captured (not requested); no vision opinion beyond a look at crops.
- A new 0-byte file `JSON.parse(k))` appeared in the repo root at 11:56:11 during this run (mtime). This seat did not create it by intent; its name is a fragment of `scripts/verify-jg033-preview.mjs` line 218 (`... => JSON.parse(k))`), consistent with the same hook artifact that made `key`, `2`, `Promise`. Left in place per the rules.
- The verifier's gate extras: `gpu/drawcalls-probe.mjs` was written but not run (the verifier's own telemetry already carries every drawCalls figure).
