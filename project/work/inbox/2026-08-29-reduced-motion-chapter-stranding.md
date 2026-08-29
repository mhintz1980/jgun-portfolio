# Reduced-motion tier strands visitors on CH.01

**Status:** confirmed 2026-08-29 during the JG-021 WS1 evidence pass (runtime telemetry + code trace by the executing agent). This validates the claim registered as a P4 checkpoint in JG-021 Amendment A; original source: plan-1 dual-agent review, archived at `.archive/remote-review-transfer-2026-08-29/`.

**Defect:** with `prefers-reduced-motion` active, `src/App.tsx` (~line 28) computes `motionActive = canvasActive && !reducedMotion` and unmounts `ScrollRig` (Lenis + GSAP ScrollTrigger). The static narrative renderer in `src/components/Chapters.tsx` (~line 213) gates each chapter on `activeChapter`, which is only ever updated by ScrollTrigger — so it stays locked at `0`. Observed result: native scrolling moves the page, but only the CH.01 narrative card ever renders; Chapters 2–4 and Stations 2–3 never appear to reduced-motion visitors.

**Proposed outcome:** reduced-motion visitors get a complete, navigable experience across all chapters and stations — e.g. the static renderer driven directly by scroll position (no ScrollTrigger dependency), or an equivalent mechanism.

**Affected areas:** `src/App.tsx`, `src/components/Chapters.tsx`, possibly `src/state/scrollStore.ts` (a lightweight progress source active under reduced motion).

**Unknowns:** intended reduced-motion UX (static chapter cards on native scroll? per-station poster sections?); whether hotspots/inspection should be reachable in this tier; interplay with the poster tier.

**Existing plans:** independent of JG-021 — Amendment A explicitly scopes this out as a follow-up task. Candidate `JG-022` at triage.
