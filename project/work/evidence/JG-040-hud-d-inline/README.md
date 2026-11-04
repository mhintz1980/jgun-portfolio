# JG-040 — Stage 1 evidence: D museum-caption HUD with inline technical content

> **2026-11-04 Stage 3 owner corrections:** [current verification and review packet](stage3-2026-11-04/README.md).
> Inspection follows effective study visibility; desktop rail moved to bottom; FOS bar .9rem;
> rejected leader removed. Mark approved the corrections and authorized commit/push/deploy
> on 2026-11-04; release verification is in progress.
> The Stage 1/2 results below remain historical evidence.

Date: 2026-11-03. Branch `torque-wrench/rebuild`. **Committed `009aa4ae` (same day,
unpushed): the full Stage 1 + review-fixes + Stage 2 set, verified in an isolated worktree
(typecheck clean — which caught a real closure miss, the dirty `privateSheetRuntime.ts`
`renderState` member RuntimeWorld consumes — plus 31/31 verifier node tests). Evidence
PNGs stay local per the repo's gitignore policy.** Owner ruling:
`docs/torque-wrench-rebuild/00-owner-rulings.md` § 2026-11-03 ("Lets go with D and Inline"
via the v2 reviewer console). Plan: `project/work/plans/JG-040-hud-d-inline.md`.

## What shipped (Stage 1)

- `src/scene/torque-wrench/TorqueHUD.tsx` + `torque-hud.css` — the live-mode HUD: fixed
  caption (index/title/lede from `CHAPTER_COPY`, per-state anchoring: drafting/breakthrough
  high-left with wash on drafting, mechanism/inspection/close low-left with wash on close),
  gold cue on Inspection, named five-item chapter rail with `aria-current="step"` (desktop) /
  labeled Chapters disclosure (narrow), WIP corner label, top + right-edge scrims.
- Inline technical evidence (the owner's "Inline" pick): Inspection renders the compact
  materials panel (AISI 4140 40–45 HRC / AISI 4340 48–50 HRC / C300 56–58 HRC, each FAILED),
  the FOS 0–3 scale with the sub-1.0 marker, and the revised-blank note — plus the real
  `InspectionControl` (cutter study playback) mounted inside the caption zone.
- Chapter seek targets each chapter's **first beat window** mapped through the existing
  `torqueScrollFraction` inverse pacing map (read-only), scrolling via a new additive
  `torqueLenisScrollTo` helper that routes through the conductor's own Lenis instance
  (`conductorRuntime.ts` remembers/clears the latest instance; interface gained an optional
  `scrollTo`). ScrollTrigger, beats, pacing, and cameras are unchanged.
- Live mode: the flowing story article stays in the DOM (pacing grid + static modes
  untouched) but is `visibility:hidden` + `inert` + `aria-hidden`; the HUD is its complete
  visible equivalent and announces chapter changes via `aria-live="polite"`. `Story` renders
  `InspectionControl` only in non-live modes, so the panel id exists exactly once per mode.
- `.torque-freelook-toggle` restyled to the bounded D affordance (42 px desktop / 44 px
  narrow touch target). Dead live-mode inspection-fixed CSS removed (superseded by the HUD).
- Accent color follows the approved concept visuals (warm gold) rather than the page's cyan;
  palette unification is an open owner-review question, recorded in the plan.

## Verification (this session, proportional per the 2026-10-31 owner policy)

- `npm run typecheck` — clean. `npx vitest run src/scene/torque-wrench/` — **53 files /
  486 tests pass** (includes the conductor/ScrollTrigger suites unchanged).
- `npm run build` — clean (pre-existing chunk-size warnings only).
- Focused browser smoke (`.scratch/jg040/hud-smoke.cjs`, vite preview, installed Chromium,
  hardware GL): desktop 1440×900 + narrow 390×844 — HUD renders at opening/inspection/close
  with correct chapter mapping and caption titles; rail fully named; story hidden + inert;
  cue/tech/cutter present on Inspection and absent elsewhere; **rail seek lands Mechanism at
  narrative progress 0.461 (its beat window) on both viewports**; narrow Chapters disclosure
  opens, seeks, and re-closes; cutter panel opens with live playback controls; details
  disclosure opens; free-look button 42/44 px; **zero console/page errors**.
- Evidence stills at the concept packet's exact states (.418/.735/.940 by narrative
  progress through the probe's inverse map): `stills-stage1/{desktop,narrow}-{breakthrough,
  inspection,close}.png` + `checks.json` — 6/6 chapters matched, 0 errors. Zone rendering of
  the desktop Inspection still confirmed by pixel probe (caption/tech-panel/rail/WIP/button
  all present); the independent vision pass was unavailable this run — final visual
  acceptance is the owner's review regardless.

## Owner visual review + same-day fixes, 2026-11-03 (later session)

Mark reviewed the shipped chrome on the :5341 preview against `comparison-sheet-v2.jpg`:
**accepted as-is**, two flags (ruling: `docs/torque-wrench-rebuild/00-owner-rulings.md`).
At his request the Ring Switch and Exploded sequences were audited too.

- **Sequence audit** (`.scratch/jg040/audit-sequences.cjs`, 11 narrative states ×
  desktop 1440×900 / narrow 390×844, DOM co-visibility + vision passes): the only defect
  was the owner-reported duplicate — at the materials window (.72–.755) the old vertical
  `shaft-fos-bar` + `shaft-fos-model` block rendered alongside the HUD strip's horizontal
  FOS scale on both viewports. All other sequences clean (story hidden, no stale overlays,
  hotspots idle, zero console errors). Cosmetic notes: Free Look pill grazes gear teeth at
  the exploded hold.
- **Fix 1 (duplicate):** `ShaftStoryLayer` gained an opt-out `fosPanels` prop (default
  `true`); `TorqueInspectionOverlay` passes `false`, making the HUD strip the single live
  FOS presentation. Static/main-site consumers and the main-page shaft verifier (which
  targets `/?chapter=1&inspectionProof=1` with default panels) are unchanged.
- **Fix 2 (narrow Chapters sheet):** while open the sheet now owns the bottom — the caption
  and tech strip step aside (`data-rail-open` + `visibility:hidden`) instead of ghosting
  behind it; gold active-row marker (stable, no row shift), inactive-row contrast bump.
- **Re-verification:** typecheck clean; build clean; focused suites pass (all torque-wrench
  files + `staticChapter.test.tsx`; `cadGate` import timeout under load passes isolated).
  Two failures triaged as **not this change**: a concurrent session flipped `/home/` public
  in `src/shared/pages.ts` (03:06) making `TorqueWrenchPage.test.tsx`'s hardcoded
  `data-fade` count stale — theirs to land. Post-fix audit re-run: duplicate gone at
  materials on both viewports, chapters sheet verified visually (no ghosting, marker
  reads), zero console errors. Narrow-sheet minor polish (scrim above the sheet edge,
  one more contrast step) parked for the Stage 2 motion review.

## Stage 2 execution, 2026-11-03 (same session)

Built after the owner review fixes, per plan § Stage 2:

- **HUD-rect framing re-baseline.** Live chrome rects measured at the gated states on both
  viewports (`.scratch/jg040/hud-rects-measured.json`, pre-leader build): caption per-chapter
  anchoring (desktop high-left [22,63→390,244] drafting/breakthrough vs low-left
  [22,632→390,812] mechanism/close, taller [22,534→390,812] on inspection; narrow
  [-4,535→394,696] / inspection [-4,417→394,696]), tech strip (desktop
  [1094,586→1398,810] inspection-only; narrow [16,300→374,524]), rail (desktop
  [1264,387→1398,513]; narrow pill [16,709→374,748]), WIP top-right. Verifier selector sets
  updated to the real chrome: `verify-page-cinematography.mjs` / `preview-page-cinematography.mjs`
  measure the HUD children (`.torque-hud__caption/__tech/__rail/__wip`) instead of the old
  full-viewport `.torque-hud` wrapper entry; story selectors remain and drop out via the
  visibility filter. `verify-torque-camera-hud.mjs` captures a `hud.strip` record and the
  `shaft FEA HUD present` gate became `inline FOS HUD present` (same strictness: FOS
  presentation + material cards asserted at .735, now against the single live strip), and
  the manual cutter-control exercise seeks to the inspection chapter first (the toggle now
  lives in the caption zone). **No threshold weakened** — solver contract 16/16 and verifier
  node tests 11+19 pass unchanged. Full verifier on the FINAL Stage 2 build (leader + FOS
  sync + caption motion): **desktop PASS 30/30 gates, narrow PASS 30/30 gates, 0 browser
  errors** (`output/playwright/torque-camera-hud-jg040-rebaseline/after-final{,-narrow}`);
  an earlier pre-leader desktop run also passed 30/30 (`after`).
- **Live Min-FOS sync.** `TorqueHUD` runs a 15 Hz-quantized rAF (only while the chapter is
  inspection) over the same closed-form `sampleShaftScript`/`sampleFosPresentation` chain the
  suppressed study panels used: marker position + a small value next to the FOS title track
  the attempts (0.55 → 0.72 → 0.90) and revert to the static marker when the stress field is
  off. Probed live: `0.55` at 18.3% at .735, `0.90` at 30% at .75, reset at .775.
- **Tracked leader (caption → shaft).** `RuntimeWorld` publishes the study camera's look
  point as a projected screen point in the overlay sample (`studyAnchor`, optional field on
  `TorqueOverlaySample`; zero-allocation, computed every frame after the camera finalizes).
  The HUD draws a quiet gold anchor→elbow→shelf polyline from the caption's top-right to the
  dot. Verified live on desktop (dot at the study look point 720,450; hidden during
  non-study frames). On narrow it self-hides — the anchor (screen center) sits inside the
  caption/tech band, so a leader would be a stub; that is the intended quiet behavior.
- **Reduced-motion/poster caption parity: PASS.** `?quality=poster` and reduced-motion both
  render static mode with the story visible, no HUD mounted, and all five chapters carrying
  the same titles/ledes the HUD announces (`.scratch/jg040/parity-static.cjs`, 0 errors).
- **Motion review.** Chapter copy now swaps with a keyed 360 ms fade/rise (disabled under
  `prefers-reduced-motion`); FOS marker moves with a 66 ms linear transition. Remaining
  minor polish (parked, non-blocking): inactive-row contrast one more step, sheet-edge scrim
  above the narrow Chapters list.
- **Fixed brand mast: decided and shipped.** Owner chose the small fixed wordmark
  (`studiomark`, mono caps, concept gold, top-left, WIP keeps top-right). Smoke-checked on
  both viewports: desktop [42,22→109,32] / narrow [16,22→83,32], no WIP overlap, zero
  console errors (`.scratch/jg040/mast-smoke.cjs`); added to the measured HUD-rect selector
  sets. Final build typechecks and builds clean.
