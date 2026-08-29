# JG-022 — Reduced-motion chapter stranding fix (static tier reaches all stations)

**Status:** queued · **Filed:** 2026-08-29 · **Promoted:** 2026-08-29 (triage approval — Mark Hintz) · **Origin:** unverified claim in the plan-1 dual-agent review (archived `.archive/remote-review-transfer-2026-08-29/`), confirmed by runtime probe + code trace during the JG-021 WS1 evidence pass. Independent of JG-021 — no file overlap (JG-021 owns scene/camera/station files; this task owns `App.tsx` / `Chapters.tsx` / possibly `scrollStore.ts`).

## Confirmed defect

With `prefers-reduced-motion` active:

- `src/App.tsx` (~line 28): `motionActive = canvasActive && !reducedMotion` unmounts `ScrollRig` (Lenis + GSAP ScrollTrigger).
- `src/components/Chapters.tsx` (~line 213): the static renderer gates each chapter on `activeChapter !== index && reducedMotion → null`, and `activeChapter` is only ever updated by ScrollTrigger — which is unmounted.
- Result: `activeChapter` stays locked at `0`. Native scroll moves the page, but only the CH.01 narrative card ever renders; Chapters 2–4 and Stations 2–3 never appear to reduced-motion visitors.

## Fix approach

Give the reduced-motion tier its own ScrollTrigger-free progress source:

1. A lightweight scroll-position listener (or IntersectionObserver on chapter sections) that drives `activeChapter` (and, if needed, a minimal progress value) while `reducedMotion` is active — mounted only in that tier, zero cost to the full-motion path.
2. Static chapter cards advance as the visitor scrolls; each station's chapter copy is reachable in static form.
3. Default UX shape (record any deviation in the implementation notes): static cards only — hotspots/inspection/3D interaction are not required in this tier; the poster tier is unaffected.

## Constraints

- No behavior change for the full-motion, lite, or poster tiers.
- No re-introduction of animation into the reduced-motion tier (it must stay genuinely reduced: no smooth-scroll, no parallax, no canvas spin-up).
- Follow `spatial-hotspot-a11y` semantics only if any interactive elements are added; otherwise this is DOM-only work.

## Verification

- DevTools `prefers-reduced-motion` emulation: scroll the full page; DOM-probe (not vision) that all four chapter cards render and advance in order.
- Regression: full-motion, lite, and poster tiers behave exactly as before (rerun the standard tier probes).
- Keyboard pass: reduced-motion tier remains fully keyboard-navigable (P3 gate).
- `npm run typecheck`, `npm run build`; console clean.
- Evidence record in `project/work/evidence/`; TODO checkbox and INDEX status flip in the same commit.

## Records & commits

- One implementation commit + evidence/records commit, explicit paths staged, per repo protocol.
