# JG-043 — Claude Design homepage port and publication

Owner request, 2026-11-13: read `HANDOFF-homepage-claude-design-2026-11-10.md`,
carry its design edits into the homepage, commit, push, and deploy to studiomark.dev.
This explicitly authorizes publication. Final owner visual acceptance is separate.

## Source and intended update

- Clean release branch `codex/homepage-canvas-release-20261113` starts at
  `f230df2a370d0296f255d111a6fdb8d781b60d09`, the existing production carousel release.
- Design source: `design/homepage-canvas/Main.dc.html` from design commit `8d7084db`,
  SHA-256 `b691f37d65a133152dc434d19f2c55dc1302396522a554a2ba4717cf5407a91c`.
  Its private live Claude artifact requires sign-in in the available browser;
  subsequent unsaved/live changes cannot be verified. This release ports the saved snapshot.
- The snapshot's actual slider defaults supersede the handoff prose/fallback values:
  360px card width, 1.3 aspect, 1140px radius, 15-degree spacing, 300px equator,
  11px corners at a 900px-high desktop stage. All four caption left offsets are 550px.
- Port compact header padding/name proportions; Michroma captions, italic project
  titles and contact links; Archivo tags; Roboto row copy/counters; Work Sans metadata;
  owner armament caption wording; row spacing/right shift and drawing-layer -10px offset.
  Preserve the current theme toggle, animated header/menu, drawing loupe, project links,
  roving keyboard focus, touch scrolling and reduced-motion behavior.
- Fixed canvas coordinates become bounded responsive layout. The entire wheel scales
  down on narrow screens; phone captions remain below the image. Added fonts are
  self-hosted Latin WOFF2s, with no production requests to Google Fonts. Synthetic
  bold/italic Michroma follows the explicit canvas styling (the source face is regular).
- Shared dirty checkout, showreel work and private CAD remain outside this change.

## Proportional release checks

Before delivery: direct TypeScript check, homepage unit tests, pure Node checks,
production build and `verify-launch-dist.mjs`; focused desktop/phone browser checks
for clipping, fonts, header/menu, carousel controls, keyboard and reduced motion;
independent GLM-5.3 review at high effort (owner-selected, quota/pricing unverified).
Stage explicit paths only and verify the committed tree in a second clean worktree
with a junction to the dependency directory. Push the source to GitHub separately
from a Cloudflare Pages direct upload to `jgun-portfolio`, production branch `main`.
After upload verify production identity, public routes, changed assets and browser smoke.

## Results

- Initial direct TypeScript check PASS; 84/84 homepage tests PASS; 42/42 pure Node
  checks PASS; production build PASS; launch asset/route gate PASS. Existing large
  lazy scene chunk warnings remain; no 3D code changes are included.
- Final browser verifier: **30/30 PASS**, zero page errors, on the final application
  build (`output/playwright/header-canvas-final-full/summary.json`). Five-size
  canvas/layout smoke PASS at 1440x900, 390x844, 320x700 reduced motion, 820x900
  and 1280x720 (`output/playwright/canvas-local-final/report.json`), including
  light/dark screenshots, all four captions and loaded self-hosted fonts.
- The first full browser run is retained in `output/playwright/homepage-canvas-local/`:
  18/30 passed, a delayed-font check attempted hidden Contact navigation, and a
  preview restart during rebuilding invalidated the remaining cases. The verifier
  now opens the actual keyboard Sections menu when deep entry has compacted the
  header; its original newer-anchor/font assertions remain. The fresh 30/30 run
  supersedes that interrupted run for release evidence.
- Independent reviewer: `zai/glm-5.3`, requested high effort, **ACCEPT**, no blocking
  findings. Non-blocking: future separation of image description from owner caption,
  and thread eyelet alignment if the owner wants the row offset applied to its anchor.
  Parent visually inspected the desktop row/thread and armament carousel plus the
  phone carousel; no additional polish was required for this bounded port.
- Isolated commit proof and deployment results pending.
- Rollback before this update: Cloudflare deployment
  `b9337cb0-ce27-44de-a28f-738242d0f679`, source `f230df2a`.

This record does not mark JG-043 fully complete or claim final visual acceptance.
