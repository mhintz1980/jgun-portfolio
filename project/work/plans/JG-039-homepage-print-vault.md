---
id: JG-039
title: Private homepage at /home/ — Path A "Print Vault + Loupe"
status: in-progress
created: 2026-11-01
owner: Mark Hintz (approved Path A + thread concept, 2026-11-01)
todo: TODO.md#active
source:
  - docs/homepage-header-scroll-2026-11-03.md
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

Current status (2026-11-03): [header gate implementation and verification](../../../docs/homepage-header-scroll-2026-11-03.md)
are complete locally. The owner's newer hover-navigation and full-bleed image
corrections are implemented locally; owner visual acceptance remains OPEN.

A landing page that tells visitors this is Mark Hintz's portfolio, shows the three core projects
and the "+ Systems Builder" tools, and introduces the site's interactive feel: ghosted CAD drawings
with parallax, a cursor loupe, a Revision Orange thread that draws itself with scroll, and a
"pull to untangle" contact rope. Registered as a private page (`/home/`, noindex, not in nav) so
Originally private for review; Mark approved the corrected homepage and requested
the public /home/ release on 2026-11-03.

## Scope

Original spec, accuracy rules, ownership and acceptance checks:
`docs/HANDOFF-homepage-path-a-2026-11-01.md`; newer directions are in the current
2026-11-03 record. The armament placeholder, redacted drawings and reference-site
fonts have since been implemented as recorded in the evidence chronology.
Current continuation excludes replacing the root `/` redirect, commit/push,
deployment and merge. The newer corrections are implemented locally; see the current record for verification.

## Implementation Steps

1. W1: registry row, `home/index.html` (byte-identical fade block, noindex, theme head script),
   skeleton `HomePage` with stub `Vault`/`Thread`/`ContactRope`, pinned tests, verify-launch-dist list.
2. W2 vault + loupe + theme; W3 thread; W4 contact rope (each owns only its files).
3. W5 layout, cards, hover preview, a11y. W6 QA per acceptance list.

## Acceptance Criteria

The checked items below describe the original build's dated evidence; they do not
certify the newer corrections. Current header verification and its limits are
recorded in the linked 2026-11-03 status document.

- [x] Static gates pass (typecheck, vitest, build, verify-launch-dist).
- [x] Browser smoke and screenshots in both themes, desktop and phone, reduced motion.
- [x] Contrast computed ≥ 4.5:1 for every text pair.
- [x] Torque-wrench and Quiet Machine pages unchanged; root still forwards to `/torque-wrench/`.

## Verification Record

Technical checks: [evidence/JG-039-homepage/README.md](../evidence/JG-039-homepage/README.md) (2026-11-01). Owner visual acceptance OPEN.

2026-11-03 continuation: production build, 84 homepage tests and 13 browser cases
PASS for the faster initial scroll gate, fade, focus, font/resize and restoration
handling. [Current record](../../../docs/homepage-header-scroll-2026-11-03.md).

## Next session — owner corrections, not yet implemented

- [ ] Hovering the compact WCS reveals the original Work / + Plus / Contact
  buttons, with usable pointer travel/exit and accessible touch/keyboard dismissal.
- [ ] Every torque-wrench project image fills its card edge to edge, with crop/zoom
  allowed; cover desktop, mobile and the reduced-motion grid. Preserve redactions.
- [ ] Extend focused browser verification and show both corrections locally.

Exact owner wording, implementation starting points, verification boundaries and
the temporary handoff/prompt locations are in the current record. No push, deploy,
root-route change, merge or new asset authorization is implied.

## Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-11-03 | Faster header gate/fade verified locally; hover nav and full-bleed torque-wrench corrections queued | Owner review and next-session handoff |
| 2026-11-03 | Hover navigation and full-bleed torque-wrench corrections implemented locally | Owner visual review open; see current status |
| 2026-11-01 | W1–W6 built and technically verified; PR opened, not merged | Orchestrated build |
| 2026-11-01 | Created | Mark approved Path A and the thread concept; registered at Task Intake. |

- [ ] Owner visual acceptance (Mark), then the open items in the handoff.
