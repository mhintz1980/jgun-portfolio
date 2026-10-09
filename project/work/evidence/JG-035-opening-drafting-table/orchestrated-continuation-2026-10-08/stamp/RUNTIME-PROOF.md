# F1 DOM runtime proof — PASS

Full authoritative output: `runtime-proof.json`.

- Recorded: 2026-10-08T23:44:36.900Z
- Mode: **isolated DOM component harness; not site end-to-end**.
- Command: `node project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stamp/verify-f1-stamp.mjs --url=http://localhost:5199`
- Browser: Chromium 141.0.7390.37 with `--disable-gpu`.
- Isolation: 19 module/CSS requests, zero GLB requests, zero canvas-context calls.
- Frame barrier: React `flushSync` followed by two completed `requestAnimationFrame` callbacks.

## Results

- Direct seek and reverse return to (t=16.25): identical inline `rotate(-4deg) scale(1.176)`, computed scale `1.1760046645863953`, and zero animations.
- Paused frames 1–3 at (t=16.25): identical inline/computed transforms and scale; drift is zero.
- Reduced motion at (t=16.25): expected scale `1`, computed scale `0.9999999516941239`, zero animations.
- Failures: `[]`.

## Source SHA-256

- `src/components/ShaftStoryLayer.tsx`: `83056433baa808942d093babe4aedbc41126b478c6b2e9092a77d3362c703440`
- `src/components/ShaftStoryLayer.css`: `3971ffda30ff78c23ded787d8f43b8c249107e1903e5bf5276967868e4897c58`
- `src/scene/inspection/shaft/script.ts`: `cd419b7fbcecf08c886fcfde383994741a276f62cf754c90d88dc76af764a725`

## Execution note

The first DOM-only attempt at 23:43:38Z failed before rendering because the custom proof HTML omitted Vite’s React-refresh prelude. The route was corrected to include `/@react-refresh` and `/@vite/client`; no source/runtime behavior changed. The recorded pass above is the complete rerun.

## Architect independent rerun

- Parent command: `node stamp/verify-f1-stamp.mjs --url=http://localhost:5199 --out=architect-runtime-proof.json`
- Parent-reported result: exit 0, `failures: []`.
- Verified artifact: `architect-runtime-proof.json`, status `PASS`, recorded `2026-10-08T23:46:26.776Z`, Chromium `--disable-gpu`, zero GLB requests, zero canvas-context calls.
- Parent also reported `npm run typecheck` exit 0.
- No further repetition performed. F1 is ready for fresh review; Kepler is assigned.
