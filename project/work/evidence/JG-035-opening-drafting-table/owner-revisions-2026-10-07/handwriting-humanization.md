# Handwriting humanization (owner feedback 2026-10-07: "too neat ... black ink, or graphite")

Code: `sheet/handwriting.ts` (engine), `sheet/ownerAnnotations.ts` (pens), `sheet/ink.ts` + `DrawingLinework.tsx` (colour). Cache version 6 -> 7.
Not visually verified in a browser; a PIL raster of the raw strokes was used only to sanity-check legibility.

- All visible notes are written in CAPITALS (`toUpperCase` inside `handwrite`; transcript strings and `OWNER_NOTES` untouched). Capitals redrawn as multi-stroke print: pointed-arch A with a low bar, E/F arms short of the stem, B/D/P/R bowls left open, I without serifs, narrow base width 0.93.
- Per letter, seeded (hash, no `Math.random`, bit-identical every bake): height +-12 %, width +-11 %, own lean +-7 deg on a 4 deg forward base (shear tan 4 deg), baseline lift +-0.22 glyph units plus a slow sine (wavelength 55-95 units) and a per-line drift slope +-0.005.
- Spacing: per-pair tracking mean 0.65 +-0.35, per-word crowd factor 0.35-1.65, word gaps 1.25-2.15 x the space glyph. Line pitch and margin wander (+-0.7 units; +-0.3 mm per baseline in `ownerAnnotations`).
- Hurry: past mid-line, letters shrink up to 13 %, narrow 10 %, sag, lean on and wobble 60 % more; spacing floors at 0.2 unit there so shrink and crowding never stack into merged letters.
- Per stroke: rotation +-4 deg, offset +-0.2, scale +-6 %; arc-length two-sine wobble (wavelength 5-9 and 2.8-4.2 units, amplitude ~0.2 unit = 0.4 of the pen half-width); far end drifts <= 0.32 unit off the start (open joins); start overshoot <= 0.3, end overshoot <= 0.55; 7.5 % of long strokes are double-struck over a short stretch.
- Pressure: width multiplier 0.65-1.35 per stroke (letter x stroke x slow line term), applied to `ink.path` width. Pen half-width 0.00024 m (was 0.0002); ring/leader on the dense section 0.0005 m.
- Strikes (red) are two bowed passes with slow wobble 0.34/0.40 mm and pressure 1.15/0.85; `handLine` is now a slow bow zero at both ends, not per-point noise.
- Line widths vs the old mixed-case text: -8 % to +10 % (longest, "Try C300 - Heat treat", 57.7 mm vs 52.4 mm); free-paper and anchor tests pass unchanged.

## Colour decision: graphite, not pure black
Colour index 2 (dash + 10 x colour; red stays 1, navy 0) = `#24262a`, a neutral near-black pencil/ink, with a faint sheet-pinned grain (two-octave value noise, <= 16 % density, faded out below ~1.5 px cells so it cannot shimmer). It is neutral where the typeface `#15295a` is saturated. Their luminances are close (#2a2c30 was ~0.0251 vs navy 0.0248), so `#2a2c30` would have separated by hue alone; the base was darkened to `#24262a`. Pure black was a design preference against (it reads as a second printed pen rather than a hand; graphite takes the grain better). Untested either way: both get the same lamp scaling (`uInkGraphite` x `inkLight`). Visibility against the dense section linework is unverified (hue + heavier pen only).

## O3: optional translucent second handwriting layer, NOT adopted
It would duplicate copy that is illegible at that scale; the close traverse already reads each note at legible size; and a second composited layer adds fill/overdraw cost on the lite and narrow tiers with no reading benefit.
