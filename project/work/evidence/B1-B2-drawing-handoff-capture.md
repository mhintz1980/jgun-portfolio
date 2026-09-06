# B1/B2 drawing-to-model capture (awaiting Mark visual ruling)

Preview: `http://localhost:4173/?chapter=0` after a fresh production rebuild
and restart on 2026-09-03.

- Fresh telemetry: `drawing.edgeSource = Default.glb:crease+boundary`,
  `drawing.lineOpacity = 1`; browser console: 0 errors.
- Same-checkpoint captures: `handoff-lines.png` and
  `handoff-registered.png`, both at global scroll `0.083984375`.
- `handoff-pixel-diff.json` and its raw/mask diff images are emitted by
  `scripts/verify-b1b2-handoff.py`; they record the exact comparison rather
  than claiming visual acceptance.
- Static gates: `npm run typecheck`, `npm test`, `npm run build`, and
  `node scripts/check-station2-contract.mjs` passed in this session.

Not a completion certificate: full forward/reverse checkpoint determinism,
PerformanceMonitor p95/max/decline proof, and baseline bundle delta remain
open. Mark's visual ruling at this preview stop is required before acceptance.
