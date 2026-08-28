---
id: JG-018
plan: ../plans/JG-018-airflow-and-acoustic-interaction.md
status: verified
verified_on: 2026-08-28
verified_by: Antigravity
commit: pending
---

# JG-018 — Interactive Airflow and Acoustic-Wave Systems Verification Record

## Outcome Summary

The Station 2 (RL-300 / MSP Acoustic SAFE Enclosure) visual and interactive systems have been upgraded to explain real-world airflow ventilation and acoustic sound attenuation engineering:
- **Laminar & Thermal Airflow Field (`AirflowField.tsx`):** Points advect through verified CAD anchors (`DUCT_INTAKE` `[0.0, 1.158, 0.893]` → `PUMP_HOUSING` `[0.022, 0.943, -0.055]` & `ACOUSTIC_BAFFLES` `[-1.319, 1.590, -0.433]` → `DUCT_EXHAUST` `[-0.101, 1.282, -1.225]`) with interactive aerodynamic cursor/touch deflection.
- **Acoustic Baffle Soundwave Propagation (`AcousticBaffleField.tsx`):** Concentric acoustic pressure wavefronts radially emitted from the pump housing (115 dBA), attenuated through internal acoustic baffles and composite walls, and dissipated at the exhaust duct (-43 dBA attenuation).
- **Subassembly Inspection & Emissive Highlighting (`Station2_AcousticEnclosure.tsx`):** Interactive hover, click, and keyboard focus states highlighting the 7 CAD subassembly roots with role-colored emissive feedback and engineering specifications.
- **Quality & Accessibility Tiers:** Clean static contour arc fallbacks with zero rAF looping under reduced motion, full DOM button access for keyboard/screen-readers, and tier-scaled particle counts (12k full / 3.6k lite).

---

## CAD Anchor Alignment

All visuals and interactions are strictly tied to the measured bounding boxes of the 7 named CAD roots in `public/models/msp-enclosure.glb`:

| Subassembly | CAD Root Name | Measured Anchor (m) | Role & Engineering Physics |
|---|---|---|---|
| **Intake Duct** | `DUCT_INTAKE` | `[0.000, 1.158, 0.893]` | 1,850 CFM laminar cooling inlet, cyan `#00e5ff` |
| **Pump Unit** | `PUMP_HOUSING` | `[0.022, 0.943, -0.055]` | 115 dBA acoustic source, thermal heat pickup |
| **Acoustic Baffles** | `ACOUSTIC_BAFFLES` | `[-1.319, 1.590, -0.433]` | Labyrinth high-frequency acoustic wave absorption |
| **Exhaust Duct** | `DUCT_EXHAUST` | `[-0.101, 1.282, -1.225]` | Attenuated thermal discharge port, amber `#f97316` |
| **Chassis** | `ENCLOSURE_CHASSIS` | `[0.000, 1.282, -0.462]` | Structural extruded aluminum framework |
| **Acoustic Walls** | `COMPOSITE_PANELS` | `[0.659, 1.251, 0.202]` | 5-layer composite mass-loaded vinyl + acoustic foam |
| **Mounts** | `ISOLATION_MOUNTS` | `[0.000, 0.025, -0.055]` | 94% vibration decoupling elastomeric isolators |

---

## Automated Verification Outputs

### 1. Station 2 Contract Check
```text
> jgun-portfolio@0.1.0 check:station2
> node scripts/check-station2-contract.mjs

Stage2 contract passed: 2380776 bytes, 7 named roots, AirflowField & AcousticBaffleField mounted.
```

### 2. TypeScript Typecheck
```text
> jgun-portfolio@0.1.0 typecheck
> tsc --noEmit
(Exit code 0, 0 errors)
```

### 3. Fallback & Accessibility Smoke Check
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

### 4. Production Build
```text
> jgun-portfolio@0.1.0 build
> tsc && vite build

vite v7.3.6 building client environment for production...
✓ 627 modules transformed.
dist/index.html                               2.12 kB │ gzip:   0.70 kB
dist/assets/draco_wasm_wrapper-fZCQGLGb.js   58.46 kB
dist/assets/draco_wasm_wrapper-DxJM36Ib.js   58.76 kB
dist/assets/draco_decoder-Z1_iN-Ht.wasm     192.42 kB │ gzip:  63.46 kB
dist/assets/draco_decoder-C32yEggz.wasm     285.75 kB │ gzip:  88.64 kB
dist/assets/draco_decoder-fzg4nYZr.js       719.41 kB
dist/assets/index-BNficXfO.css               37.52 kB │ gzip:   6.87 kB
dist/assets/BootSequence-BETKFQX-.js          3.01 kB │ gzip:   1.54 kB
dist/assets/ScrollRig-BiuMy3rG.js            19.65 kB │ gzip:   5.88 kB
dist/assets/ScrollTrigger-a3sj5zmn.js       114.01 kB │ gzip:  45.16 kB
dist/assets/index-CoXOzVci.js               218.78 kB │ gzip:  69.60 kB
dist/assets/vanilla-BJ_7VGhu.js             380.07 kB │ gzip: 103.16 kB
dist/assets/SceneCanvas-BSCz8ORP.js         789.76 kB │ gzip: 222.68 kB
✓ built in 9.96s
```

---

## Runtime Telemetry Probes (`:4173` Preview Server)

Verified via programmatic Chrome DevTools runtime evaluation:

### 1. Initial State (Progress 0.00 — Station 1 Active)
- `stage.active`: `0`
- `stage.alpha`: `[1, 0, 0]`
- `stage.flow`: `0.000`
- `stage.acousticWave`: `0.000`
- `camera`: `[0.320, 0.160, 0.420]`, FOV `42.0°`
- Console errors: `0`

### 2. Station 2 Active State (Progress 0.60 — CH.03)
- `stage.active`: `1` (Station 2 Enclosure dominant)
- `stage.alpha`: `[0, 1, 0]` (Station 1 zeroed, Station 2 active, Station 3 zeroed)
- `stage.flow`: `0.2249` (Airflow active and ramping)
- `stage.acousticWave`: `0.2249` (Acoustic soundwave field active)
- `scroll.chapter`: `2` (CH.03 THERMAL / ACOUSTIC)
- Console errors: `0`

### 3. Station 2 Hold Peak State (Progress 0.65 — CH.03)
- `stage.active`: `1`
- `stage.alpha`: `[0, 1, 0]`
- `stage.flow`: `0.5449`
- `stage.acousticWave`: `0.5449`
- `camera.position`: `[28.071, 0.269, -5.688]` (Smooth arrival at Station 2 `[28.27, 0.27, -5.73]`, target `[28, 0, -6.02]`)
- `camera.fov`: `28.06°`
- `stage.transitionIntensity`: `0.0006` (Resting after transition)
- Console errors: `0`

---

## Performance & Memory Invariants Passed

- **Zero per-frame heap allocations:** Reused module-level scratch objects (`_interactionPlane`, `_worldHit`, `_stationOrigin`) in `AirflowField` and `AcousticBaffleField`.
- **Bounded Draw Calls:** 1 draw call for `AirflowField` (`THREE.Points`) and pooled meshes for `AcousticBaffleField`.
- **Reduced Motion Support:** All animation loops freeze with zero rAF overhead under `prefers-reduced-motion`; static contour arcs render without continuous GPU shader churn.
