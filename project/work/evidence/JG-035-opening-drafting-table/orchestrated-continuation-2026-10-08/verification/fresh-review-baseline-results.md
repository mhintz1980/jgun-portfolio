# Fresh review — baseline roster results (verification boundary)

Date 2026-10-09. CPU-only review of emitted reports plus result/exit JSON; no
raw logs, runner transcript, browser, or build. GPU roster owner: Parfit.
Reviewer: glm-5.3, structural.

## Verdict

**SHIP (evidence integrity).** Counts and exits are mutually consistent and
no failed run is relabeled; open items below are product findings or pending
evidence, not packet defects.

## Findings

- Provenance: five serial commands hit frozen 4174 only (commit 8db93913,
  sourceTree 02945c26, aggregate 9eb4b490...). preflight-before 00:19:32Z /
  after 01:01:01Z both report 62 files, 34,213,544 bytes,
  frozenDistUnchanged=true. Results certify the frozen baseline, not the
  dirty latest source; shaft sourceHashes are local reviewer-side files, not
  served bytes.
- Totals: opening desktop-lite and narrow-lite each exit 1 with exactly 2
  failures — lightning pixel proof at forward-21/reverse-26; staticContract
  92/0; cadRequests 8; zero context-loss/shader/request failures. ring-full
  exit 1: desktop, mobile, blueprint, exploded each fail "Expected actual
  ring and 12 verified prop meshes"; delayed-CAD-entry, reduced-mobile, and
  poster pass; static cases restore loaded=false, ringMeshes=0, no GLB
  requests. shaft-full exit 0: 16 cases, 0 defects, S1-S8 and N1-N4 all
  pass; four static fallback cases show allCAD=0 and no inspection/narrative
  requests. manufacturing-lifecycle-full exit 1: 13/14 pass;
  pause-hidden-seek-desktop fails (hidden advance 0.2494 s not below 0.1 s).
- Pending: lifecycle V6 remains an open model gate — no different-provider
  review is claimed or performed. Freshness: canonical-record.json was
  emitted 2026-10-09T01:08:01Z (after preflight-after 01:01:01Z) and matches
  every result/exit receipt reviewed above; ring-full/README.md remains
  absent.
- Overlap: external browser ~00:49:00Z; ring finished 00:48:45Z (no overlap
  shown); shaft launched 00:49:16.8Z, so shaft-full keeps the packet's
  possible-startup-contamination qualifier.
- Separate packet: natural-tier 2026-10-08T23-47-04-636Z remains untouched
  failure/interruption evidence (desktop 108, narrow 141 failed; reduced
  passed zero-CAD; forced desktop-lite interrupted).
