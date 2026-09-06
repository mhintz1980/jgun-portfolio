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

---

## Addendum — JG-026 re-proof (2026-09-05)

**Why this re-proof exists.** An intermediate build on branch
`codex/b1-b2-engineering-drawing` added `paddingTop: '100vh'` to the reduced-motion card stack,
which pushed all chapter copy a full viewport below the fold — the exact defect JG-022 exists to
prevent. **The approach was changed rather than re-proved:** the padding is removed. The card's
own translucent panel (`bg-slate-950/85`) already reads over the static drawing frame behind it,
so no offset was needed.

One correction was required by JG-026's pacing map. `CHAPTER_RANGES` are authored on the paced
progress axis, so the reduced-motion scroll listener now maps raw scroll through
`pacedProgress()` exactly as `ScrollRig` does in the full-motion tier. Without it the listener
would have been comparing raw scroll against progress-space constants.

### Re-measurement

Fresh `:4173` run, 2026-09-05, emulated `prefers-reduced-motion: reduce`, 1920×1080.
Raw: `b1-b2-rebuild/proof/report.json → jg022`.

| raw scroll | rendered card labels | first card top |
|---|---|---:|
| 0.02 | `["CH.01 ASSEMBLY"]` | 0.044 vh |
| 0.35 | `["CH.01 ASSEMBLY"]` | 0.044 vh |
| 0.60 | `["CH.03 THERMAL / ACOUSTIC"]` | 0.044 vh |
| 0.92 | `["CH.04 DIGITAL SYSTEMS"]` | 0.044 vh |

**The verified gate holds: exactly one card at a time, advancing in order, none stranded below
the fold** — 0.044 vh, versus 1.044 vh under the intermediate build.

The raw-scroll positions at which chapters change differ from the 2026-08-31 record (`@0.08 →
CH.01`, `@0.35 → CH.02`, `@0.60 → CH.03`, `@0.92 → CH.04`) because JG-026's pacing ruling gives
the B1/B2 intro 30% of the document. The progress values the gate is actually written against
are unchanged; only the mapping from raw scroll to progress moved.

### Observation for the owner — pre-existing, not changed here

In the reduced-motion tier the single card sits in normal document flow at the top of the page,
so it scrolls off after roughly one viewport. That is `main` behaviour and predates JG-026;
fixing it (e.g. by making the static card `fixed` like the full-motion lane) would change
JG-022's verified shape, so it is flagged rather than done.

Full context: [JG-026 verification §8](JG-026-b1-b2-verification.md).
