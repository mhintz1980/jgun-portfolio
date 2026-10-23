# Claude Code Project — Master Orchestration Brief & Audit Report (2026-10-23)

**Repository:** `mhintz1980/jgun-portfolio`
**Primary Starting Branch:** `torque-wrench/rebuild`
**Secondary Branch to Merge in Session 0:** `origin/quiet-machine/integration` (commit `b219960d`, merge-base `9edfa552`, 3-way merge is conflict-free)
**Cloud Environment Note:** All required GLBs (`Default.glb`, `knurling-tool.glb`, `manufacturing-core-full.glb`, `manufacturing-core-lite.glb`, `msp-enclosure.glb`, `rl300-lite.glb`, `rl300-extra-parts.glb`), Draco WASM decoders (`public/draco/`), drawing cache (`public/drawing/jgun-sheet-v2.bin.gz`), fonts (`public/fonts/`), and 30 WebP posters (`public/images/` and `public/inspection/shaft/`) are tracked directly in Git on these two branches. **Never run `npm run sync-assets` in the cloud** (it is a Windows-only PowerShell script referencing `C:\Projects\CAD`). Use `npm run build` (`tsc && vite build`) and `npm test` (`vitest run`).

---

## 1. Stated Goal

Unify `origin/torque-wrench/rebuild` and `origin/quiet-machine/integration`, resolve all remaining technical and visual defects in the Torque Wrench rebuild (`JG-038`) and Quiet Machine (`JG-033`) experiences, eliminate the `Three.js` entry-chunk preload leak and duplicate Draco assets, strip all M249 runtime and asset exposure for initial launch, and produce a verified, deployment-ready multi-page production build for `studiomark.dev` (serving Torque Wrench and The Quiet Machine, without M249).

---

## 2. Architecture & Branch State Summary

1. **Two Active Branches to Unify Immediately:**
   - `origin/torque-wrench/rebuild` (contains `JG-038` private rebuild at `/torque-wrench/`, `src/scene/torque-wrench/*`, Doc 39/42/44 fixes through `7bf71c16`, and the `?debug=rig` / `?rig=cinematic` sandbox from `8efb50e6`).
   - `origin/quiet-machine/integration` (`b219960d`, contains `JG-033` `/quiet-machine/`, `src/scene/rl300/*`, `BackgroundDirector.tsx` S4 layered background shader, `IntakeHotspot.tsx`, `beats.ts`, V16 frame shifts `9b6d1f52`, regenerated `public/models/rl300-lite.glb` `1,186,488 B`, `public/models/rl300-extra-parts.glb` `387,588 B`, and 14 Blender WebP posters `public/images/rl300-shot-01..07-poster[-960].webp`).
   - **Merge compatibility:** `git merge origin/quiet-machine/integration` into `torque-wrench/rebuild` has **zero textual conflicts**.
   - **Post-merge reconciliation required:**
     * In `src/shared/pages.ts`, keep `torque-wrench` active (`reserved: false`).
     * In `src/shared/posterGuard.test.ts:17`, update the test string `/images/rl300-exterior-preview.png` (deleted by `quiet-machine/integration` when migrating to the 14 WebP posters) if any test checks disk existence.

2. **Three Coexisting Scene Architectures in the Repo:**
   - **Route 1 — Rebuilt Torque Wrench (`/torque-wrench/`, `src/torque-wrench-main.tsx` -> `TorqueWrenchPage.tsx` -> `Scene.tsx` -> `RuntimeWorld.tsx`):** The modern `JG-038` implementation with zero `Three.js` in its initial HTML entry, page-local store, and full Ring Switch + Input Shaft manufacturing inspections.
   - **Route 2 — Rebuilt Quiet Machine (`/quiet-machine/`, `src/quiet-machine-main.tsx` -> `QuietMachinePreview.tsx` -> `QuietMachineScene.tsx`):** The modern `JG-033` RL300 enclosure cross-section study (702/702 tests green on `quiet-machine/integration`).
   - **Route 3 — Legacy Root (`/`, `src/main.tsx` -> `src/App.tsx` -> `SceneCanvas.tsx` -> `SpatialWorld.tsx`) + Cinematic Sandbox (`CinematicRigRoute.tsx`):** Legacy multi-station page that still mounts Station 1 (JGun), Station 2 (old RL300), and Station 3 (`M249Stage.tsx` loading `/models/m249-transformed.glb`).

3. **Hard Asset Protection Rules (`AGENTS.md`):**
   - **NEVER** run `gltfjsx --transform` on `public/models/m249-transformed.glb` or `public/models/msp-enclosure.glb`.
   - Part numbers (`A000606`, `K000004`, `P000725`, `P003068`, `P001835`, etc.) are the immutable key.
   - If canonical explosion ladder offsets ever change, update `project/context/architecture/animation-spec.md` §5, `README.md`, and `.agents/skills/` tables in the same commit.

---

## 3. Exact Defects & Inefficiencies to Fix (Wave-by-Wave Specs)

### Wave 0 — Branch Unification & Baseline Verification (Lead / Session 0)
- Merge `origin/quiet-machine/integration` (`b219960d`) into `torque-wrench/rebuild`.
- Run `npm ci`, `npm run typecheck`, and `npx vitest run src/shared`.

### Wave 1 — Fix the 5 Remaining `JG-038` Technical Defects (Parallel Sessions)

#### Session 1A: Opening Fragment Print Gate & Cavern Ring-5 Fold Fix
- **Files owned:** `src/scene/torque-wrench/privateSheetRuntime.ts`, `src/scene/torque-wrench/PitGeometry.ts`, `src/scene/drawing/sheet/portalGeometry.test.ts`, `src/scene/torque-wrench/PitGeometry.test.ts`.
- **Defect 1A-1 (Premature Uniform Fragment Print Fade in `7bf71c16`):**
  - In `src/scene/torque-wrench/privateSheetRuntime.ts:233,696`, `7bf71c16` changed `paperFragment` to `c = mix(c, vec3(.06, .09, .18), ink * .78 * max(uFragmentInk, smoothstep(0.0, .02, uFracture)))` with `u.uFragmentInk.value = proof ? 1 : reveal[GROUP.side]`.
  - Because `uFragmentPrint` (`src/scene/drawing/sheet/breakthrough.ts:81`) is a static `2048x1280` canvas texture baked at load with all strokes and fills already drawn, fading `uFragmentInk` linearly with `reveal[GROUP.side]` (`t = 0.29..0.37`) fades the entire finished side profile, dimensions, and labels in all at once across the 99 Voronoi fragments while `lines` and `fills` are still drawing stroke-by-stroke.
  - **Fix:** Gate `uFragmentInk` so intact stock shows only the progressive `lines` and `fills` instanced meshes while `reveal[GROUP.side] < 1`, and only blends in `uFragmentPrint` once `GROUP.side` is complete (`smoothstep(0.98, 1.0, uFragmentInk)`) or as `uFracture` starts (`smoothstep(0.0, 0.02, uFracture)`).
- **Defect 1A-2 (Inherited Unit Test Failure in `portalGeometry.test.ts:129` — `private ring 5: expected [ 2365, 2367 ] to be null`):**
  - In `src/scene/torque-wrench/PitGeometry.ts:103-116`, `makePrivatePitGeometry` computes radial displacement `clearance` using un-smoothed `Math.floor(sector * PRIVATE_PIT_ANGULAR_CELLS + ...)` step jumps. On the real ~3,000-vertex tracked wrench contour (`profilePoints`), non-star-convex/re-entrant segments around indices `2365..2368` cross each other when a discrete cell step lands between adjacent vertices.
  - **Fix:** Smooth the per-vertex `clearance` array along the contour ring (using a 3-point `0.18 / 0.64 / 0.18` neighbor pass like `makePrivatePitRockGeometry` already does at `PitGeometry.ts:243-249`, or Hermite-blending cell transitions) so `npx vitest run src/scene/drawing/sheet/portalGeometry.test.ts` and `PitGeometry.test.ts` both pass 100% without weakening any test assertion.

#### Session 1B: Knurling Die Bullet-Time Rotation/Teeth Fix, Shaft Radial Center & Camera Verifier Gate
- **Files owned:** `src/scene/torque-wrench/RingInspection.ts`, `src/scene/torque-wrench/RingInspection.test.ts`, `src/scene/inspection/shaft/progression.ts`, `src/scene/inspection/shaft/progression.test.ts`, `scripts/verify-torque-camera-hud.mjs`.
- **Defect 1B-1 (Doc 44 Item 4 Part 2 — Knurling Die Spins 3.28 Turns & Flattens 82% of Teeth in Bullet Time):**
  - In `src/scene/torque-wrench/RingInspection.ts:12`, `RING_BULLET_RATE = RING_NORMAL_RATE * BULLET_TIME_RATE = 0.05` over `t = 8..18 s` (`Δmechanical = 0.5 s`). With `SPIN_RATE = 4π rad/s` and `RING_RADIUS / WHEEL_RADIUS = 0.03772 / 0.0115 = 3.280` (`src/scene/inspection/timeline.ts:40-45`), the ring rotates `1.0` full turn and the knurling die rotates **`3.28` full turns (`1,181°`)** during bullet time instead of the owner-requested **10–20% of a turn (`36°–72°`)**.
  - Worse, at `3.28` turns over `10 s` with `ROLLER_TEETH = 128`, `rollerHz = 41.98 Hz > MAX_FEATURE_HZ (7.5 Hz)`, so `out.rollerDetailScale = 7.5 / 41.98 = 0.1786` (`RingInspection.ts:61`), causing `filterRoller()` (`ringRuntimeCore.ts:135`) to morph 82% of the 3D tooth vertices into a smooth cylinder during the close-up!
  - **Fix:** Calibrate `RING_BULLET_RATE` (or the `8..18 s` knots in `RingInspection.ts`) so the knurling die rotates **`0.12–0.18` revolutions (`43°–65°`)** across `t = 8..18 s`. That lowers `rollerHz` to `~1.5–2.3 Hz <= 7.5 Hz`, keeping `out.rollerDetailScale === 1.0` (100% crisp 3D teeth) throughout the bullet-time close-up. Add a unit test in `RingInspection.test.ts` asserting both the die angular travel (`36°..72°`) and `rollerDetailScale === 1` across `t in [8, 18]`.
- **Defect 1B-2 (Doc 44 Items 8–10 — `uShaftAxis.xz` Radial Scaling Center in `progression.ts`):**
  - In `src/scene/inspection/shaft/progression.ts:260-266` (`VERTEX_CHUNK`) and `:246-254` (`NORMAL_CHUNK`), `jgOldRadius` is measured from `uShaftAxis.xz`, but `jgLocalNew` scales `jgLocal4.x * jgScale` and `jgLocal4.z * jgScale` around `(0, 0)` instead of around `uShaftAxis.xz`.
  - **Fix:** Scale relative to `uShaftAxis.xz`: `vec2 jgRelXZ = (jgLocal4.xz - uShaftAxis.xz) * jgScale + uShaftAxis.xz; vec3 jgLocalNew = vec3(jgRelXZ.x, jgLocal4.y, jgRelXZ.y);`.
- **Defect 1B-3 (Doc 44 Item 4 Part 1 — `verify-torque-camera-hud.mjs` Close-Up Gate at `p = 0.4805`):**
  - In `scripts/verify-torque-camera-hud.mjs:92-95`, the loop still asserts whole-ring containment at `0.4805`, contradicting the `0.55x` close-up dolly added in `InspectionDirector.ts:424`.
  - **Fix:** At `0.4805`, assert close-up camera distance/FOV and die contact-zone visibility, while keeping whole-ring containment on `[.469, .4725, .4945, .500, .505, .520, .545]`.

#### Session 1C: Frame-Loop Allocation Elimination & Cinematic Sandbox Cleanup
- **Files owned:** `src/scene/torque-wrench/RuntimeWorld.tsx`, `src/components/canvas/ProductStage.tsx`, `src/scene/cinematic/rigRequest.ts`.
- **Defect 1C-1 (Per-Frame Allocations & Scene Traversal in `RuntimeWorld.tsx:1029-1055`):**
  - `RuntimeWorld.tsx` allocates `rigMaterials.map(...)`, `contextMeshes`, and `toMatrixTuple` arrays and runs `shaftRuntime.current.root.traverse(...)` with regex evaluation inside `useFrame` on every frame.
  - **Fix:** Move the expensive `journey` / `contextMeshes` / `rigMaterials` census calculation into the on-demand `window.__torqueWorld.snapshot()` method (or gate/reuse preallocated buffers) so normal scrolling does zero per-frame array allocations or scene-graph traversals.
- **Defect 1C-2 (`ProductStage.tsx:267-291` State Wipe & ToneMapping):**
  - In `src/components/canvas/ProductStage.tsx`, move `resetRigState()` before populating `rigState.modelPath` and mesh counts (or keep metadata separate from `resetRigState()`) so the normal `?rig=cinematic` scroll reel does not wipe its own telemetry on mount.

### Wave 2 — Bundle Hygiene, M249 Exclusion & Production Route Cutover (Parallel Sessions)

#### Session 2A: Eliminate the 260 KB Gzipped `Three.js` Preload Leak & 1.31 MB Duplicate Draco Assets
- **Files owned:** `src/components/AuthorshipNotes.tsx`, `src/scene/drawing/sheet/ownerAnnotations.ts`, `src/scene/drawing/sheet/ownerAnnotationStrings.ts` (new), `src/state/inspectionStore.ts`, `vite.config.ts`, `public/drawing/jgun-sheet-v1.json.gz` (delete), `public/drawing/jgun-sheet-v1.evidence.json` (delete).
- **Fix 2A-1:** Extract `OWNER_TITLE`, `OWNER_CAREER`, `OWNER_EXTRA_FIELDS`, `OWNER_NOTES`, and `OWNER_NOTE_TEXT` into a zero-import `src/scene/drawing/sheet/ownerAnnotationStrings.ts`, re-export them from `ownerAnnotations.ts`, and point `AuthorshipNotes.tsx` to `ownerAnnotationStrings.ts`. Also decouple `src/state/inspectionStore.ts` from heavy scene imports so `dist/index.html` no longer emits `<link rel="modulepreload">` for `BufferGeometryUtils-*.js` (`739 KB` raw / `191 KB` gz) or `session-*.js` (`164 KB` raw / `70 KB` gz).
- **Fix 2A-2:** Remove dead `public/drawing/jgun-sheet-v1.json.gz` (`6.11 MB`) and `jgun-sheet-v1.evidence.json`.
- **Fix 2A-3:** Add a tiny Vite build hook (or `closeBundle` plugin in `vite.config.ts`) that removes the 5 unused hashed `dist/assets/draco_*` files (`1.31 MB`, emitted by `three/examples/jsm/loaders/DRACOLoader.js` `new URL(...)` literals) since all runtime loaders use `/draco/`.

#### Session 2B: M249 Exclusion & Route Topology for `studiomark.dev`
- **Files owned:** `src/shared/pages.ts`, `src/shared/pages.test.ts`, `src/shared/pageTopology.test.ts`, `src/shared/posterGuard.test.ts`, `src/App.tsx`, `src/scene/SpatialWorld.tsx`, `src/scene/SceneCanvas.tsx`, `scripts/deploy-studiomark.ps1`.
- **Route Topology & M249 Stripping:**
  - Ensure `m249-transformed.glb` is NOT copied into `dist/models/` (via Vite `closeBundle` hook or deploy script exclusion, preserving `public/models/m249-transformed.glb` in Git per `AGENTS.md`).
  - Gate `CinematicRigRoute` out of production or remove its `/models/m249-transformed.glb` reference in `src/scene/cinematic/rigRequest.ts`.
  - **Option A (Recommended 2-Page Rebuilt Topology):** Promote `torque-wrench` in `src/shared/pages.ts` (`private: false`, remove `noindex` in `torque-wrench/index.html`), and redirect `/` -> `/torque-wrench/` (or mount `TorqueWrenchPage` directly at `/`), leaving only 2 public pages (`01 TORQUE WRENCH` and `02 THE QUIET MACHINE`).
  - **Option B (Fallback if legacy `/` is kept live alongside `/quiet-machine/` and `/torque-wrench/`):** Remove `<M249Stage />` from `src/scene/SpatialWorld.tsx:131`, update `WarmStationPrograms` in `src/scene/SceneCanvas.tsx:359` so it only requires Station 1 and Station 2 (preventing `warmcancel` from disabling `PerformanceMonitor` at line 529), and gate the Station 2 `<ContactShadows>` in `SpatialWorld.tsx:118` on station visibility (saving 10 `gl.render` passes per frame).
  - Harden `scripts/deploy-studiomark.ps1` to check `$LASTEXITCODE`, verify `dist/index.html`, `dist/quiet-machine/index.html`, `dist/torque-wrench/index.html`, and all required GLBs/WebPs, and fail closed if `dist/models/m249-transformed.glb` exists.

### Wave 3 — Optional Follow-Ons & Full Verification Gate Suite (Lead / Verifier Session)
- **Optional Authored Follow-On (if time permits in the 2-hour window):** Doc 39 §8 Stage-2 planetary gear (`P000247` in carrier `A000592`) fly-out study and `/quiet-machine/` Oryzo polish (`docs/cloud-context/oryzo-recommendations-quiet-enclosure.md`: Lenis smooth scroll + `compileAsync` pre-warming).
- **Mandatory Verification Commands before Push/Deploy:**
  1. `npm run typecheck` (must exit 0)
  2. `npx vitest run --testTimeout=60000` (must exit 0 across all ~105 test files with 0 failures)
  3. `npm run build` (must exit 0; verify `dist/index.html` has no `BufferGeometryUtils` preload, `dist/assets/draco_*` is absent, and `dist/models/m249-transformed.glb` is absent)
  4. Start preview server (`npx vite preview --port 5341 --host localhost`) and run Playwright verifiers:
     - `node scripts/verify-torque-camera-hud.mjs`
     - `node scripts/verify-jg033-preview.mjs`

---

## 4. Reference Docs Bundled in `docs/cloud-context/`
- `docs/cloud-context/oryzo-recommendations-torque-wrench.md`
- `docs/cloud-context/oryzo-recommendations-quiet-enclosure.md`
- `docs/cloud-context/refactoring-assessment-2026-10-08.md`
