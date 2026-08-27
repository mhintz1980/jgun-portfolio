---
id: JG-016
plan: ../plans/JG-016-multi-station-spatial-world.md
status: verified
verified_on: 2026-08-27
verified_by: Antigravity
commit: pending
---

# JG-016 — Multi-Station Spatial World and Navigation Rig Verification Record

## Outcome Summary

The sequential in-place stage swapping has been upgraded into a measured, continuous 3D spatial world with three discrete engineering stations:
- **Station 1 (`[0, 0, 0]`):** JGun D1-AP Multi-Stage Torque Multiplier (CH.01 & CH.02)
- **Station 2 (`[28, 0, -6]`):** RL-300 / MSP Acoustic SAFE Enclosure + AirflowField (CH.03)
- **Station 3 (`[56, 0, -12]`):** M249 / MK46 Reverse-Engineered Parametric Platform (CH.04)

Visitors experience intentional spatial camera flight across the world rather than in-place component swaps. Deep linking (`?station=...`), interactive HUD station buttons, and keyboard shortcuts (`1`, `2`, `3`) allow seamless navigation between all engineering milestones.

---

## Spatial Station Transforms & Envelopes

| Station | World Position (m) | Active Progress Window | Camera Arrival (m, world) | FOV |
|---|---|---|---|---|
| **Station 1 (JGun)** | `[0, 0, 0]` | `0.00 → 0.525` (sinks 0.525–0.565) | `[0.32, 0.16, 0.42]` → target `[0, 0, 0]` | 42.0° |
| **Station 2 (Enclosure)** | `[28, 0, -6]` | `0.525 → 0.720` (holds 0.565–0.720) | `[28.27, 0.27, -5.73]` → target `[28, 0, -6.02]` | 28.0° |
| **Station 3 (M249)** | `[56, 0, -12]` | `0.720 → 1.000` (holds to end) | `[56.28, 0.42, -10.45]` → target `[56, 0, -12]` | 38.0° |

---

## Implementation Details

1. **`src/scene/SpatialWorld.tsx`**:
   - Renders station groups at discrete measured world coordinates: `station-1-jgun` (`[0,0,0]`), `station-2-enclosure` (`[28,0,-6]`), `station-3-m249` (`[56,0,-12]`).
   - Gated visibility in `useFrame` based on scroll envelopes (`stageEnvelope`) so inactive stations cost zero draw calls.
   - Dedicated contact shadows and lighting bounds per station.

2. **`src/scene/SpatialRig.tsx`**:
   - Manages station activation envelopes and synchronizes telemetry (`telemetry.stage`).
   - Zero React state re-renders in canvas.

3. **`src/scene/CameraRig.tsx`**:
   - Updated `CAMERA_PATH` and continuous interpolation across the three discrete stations in world space.
   - Preserves all sub-sequences: shift zoom, rear LCD orbit dwell (`[-0.28, 0.08, 0.74]`), and click-to-inspect focus.
   - Station 3 M249 zoom-out smoothly frames the weapon platform from `[56.18, 0.26, -11.25]` to `[56.28, 0.42, -10.45]`.

4. **`src/state/scrollStore.ts` & `src/scene/ScrollRig.tsx`**:
   - Added `SPATIAL_STATIONS`, `navigateToStation()`, and deep-link parsing (`?station=1|2|3|jgun|enclosure|m249`).
   - Lenis smooth-scroll coordination for station jumps.

5. **`src/components/TechnicalHUD.tsx`**:
   - Added top-center interactive station quick-jump buttons.
   - Attached global keyboard shortcuts (`1`, `2`, `3`) to jump directly between engineering stations.

---

## Automated Verification Outputs

### 1. Station 2 Contract Test
```text
> jgun-portfolio@0.1.0 check:station2
> node scripts/check-station2-contract.mjs

Stage2 contract passed: 2380776 bytes, 7 named roots, single GLB path.
```

### 2. TypeScript Typecheck
```text
> jgun-portfolio@0.1.0 typecheck
> tsc --noEmit
(Exit code 0, 0 errors)
```

### 3. Production Build
```text
> jgun-portfolio@0.1.0 build
> tsc && vite build

✓ 621 modules transformed.
dist/index.html                               0.70 kB │ gzip:   0.44 kB
dist/assets/draco_wasm_wrapper-fZCQGLGb.js   58.46 kB
dist/assets/draco_wasm_wrapper-DxJM36Ib.js   58.76 kB
dist/assets/draco_decoder-Z1_iN-Ht.wasm     192.42 kB │ gzip:  63.46 kB
dist/assets/draco_decoder-C32yEggz.wasm     285.75 kB │ gzip:  88.64 kB
dist/assets/draco_decoder-fzg4nYZr.js       719.41 kB
dist/assets/index-BNficXfO.css               37.52 kB │ gzip:   6.87 kB
dist/assets/BootSequence-CxXZww_G.js          3.01 kB │ gzip:   1.54 kB
dist/assets/ScrollRig-D2GwEM94.js            19.65 kB │ gzip:   5.88 kB
dist/assets/ScrollTrigger-a3sj5zmn.js       114.01 kB │ gzip:  45.16 kB
dist/assets/index-Cg46jkLq.js               218.75 kB │ gzip:  69.59 kB
dist/assets/vanilla-BJ_7VGhu.js             380.07 kB │ gzip: 103.16 kB
dist/assets/SceneCanvas-8aQmlpz1.js         700.37 kB │ gzip: 197.93 kB
✓ built in 13.26s
```

### 4. No-WebGL & Accessibility Fallbacks Check
```text
> npx tsx scripts/check-fallback.tsx

PASS  poster title block renders
PASS  static-mode notice renders
PASS  case study 1 (gearbox) DOM present
PASS  case study 4 (AI matrix) DOM present
PASS  no <canvas> in poster tier
PASS  chapter text not pointer-events-gated
PASS  no boot sequence in poster tier
PASS  stalled boot panel is pointer-transparent
PASS  stalled boot panel is translucent, not opaque
PASS  stalled boot panel surfaces the fault
PASS  stalled boot shows real progress
PASS  hotspot is a real <button>
PASS  hotspot exposes aria-pressed state
PASS  hotspot has HUD-cyan focus ring
PASS  mode switcher buttons are real <button>s
PASS  mode switcher exposes aria-pressed
PASS  mode switcher has HUD-cyan focus ring
PASS  hotspot close button is labelled
PASS  nothing removed from the tab order

All no-WebGL fallback checks passed.
```

---

## Runtime Telemetry & Browser Probes (`:4173` Preview Server)

Verified via live headless browser evaluation across full navigation lifecycle:

| Test Case | Interaction / Trigger | Active Station | Scroll % | Camera Coordinates (m) | Camera FOV | Result |
|---|---|---|---|---|---|---|
| **Initial Boot** | Initial page load (`/`) | `STATION 01` (0) | `000%` | `CAM [ 0.320 0.160 0.420 ]` | 42.0° | **PASS** |
| **Exploded Dwell** | Scroll progress `0.47` | `STATION 01` (0) | `047%` | `CAM [ -0.280 0.080 0.740 ]` | 31.0° | **PASS** |
| **Station 2 Arrival** | Key `2` / Button `STATION 02` | `STATION 02` (1) | `060%` | `CAM [ 25.396 0.250 -5.130 ]` | 28.8° | **PASS** |
| **Station 3 Arrival** | Key `3` / Button `STATION 03` | `STATION 03` (2) | `085%` | `CAM [ 56.212 0.311 -10.996 ]` | 34.6° | **PASS** |
| **Station 1 Return** | Key `1` / Button `STATION 01` | `STATION 01` (0) | `000%` | `CAM [ 0.320 0.160 0.420 ]` | 42.0° | **PASS** |
| **Deep Link Boot** | Direct URL `/?station=2` | `STATION 02` (1) | `060%` | `CAM [ 25.396 0.250 -5.130 ]` | 28.8° | **PASS** |
