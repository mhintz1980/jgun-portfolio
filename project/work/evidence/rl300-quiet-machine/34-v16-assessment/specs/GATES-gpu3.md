# Gates: GPU3 static evidence (orchestrator-owned; no browser, no servers)

Scope: every file the owner is to look at exists, is not blank, hashes recorded and matching, repo state unchanged, ports free.

- [x] GPU3-1: all gpu3 evidence checks pass (files, non-blank PNGs, mp4 durations, literal lines, repo and port state)
  CHECK: node verify-evidence.mjs gpu3
  EXPECT: GPU3_OK
  EVIDENCE: ok   G3.base-sources-restored both mutated files match HEAD | GPU3_OK

- [x] GPU3-2: no tracked file modified, nothing staged, nothing committed
  CHECK: node verify-evidence.mjs common
  EXPECT: COMMON_OK
  EVIDENCE: ok   C.node_modules-154 entries=154 | COMMON_OK
