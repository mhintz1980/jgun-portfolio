# Gates: GPU2 static evidence (orchestrator-owned; no browser, no servers)

Scope: every file the owner is to look at exists, is not blank, hashes recorded and matching, repo state unchanged, ports free.

- [x] GPU2-1: all gpu2 evidence checks pass (files, non-blank PNGs, mp4 durations, literal lines, repo and port state)
  CHECK: node verify-evidence.mjs gpu2
  EXPECT: GPU2_OK
  EVIDENCE: ok   G2.run-mentions.lite run file discusses "lite" | GPU2_OK

- [x] GPU2-2: no tracked file modified, nothing staged, nothing committed
  CHECK: node verify-evidence.mjs common
  EXPECT: COMMON_OK
  EVIDENCE: ok   C.node_modules-154 entries=154 | COMMON_OK
