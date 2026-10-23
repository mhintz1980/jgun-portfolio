# Phone header: nav on one row at <= 600 px (2026-10-12)

Owner: "phone width: look change authorized"; "Header pngs approved"; "opus approved" (Opus 5.5 advisor in place of Astra, owner 2026-10-12, phone header only).

## Edit
`src/scene/rl300/quiet-machine.css`, inside `@media (max-width: 600px)`: `.qm-header` nav links at 8px / .08em tracking, list gap `4px 10px`, index margin `.3em`. CSS only; every selector scoped to `.qm-header`; shared `PageNav` and the end-card nav untouched.

## Measured (before > after, `before-metrics.json`, `after-metrics.json`)
- Header bottom 105 > 84 px at 390 and 360 wide (header height 83 > 62); nav 2 rows > 1 row; `scrollWidth` equals the viewport at all three sizes (no overflow).
- Fits one row at 390x844, 390x667 and 360x640. At 320 the list still wraps to 2 rows (flex-wrap kept).
- Eyebrow/editorial block not moved (top 120 px), so a 36 px gap now sits under the header; left as approved.

## Tap target (WCAG 2.5.8)
The nav has one live link, `01 TORQUE GUN`: 75.8 x 9.0 px, centre y 77.0; the brand link ends at y 60.5, so the centre is 16.5 px below it (>= 12). **Met by the spacing exception** at all three sizes. `02` is current-page text and `03` is reserved text (not links). Same-size note: the link was already about 12 px tall at 10px type.

## Gates (once each)
typecheck 0; full vitest 50 files / 701 tests; build 0; `check:station2` 0; `verify-jg033-preview` exit 0, errors []; `verify-page-transition.mjs --viewport=390x844` RESULT: PASS (it clicks the header nav); U.1 clean; U.2 hunks=1 removed=0.

## Evidence
`header-before-after.png` (390x844, 390x667, 360x640, u 0), per-viewport PNGs at u 0 and .2, metrics JSON. Desktop renderer for later GPU-6: `ANGLE (AMD, AMD Radeon 780M Graphics, D3D11)`.
