# 00 — Measured baseline ("Freeze and measure")

> **JG-033 / W1.** The Quiet Machine plan states its performance targets are
> *"provisional targets, not current measurements."* This file supplies the measurements.
>
> Captured **2026-09-11 03:56 UTC**, repo at `3e3e49f`, after a clean `npm run build`.
>
> **Correction (recorded 2026-09-11):** an earlier version of this line said the `:4173` preview
> was restarted. It was not — the restart command failed (exit 127, `npx` unresolvable in that
> shell) and the capture ran against a preview server left running by an earlier session.
> What was verified instead: the served `index.html` was byte-identical to the on-disk
> `dist/index.html`, and every referenced asset matched `dist/` byte-for-byte — `vite preview`
> reads from `dist/` per request, so the capture measured the clean build of `3e3e49f`, and the
> `dist/` hashes recorded below were written by that same build. The AGENTS.md stale-server
> failure mode (canvas never mounts) did not occur: the canvas mounted at all 23 stops across
> three viewports with zero console errors. The measurements stand; the process claim was wrong.
> Machine-readable companion: `00-baseline.json`. Regenerate: `BASE_URL=http://localhost:4173 OUT=<dir> node scripts/capture-rl300-baseline.mjs`.

## Measuring host

| | |
|---|---|
| GPU | `ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)` |
| Vendor | Google Inc. (AMD) |
| Logical cores | 16 |
| devicePixelRatio | 1 |
| Max texture size | 16,384 |
| Browser | channel:chrome |

This is Mark's desktop — an **integrated** Radeon 780M, not a discrete GPU. The plan's
"60 fps on Mark's desktop" target is measured against this part.

## Preflight — tree state before any work

| Gate | Result |
|---|---|
| `npm run typecheck` | **PASS** (no diagnostics) |
| `npm test` | **PASS** — 6 passed (6) test files, 48 passed (48) tests |
| `npm run check:station2` | **PASS** — 2380776 bytes, 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted. |
| `npm run build` | **PASS** — 644 modules, built in 7.97s |

The tree was green before this prep began. No source file was modified by W1–W5;
the only added source is `scripts/capture-rl300-baseline.mjs`, a new read-only probe.

## Page geometry — the quantity the RL300 extension will move

| Viewport | Document height | Scrollable height | Tier | Cold load |
|---|---|---|---|---|
| desktop-1440x900 | 28,080 px | **27,180 px** | full | 11,794 ms |
| tablet-768x1024 | 31,949 px | **30,925 px** | full | 9,909 ms |
| phone-390x844 | 26,333 px | **25,489 px** | full | 10,872 ms |

Every normalized progress constant in the codebase is a fraction of the *scrollable height*
column. Extending RL300 changes that denominator, which is precisely the retiming risk the
plan calls out. See `02-progress-consumers.md` for the affected constants.

Note the viewports do not scale proportionally: the tablet document is
13.8% taller than desktop and the phone
6.2% shorter, so a single normalized constant already lands at three
different physical positions across the tested breakpoints.

## Measured cost per scroll position (desktop 1440×900, full tier)

Draw calls are counted by wrapping the live WebGL context and tallying real draw commands
over one animation frame — `renderer.info` is not reachable (the app exposes no renderer
global) and its sampled value is unreliable here, so the GL counter is authoritative.

| Progress | Station | Beat | Visible meshes | Visible triangles | **Draw calls** |
|---|---|---|---|---|---|
| 0.000 | JGUN (CH.01-02) | ch01-drawing-intro | 63 | 865,621 | 300 |
| 0.100 | JGUN (CH.01-02) |  | 62 | 865,619 | 292 |
| 0.177 | JGUN (CH.01-02) | ch01-hero-transit-start | 61 | 841,043 | 288 |
| 0.200 | JGUN (CH.01-02) |  | 61 | 841,043 | 288 |
| 0.300 | JGUN (CH.01-02) |  | 61 | 841,043 | 288 |
| 0.400 | JGUN (CH.01-02) |  | 61 | 841,043 | 266 |
| 0.416 | JGUN (CH.01-02) | jgun-explode-complete | 61 | 841,043 | 266 |
| 0.458 | JGUN (CH.01-02) | ch01-hero-transit-end | 61 | 841,043 | 288 |
| 0.470 | JGUN (CH.01-02) | jgun-explode-probed | 61 | 841,043 | 288 |
| 0.500 | JGUN (CH.01-02) |  | 62 | 841,045 | 292 |
| 0.525 | RL300 enclosure (CH.03) | lcd-dwell-end / wrench-out start | 62 | 841,045 | 255 |
| 0.565 | RL300 enclosure (CH.03) | enclosure-in complete | 595 | 421,914 | 1,240 |
| 0.575 | RL300 enclosure (CH.03) | rl300-assembled | 595 | 421,914 | 1,242 |
| 0.600 | RL300 enclosure (CH.03) |  | 595 | 421,914 | 2,389 |
| 0.650 | RL300 enclosure (CH.03) | rl300-hold (yellow-at-hold frame) | 751 | 635,418 | 3,478 |
| 0.700 | RL300 enclosure (CH.03) |  | 595 | 421,914 | 2,854 |
| 0.720 | M249 point cloud (CH.04) | enclosure-out start | 595 | 421,914 | 2,854 |
| 0.760 | M249 point cloud (CH.04) | m249-pointcloud in | 4 | 50,006 | 54 |
| 0.800 | M249 point cloud (CH.04) |  | 4 | 50,006 | 56 |
| 0.850 | M249 point cloud (CH.04) | jgun-visual-gates probe point | 4 | 50,006 | 56 |
| 0.900 | outro |  | 4 | 50,006 | 56 |
| 1.000 | outro | page end | 4 | 50,006 | 56 |

### Against the plan's provisional budgets

| Plan budget | Provisional target | **Measured now** | Verdict |
|---|---|---|---|
| RL300 draw calls, full | < 150 | **3,478** at p=0.65 | 23× over |
| RL300 visible triangles, full | ~500,000 | **1,262,955** at the hold | over |
| JGUN visible triangles | (protected, not budgeted) | 870,517 | for reference |
| JGUN draw calls | (protected, not budgeted) | 1,248 | for reference |
| Incremental transfer, full | ~8 MB | 13.97 MB total page | see transfer table |

**The provisional budgets are not near-misses — they are off by an order of magnitude.**
The RL300 hold already costs 3,478 draw calls before any of the new section work exists.
Either the budgets need restating against reality, or draw-call batching is a prerequisite
for the rebuild rather than a polish step. That is a design call, not a measurement — it is
flagged here, not decided.

## Frame time (desktop 1440×900, 115 sampled frames per hold)

| Hold | Beat | p50 | p95 | p99 | max | implied fps @ p50 |
|---|---|---|---|---|---|---|
| 0.416 | JGUN explode complete | 16.7 ms | 19.3 ms | 19.6 ms | 21.1 ms | **59.9** |
| 0.575 | RL300 assembled | 17.8 ms | 21.6 ms | 23.7 ms | 24.9 ms | **56.2** |
| 0.65 | RL300 hold | 22.2 ms | 30.8 ms | 36.1 ms | 36.1 ms | **45** |
| 0.85 | M249 point cloud | 16.7 ms | 19.2 ms | 20.1 ms | 20.1 ms | **59.9** |

The RL300 hold is **already the worst frame time in the sequence** and already below the
60 fps target on this machine, before the new section, the capped sweep, or the added
effects exist. JGUN and M249 both sit at ~60 fps. Whatever budget the rebuild adopts, the
starting point at p=0.65 is a deficit, not headroom.

_Frame timings are machine- and load-dependent; draw calls and triangle counts are
deterministic for a given build and viewport. Treat the former as indicative, the latter as exact._

## Lower tier — an anomaly worth confirming

| At p=0.65 | Visible meshes | Visible triangles | Draw calls |
|---|---|---|---|
| full tier | 751 | 635,418 | 3,478 |
| lite tier | 813 | 1,551,035 | 3,478 |

**The lite tier reports more visible geometry than the full tier at the same position, not less.**
This is recorded as an observation, not a diagnosis: the capture toggles `setTier('lite')` and
re-seeks, so the reading may reflect a transitional state where both tier's objects are
momentarily mounted, rather than a genuine regression. It needs a dedicated runtime check
before anyone treats the lite path as a working cost reduction — the plan assumes a "stable
30 fps lower tier", and that assumption is currently unverified.

## Transfer

Measured via `PerformanceResourceTiming` (the preview server omits `content-length` on most
bundle responses, so header tallies under-report).

| Kind | Transfer |
|---|---|
| app-bundle | 0.47 MB |
| other | 0.00 MB |
| models | 13.30 MB |
| draco | 0.20 MB |
| **total transfer** | **13.97 MB** |
| total decoded | 15.43 MB |

| Largest resources | Transfer | Decoded |
|---|---|---|
| `/models/Default.glb` | 10.18 MB | 10.18 MB |
| `/models/msp-enclosure.glb` | 2.27 MB | 2.27 MB |
| `/models/m249-transformed.glb` | 0.85 MB | 0.85 MB |
| `/draco/draco_decoder.wasm` | 0.18 MB | 0.18 MB |
| `/assets/SceneCanvas-D3iN8G39.js` | 0.14 MB | 0.46 MB |
| `/assets/three.core-DVlW78z8.js` | 0.10 MB | 0.36 MB |
| `/assets/drawingGeometry-elRzvGEj.js` | 0.09 MB | 0.36 MB |
| `/assets/index-C9jYhLvM.js` | 0.07 MB | 0.22 MB |

## Console health

| Viewport | Console errors |
|---|---|
| desktop-1440x900 | **0** |
| tablet-768x1024 | **0** |
| phone-390x844 | **0** |

Zero console errors at every tested viewport across the full sweep. This is the clean state
the rebuild must not regress from.

## Asset identity (reproducibility anchor)

| File | Bytes | SHA-256 (first 32) |
|---|---|---|
| `public/models/Default.glb` | 10,671,700 | `8b07246cf857aca29d1832815d8d183e` |
| `public/models/m249-transformed.glb` | 892,092 | `1c251f45b05b736a08858e47c53c8fa7` |
| `public/models/msp-enclosure.glb` | 2,380,776 | `f429a200be18e9d08bd586d1f9581b12` |
| `public/models/role-map.json` | 78,395 | `493207154de241cc5756b58d56387346` |
| `public/draco/draco_decoder.js` | 512,465 | `8625489da79a805f4f2a7d511c3e52d8` |
| `public/draco/draco_decoder.wasm` | 192,420 | `a680d927bed9cb864ddbd63521868891` |
| `public/draco/draco_wasm_wrapper.js` | 58,456 | `8bb2952d2ba7d67e1414f8df819410cb` |

Built `dist/` hashes are in `00-baseline.json` under `assets`. Re-running the capture **from a
clean build of `3e3e49f`** must reproduce these hashes and the same triangle/draw-call figures;
frame times will vary.

> **`dist/` has since been rebuilt by the implementation session** (2026-09-11 05:37 UTC; the
> `index-*.js` chunk hash rotated). Running the capture against the working tree as it stands
> now measures in-progress RL300 work, **not** this baseline. To reproduce the baseline, build
> from `3e3e49f` first.

## What this baseline does NOT establish

- **No real-device mobile measurement.** The 390×844 and 768×1024 figures are an emulated
  viewport on the same desktop GPU. The plan's "stable 30 fps on an ordinary phone" target is
  untested and cannot be inferred from these numbers.
- **No reduced-motion, context-loss, hidden-tab, or poster-fallback capture.** Resilience
  behaviour is unmeasured here.
- **No A/B visual comparison.** Frames at the named beats are saved under `baseline-frames/`
  for the desktop viewport only, as the "before" reference; nothing is asserted about them.
- **The draw-call counter measures one frame.** Costs that vary frame-to-frame (shadow passes,
  postprocessing that toggles) may be under- or over-represented at a given stop.
