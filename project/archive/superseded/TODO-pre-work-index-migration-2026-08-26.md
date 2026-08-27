# TODO — jgun-portfolio

Canonical task queue. Authoritative task list for current and upcoming sessions. State: `main` (push to `origin` enabled 2026-08-27). All work telemetry-verified on :4173.

---

## 🎯 Next Priority — Queued Enhancements

See **📋 Queued Tasks** below.

---

## ✅ Completed (Pass 3–4 & Tracks A/C — 2026-08-25)

- [x] **P000420 Speed Indicator Grooves (Blue lower / Red upper)**:
  - Modeled annular painted bands in the physical groove channels of P000420 (clutch intermediate housing):
    - Upper groove (near handle, $-Z$): centered at $z = -0.10715\text{ m}$, width $1.5\text{ mm}$, radius $31.70\text{ mm}$, `#C8102E` (OSHA Safety Red).
    - Lower groove (near gearbox, $+Z$): centered at $z = -0.08645\text{ m}$, width $1.5\text{ mm}$, radius $31.70\text{ mm}$, `#005DAA` (OSHA Safety Blue).
  - Parented to `clutchStaticGroup` (`P000420`); automatically moves during explosion and is dynamically covered/revealed by `P003068` ring switch travel.
  - Telemetry & visual verified at $0\%$ (shift 0: Blue groove exposed, Red covered) and $11\%$ (shift 1: Red groove exposed, Blue covered).


- [x] **CR-1: Ring Switch (P003068)**:
  - Split from `clutch-sliding` into dedicated `WrenchRig.clutch.ringSwitch` group.
  - Travels $+9.525\text{ mm}$ ($+Z$) along helical cam groove with $+120^\circ$ rotation (`+shift * RING_SWITCH_ROTATION`).
  - Shift window choreographed to global progress $0.05 \to 0.17$ ($5\% \to 10\%$ slide+rotate, $10\% \to 12\%$ pause, $12\% \to 17\%$ reverse return).
- [x] **CR-3: Camera Shift Zoom & Handle Orbit**:
  - Dollies tight ($\text{FOV } 22^\circ$) on the ring switch / groove axis (`grTgt: [0, 0.012, 0.022]`), perfectly centered on screen.
  - Orbits toward the handle side ($-Z$) during $5\% \to 10\%$ to inspect the speed indicator groove area, holds during the pause, and smoothly pulls back as the ring switch returns.
- [x] **Clutch & Ring Switch Opacity Fix**:
  - Ghosting strictly restricted to `unit.key === 'housing'` (`P000245` outer shell). Clutch, ring switch, handle, LCD, stages, and output remain 100% opaque.
- [x] **CR-4 & CR-5: PBR Materials & Rear LCD Orbit**:
  - Anodized aluminum handle (`P001924`), black oxide steel housings (`P000420`/`P000245`), emissive LCD screen (`P002115`) & backlit buttons (`P002123–25`), `LcdFillLight` point light.
- [x] **CR-6: M249 Platform & CH.04 Extended Scroll**:
  - Real Draco-compressed M249 GLB (`m249-transformed.glb`) centered in $X, Y, Z$.
  - CH.04 section min-height extended to `660vh` ($+12.5\%$ total scroll length).
  - Continuous zoom-out from receiver CAD dissolve sweep (`[0.18, 0.26, 0.75]`, $\text{FOV } 33^\circ$) to full $1.18\text{ m}$ weapon platform overview (`[0.28, 0.42, 1.55]`, $\text{FOV } 38^\circ$).

- [x] **Pass 3 Fix 1 — K000004 Bearing Extraction** *(commit `318e834`)*:
  - K000004 thrust bearing ring extracted between A000606 (stage 5) and stage 2 at `EXPLODE_OFFSETS.bearing = -0.197 m`.
  - `rig.bearing` group wired in `WrenchRig`, driven by `offsetZ(rig.bearing, EXPLODE_OFFSETS.bearing * explode)` in `applyExplosion`.

- [x] **Pass 3 Fix 2 — Display Rotation Turns** *(commit `318e834`)*:
  - `ROTATION_TURNS = { stage1: 8, stage2: 2.24, stage3: 1.5, stage4: 1, stage5: 0.5 }` exported from `caseStudies.ts`.
  - Applied in `applyGearRotation` — each carrier uses `sweep * ROTATION_TURNS[id] * 2π`.

- [x] **Track C — Dynamic SVG Leader Lines & Click-to-Inspect UX** *(commit `5a32cee`)*:
  - Responsive SVG spatial leader lines, engineering reticles, explosion-aware 3D tracking (60 fps `useFrame`).
  - Click-to-inspect camera dolly; wheel/touch/keyboard scroll auto-release.
  - HUD detail card with `SCROLL TO RESUME FLIGHT` hint.
  - 18/18 fallback checks + zero TS errors.

- [x] **Track A — P003068 Knurling & CH.04 M249 CAD Dissolve** *(commit `928df31`)*:
  - Procedural tangent-space diamond-knurl normal map applied only to the P003068 outer diameter, preserving smooth end faces.
  - `CadTransitionShader` bound to the real M249 GLB meshes during full-tier CH.04, with live root-frame alignment, material restoration, and disposal on unmount.

- [x] **Continuous Kinematic Idling (Milestone 4)**:
  - Planetary gear train continuously rotates around pitch circles during scroll pauses via `useFrame` delta-time.
  - Rotation speeds proportional to `ROTATION_TURNS` ratios; smooth blending with scroll-driven rotation; active in CH.02.
  - Telemetry verified: `stageRot` deltas strictly decrease from stage 1 (+19.048) down to stage 5 (+1.191).
- [x] **P000245 Outer Shell Housing Ghost Fade Fix (Milestone 4)**:
  - Resolved `housingMeshSet` classification in `nodeRoles.ts` so `P000245` meshes land in `rig.housing` and `ghostMaterials`.
  - Telemetry verified: `ghostCount = 1` (> 0) and `ghostOpacity = 0.15` during CH.02 explosion.
- [x] **Left-Column Narrative Grid (Milestone 5 Start)**:
  - Migrated chapter text from full-width layout to 5-column left-hand overlay panel (`max-width: 42%`, `backdrop-filter: blur`, dark glass styling).
  - Scroll-range opacity clamping per chapter; 3D canvas remains fully visible and interactable on right 58%+.

---

## 📋 Queued Tasks (Upcoming Milestones & Specs)

### 📦 Milestone 1: Asset Ingestion & Stage 2 Model
- [ ] **MSP Acoustic SAFE Enclosure / RL-300 Skid 3D Asset**:
  - Export web-ready Draco-compressed GLB (`public/models/msp-enclosure.glb` / `rl300-skid.glb`).
  - Discrete named subassemblies: `PUMP_HOUSING`, `ENCLOSURE_CHASSIS`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`, `DUCT_LABYRINTH`, `EXHAUST_PORT`.
  - PBR materials: black-oxide / tool-steel pump core, composite panels, acoustic dampening foam textures.
  - Mount into Stage 2 (`Station2_AcousticEnclosure.tsx`), replacing procedural wireframe placeholder.

### 🌐 Milestone 2: Multi-Station Spatial World & Whip-Pan Camera
- [ ] **Discrete Spatial World (`SpatialWorld.tsx` / `SpatialRig.tsx`)**:
  - Station 1 (`[0, 0, 0]`): JGUN-D1-AP Torque Multiplier.
  - Station 2 (`[28, 0, -6]`): RL-300 Pump with 5-Layer Acoustic SAFE Enclosure Skid.
  - Station 3 (`[56, 0, -12]`): M249 / MK46 Parametric Receiver Platform.
- [ ] **Post-Processing & Camera FX (`PostProcessingComposer.tsx`)**:
  - Velocity-driven directional chromatic aberration and localized bloom bursts during high-speed camera whip-pans between stations.

### 💨 Milestone 3: Interactive Airflow & Acoustic Wave Systems
- [ ] **Mouse-Reactive Volumetric CFM Airflow**:
  - Raycasted mouse plane intersection and dynamic cursor repulsion (`dist < 1.2 -> force deflection`) inside the acoustic duct labyrinth.
- [ ] **Pulsing Acoustic Soundwave Baffles (`AcousticBaffleField.tsx`)**:
  - Expanding & dissipating additive soundwave rings at the exhaust port (`scale = 1.0 + wave * 0.5`).

### ⚙️ Milestone 4: Kinematics & Rig Hardening
- [x] **Continuous Kinematic Idling**:
  - Keep planetary gear train continuously rotating around sun/planet pitch circles during scroll pauses via `useFrame` delta-time.
- [x] **P000245 Outer Shell Housing Ghost Fade Fix**:
  - Resolve `housingMeshSet` resolution in `nodeRoles.ts` so `ghostCount > 0` and outer shell fades to 15% opacity during CH.02.

### 📐 Milestone 5: Layout, UX & Polish
- [x] **Left-Column Narrative Grid (`Chapters.tsx`)**:
  - Migrate from full-width `Chapters.tsx` to 5-column left-hand overlay (`max-width: 42%`) with dark glass panel and scroll-range opacity clamping.
- [ ] **CH.02 Camera Framing & Beats (Mark's call)**:
  - Frame widening at full extraction so $-0.587\text{ m}$ handle tail clears viewport comfortably; reassembly & outro beat tuning.
- [ ] **Deploy / Hosting**:
  - DNS & hosting setup on `studiomark.dev` (Porkbun).

---

## ⚠️ Gotchas & Operating Rules

- Restart the `:4173` preview server after EVERY rebuild (`stale server + rotated hashes → canvas never mounts`).
- Verify with runtime telemetry, never vision alone.
- Part numbers (`A000606`, `K000004`, `P000725`, `P000420`, `P003068`…) are the stable keys.
- Never commit `.scratch/` or parallel-session files (`src/components/canvas/`, `docs/orzo-style-portfolio-implemetation-roadmap.md`).
