# JG-040 Stage 2 — live owner-review capture (2026-11-04)

Review target: <https://www.studiomark.dev/torque-wrench/> (the apex route
`https://studiomark.dev/torque-wrench/` 301s to `www`). The served document hash —
`917b78122f57ee0bc6f1bddca7398c8adec4f7bdec2f6084f26dba7e6e78f09a` — matches the released
`/torque-wrench/index.html` recorded in
[`JG-039 release evidence`](../JG-039-homepage/release-2026-11-03.md), confirming Cloudflare
Pages deployment `2b33b2f4`. Captures used installed Playwright Chromium at 1440×900 and
390×844, live network, no local preview.

## Stage 2 additions — measured on the deployed page

| Addition | Live measurement |
|---|---|
| `studiomark` mast | `STUDIOMARK`, top-left; desktop rect [42,22→109,32], narrow [16,22→83,32]; no WIP-label overlap |
| Tracked leader | Desktop Inspection: `polyline` points `383.6,534.0 702.0,450.0 714.0,450.0`, dot (720,450) = `studyAnchor` (720,450); visible through .735/.75/.78; hidden outside the study and on narrow by design |
| Live Min-FOS sync | Strip reads `FOS 0.55` (marker 18.3%) at .735 and `FOS 0.90` (marker 30%) at .75; reverts to the static 28% marker with no live value once the stress field ends (.78) |
| Caption motion | Keyed `.torque-hud__caption-copy` remounts on chapter change with `torque-hud-caption-in` 360 ms: sampled start `opacity 0`, `translateY(10px)`, `t=0 running`; settles at opacity 1 / `transform: none`; `animation: none` under `prefers-reduced-motion` |

Five states probed per viewport (Breakthrough .42, Inspection .735/.75/.78, Close .94):
**zero page errors and zero console errors** on both. The earlier 30/30 + 30/30 verifier
results and the static/poster parity result remain the build's gate evidence; this run is a
live-visual confirmation, not a replacement.

## Composition observations at the review states

These are visible in the stills; none has been changed.

1. **Narrow Inspection: caption under the inline tech panel.** At 390×844 the caption rect is
   [-4,417→394,696] and the tech panel is [16,300→374,524]. The panel paints over the caption's
   top 107 px, hiding the `Inspection` title; `elementFromPoint` at y=508 and y=512 returns
   `.torque-hud__tech`. See `narrow-inspection-4140.png` / `zoom-narrow-collision.png`.
2. **Narrow Inspection: the shaft study's own material card paints over the tech panel.** At
   .735 the card (`AISI 4140 (40-45 HRC)` plus its caption) covers the panel's 4340/C300/FOS
   rows for roughly the card's dwell. The card belongs to the inspection overlay
   (`.torque-inspection-overlay`, same z=11, later in DOM); it is not a HUD element.
3. **Desktop Inspection: rail contrast over bright metal.** At .75 the shaft fills the frame in
   white steel; the edge scrim is present but rows 01/02/03/05 of the rail lose contrast
   against it (`desktop-inspection-c300.png`). The leader is legible on dark/stress-field
   frames and faint over the bare polished shaft (`zoom-leader-bright.png`).

The two previously parked notes still stand and were not touched: a scrim above the narrow
Chapters sheet edge and one more inactive-row contrast step.

Read-only CSS trials on the live page (`trials/`, injected styles only; no source changed)
show a viable narrow correction: raising the tech panel to `bottom: 27rem` puts it at
[16,188→374,412], clear of the caption's title at [16,460→374,489], and suppressing the
duplicate study card on narrow leaves the caption intact with no text collisions. Either
change alone is insufficient — raising the panel alone leaves the study card over the
caption title, and hiding the card alone leaves the caption title behind the panel.

## Owner ruling

2026-11-04: Mark had not yet seen the Stage 2 additions, so visual acceptance is **open**.
He asked for two corrections, implemented here:

- Fix both narrow Inspection overlaps (caption title behind the tech panel; the study's
  AISI card over the panel's 4340/C300/FOS rows).
- Raise the desktop rail and leader contrast at the bright C300 frame.

The ruling record is in `docs/torque-wrench-rebuild/00-owner-rulings.md`.

## Corrections implemented 2026-11-04

- `torque-hud.css`: narrow Inspection tech panel raised to `bottom: 27rem` (188–412 at
  390×844), clear of the caption title at 460–489; edge scrim widened/darkened
  (240 px, 0.68 → 0); rail base color raised to `#b9c2bc` with a tighter double shadow;
  leader opacity raised and given a dark drop-shadow; leader dot gained a dark ring.
- `torque-inspection-overlay.css`: on narrow live mode the duplicate study material card
  and attribution are hidden (their content remains in the screen-reader transcript); the
  remaining study captions move to the 5.5 rem top band (88–152) so they clear the panel.

Verification on a fresh production build (preview server, installed Chromium):
`npx tsc --noEmit` clean; build clean; `verify-torque-camera-hud.mjs` **PASS 30/30 gates,
0 browser errors on both 1440×900 and 390×844**. The strict
`verify-page-cinematography.mjs --cases=narrow-lite` roster still reports its known
HUD-over-subject clearance failures (caption and tech panel), consistent with Evidence 73's
strict gate history; no threshold was changed and no PASS is claimed for that roster.

Reviewed captures: `after-corrections/` (seven narrow states + desktop .75) and the
original live stills in this folder. Caption motion is recorded numerically by the
`live-caption-trace.cjs` run (animation starts at opacity 0 / translateY(10px) and settles
over 360 ms). Early video attempts captured the concurrent session's preloader and are not
review evidence.

Remaining observation (not part of the named corrections): at narrow .80–.815 the cascade
shaft fills the lower frame behind the caption, so the cue line and cutter button sit on
bright metal without a wash. The caption wash currently exists only on drafting,
breakthrough and close.

## Deployment 2026-11-04

Published the corrections only (the Stage 2 additions were already live):

- Source commit `53b2847d` on `torque-wrench/rebuild`, pushed to `origin`.
- Cloudflare Pages deployment **`81b234d0`** —
  <https://81b234d0.jgun-portfolio.pages.dev>.
- Deploy gate: typecheck PASS; **127 test files / 1,504 tests PASS**; production build PASS;
  launch gate PASS; upload 111 files with 9 new.
- Live document `https://www.studiomark.dev/torque-wrench/` SHA-256
  `19121197821f06147fc25051265f52c78d01b84db5ff30516009b36d949d4b18` equals the local
  `dist/torque-wrench/index.html`.
- Live probe `deployed-2026-11-04/`: desktop .75 FOS `0.90`, leader drop-shadow and rail
  `rgb(185,194,188)` computed; narrow .735 tech panel [16,188→374,412], caption title
  [16,460→374,489] hit-tests as itself, study card `display:none`, FOS `0.55`; zero browser
  errors on both.
- Public topology unchanged: `/home/` 200, apex 301 → `www`, `/armament/` 200 (private,
  noindex as before).

## Captures

- `desktop-{breakthrough-42,inspection-4140,inspection-c300,hobbing,close-94}.png`
- `narrow-{breakthrough-42,inspection-4140,inspection-c300,hobbing,close-94}.png`
- `crop-{desktop,narrow}-{mast,fos,rail,leader}.png`, `zoom-{leader-bright,leader-dark,mast,narrow-collision}.png`
- `live-review.json` (probe states), `motion-collisions.json` (stack/overlay probes and caption trace)
- `motion/*.webm` (scroll-through recordings; local review aids)
- Scripts: `.scratch/jg040/live-owner-review.cjs`, `.scratch/jg040/live-motion-and-collisions.cjs`,
  `.scratch/jg040/live-caption-trace.cjs`
