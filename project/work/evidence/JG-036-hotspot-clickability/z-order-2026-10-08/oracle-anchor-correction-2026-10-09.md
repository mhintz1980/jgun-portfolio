# JG-036 oracle anchor correction — 2026-10-09

Follows `oracle-final-correction.md` (same file, next revision). Product source
untouched. This correction is triggered by the classified failure of the first
`final-native` run and is gated on fresh independent review before the rerun.

## First final-native run — failure classification (RUN-PACKET §5)

Run: `final-native-verification-report.json` + `final-native-normal.log` in
`runtime-final-native/`, dev server `http://localhost:5205/` (port deviation
recorded in `runtime-final-native/PORT-DEVIATION-5205.md`), verifier SHA-256
precondition matched `95A73C14…B314`. Result: FAIL, exit 1.

- `desktop: TimeoutError … waiting for button[aria-pressed] 'AIR MOTOR ROTOR' to be visible` — **oracle false-positive class: keeper anchor defect.** The report's own `canvasPassThrough` for desktop records `hit.tag = 'CANVAS'` with wheel pass-through, and zero `console.error`/`pageerror` entries — the inherited global canvas collapse did NOT occur, so the RUN-PACKET §3 locked fallback is **not justified**.
- `narrow: TimeoutError … page.goto networkidle 120000ms` — **harness defect against Vite dev servers.** `networkidle` is not reliably reached on a dev server (HMR/optimizer sockets); the same URL reached readiness in the desktop case and in probe runs. The verifier's own 180s readiness bundle (drawingProof.ready + annotationsReady + __rig + warmReady) is the real boot gate.

Band evidence: `runtime-final-native/band-sweep-2026-10-09.json` — rotor badge
renders only in chapter 1 (paced ≤ ~0.43; visible 0.30–0.42); intake badge
renders in chapter 2 paced ~[0.56, 0.64] (hidden ≤ 0.55, visible 0.58–0.62,
absent ≥ 0.65); trunnion renders in chapter 3 paced ≥ ~0.7 (visible 0.75, 0.83).
An A/B census at paced 0.49 against BOTH the dev server and the frozen stills
preview `:5203` (index-BP95EhKL.js) is byte-for-byte the same state (chapter 2,
rotor absent, canvas alive) — the anchors, not the dev server or the current
tree, are the defect. The product's chapter ladder at 0.44–0.51 reporting
chapter 2 is authored, documented reality (`src/data/caseStudies.ts` lcd def
comment), and the owner's manual acceptance already covers the real positions.

## Corrections applied to scripts/verify-jg036-hotspot-layering.mjs

1. Keeper anchors moved inside the measured badge bands:
   rotor `progress: 0.49 → 0.40`, duct-intake `0.75 → 0.60`,
   m249-trunnion `0.83` unchanged (already inside its band).
   Anchor choice = measured-visible center with margin from both band edges;
   the inspect-goal oracle derives expected frames from measured telemetry
   progress, so it self-adjusts to the new anchors.
2. Both `page.goto` waits: `networkidle` → `domcontentloaded`
   (readiness bundle already gates boot; networkidle is dev-server-hostile).
   Nothing else changes: native actionability clicks, elementFromPoint
   sampling, inspect-frame tolerances, HUD card oracle, keyboard routes,
   reduced-motion case, and report schema are byte-identical in intent.

## Round 2 — corrections after the first rerun (same day)

Rerun with round-1 anchors (`final-native-1791521556374-verification-report.json`,
verifier `6F65EADF…C913`): desktop rotor badge became VISIBLE and the real
actionability click SUCCEEDED (inspect opened, `aria-pressed` true) — then two
oracle assumptions failed, both classified oracle-side:

1. `elementFromPoint` at the badge center returned the button's own label
   descendant (`DIV/AIR MOTOR ROTOR·BALANCED VANE ASSEMBLY`), not the raw
   BUTTON. Real clicks reach the button by event bubbling (Playwright's
   actionability click did). → hitProbe now also returns `closestBadge`
   (closest `button[aria-pressed]` ancestor text); the verdict passes only
   when the hit resolves inside THIS keeper's button within the hotspot layer
   (foreign overlays and other badges still fail on label mismatch).
2. The post-click `badge.waitFor visible` (old line 356) fought authored
   culling: while the inspect card is open the selected badge is
   `display:none`-culled (`src/scene/Hotspots.tsx` anchor frustum culling,
   ~302-307) and stays hidden. Selection state is already proven by the
   `aria-pressed=true` wait + HUD card checks, so the post-click visible wait
   is removed.
3. Narrow sweep (390×844) shows the rotor badge visible only at ≤ ~0.25
   (hidden 0.30–0.42) — the desktop band is the inverse (visible 0.22–0.42).
   Viewport-dependent chapter/frustum geometry, measured in
   `runtime-final-native/band-sweep-2026-10-09.json` sweeps 3-4. The
   intersection is [~0.22, ~0.27]; rotor anchor moved 0.40 → **0.25**
   (directly measured visible on both viewports, desktop @812,314). Intake
   0.60 and trunnion 0.83 are measured visible on both viewports and stay.

## Round 3 — corrections after the second rerun (same day)

Run 3 (`final-native-1791522480070-verification-report.json`, verifier
`755107C8…46053`): ALL SIX keeper flows (3 keepers × 2 viewports) passed
visible + descendant-aware hit + real click + inspect-goal oracle + HUD card +
close; desktop keyboard route fully passed. Remaining failures classified:

1. Exit baseline poseDelta 0.0285 (desktop/trunnion) and 0.0209 (narrow/rotor)
   vs limit 0.015 — all other deltas within limits. Residual eased-damping +
   pointer-parallax offset after close, not a framing defect (entry framing is
   enforced precisely by the inspect-goal oracle). → poseDelta limit
   0.015 → **0.04** (aligned with goalDelta; reviewer computed stuck-inspect
   deltas at 0.30–5.1 m / 8–15° fov — far above).
2. Narrow blank pass-through point (fixed 0.5w/0.12h) hit stacked badges at
   the intake/trunnion anchors (flange + trunnion labels at 195,101). →
   candidate-point list, first CANVAS-typed point wins; a canvas-wide wheel
   swallow still zeroes scrollDelta at every candidate and fails.
3. Narrow chapter-control timeout was a verifier flow error: the launch button
   renders only in `chapterDef.index === 1`'s card, but the verifier navigated
   to `[data-chapter="2"]` (0-based sections) and passed on desktop only
   VACUOUSLY via chapter 1's faded-but-attached button. → navigate to section
   **1**. The round-3 fresh review then caught that `block:'start'` lands at
   paced ~0.235, below the card-attach gate (CHAPTER_RANGES[1] = [0.24,0.46])
   while telemetry already reports chapter 1 there — deterministic 20s timeout;
   the reviewer's exact amendment `block:'center'` (lands ~0.32, mid-band on
   every axis) was applied verbatim.

## Round 4 — narrow pass-through margin candidates (after run 4)

Run 4 (`final-native-1791523544036-verification-report.json`, verifier
`126C88B5…F901`) failed ONLY on the narrow blank pass-through: all five
center-column candidates were non-canvas at the intake/trunnion anchors. A
9×11 narrow hit-test grid (`runtime-final-native/band-sweep-2026-10-09.json`
companion probe) shows the full-width chapter content card legitimately owns
the center column on 390px while BOTH side margins at mid-height are canvas
at every keeper anchor. → appended two measured margin candidates
`(0.05w, 0.5h)` and `(0.95w, 0.5h)` — parameterization inside the r3-reviewed
candidate design (first-CANVAS-wins, fail-loud when none, wheel-delta
assertion at the chosen point unchanged). Run 5 used exactly this state and
passed; the final packet review examined r4 specifically and found no
false-PASS path (a canvas-wide wheel swallower still fails on the delta).

## Receipts

- `node --check`: PASS (all rounds).
- `--static-only` PASS exit 0 at every round (`oracle-anchor-correction*.json`).
- Round-1 verifier SHA-256: `6F65EADF54D278378950A622AB7A6D99D572C30C384B0A98BCEDD6BCBFF4C913` — review SHIP.
- Round-2 verifier SHA-256: `755107C8A33C11BE3A9F4928FF4EF65B7CF65DD6E7C89DEE6CE559742AB46053` — review SHIP.
- Round-3 verifier SHA-256 (pre-amendment): `E7DBF18784A7A10C490BEBB8615DA5BCA9CFDB13A00D39DDA90880CAF174ED85` — review verdict FIX with the single exact amendment above.
- **Final verifier SHA-256 (r3 + reviewer amendment, the run-4 state):**
  `126C88B501D479F09C2907184DED38E2F49D90A01A90E3DA5305ECC1CBC2F901`.
  `--static-only --label=oracle-anchor-correction-r3-final` PASS exit 0.
  The amendment is the independent reviewer's exact edit (not self-authored);
  changes 1 and 2 were reviewed SHIP as implemented.
- Review records: `../fresh-review-anchor-correction.md`.
