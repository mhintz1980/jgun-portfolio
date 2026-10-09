# Corrected verifier reruns vs the frozen baseline — 2026-10-09

Serial GPU queue (JG-036 final native → 5204 diagnostic captures → ring →
lifecycle), one browser at a time, against the frozen preview at
http://127.0.0.1:4174/ serving `.scratch/v1-frozen-dist` (restarted via
`restart-preview-4174.ps1`, PID in `preview-4174-restart.json`).

**Server-identity addendum (post-run):** the restart receipt's PID 214788
later exited on a port-bind race — the port was (and remains) held by the
2026-10-08 orphan PID 69456, started with the byte-identical command
(`vite preview --outDir .scratch/v1-frozen-dist --host 127.0.0.1 --port 4174
--strictPort`) and invisible to this session's netstat/Get-NetTCPConnection
probes (a Win32_Process CommandLine census found it). Both preflights verify
the served dist content by aggregate hash, so the provenance claim rests on
the manifest equality, not on which process held the socket. The orphan stays
up per the standing "servers await owner cleanup word" rule.

## Frozen-baseline integrity

- `preflight-before.json` / `preflight-after.json`: HTTP 200, 62 files /
  34,213,544 bytes, aggregate SHA-256
  `9eb4b49066d06408627aa6e38967553fd63ce8953586b99c97015956d344bded` —
  unchanged before and after the whole queue (same method as the original
  roster's preflights).

## Ring full — PASS (7/7 cases, exit 0)

- Report `ring-full-corrected/report.json` (2026-10-09T05:52Z, installed
  Chrome ANGLE/D3D11): delayed-CAD-entry, desktop, mobile, blueprint,
  exploded, reduced-mobile, poster — all `pass: true`, 10 timeline frames per
  active case, zero errors, `failures: []`.
- Verifier SHA-256 at run: `13BC54014FF90750658C1B3840287ECC2D5E55EF1EA94BD648CC484C594480FF`.
- Attempt 1 (same day, verifier `FA8A0ADA…`, readiness fix only) failed the
  census check on the 4 active cases — preserved in
  `ring-full-corrected-attempt1-census-mismatch/` + `logs/*-attempt1.*`.
- Correction (fresh review SHIP, comment ledger amended per reviewer):
  the initial census asserts `toolMeshes === 24`. Counter ledger
  (ringRuntime.ts): `resources.meshes` initialized to ring geometries (1) +
  hole-cover patches (12) at :84, tool GLB traverse adds 12 Mesh instances at
  :128, :129 subtracts ring geometries — 24 on this build, measured live and
  independently by lifecycle V5. The prior `=== 12` asserted the tool-only
  file census, which the runtime counter never reports; the 2026-10-09
  readiness diagnosis (async tool load race) was correct but incomplete.
- The 8.575 s hole-midpoint sample and async readiness gate are from the
  CPU-reviewed FA8A0ADA correction (fresh-review-ring-readiness.md).

## Manufacturing lifecycle — PASS (14/14 cases, exit 0)

- Report `manufacturing-lifecycle-full-corrected/report.json`
  (2026-10-09T05:55Z): gates V1–V5 all `pass: true`, 14/14 cases (both
  widths × readiness-ordering / pause-hidden-seek / restore / census /
  reduced-static / poster-static / ring-rendering), defects 0, failures 0.
- V2 (pause-hidden-seek) now passes on BOTH widths — the prior 13/14 failure
  (hidden playback advanced 0.2494 s vs the 0.1 s bound) is gone under the
  atomically-dispatched synthetic-hidden harness (CPU review:
  fresh-review-lifecycle-atomic.md; verifier run unmodified by this session:
  SHA-256 `1A7786F41A75DC92D22692B3CA6E8730C2116DEAE2F0761B1B55E3002AE7CA81`).
- V6 (manual review/protocol acceptance) remains `pass: null, pending:
  "parent rerun + different-provider review"` by design — not closed here.

## Scope notes

- No source, build, or frozen-dist modification at any point; only verifier
  `scripts/verify-ring-inspection.mjs` changed (the census assertion + comment).
- G6, natural-tier opening acceptance, and owner visual acceptance remain
  open; these reruns close only the harness-race/census rows that blocked
  ring and lifecycle on the frozen baseline.
