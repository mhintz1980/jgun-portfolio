---
id: JG-039
title: Public homepage at /home/ — Path A “Print Vault + Loupe”
status: complete
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
commits:
  - bbc684e4f941ad9550f2e4c92aade1c82518629e
  - 124fc57d0d4d683061c05c2416cf9b6e53617fae
  - 876f11fcde129ab41ff10cda4b83bd0148534fcc
replaces: null
---

# JG-039 — Public homepage at /home/ (Path A “Print Vault + Loupe”)

## Outcome

Current status (2026-11-03): complete and published. Mark approved the corrected
homepage; deployment 2b33b2f4 serves /home/ as the public landing page from clean
commit 876f11fc.

A landing page tells visitors this is Mark Hintz's portfolio, shows the three core
projects and the “+ Systems Builder” tools, and introduces the site's interactive
feel: ghosted CAD drawings with parallax, a cursor loupe, a Revision Orange thread
that draws itself with scroll, and a “pull to untangle” contact rope. It was
originally private for review; Mark approved the corrected homepage and requested
the public /home/ release on 2026-11-03.

## Scope

Original spec, accuracy rules, ownership and acceptance checks:
`docs/HANDOFF-homepage-path-a-2026-11-01.md`; newer directions are in the current
2026-11-03 record. The armament placeholder, redacted drawings and reference-site
fonts have since been implemented as recorded in the evidence chronology.
The approved release replaces the root redirect destination with /home/, makes the
landing page public and indexable, and retains the private armament placeholder.
Release evidence records the clean commit, deployment, hashes and verification limits.

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
- [x] Torque-wrench and Quiet Machine pages remain directly available; root forwards to /home/.

## Verification Record

Technical checks: [evidence/JG-039-homepage/README.md](../evidence/JG-039-homepage/README.md).

2026-11-03 continuation: production build, 84 homepage tests and 13 browser cases
PASS for the faster initial scroll gate, fade, focus, font/resize and restoration
handling. [Current record](../../../docs/homepage-header-scroll-2026-11-03.md).

## Owner corrections — completed

- [x] Hovering the compact WCS reveals the original Work / + Plus / Contact
  buttons, with usable pointer travel/exit and accessible touch/keyboard dismissal.
- [x] Every torque-wrench project image fills its card edge to edge, with crop/zoom
  allowed; cover desktop, mobile and the reduced-motion grid. Preserve redactions.
- [x] Extend focused browser verification and show both corrections locally.

The 20/20 focused browser result, owner approval and public release evidence are
recorded in the current status and release files.

## Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-11-03 | Faster header gate/fade verified locally; hover nav and full-bleed torque-wrench corrections queued | Owner review and next-session handoff |
| 2026-11-03 | Hover navigation and full-bleed torque-wrench corrections implemented locally | Owner visual review open; see current status |
| 2026-11-03 | Owner approved the correction; public /home/ release deployed as 2b33b2f4 | Mark requested wrap-up and publication |
| 2026-11-01 | W1–W6 built and technically verified; PR opened, not merged | Orchestrated build |
| 2026-11-01 | Created | Mark approved Path A and the thread concept; registered at Task Intake. |

- [x] Owner visual acceptance (Mark), followed by publication.
