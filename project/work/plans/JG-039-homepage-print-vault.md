---
id: JG-039
title: Private homepage at /home/ — Path A "Print Vault + Loupe"
status: in-progress
created: 2026-11-01
owner: Mark Hintz (approved Path A + thread concept, 2026-11-01)
todo: TODO.md#active
source:
  - docs/HANDOFF-homepage-path-a-2026-11-01.md
skills: []
implementation_scope:
  - home/index.html
  - src/home-main.tsx
  - src/home/**
  - public/home/drawings/*.webp
  - src/shared/pages.ts (+ pages.test.ts, pageTopology.test.ts entry lists)
  - scripts/verify-launch-dist.mjs (REQUIRED list)
acceptance:
  - typecheck, vitest (src/home, src/shared), build and verify-launch-dist pass
  - Playwright smoke desktop 1440x900 + phone 390x844, both themes, reduced motion; no console errors, no horizontal scroll
  - every text token pair >= 4.5:1, computed
  - layers animate only transform/opacity
verification: project/work/evidence/JG-039-homepage/README.md
commits: []
replaces: null
---

# JG-039 — Private homepage at /home/ (Path A "Print Vault + Loupe")

## Outcome

A landing page that tells visitors this is Mark Hintz's portfolio, shows the three core projects
and the "+ Systems Builder" tools, and introduces the site's interactive feel: ghosted CAD drawings
with parallax, a cursor loupe, a Revision Orange thread that draws itself with scroll, and a
"pull to untangle" contact rope. Registered as a private page (`/home/`, noindex, not in nav) so
Mark can review it before the root flips.

## Scope

Spec, accuracy rules, file ownership and acceptance checks: `docs/HANDOFF-homepage-path-a-2026-11-01.md`.
Non-goals (not approved): replacing the root `/` redirect, deploying, merging. Armament page,
redacted drawing set and reference-site fonts are follow-ups.

## Implementation Steps

1. W1: registry row, `home/index.html` (byte-identical fade block, noindex, theme head script),
   skeleton `HomePage` with stub `Vault`/`Thread`/`ContactRope`, pinned tests, verify-launch-dist list.
2. W2 vault + loupe + theme; W3 thread; W4 contact rope (each owns only its files).
3. W5 layout, cards, hover preview, a11y. W6 QA per acceptance list.

## Acceptance Criteria

- [x] Static gates pass (typecheck, vitest, build, verify-launch-dist).
- [x] Browser smoke and screenshots in both themes, desktop and phone, reduced motion.
- [x] Contrast computed ≥ 4.5:1 for every text pair.
- [x] Torque-wrench and Quiet Machine pages unchanged; root still forwards to `/torque-wrench/`.

## Verification Record

Technical checks: [evidence/JG-039-homepage/README.md](../evidence/JG-039-homepage/README.md) (2026-11-01). Owner visual acceptance OPEN.

## Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-11-01 | W1–W6 built and technically verified; PR opened, not merged | Orchestrated build |
| 2026-11-01 | Created | Mark approved Path A and the thread concept; registered at Task Intake. |

- [ ] Owner visual acceptance (Mark), then the open items in the handoff.
