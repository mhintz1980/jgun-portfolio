# JG-022 — Reduced-motion chapter stranding fix · Verification

**Date:** 2026-08-30 · **Plan:** `project/work/plans/JG-022-reduced-motion-chapter-stranding.md`
**Status:** verified (probe suite green; commit local pending Mark's batch review with the JG-021 materials round)

## Defect (confirmed before fix)

Under `prefers-reduced-motion`, `App.tsx` unmounts `ScrollRig`
(`motionActive = canvasActive && !reducedMotion`), so ScrollTrigger never
updates `chapter` in the scroll store; `Chapters.tsx` gated each static
card on that frozen value (`activeChapter !== chapterDef.index &&
reducedMotion → null`) — only the CH.01 card ever rendered. Native scroll
moved the page through the full 440vh/660vh track, but Chapters 2–4 and
their station copy were unreachable for the entire reduced-motion tier.

## Fix (one file: `src/components/Chapters.tsx`)

Tier-only native-scroll listener (mounted iff `reducedMotion`) derives the
active chapter from the same `CHAPTER_RANGES` the full-motion path gates
cards by (`p >= start` of each chapter window; gaps hold the outgoing
chapter) and writes it to **local** `staticChapter` state; the static-card
guard now reads that. Deliberately **no scroll-store writes**: the 3D world
stays pinned to Station 1 in this tier (plan constraint: static cards only,
no canvas spin-up) and the full-motion path's render graph is untouched.
The now-unused `activeChapter` store subscription was removed (the
full-motion branch gates by `progress` opacity, not chapter). No listener
exists in any other tier.

## Verification (fresh :4173, headless CDP DOM probes)

- **Reduced-motion advance (the gate):** emulated
  `prefers-reduced-motion: reduce`; DOM-probed rendered card labels while
  scrolling — `@0.08 → ["CH.01 ASSEMBLY"]`, `@0.35 → ["CH.02 X-RAY /
  EXPLODE"]`, `@0.60 → ["CH.03 THERMAL / ACOUSTIC"]`, `@0.92 → ["CH.04
  DIGITAL SYSTEMS"]` — exactly one card at a time, advancing in order.
  Initial load renders CH.01 only (unchanged shape).
- **Keyboard:** 5/5 focusable elements reachable via `focus()` traversal
  in the reduced-motion tier (case-study disclosures + beat content).
- **Full-motion regression:** static branch off (0 static cards), canvas
  live, `__telemetry` live, Lenis scroll working at Station 2 (0.65) —
  unchanged. Lite tier: listener and guard are both gated on
  `reducedMotion`; with motion active the diff is inert by construction.
- **Poster regression (live, `--disable-webgl2` → `detectWebGL2()` false →
  poster):** canvas absent, all four cards stacked (unchanged) with
  reduced-motion off; poster + reduced-motion — previously stranded at
  CH.01 by the same defect — now advances (`@0.35 → CH.02`, `@0.92 →
  CH.04`).
- **Console:** 0 errors (site-scoped) across both probe sessions.
- `npm run typecheck` GREEN · `npm run build` GREEN.
- Probe scripts: `.scratch/jg021-remediation/jg022-verify.mjs`,
  `jg022-poster.mjs`.

## Records

- TODO checkbox flipped to `[x]` and INDEX status → `verified` in this
  records commit (per plan §Verification).
- Commit intentionally LOCAL (not pushed): the working tree also carries
  the unpushed JG-021 materials round 3 (`6bd449c`) awaiting Mark's
  visual ruling — push the batch together after his review.
