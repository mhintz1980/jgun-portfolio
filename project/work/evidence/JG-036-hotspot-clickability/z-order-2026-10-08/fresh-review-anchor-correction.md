# Fresh independent review — JG-036 oracle anchor correction (2026-10-09)

Reviewer: fresh-context workhorse seat (GLM-5.3-Flash), self-contained spec, no
producer transcript. Full-file read (716 lines) + targeted greps + `node --check`.

## Verdict: SHIP

- File SHA-256 re-derived by the reviewer and matched
  `6F65EADF54D278378950A622AB7A6D99D572C30C384B0A98BCEDD6BCBFF4C913`.
- Correction scope confirmed exact: rotor `progress: 0.4` (line 49), intake
  `0.6` (line 59), trunnion `0.83` unchanged; both `page.goto` sites
  `domcontentloaded` (lines 492, 665); zero occurrences of `0.49`/`networkidle`
  remain; no other logic depends on the old anchors (oracle prefers measured
  telemetry progress; seeks/keyboard route derive from KEEPERS; screenshots and
  static contract key on ids/chapters only).
- Anchor margins judged adequate: rotor 0.4 sits 0.018 below the chapter flip
  (~9x the 0.002 seek tolerance, inside the measured visible band, past the
  0.12 gate and 0.15 intro-release ramp); intake 0.6 is the midpoint of the
  measured [0.58, 0.62] visible band; trunnion 0.83 >= 0.08 inside its band
  with chapter 3 running to 1.0.
- goto change cannot weaken verification: the 180s readiness bundle
  (drawingProof.ready + annotationsReady + __rig + warmReady) immediately
  follows goto in the keeper path and strictly implies boot completion
  (warmReady is set only after warm frames render); the reduced-motion path
  has no readiness gate by design (canvas structurally never mounts under
  reduced motion, `App.tsx:40`), and its assertions are structural — the
  earlier networkidle could only cause false FAILs, never false PASSes.
- Residual risks flagged as runtime-only: chapter-flip boundary is empirical
  (dev/frozen-prod census agreement at 0.49 supports stability); intake's
  hidden-until-0.56 mechanism is not visible in its def; the wheel
  pass-through probe at progress 0.4 is runtime-verified only. All are
  exercised by the rerun itself.

Reviewer's full report is retained in the orchestrating session records; this
file is the durable evidence-summary. Sign-off for the correction: granted.
Runtime sign-off of the rerun remains with the packet's post-run protocol.

## Round 2 — same-day fresh review (new reviewer context)

Round-2 changes (rotor anchor 0.4 → 0.25; hitProbe `closestBadge` +
descendant-aware verdict; post-click badge-visible wait removed) reviewed by a
second fresh-context seat against hash
`755107C8A33C11BE3A9F4928FF4EF65B7CF65DD6E7C89DEE6CE559742AB46053`.

**Verdict: SHIP.**

- Deltas confirmed exact, no drift from the reviewed round-1 state.
- Hit-verdict attack found no false-PASS path: a foreign overlay yields
  `closestBadge: ''` (label match fails); a covering different badge fails on
  label mismatch; descendant hits resolve `inHotspotLayer` transitively; and
  the real actionability click at the same point is a compensating control
  (it times out under any true coverage).
- Removed post-click wait: nothing unique lost — unmount/hide regressions are
  caught by the aria-pressed wait, the actionability click, and the strictly
  stronger HUD card checks; badge re-visibility after a full cycle is still
  proven on desktop by the keyboard route's visible wait.
- Anchor 0.25 judged best available: measured visible on both viewports,
  margins ~0.03/~0.05 vs band edges, keyboard route (desktop-only) reads the
  same anchor; a per-viewport split would buy ≤0.01 margin for added
  complexity.
- Cannot-rule-out items are pre-existing and non-blocking: reduced route's
  1.5s sample after domcontentloaded (vacuous-pass window for late boots),
  badge-label text uniqueness not asserted, nested-layer-node theoretical
  confound.
