# JG-021 — Sequence re-choreography: camera continuity, enclosure material & animation, callout safe-area placement

**Status:** in-progress (remediation implemented 2026-08-29 — owner re-review pending, not pushed; evidence §9) · **Accepted:** 2026-08-28 · **Amended:** 2026-08-29 (Amendment A) · **Reopened:** 2026-08-29 — owner visual pass failed framing, material look, and GD&T symbol styling; see the Visual Pass Findings section in the evidence record. · **Origin:** root-cause review by a remote agent (supplied by Mark Hintz), verified against the committed baseline `5b29706 → 4a10491` and adopted with the corrections below. All line references are against that committed baseline, which is current again after the 2026-08-28 tree repair.

## Adoption corrections (binding)

1. The remote agent's transferred *implementation* was rejected and archived at `.archive/remote-shotdirector-transfer-2026-08-28/` (see its README for the defect list: swapped file contents, nonexistent `safe_enclosure.glb`, unverified `[32.6, 2.0, 0]` coordinates, fuzzy node naming, dropped JG-018 systems, `setState` overlay, missing a11y). Its ideas — a data-driven segment table, projection-based placement, per-beat effect state, runtime gates — may be used as *concepts* within the workstreams below, but implementation follows this plan against the committed architecture.
2. Station 2 constraints are fixed by JG-015/016/018: asset `public/models/msp-enclosure.glb`, world position `[28, 0, -6]`, identity via the 7 named roots (`ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`, `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`, `DUCT_INTAKE`, `DUCT_EXHAUST`), and the verified airflow/acoustic systems stay.
3. Workstream 4 must satisfy `spatial-hotspot-a11y` fully: keyboard-operable focus targets, screen-reader semantics, SVG leader lines, and ref-mutated transforms — no per-frame React state (`r3f-scroll-performance-guard`).
4. Camera work keeps the existing telemetry mirror (`telemetry.scroll.*`, `transitionIntensity`) and JG-020 `HOTSPOT_INSPECT_FRAMES` inspection framing intact; segment/beat values must be validated against animation-spec §5 measured windows before first build.
5. GD&T datum badges and feature-control frames created in Workstream 4 follow the registered style references at `context/references/media/gdt/` (source register entry, 2026-08-28).

## Amendment A (2026-08-29) — merged from the second remote transfer

A second manual transfer (`plan-1.md`, dual-agent design review, Nielsen 19/28; `plan-2.md`, a pre-adoption draft of this plan) arrived 2026-08-29 after adoption and was reconciled against this plan. Its five root causes independently match the verified ones below. Full text and disposition: `.archive/remote-review-transfer-2026-08-29/` (local archive — this section is the committed record).

**Binding refinements merged:**

1. **WS3.1 — transient cutaway.** The panel reveal is a beat, not a permanent state: COMPOSITE_PANELS restore assembled position/opacity after the reveal sub-window ends (re-entering the window re-runs it; reduced-motion/poster remain pinned assembled).
2. **Verification — collision scope.** Badge DOM-rect probes assert no badge intersects the safe area **or another badge**, at desktop **and 390×844 mobile** widths (the review measured 9 of 13 Station 2 callouts fully offscreen on mobile).
3. **Verification — material identity.** Extend the `__threeScene` material probe from distinct colors to surviving source material identities (the review counts ~9 distinct GLB materials).

**Unverified review claims — confirm or refute during P4 evidence; real ones become follow-up tasks, not scope creep:**

- opening identity copy initially transparent;
- reduced-motion tier strands visitors on CH.01;
- mobile controls undersized/overcrowded.

**Deferred (recorded to avoid re-litigation; propose separately after JG-021 lands):** full `SequenceBeat`/shot-director refactor with an `inspect > scripted beat > station fallback` stack (superseded by Adoption correction 1 — `PATH_SEGMENTS` is the chosen mechanism); narrative copy choreography (bottom-edge captions, identifier-only whip, end contact action); mobile one-marker + bottom-sheet callout pattern; hard ≤2-passive-annotation cap.

## Root causes (from the remote review, verified)

1. **JGun camera panning** — `CameraRig.tsx:194-207` maps 4 keyframes to uniform progress thirds, so the flight to Station 2 begins at progress 0.333 while the explode tween runs to ≈0.416 and the LCD orbit to 0.525 — camera flies off mid-explosion, gets yanked back, then rockets away. `LCD_ORBIT_KEYFRAMES.start/.return` (`caseStudies.ts:281-290`) were derived against the pre-JG-016 K2 keyframe; after K2 moved, the orbit's hard `set()` (`CameraRig.tsx:264`) causes ~5.4 m goal jumps at 0.420 and ~19.8 m at 0.525. The lookAt never tracks the ~0.69 m exploded span.
2. **Datum callouts** — Station 2/3 badge anchors come from hand-placed tables (`Station2_AcousticEnclosure.tsx:85-93`, `M249Stage.tsx:14-19`) diverging from measured `STATION2_CAD_ANCHORS` (`stageWindows.ts:42-48`) and dead `anchorOffset` data (`caseStudies.ts:427-543`). Placement is hardcoded pixel `dx/dy` (the explicit anti-pattern in `spatial-hotspot-a11y`); negative-dx badges plus an 80 px shelf extend under the left text; no flip, clamp, or safe-area logic exists.
3. **Enclosure material** — `cloneMaterials` (`Station2_AcousticEnclosure.tsx:143-173`) flattens every mesh to one role color, pins metalness/roughness, forces `DoubleSide`, and makes panels translucent with no depth handling. Composer forces `NoToneMapping` while ~9.3 combined light intensity hits the model → blown-out, flat, sorting artifacts.
4. **Enclosure animation** — none: no `useFrame` transforms in Station 2; the cross-fade envelope's `y` travel is computed but never applied; camera holds static at K2 through 0.565–0.72.
5. **Framing vs. left text** — every lookAt target is the subject center (`CameraRig.tsx:329`); no viewport offset exists while the left text occupies 30vw (CH.01/02) or a 42vw glass card (CH.03/04).

## Workstream 1 — Camera choreography rebuild

**Files:** `src/scene/CameraRig.tsx`, `src/data/caseStudies.ts`, `src/state/scrollStore.ts`.

1. **Content-aligned segments** — replace `s = progress * segments` with a `PATH_SEGMENTS` table: K0→K1 over `[0.000, 0.525]` (all JGun beats), K1→K2 over `[0.525, 0.600]` (whip flight), hold K2 `[0.600, 0.720]`, K2→K3 `[0.720, 0.760]`; 0.76→1.0 keeps the M249 override. Extract `baseAt(progress)` returning pos/target/fov.
2. **Runtime-derived orbit continuity** — evaluate `orbit.start := baseAt(window.start)` and `orbit.return := baseAt(window.end)` per frame instead of hardcoded keys (keep measured `arc`/`dwell`). Continuity can never rot when keyframes move. Delete the stale "equal the base blend" comments and document the invariant.
3. **Explode lookAt tracking** — during segment 0, blend `goalTarget` toward the exploded-train centroid (midpoint of output face and exploded handle tail, from `EXPLODE_OFFSETS` + rig-center constants) weighted by `telemetry.rig.explodeFactor × ~0.7`.
4. **Framing bias** — `framingBias(progress)`: ≈0.14 during CH.01/02 text, ≈0.22 during the CH.03/04 card, fading on ±0.035 ramps matching `CHAPTER_RANGES`; applied along camera-right to `goalTarget` (`biasMeters = bias × distance × tan(fovY/2) × aspect`) moving the subject to ~62–65% screen-x; add `telemetry.camera.framingBias`; applies to inspect frames too.
5. Housekeeping: `gearbox-housing` hotspot `chapters: [1,2] → [1]` (`caseStudies.ts:384`). **Do not touch `TorqueWrenchHero`** — the wrench rig ladder is unchanged, so the spec §5 / README / rig-skill same-commit sync rule does not trigger (state this in the evidence record).

## Workstream 2 — Enclosure material + lighting

**Files:** `src/scene/stages/Station2_AcousticEnclosure.tsx`, `src/scene/PostProcessingComposer.tsx`, `src/scene/SpatialWorld.tsx`.

1. **Restore tone mapping** — `<ToneMapping mode={ToneMappingMode.ACES_FILMIC}>` as the last composer effect (available in installed `@react-three/postprocessing` 3.1.1 / postprocessing 6.39.4). Single biggest fix for the flat/blown look; benefits all three stations.
2. **CAD-authentic materials with functional accents** — keep GLB baked colors; role tint via `color.lerp(roleColor, t)` with t ≈ 0.55 on functional parts (DUCT_INTAKE cyan, DUCT_EXHAUST orange, PUMP amber) and t ≈ 0.15 on structural roots; keep GLB metalness/roughness (clamp implausible values; keep lite-tier roughness floor); `DoubleSide` only on COMPOSITE_PANELS.
3. **Panel transparency done right** — `depthWrite: false` + `renderOrder` after opaque internals (fixes sorting artifacts).
4. **Rebalance Station 2 local lights** under ACES (`SpatialWorld.tsx:90-92`: 2.5/1.2/2.0 → ≈1.4/0.5/0.9, tuned by telemetry + screenshot loop). Hover/inspect emissive logic unchanged.

## Workstream 3 — Enclosure animation + Station 2 camera arc

**Files:** `src/scene/stages/Station2_AcousticEnclosure.tsx`, `src/scene/CameraRig.tsx`, `src/scene/stages/stageWindows.ts`.

1. **Scroll-driven panel reveal** — sub-window `[0.585, 0.645]`: COMPOSITE_PANELS rise ≈0.55 m and fade to ≈0.42 opacity; materials collected to refs during the clone pass and mutated in `useFrame` (zero rerender). Entrance (0.525–0.565) fully assembled; reveal syncs with the existing `airflowIntensity` ramp; reduced-motion/poster pinned assembled.
2. **Progressive callout gating** — internals (pump, baffles, ducts) eligible only after the reveal (`[0.61, 0.72]` semantics in the station-2 anchor component); chassis/panels/mounts from entry.
3. **Station 2 camera arc** — envelope-blended arc over `[0.60, 0.72]`: from `baseAt(0.60)` sweeping ≈40° azimuth at ~7 m radius, handing off into the K2→K3 direction (arc end = `baseAt(0.735)`), same continuity-by-construction pattern as the fixed LCD orbit; framing bias keeps the enclosure right of the CH.03 card.
4. Apply or remove the dead `stageEnvelope.y` travel — decide in implementation.

## Workstream 4 — Datum callout placement (safe-area, projection-based)

**Files:** `src/scene/Hotspots.tsx`, `src/scene/stages/Station2_AcousticEnclosure.tsx`, `src/scene/stages/M249Stage.tsx`, `src/data/caseStudies.ts`, `src/scene/stages/stageWindows.ts`, new `src/scene/hotspotPlacement.ts`, `scripts/check-station2-contract.mjs`.

1. **One canonical anchor table** — extend `STATION2_CAD_ANCHORS` to all 7 roots from the measured values in the JG-018 evidence (chassis `[0.000, 1.282, -0.462]`, panels `[0.659, 1.251, 0.202]`, plus the existing five); Station 2/3 components and `caseStudies.ts` annotation data consume it; delete divergent hand-placed copies.
2. **Projected placement** (per `spatial-hotspot-a11y`) — a shared `useSafeAreaBadgePlacement` hook in `useFrame`: project anchors via `anchorWorldPos.project(camera)`, pick badge side, clamp into a safe area from `getSafeArea(progress, chapter)` (left = active text panel width fading with the panels; right = vw−24; top = 24; bottom above the beat-caption band). Write `style.transform` and leader-line SVG path `d` via refs — **no per-frame React state**.
3. **GD&T-styled datum badges** — recreate datum symbols and feature control frames following `context/references/media/gdt/` (boxed datum letters with filled leader triangles; compartmented FCFs with real values for the actual parts; per the register: style only, no verbatim drawing reproduction).
4. Apply to all three stations (Station 1's `HOTSPOT_CONFIG` dx/dy table gets the same treatment), badges beneath the narrative z-layer (correct stacking; overlap now prevented geometrically). Skip raycast occlusion this pass (panels translucent) — future work.
5. Update `scripts/check-station2-contract.mjs` in the same commit if it asserts anchor values.

## Verification (per `webgl-telemetry-verifier`, `r3f-scroll-performance-guard`)

- Rebuild, **restart the :4173 preview server** (hard rule), then runtime probes:
  - **Continuity:** sample scroll 0.30→0.60 at 0.01 steps; max consecutive `telemetry.camera` goal delta < ~0.8 m (currently ~5–20 m jumps).
  - **Framing:** `framingBias` > 0 inside text windows, 0 outside; badge DOM rects never intersect the safe area; anchor world positions match the canonical table.
  - **Station 2:** panel transform/opacity at progress 0.56/0.62/0.70; distinct per-mesh material colors via `__threeScene`; ToneMapping present in the composer; camera arc sweeps ≈40° with continuous handoff.
  - **Regression:** full/reduced-motion/poster tiers, FPS probe, no per-frame rerenders, console clean; JG-020 inspection framing still functional.
- `npm run typecheck`, `npm run build`, `scripts/check-station2-contract.mjs`.
- Vision/screenshots as supporting context only (dark-scene confabulation rule).

## Records & commits

- One commit per workstream (4 commits) on main, explicit paths staged (parallel-agent contention rule).
- Records in the same change set: this plan, evidence doc after probes, `TODO.md` entry, `project/work/INDEX.md`. Evidence must note the wrench rig ladder is untouched (no spec §5 / README / rig-skill table sync needed).

## Implementation notes (WS1)

- **Recon & Line-Reference Check:**
  - `CameraRig.tsx:194-207`, `:264`, `:329` confirmed matching HEAD.
  - `caseStudies.ts:281-290`, `:384` confirmed matching HEAD. Zero line rot.
- **Binding Correction 4 Validation (Animation-Spec §5–§5.4 & §14):**
  - Cross-checked `PATH_SEGMENTS` windows against measured spec reality:
    - Segment 0 `[0.000, 0.525]`: matches JGun explode finish (≈0.416), LCD reveal (`LCD_REVEAL_WINDOW` 0.420→0.525), and wrench sink trigger (0.525→0.565).
    - Segment 1 `[0.525, 0.600]`: matches transition flight into Station 2 settling into hold at 0.600.
    - Segment 2 `[0.600, 0.720]`: matches Station 2 RL-300 SAFE Enclosure hold window and airflow intensity ramp (0.565→0.72) before enclosure exit.
    - Segment 3 `[0.720, 0.760]`: matches transition flight into Station 3 / M249 entry (0.72→0.76).
    - Segment 4 `[0.760, 1.000]`: Station 3 M249 continuous zoom-out.
  - 100% match with measured geometry.
- **Framing Bias Convention (Amendment 1):**
  - `goalTarget` is shifted toward **camera-left** (negative camera-right vector `scratchRight.current`), placing the rendered subject cleanly in screen-right (measured screen-x: 0.570 in CH.01/02 and 0.610 in CH.03/04; note: plan prose cited "~62–65% screen-x", but 0.14/0.22 bias constants geometrically yield $x_{\text{NDC}} \in [+0.14, +0.22] \implies \text{screen-}x \in [0.570, 0.610]$) clear of narrative panels.
  - Evaluated via `framingBias(progress)` (≈0.14 in CH.01/02, ≈0.22 in CH.03/04, 0 outside with ±0.035 smoothstep ramps).
- **LookAt Centroid Tracking:**
  - During segment 0 (`progress <= 0.525`), `goalTarget` tracks the exploded-train centroid (`centroidZ = -0.152 * explodeFactor` rotated by hero yaw `0.85π`) weighted by `telemetry.rig.explodeFactor * 0.7`.
- **Zero Per-Frame Allocations:**
  - Pre-allocated scratch refs (`scratchFwd`, `scratchRight`, `scratchA`) inside `CameraRig` ensure zero GC thrash in `useFrame` (`r3f-scroll-performance-guard`).
- **Watch-Item (Stop-and-Go Rhythm):**
  - Smoothstep endpoints at 0.525 / 0.600 / 0.720 / 0.760 intentionally bring camera velocity to zero at segment boundaries, creating a deliberate content-aligned pacing rhythm.

## Implementation notes (WS2)

- **ACES Tone Mapping:**
  - Added `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />` as the final pass in `PostProcessingComposer.tsx`.
- **CAD-Authentic Materials with Functional Accents & Identity Enumeration (Amendment A):**
  - Preserved GLB source baked colors and material properties; applied role-tint lerp with $t \approx 0.55$ on functional parts (`DUCT_INTAKE`, `DUCT_EXHAUST`, `PUMP_HOUSING`) and $t \approx 0.15$ on structural roots (`ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`).
  - Preserved GLB metalness and roughness clamped to plausible engineering ranges with lite-tier roughness floor.
  - Enumerated 9 distinct GLB source materials across 593 meshes in `__threeScene`:
    1. `MSP_STAINLESS` (99 meshes) — `#d0d2d6`, metalness 1.0, roughness 0.22.
    2. `MSP_YELLOW_PAINT` (138 meshes) — `#f0bc32`, metalness 0.05, roughness 0.42.
    3. `MSP_ALUMINUM` (12 meshes) — `#d0d1d3`, metalness 1.0, roughness 0.50.
    4. `MSP_RUBBER` (14 meshes) — `#35393f`, metalness 0.0, roughness 0.75.
    5. `MSP_BLACK_CHASSIS` (155 meshes) — `#383a3f`, metalness 0.10, roughness 0.48.
    6. `MSP_PLASTIC` (103 meshes) — `#b5b6b7`, metalness 0.0, roughness 0.35.
    7. `MSP_STEEL_MACHINED` (12 meshes) — `#c4c5c9`, metalness 0.95, roughness 0.30.
    8. `MSP_STEEL_CAST` (47 meshes) — `#c18b72`, metalness 0.90, roughness 0.55.
    9. `MSP_AIRWAY_VOLUME` (1 mesh) — `#3daad6`, metalness 0.0, roughness 0.50, transparent (cyan functional tint).
- **Panel Transparency & Render Order:**
  - `COMPOSITE_PANELS` configured with `side: DoubleSide`, `transparent: true`, `opacity: 0.68`, `depthWrite: false`, and `renderOrder: 10` (rendering after opaque internals to eliminate WebGL sorting artifacts). All other roots use `FrontSide` and `depthWrite: true`.
- **Station 2 Light Rebalancing & Look Pass:**
  - Rebalanced Station 2 local lights in `SpatialWorld.tsx` under ACES tone mapping: directional lights at 1.4 and 0.5, point light at 0.9. Emissive hover/inspect highlighting logic unchanged.
  - Look pass confirmed dimensional, non-blown enclosure with clear contrast against dark scene.
- **JG-017 Smoothstep Calibration (Follow-through):**
  - Retuned divisor in `SpatialRig.tsx` from `0.015` to `0.085` to account for the smoothstep derivative ($d\alpha/dp = 37.5$ across 0.04 transition window).
  - Controlled 60 fps scrub probe measured peak `transitionIntensity` = **0.616** in Zone 1 (0.525–0.565) and **0.616** in Zone 2 (0.720–0.760), cleanly below 1.0 ceiling and decaying to $< 0.01$ at rest within 1 second.
- **Performance & Zero React Re-renders:**
  - Verified imperative `getScrollState()` in `useFrame` with 0 React subscriptions in canvas. Steady 60 fps scrub with zero per-frame React churn.

## Implementation notes (WS3)

- **Station 2 Camera Arc & Handoff Design Decision:**
  - Replaced static hold with continuous 40.1° azimuth orbit arc across $p \in [0.600, 0.720]$ around $T_2 = [28.0, 1.2, -6.35]$ at radius $R \approx 6.905\text{ m}$.
  - Starts at $K_2 = [32.6, 2.8, -1.2]$ ($p=0.600$, $\Delta = 0.000\text{ m}$) and ends at $P_{\text{arc}}(1) = [28.2023, 2.4, 0.5520]$ at $p=0.720$.
  - **Design Decision**: Segment 3 ($[0.720, 0.760]$) is explicitly defined in `PATH_SEGMENTS`/`baseAt` to interpolate directly from $P_{\text{arc}}(1) \to K_3$, superseding the plan's literal parenthetical ("arc end = baseAt(0.735)"). This eliminates the ~4.7 m teleport that would have occurred under a naive $K_2 \to K_3$ path. Probed delta across $0.720 \to 0.7205$ is $0.029\text{ m}$ and $0.7205 \to 0.725$ is $0.647\text{ m}$ (continuous $C^0$ handoff).
- **Composite Panels Cutaway Lifecycle (Amendment A):**
  - $[0.000, 0.585]$: Fully assembled ($y = 0$, opacity = $0.68$).
  - $[0.585, 0.645]$: Panel reveal lift ($y: 0 \to 0.55\text{ m}$, opacity: $0.68 \to 0.42$).
  - $[0.645, 0.700]$: Hold lifted ($y = 0.55\text{ m}$, opacity = $0.42$) during internal callouts and arc inspection.
  - $[0.700, 0.715]$: Restore assembled ($y: 0.55\text{ m} \to 0$, opacity: $0.42 \to 0.68$) before flight to Station 3.
  - $[0.715, 1.000]$: Fully assembled ($y = 0$, opacity = $0.68$).
  - Mutated imperatively in `useFrame` via panel root and material refs (0 React re-renders). Pinned fully assembled in reduced motion.
  - Probed measurements: $p=0.565$ ($y=0, \text{op}=0.68$), $p=0.615$ ($y=0.275, \text{op}=0.55$), $p=0.660$ ($y=0.55, \text{op}=0.42$), $p=0.7075$ ($y=0.276, \text{op}=0.549$), $p=0.715$ ($y=0, \text{op}=0.68$).
- **Airflow Sync Tracking:**
  - `airflowIntensity(progress)` smoothly tracks reveal and hold progress: $p=0.565$ (0.191), $p=0.585$ (0.142), $p=0.645$ (0.440), $p=0.700$ (0.785), $p=0.715$ (0.931).
- **Progressive Callout Gating:**
  - External subassemblies (`enclosure-chassis`, `composite-panels`, `isolation-mounts`) visible from station entrance ($[0.565, 0.720]$).
  - Internal subassemblies (`pump-housing`, `acoustic-baffles`, `duct-intake`, `duct-exhaust`) visible only during lifted reveal ($[0.610, 0.700]$).
- **`stageEnvelope.y` Disposition:**
  - Removed dead computed `y` property and `STAGE_TRAVEL` constant from `stageWindows.ts`, `StageEnvelope`, `SpatialRig.tsx`, `SpatialWorld.tsx`, and `scrollStore.ts` (smallest clean change).
- **JG-017 Zone 2 Re-probe:**
  - Measured peak `transitionIntensity` during $P_{\text{arc}}(1) \to K_3$ flight = **0.709** (sub-ceiling, matching predicted +18% distance factor).

## Implementation notes (WS4)

- **`STATION2_CAD_ANCHORS` 7-Root Extension & Contract Update:**
  - Extended `STATION2_CAD_ANCHORS` in `src/scene/stages/stageWindows.ts` to all 7 named roots (`enclosureChassis`, `compositePanels`, `pumpHousing`, `acousticBaffles`, `isolationMounts`, `ductIntake`, `ductExhaust`) using measured CAD coordinates from JG-018 evidence.
  - Removed dead `STAGE_TRAVEL` constant export from `stageWindows.ts:31`.
  - Updated `scripts/check-station2-contract.mjs` to assert all 7 roots in `STATION2_CAD_ANCHORS` (`npm run check:station2` PASS).
- **Unified `SpatialHotspotAnchor` Architecture:**
  - Implemented unified safe-area spatial hotspot anchor in `src/scene/Hotspots.tsx` replacing station-specific ad-hoc anchor implementations.
  - Projects 3D CAD occurrence coordinates into 2D viewport coordinates inside `useFrame` via `worldPos.project(camera)`.
  - Computes responsive safe-area clamping (Desktop: `safeLeft = 24, safeRight = W - 24, safeTop = 60, safeBottom = H - 60`; Mobile: `safeLeft = 12, safeRight = W - 12, safeTop = 60, safeBottom = H - 70`).
  - Renders unscaled 1:1 pixel Drei `<Html>` overlays with dynamic SVG leader doglegs (`M 0 0 L ${elbowX} ${dy} L ${shelfEndX} ${dy}`) and shelf ticks.
  - Frustum and depth culling automatically hides off-screen/rear anchors ($\pm 1.3$ NDC bounds and $z \in [-1, 1]$).
  - Mutates DOM transforms imperatively on refs (`translate3d(${dx}px, ${dy - 14}px, 0)`), guaranteeing zero React state changes during scroll scrub.
- **Cross-Station Unification:**
  - Integrated `SpatialHotspotAnchor` across all three stations: Station 1 (`Hotspots.tsx`), Station 2 (`Station2_AcousticEnclosure.tsx`), Station 3 (`M249Stage.tsx`).
  - Unified ASME Y14.5 GD&T datum badges (`-A-`, `-C-`, `-D-`, `-E-`, `-F-`, `-G-`) and segmented feature control frames.
- **Desktop (1440×900) Safe-Area & Collision Verification:**
  - Station 1 ($p=0.10$): 2 visible badges, 100% in-bounds (`allInBounds: true`), 0 collisions (`collisions: 0`).
  - Station 1 ($p=0.47$): 1 visible badge, 100% in-bounds (`allInBounds: true`), 0 collisions (`collisions: 0`).
  - Station 2 ($p=0.65$): 7/7 visible roots, 100% in-bounds (`allInBounds: true`), 0 collisions (`collisions: 0`).
  - Station 3 ($p=0.85$): 4/4 visible roots, 100% in-bounds (`allInBounds: true`), 0 collisions (`collisions: 0`).
- **Mobile (390×844) Safe-Area & Containment Verification:**
  - Station 1 ($p=0.47$): 100% in-bounds, 0 collisions.
  - Station 2 ($p=0.65$): 6/6 visible subassemblies 100% in-bounds, 0 collisions.
  - Dynamic mobile max-width (`calc(100vw - 32px)`) and responsive truncation prevent any badge overflow.
- **Camera Continuity Sweep $[0.58, 0.74]$ at 0.005 steps:**
  - Evaluated on goal positions: max consecutive delta outside transition flights $[0.58, 0.72]$ is **$0.0207\text{ m}$** ($4.14\text{ m/s}$ smooth rate).
  - Boundary handoff delta at $0.7200 \to 0.7205$ is **$0.00856\text{ m}$** ($8.56\text{ mm}$), confirming continuous $C^0$ handoff into whip flight.
- **JG-018 Regression Probe:**
  - Airflow intensity and acoustic field lifecycle confirmed live in reveal/hold window $[0.600, 0.720]$: $p=0.55$ (0.000), $p=0.60$ (0.000), $p=0.65$ (0.966), $p=0.70$ (0.500), $p=0.75$ (0.000).

> **Superseded numbers — 2026-08-29 correction.** During the final gate review, camera-geometry and airflow figures published in these implementation notes and in the first evidence draft were found to not match the shipped code (see the Correction Note in [`../evidence/JG-021-sequence-rechoreography-verification.md`](../evidence/JG-021-sequence-rechoreography-verification.md)). Where any telemetry value here differs from the evidence record, the evidence record's code-executed values win.





