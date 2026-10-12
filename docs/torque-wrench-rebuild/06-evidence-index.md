# Research evidence index

Decision needed: review the bounded findings in [05-research-report.md](05-research-report.md), then approve design if accepted.

All evidence paths below are relative to `project/work/evidence/torque-wrench-rebuild/` in this worktree. Failed attempts are preserved; tracked product diff is empty at the recorded checkpoints.

| Path | Purpose / status |
|---|---|
| `01-tunnel-diagnostic/full/` | Accepted hardware/full diagnostic packet, five phase checkpoints and hashes; independent Astra evidence PASS. |
| `01-tunnel-diagnostic/tunnel-comparison.png` | Owner target, historical rejected look and current AMD/full `.90`, without brightness adjustment. |
| `01-tunnel-diagnostic/capture-hardware-tunnel.mjs` | Evidence-only diagnostic harness authored by Sol, refined for resource accounting. |
| `01-tunnel-diagnostic/full-attempt-1/`, `full-attempt-2/` | Preserved bookkeeping failures; do not use as the successful packet. |
| `02-motion-baseline/record-scroll-motion.mjs` | Sol-authored bounded wheel recorder; traversal interval was changed to 40ms for retries. |
| `02-motion-baseline/local-retry-1/report.json`, `raw.json`, `video/`, PNGs | Partial local motion baseline: recorded, zero browser errors; readiness timeout and traversal overshoot; success=false. |
| `02-motion-baseline/oryzo-retry-1/report.json`, `raw.json`, `video/`, PNGs | Wider Oryzo reference recording: 72% forward then retrace; media aborts and incomplete forward target; success=false. |
| `02-motion-baseline/runtime-snapshot.json` | Auxiliary effective Lenis options, current document extent and inverse JGUN boundary calculation; startup readiness incomplete. |
| `02-motion-baseline/oryzo/` | Earlier bounded reference, 23% forward coverage; preserved failures. |
| `02-motion-baseline/local/` | Earlier connection-refused attempt; no usable video/samples. |

PNG/manifest/resource identities for the critical tunnel packet were checked in [04-tunnel-research-review.md](04-tunnel-research-review.md). Motion reports include harness hashes, launch configuration, timestamps, source HEAD/dirty state, segment metrics and failure logs; these recordings are not performance certification. Inspect the actual `.webm` in each `video/` directory for comparative playback. PNGs establish individual visual compositions, not smooth movement.
