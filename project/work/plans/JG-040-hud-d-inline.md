# JG-040 — Production HUD: concept D (A+ museum caption) with inline technical content

Registered 2026-11-03 after the owner's direction choice on the v2 concept packet
("Lets go with D and Inline"). Ruling: `docs/torque-wrench-rebuild/00-owner-rulings.md` § 2026-11-03.
Concept provenance: `project/work/evidence/design-os-hud-trial-2026-10-31/` (docs 05/07, sheets, clips).

## Objective

Replace the provisional live-mode HUD of the private `/torque-wrench/` page with the chosen
D direction: one fixed, quiet, model-first chrome layer — per-state caption, named chapter
rail (desktop) / labeled Chapters disclosure (narrow), bounded Free Look / Inspect, WIP label,
top/edge scrims — with the Inspection chapter keeping its technical evidence **inline**
(material attempts + FAILED status + FOS 0–3 scale + revised-blank note), plus the real cutter
controls. Static/poster fallback modes keep today's flowing document unchanged.

## Stage 1 — chrome skeleton (this build)

- `TorqueHUD` component (live mode only): caption (index/title/lede from the existing
  `CHAPTER_COPY`), per-state anchoring per the concept's frame analysis (drafting/breakthrough
  high-left; mechanism/inspection/close low-left; washes on drafting/close), cue + inline tech
  strip for inspection, real `InspectionControl` mounted inside the HUD caption zone.
- Named rail, right edge, five items with `aria-current="step"`, active chapter from the
  existing store beat subscription (`sample.beat.poster`); click seeks via a new additive
  Lenis helper (module-scoped latest instance in `conductorRuntime`).
- Live mode: flowing `.torque-story` stays in the DOM (pacing grid + semantics + static mode
  untouched) but becomes visually hidden + `inert` + `aria-hidden` — its complete visible
  equivalent lives in the HUD.
- Free Look toggle: keep RuntimeWorld's imperative button; restyle to the bounded D affordance.
- Scrims: top gradient + right-edge gradient, live mode only, pointer-events none.
- Deliberately out of Stage 1 (recorded follow-ups, not scope creep): fixed brand mast,
  tracked leader line from caption to shaft (needs the anchored-callout system), live FOS
  value sync into the strip, `verify-torque-camera-hud` rect re-baselining.

## Stage 2 — polish + framing (follow-up session)

- Re-run/extend HUD-rect measurement for the new chrome; re-solve framing where the owner
  policy's strict gates apply (deferred, not weakened).
- Tracked leader integration, mast decision, strip's live Min FOS during the shaft study,
  reduced-motion/poster-mode caption parity check, motion review of the new chrome.

## Acceptance criteria (Stage 1)

1. Typecheck clean; affected vitest suites pass (`TorqueWrenchPage`, `ScrollConductor`,
   `hudSafeFraming`, story-related suites) or failures are recorded with cause.
2. Production build clean.
3. Focused browser smoke (preview server, desktop + narrow): live mode shows the D chrome at
   the three review states (breakthrough/inspection/assembly windows), rail seek reaches the
   right chapter, cutter controls work from the HUD, static/poster fallback unchanged,
   zero console errors.
4. Evidence: stills of the three states × two viewports into `project/work/evidence/JG-040-hud-d-inline/`
   plus a checks record; honest report of anything deferred.

## Change log

- 2026-11-03 Stage 1 in progress.
- 2026-11-03 Stage 1 implemented and technically verified (typecheck, 486/486 torque-wrench
  tests, build, dual-viewport browser smoke incl. beat-window rail seek, 6/6 parity stills):
  [evidence](../evidence/JG-040-hud-d-inline/README.md). Owner visual review open; Stage 2
  (framing re-baseline, tracked leader, mast, live FOS sync) not started.
- 2026-11-03 owner visual review: **Stage 1 chrome accepted as-is** with two flags, both
  fixed the same session (ruling in `docs/torque-wrench-rebuild/00-owner-rulings.md`):
  duplicate FOS bar at the materials window (old vertical study panels suppressed in live
  mode via the new `fosPanels` opt-out on `ShaftStoryLayer`; HUD strip is the single live
  FOS presentation) and the narrow Chapters sheet (caption/tech strip now step aside while
  open; opaque takeover, gold active-row marker, contrast bump). Ring Switch + Exploded
  audited at the owner's request — clean. Re-verified: typecheck, build, focused suites,
  22-state dual-viewport audit re-run (duplicate gone, zero console errors). Stage 2 in
  progress.
- 2026-11-03 wrap: committed `009aa4ae` (28 files, unpushed) — the full JG-040 set through
  Stage 2 plus the Stage 1 wiring it requires; commit tree verified in isolation (fresh
  worktree typecheck clean — which caught and fixed a real closure miss: the dirty
  `privateSheetRuntime.ts` `renderState` member — + 31/31 verifier node tests). Concurrent
  homepage-session and prior-lineage files deliberately left uncommitted. Push + deploy
  await owner instruction.
- 2026-11-03 Stage 2 executed (same session): HUD-rect re-baseline (measured chrome rects,
  verifier selector sets + `inline FOS HUD present` gate updated, manual-control exercise
  seeks the inspection chapter; no threshold weakened), live Min-FOS sync into the strip,
  tracked caption→shaft leader via a `studyAnchor` overlay field (self-hiding on narrow),
  reduced-motion/poster parity PASS, motion review (keyed caption fade/rise, FOS marker
  transition). Final full verifier: desktop 30/30 + narrow 30/30, 0 browser errors.
  Brand mast decided by the owner (small `studiomark` wordmark top-left, gold) and shipped
  same session with a dual-viewport smoke. **Remaining: owner visual acceptance of the
  Stage 2 additions (leader, live FOS sync, mast, caption motion) and the two parked
  polish notes; deployment open.**
