**VERDICT** — fix-first

**Deciding risk:** stronger styling alone cannot recover an airflow story hidden behind opaque equipment. Preserve the approved route; fix its presentation, then its visual weight.

Read the prior ruling and required sources; viewed all six supplied PNGs. This is source arithmetic plus machine visual judgment, not a runtime occlusion census. Accepted fixes remain accepted. Paths below are relative to `src/scene/rl300/` unless specified.

## 1. Why it does not read — ranked

**First: opaque occlusion.** Ribbons occupy x≈−.18…−.40 while every camera is on +X. Pump/engine intentionally remain whole; model materials write depth (`prepareModel.ts:10,185`). Ribbons depth-test (`AirRibbons.tsx:419`). Captures show fragments between equipment, not continuous paths. This is the dominant structural diagnosis; exact hidden percentages are unmeasured.

**Second: screen-space weight.** Half-width formula is .004–.0085 m; the seven instantiated widths span .00463–.00845 (`AirRibbons.tsx:292`). The canvas is **702 CSS px high**, not 900 (`quiet-machine.css:2`). Using full width ≈702×half-width/[view-depth×tan(FOV/2)], these are nominal target-plane widths:

| u | Eye–target distance, m | FOV | Full width, CSS px |
|---|---:|---:|---:|
| .05 | 5.84 | 30° | 2.1–3.8 |
| .34 | 4.28 | 33° | 2.6–4.7 |
| .51 | 4.15 | 33° | 2.6–4.8 |
| .70 | 4.53 | 36.59° | 2.2–4.0 |
| .82 | 4.21 | 34.90° | 2.5–4.5 |
| .95 | 4.92 | 32.70° | 2.2–4.1 |

Local depths modify these estimates; .05/.95 correctly render no air. The flat core occupies only 70% of width: **1.5–2.8 CSS px at .70**. A 2× capture does not enlarge apparent width; renderer DPR is capped at 1.5 (`QuietMachineScene.tsx:121`).

**Third: reveal/taper timing**, detailed below. **Fourth: alpha/colour hierarchy.** Untapered air alpha is .574–.82, not intrinsically faint; main falls to .287–.41 at .51, all air to .332–.475 at .82. Cyan/navy authored swatches have ≈11:1 contrast before tone mapping/blending, but visible fragments compete against bright metal/yellow and similarly blue intake surfaces. **Fifth: count/tracers.** Tracers merely modulate alpha .70→1, synchronously across strands; they reinforce parallel wires rather than supply independent directional highlights.

## 2. Ribbon budget

**Total, not per bundle.** `project/work/plans/JG-033-rl300-quiet-machine.md:147` specifies the effect's starting budget. The prior total-budget ruling stands: 36–72 simultaneous strips would not solve this. Keep 18 desktop/9 mobile; rebalance to **6/6/6 and 3/3/3** so discharge is not the weakest bundle.

## 3. Where warmth goes

The .70 “full extent” premise contradicts `flow.ts:80`: merged extent is **.774**, although global heat is 1. Everything beyond that is discarded; the preceding .13 fades out. Full extent arrives only at .74. Even then, the terminal heat=1 vertex always has **zero head alpha** (`AirRibbons.tsx:106–110`).

Visible supplies reach only ~.30 heat; linear cyan/orange mixing plus ACES yields pale intermediate colours. The hotter downstream section is hidden behind equipment. Distance is not the main culprit: at .70, exit view-depth is **4.73 m versus junction 4.82 m**. ACES/exposure .85 softens saturation but cannot explain complete absence of orange from a visible high-alpha warm core.

## 4. Hero treatment

Target **6–10 CSS px full width desktop, 3–5 mobile**, with ≥70% flat core; base alpha **.90**, tracer peak **.98**. Keep NormalBlending and bloom-independent visibility. Do not brighten the entire scene or add particle density.

## 5. Structural ruling

JSX placement after the model is not “on top”; raising renderOrder cannot defeat opaque depth. Merged strands cannot individually sort, but same-colour overlap is secondary, not why entire discharge sections disappear. The shader is unlit: stronger lights cannot rescue it. Adopt a clearly differentiated hidden-path treatment, not blanket depthTest=false or clipping removal.

## 6. Owner route

**Correct topologically against the supplied annotated-intent description:** below-louver entry, shallow duct, upward equipment passage, shared −Z discharge beyond the envelope. Preserve SPINES. Original annotation images were not supplied, so this is not pixel-exact arrow registration.

## Ordered fixes

1. **`AirRibbons.tsx:404,525; QuietMachineScene.tsx:147`:** retain visible depth-tested cores; add equipment-masked hidden segments with GreaterDepth, alpha **.40**, depthWrite=false, NormalBlending. Order hidden/visible passes **20/21**. Exclude shell, caps and ground from the hidden reveal; use a separate mask, not the cleared cap stencil.
2. **`flow.ts:80; AirRibbons.tsx:109`:** complete merged reveal by **u=.68**, hold through .76; shorten head fade **.13→.04**.
3. **`AirRibbons.tsx:292,141,122; flow.ts:36`:** half-widths **.014–.022 m**; implement §4 alpha targets and §2 split. Retain bounded fanning within passages.
4. **`AirRibbons.tsx:139; flow.ts:53`:** preserve accumulated heat; map colour with **smoothstep(.25,.75,authoredHeat)** and warm stop **#FF7A24**, producing sustained downstream warmth before the tip fade. Keep global ACES/exposure unchanged.
5. **`AirRibbons.tsx:117–122,287`:** **3–5 tracer highlights per strand**, **20–30% duty**, deterministic per-strand phase offsets; continuous .90 core remains underneath.

