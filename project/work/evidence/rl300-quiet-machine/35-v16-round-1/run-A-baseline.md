# Run A: baseline of the current build ("before-now")

- HEAD: `97e2d806` (branch `quiet-machine/integration`)
- `node -v`: v22.19.0
- `describeLaunch()`: "installed Chrome, ANGLE/D3D11 (hardware)"
- GPU string (all four sidecars): `ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)`
- Build under test: scratchpad `dist-before` (prebuilt, not rebuilt)
  - `index.html` sha256 `b850f0c8346805bb436305f2879aea3c0e5923ff41c51276736ef32353969495` (matches spec)
  - `quiet-machine/index.html` sha256 `e05687cdd6a79471c85cc4a73a7e1c62d45b4d7aba33fa66054c815a6b5c33c1` (matches spec)
  - `cmp` served `/quiet-machine/` vs dist file: identical; `cmp` served `/` vs dist `index.html`: identical
- Server (start-preview.mjs / stop-preview.mjs, pidfile only): started pid 2304, stopped via pidfile (taskkill /PID 2304 /T), pidfile removed
- Port 4173: before start curl exit 7 (free); after stop curl exit 7 (free)
- Capture: `?quality=full`, `/quiet-machine/`, deviceScaleFactor 1, viewport screenshot, `seekRest`; `common.mjs` copied unchanged except `E`

| name | tier | u | uMatchesRequest | tierMatchesRequest | nonFlatFraction | pageErrors |
|---|---|---|---|---|---|---|
| u34-1440x900 | full | 0.34 | true | true | 0.38907 | 0 |
| u51-1440x900 | full | 0.51 | true | true | 0.52058 | 0 |
| u34-390x844 | full | 0.34 | true | true | 0.38178 | 0 |
| u51-390x844 | full | 0.51 | true | true | 0.51112 | 0 |

- `gpuSameAsCommitted`: true
- Cost (now vs committed `32-gpu-2/`): identical on all four captures. drawCalls 111/98/111/97, renderedTriangles 1201746/1186429/1196562/1149786, geometries 59, textures 4, batches 31, sourceTriangles 440668, keptTriangles 440072. Full table in `before-now/cost.json`.
- Drift measurement (extra fact): PNG sha256 of all four now-captures is byte-identical to the committed `32-gpu-2/` PNGs (prefixes 67f85746fa05, 14dabf40a211, 7dc008e68ce4, 9c4965d86260). Render noise between sessions on this build is zero.
