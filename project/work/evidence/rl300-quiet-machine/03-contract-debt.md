# RL300 "The Quiet Machine" — Contract Debt Inventory

> **What this is:** a line-referenced inventory of every existing assertion that the
> approved RL300 plan will make obsolete, plus the assertions that must be PRESERVED.
> It resolves nothing. Section C is explicitly deferred to another agent.

## Provenance

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Git rev | `3e3e49f` (`git rev-parse --short HEAD`) |
| Branch | `main` |
| Superseding authority | `docs/rl300-enclosure-issues-and-ideas.md` §1.1, §1.3, §3, §4 (owner FAIL, 2026-09-09) |
| Plan under review | `project/archive/superseded/rl300-the-quiet-machine-plan.md` — "Acceptance criteria" §Technical behavior (line 150) |
| Scope rule quoted | *"Replace obsolete 'yellow unchanged' and panel-lift expectations with the approved blue-shell and section requirements. Do not delete unrelated checks."* (plan line 150) |

### Files inventoried

| File | Lines | In original brief? |
|---|---|---|
| `scripts/check-station2-contract.mjs` | 66 | yes |
| `scripts/verify-jg032-station2-thermal.mjs` | 503 | yes |
| `src/scene/stages/recolorAllowList.ts` | 101 | yes |
| `src/scene/stages/recolorAllowList.test.ts` | 100 | yes |
| `src/scene/stages/airflowRoute.test.ts` | 154 | yes |
| `src/scene/jgunVisualGates.test.ts` | 84 | yes |
| `src/scene/rig/gearRotation.test.ts` | 55 | yes |
| `src/scene/drawing/introTimeline.test.ts` | 106 | yes |
| `src/scene/drawing/paperGrain.test.ts` | 44 | yes |
| `src/scene/stages/Station2_AcousticEnclosure.tsx` | 453 | **no — surfaced by the grep sweep** |
| `src/scene/stages/AirflowField.tsx` | 521 | **no — surfaced by the grep sweep** |
| `src/scene/stages/airflowRoute.ts` | 140 | **no — surfaced by the grep sweep** |

### Grep sweep result (`scripts/` + `src/`)

Terms: `MSP_YELLOW`, `yellow`, `PANELS_OPAQUE`, `panelLift`, `panel`, `lift`, `opaque`,
`census`, `allowList`.

- `MSP_YELLOW` — 16 hits across 5 files; all inventoried below.
- `PANELS_OPAQUE` — 3 hits (`verify-jg032…:334`, `Station2_AcousticEnclosure.tsx:181`, `:262`).
- `panelLift` (exact identifier) — **0 hits.** The lift never had a named symbol; it lived
  as a `position.y` write, now removed.
- `census` — 19 hits, **all in `scripts/verify-jg032-station2-thermal.mjs`.** No other file
  contains a census gate.
- `allowList` / `allow-list` — 35 hits across 4 files; all inventoried.
- `lift` — 23 hits; the only Station-2 ones are `AirflowField.tsx:329` and
  `Station2_AcousticEnclosure.tsx:171/184/185/190/351`. Every other `lift` hit is
  drawing-intro / hero vocabulary (`introTimeline.ts`, `DrawingLinework.tsx`,
  `scrollStore.ts`, `check-b1b2-contract.mjs`, `verify-jg028-handle-realism.mjs`)
  and is unrelated debt-wise.

### Material state finding (affects Section A weight)

Commit `d201ea8` ("JG-032 rev2: animated cross-section replaces panel lift") already
removed the vertical panel lift from `Station2_AcousticEnclosure.tsx` — that commit
touched only `SceneCanvas.tsx` and `Station2_AcousticEnclosure.tsx`. It did **not**
touch `scripts/verify-jg032-station2-thermal.mjs` (last commit on that file: `57e2e2d`).
There is no `position.y` write to `COMPOSITE_PANELS` anywhere in the component at HEAD.
**Consequence:** rows A.9 and A.10 below are not merely "about to become obsolete" —
they are already stale against HEAD and would fail on the next probe run.

---

## Section A — Assertions made obsolete by the owner ruling

**30 rows.** Grouped by file.

### A.1 — `scripts/verify-jg032-station2-thermal.mjs` (10 rows)

| File:line | Assertion (short quote) | What it currently requires | Why it is now wrong | Replacement requirement per the plan |
|---|---|---|---|---|
| `scripts/verify-jg032-station2-thermal.mjs:16-18` | `"…MSP_YELLOW_PAINT, / MSP_AIRWAY_VOLUME, PUMP_HOUSING, ISOLATION_MOUNTS and all other meshes / are unchanged."` | Header contract: the A/B delta set is exactly the allow-listed `MSP_BLACK_CHASSIS` meshes; every yellow mesh is unchanged. | Owner ruling (a): yellow shell members are the **primary** recolor target (issues doc §1.1, §4 row 1). | Header must state the delta set includes the shell going dark blue. |
| `scripts/verify-jg032-station2-thermal.mjs:49-52` | `const allowListed = (name) => CHASSIS_RE.some(…) \|\| PANEL_RE.some(…)` | A mirror of `recolorAllowList.ts`'s two regex lists, both of which exclude every yellow member. | The mirrored source data is itself obsolete (rows A.13, A.15). | Mirror must be re-derived once the allow-list covers the yellow shell. |
| `scripts/verify-jg032-station2-thermal.mjs:209` | `panelY = panels.position.y` | Capture probe collects the `COMPOSITE_PANELS` root Y translation as gate data. | Owner ruling (b): panel-lift rejected; the component writes no `position.y` at HEAD, so this always reads 0. | Probe should collect cross-section cut state (plane constant / cut amount), not panel Y. |
| `scripts/verify-jg032-station2-thermal.mjs:349-355` | `b.color === '#272728' && … (m.color === '#0a1a3a' \|\| m.color === '#132a4a')` | A delta is classified `recolor` only when baseline material is `MSP_BLACK_CHASSIS` at `#272728` and current is one of two navies. | A yellow `#ffc500` → dark-blue delta falls through to `null` → `UNEXPECTED` → hard FAIL. | Classifier must accept `MSP_YELLOW_PAINT` → approved dark blue as a legal delta. |
| `scripts/verify-jg032-station2-thermal.mjs:370-371` | `diff: ['recolor on non-allow-listed part']` | Any recolor landing on a part outside the allow-list is an `UNEXPECTED` delta. | The yellow shell members are currently non-allow-listed; recoloring them is now mandatory, not a violation. | Allow-list (and therefore this guard) must be widened to the shell members. |
| `scripts/verify-jg032-station2-thermal.mjs:392-399` | `pass('all allow-listed parts recolored (no misses)')` | Every allow-listed mesh carrying `MSP_BLACK_CHASSIS` must now read `#0a1a3a`/`#132a4a`. | The `isNavy` predicate (L394) tests only `MSP_BLACK_CHASSIS`; it cannot see whether the yellow shell changed. | Owner ruling (c): must assert the shell **did** change to dark blue. |
| `scripts/verify-jg032-station2-thermal.mjs:404` | `if (m.name === 'MSP_YELLOW_PAINT' && m.color !== '#ffc500') fail(\`yellow paint touched…\`)` | Hard FAIL if any yellow mesh moved off `#ffc500`. | **The single load-bearing "yellow unchanged" gate.** Directly inverted by owner ruling (c) / issues doc §4 row 3. | Must become an assertion that `MSP_YELLOW_PAINT` shell meshes changed to the approved dark blue. |
| `scripts/verify-jg032-station2-thermal.mjs:408` | `pass('MSP_YELLOW_PAINT (#ffc500) and MSP_AIRWAY_VOLUME (#59c4f9) unchanged everywhere')` | Emits PASS on the yellow-unchanged condition. | Same inversion; this is the line that printed PASS while the owner-visible defect shipped. | PASS text must report the shell recolor census, not its absence. |
| `scripts/verify-jg032-station2-thermal.mjs:462` | `if (!near(g65.panelY, 0.55) \|\| !near(g65.panelOpacity, 0.18)) fail(…)` | At p=0.65 the `COMPOSITE_PANELS` root must sit at y = 0.55 m. | Owner ruling (b): panel-lift rejected. Already stale against `d201ea8` — no `position.y` write exists at HEAD. | Assert the clipping-plane cross-section is open at the hold instead. |
| `scripts/verify-jg032-station2-thermal.mjs:463` | `pass('panel choreography live: 0.35 assembled (0.575) → y 0.55 / 0.18 hold (0.65)')` | PASS text names the lift ("y 0.55") as the live choreography. | Same — the lift is retired. | PASS text must describe the section sweep. |

### A.2 — `src/scene/stages/recolorAllowList.ts` (8 rows)

| File:line | Assertion (short quote) | What it currently requires | Why it is now wrong | Replacement requirement per the plan |
|---|---|---|---|---|
| `src/scene/stages/recolorAllowList.ts:9-13` | `"every / MSP_YELLOW_PAINT mesh is protected by material gate AND absence / from the allow-list."` | Module contract: double protection for every yellow mesh. | Issues doc §4 row 1 supersedes "Never touch MSP_YELLOW_PAINT meshes". | Doc block must state the yellow shell is the primary recolor target. |
| `src/scene/stages/recolorAllowList.ts:57` | `"…every yellow SIF/PEM/EMG member are deliberately excluded."` | Yellow structural members excluded from the chassis allow-list by design. | Issues doc §1.1: "the yellow shell itself (wall sheets, SIF/PEM/EMG members) must go dark blue". | SIF/PEM/EMG members must be allow-listed. |
| `src/scene/stages/recolorAllowList.ts:59-66` | `const CHASSIS_STRUCTURE_ALLOW_LIST: readonly RegExp[] = [ … ]` | Six regexes, all baked-black frame stock; no yellow member matches. | The set encodes "these are the only recolorable chassis parts" — now incomplete. | Must gain the yellow SIF/PEM/EMG member patterns. |
| `src/scene/stages/recolorAllowList.ts:72-73` | `"The large yellow G2C07-0085 / G2RL300-SAF-1xxx wall sheets … are deliberately excluded."` | The dominant yellow wall sheets are excluded from the panel allow-list. | These are exactly the meshes that made the enclosure "read as a bright yellow box" (§1.1). | Wall sheets must be allow-listed as the primary shell recolor. |
| `src/scene/stages/recolorAllowList.ts:75-80` | `const PANEL_ALLOW_LIST: readonly RegExp[] = [ … ]` | Four regexes covering only baked-black composite sheets. | Same — set is incomplete against the ruling. | Must gain `G2C07-0085` / `G2RL300-SAF-1xxx`. |
| `src/scene/stages/recolorAllowList.ts:83-88` | `const RECOLORABLE_MATERIAL = 'MSP_BLACK_CHASSIS'` | Recolor lands only on baked-black stock; "Everything else is protected by name: yellow paint (failure band 2)…". | A single-material gate structurally cannot repaint a `MSP_YELLOW_PAINT` mesh. | Gate must admit `MSP_YELLOW_PAINT` while still excluding rubber/stainless/airway. |
| `src/scene/stages/recolorAllowList.ts:93-94` | `"…cannot repaint a / yellow or rubber mesh that happens to share a name fragment."` | States the yellow-safety property as a design guarantee. | The yellow half of the guarantee is withdrawn; the rubber half survives. | Doc must narrow the guarantee to rubber/hardware/airway. |
| `src/scene/stages/recolorAllowList.ts:97` | `if (materialName !== RECOLORABLE_MATERIAL) return null` | The executable line that returns `null` for every yellow mesh. | **The single load-bearing runtime exclusion.** Owner ruling (a). | Must branch on a shell-material set, not one constant. |

### A.3 — `src/scene/stages/recolorAllowList.test.ts` (10 rows)

| File:line | Assertion (short quote) | What it currently requires | Why it is now wrong | Replacement requirement per the plan |
|---|---|---|---|---|
| `src/scene/stages/recolorAllowList.test.ts:11` | `"bands (1) black/rubber→grey bleed and (2) yellow→saturated-wall repaint;"` | Doc claim that the yellow guard is one of the two primary regression guards. | Band (2) is superseded; band (1) survives. | Doc must retain band (1) only and cite the blue-shell requirement. |
| `src/scene/stages/recolorAllowList.test.ts:53` | `it('rejects every MSP_YELLOW_PAINT mesh, including the G2RL300-SAF-1003-2 intake grille', …)` | Whole test case asserts blanket yellow rejection. | Issues doc §4 row 1 explicitly names "(incl. intake grille protection)" as superseded. | Replace with a case asserting shell yellows resolve to the dark-blue spec. |
| `src/scene/stages/recolorAllowList.test.ts:55` | `expect(recolorSpecFor('G2RL300-SAF-1003-2', 'MSP_YELLOW_PAINT')).toBeNull()` | The +Z intake grille must never recolor. | Grille protection explicitly superseded. Its AABB (not its material) drives the aperture lattice, so recoloring it is geometrically safe. | Must assert the grille takes the approved shell finish. |
| `src/scene/stages/recolorAllowList.test.ts:57` | `expect(recolorSpecFor('G2C07-0085-3', 'MSP_YELLOW_PAINT')).toBeNull()` | Big yellow composite wall sheet must not recolor. | Primary recolor target per §1.1. | Must assert `PANEL_RECOLOR`-equivalent dark blue. |
| `src/scene/stages/recolorAllowList.test.ts:58` | `expect(recolorSpecFor('G2RL300-SAF-1001-1', 'MSP_YELLOW_PAINT')).toBeNull()` | Yellow `G2RL300-SAF-1xxx` wall sheet must not recolor. | Same. | Same. |
| `src/scene/stages/recolorAllowList.test.ts:59` | `expect(recolorSpecFor('MirrorG2RL300-SAF-2002-1', 'MSP_YELLOW_PAINT')).toBeNull()` | Mirrored yellow wall sheet must not recolor. | Same. | Same. |
| `src/scene/stages/recolorAllowList.test.ts:61` | `expect(recolorSpecFor('RL300-PEM-1001-1', 'MSP_YELLOW_PAINT')).toBeNull()` | Yellow PEM chassis member must not recolor. | §1.1 names SIF/PEM/EMG members as must-go-dark-blue. | Must assert `CHASSIS_RECOLOR`-equivalent dark blue. |
| `src/scene/stages/recolorAllowList.test.ts:62` | `expect(recolorSpecFor('RL300-SIF-1008-1', 'MSP_YELLOW_PAINT')).toBeNull()` | Yellow SIF chassis member must not recolor. | Same. | Same. |
| `src/scene/stages/recolorAllowList.test.ts:63-64` | `// Even an allow-listed NAME with a yellow material is rejected (material gate)` + `expect(recolorSpecFor('V2RL300-FPL-0001-1', 'MSP_YELLOW_PAINT')).toBeNull()` | Asserts the material gate overrides an allow-listed name. | The material gate itself is being inverted (row A.2/`:97`). | Must assert the new shell-material set is honoured. |
| `src/scene/stages/recolorAllowList.test.ts:83` | `expect(recolorSpecFor('G2RL200-SAF-1004-2', 'MSP_YELLOW_PAINT')).toBeNull()` | A yellow duct-adjacent sheet must not recolor. Sits inside the `'rejects the translucent airway volume and both ducts'` case, mixing a yellow-protection assertion into an airway test. | It is a `MSP_YELLOW_PAINT` shell sheet, so it falls under owner ruling (a). | Must be separated from the airway case and reclassified as shell. |

### A.4 — `src/scene/stages/Station2_AcousticEnclosure.tsx` (1 row)

| File:line | Assertion (short quote) | What it currently requires | Why it is now wrong | Replacement requirement per the plan |
|---|---|---|---|---|
| `src/scene/stages/Station2_AcousticEnclosure.tsx:145-147` | `"(2) no MSP_YELLOW_PAINT mesh is ever repainted — the intake grille / G2RL300-SAF-1003-2 stays canary…"` | Component-level restatement of the yellow protection as a binding JG-021 constraint. | Owner ruling (a) / issues doc §4 row 1. | Doc must record the ruling that supersedes it and the blue-shell scope. |

### A.5 — `src/scene/stages/AirflowField.tsx` (1 row)

| File:line | Assertion (short quote) | What it currently requires | Why it is now wrong | Replacement requirement per the plan |
|---|---|---|---|---|
| `src/scene/stages/AirflowField.tsx:329` | `/** Internals window during the panel-lift hold (Station-2 choreography). */` | Documents `INTERNALS_WINDOW` as being scoped to the panel-lift hold. | Owner ruling (b): the lift is retired (`d201ea8`); the hold is now the cross-section hold. The **value** `[0.61, 0.7]` is still live — only the stated justification is obsolete. | Comment must name the cross-section hold. Value handling is deferred (row C.24). |

---

## Section B — Assertions that MUST be preserved

**58 rows.** These are the protected-JGUN gates and unrelated checks the plan
explicitly forbids deleting ("Do not delete unrelated checks", plan line 150).

### B.1 — `scripts/verify-jg032-station2-thermal.mjs` (11 rows)

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:21-22` | `"5. JGUN gates: spot 1.4@y1.3 / rim 0.8 / shadow visible at p=0.50; / spot 1.1@y1.2 / rim 0 / shadow hidden at p=0.85 (CH.04 inert)."` | Header contract for JGUN inertness; the plan requires CH.04 mechanical state unchanged. |
| `:23-24` | `"6. CH.04 telemetry byte-identical to baseline at p=0.80/0.90…"` | Header contract for the byte-identity gate named in the brief as protected. |
| `:58` | `const CH04_EXCLUDE = ['rig.stageRot', 'rig.planetRot', 'performance']` | Defines the exclusion set that makes the byte-compare meaningful; deleting it makes the gate vacuous or permanently red. |
| `:290-309` | `deepDiff(…)` with `Math.round(a * 1e4) !== Math.round(b * 1e4)` | The 1e-4 quantization is the documented tolerance that separates damped-camera residue from real regressions (JG-028 control pair). |
| `:412-416` | `fail(\`CH.04 telemetry differs at ${stop}…\`)` / `pass('CH.04 telemetry byte-identical at …')` | **The CH.04 telemetry byte-identity gate** named in the brief as protected. Plan line 148 requires the same mechanical state at the same authored progress values. |
| `:473-474` | `pass('p=0.50: spot 1.4 @ y 1.3 (nudge active)')` | JGUN studio-spot nudge inside the explode hold; a JGUN visual gate, unrelated to RL300. |
| `:475-476` | `pass('p=0.47: micro-rim 0.8 inside LCD_REVEAL_WINDOW')` | **LCD cluster gate** — named in the brief as protected. |
| `:477-478` | `pass('p=0.50: secondary explode shadow visible')` | JGUN explode-hold visual gate. |
| `:479-481` | `pass('p=0.85 CH.04: spot resting 1.1 @ y 1.2, rim 0, shadow hidden — inert')` | **JGUN visual-gate inertness at CH.04** — the global-canvas safety property. |
| `:485-486` | `pass('reduced-motion tier mounts clean, 0 errors')` | Plan line 154 requires reduced-motion composed stills; this is the existing resilience check. |
| `:494-496` | `pass('0 console errors, 0 uncaught page errors')` | Unrelated correctness check; deleting it hides regressions of every kind. |

### B.2 — `src/scene/stages/airflowRoute.test.ts` (12 rows) — airflow route geometry, not tied to panel lift

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:29-36` | `it('lands the intake leg entry/exit planes on the expected z values', …)` | Pure derivation: `entryZ = box.max.z`, `exitZ = box.min.z`. Asset-independent function behavior. |
| `:38-46` | `it('constrains the plenum leg to the measured x/y bands', …)` | Pure derivation of min/max/center from the input box. |
| `:48-53` | `it('falls back to the legacy arc on a null airway instead of collapsing to the origin', …)` | Guards against a fabricated route through (0,0,0) — a real defect class, unrelated to the ruling. |
| `:55-66` | `it('rejects degenerate boxes (inverted or zero-volume)', …)` | Input-validation guard; unrelated. |
| `:70-99` | `it('matches the spec at representative route t values', …)` | Cool→hot ramp stops. Plan line 146 still requires "airflow direction and warming are apparent". |
| `:101-108` | `it('progresses from cool-dominant to hot-dominant across the route', …)` | The heat-transfer story the owner explicitly asked to keep (issues doc §3 item 4). |
| `:110-113` | `it('clamps outside [0, 1]', …)` | Numerical-safety guard; unrelated. |
| `:117-120` | `expect(ACOUSTIC_RING_COUNT).toBe(6)` / `expect(THERMAL_SHELL_COUNT).toBe(5)` | Owner-ruled counts (2026-09-08). Not touched by the 2026-09-09 ruling. |
| `:122-129` | `it('spans the ruled 0.25–0.65 m shell band with one radius per shell', …)` | Owner-ruled shell band; drift guard. |
| `:131-136` | `it('ramps shell colors #fbbf24 → #f97316 → #ea580c across the pool', …)` | Owner-ruled thermal ramp. |
| `:138-142` | `it('keeps thermal shells inside the restrained 0.06–0.10 additive opacity band', …)` | Restraint guard against the "simulated engineering data" risk (plan line 165). |
| `:145-153` | `it('uses a rectangular slot array derived from the grille AABB', …)` | Verified geometry (ray-grid probe, no hex). Survives the grille recolor because the lattice is AABB-driven, never material-driven. |

### B.3 — `src/scene/jgunVisualGates.test.ts` (9 rows) — JGUN visual gate inertness

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:15` | `const CH04_PROGRESS = [0.72, 0.76, 0.8, 0.9, 0.97, 1.0]` | Defines the CH.04 sample set every inertness assertion iterates; deleting it removes the gate. |
| `:18-22` | `it('is zero at every CH.04 progress value', …)` (`explodeHoldGate`) | Global-canvas inertness: JGUN additions must be provably zero in CH.04. |
| `:24-35` | `it('is full inside the explode hold and zero before the window', …)` | JGUN explode-hold window shape + smooth edges. |
| `:39-43` | `it('peaks at 0.12 × explodeFactor inside the window', …)` | Explode shadow magnitude; JGUN visual. |
| `:45-49` | `it('returns zero at CH.04 progress values even with explodeFactor = 1', …)` | Inertness guard. |
| `:53-57` | `it('adds +0.3 intensity / +0.1 Y at full gate', …)` | Studio-spot nudge magnitude; JGUN visual. |
| `:59-64` | `it('is exactly zero at CH.04 progress values (resting values unchanged)', …)` | Inertness guard. |
| `:68-77` | `it('is active only inside LCD_REVEAL_WINDOW (0.420–0.525)', …)` | **LCD cluster window** — named in the brief as protected. |
| `:79-83` | `it('is zero at CH.04 progress values', …)` (`lcdMicroRimIntensity`) | Inertness guard. |

### B.4 — `src/scene/rig/gearRotation.test.ts` (5 rows) — gear rotation ratios

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:10-18` | `it('defines 5 reduction stages with exact JG-031 physical driveline display turns', …)` | **Gear rotation ratios** — named in the brief as protected; plan line 148 forbids changed kinematics. |
| `:20-29` | `it('enforces strictly monotonic reduction along the physical driveline from motor to snout', …)` | Physical correctness of the driveline. |
| `:31-45` | `it('maintains a consistent ~65% speed ratio (0.64 - 0.66) between consecutive physical stages', …)` | Ratio drift guard. |
| `:47-49` | `expect(GEAR_RATIOS.planetMultiplier).toBe(3.5)` | Planet counter-rotation multiplier; JGUN kinematics. |
| `:51-54` | `it('ensures the slowest physical stage (stage4 at snout) completes > 1.0 turn for clear visual motion', …)` | Visual-legibility floor for the JGUN gear motion. |

### B.5 — `src/scene/drawing/introTimeline.test.ts` (10 rows) — drawing intro timing

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:15-19` | `it('gives the intro its scroll share and leaves the downstream axis linear', …)` | **Drawing intro timing** — named in the brief as protected. |
| `:21-28` | `it('keeps every downstream progress span proportional to its raw scroll span', …)` | Downstream linearity is what stops the intro from retiming JGUN. (Also flagged as row C.23 for a scope question that does not weaken the preserve requirement.) |
| `:30-37` | `it('is monotonic across the handoff blend', …)` | Monotonicity guard; a scroll-extension bug class. |
| `:39-43` | `it('round-trips through the inverse used by deep links and capture', …)` | Plan line 154 requires direct navigation and reload-at-depth to work. |
| `:47-54` | `it('completes the focus rack before the pulse starts', …)` | Intro phase ordering. |
| `:56-63` | `it('reserves the onboarding window with no other authored channel in it', …)` | Onboarding window exclusivity. |
| `:65-71` | `it('holds the print opaque until the shockwave has crossed the sheet', …)` | Intro reveal ordering; `opaque` here is the paper sheet, unrelated to panel opacity. |
| `:73-79` | `it('runs the shockwave exactly once, after the solved separation', …)` | Once-only guard. |
| `:81-88` | `it('reparameterizes pose time without moving the pose axis itself', …)` | Pose-axis invariance under reparameterization. |
| `:92-105` | `it('maps every retained CH.01 cue after the intro without changing its relative order', …)` | Plan line 109 explicitly says "Do not apply the drawing intro remapper downstream" — this test is the authority on the remapper's saturation point. |

### B.6 — `src/scene/drawing/paperGrain.test.ts` (4 rows)

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:11-17` | `it('is deterministic for a fixed seed (intro frames reproducible)', …)` | Deterministic intro frames are what makes screenshot comparison usable (plan line 148: "deterministic phases where needed"). |
| `:19-25` | `it('changes with the seed', …)` | Proves the seed is actually wired; unrelated to RL300. |
| `:27-38` | `it('is unbiased (mean near mid-grey) and fully opaque', …)` | Statistical guard on the grain texture; unrelated. |
| `:40-43` | `it('guards the owner-approved 0.06 mix against drift', …)` | Owner-approved value, unrelated to the 2026-09-09 ruling. |

### B.7 — `src/scene/stages/recolorAllowList.test.ts` (6 rows) — the surviving negative cases

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:44-49` | `it('stays below the documented milky-grey failure band (draft: metalness 0.78 / env 1.05)', …)` | JG-021 failure band (3) is untouched by the ruling and directly mirrors the plan's risk "Blue paint loses detail in a dark studio" (line 161). |
| `:67-72` | `it('rejects PUMP_HOUSING children — the heat source keeps its orange/steel identity', …)` | Issues doc §1.1 explicitly preserves this: "pump stays orange/steel so it reads as the heat source". |
| `:74-78` | `it('rejects ISOLATION_MOUNTS — dark rubber stays untouched (failure band 1)', …)` | JG-021 failure band (1); plan line 146 requires "material identities survive lighting". |
| `:82` | `expect(recolorSpecFor('EXHAUST_PIPE-1', 'MSP_STAINLESS')).toBeNull()` | Stainless hardware identity; unrelated to the shell ruling. |
| `:86-93` | `it('rejects hardware and latch parts regardless of material', …)` | Issues doc §4 row 1 keeps "identity finishes (pump orange/steel, hardware)". |
| `:95-99` | `it('rejects unknown part numbers even on the recolorable material', …)` | Fail-closed default for unknown/empty inputs; a correctness guard independent of which colors are allowed. |

### B.8 — `src/scene/stages/airflowRoute.ts` (1 row)

| File:line | Assertion | Why it must survive |
|---|---|---|
| `:14-15` | `"…intake grille on the +Z face. Its AABB (never its / material) drives the aperture slot lattice."` | This invariant is the reason recoloring the grille (`recolorAllowList.test.ts:55`, Section A.3) is geometrically safe. It must remain true and documented, or the aperture lattice becomes coupled to the recolor. |

---

## Section C — Ambiguous / needs a judgment call

**24 rows. NOT resolved here — another agent owns each decision.**

### C.1 — `scripts/verify-jg032-station2-thermal.mjs` (9 rows)

| # | File:line | Assertion | The precise ambiguity |
|---|---|---|---|
| C.1 | `:19-20`, `:461` | `"4. Panels translucent restored: opacity 0.35 assembled (p=0.575) → 0.18"` / `if (!near(g575.panelOpacity, 0.35)) fail(…)` | Panel **translucency** is a different mechanism from the panel **lift**. The owner rejected the lift (§1.3) but §1.2 asks only that "the inside of the enclosure must be clearly readable". The plan's "properly capped cross-section" may make translucency redundant, keep it as a supporting effect, or change the values. Source alone cannot say whether 0.35/0.18 is obsolete or preserved. |
| C.2 | `:334-337`, `:341-346`, `:356-358` | `// The PANELS_OPAQUE flip (commit 3/3) is an intended delta…` + `FLIP_FIELDS` + `flipOnly` classifier | This census branch exists solely to legalize the `transparent/opacity/depthWrite` flip on `COMPOSITE_PANELS`. Whether that flip survives depends entirely on C.1's resolution. |
| C.3 | `:405`, `:408` | `if (m.name === 'MSP_AIRWAY_VOLUME' && m.color !== '#59c4f9') fail(…)` | The owner ruling names only yellow. But the plan proposes a redesigned lower intake and custom duct (lines 136, 138), which may replace or re-author the airway volume. Unclear whether this is a preserved protection or a stale asset-bound check. |
| C.4 | `:419-437` | `pass(\`uAirwayMin/uAirwayMax = measured AABB…\`)`, `12,000 particles (full tier)`, `GLSL heatRamp carries all 6 cool→hot spec stops` | These bind to the **current** `msp-enclosure.glb` AABB (x ±0.6, y 1.2–1.855, z 0.431–1.3) and the +Z-only intake plenum. The plan proposes a *new lower intake* and an *under-engine outlet* on an *RL300 derivative asset*. Cannot tell from source whether to keep, re-baseline, or retire. |
| C.5 | `:439-452` | `pass('acoustic pool: 6 rings, #00e5ff (unchanged behavior)')` / `pass('thermal pool: 5 nested shells…')` | Owner-ruled counts from 2026-09-08, but the plan re-authors flow/heat/acoustic as "two cooling supplies sharing an exit" (line 170). Unclear whether the 6/5 split is carried forward. |
| C.6 | `:487-488` | `if (current.liteTier.particleCount !== 3600) fail(…)` | Plan line 152 sets *new* lite-tier budgets (90 draw calls, 250k triangles) but does not state a particle count. |
| C.7 | `:490-492` | `if (current.perf.p95 > 17.5) console.warn(…)` | Plan line 152 sets 60 fps desktop / 30 fps phone with frame-time percentiles on named devices. Whether the 17.5 ms warn threshold is superseded or retained as a desktop floor is undetermined. |
| C.8 | `:54-55` | `const STOPS = [0.05, 0.35, 0.47, 0.5, 0.575, 0.65, 0.74, 0.85, 0.9]` / `SHOT_STOPS` | Plan line 109 mandates "unrestricted documented scroll extension" with RL300-local progress separated from JGUN progress. Whether these global-progress stops remain valid addresses, or must be re-expressed in a new progress space, is not resolvable from this file. Note: the JGUN stops (0.47, 0.5, 0.85, 0.9) back Section B rows, so this is not a free deletion. |
| C.9 | `:47` | `const ROOTS = ['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'PUMP_HOUSING', … ]` | Census scope is the 7 current GLB roots. The plan's RL300 derivative asset may not carry these names. Changing this changes what "zero unexpected deltas" even means. |

### C.2 — `scripts/check-station2-contract.mjs` (5 rows)

> **Explicit statement:** this file contains **zero** Section A debt. It has no yellow
> assertion, no panel-lift assertion, and no census gate. Every row below is ambiguous
> for a different reason — module relocation, not the owner ruling.

| # | File:line | Assertion | The precise ambiguity |
|---|---|---|---|
| C.10 | `:4`, `:26`, `:28` | `const componentPath = new URL('../src/scene/stages/Station2_AcousticEnclosure.tsx', …)` + `if (!component.includes("'/models/msp-enclosure.glb'")) throw …` | The contract string-matches a hardcoded component file. Plan line 123 says new `src/scene/rl300/` modules "replace the enclosure path in `src/scene/stages/Station2_AcousticEnclosure.tsx`". Whether the file is edited, redirected, or deleted is undetermined; the check breaks either way. |
| C.11 | `:7-15`, `:27-30` | `const requiredNodes = ['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', … ]` + `GLB binary does not contain node name` | Same node-name coupling as C.9, plus a byte-level assertion against the **current** GLB. A derivative asset invalidates it; but plan line 150 still requires `npm run check:station2` to run and pass. |
| C.12 | `:40-53` | `const expectedAnchors = ['enclosureChassis', 'compositePanels', … ]` | `STATION2_CAD_ANCHORS` is listed in plan line 126 as a "compatibility timing and stage bounds" surface to inspect before changes — inspection, not a stated outcome. |
| C.13 | `:55-60` | `if (!spatialWorld.includes('<AcousticBaffleField />')) throw …` / `'<AirflowField />'` | Plan line 124 lists both as "existing effects and role mapping **to migrate**". Migration could preserve the mount names, rename them, or fold them into an RL300 module. |
| C.14 | `:3`, `:25` | `const assetPath = new URL('../public/models/msp-enclosure.glb', …)` + `if (asset.length === 0) throw …` | Plan line 128 names "RL300 derivative assets" with a source/export manifest. Whether `msp-enclosure.glb` remains the contract asset is undetermined. |

### C.3 — `src/scene/stages/recolorAllowList.ts` (2 rows)

| # | File:line | Assertion | The precise ambiguity |
|---|---|---|---|
| C.15 | `:34-40`, `:43-49` | `CHASSIS_RECOLOR = { color: '#0a1a3a', roughness: 0.42, metalness: 0.5, envMapIntensity: 0.75 }` / `PANEL_RECOLOR = { color: '#132a4a', … }` | The ruling requires "dark blue" but does not ratify *these* hexes or this finish matrix. Plan line 146 says "the dominant shell is unmistakably dark blue" and line 161 flags "Blue paint loses detail in a dark studio" as an unresolved risk. Whether these two matrices carry forward, get re-tuned, or are replaced by an RL300 material system is an open art-direction call. |
| C.16 | `:25-31` | `export interface RecolorSpec { bucket: 'chassis' \| 'panels'; … }` | The two-bucket model was derived from the baked-black chassis/panel split. With the yellow shell in scope, whether the shell is a third bucket, folded into `panels`, or the interface is replaced by an RL300 material system is undetermined. |

### C.4 — `src/scene/stages/recolorAllowList.test.ts` (2 rows)

| # | File:line | Assertion | The precise ambiguity |
|---|---|---|---|
| C.17 | `:15-43` | `it('recolors the chassis frame plates with the chassis matrix', …)` and `it('recolors the composite panel sheets with the panel matrix', …)` | These assert the exact hexes and matrix values from C.15. Not obsolete under the ruling (the parts stay recolored) but their asserted values ride on an unratified art-direction decision. |
| C.18 | `:81` | `expect(recolorSpecFor('DUCT_INTAKE_AIRWAY', 'MSP_AIRWAY_VOLUME')).toBeNull()` | Same question as C.3, at the unit level: is the translucent airway volume a preserved identity finish, or is it replaced by the plan's new intake/duct design? |

### C.5 — `src/scene/stages/Station2_AcousticEnclosure.tsx` (4 rows)

| # | File:line | Assertion | The precise ambiguity |
|---|---|---|---|
| C.19 | `:157-163` | `"The one intentional mutation from JG-021 that survives: COMPOSITE_PANELS / translucency…"` + `PANEL_OPACITY_ASSEMBLED = 0.35` / `PANEL_OPACITY_REVEALED = 0.18` | Same as C.1, at source. This is an owner-confirmed JG-021 decision ("the acoustic walls are meant to be mostly transparent") that the 2026-09-09 ruling neither confirms nor revokes. |
| C.20 | `:166-181` | `const PANELS_OPAQUE = false` | The revert switch for C.19. Its comment at `:170-171` already says "The cutaway is now driven by the cross-section clipping plane (JG-032 rev2), not a lift" — so the const is correctly documented but its *purpose* (a glow-regression escape hatch) may or may not survive the RL300 rendering rework (plan line 113). |
| C.21 | `:190-196`, `:351-356` | `"Choreography (same windows as the retired lift, timing preserved): / p ≤ 0.585 closed … p ≥ 0.715 closed"` | These windows were inherited verbatim from the lift. The ruling approved *a* cross-section, not *these timings*; plan lines 137 and 107 re-author the sequence into seven shots with RL300-local progress. Whether the windows are preserved seam anchors or provisional is undetermined. |
| C.22 | `:202-206` | `const CUT_PLANE = new Plane(new Vector3(-1, 0, 0), CUT_CLOSED_X)` / `CUT_ROOTS = new Set(['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS'])` | This is the owner-requested clipping-plane cross-section (`d201ea8`), so it is **not** Section A debt. But plan line 146 requires "the moving cut has finished edges" and line 170 a "properly capped cross-section" — this implementation has no caps, and line 160 flags cap reliability as an unresolved prototype risk. Whether the existing plane survives as the mechanism or is replaced by a capped section group is undetermined. |

### C.6 — `src/scene/drawing/introTimeline.test.ts` (1 row)

| # | File:line | Assertion | The precise ambiguity |
|---|---|---|---|
| C.23 | `:21-28` | `expect(a).toBeCloseTo((0.1 * (1 - DRAWING_INTRO_WINDOW.releaseEnd)) / (1 - INTRO_SCROLL_SHARE), 12)` | The assertion is that the downstream progress axis is exactly linear in raw scroll with a fixed slope. Plan line 109 adds an RL300-local progress layer plus a compatibility mapping, and warns that raw `scrollY / totalScrollableHeight` "must not silently become the input that retimes JGUN". The pure function is unaffected, but whether `pacedProgress` remains **the** narrative-progress authority (so this stays the shipped axis) or becomes one stage in a composed mapping (so this test no longer describes the shipped axis) is not determinable from this file. Listed in Section B as preserve-by-default; the scope question is the open item. |

### C.7 — `src/scene/stages/AirflowField.tsx` (1 row)

| # | File:line | Assertion | The precise ambiguity |
|---|---|---|---|
| C.24 | `:330` | `const INTERNALS_WINDOW: readonly [number, number] = [0.61, 0.7]` | The value currently coincides with the cross-section hold (`[0.645, 0.700]` open, internals `[0.610, 0.700]`). If C.21 retimes the section windows, this constant must move with them; if the windows are preserved seam anchors, it stays. The stale *comment* on line 329 is Section A (row A.5); the *value* is this open question. |

---

## Section D — Blast radius summary

| File | Obsolete (A) | Preserved (B) | Ambiguous (C) | Verdict |
|---|---:|---:|---:|---|
| `scripts/verify-jg032-station2-thermal.mjs` | 10 | 11 | 9 | **Rewrite of the census + panel sections.** Steps 3 and 4 (lines 327–464) must be re-authored around a blue-shell assertion; Steps 5 and 6 (lines 410–482) must be lifted out intact. The file is the single highest-debt artifact in the repo. |
| `src/scene/stages/recolorAllowList.ts` | 8 | 0 | 2 | **Rewrite.** The material gate (`:88`, `:97`) and both allow-lists (`:59-66`, `:75-80`) are the mechanism that produced the owner FAIL; every doc block cites the superseded constraint. Nothing in the file is a Section B preserve. |
| `src/scene/stages/recolorAllowList.test.ts` | 10 | 6 | 2 | **Edits — surgical, high count.** The whole `MSP_YELLOW_PAINT` rejection case (`:53-65`) inverts; the pump / mounts / hardware / unknown-part cases (`:67-99`) must be carried forward verbatim. Highest preserve-vs-delete mixing density of any file. |
| `scripts/check-station2-contract.mjs` | **0** | 0 | 5 | **No change required by the owner ruling.** Contains no yellow, no panel-lift, and no census assertion. Every row is ambiguous only because the plan relocates the enclosure module and asset. Do not edit it as part of the debt clearance. |
| `src/scene/stages/airflowRoute.test.ts` | **0** | 12 | 0 | **No change.** Contains none of this debt. Entirely pure-function route derivation and owner-ruled thermal constants. The grille assertion (`:145-153`) is AABB-driven and survives the grille recolor unchanged. |
| `src/scene/jgunVisualGates.test.ts` | **0** | 9 | 0 | **No change.** Contains none of this debt. Protected JGUN gate file — CH.04 inertness and LCD cluster. |
| `src/scene/rig/gearRotation.test.ts` | **0** | 5 | 0 | **No change.** Contains none of this debt. Protected JGUN kinematics. |
| `src/scene/drawing/introTimeline.test.ts` | **0** | 10 | 1 | **No change expected.** Contains none of this debt. One scope question (C.23) about whether it remains the narrative-progress authority under the scroll extension — that is a plan-side decision, not an edit to this file. |
| `src/scene/drawing/paperGrain.test.ts` | **0** | 4 | 0 | **No change.** Contains none of this debt at all — no yellow, no panel, no lift, no census, no allow-list. Listed here only to record that it was read in full. |
| `src/scene/stages/Station2_AcousticEnclosure.tsx` | 1 | 0 | 4 | **Edits (doc block) now; superseded later.** Only the yellow-protection doc (`:145-147`) is hard debt — the lift was already removed in `d201ea8`. Plan line 123 replaces the enclosure path here entirely, so the four C rows are relocation questions. |
| `src/scene/stages/AirflowField.tsx` | 1 | 0 | 1 | **Comment edit.** One stale "panel-lift hold" comment (`:329`); the constant beneath it (`:330`) is a retiming question. |
| `src/scene/stages/airflowRoute.ts` | **0** | 1 | 0 | **No change.** The `"Its AABB (never its material)"` invariant (`:14-15`) is precisely what makes the grille recolor safe; it must remain true. |
| **Totals** | **30** | **58** | **24** | |

### Cross-cutting notes

1. **One already-broken gate.** Rows A.9/A.10 (`verify-jg032-station2-thermal.mjs:462-463`)
   assert `panelY ≈ 0.55` at p=0.65. `d201ea8` removed the panel Y translation without
   updating the probe. The probe's last-touched commit is `57e2e2d`, one commit earlier.
   This is a live red gate at HEAD, independent of the plan.
2. **The census file is the whole census.** All 19 `census` hits in `scripts/` + `src/` are
   in one file. There is no second A/B gate to update.
3. **Obsolescence is concentrated, preservation is distributed.** 28 of 30 Section A rows
   sit in three files (`verify-jg032-station2-thermal.mjs`, `recolorAllowList.ts`,
   `recolorAllowList.test.ts`). 40 of 58 Section B rows sit in five files that need no
   edits at all. The protected-JGUN surface and the obsolete-RL300 surface barely overlap —
   the one file carrying both is `verify-jg032-station2-thermal.mjs`.
4. **`recolorAllowList.test.ts` is the only file requiring line-level discrimination.**
   Its two `describe` blocks are not cleanly separable: the "negative cases" block
   (`:52-100`) holds 10 obsolete rows and 5 preserved rows interleaved, including one
   yellow assertion (`:83`) misfiled inside the airway/duct test case.
