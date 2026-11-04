# JG-039 — homepage build verification (2026-11-01)

> **Current continuation, 2026-11-03:** Header scroll gate/fade implementation is
> locally verified. WCS hover navigation and full-bleed torque-wrench images are
> now implemented locally. See the [current
> status and temporary handoff location](../../../../docs/homepage-header-scroll-2026-11-03.md).
> Earlier cloud/PR/build statements below remain historical evidence.

Build: branch `claude/project-thread-tlq9j4` (W1 + W5 by the orchestrator; W2 vault/loupe/theme,
W3 thread, W4 rope by parallel workers on local sub-branches, merged). Checks run in the cloud
sandbox on `vite preview` :4173 (restarted after rebuilds), headless Chromium (software GL).

## Static gates

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npx vitest run src/home src/shared` | 13 files, 310/310 pass |
| `npm run build` | pass (existing >500 kB chunk warning only) |
| `node scripts/verify-launch-dist.mjs` | OK, 52 required present (adds `home/index.html` + 6 drawings), zero M249 |

## Browser smoke (Playwright)

Cases: desktop 1440×900 and phone 390×844 (touch), light and dark, plus reduced motion.

- Console errors: 0 in all 6 cases. Horizontal scroll: none in all 6.
- Row links: `/torque-wrench/` and `/quiet-machine/` (both return 200). Armament row is not a link.
- Keyboard tab order: mark → Work → + Plus → Contact → theme toggle → cue → row 01 → row 02 →
  "Pull the thread" button → email → LinkedIn → GitHub; every stop shows a focus outline.
- Rope by keyboard: Enter on the button → caption "Straightened out. Let’s talk." (light + dark).
- Layers: 6 ghost + 6 loupe desktop, 3 + 3 phone, 3 static + no loupe with reduced motion.
- Thread (W3 measurement): dashoffset falls monotonically with scroll; eyelets light in order;
  reduced motion = fully drawn.

## Contrast (computed, WCAG relative luminance)

| Theme | ink/bg | ink/surface | muted/bg | muted/surface | accent/bg | accent/surface |
|---|---|---|---|---|---|---|
| light | 15.80 | 16.94 | 6.98 | 7.48 | 4.59 | 4.92 |
| dark | 14.36 | 12.85 | 8.68 | 7.76 | 6.15 | 5.50 |

Over a ghost line at the 0.18 opacity cap, accent drops to 3.46 (light) / 3.91 (dark), so small
accent text was removed from places that sit on the drawings (hero cue text and solved rope caption
are ink; only the arrow and large "+" glyphs stay orange, under the 3:1 graphics/large-text rule).
Ink and muted stay ≥ 5.26 over a ghost line. Text under the loupe itself is not contrast-checked
(it is transient; the touch sweep inks at half strength for that reason).

## Performance (4× CPU throttle, scripted scroll top→bottom, 12 px/frame)

| Profile | Frames | median | p95 | max | frames > 33 ms |
|---|---|---|---|---|---|
| phone 390×844 | 281 | 16.7 ms | 16.8 ms | 50.1 ms | 2 |
| desktop 1440×900 | 224 | 16.7 ms | 16.7 ms | 16.8 ms | 0 |

Layers write only `transform`/`opacity`; the thread writes `stroke-dashoffset`; the loupe writes
two CSS vars. Headless software GL, not a real phone: device check still open.

## Screenshots

Gitignored here (evidence PNGs stay local by repo rule); copies are in the project's shared files at `homepage/screenshots/`.

`desktop-{light,dark}-{hero,work,plus,contact,contact-pulled}.png`,
`phone-{light,dark}-hero.png`, `phone-light-work.png`, `phone-dark-contact.png`,
`desktop-light-reduced-hero.png`.

## Not verified

Real touch device, devicePixelRatio > 1, Safari/Firefox, owner visual acceptance.

## Follow-up 2026-11-02

- Owner decisions 2026-11-01: Phipps quote stays; employer names removed from drawings (pump post
  decals and armament revision strip blanked; CAT engine logo left, supplier not employer).
- Pure modules renamed `vaultMath.ts` / `threadPath.ts`: on a case-insensitive file system
  `./Vault` could resolve to `vault.ts`.
- Phone rows get 14 px side padding so the thread's eyelets are no longer clipped at the screen edge.
- Armament placeholder: private `/armament/` page (noindex, text only, no drawings), linked from
  the homepage's 03 row; back link to `/home/`. Registered in `PAGES` (index 5) with pinned tests
  and in the verify-launch-dist list.
- Re-run: typecheck pass; vitest src/home + src/shared 318/318; build pass; verify-launch-dist OK
  (53 required); 6-case homepage smoke 0 console errors, no horizontal scroll; armament page
  desktop light + phone dark 0 errors, noindex present, back link returns to `/home/`.

## 2026-11-02 — v2 favourites (stacks, rolling hero, fonts)

- Fonts: Michroma / Archivo / Space Grotesk / JetBrains Mono, self-hosted (src/home/FONTS.md). All four load (document.fonts check) in dark, light and phone.
- Rolling hero sentence: 4 phrases, stops after 2 rounds (WCAG 2.2.2), pauses on hover, full sentence for screen readers.
- Parallax drift halved (DRAWING_LAYERS dx/dy/ds).
- Peel-through project stacks (from v2), 23 cleaned images: no company names, AI-looking images dropped. Each stack links to its 3D page; Renderings is a gallery with no page. Reduced motion shows a plain grid.
- Checks: typecheck, vitest 1484/1484, build, verify-launch-dist OK; smoke 0 console errors, no horizontal scroll (5 cases); stack counters advance on scroll.
- Perf (4x CPU throttle, software GPU): phone median 16.7 ms / p95 33.3; desktop median 33.3 / p95 50.0 (p95 down from 66.7 after hiding buried cards). Recheck on real hardware before go-live.

## 2026-11-02 — redaction (blurred dimensions, Torque Gun removed)

- `scripts/blur-dimensions.py` run on vault drawings armament-receiver, armament-sections, gearbox-housing, gearbox-sections, pump-door and stacks torque-wrench/03-06, armament/02, armament/06 (visually checked: callouts blurred, view labels sharp).
- Removed stacks torque-wrench/01, 02 and renderings/01 (pistol-grip Torque Gun). Displayed "Torque Gun"/"JGUN" copy renamed across homepage and /torque-wrench/.
- Checks: typecheck, vitest 1486/1486, build, verify-launch-dist OK (112 files); smoke 6 cases 0 errors, no horizontal scroll; stack counters 04/06/06/04.

## 2026-11-03 — local header scroll gate and next corrections

Production build/typecheck PASS; homepage tests 84/84 PASS; focused production
Chromium verifier 13/13 PASS with zero page errors at 1440×900 and emulated touch
390×844. Captures include wheel/input release, reversal, resized reverse endpoint,
keyboard/menu/focus, touch continuation, cold/late fonts, anchors/reload/history and
reduced-motion paths. Authored collapse 450 ms; first scroll in the final recorded
wheel burst at 547 ms after compact state (80 frames). Physical mobile and other
browser engines are unverified. Independent static review's three edge cases were
corrected and confirmed resolved; owner visual acceptance stays OPEN.

Details, commands and artifact locations: [current implementation record](../../../../docs/homepage-header-scroll-2026-11-03.md).
Verifier: `scripts/verify-home-header.mjs`; local evidence:
`output/playwright/home-header/summary.json`, `wheel-frames.json` and screenshots.
Local preview last served at <http://127.0.0.1:4187/home/>; recheck/restart if needed.
This continuation made no commit, push or deployment.

**Pending owner corrections:** WCS hover must reveal the original three navigation
buttons; Mark reports no apparent clicked-open exit. Torque-wrench images must
fill all card edges, with crop/zoom allowed. Existing browser checks predate those
changes and do not establish their completion. Exact requirements and next-session
handoff location are in the current implementation record. The follow-up closeout
updated documentation only; runtime files were not changed again.
