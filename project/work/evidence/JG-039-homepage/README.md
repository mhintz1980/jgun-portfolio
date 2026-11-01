# JG-039 — homepage build verification (2026-11-01)

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
