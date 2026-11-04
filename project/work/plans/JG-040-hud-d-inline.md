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
- 2026-11-04 owner review: Mark had not yet seen the Stage 2 additions; visual acceptance
  stays open. He directed two corrections, now implemented: narrow Inspection overlaps
  (tech panel raised to clear the caption title; duplicate study card/attribution hidden in
  narrow live mode with their content kept in the transcript; study captions moved to the
  top band) and desktop rail/leader contrast at the bright C300 frame (wider/darker edge
  scrim, brighter rail text, leader drop-shadow and dark dot ring). Verified on a fresh
  production build: typecheck/build clean, `verify-torque-camera-hud.mjs` PASS 30/30 on
  desktop and narrow with 0 browser errors. The strict page-cinematography narrow roster
  retains its known HUD-over-subject clearance failures (no threshold changed). Owner
  visual acceptance of the Stage 2 additions remains open.
- 2026-11-04 (later) owner reviewed the live page and ruled: **Inspection timing FAIL**
  (chrome appears at .56 before the input shaft is isolated; `studyVisible` is .62),
  **desktop rail overlap FAIL** (tech panel covers rows 04/05; move the chapter selection to
  the bottom), **FOS bar thickness +50%**, and **remove the tracked leader** (does not track
  the part and overstays). The `studiomark` mast and the caption fade/rise were approved.
  No runtime change was made after this ruling. Stage 2 is not accepted as a whole.

## Stage 3 — owner review corrections (released 2026-11-04)

Scope is limited to the four ruled corrections plus their verification. Do not reopen
unrelated HUD styling.

Execution checklist (this continuation; no deploy before Mark reviews):

- [x] Keep Mechanism caption through .56–.62; Inspection chrome only in [.62,.845),
  gated by effective runtime visibility (including cold asset loading), retain rail chapter
  semantics and seek Inspection to .621 (isolation start + seek epsilon).
- [x] Move desktop rail to a horizontal bottom bar; preserve narrow disclosure.
- [x] Increase only the colored FOS scale height from .6rem to .9rem.
- [x] Remove tracked leader DOM/drawing/CSS and `studyAnchor` producer/type.
- [x] Typecheck, focused suites (503 tests), production build in a separate output directory;
  30 pure Node verifier tests, 58 topology tests and launch/asset gate PASS.
- [x] Full camera/HUD verifier: 30/30 desktop and narrow, zero browser errors.
- [x] Capture and measure .56/.6199/.62/.735/.80/.845 on both aspects; 68/68 focused
  browser checks including delayed asset loading, no rail overlap, FOS sibling sizes and
  keyboard seek. [Final review packet](../evidence/JG-040-hud-d-inline/stage3-2026-11-04/README.md).
- [x] Mark reviewed and approved the corrections, then explicitly authorized commit, push
  and deployment on 2026-11-04. Release follows isolated commit verification and live smoke.
- [x] Source `f83f4ba` pushed and deployed as `e796fe69` from an isolated clean checkout:
  typecheck, 1,507 full unit tests, 36 pure Node tests, production build and asset gate PASS.
  Live Stage 3 68/68 and publication smoke 9/9 PASS, zero browser errors.
  [Release evidence](../evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md).

1. **Hold the Inspection chrome until the shaft is isolated.**
   `TorqueHUD` currently derives its chapter from `sample.beat.poster`
   (`TorqueHUD.tsx:120-121`), and the inspection chapter starts at the
   `inspection-isolation` beat (`beats.ts:58`, start .56). The isolated-shaft domain is
   already published as `studyVisible = p >= .62 && p < .845`
   (`JourneyDirector.ts:23`, mirrored in `RuntimeWorld`'s overlay sample). Gate the
   Inspection caption/cue/tech/cutter chrome on that visibility (or an equivalent
   `progress >= .62` threshold), while keeping the rail's chapter semantics intact.
   Decide and record the handoff copy for .56-.62 (keeping Mechanism visible until the
   shaft isolates is the likely answer). Verify at .56 (no Inspection chrome), .6199 (still
   no), .62 (Inspection chrome), and .845 (returns to the source view).
2. **Move the desktop chapter rail to the bottom.**
   `.torque-hud__rail` is the vertical right-edge rail (`torque-hud.css:313`), currently
   under the inline tech panel. Make it a horizontal bottom bar (centered or right-of-centre
   with clearance from the caption and Free Look). Keep the narrow Chapters disclosure as
   is; preserve names, indices, `aria-current="step"`, keyboard focus and seek behavior.
   Re-measure the HUD rects used by `verify-page-cinematography.mjs` and
   `verify-torque-camera-hud.mjs`; no threshold change.
3. **FOS bar +50% thickness, other items unchanged.**
   `.torque-hud__fos-scale` height `0.6rem` → `0.9rem` (`torque-hud.css:240`). Keep the
   FOS title, live value, ticks, marker width (2 px), panel padding and row sizes as they
   are. Assert the computed bar height in the browser check.
4. **Remove the tracked leader for now.**
   Delete the HUD SVG and drawing loop (`TorqueHUD.tsx` refs ~43-44, effect 52-116, SVG
   157-163) and the `studyAnchor` producer/type (`RuntimeWorld.tsx:276-277,1442-1448`;
   `hotspotData.ts:134`), or leave the projection plumbing dormant with a clear comment if
   it will speed the later true-tracking implementation. Do not re-attempt the leader in
   this pass. Verify it is absent at every inspection state.

Acceptance for Stage 3: typecheck clean; focused torque-wrench suites pass; production
build clean; `verify-torque-camera-hud.mjs` 30/30 desktop + narrow with zero browser
errors; owner-review stills at .56/.6199/.62/.735/.80/.845; no rail/tech overlap; FOS bar
height measured at 0.9rem with unchanged siblings; zero leader nodes in the DOM. Record any
strict page-cinematography failures honestly; do not weaken thresholds. Ask Mark to review
before deploying again.
