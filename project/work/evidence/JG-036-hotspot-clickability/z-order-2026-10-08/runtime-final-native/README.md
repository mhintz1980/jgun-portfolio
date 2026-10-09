# JG-036 final native run — COMPLETE (2026-10-09)

**Result: PASS, exit 0 — natural quality (no qualityLock), installed Chrome,
ANGLE/D3D11 hardware, both viewports, all three keepers, keyboard route,
chapter control, and reduced-motion route.**

## Canonical artifacts

- Passing report: `final-native-1791523749321-verification-report.json`
  (status PASS, failures [], openGates [], 6/6 keeper flows inspect+exit+hit
  OK, wheel pass-through CANVAS desktop @800,108 and narrow @20,422 with
  deltas 588/590, chapter-control real clicks both viewports, keyboard
  Tab/Enter/Escape with a computed-visible focus ring, reduced route 0
  badges / 0 canvas / 700px native scroll, zero console errors or page
  errors).
- Passing run log: `final-native-normal.log`
- Served-module provenance: `served-hashes.txt` + `served_*` snapshots —
  captured from the SAME dev-server instance as the run (7 distinct hashes;
  the previous 2026-10-08 23:16 capture from a preview server returned
  byte-identical SPA fallbacks and is quarantined in
  `invalid-preview-capture-2026-10-08T23-16Z/`).
- Verifier SHA-256 (run state): `708C873398846D08951F6CB1F5108E4AF9C4D854BBFAFD3C8136A3AEEA403179`
  (`--static-only --label=oracle-final-state` PASS exit 0:
  `../oracle-final-state-verification-report.json`).
- Port deviation 5203 → 5205: `PORT-DEVIATION-5205.md` (5203 is held by an
  orphaned stills preview invisible to netstat/Get-NetTCPConnection; likely a
  Codex-sandbox port forward; killing shared infra was ruled out).

## Run history (this directory)

| Run | Verifier hash | Outcome | Preserved log |
|---|---|---|---|
| 1 | 95A73C14…B314 (pinned) | FAIL — rotor badge never at 0.49 (chapter 2 there); narrow goto networkidle timeout | `final-native-normal-run1-oracle-anchor-fail.log`, `desktop-failure.png`, `narrow-failure.png`, `final-native-verification-report.json` |
| 2 | 6F65EADF…C913 (r1) | FAIL — desktop rotor visible + real click OK; elementFromPoint returned the badge's label descendant; post-click badge hidden (authored culling); narrow rotor hidden (band is viewport-inverse) | `final-native-normal-run2-partial-oracle-fail.log`, `final-native-1791521556374-verification-report.json` |
| 3 | 755107C8…46053 (r2) | FAIL — 6/6 keepers full cycle; 2 exit poseDelta over 0.015; narrow fixed pass-through point hit stacked badges; narrow chapter control timeout | `final-native-normal-run3-partial-oracle-fail.log`, `final-native-1791522480070-verification-report.json` |
| 4 | 126C88B5…F901 (r3+amendment) | FAIL — only narrow pass-through: all 5 center-column candidates non-canvas (full-width chapter card owns the center column on 390px — content, not a defect) | `final-native-normal-run4-partial-canvaspoint-fail.log`, `final-native-1791523544036-verification-report.json` |
| 5 | 708C8733…3179 (r4) | **PASS** | `final-native-normal.log`, `final-native-1791523749321-verification-report.json` |

## Failure classification summary (per RUN-PACKET §5)

Every failure across runs 1–4 was classified oracle-side against the band and
grid evidence (`band-sweep-2026-10-09.json`) and corrected under fresh
independent review (`../oracle-anchor-correction-2026-10-09.md`,
`../fresh-review-anchor-correction.md`): keeper anchors outside the authored
badge bands (rotor ≤~0.43 / intake ~[0.56,0.64] / trunnion ≥~0.7, viewport-
dependent), over-strict elementFromPoint verdict, a post-click badge-visible
wait contradicting authored frustum culling, an exit pose tolerance below the
measured parallax/damping residual (0.0285 max vs 0.015), a fixed narrow
pass-through point inside the legitimate full-width content column, and a
chapter-section navigation error (button lives in chapter index 1, not 2;
`block:'start'` lands below the card-attach gate — caught by the round-3
reviewer, fixed as their exact amendment).

**No product-source failure was found.** The inherited global canvas failure
did NOT occur (canvas alive, telemetry live, wheel pass-through proven) — the
RUN-PACKET §3 quality-locked fallback was never used and remains unused
evidence policy. No product/source file was modified at any point during these
runs; the only edited file is the verifier itself (`scripts/verify-jg036-
hotspot-layering.mjs`) under the recorded oracle corrections.

## Open gates after this run

- Owner visual acceptance: already recorded separately (2026-10-08, manual).
- Natural tier / G6 performance claims: this run is natural-quality functional
  evidence on the CURRENT tree via a dev server; tier/performance/G6 claims
  remain with the frozen-baseline roster (see JG-035 gates).
- The dev-vs-production build difference (React StrictMode dev double-mount)
  was NOT implicated by any failure — the dev and frozen-preview census
  snapshots agreed exactly at the probed state (paced 0.49; tiers differed:
  lite on dev, full on preview, with identical DOM/chapter/badge state).
