# Homepage header scroll refinement — 2026-11-03

Current status: the corrected homepage is **public**. Mark approved the local
result and requested release; deployment `2b33b2f4` serves `/home/` from clean
commit `876f11fc`, with `https://studiomark.dev/` forwarding to it.
This document is the current homepage status record; earlier results follow.

## Public release — 2026-11-03

The clean-tree release gate passed TypeScript, all **1,499** unit tests, the
production build, the 112-file launch/asset gate, and **9/9** live desktop,
narrow and reduced-motion smoke cases. Live document hashes match `dist/`, the
root opens `/home/`, an unknown route returns 404, and a hashed asset receives the
immutable cache policy. Full evidence and rollback reference:
`project/work/evidence/JG-039-homepage/release-2026-11-03.md`.
Publication does not close the broader cinematic/alias/opening gates.

## Hover and image correction — local continuation

The compact WCS reveals the existing Work, + Plus and Contact links on pointer
entry. A short exit delay keeps the links reachable; leaving closes the panel.
The toggle, outside tap and Escape dismiss it, and keyboard opening focuses the
first link. Section destinations, header choreography and redactions are retained.
All four existing torque-wrench drawings use cover without padding and a scoped
12% zoom in both the animated stack and reduced-motion grid; other projects retain
their original drawing treatment.

Production build, 84 homepage unit tests, and 20/20 expanded browser cases pass
with zero page errors. The browser verifier
covers hover travel/exit/re-entry, touch and keyboard dismissal, all four images
at desktop and mobile sizes in both motion modes, and existing scroll and anchor
regressions. See `output/playwright/home-header/summary.json` for the latest run
and `torque-*.png` for its crop captures. Preview: http://127.0.0.1:4187/home/.
The reduced-motion desktop and mobile screenshots were visually inspected; physical
devices and other browser engines were not tested. The owner approved this homepage
result and its public release; broader site and cinematic acceptance are separate.

Historical scope for the initial gate work: continue the then-dirty JG-039 homepage
in place and preserve the approved glyph/WCS choreography and 450 ms speed
refinement. The later owner approval and release request superseded its temporary
no-delivery boundary.

- [x] Hold the first downward wheel/key/touch input at the document top until all
  header geometry transitions finish; allow reversal and native anchor/focus jumps.
- [x] Reconcile fonts, viewport changes, reduced motion and focus transfers.
- [x] Fade scrolling content before the compact controls; keep keyboard focus visible.
- [x] Verify production build, homepage tests and desktop/mobile input paths;
  show the local preview and save concise evidence.

Unrelated tracked/untracked changes and staging are preserved. Owner visual review
remains separate from these functional checks.

## Local result and verification

Preview: <http://127.0.0.1:4187/home/> (production build; preview restarted after
the final rebuild). The first downward input consumes the 450 ms collapse at
scrollY=0. Continued wheel input or a held touch gesture can scroll after the
actual geometry transitions finish. Reduced motion has no intentional delay.
Upward input at the top reverses the sequence; the name link targets the real top.
The final continuous-wheel capture observed its first page movement 547 ms after
the compact state began (80 captured frames); authored motion is 450 ms, with
release sampled through the input cadence and browser frames.

Approved letter travel/order and WCS Y rotation/absorption/reversal are retained.
Compact controls settle 8 px from their respective corners. Resize/font changes
update both forward and reverse destinations. The veil clears the controls and
blocks pointer clicks on fully hidden content; keyboard focus scrolls into view.
Cold section links and reload/back navigation restore after the page exists,
without overriding a newer section selection or scroll input.

Final checks:

- `npm run build`: PASS (includes TypeScript).
- `npx vitest run src/home --maxWorkers=2`: 84/84 PASS, 7 files.
- `node scripts/verify-home-header.mjs`: 13/13 PASS, zero browser page errors.
- `git diff --check` and verifier syntax: PASS. Index remains empty.
- Independent static review: the three identified edge cases were corrected and
  confirmed resolved; this review is separate from browser and owner acceptance.

Browser coverage: Chromium 1440×900 and emulated touch 390×844; continuous wheel,
horizontal gesture, arrows/PageDown/Space/End/Home, interrupted reversal, focus
transfer, menu/Escape/theme activation, resize then reverse WCS endpoint, continuous
touch and next native swipe, cold/late fonts, direct Work/Contact and refresh,
history restoration, and initial/live reduced-motion changes. Physical iOS/Android
and other browser engines were not tested.

Reproducible verifier: `scripts/verify-home-header.mjs` (supports `--url=` and `--out=`).
Local evidence: `output/playwright/home-header/summary.json`, `wheel-frames.json`,
`desktop-compact.png`, `mobile-compact.png`, `mobile-expanded-dark.png` and
`mobile-reduced.png`. Initial failing runs informed the fixes; the final summary
records the passing rebuilt implementation.

Implementation changes were limited to `src/home/HomePage.tsx`, `DrawnName.tsx`
and `layout.css`, plus this record and the new verifier. Existing homepage edits
were continued in place. The later release commits and deployment are recorded
above; this paragraph preserves the earlier checkpoint's boundary.

## Owner corrections recorded 2026-11-03 — historical request

1. **WCS hover navigation.** Hovering the compact WCS icon must automatically
   expand it into the original **Work / + Plus / Contact** navigation buttons.
   Preserve their destinations and approved WCS motion. Keep the revealed links
   usable while the pointer moves from the icon into them; provide a clear return
   to the compact icon on leaving the combined interaction region. Keep the
   compact name, theme corner and initial scroll gate intact.
   Mark also reports the current clicked-open WCS menu has no apparent exit.
   Record this as owner feedback despite the prior verifier's Escape check: that
   check does not prove an obvious pointer exit. Hover will be the primary desktop
   interaction, while touch and keyboard still need a usable toggle/dismiss path,
   focus handling, Escape and section navigation. Do not make navigation hover-only.
2. **Torque-wrench project images must fill their cards edge to edge.** Use the
   existing attached images, full bleed, with no padding or letterboxing. Mark
   explicitly accepts cropping/zooming as much as needed to fill the card. Apply
   this to every torque-wrench stack card, including mobile and the reduced-motion
   grid; keep captions/navigation usable and preserve existing redactions. This
   request concerns the homepage project stack, not the 3D torque-wrench scene.
   Other project stacks have not been given a new crop direction.

Implementation starting points (inspected, not changed by this documentation turn):

- `src/home/HomePage.tsx`: current `menuOpen`, WCS toggle and section navigation;
  `src/home/layout.css`: compact/open nav styling and WCS transitions.
- `src/home/ProjectStack.tsx`: animated `.home-stack-card.is-drawing` and reduced
  `.home-stack-frame.is-drawing` paths. `src/home/stack.css` overrides their image
  rule with `object-fit: contain` and `padding: 2%`; the base rule is already cover.
- `src/home/content.ts`: torque-wrench entries are the four existing drawings
  `/home/stacks/torque-wrench/03.webp` through `06.webp`. Inspect embedded image
  margins as well as CSS: cover alone may not eliminate margins within an image.
  Use a project-specific class/prop or equivalent scoped styling rather than
  changing every drawing stack's presentation by accident.

The subsequent verification extended `scripts/verify-home-header.mjs` for hover enter,
icon-to-links pointer travel, leave/re-entry, touch/keyboard dismissal and focus,
and retain the existing scroll/anchor/reduced-motion cases. Inspect all four image
crops in desktop/mobile and the reduced grid using browser geometry plus screenshots.
The completed run passed 20/20 cases; Mark then approved the result and requested
publication.

Historical pre-correction handoff:
`C:\Users\Markimus\AppData\Local\Temp\HANDOFF-2026-11-03-homepage-hover-nav-full-bleed.md`.
Companion prompt: same directory, `PROMPT-2026-11-03-homepage-hover-nav-full-bleed.txt`.

Current post-release handoff:
`C:\Users\Markimus\AppData\Local\Temp\HANDOFF-2026-11-04-studiomark-home-release.md`.
Companion prompt: same directory, `PROMPT-2026-11-04-studiomark-home-release.txt`.
