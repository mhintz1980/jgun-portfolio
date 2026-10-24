# 45 — Claude Code Projects: Master Goal, Multi-Session Orchestration Handoff & Root-Cause Fix Spec (2026-10-24)

**Repository:** `mhintz1980/jgun-portfolio`  
**Local Workspace:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (also compare `main` branch / `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio` for HUD callouts)  
**Active Branch:** `torque-wrench/rebuild` (HEAD `ffd47e6ca7ae904a2c1e1b136a0e2be8a92214ea`)  
**Owner Input List:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\HANDOFF-project-fix-list.md`  
**Reference Screenshots:**  
- Local folder: `C:\Users\Markimus\Pictures\Screenshots` (and `C:\Users\Markimus\Pictures\Screenshots\prints\P000420.png`)  
- In-repo mirror (for cloud/isolated sessions): `docs/torque-wrench-rebuild/45-ref-screenshots/`

---

## 1. Project Goal (For the Claude Code Projects Lead Agent)

Resolve all nine visual, shader, camera-choreography, and HUD callout defects documented in `HANDOFF-project-fix-list.md` (and screenshots `01.png` through `09.png` plus `P000420-clutch-housing-print.png`) on branch `torque-wrench/rebuild` for the `/torque-wrench/` interactive engineering experience.

As the **Claude Code Projects Lead Agent**, your role is to act as the multi-session architect and orchestrator:
1. Decompose the work into the **five disjoint parallel implementation sessions (Sessions 1A–1E)** defined below so that each full Claude Code session owns a strictly non-overlapping file set and can spawn its own subagents for local reads, tests, and verification.
2. Enforce the repository's hard asset and verification rules (`AGENTS.md`).
3. Run **Session 2 (Integration, Build & Programmatic Telemetry Verification)** once Sessions 1A–1E complete, verifying zero TypeScript errors, 100% unit test pass rate, clean production build, and live runtime telemetry + visual screenshot proof at every affected scroll checkpoint before reporting completion for owner visual review.

---

## 2. Hard Guardrails & Repository Rules (`AGENTS.md`)

- **Part Numbers Are the Immutable Key:** `P000420` (Clutch Housing), `P003068` (Ring Switch), `P001835` (Input Shaft), `P000247` / `A000592` (Stage-2 Planet / Carrier), `P002115` / `BK11356` (LCD Manometer). Never reorder logic on prose stage names alone.
- **Protected Binary Assets:** Never run `gltfjsx --transform` on `public/models/m249-transformed.glb` or `public/models/msp-enclosure.glb`. Never run `npm run sync-assets` in cloud environments.
- **No Uncommitted Scratch in Commits:** Never commit `.scratch/` or temporary diagnostic outputs.
- **Rebuild + Restart Preview Server Before Any Browser Verification:** Always run `npm run build` and restart the preview server (`npx vite preview --port 5341 --host localhost`) before running Playwright/telemetry verifiers.
- **Verify With Runtime Telemetry + Captured Frames:** Never rely on unverified assumptions; use `window.__torqueWorld` telemetry probes (`grooveCapture`, `grooveRects`, `overlaySample`, `snapshot`) and Playwright screenshot captures at the exact scroll checkpoints.

---

## 3. Parallel Session Architecture & File Ownership Matrix

Notice that `RuntimeWorld.tsx` is touched by three logical concerns (groove fade in lines 749–766, hotspot visibility gating in lines 1115–1135, and the `0.94..0.995` collapse camera override in lines 1036–1056). To prevent merge conflicts across concurrent Claude Code sessions:
- **Option A (Recommended Disjoint Ownership):** Have **Session 1B** own `RuntimeWorld.tsx` (incorporating the small 15-line hotspot active-window gate for Session 1C and removing the 20-line `0.94..0.995` LCD camera override for Session 1E, while Session 1C owns `TorqueInspectionOverlay.tsx`, `torque-inspection-overlay.css`, and `hotspotData.ts`, and Session 1E owns `JourneyCamera.ts`, `JourneyCamera.test.ts`, and `scripts/verify-torque-camera-hud.mjs`).
- **Option B (Worktree Merge):** Let Sessions 1B, 1C, and 1E edit their respective non-overlapping line ranges in `RuntimeWorld.tsx` in isolated Git worktrees and merge them cleanly in Session 2.

| Session | Scope / Issues Covered | Reference Images | Disjoint Write Ownership |
| :--- | :--- | :--- | :--- |
| **Session 1A** | **Issues 1, 2 & 3:** Profile view light-blue tint, crossing lines/arcs turning light blue inside profile perimeter, and `Detail C` circle clipped/hidden inside profile perimeter | `01.png`, `02.png`, `03.png` | `src/scene/torque-wrench/privateSheetRuntime.ts`, `src/scene/torque-wrench/privateSheetRuntime.test.ts`, `src/scene/drawing/sheet/ink.ts`, `src/scene/drawing/sheet/sheetText.ts` |
| **Session 1B** | **Issues 4 & 6:** OSHA Blue groove remaining visible when Clutch Housing fades out; OSHA Blue groove missing at start of Ring Switch twist (`shift = 0`) vs OSHA Red groove visible at end (`shift = 1`) | `04.png`, `06.png`, `P000420-clutch-housing-print.png`, `ring switch-starting-position.png`, `ring switch-ending-position-osha-red.png` | `src/scene/torque-wrench/InspectionDirector.ts`, `src/scene/torque-wrench/InspectionDirector.test.ts`, `src/scene/torque-wrench/RuntimeWorld.tsx` (groove fade + coordinated `RuntimeWorld.tsx` edits) |
| **Session 1C** | **Issue 5:** Hide external labels during special sequences (Ring Switch knurling & Input Shaft study), eliminate crossing leader lines, and replace card rail with `main`-branch style GD&T callouts | `05-1.png`, `05-2.png`, `ring switch-ending-position-osha-red.png` | `src/scene/torque-wrench/TorqueInspectionOverlay.tsx`, `src/scene/torque-wrench/torque-inspection-overlay.css`, `src/scene/torque-wrench/hotspotData.ts` |
| **Session 1D** | **Issues 7 & 8 (Image `08.png`):** Input Shaft FEA undercut full-red color mapping & visible gradient shift across `4140` / `4340` / `C300`; eliminate vertical rotational-phase seam across Input Shaft ball pockets during axial wipe (`08.png`) | `07-1.png`, `07-2.png`, `08.png`, `fea-input-shaft1.png`, `fea-input-shaft2.png` | `src/scene/inspection/shaft/progression.ts`, `src/scene/inspection/shaft/progression.test.ts`, `src/scene/inspection/shaft/fosPresentation.ts`, `src/scene/inspection/shaft/fosPresentation.test.ts`, `src/scene/inspection/shaft/shaftRuntime.ts`, `src/scene/inspection/shaft/shaftRuntime.test.ts` |
| **Session 1E** | **Issues 8/9 (Text & Image `09.png`):** Reposition camera during exploded gearbox collapse (`0.94 -> 0.98`) from dead-on rear handle/LCD axial close-up to an elevated side-three-quarter view with depth and parallax | `09.png`, `Screenshot 2026-10-24 044351.png` | `src/scene/torque-wrench/JourneyCamera.ts`, `src/scene/torque-wrench/JourneyCamera.test.ts`, `scripts/verify-torque-camera-hud.mjs` |
| **Session 2** | **Integration & Verification:** Merge all lanes, run typecheck + full Vitest suite + production build + Playwright runtime telemetry & screenshot verification | All `01.png`–`09.png` checkpoints | Verification reports & integrated branch |

---

## 4. Detailed Root-Cause Diagnosis & Exact Fix Specifications

### Session 1A — Drafting Sheet Profile-Perimeter Light-Blue Tint & `Detail C` Clipping (Issues 1, 2 & 3)

#### What Mark Sees (`01.png`, `02.png`, `03.png`)
1. **Issue 1 (`01.png`):** The 1:1 side profile view is drawn in a noticeably **lighter shade of blue** than the rest of the views on the drafting sheet (`Dark Blue` outside vs `Light Blue` inside).
2. **Issue 2 (`02.png`):** Every leader line or arc (such as the `GEARBOX HOUSING`, `CLUTCH HOUSING`, and `RING SWITCH` leaders) that crosses into the perimeter of the profile view **changes from dark blue to the lighter shade of blue strictly inside the perimeter of the profile view**.
3. **Issue 3 (`03.png`):** The callout circle for **`Detail C`** draws in dark blue outside the profile view, **but the arc of the `Detail C` circle that enters the perimeter of the profile view gets hidden** (while `reveal[GROUP.side] < 0.98`) and then turns washed-out light blue.

#### Exact Root Cause in Code
Look at the render-order and shader interaction between `sheet-ink-lines` (`src/scene/drawing/sheet/ink.ts:389`) and the 99 Voronoi shard meshes `paper-fragment-0..98` (`src/scene/torque-wrench/privateSheetRuntime.ts:230–235, 475–482, 749–759`):
1. In `ink.ts:389` and `:466`, `lines` (`sheet-ink-lines`) and `fills` (`sheet-ink-fills`) have:
   - `mesh.renderOrder = 2`, `transparent = true`, `depthWrite = false`, `z = 0.0003`.
   - Their shader (`lineFragment`) renders crisp, analytic SDF anti-aliased strokes in full-strength dark navy (`uInk = #15295a` scaled by `inkLight = 0.32 + 0.68 * lampPower`, plus wet-ink darkening).
2. The main sheet exterior `paper` (`engineering-drawing-Z0`, which has the 1:1 profile silhouette cut out of it) has `paper.renderOrder = 1`, `transparent = false`, `depthWrite = true`.
3. The interior of the 1:1 profile silhouette is tiled by the 99 Voronoi shard meshes `paper-fragment-0..98`. In `privateSheetRuntime.ts:753–759`, for the entire scroll **before** the sheet fractures (`event <= 0.035`, which holds from `progress = 0.0` all the way to `intro.t = 0.84` / `progress = 0.42`):
   ```ts
   mesh.material.depthTest = event > .035       // false!
   mesh.material.transparent = event <= .035    // true!
   mesh.renderOrder = event > .035 ? 1 : 3      // 3!
   ```
4. **Why that breaks Issues 1, 2, and 3 simultaneously:**
   - Because `paper-fragment-0..98` have `renderOrder = 3` (`> lines.renderOrder = 2`), `transparent = true`, and `depthTest = false`, Three.js renders all 99 `paper-fragment-*` meshes **AFTER** `sheet-ink-lines` (`renderOrder = 2`) and `sheet-ink-fills` (`renderOrder = 2`)!
   - `paperFragment` outputs `gl_FragColor = vec4(c, uOpacity)` with `uOpacity = 1.0` (opaque cream vellum stock). That means `paper-fragment-0..98` at `renderOrder = 3` **completely paint over and erase `sheet-ink-lines` and `sheet-ink-fills` everywhere inside the profile perimeter!**
   - While `reveal[GROUP.side] < 0.98` (including `t = 0.16..0.24` when `Detail C` is drawn by `GROUP.detailC`), `smoothstep(0.98, 1.0, uFragmentInk)` in `paperFragment` (`privateSheetRuntime.ts:235`, added in commit `ebe22947`) is `0.0`, so `paper-fragment-*` paints **blank cream paper** over `sheet-ink-lines` inside the profile perimeter — **completely hiding the inner half of the `Detail C` circle (Issue 3) and hiding the progressive stroke-by-stroke drawing of the profile itself**!
   - Once `reveal[GROUP.side] >= 0.98`, `paper-fragment-*` (`renderOrder = 3`) still covers up the real `sheet-ink-lines` (`renderOrder = 2`) inside the profile perimeter and displays only `uFragmentPrint` (`breakthrough.ts:74`, a low-res `2048 × 1280` bilinear-filtered canvas texture) mixed into the unlit paper color at `c = mix(c, vec3(.06, .09, .18), ink * .78 * ...)` (`privateSheetRuntime.ts:235`) *before* lamp lighting `c *= light`. Bilinear filtering on thin canvas strokes (`ink ≈ 0.35–0.55`) multiplied by `0.78` and washed out by the lamp multiplier makes every stroke inside the profile perimeter — the profile view itself (**Issue 1**), every crossing leader line (**Issue 2**), and the inner arc of `Detail C` (**Issue 3**) — render as a blurry, washed-out **Light Blue** instead of crisp **Dark Blue**!

#### Required Fix (Session 1A)
1. **Fix the Render-Order Hierarchy While Intact (`uFracture == 0`):**
   - `sheet-ink-lines`, `sheet-ink-fills`, and `sheetText` **must render ON TOP OF (`renderOrder` >) intact `paper-fragment-0..98`**!
   - Specifically, in `privateSheetRuntime.ts` (or `ink.ts` / `sheetText.ts`):
     * Keep intact `paper-fragment-0..98` (`event <= 0.035`) at `renderOrder = 3` (so with `depthTest = false` they still act as an opaque vellum lid over the 3D wrench model below the sheet).
     * Set `baked.lines.renderOrder = 4`, `baked.fills.renderOrder = 4`, and `baked.text.object.renderOrder = 4` (and set `pulse.renderOrder = 5`, `cracks.renderOrder = 5`, `crackHalo.renderOrder = 5`).
2. **Gate `uFragmentPrint` Strictly on Fracture (`privateSheetRuntime.ts:235`):**
   - Change line 235 of `src/scene/torque-wrench/privateSheetRuntime.ts` from:
     ```glsl
     c = mix(c, vec3(.06, .09, .18), ink * .78 * max(smoothstep(.98, 1.0, uFragmentInk), smoothstep(0.0, .02, uFracture)));
     ```
     to gate `uFragmentPrint` **only when fracture begins** (`smoothstep(0.0, 0.02, uFracture)`):
     ```glsl
     c = mix(c, vec3(.06, .09, .18), ink * .78 * smoothstep(0.0, 0.02, uFracture));
     ```
   - **Why this works seamlessly:**
     * For the entire intact sheet phase (`uFracture == 0`), `paper-fragment-0..98` (`renderOrder = 3`) render pure, un-inked cream vellum stock identical to `paper` (`renderOrder = 1`).
     * Then `lines` (`renderOrder = 4`), `fills` (`renderOrder = 4`), and `text` (`renderOrder = 4`) draw directly on top of both `paper` and `paper-fragment-0..98`.
     * Every stroke inside the profile perimeter (the 1:1 profile view, the inner half of the `Detail C` circle, and every leader line crossing into the profile) is drawn by the **exact same `sheet-ink-lines` shader** in the **exact same Dark Blue (`uInk`)** with zero boundary color change, zero clipping, and true progressive stroke-by-stroke reveal from `0` to `1`!
     * Then, the instant fracture begins (`uFracture > 0`), `cutPrintedStock(vPlane)` in `ink.ts` discards `lines` and `fills` inside the profile hole while `smoothstep(0.0, 0.02, uFracture)` turns on `uFragmentPrint` on the departing 3D shards!
   - Keep the `uFragmentInk` uniform binding registered on `u` in `privateSheetRuntime.ts:414, 696` so uniform table lookups and `drawing-edges` proof mode in `privateSheetRuntime.test.ts` continue to pass.
3. **Unit & Visual Verification:**
   - Update `src/scene/torque-wrench/privateSheetRuntime.test.ts` to assert that `baked.lines.renderOrder > fragments[0].renderOrder` while `event === 0` and that `paperFragment` only mixes `uFragmentPrint` when `uFracture > 0`.

---

### Session 1B — Clutch Housing OSHA Blue/Red Grooves, Isolation Fade & Ring Switch Twist Camera Timing (Issues 4 & 6)

#### What Mark Sees (`04.png`, `06.png`, `P000420-clutch-housing-print.png`)
1. **Issue 4 (`04.png`):** When the gearbox and Clutch Housing fade away to isolate the Ring Switch (`P003068`), the **OSHA Blue painted groove** (which is a physical groove channel machined into the **Clutch Housing `P000420`**, see `P000420-clutch-housing-print.png` Detail B) stays visible floating in empty space inside/beside the Ring Switch! That painted line belongs to the Clutch Housing and must fade away with it.
2. **Issue 6 (`06.png`):** After knurling completes and the gearbox/Clutch Housing fade back in for the start of the Ring Switch twisting sequence (`shift = 0`, down / Rundown position), **the OSHA Blue paint groove is not visible (`06.png`)**. Mark rules: *"The blue paint groove must be visible when the Ring Switch is in the down position and must always show the red groove when in the up position. Consider that when timing the camera when the gearbox fades back in and ring switch twists up or down the gearbox and position the camera, and control the distance the ring switch moves."*

#### Exact Root Cause in Code
1. **Root Cause of Issue 4 (`src/scene/torque-wrench/RuntimeWorld.tsx:754–766, 980`):**
   - In `src/scene/rig/nodeRoles.ts:593–612`, the two painted grooves are procedural cylinder bands parented to `clutchStaticGroup` (`P000420`):
     * `P000420 Speed Indicator (Red)` at `z = -0.10715 m` (handle/`-Z` side of the Ring Switch)
     * `P000420 Speed Indicator (Blue)` at `z = -0.08645 m` (snout/`+Z` side of the Ring Switch)
   - In `RuntimeWorld.tsx:754–766`, an explicit override was hardcoded:
     ```ts
     const blueReference = !manual && progress >= .46 && progress < .475
       ? 1 - Math.max(0, Math.min(1, (progress - .4725) / .0025)) : 0
     if (privateSurroundings) {
       for (const { mesh, source, clone } of privateSurroundings.entries) {
         const fade = mesh.name === GROOVE_NAMES.blue ? Math.max(surroundingsOpacity, blueReference) : surroundingsOpacity
     ```
   - While `surroundingsOpacity` fades the Clutch Housing and Gearbox to `0` over `0.469 -> 0.4725`, `blueReference` forces `P000420 Speed Indicator (Blue)` to stay at `1.0` through `0.4725` (and fade late over `0.4725 -> 0.475`), leaving the blue stripe floating in mid-air around the isolated Ring Switch (`04.png`)!
2. **Root Cause of Issue 6 (`src/scene/torque-wrench/InspectionDirector.ts:435–455`):**
   - Look at `RING_CAMERA_KNOTS` in `InspectionDirector.ts:446–454`:
     ```ts
     { progress: 0.4945, azimuth: 2.95, elevation: 0.18, distanceScale: 1, fov: 32 },
     // The restored assembly glides toward the handle BEFORE the shift starts.
     { progress: 0.520, azimuth: 3.35, elevation: 0.2, distanceScale: 1, fov: 32 },
     { progress: 0.560, ...RING_GROOVE_VIEW.red }, // azimuth: 3.55
     ```
   - In the ring-anchor coordinate frame (`InspectionDirector.ts:431`), `+Z` is toward the **snout** (where the **OSHA Blue** groove sits at `z = -0.08645 m`, just snout-ward of the Ring Switch's front face when `shift = 0`) and `-Z` is toward the **handle** (where the **OSHA Red** groove sits at `z = -0.10715 m`, uncovered when the Ring Switch shifts `+Z` to `shift = 1`).
   - Because `out.pz = horizontal * Math.sin(azimuth) + axis`:
     * When `azimuth < π` (`< 3.1416 rad`, e.g. `RING_BASE_AZIMUTH = 2.49 rad` or `2.65 rad`), `sin(azimuth) > 0` (`pz > 0`), so the camera views the Ring Switch from the **snout (`+Z`) three-quarter side**, where the snout-side **OSHA Blue** groove (`r = 31.70 mm`) is clearly visible in front of the Ring Switch (`r = 37.72 mm`).
     * However, `RING_CAMERA_KNOTS` sweeps `azimuth` from `2.95 rad` (`p = 0.4945`) across `π` (`3.1416 rad`) to **`3.35 rad` (`sin(3.35) < 0`, on the handle `-Z` side!) by `p = 0.520`** — *before* `shift` even begins at `p = 0.520`!
     * Viewing from the handle side (`azimuth = 3.35 > π`) while the Ring Switch is still in the down position (`shift = 0`) means the `37.72 mm` outer diameter of the Ring Switch **completely blocks the camera's line of sight to the `31.70 mm` OSHA Blue groove on the snout side of the ring (`06.png`)**!

#### Required Fix (Session 1B)
1. **Fix Issue 4 in `src/scene/torque-wrench/RuntimeWorld.tsx:754–766, 980`:**
   - Remove `blueReference` completely so `P000420 Speed Indicator (Blue)` uses `surroundingsOpacity` just like `P000420` (Clutch Housing) and `P000420 Speed Indicator (Red)`. When the Clutch Housing fades out (`0.469 -> 0.4725`), the OSHA Blue groove fades out with it; when the Clutch Housing is hidden (`0.4725 -> 0.495`), neither groove is visible.
   - **Important Verifier Gate Update (`scripts/verify-torque-camera-hud.mjs:50, 129`):** Line 129 currently asserts `add('blue pixels at entry', at(.4725)?.groovePixels?.blue.colored>10, ...)` from when `blueReference` artificially held the blue groove visible at `0.4725` while `surroundingsOpacity === 0`. Update `scripts/verify-torque-camera-hud.mjs` so at `p = 0.4725` (or `0.4805`) it asserts `blue.colored === 0 && red.colored === 0` (proving Issue 4: both grooves faded out with the Clutch Housing), and asserts `blue.colored > 10` at `p = 0.515` / `0.520` (`shift = 0`, after the Clutch Housing restores at `0.505`, proving Issue 6).
2. **Fix Issue 6 in `src/scene/torque-wrench/InspectionDirector.ts:435–455` (and verify `wrenchMechanics.ts` / `MechanismDirector.ts`):**
   - As the gearbox fades back in around the finished Ring Switch (`p = 0.4945 -> 0.505`) and settles for the start of the shift (`p = 0.505 -> 0.520`, where `shift = 0`, down / Rundown mode), move the camera to the **snout-side three-quarter framing** (`azimuth ≈ 2.50 – 2.65 rad < π`, `elevation ≈ 0.20`, `targetZ ≈ +0.006`, matching `RING_GROOVE_VIEW.blue` and `ring switch-starting-position.png`) so the **OSHA Blue paint groove is 100% visible and unobstructed** while the Ring Switch is in the down position!
   - Then, **synchronized with the Ring Switch twisting/sliding up the Clutch Housing (`shift: 0 -> 1` over `p = 0.520 -> 0.545`)**, orbit the camera smoothly from the snout-side three-quarter (`azimuth ≈ 2.60 rad`, `targetZ = +0.006` at `p = 0.520`) across to the handle-side three-quarter (`azimuth = 3.55 rad`, `targetZ = -0.006` by `p = 0.545`, holding through `0.560`), so:
     * At the start of the twist (`p = 0.505..0.520`, `shift = 0`): the **OSHA Blue** groove is clearly visible on the snout side of the Ring Switch.
     * During the twist (`p = 0.520..0.545`, `shift: 0 -> 1`): the Ring Switch twists `120°` and translates `+Z` (`RING_SWITCH_TRAVEL_SCALE = 0.76`, `7.24 mm`), covering the OSHA Blue groove and uncovering the **OSHA Red** groove on the handle side as the camera glides to `azimuth = 3.55 rad`.
     * At the end of the twist (`p = 0.545..0.560`, `shift = 1`): the **OSHA Red** groove is clearly visible on the handle side of the Ring Switch (matching `ring switch-ending-position-osha-red.png`), with the machined teardrop cam slot still covered.
   - Update `src/scene/torque-wrench/InspectionDirector.test.ts` and verify with `window.__torqueWorld.grooveCapture()` at `p = 0.480` (both grooves hidden), `p = 0.515` (OSHA Blue groove visible), and `p = 0.550` (OSHA Red groove visible).

---

### Session 1C — Replace Problematic Labels & Crossing Leaders With `main`-Branch Style Callouts (Issue 5)

#### What Mark Sees (`05-1.png`, `05-2.png`)
1. **`05-1.png`:** During the special Ring Switch knurling sequence (`p = 0.460 – 0.505`), the clickable `Ring Switch` label and its leader line remain visible on screen pointing at the part while the knurling tool is machining it. Mark rules: *"Any feature external to a special sequence should stay out of visibility during the sequence."*
2. **`05-2.png`:** Shows a cluttered vertical stack of three boxy cards (`Clutch Housing`, `Ring Switch`, `LCD Manometer`) on the right side of the screen at the wrong scroll timing, with **all three leader lines crossing over each other** near the middle of the gearbox. Mark rules: *"Crossing leader lines are aggravating for engineers and drafters. They should be avoided whenever possible. Remove the labels and replace them versions that look more like the labels used on the main branch in 'jgun-portfolio'."*

#### Exact Root Cause in Code
1. In `src/scene/torque-wrench/RuntimeWorld.tsx:1117–1123`:
   ```ts
   const active = !manual && !studyVisible && progress >= .46 && progress <= .995
     && (item.id !== 'stage2-planet' || channels.explode > .65)
   ...
   if (!active || !item.node || (item.id !== 'ring-switch' && surroundingsOpacity < .2)) continue
   ```
   Every hotspot is active across the entire `0.46..0.995` half of the page, and `ring-switch` is explicitly exempted from `surroundingsOpacity < 0.2`, keeping it visible right through the `0.460..0.505` knurling sequence (`05-1.png`) and the `0.585..0.600` Input Shaft isolation cutaway (`05-2.png`)!
2. In `src/scene/torque-wrench/TorqueInspectionOverlay.tsx` and `torque-inspection-overlay.css`:
   - All visible hotspots are dumped into a single fixed upper-right grid (`.torque-hotspot-rail`), and each leader is drawn as `${anchor.x},${anchor.y} ${cardLeft - 18},${cardCenterY} ${cardLeft},${cardCenterY}` with zero leader-crossing avoidance or beat-specific scheduling.
3. Compare with the `main` branch in `jgun-portfolio` (`src/components/ToleranceStations.tsx`, `src/scene/stations/stationData.ts`, and `src/scene/Hotspots.tsx`, visible in `ring switch-ending-position-osha-red.png`):
   - On `main`, callouts are **clean engineering HUD annotations** (cream `#efe6d0` / cyan `#00e5ff` & amber `#f2a24a` ASME Y14.5 segmented Feature Control Frames `[ ⌓ | .004 | A | E ]`, compact uppercase title, monospace part number + process note, target reticle on the 3D feature, and a crisp angled-elbow-to-horizontal-shelf dogleg leader).
   - Crucially, on `main` (`ToleranceStations.tsx`), callouts appear **during their own dedicated beat** (or in non-colliding zones placed on the same side as their 3D anchor) and **never stack into a multi-card rail with crossing leaders**.

#### Required Fix (Session 1C)
1. **Strict Special-Sequence Exclusion (`RuntimeWorld.tsx`, `TorqueInspectionOverlay.tsx` & `hotspotData.ts`):**
   - Export a single pure helper `isTorqueHotspotActive(id: TorqueHotspotId, progress: number, explode: number, surroundingsOpacity: number, ringVisible: boolean, studyVisible: boolean, manual: boolean): boolean` from `src/scene/torque-wrench/hotspotData.ts` and apply it in all four gating locations (`RuntimeWorld.tsx:487` `selectPart`, `RuntimeWorld.tsx:1084` focus auto-release, `RuntimeWorld.tsx:1118` anchor visibility loop, and `TorqueInspectionOverlay.tsx:86` `keyboardFocus` gate) so a focused card also hides cleanly when scrolling out of its beat or into a special sequence.
   - **Never** show any hotspot callouts during:
     * The Ring Switch knurling sequence (`p < 0.506`, or whenever `ringVisible` is true or `surroundingsOpacity < 0.95`).
     * The Input Shaft isolation / ghost cutaway / machining / FEA / return sequence (`p in [0.560, 0.855]`, or whenever `studyVisible` or `manual` is true).
   - Assign each of the 4 approved callouts its own **dedicated, non-overlapping scroll window** (or max 1 callout on screen at a time so leader lines can **never** cross!):
     * **`ring-switch` (`P003068`, Ring Switch):** active during the first half of `mechanism-switch` (`p in [0.506, 0.530]`, covering verifier checkpoint `0.520`).
     * **`clutch-housing` (`P000420 -> P000245`, Clutch Housing `⌀2.525 H7/k6` / `[ ⌓ | .004 | A | E ]`):** active during the second half of `mechanism-switch` (`p in [0.532, 0.558]`, covering verifier checkpoint `0.545`).
     * **`stage2-planet` (`P000247 · A000592`, Second-Stage Planet Gear `[ ⌰ | < .001″ TIR ]`):** active during the exploded drivetrain view (`p in [0.875, 0.938]`, when `channels.explode > 0.65`, covering verifier checkpoints `0.905` and `0.925`).
     * **`lcd-manometer` (`P002115 / BK11356`, LCD Manometer):** active during the post-collapse close sequence (`p in [0.975, 0.995]`, or whichever post-collapse checkpoint is verified in `verify-torque-camera-hud.mjs`) when the rear handle / LCD is unoccluded.
     *(Note: If two callouts are ever shown in the same window or via a compact selector, their cards must be placed on the anchor's near side and sorted vertically by `anchor.y` so segment-intersection between any two leader polylines is strictly impossible — add a unit/runtime check asserting zero leader polyline intersections!)*
2. **Replace the Boxy Right-Rail Stack With `main`-Branch Style Engineering Callouts (`TorqueInspectionOverlay.tsx` & `torque-inspection-overlay.css`):**
   - Replace the heavy stacked dark-box rail with the sleek `main`-branch callout style (see `src/components/ToleranceStations.tsx` and `ring switch-ending-position-osha-red.png`, or compact `Hotspots.tsx` badge styling):
     * Crisp ASME Y14.5 segmented Feature Control Frame (`1.5px solid #efe6d0` compartments with vector GD&T symbol glyph, tolerance value, and datum cells) at the top of the callout.
     * Bold uppercase condensed part title (`Barlow Condensed` / monospace), warm amber (`#f2a24a`) or cyan part number with wide tracking, and concise process note.
     * Dynamic card placement in the open space beside/above the model on the **same side as the 3D anchor** (like `ToleranceStations.tsx:180–225`), connected by a clean 3-point drafting leader (`anchor -> angled 45°/dogleg elbow -> horizontal shelf`) and an amber/cream target reticle at the anchor point.
     * Preserve keyboard/click accessibility (`<button>` focusable/clickable to trigger `requestTorquePartFocus(item.id)` and `Inspect the input shaft` / `Inspect the finish` actions where applicable).

---

### Session 1D — Input Shaft FEA Color Mapping, Metal-Cycling Gradient Shift & Axial Wipe Seam Fix (Issues 7 & 8 / `08.png`)

#### What Mark Sees (`07-1.png`, `07-2.png`, `08.png`, `fea-input-shaft1.png`, `fea-input-shaft2.png`)
1. **Issue 7 (`07-1.png` & `07-2.png`):**
   - In `07-1.png` (`AISI 4140 (40-45 HRC)`, `Min FOS = 0.55`), the right-hand vertical FOS bar marker points to `0.55` in the **deep red** zone, but the Input Shaft's cutter relief groove (undercut) is mostly light blue/cyan with only a tiny orange smudge on the left side! Mark annotated `07-1.png`:
     * Red arrow pointing to the cutter relief groove: **`"entire undercut should be red like this text to match FEA bar chart"`**
     * Cyan arrow pointing to the gear teeth: **`"Wrong color and gradient pattern"`**
   - In `07-2.png` (`C300 (56-58 HRC)`, `Min FOS = 0.90`), the right-hand vertical FOS bar marker moves up to `0.90` (in the **orange-yellow** zone just below `1.0`), but the 3D color gradient on the Input Shaft looks nearly identical to `07-1.png` and does not shift as the study cycles through `4140` (`0.55`), `4340` (`0.72`), and `C300` (`0.90`).
2. **Issue 8 Screenshot (`08.png`):**
   - *(Note: In `HANDOFF-project-fix-list.md`, item 8's text accidentally duplicated item 9's text, but screenshot `08.png` — captured at `5:55:51 AM` right after `07-1.png` and `07-2.png` — shows the Input Shaft horizontal transition with a red arrow and red oval highlighting a **vertical split/step discontinuity right through the middle of the cam-lobe ball pockets**!)*

#### Exact Root Cause in Code (Issue 7 — FEA Color Mapping & Gradient Shift)
Look at `src/scene/inspection/shaft/progression.ts:384–418` (`STRESS_CHUNK`, which uses `jg`-prefixed variables `jgDy`, `jgTheta`, `jgSide`, `jgCore`, `jgSkirt`, `jgFloorBias`, `jgBlotch`, `jgField`) and `:453–506` (`makeStressOverlayMaterial`, which uses unprefixed `dy`, `theta`, `side`, `core`, `skirt`, `floorBias`, `blotch`, `field`), and `src/scene/inspection/shaft/fosPresentation.ts:28–37`:
1. **Why the undercut is light blue with only a tiny one-sided smudge instead of red around the entire undercut:**
   ```glsl
   float dy = vShaftLocal.y - uStressCenterY;
   float theta = atan(vShaftLocal.z - uShaftAxis.z, vShaftLocal.x - uShaftAxis.x);
   float side = 0.62 + 0.38 * cos(theta - 0.35);
   float core = exp(-(dy * dy) / (2.0 * 0.9 * 0.9));
   float skirt = exp(-(dy * dy) / (2.0 * 4.0 * 4.0));
   float floorBias = 1.0 - 0.6 * smoothstep(3.9, 6.1, radius);
   float blotch = 0.1 * sin(theta * 3.0 + dy * 2.2) + 0.06 * sin(theta * 5.0 - dy * 3.1);
   float field = clamp((0.95 * core * floorBias + 0.38 * skirt) * side + blotch * skirt, 0.0, 1.0);
   vec3 color = jgFosColor(mix(uStressBodyFos, uStressHotspotFos, field));
   ```
   - `side = 0.62 + 0.38 * cos(theta - 0.35)` multiplies the stress field by `0.24` on one side of the shaft and `1.0` only at `theta = 0.35`!
   - `floorBias = 1.0 - 0.6 * smoothstep(3.9, 6.1, radius)` multiplies the groove walls/fillets (`radius = 4.5..6.1 mm`) by `0.40`!
   - Together, `side * floorBias` crushes `field` down to **`0.20..0.55`** across 85% of the visible undercut groove! When `field = 0.45`, `mix(uStressBodyFos = 3.0, uStressHotspotFos = 0.55, 0.45)` evaluates to `fos = 1.90`, which `jgFosColor(1.90)` renders as **cyan / light blue**!
2. **Why the gradient pattern on the gear teeth is wrong (`07-1.png` cyan arrow) and why cycling `4140 -> 4340 -> C300` barely changes the 3D shaft:**
   - In `shaftRuntime.ts:574`, `stress.yMin = 2.5; stress.yMax = 18` paints solid far-field blue (`uStressBodyFos = 3.0`) with hard `step()` cutoffs across the entire gear tooth face (`y = 2.5..10 mm`) and upper shoulder (`y = 12..18 mm`), with `blotch` creating noisy light-blue vertical stripes on the gear teeth (`07-1.png`).
   - Meanwhile, in `fosPresentation.ts:27–36`, `FOS_STOPS` has `[0.0, 0.86, 0.07, 0.06]`, `[0.6, 0.93, 0.17, 0.07]`, `[0.85, 1.0, 0.5, 0.06]`, `[1.05, 1.0, 0.88, 0.1]`. Because `field` almost never reached `1.0` and the axial Gaussian width `0.9 mm` was fixed, changing `uStressHotspotFos` from `0.55` (`4140`) to `0.72` (`4340`) to `0.90` (`C300`) only shifted the tiny left-hand spot slightly from orange-red to orange-yellow while 90% of the shaft stayed static cyan/blue!

#### Exact Root Cause in Code (Issue 8 Screenshot `08.png` — Vertical Split/Seam Across the Input Shaft)
Look at `src/scene/inspection/shaft/shaftRuntime.ts:543–556`:
```ts
const legacyAngle = kinematics.workPhi
const approvedAngle = kinematics.hobWorkPhi + schedule.finaleAngle
if (parts.legacyshaft) parts.legacyshaft.root.rotation.z = -legacyAngle
if (parts.approvedshaft) parts.approvedshaft.root.rotation.z = -approvedAngle * (1 - (options.presentation?.phaseCorrection ?? 0))
...
const wipeZ = shaftMaxZ + (shaftMinZ - shaftMaxZ) * schedule.wipeProgress
wipeLegacy.constant = wipeZ; wipeApproved.constant = -wipeZ
```
1. **Rotational Phase Mismatch (`51.48°`) Between `legacyshaft` and `approvedshaft` During the Axial Wipe (`t = 22.6..25.0 s`):**
   - At `t = 15.0 s` (end of shaping), `kinematics.workPhi = -2 * (π / 2) * MACHINING_AT_SHAPING_END = -21.714 * π`, which is `-1.714 * π` (`+51.48° mod 360°`).
   - During the axial wipe (`t = 22.6..25.0 s`, when `legacyshaft` and `approvedshaft` are both visible on either side of the clipping plane `wipeZ`), `parts.legacyshaft.root.rotation.z` is `+51.48°` while `parts.approvedshaft.root.rotation.z` is `0°`!
   - As the vertical clipping plane sweeps across the 3 ball-detent pockets in the middle of the shaft (`08.png`), the two halves are rotated `51.48°` out of phase, producing the exact vertical step/crack circled in red in `08.png`!

#### Required Fix (Session 1D)
1. **Fix Issue 7 in `src/scene/inspection/shaft/progression.ts`, `fosPresentation.ts`, and `shaftRuntime.ts`:**
   - **Axisymmetric Full-Circumference Undercut Field:** Remove `side = 0.62 + 0.38 * cos(theta - 0.35)`, `blotch`, and the radial wall attenuation `floorBias` in both `STRESS_CHUNK` and `makeStressOverlayMaterial`. Under torsion, the cutter relief groove (undercut around `uStressCenterY = 10.41 mm`) experiences a uniform circumferential stress concentration around all `360°`.
   - **Full Hotspot Saturation in the Undercut (`field = 1.0`):** Make the axial core a flat-topped or wide super-Gaussian band across the entire relief groove floor and walls (`|dy| <= 1.1 mm` -> `field = 1.0`) so that for **`4140` (`uStressHotspotFos = 0.55`)**, the **entire undercut groove across the full width of the shaft is vivid RED (`jgFosColor(0.55)`)**, matching the red text and the `0.55` bar reading in `07-1.png`!
   - **Visible Gradient & Axial-Spread Shift Across `4140 (0.55)` -> `4340 (0.72)` -> `C300 (0.90)`:**
     * Align `FOS_STOPS` in `fosPresentation.ts` with the vertical CSS bar in `ShaftStoryLayer.tsx` so `0.55` (`4140`) is unmistakable **deep red**, `0.72` (`4340`) is **red-orange**, and `0.90` (`C300`) is **bright orange-yellow / amber** (matching the `0.90` marker right below `1.0` in `07-2.png`).
     * Also scale the axial spread width of the warm core/skirt with severity (e.g., `float severity = clamp((1.15 - uStressHotspotFos) / 0.60, 0.35, 1.0);` widening the red/orange/yellow axial transition zone at `0.55` and tightening it as the alloy strengthens to `0.72` and `0.90`) so the gradient visibly shifts both in **peak color** and **axial contour** when cycling through `4140`, `4340`, and `C300`!
     * Smooth the axial band edges (`smoothstep` at `uStressYMin` and `uStressYMax` instead of hard `step()`) and match Mark's reference band placement in `fea-input-shaft1.png` (concentrated in the relief groove and adjacent tooth-root/shoulder transition) and `fea-input-shaft2.png` (smooth hobbed runout band).
2. **Fix Issue 8 (`08.png`) in `src/scene/inspection/shaft/shaftRuntime.ts` (and `kinematics.ts` if needed):**
   - Ensure `legacyshaft` and `approvedshaft` have the **exact same `rotation.z`** during the axial wipe (`t = 22.6..25.0 s`, `schedule.wipe === true`): for example, ease `legacyAngle` to the nearest full revolution (`Math.round(legacyAngle / (2 * Math.PI)) * 2 * Math.PI`, i.e., `0 mod 2π`) between `t = 15.0 s` and `t = 22.6 s` (or offset `legacyshaft.root.rotation.z` so at `t >= 15.0 s` its mod-`2π` angle is `0`), so the 3 ball-detent pockets and shaft OD on `legacyshaft` and `approvedshaft` align to `0.000°` across `wipeZ`!
   - *(Note: Do **not** transform `wipeLegacy` / `wipeApproved` inside `shaftRuntime.ts:apply()`, because `RuntimeWorld.tsx:941–943` already calls `planes.restore(); runtime.apply(); planes.transform(runtime.root, registration)` via `shaftJourneyRegistration.ts` every frame! Keep `wipeLegacy` and `wipeApproved` in study-local coordinates inside `shaftRuntime.ts`.)*

---

### Session 1E — Exploded Gearbox Collapse Camera Repositioning (Issues 8/9 Text & `09.png`)

#### What Mark Sees (`09.png`)
- **Issues 8/9 Text (`09.png`):** *"Image 09.png shows the camera position when the exploded gear box collapses which, from the users perspective, is staring at a close-up of the rear handle and LCD, looking directly in line with the gearbox axis (and axis of explosion). The viewer should be elevated and nearer one side of the gearbox so the view has depth and shows movement."*

#### Exact Root Cause in Code
Look at `src/scene/torque-wrench/RuntimeWorld.tsx:1031–1058` and `src/scene/torque-wrench/MechanismDirector.ts:58`:
1. In `MechanismDirector.ts:58`, `const close = 1 - smooth((p - 0.94) / 0.04)` collapses `out.explode` from `1.0` (fully exploded) to `0.0` (fully assembled) over **`progress = 0.94 -> 0.98`** (`close-settle` beat).
2. At that exact same scroll window (`progress > 0.94 && progress < 0.995`), `RuntimeWorld.tsx:1037–1058` executes:
   ```ts
   if (!manual && progress > .94 && progress < .995 && hotspots[2].node) {
     const u = Math.max(0, Math.min(1, (progress - .94) / .015))
     const v = Math.max(0, Math.min(1, (progress - .975) / .02))
     const weight = u * u * (3 - 2 * u) * (1 - v * v * (3 - 2 * v))
     const display = hotspots[2].node
     display.updateWorldMatrix(true, false)
     lcdPose.target.copy(hotspots[2].local).applyMatrix4(display.matrixWorld)
     display.getWorldDirection(lcdNormal)
     lcdPose.position.copy(lcdPose.target).addScaledVector(lcdNormal, aspect < .8 ? .23 : .18)
     lcdPose.position.y += .025
     ...
     orbitCamera(handoffFrom, lcdPose, weight, ringAnchor, handoffResult, shortest >= 0 ? 1 : -1)
   ```
3. By `progress = 0.955` (when `explode` is right in the middle of collapsing!), `weight = 1.0` locks the camera at `lcdPose`: `18 cm` directly behind the rear handle along `lcdNormal` (`+Z`), staring straight down the gearbox/explosion axis at the rear handle and LCD (`09.png`)! From this dead-on axial position behind the handle, the viewer cannot see the planetary stages collapsing at all.

#### Required Fix (Session 1E)
1. **Remove the Axial Rear-Handle Camera Override During Collapse (`RuntimeWorld.tsx:1031–1058` & `JourneyCamera.ts:78–81`):**
   - Do **not** swing the camera behind the rear handle along `lcdNormal` while the exploded gearbox is collapsing (`progress = 0.94 -> 0.98`).
   - **Critical detail in `RuntimeWorld.tsx:1031`:** Currently line 1031 only calls `journeyCamera(...)` for `progress >= .56 && progress <= .94` (falling back to the raw provisional formula at lines 995–1002 for `p > 0.94`). Extend line 1031 to `progress >= .56 && progress <= 1.0` (or `<= .995`) and author the `0.94 -> 0.98` (`close-settle`) collapse camera transition directly inside `createJourneyCameraSampler()` in `src/scene/torque-wrench/JourneyCamera.ts:78–81`.
   - Specifically, across `progress = 0.94 -> 0.98` (`close-settle`), smoothly transition the camera from the exploded-hold side-three-quarter overview at `p = 0.94` (`position = (-0.62, 0.18, 0.32)`, `target = (0, 0, -0.15)`, `fov = 42` in `JourneyCamera.ts:78`) to an **elevated side-three-quarter assembled view** (for example, `position ≈ (-0.36, 0.22, 0.30)` or `(0.32, 0.22, 0.38)`, elevated `~25°–30°` and off to one side of the gearbox aiming at `target ≈ (0, 0, -0.04)`) so the viewer has a clear oblique side-elevated perspective with strong depth and parallax while watching all the exploded stages slide back together into the housing!
   - If the rear-handle LCD Manometer is visited at the very end (`close-ownership`, `p = 0.98 -> 0.995`, *after* `explode` has fully collapsed to `0` at `p = 0.98`), or framed from an elevated rear-three-quarter angle that still shows the side of the wrench body and the angled LCD face, ensure `p = 0.94 -> 0.98` stays on the elevated side-three-quarter collapse shot.
2. **Update `scripts/verify-torque-camera-hud.mjs`:**
   - Update any camera/hotspot checkpoint assertion in `scripts/verify-torque-camera-hud.mjs` that previously coupled `lcd-manometer` visibility to `p = 0.955` during the mid-collapse window so it checks the collapse camera's off-axis side-elevated framing during `0.94..0.98` and checks `lcd-manometer` at its updated window.

---

## 5. Verification Gates (Session 2 — Lead / Verifier)

Before concluding the project, the Lead Agent must run and record:
1. `npm run typecheck` — must exit `0`.
2. `npx vitest run --testTimeout=60000` — all unit and integration suites must pass (`0` failures).
3. `npm run build` — production bundle must build cleanly.
4. Restart the preview server (`npx vite preview --port 5341 --host localhost`) and run Playwright verification against `http://localhost:5341/torque-wrench/`:
   - `node scripts/verify-torque-camera-hud.mjs --url=http://localhost:5341/torque-wrench/`
   - Capture verification screenshots corresponding to all nine owner items:
     * **Check 1–3 (`p = 0.18`, `0.28`, `0.35`):** Drafting sheet profile view, crossing leaders, and `Detail C` circle render in uniform dark navy blue inside and outside the profile perimeter, with `Detail C` 100% unclipped.
     * **Check 4 (`p = 0.480`):** Isolated Ring Switch knurling — OSHA Blue paint groove is `0%` visible (faded out with the Clutch Housing).
     * **Check 5 (`p = 0.480`, `0.520`, `0.545`, `0.590`, `0.900`):** Zero callout labels visible during Ring Switch knurling (`0.460–0.505`) or Input Shaft isolation/study (`0.560–0.855`); active callouts use `main`-branch engineering HUD styling with **zero crossing leader lines**.
     * **Check 6 (`p = 0.515` vs `p = 0.550`):** At `p = 0.515` (`shift = 0`, down), OSHA Blue groove is clearly visible on the snout side; at `p = 0.550` (`shift = 1`, up), OSHA Red groove is clearly visible on the handle side.
     * **Check 7 (`subjectTime = 16.5 s` `4140`, `19.0 s` `4340`, `21.5 s` `C300`):** Full circumference of the Input Shaft cutter relief groove (undercut) is vivid red at `4140 (0.55)`, shifting visibly to red-orange at `4340 (0.72)` and orange-amber at `C300 (0.90)` in lockstep with the right-hand vertical FOS bar.
     * **Check 8 (`subjectTime = 23.8 s` mid-wipe):** Input Shaft horizontal wipe (`legacyshaft` -> `approvedshaft`) has zero rotational phase seam across the ball-detent pockets.
     * **Check 9 (`p = 0.955` & `p = 0.965`):** Exploded gearbox collapse is viewed from an elevated side-three-quarter angle showing the full gearbox depth and axial collapse motion rather than staring straight at the rear handle/LCD.
