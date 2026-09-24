# Evidence 26 — 2026-09-24: owner material rulings (2c shipped; 2a/2b planned)

## Shipped: 2c — reservoirs unify yellow (owner ruling 2026-09-24)

- **Diagnosis (measured)**: every RES occurrence in the GLB carries MSP_YELLOW_PAINT; 28 of
  30 render CAD-yellow under PUMP_HOUSING. The two under COMPOSITE_PANELS
  (V2RL300-SAF-RES-1019/1020-SAFE-1) caught the shell's blue repaint — and only 1019
  actually read blue (1020 has PART_POLICY 'keep' → null finish → already yellow). That
  asymmetry is exactly the "one blue reservoir" the owner saw.
- **Fix**: `finishFor` gains a `reservoir` rule (any `-RES-` occurrence name, any root,
  keeps its CAD finish — same named-part-over-root principle as the chrome exhaust
  ruling). Clipping semantics untouched (1020 stays 'keep'/whole; 1019 stays sectioned —
  see follow-up option below).
- **Verification**: tsc 0; vitest **99→100/100** after fix 2 (the review found the first
  test pass toothless — mutation m2/m4 kept the suite green — so the suite now includes
  an end-to-end test through the real prepareModel pipeline; architect re-ran the m2
  mutation: new test fails with the wiring deleted, 25/25 restored). DeepSeek review
  (110.5k tokens, survived a host-shell death to deliver): implementation byte-faithful,
  behavior traced (only the two SAF-RES parts leave the blue bucket; caps/clipping
  identical), latent ancestor-match risk documented in the code comment.
- Pixel-diff at u .34/.51: 0.13%/0.21% localized to the reservoir patches only.

## Follow-up options on this thread (not done — owner's call)

- 1019 is yellow but still SECTIONED while 1020 is 'keep'/whole: adding
  `'V2RL300-SAF-RES-1019-SAFE-1': 'keep'` to PART_POLICY makes the pair identical.
- If the unified yellow proves too loud against the airflow (owner's 2c musing), a
  follow-up can tone ALL reservoirs to a muted yellow in code.

## Planned: 2a — control panel blacks (needs Blender split first)

`V2CONTROL PANEL, URFS-2` is a SINGLE mesh with ONE material (MSP_YELLOW_PAINT) in the
GLB — the site cannot paint its sub-elements differently. Path: owner splits the panel
into sub-meshes with named materials in Blender (outer shell black powder coat, screen
riser soft black, key switch stainless, screen soft gray), re-exports; code then maps
finishes by material name (stainless can reuse the CHROME treatment). Interim option:
paint the whole panel one dark tone in code now, refine after the split.

## Planned: 2b — insulation (SIF) dark blue

24 SIF occurrences (ENCLOSURE_CHASSIS + ACOUSTIC_BAFFLES roots) carry mixed materials
(MSP_YELLOW_PAINT→already blue via shell rule; MSP_ALUMINUM / MSP_RUBBER read
white/gray — the piece behind the airflow path). Mechanism ready: same per-name rule as
the reservoir ruling, keyed on `-SIF-` → the approved blue '#193f66' regardless of
material. Not implemented yet — owner asked to start with 2c.

## Q1 record — the real pump (PUMP_END_CASTSTEEL-1)

NOT in the web lineage: 0 matching nodes in the committed msp-enclosure.glb (the
webexport-v4 blend predates the pump's addition to the photoreal assembly). To drop it
in: append it into the WEBEXPORT view copy (coordinates carry from the photoreal file),
decimate to the web budget, export the draco GLB, hand it over — code side needs no
policy (PUMP_HOUSING default 'keep' shows it CAD-finish); verify triangle budget via
telemetry after.

## Q3 record — the lower intake is authored code, not CAD

The bottom airflow path (louvers + collector + duct + riser) exists ONLY in
`src/scene/rl300/LowerIntake.tsx` — that is why it is not in any .blend. Exported for
the owner's Blender session (web Y-up world coordinates):
`C:\Projects\CAD\RL300-SAFE\WEB-lower-intake-REFERENCE-20260924.glb`. Owner will shift
it into the skid/fuel-tank bay (onto V2FTA-FP-46-RL-1000-1 / V2RL300-SAF-1047-4) himself
and return geometry; then LowerIntake.tsx coordinates + the lower spine + its tests get
re-pinned in one cycle.
