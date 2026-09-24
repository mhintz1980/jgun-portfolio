# Evidence 24 — 2026-09-24: acoustic-beat DESIGN (v2 — Astra concept-reviewed)

STATUS: concept reviewed by gpt-6-astra (medium, 29.1k tokens, one call, images attached —
log `.scratch/lower-fix/astra-concept-review.log`): **"concept fix-first" — all five fixes
folded into v2 below (§2).** The owner directed Astra usage at medium/low effort and rules
visually on the rendered result. Implementation proceeds against v2.

v1 constraints from Astra's evidence 11 §5, verbatim:

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

**E2. Staggered arrival sweep.** Front i draws over `[.760 + .012i, .820 + .012i]`;
contact events fire at u ≈ .815 + .012i (extent crossing the contact parameter), the
last at ~.851. Overlapping windows read as one distributed event (Astra: endorsed,
provided earlier paths stay legible — they do: only each front's terminal collapses,
never the incoming run). Close-out fade (1 − smooth(.86,.90)) untouched.

**E3. The contact event — a junction collision, not a fade** (v2 per Astra):
1. *Junction-anchored absorption* — the incoming front holds FULL alpha right up to the
   face; when its extent crosses the contact parameter, the terminal segment (t > ~.85)
   collapses (alpha ×~.25) in a sharp ramp anchored AT the surface sample. The collapse
   IS the absorption, starting at the junction — a pre-contact fade would recreate
   today's disappearing endpoint (her explicit guard).
2. *Deflection stub* — a short glancing arc leaving the contact along the face plane,
   away from the incidence direction; width ~.005, attached/directional/extinguishing.
   Lengths: A 80 mm, B 100 mm, C 130 mm, D 70 mm. **Brightness inversely to length**
   (her rule: "longest should not also mean brightest"): alpha ceilings A/D .50,
   B .45, C .35; each stub ignites at its contact fire and extinguishes on its own by
   u ≈ .895. C's turn anchors exactly on the measured face so the graze reads as an
   encounter, not a miss.
3. *Contact-local flash — reinforcement only* — a slight (×~1.25) terminal brightening
   in a narrow band after contact fire, decaying. The encounter must read WITHOUT it
   (incoming path + unmistakable junction + weaker outgoing stub); tuned last. Never a
   detached dot, halo, or blink — her bubble/pulse red line.

**E4. Chevron isolation response — bounded rise-then-settle, one system event** (v2 per
Astra; the v1 per-contact cascade is REJECTED — "delay alone communicates sequence, not
isolation", and its .850 start preceded the final .851 contact while extending into the
close-out fade). The six orange chevrons keep hue/geometry/positions; as ONE mount-system
response beginning after the last contact, their opacity rises a bounded amount
(+~30%) over u .856–.872 and visibly SETTLES back by u ≈ .894 — the mounts receiving and
damping structure-borne energy, a distinct response to the machine's excitation (never
implying the baffles cause the isolation). All of it a pure function of u: deterministic,
scroll-reversible, no clock; under reduced motion (extent forced 1) the fronts render in
their post-contact state and the mount response still plays with u.

## 3. Implementation surface (v2)

- `AirRibbons.tsx` `soundPaths()`: re-target the 4 fronts to the measured contacts A–D
  (control points tuned per incidence); add 4 deflection-stub strips (glancing arcs per
  face plane + incidence, lengths/dimming per §2 E3.2); bake per-strip scalar attributes:
  contact/fire parameter for fronts, fire u for stubs (fronts keep the uExtent draw-on
  gate; stubs gate on their fire u with a ~.006 mini draw-on and self-extinguish by
  ~.895). Chevron strips unchanged geometrically; their bounded rise-settle is a
  shader-side function of u gated to kind 1 (no new attributes needed).
- Shaders: fragment-side junction collision (terminal collapse anchored at the contact
  sample when uExtent crosses the baked contact parameter), stub ignition/extinction,
  ×1.25 terminal flash reinforcement, chevron response +~30% over u .856–.872 settling
  by ~.894. Everything pure in u; reduced motion renders post-contact states.
- `flow.ts`: SOUND_TARGETS → the measured contacts; SOUND_ORIGIN, SOUND_FRONTS, the
  sound window, budgets, chevron mounts unchanged.
- Tests: contacts within ~10 mm of a measured baffle face (pinned constants checked
  against face-distance math like the airway-section pattern); stub endpoints off their
  faces along the face plane; fire-ordering (last contact before chevron response
  start); chevron/airborne distinction (kind separation); existing suites stay green
  (98 + new).

## 4. Ruling asked (concept level)

Resolved by the Astra concept review (§5) + owner direction to proceed with Astra as the
design judge; the owner's visual gate applies to the rendered result.

## 5. Astra concept review (2026-09-24, gpt-6-astra medium, one call, 3 images)

**Verdict: "concept fix-first" — E1–E3 endorsed in principle, E4 rejected as designed.**
Her rulings, folded into v2 above:

1. §5 satisfaction: E1–E3 provide the missing authored contact/deflection/attenuation;
   keep visible energy reaching the face before it collapses; the airborne/grounded
   distinction survives; E4 needed a real isolation response.
2. Weakest at real scale: E4's meaning; the flash is the weakest visual cue (a 35 mm
   patch on a 7.5 mm ribbon ≈ a tiny sparkle) — the encounter must read without it.
3. C stays grazing (variety is useful); make its junction explicit and its outgoing stub
   weaker than its incoming front; converting it to a 4th absorbing hit sacrifices
   variety before testing the actual problem.
4. Sweep endorsed (overlapping intervals = one distributed event); the chevron cascade
   had two timing bugs (start .850 < final contact .856; six × .004 extends past .870
   into the close-out fade) and the deeper flaw: delay communicates sequence, not
   isolation. Give the mounts a bounded response that visibly settles; normalized scroll
   distance is not elapsed time. Do not imply baffle absorption causes isolation.
5. Bubble/pulse red line: nearest risk is the flash IF detached/halo/repeated; a single
   terminal brightening constrained to the junction stays clear. Stubs safe when
   attached, directional, extinguishing.

Her ranked fixes (all folded): 1. chevron bounded response + settling; 2. tie absorption
to the surface junction, preserve incoming visibility to contact; 3. reconcile last
contact / mount response / close-out timing; 4. anchor C's turn, reduce outgoing
strength; 5. tune the flash only after the junction works at full frame.
Named missing specs (now in §2/E4 + §3): mount attenuation behavior; contact onset/decay
under scroll stop/reverse/jump (answer: everything is a pure function of u — reversible
by construction); reduced-motion state (fronts render post-contact, response plays with u).
