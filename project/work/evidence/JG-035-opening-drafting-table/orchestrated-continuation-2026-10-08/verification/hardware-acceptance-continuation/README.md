# JG-035 hardware acceptance continuation

Completed 2026-10-09 UTC. GPU was released at 01:05:53Z; this seat runs no further browser/GPU command.

The command contract was [command-roster.json](command-roster.json), and the completed compact record is [canonical-record.json](canonical-record.json). Five serial commands ran against the frozen preview at http://127.0.0.1:4174/. All completed normally with persisted reports; none hit the 15-minute timeout.

Completed prior full ring, shaft, and lifecycle runs took approximately 2, 4, and 4 minutes respectively. The 15-minute budget allows cold-start variance but bounds an inactive deterministic process. On timeout, preserve the partial report/log and record the command as failed/incomplete; do not wait indefinitely for settlement and do not treat partial output as a pass.

The original opening packet at project/work/evidence/JG-035-opening-drafting-table/stages-1-3-2026-09-26/hardware-acceptance-2026-10-08T23-47-04-636Z/ is preserved. Its live desktop and narrow cases failed 108 and 141 expectations respectively after the effective tier became lite; both reduced cases passed with zero CAD requests and zero canvases; forced desktop-lite coverage was interrupted. None of those facts is relabeled by this continuation.

The required before/after preflights both returned HTTP 200 and aggregate SHA-256 9eb4b49066d06408627aa6e38967553fd63ce8953586b99c97015956d344bded for 62 files / 34,213,544 bytes. See [preflight-before.json](preflight-before.json) and [preflight-after.json](preflight-after.json).

No command used qualityLock, SwiftShader, a seam/tier threshold override, or --focused. Counts, gates, errors, and render proof are derived from generated reports plus persisted exit codes.

## Result

- Opening desktop-lite: exit 1; 92/92 static checks, 2 lightning pixel-proof failures, 0 errors.
- Opening narrow-lite: exit 1; 92/92 static checks, the same 2 lightning pixel-proof failures, 0 errors.
- Ring full: exit 1; 3/7 cases passed. Four active modes failed the actual ring/tool mesh-count assertion. This is an active-scene count mismatch, not inactive/poster fallback; lifecycle V5 separately proved ring rendering and recorded ringMeshes 1 / toolMeshes 24.
- Shaft full: exit 0; 16/16 cases, 12/12 gates, 0 defects, 0 harness limitations, 13 verified render shots per viewport.
- Manufacturing lifecycle: exit 1; 13/14 cases. Only V2 failed, because desktop hidden playback advanced 0.2494s versus the <0.1s bound. V1/V3/V4/V5 passed.

A separate JG-036 browser attempt reported around 00:49Z did not directly overlap ring, which finished at 00:48:45Z. It was close to shaft startup; that complete result is retained with a possible-startup-overlap qualifier rather than silently rerun. See [external-jg036-browser-note.json](logs/external-jg036-browser-note.json).

Overall acceptance is not granted. GPU release receipt: [GPU-RELEASED.json](GPU-RELEASED.json). The frozen 4174 preview was left running for the next assigned stills worker.
