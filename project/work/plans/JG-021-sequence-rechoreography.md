# JG-021 — Sequence re-choreography: camera continuity, enclosure material & animation, callout safe-area placement

**Status:** queued · **Accepted:** 2026-08-28 · **Amended:** 2026-08-29 (Amendment A) · **Origin:** root-cause review by a remote agent (supplied by Mark Hintz), verified against the committed baseline `5b29706 → 4a10491` and adopted with the corrections below. All line references are against that committed baseline, which is current again after the 2026-08-28 tree repair.

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
