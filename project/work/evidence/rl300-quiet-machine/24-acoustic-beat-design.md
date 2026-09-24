# Evidence 24 — 2026-09-24: acoustic-beat DESIGN (concept for owner ruling)

STATUS: **AWAITING OWNER CONCEPT RULING** on `lower-fix/acoustic-concept-sheet-2026-09-24.png`.
No implementation before the ruling (handoff 22 §4). Design by the architect from measured
geometry + Astra's evidence 11 §5 constraints, verbatim:

> "Not concentric bubbles, but also not wave fronts: four longitudinal source-to-target
> curves grow along their paths. Generic endpoint narrowing does not demonstrate
> interaction with baffles; no authored contact event, deflection, or contact-local
> attenuation exists. Six grounded orange chevrons are semantically distinct from airborne
> sound, though their simultaneous reveal does not demonstrate isolation behavior. Preserve
> that distinction while making the acoustic relationship visible."

## 1. Measurements (`.scratch/lower-fix/baffles.mjs`, msp-enclosure.glb @ 29c0118)

- `ACOUSTIC_BAFFLES` root: 2158 tris / 5 parts, AABB x ±.63, y 1.070–1.862, z −1.024–1.352.
- On the sound lane (x ≈ −.20 ± .18) the baffle slab centroids cluster at
  z ≈ −.47, −.23, .5, .7, .94, 1.2, 1.35 — a ~.2–.25 pitch labyrinth.
- **The current 4 sound targets float**: nearest measured baffle faces are
  t0 8.8 mm (a top face, normal +y), t1 66 mm (+z slab face), t2 144 mm (free air),
  t3 56 mm (far-side face at x +.21, normal −y−z — faces the source, dot −.93).
  Only t0 is near a face; the `baffleContact` alpha taper keys off a coarse y-z BOX,
  so nothing on screen reads as contact — Astra's finding, now measured.
- Sound window `smooth(.76,.86,u)`; `SOUND_ORIGIN [-.20,.95,.10]` (beside the pump
  hotspot [.022,.943,−.055]); chevrons at the 6 measured isolation mounts, orange, kind 1.

## 2. The design — four authored elements (nothing else changes)

**E1. Measured contacts.** The four fronts re-target ONTO measured faces
(concept sheet, green A–D):

| id | contact (world) | face | encounter |
|----|-----------------|------|-----------|
| A | (−.20, 1.372, .545) | top face, normal +y | near-vertical absorption hit |
| B | (−.20, 1.600, .712) | +z slab face | angled hit (~47° off normal) |
| C | (−.20, 1.700, .935) | slanted face (normal ≈ (.17,−.70,.70)) | grazing encounter |
| D | (+.18, 1.470, 1.240) | far-side face, normal ≈ (0,−.70,−.71) | cross-duct absorption |

Variety is deliberate: two absorbing hits, one graze, one long cross-duct ray — a
labyrinth at work, not four parallel arrows.

**E2. Staggered arrival sweep.** Front i draws over `[.760 + .012i, .820 + .012i]`
(contacts resolve ~.82–.856). The beat reads as a sweep through the labyrinth, not a
simultaneous wall — and the close-out fade (1 − smooth(.86,.90)) is untouched.

**E3. The contact event** (fires when a front's extent crosses its contact parameter):
1. *Terminal absorption* — the terminal ~15% of the front steps alpha down sharply AT
   the face (current soft .46 box taper becomes a face-local ramp): the front visibly
   dies INTO the baffle.
2. *Deflection stub* — a short (~80–120 mm) glancing arc leaving the contact along the
   face plane, away from the incidence direction; width ≈ .005 (2/3 of the front's),
   alpha decaying to zero; drawn only in the sub-window after its contact fires. The
   un-absorbed remainder glancing off — the element that says "hit something". At the
   grazing contact (C) the stub is the longest; at near-normal hits (A, D) it is shortest.
3. *Contact-local flash* — a brief brightening of the terminal segment exactly at
   contact onset, decaying with the absorption ramp. Terminal-only, no radial spread:
   a contact signature, not a pulse.

**E4. Chevron isolation response.** The six orange chevrons keep hue, geometry, and
positions; their reveal sequences AFTER the contacts (from ~.85, ~.004 apart) instead of
simultaneously — the mounts answer the absorbed energy. Structure-borne remainder reads
as the second channel; the airborne/grounded distinction Astra asked to preserve.

## 3. Implementation surface (spec derived after the ruling; estimates)

- `AirRibbons.tsx` `soundPaths()`: re-target the 4 curves to A–D (control points tuned
  per incidence), add per-front deflection-stub paths, bake per-vertex contact metadata
  (contact t per front; chevron delay) — new small attributes, merged as today.
- Shaders: replace the box-proximity `aContact` semantics with the E3 face-local ramp +
  time gate (uExtent vs contact t); chevron stagger from the baked delay.
- `flow.ts`: `SOUND_TARGETS` constant moves to the measured contacts (SOUND_ORIGIN,
  SOUND_FRONTS, window, budgets, chevron mounts unchanged).
- Tests: extend the rl300 suite — contacts within 5 mm of a measured baffle face
  (raycast the GLB-root-derived faces, or pin against constants + a face-distance check
  like the airway section pattern), stub geometry bounds, staggered-timing order,
  chevron-distinctness (kind/hue separation), no new draw calls beyond the stub strips.

## 4. Ruling asked (concept level)

1. **Ship the four-element concept as designed?** (If any element is vetoed, name it:
   contacts / sweep / deflection+absorption / chevron sequencing.)
2. Contact-local flash: subtle (recommended) or pronounced?
3. Any preference on D crossing the duct centerline vs staying on the near side?

After the ruling: six-part spec → producer (DeepSeek if topped up, else GLM; reviewer =
the other family) → gates → captures → contact sheet → commit.
