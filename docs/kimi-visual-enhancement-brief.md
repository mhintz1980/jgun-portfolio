# Kimi K3 Visual Enhancement Brief

> **Revision note (2026-09-08):** every claim below was verified against the repo at
> `main@0ddd8cd`. Corrections from that audit are marked **[CORRECTED]**; new
> requirements are marked **[ADDED]**. Where the original draft asserted something the
> code contradicts, the wrong version has been removed, not softened.

## Mission

Review and improve the first two **visual experiences** of this portfolio without changing the authored mechanical narrative:

1. **JGUN / high-precision industrial torque gun** — preserve the current sequence and core concepts; make only visual upgrades that improve clarity, polish, hierarchy, and perceived quality.
2. **RL300 / MSP SAFE enclosure** — replace the current presentation of airflow/particles with a striking engineering visualization of cooling airflow through the enclosure.

Do **not** modify the final M249 chapter. In the implementation, the chapter mapping is **CH.01–CH.02 = JGUN**, **CH.03 = RL300**, and **CH.04 = M249**. The user's "first two sections" refers to JGUN and RL300 experiences, not literal chapter numbers.

**[CORRECTED] Chapter index off-by-one trap.** The `label` strings are 1-based
(`CH.01 ASSEMBLY` … `CH.04 DIGITAL SYSTEMS`) but the numeric `chapter` field on each
case study is **0-based**: `gearbox → 1`, `safe-enclosure → 2`, `m249 → 3`. Code such as
`TorqueWrenchHero.tsx` gates on `chapter === 1` for the JGUN explode. Never mix the two.

## Session start — non-optional

**[ADDED]** `CLAUDE.md` requires reading `AGENTS.md` (repo operating rules) and `TODO.md`
(canonical task queue) **before any code change**. The hard rules that bite this task:

- **NEVER** re-run `gltfjsx --transform` on `public/models/msp-enclosure.glb`. Tested: it
  collapses the 7 named roots into 2 palette-joined meshes and no flag combination
  prevents it. Source of truth is `C:\Projects\CAD\RL300-SAFE\msp-enclosure-draco.glb`;
  all mesh reduction happens in Blender.
- **NEVER** regenerate `public/models/m249-transformed.glb`.
- **Verify with runtime telemetry, never vision alone** — vision confabulates on this dark
  scene. This is the repo's standing rule and it supersedes "look at the screenshot."
- **Restart the `:4173` preview server after EVERY rebuild** (stale server + rotated asset
  hashes → the canvas never mounts and you will misdiagnose it as a shader bug).
- `public/draco/` is present (`draco_decoder.js/.wasm`, `draco_wasm_wrapper.js`) and the
  loader points at `/draco/`. If Station 2 fails to load in a fresh worktree, check this
  first before touching shader code.

## [ADDED] Required workflow — this ships as a JG-XX task

This is not a freeform visual pass. It runs through the same discipline as every other
task in this repo (JG-026 … JG-031). **Work that arrives without these artifacts does not
get reviewed.**

Claim **`JG-032`** — verified free in both `TODO.md` and `project/work/INDEX.md`.

### Step 1 — Write the plan FIRST, in Markdown, before any code

Copy `project/work/templates/plan.md` to:

```
project/work/plans/JG-032-station2-thermal-visualization.md
```

Fill in every section the template defines — it is not optional scaffolding:

- **Scope and non-goals** — name the stable part numbers, measured values, and canonical
  files. Part numbers are the stable key per `AGENTS.md`; stage names are not.
- **Dependencies and Required Reading** — the table has a **Skills** row. Fill it (see
  Step 2).
- **Implementation Steps** — each step independently reviewable and traceable to a file
  or an acceptance condition.
- **Acceptance Criteria** — directly observable or testable; must state the **regression
  boundaries that stay unchanged** (CH.04, JGUN timing, the 7 GLB roots).
- **Verification Record** — leave the link unfilled until evidence actually exists. Do not
  mark the plan `verified` before the record.
- **Change Log** — dated rows with reasons.

Reference plans worth reading for tone and density before writing: `JG-031-internal-cage-rotation-tuning.md`
(short, tabular, "Required Proof" section) and `JG-028-handle-realism.md` (larger scope).

**Commit the plan before writing implementation code.** If the plan changes mid-flight,
amend it with a Change Log row rather than silently drifting.

### Step 2 — Choose the skills and schedule when each one is read

The plan's **Skills** row must name the specific `SKILL.md` files this work needs *and
the phase each is read in*. Kimi is not the ZCode harness, so resolve paths via
`project/context/agent-skills.md` and the per-phase rosters in
`project/context/session-phases.md`, then **read the named `SKILL.md` before working in
that skill's domain** — `AGENTS.md` requires this, it is not advisory.

Starting roster for this task (adjust in the plan if you find you need more or fewer, and
say why):

| Phase | Skill | Read it before |
|---|---|---|
| Station-2 scene-graph work | `cad-scene-graph-rigging` | Resolving `DUCT_INTAKE_AIRWAY`, traversing the clone, or writing the per-mesh part-number allow-list. It covers GLTF node-name sanitization and part-number role classification — the exact mechanism JG-029 proved broken when GLTFLoader uniquified multi-primitive names to `meshN_mesh_2`. Your allow-list will hit the same trap. |
| Airflow shader | `glsl-transition-shader-pipeline` | Editing `AirflowField.tsx` shader strings. It covers bounding-box uniform alignment and tier fallbacks — literally the `uAirwayMin`/`uAirwayMax` pattern. |
| Any `useFrame` change | `r3f-scroll-performance-guard` | Touching the `useFrame` in `AirflowField`, `AcousticBaffleField`, or `Station2_AcousticEnclosure`. Enforces zero-rerender state sharing, preallocated scratch, and the 60 FPS budget. |
| Every verification pass | `webgl-telemetry-verifier` | Writing the probe script and before each ruling. This is the mandated verification method — runtime telemetry, never vision alone. |
| Hover / callout behavior | `spatial-hotspot-a11y` | Only if the cutaway or recolor shifts hotspot projection or the callout anchors. |
| Pre-ship | `asset-and-bundle-hygiene` | Before the final `npm run build` — Draco decoder path, chunk splitting, deploy readiness. |
| Intro timing | `gsap-scrolltrigger` | Only if the drawing-grain work touches intro timing. It should not — if you find yourself here, stop and re-read the timing constraints. |

### Step 3 — Test everything you implement

Both layers are required. "It looked right in the preview" is not evidence in this repo.

**Unit tests (vitest).** Follow the existing pattern — `src/scene/rig/gearRotation.test.ts`
and `src/scene/drawing/introTimeline.test.ts`. Extract pure functions so they are testable
rather than burying logic in `useFrame`. At minimum:

- Airway box → route parameter derivation: given a known `Box3`, the intake leg's entry
  and exit planes land on the expected z values; a null airway falls back to the legacy
  arc instead of collapsing to the origin.
- Ring split: asserts `RING_COUNT === 6` acoustic and 5 thermal shells; guards the
  owner-ruled counts against future drift.
- Recolor allow-list predicate: **positive and negative cases both.** Explicitly assert
  that `MSP_YELLOW_PAINT` meshes, `G2RL300-SAF-1003-2`, `PUMP_HOUSING` children, and
  `ISOLATION_MOUNTS` are all rejected. These negatives are the regression guard against
  JG-021 failure bands (1) and (2) — they matter more than the positives.
- JGUN progress gates: each new light/shadow returns zero contribution outside its window,
  asserted at CH.04 progress values specifically.

**Runtime probe.** Add `scripts/verify-jg032-station2-thermal.mjs`, modeled on
`scripts/verify-jg031-gear-rotation.mjs` (and `verify-jg028-handle-realism.mjs` for the
material-census pattern). It must assert, against a fresh `:4173` preview:

- `uAirwayMin`/`uAirwayMax` resolved to the real AABB, not a degenerate box.
- Particle color ramp sampled at representative `t` values matches the cool→hot spec.
- Acoustic pool still 6 rings; thermal shells 5.
- **A/B material census** vs. the pre-change HEAD — the recolor's delta set must contain
  exactly the allow-listed meshes and nothing else. This is how JG-028/029/030 were
  signed off and it is the single most important gate here.
- Yellow grille, pump housing, isolation mounts, and `MSP_AIRWAY_VOLUME` unchanged.
- CH.04 telemetry byte-identical to baseline at the same progress stops.
- Zero console errors.

Wire the probe into the plan's **Required Proof** section by name, the way JG-027/028/031
do.

### Step 4 — Record evidence, then close

Copy `project/work/templates/verification.md` to
`project/work/evidence/JG-032-station2-thermal-verification.md` and fill the Evidence
table with **exact commands and measured outputs**, not prose claims. The template's
Required Project Checks are mandatory, including the `:4173` restart and the
telemetry-over-screenshots rule. Set `status:` to `draft` until evidence exists, then
`verified` / `failed` / `partial`.

Update `TODO.md` and `project/work/INDEX.md` with the JG-032 entry (plan + evidence links)
**in the same commit as the behavior change** — `AGENTS.md` requires hardcoded tables to
move with the code.

**Only the owner closes a task.** Machine gates green means "ready for ruling," not done.
`CLOSED VERIFIED` goes in only after an explicit owner visual approval, quoted in the
TODO entry the way JG-028/030/031 quote theirs.

## Repository facts to use instead of broad scanning

- `src/components/Chapters.tsx` — chapter DOM tracks and caption timing.
- `src/data/caseStudies.ts` — canonical narrative, JGUN sequencing, camera path, and authored reveal windows.
- `src/scene/TorqueWrenchHero.tsx` — JGUN assembly/explode/gear/LCD sequence. Treat as sequence-locked.
- `src/scene/SceneCanvas.tsx` — **global** canvas: `ContactShadows`, `StudioRig`, `LcdFillLight`. Renders for every station including CH.04.
- `src/scene/PostProcessingComposer.tsx` — **global** bloom / chromatic aberration / tone mapping. Off-limits (see below).
- `src/scene/drawing/introTimeline.ts` and `src/scene/drawing/DrawingLinework.tsx` — JGUN technical drawing intro and handoff.
- `src/scene/stages/Station2_AcousticEnclosure.tsx` — RL300 model, subassemblies, panel cutaway, hover/inspection behavior.
- `src/scene/stages/AirflowField.tsx` — existing GPU particle airflow field.
- `src/scene/stages/AcousticBaffleField.tsx` — existing acoustic wave/ring field.
- `src/scene/stages/stageWindows.ts` — RL300 CAD anchors, stage envelopes, transition windows.
- `src/scene/SpatialWorld.tsx` — Station-2 field mounting and station composition.
- `src/state/scrollStore.ts` — telemetry shape. Outside scope; see the telemetry note below.
- `scripts/check-station2-contract.mjs` — the Station-2 contract. Read it before editing mounts.
- `src/scene/stages/M249Stage.tsx` — protected boundary; do not edit.

## Non-negotiable timing and scope constraints

All values below were re-verified against source; they are correct as stated.

- Do not retime, reorder, rename, or remove the JGUN beats: ring shift → gear sweep/ghost → rear extraction → rear-LCD orbit.
- Preserve the JGUN drawing handoff at `p = 0.120` (`DRAWING_INTRO_WINDOW.releaseEnd`) and the LCD boundary ending at `p = 0.525` (`DRAWING_INTRO_WINDOW.heroEnd`, `LCD_REVEAL_WINDOW.end`, `wrenchOut[0]`).
- `LCD_REVEAL_WINDOW` is `0.420 → 0.525`.
- Preserve RL300 transition windows: `enclosureIn [0.525, 0.565]`, `enclosureOut [0.720, 0.760]`.
- Preserve the panel choreography exactly: assembled `≤0.585` → lift `0.585–0.645` (y 0 → 0.55 m) → hold `0.645–0.700` → restore `0.700–0.715` → assembled `≥0.715`. Internal subassemblies are visible only in `[0.610, 0.700]`.
- Preserve reduced-motion, lite-tier, poster, and no-allocation-in-`useFrame` behavior.
- Do not repaint GLB materials indiscriminately (see the material ruling below).

### [CORRECTED] Global surfaces that leak into CH.04

The original draft assigned `ContactShadows` to `TorqueWrenchHero.tsx`. It is actually at
`src/scene/SceneCanvas.tsx:265`, on the **shared** canvas:

```tsx
<ContactShadows position={[0, -0.16, 0]} opacity={0.4} scale={1.2} blur={2.4} far={0.4} />
```

`SceneCanvas.tsx` renders for **all three stations**. So the secondary shadow plane, the
`StudioRig` spot nudge, and the LCD micro-rim light are all CH.04-visible unless each one
is explicitly gated on scroll progress or chapter. **Every JGUN lighting change must carry
its own progress gate**, or it violates the CH.04 boundary rule.

`PostProcessingComposer.tsx` (bloom `luminanceThreshold: 0.6`, rest intensity 0.25) is
likewise global and is therefore **off-limits** under the same rule. If the Station-2 work
needs a different bloom response, solve it with material emissive values inside Station 2,
not by moving the shared threshold.

## RL300 target experience

The RL300 enclosure should read as a thermal-management cutaway / CFD-inspired diagnostic rather than decorative particles.

### [CORRECTED] Visual story — follow the CAD axes, not "front/rear"

The CAD anchors are authoritative and they contradict the original draft's rear-in /
front-out description:

- `ductIntake` = `[0.0, 1.158, 0.893]` — documented in `stageWindows.ts` as the **laminar
  inlet port, +Z**.
- `ductExhaust` = `[-0.101, 1.282, -1.225]` — the **attenuated outlet port, −Z**.
- The airway volume's bounding box confirms intake on **+Z**.

State the flow as **intake face (+Z) → exhaust face (−Z)**. Drop "rear panel" / "front
panel" language entirely; nobody has established which face reads as the front from the
CH.03 camera, and getting it backwards on a real product is worse than being neutral.

1. Cool air enters at the **+Z** intake face.
2. The flow passes through the custom intake plenum (`DUCT_INTAKE_AIRWAY`, see below).
3. Cool air wraps around the diesel engine / rotary lobe pump (`PUMP_HOUSING`), visibly picking up heat.
4. The heated stream travels the internal path past `ACOUSTIC_BAFFLES`.
5. The stream exits at the **−Z** exhaust face and the external hood carries the plume upward.

### [CORRECTED] `DUCT_INTAKE_AIRWAY` — what it actually is

The node exists, but three of the original draft's claims about it are wrong.

| Draft claim | Reality |
|---|---|
| "hidden object" | **Not hidden.** It is a child of `DUCT_INTAKE` (one of the 7 rendered roots) with material `MSP_AIRWAY_VOLUME` — translucent cyan, `baseColorFactor [0.10, 0.55, 0.95, 0.22]`, `alphaMode: BLEND`, doubleSided. `Station2_AcousticEnclosure.tsx` documents it: *"The loader already delivers MSP_AIRWAY_VOLUME as the CAD author baked it — translucent cyan at alpha 0.22 — so no code touches it."* |
| "sample ~32–64 points along the mesh centerline" | The mesh (`DUCT_INTAKE_AIRWAY_MESH`, mesh index 187) has **48 vertices, 1 primitive**. It is a coarse volume block, not a swept duct. There is no centerline to sample and no vertex ordering that yields a spline. |
| "the plenum's true bends" | There are no bends. World AABB: x `[-0.600, 0.600]`, y `[1.200, 1.855]`, z `[0.431, 1.300]`. It covers the **+Z intake plenum only** and does not reach the exhaust at z = −1.225. |

Also note: the GLB uses `KHR_draco_mesh_compression`. Positions only exist after
DRACOLoader decode. Runtime access
(`scene.getObjectByName('DUCT_INTAKE_AIRWAY').geometry.attributes.position`) is fine;
any offline/Node tooling must decode first.

**Corrected implementation instruction:**

- In `AirflowField.tsx` (not via a prop — see the contract warning below), resolve the
  airway once and compute `new Box3().setFromObject(airway)` in world space.
- Pass it as **two uniforms**, `uAirwayMin` / `uAirwayMax` (`Vector3` each). This is the
  whole geometry budget needed — no 64-point array, no `DataTexture`.
- Drive the `t < 0.45` leg of `route()` through that box: entry plane at `z ≈ +1.300`,
  exit plane at `z ≈ +0.431`, constrained to the `y [1.200, 1.855]` band and `x ±0.600`.
- Beyond `t = 0.45`, continue on the existing anchor-based route (`uPump` → `uBaffles` →
  `uExhaust`). The airway box authoritatively replaces the guessed **intake arc only**.
- Heat pickup localizes on distance to the **airway exit plane and `uPump`**, not to a
  centerline that does not exist.
- Fall back gracefully: if `getObjectByName` returns null (a future GLB re-export), keep
  the current guessed arc rather than producing a degenerate box at the origin.

**Sibling worth knowing:** `DUCT_INTAKE`'s other child, `G2RL300-SAF-1003-2`, is the
yellow-painted intake grille (`MSP_YELLOW_PAINT`) — the physical inlet face, and the exact
mesh the JG-021 round-2 repaint was rejected for tinting. Do not recolor it.

### [CORRECTED] Hex openings are unverified

Nothing in the GLB metadata or the repo confirms hexagonal perforations on either panel
face. The intake grille is a single painted mesh. **Inspect the panel geometry before
building a hex-lattice snap.** If hexes are not there, derive the aperture lattice from
the grille mesh's own AABB (a slot or rectangular array) instead. Inventing a hex pattern
on a real shipped product is a fidelity regression, not a polish win.

### Recommended implementation direction

- **Reuse the existing `AirflowField` draw call.** Keep the same `points` geometry and
  `ShaderMaterial` structure; replace only the `route()` logic in the vertex shader and
  the color ramp in the fragment shader. This preserves the performance contract: one
  draw call, `12000` particles full tier / `3600` lite, pointer deflection, additive
  blending. Existing uniforms: `uTime, uFlow, uAlpha, uSize, uDetail, uIntake, uPump,
  uBaffles, uExhaust, uMouse, uMouseActive`.
- **Route segments** (driven by the airway box + `STATION2_CAD_ANCHORS`):
  - **Intake aperture** (`t < 0.20`): spawn at the +Z face and snap to the verified
    aperture lattice. Color `#00e5ff`.
  - **Plenum transit** (`0.20 ≤ t < 0.45`): traverse the `uAirwayMin`/`uAirwayMax` box
    with mild turbulence. Color `#38bdf8` → `#7dd3fc`.
  - **Engine heat pickup** (`0.45 ≤ t < 0.75`): swirl around `uPump` with vorticity
    perturbation; a heat accumulator drives the ramp from cool teal through `#fbbf24` to
    `#f97316`.
  - **Exhaust** (`0.75 ≤ t < 1.0`): exit the −Z face, then thermal buoyancy with
    exponential spread. `#f97316` → `#ef4444`, fading to transparent.
- **Make the internal leg visibly interact with `ACOUSTIC_BAFFLES`** via the existing
  `uBaffles` uniform: particles within `0.25 m` deflect and lose velocity, producing
  readable streamlines that bend around the baffles instead of ghosting through.
- **Restrained CFD layer** — *Option A preferred (zero extra draw calls)*: add a `vHeat`
  varying, raise `gl_PointSize` slightly, and have the fragment shader draw a short
  velocity-oriented streak instead of a round point. *Option B*: a second `LineSegments`
  object (~200 lines, `transparent`, `opacity 0.15`, additive), mounted in `full` tier only.
- **Emphasize heat pickup locally**: a low-opacity (`0.08–0.12`) emissive additive
  wireframe clone of `PUMP_HOUSING` pulsing on `sin(uTime * 1.5)` in the `#f97316` range,
  mounted/unmounted with the `[0.610, 0.700]` internals window. No global orange wash.
- **Use the existing panel lift choreography** (`0.585–0.645` lift, `0.700–0.715`
  restore). Do **not** replace it with a clipping-plane sweep — the lift is owner-approved
  and avoids z-fighting with internal geometry.
- **Re-enabling translucent panels is gated.** `PANELS_OPAQUE = true` exists because of
  the JG-021 glow experiment; the comment documents the revert path to the owner-approved
  `0.35 / 0.18` treatment. Flipping it is legitimate **but must be a separate, isolated
  commit** verified for glow regressions before any other visual work lands on top of it.
  If clipping or sorting artifacts appear, keep it opaque and instead fade panel opacity
  to `0.15` during the hold window. Note `COMPOSITE_PANELS` already sets
  `renderOrder = 10` and `DoubleSide` — do not disturb either.

### [CORRECTED] `AcousticBaffleField` — do not delete the acoustic story

The original draft's "repurpose the rings as isotherms" would silently remove half of an
authored chapter. CH.03's label is **`CH.03 THERMAL / ACOUSTIC`**, and the component
documents the authored engineering claim: *"restrained, dissipating additive acoustic wave
rings (−43 dBA attenuation)"*. Current pools: `RING_COUNT = 6`, `EXHAUST_RING_COUNT = 5`.

**Do this instead:** keep the acoustic rings and add thermal boundary shells alongside
them — either as a third pooled set, or by splitting the existing 11 into 6 acoustic /
5 thermal. Thermal shells: 3–4 nested shells around `PUMP_HOUSING` at radii `0.25 / 0.45 /
0.65 m`, colors `#fbbf24` → `#f97316` → `#ea580c`, opacity `0.06–0.10`, additive,
`BackSide`, gentle scale/opacity undulation. Reuse the existing geometry/material pools
and `useFrame`; keep the `dispose()` cleanup intact.

**✅ OWNER RULING (2026-09-08): approved — 6 acoustic / 5 thermal.** Keep the existing
`RING_COUNT = 6` acoustic pool exactly as it behaves today and convert the
`EXHAUST_RING_COUNT = 5` exhaust pool into the thermal boundary shells. Do not add a third
pool and do not change either count. The −43 dBA acoustic claim stays legible.

### ✅ [OWNER-APPROVED 2026-09-08] Dark-blue enclosure treatment

**This section is approved to implement.** The owner has ruled that the dark-blue
treatment goes ahead, superseding the JG-021 round-3 ruling recorded in
`Station2_AcousticEnclosure.tsx:136-153`:

> *"Material treatment — JG-021 materials round 3 (2026-08-30 owner ruling): RETAIN the
> GLB's baked CAD palette. Both repaint attempts failed owner review — the role-tint lerp
> pulled black/rubber toward grey (round 1 'wrong tints on black parts') and repainted
> large meshes into saturated walls (round 2: DUCT_INTAKE's biggest face, an opaque
> MSP_YELLOW_PAINT intake grille, lerped teal and read as 'the cyan camera-facing panel');
> the remediation's dark finish matrix flattened the whole identity to charcoal under
> metalness-1 env reflections (milky grey). Subassembly identity in 3D comes from the
> CAD's own material distribution; roleColor above is registry/HUD documentation only."*

That history is not a veto — it is the **failure catalogue this attempt must not repeat**.
Three distinct ways this has already gone wrong: (1) tint-lerping pulled black/rubber
parts toward grey; (2) large meshes repainted into saturated walls, notably the
camera-facing yellow intake grille reading as a cyan panel; (3) a dark finish matrix at
metalness ≈ 1 under env reflections flattened everything to milky-grey charcoal.

**The draft's code snippet is non-functional and reproduces failure (2).**
`cloneMaterials(root, lite, collector)` has no per-mesh name access; its only name test is
`root.name === 'COMPOSITE_PANELS'`, evaluated once at the root. Setting `clone.color`
there repaints **every** mesh under all 191 `ENCLOSURE_CHASSIS` children — precisely the
indiscriminate repaint that was rejected. And the proposed `metalness 0.78` +
`envMapIntensity 1.05` sits inside failure band (3).

**Required implementation shape:**

- Add an opt-in name predicate evaluated **per mesh** inside the `root.traverse` callback,
  never on `root`. Drive it from an explicit allow-list of part numbers — part numbers are
  the stable key per `AGENTS.md`; root membership and stage names are not.
- **Suggested starting matrix, to be A/B'd rather than trusted:** chassis structure
  `#0a1a3a` at `roughness 0.42 / metalness 0.50 / envMapIntensity 0.75`; panels `#132a4a`
  at `roughness 0.48 / metalness 0.40 / envMapIntensity 0.70`. These sit deliberately
  below the draft's values to stay clear of failure band (3). Tune upward only if the A/B
  census shows the dark navy reading flat rather than milky.
- **Never touch** black/rubber/anodized materials — no lerp, no tint, no clamp change.
  That is failure band (1) and it is the easiest one to re-trigger.
- **Never touch** `MSP_YELLOW_PAINT` meshes, including the `G2RL300-SAF-1003-2` intake
  grille. That is failure band (2), by name.
- Preserve `PUMP_HOUSING` in its orange/steel tones (it must stay legible as the heat
  source), `ISOLATION_MOUNTS` in dark rubber/black, and both ducts' translucent cyan
  (`MSP_AIRWAY_VOLUME`) untouched.
- Preserve the hover `emissive.set('#00e5ff')` edge highlight — it reads well against dark
  navy.
- Re-check against the existing bloom threshold (`0.6`) **without changing it**. The
  darker baseline lowers scene luminance; if specular hot-spots stop blooming, raise
  Station-2 material emissive locally, never the shared threshold.
- **Update the JG-021 comment block in `Station2_AcousticEnclosure.tsx:136-153` in the
  same commit**, recording the 2026-09-08 owner approval and what superseded it. `AGENTS.md`
  requires hardcoded docs to move with the behavior change.
- **Ship the recolor as its own commit**, separate from the airflow work and from the
  `PANELS_OPAQUE` flip, each with an A/B census, so any one of the three can be reverted
  independently if the owner review turns.

## JGUN visual review targets

Do not change sequencing. Every item below must carry an explicit progress gate, because
all three live on the shared `SceneCanvas.tsx`.

- **Stronger depth separation during explode**: add a secondary, wider shadow plane
  (`scale={1.6}`, `blur={4}`, `opacity={0.12}`) at `y = -0.18` beneath the existing
  `ContactShadows` at `SceneCanvas.tsx:265`, with opacity scaled by
  `telemetry.rig.explodeFactor` and gated to `0.47–0.97`. Must render at zero opacity
  outside that window so CH.04 is unaffected.
- **More intentional rim lighting**: during `0.47–0.97`, nudge the `StudioRig` spot
  intensity `+0.3` and its Y position `+0.1`. Gate it; do not change the resting values.
- **[CORRECTED] Ghost/housing readability — the draft's premise was inverted.**
  `TorqueWrenchHero.tsx:346` reads `const ghostAmount = materialMode === 'blueprint' ? 0`,
  then `ghostOpacity = lerp(1, GHOST_OPACITY, ghostAmount)` = **1.0**. The housing is
  therefore **fully opaque** in blueprint mode, not disappeared. Furthermore, line 406
  swaps every mesh in `rig.meshes` to `blueprintMaterial`, which makes the ghost-material
  opacity writes no-ops in that mode. The actual lever is `blueprintMaterial.opacity`
  (`lerp(0.08, 0.35, chapterProgress)` at line 409). Either retune that value or drop this
  item — do not implement the draft's version.
- **Clearer rear-LCD focus**: add a micro-rim `pointLight` at `[-0.30, 0.12, 0.50]`,
  `color="#c8e6ff"`, `intensity={0.8}`, active **only** within `LCD_REVEAL_WINDOW`
  (`0.420–0.525`), alongside the existing `LcdFillLight` in `SceneCanvas.tsx`.
- **Restrained technical overlays**: in `DrawingLinework.tsx`, add a procedural paper
  grain — a 256×256 noise `CanvasTexture` generated in `drawingGeometry.ts`, passed as
  `uGrain`, mixed at `0.06`. Plus faint cyan registration crosses (0.4 px, 6 mm inset from
  sheet corners). This is intro-only and does not touch CH.04.
- **Typography/HUD**: no changes. Do not add new HUD elements.

## [CORRECTED] Telemetry and contract constraints

- **`telemetry.stage` has no free slot.** Actual shape:
  `{ active, alpha, flow, acousticWave, transitionIntensity, backdropAlpha }`. Repurpose
  **`acousticWave`** for thermal intensity, or reuse `flow` directly. Adding a
  `thermalIntensity` field means editing `src/state/scrollStore.ts`, which is outside the
  Station-2 file scope for this pass.
- **`npm run check:station2` is not a visual gate.** It only asserts (a) the 7 node-name
  strings appear in the GLB bytes, (b) the 7 anchor keys appear in `stageWindows.ts`, and
  (c) `SpatialWorld.tsx` contains the **literal strings** `<AcousticBaffleField />` and
  `<AirflowField />`. Passing it proves nothing about how the scene looks.
- **⚠️ Passing props to those mounts breaks the contract check.** Writing
  `<AirflowField airway={...} />` fails the exact string match. Resolve the airway box
  **inside** `AirflowField` (or via a shared module import), never via a prop from
  `SpatialWorld`.
- **Keep `stageEnvelope()` and `airflowIntensity()` verbatim.** `airflowIntensity` is
  derived from `STAGE_TRANSITIONS.enclosureIn[1]` → `enclosureOut[0]`; changing it
  retimes the stage.
- **No new npm dependencies.** No edits to `scrollStore.ts`, `caseStudies.ts`,
  `PostProcessingComposer.tsx`, `M249Stage.tsx`, or the `SpatialWorld` mount strings.

## Token-efficient workflow

0. **Write and commit the JG-032 plan before any code** (see "Required workflow" above).
   The plan names its skills and the phase each is read in; read each `SKILL.md` at the
   phase it belongs to, not all up front.
1. Read `AGENTS.md` and `TODO.md`, then only the files listed above. Search by symbol:
   `AirflowField`, `PANELS_OPAQUE`, `STATION2_CAD_ANCHORS`, `STAGE_TRANSITIONS`,
   `TorqueWrenchHero`, `M249Stage`, `DUCT_INTAKE_AIRWAY`.
2. **[CORRECTED] Verify with runtime telemetry, not screenshots.** Follow the existing
   probe pattern (`scripts/verify-jg027-lcd-cluster.mjs`) and the `webgl-telemetry-verifier`
   skill. Probe at: JGUN intro, JGUN explode, LCD orbit, RL300 assembled, RL300 cutaway
   hold (`p ≈ 0.65`), and the RL300 → M249 handoff (`p ≈ 0.74`). Screenshots are
   supporting evidence only — the dark scene makes vision unreliable.
3. Make one coherent Station-2 visual pass first; do not mix global refactors with visual work.
4. Minimize draw calls; keep shader math and preallocated-scratch patterns consistent with
   the existing code (no allocation in `useFrame`).
5. Reuse patterns: keep `AirflowField.tsx`'s component structure and replace only the
   shader strings plus the two airway-box uniforms; keep the `AcousticBaffleField` mount
   and reshape inside its existing `useFrame` and pools.
6. Write the unit tests alongside each change, not at the end. Run `npm run check:station2`,
   `npm run typecheck`, `npm test`, and `npm run build` after each coherent pass.
   **Restart the `:4173` preview after every rebuild.**
7. Review the diff specifically for accidental edits to CH.04 or authored JGUN timing.
8. Fill the evidence record with measured outputs, update `TODO.md` + `INDEX.md` in the
   behavior commit, then hand off for the owner's visual ruling.

## Acceptance checklist

- [ ] `AGENTS.md` and `TODO.md` read.
- [ ] `project/work/plans/JG-032-station2-thermal-visualization.md` written from the template and **committed before implementation code**, with Scope, Skills row, Implementation Steps, Acceptance Criteria, and Change Log all filled.
- [ ] Skill roster named in the plan with a read-phase for each; each `SKILL.md` actually read at its phase.
- [ ] Unit tests added for the airway box derivation, the 6/5 ring split, the recolor allow-list (**including the negative cases**), and every JGUN progress gate.
- [ ] `scripts/verify-jg032-station2-thermal.mjs` written and passing, including the A/B material census and the CH.04 byte-identical telemetry assertion.
- [ ] `project/work/evidence/JG-032-station2-thermal-verification.md` filled with exact commands and measured outputs; `status:` set.
- [ ] `TODO.md` and `project/work/INDEX.md` updated in the same commit as the behavior change.
- [ ] JGUN sequencing and camera ownership unchanged.
- [ ] All three JGUN lighting/shadow additions are progress-gated and provably inert at CH.04 progress values.
- [ ] `DUCT_INTAKE_AIRWAY`'s world-space bounding box drives the `t < 0.45` intake-plenum leg, via `uAirwayMin`/`uAirwayMax`, with a null-safe fallback.
- [ ] Airflow enters at +Z, crosses the plenum box, cools `PUMP_HOUSING`, deflects around `ACOUSTIC_BAFFLES`, and exits at −Z.
- [ ] Flow color and density communicate cool-to-hot thermal pickup.
- [ ] Aperture lattice matches verified panel geometry (not an assumed hex pattern).
- [ ] Ring split is exactly 6 acoustic (unchanged) / 5 thermal (converted exhaust pool); the −43 dBA story is still legible.
- [ ] Recolor uses a **per-mesh** part-number allow-list; no black/rubber part and no `MSP_YELLOW_PAINT` mesh was touched.
- [ ] Recolor lands as its own commit, with the JG-021 comment block updated in that same commit.
- [ ] RL300 cutaway exposes the path without z-fighting, clipping, or bloom washout — bloom threshold unchanged at 0.6.
- [ ] Hover/callout behavior and the `#00e5ff` emissive edge highlight still work.
- [ ] Reduced motion and lite tier still supported; no allocation in `useFrame`.
- [ ] M249 files and behavior untouched; `SpatialWorld` mount strings unchanged.
- [ ] Airflow, recolor, and `PANELS_OPAQUE` flip are three separate revertible commits, each with an A/B census.
- [ ] `npm run check:station2`, `npm run typecheck`, `npm test`, `npm run build` all pass.
- [ ] Runtime telemetry probe captured at all six progress windows; A/B census clean.
- [ ] Final diff limited to Station-2 files plus narrowly scoped, gated JGUN visual files (plus the plan, evidence, tests, probe, TODO, and INDEX).
- [ ] Handed off for owner visual ruling. **Do not write `CLOSED VERIFIED` yourself** — that goes in only after an explicit owner approval, quoted.

---

## Audit log — what changed from the original draft

| Item | Finding |
|---|---|
| Dark-blue recolor | **Owner-approved 2026-09-08**, superseding the JG-021 round-3 ruling. Kept, but rewritten: the draft's snippet repaints all 191 chassis children (failure band 2) and its `metalness 0.78 / env 1.05` sits in the "milky grey" band (3). Now requires a per-mesh part-number allow-list and a lower finish matrix. |
| `DUCT_INTAKE_AIRWAY` "hidden" | Wrong — it is rendered, as baked translucent cyan `MSP_AIRWAY_VOLUME` (alpha 0.22). |
| "32–64 point centerline spline" | Wrong — 48 verts, 1 primitive, a plain volume block. Replaced with a 2-uniform world AABB. |
| "the plenum's true bends" | Wrong — no bends; the box covers the +Z intake only and never reaches the −Z exhaust. |
| Rear-in / front-out flow | Wrong — CAD anchors document intake at **+Z**, exhaust at **−Z**. |
| Hex openings | Unverified assertion. Must be confirmed against panel geometry before implementation. |
| `ContactShadows` location | Wrong file — it is in the **global** `SceneCanvas.tsx:265`, so it reaches CH.04. |
| Blueprint housing "disappears" | Inverted — `ghostAmount = 0` yields opacity **1.0**, and blueprint mode makes the write a no-op anyway. |
| `telemetry.stage.thermalIntensity` | No free slot; repurpose `acousticWave` rather than editing `scrollStore.ts`. |
| Acoustic → thermal ring swap | Would delete half of the authored `CH.03 THERMAL / ACOUSTIC` chapter. **Owner ruling 2026-09-08: split 6 acoustic / 5 thermal** — keep the 6-ring acoustic pool, convert the 5-ring exhaust pool. |
| `check:station2` as a gate | It is a string-match contract, not a visual test — and passing props to the field mounts **breaks** it. |
| Draco | GLB is Draco-compressed; offline tooling must decode. `public/draco/` verified present. |
| Repo operating rules | Absent from the draft; `AGENTS.md` / `TODO.md` / telemetry-over-vision / `:4173` restart now required. |
