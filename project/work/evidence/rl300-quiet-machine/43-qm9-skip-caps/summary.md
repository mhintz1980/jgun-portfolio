# QM9: skip cap passes while the section is closed (2026-10-12)

Owner ruling: "Ship the skip, Astra waived". Edit: `SectionCaps.tsx` sets each section group `visible = plane.constant < CLOSED_CUT - 1e-6`, so back, front and cap passes skip while the shell is closed (u 0..~.13 and ~.99..1; plane = .85, the model max x is .8, nothing is clipped).

## Proof (scratch builds, 4 rows: desktop 1440x900, portrait 390x844, tablet 768x1024, lite 390x844)
- `closed-proof.mjs` on HEAD e12fa094: caps on vs off at closed u differ by **2-16 isolated pixels** per frame (max channel delta ~40/255), control on-vs-on 0. This is the look change the owner ruled on. `closed-caps-on-vs-off.png` shows it (ON | OFF | diff x4, 8x zoom).
- `cross.mjs` HEAD build vs new build, threshold 0, u in {0,.07,.13,.2,.34,.51,.52,.685,.825,.99,1}:
  - open u (.2 .34 .51 .52 .685 .825): **0 changed pixels on all four rows**, draw calls and triangles unchanged.
  - closed u (0 .07 .13 .99 1): the same 2-16 specks removed, nothing else.
- Payoff at closed u (draw calls / triangles, before > after): desktop and tablet 143 > 119 / 1,210,464 > 906,048; portrait 143 > 119 / 1,205,280 > 900,864; lite 85 > 61 / 551,736 > 247,320. Open frames unchanged.

## Verifier edits (swap, no new assert)
- the four `capTarget` asserts run only at open anchors (`cutPlane < .85 - 1e-6`): `capTarget` is only measured inside the cap's `onAfterRender`.
- removed the closed-exterior caps on/off check (and its `closedCaps` report field): with caps skipped it compares two identical frames.
- the plan's "caps must render at the open anchors" assert and the preview.test.ts `capsActive` cases were not added: the u .52 `capPixels` check already fails if caps never draw, and nothing was removed to pay for new tests.
- Not done: plan edits 2-3 (`composed = !lite`, `ribbonTotalFor`): lite is already DPR 1 / no shadows / composer opt-in / 9 ribbons.
