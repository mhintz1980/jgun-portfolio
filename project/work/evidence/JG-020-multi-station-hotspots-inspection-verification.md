---
id: JG-020
plan: ../plans/JG-020-multi-station-hotspots-inspection.md
status: verified
verified_on: 2026-08-28
verified_by: Antigravity
commit: pending
---

# JG-020 — Multi-Station Subassembly Inspection, Spatial Hotspots & Interactive CAD Anchors Verification Record

## Outcome Summary

The interactive inspection, spatial datum annotation, and camera dollying system has been extended across all three 3D engineering stations:
- **Station 1 (`[0, 0, 0]`):** JGun D1-AP Multi-Stage Planetary Torque Multiplier (`rotor`, `motor-housing`, `flange`, `gearbox-housing`, `mcu`, `lcd`, `lipo`).
- **Station 2 (`[28, 0, -6]`):** RL-300 Industrial Pump / 5-Layer Acoustic SAFE Enclosure (`enclosure-chassis`, `composite-panels`, `pump-housing`, `acoustic-baffles`, `isolation-mounts`, `duct-intake`, `duct-exhaust`).
- **Station 3 (`[56, 0, -12]`):** M249 / MK46 Parametric Receiver Platform (`m249-receiver`, `m249-trunnion`, `m249-rail`, `m249-feed-tray`).

All stations support:
1. **Interactive Subassembly Inspection:** Hover and click on CAD geometry triggers dynamic cyan emissive highlighting and presents rich technical GD&T / acoustic specifications in `TechnicalHUD`.
2. **Station-Aware Camera Dollying:** Clicking a subassembly dollies the camera tight into the part's measured world coordinates across Station 1 (`[0, 0, 0]`), Station 2 (`[28, 0, -6]`), and Station 3 (`[56, 0, -12]`) with tailored FOVs.
3. **Continuous Scroll-to-Release UX:** Any mouse wheel scroll (`wheel` event), touch drag, Escape key, or station jump button immediately releases inspect focus and returns the camera smoothly to the tour flight path without blocking the user.
4. **Dynamic 3D Spatial Datum Markers:** Rendered in 3D scene space with orthographic datum flags, ASME Y14.5 segmented feature control frames, and responsive SVG leader lines.
5. **Accessibility & Zero-Rerender R3F Performance:** Hotspots render as real DOM `<button>` elements with `aria-pressed`, `aria-label`, and high-contrast cyan focus rings; camera and state updates operate imperatively inside `useFrame` with zero React re-renders.

---

## CAD Subassembly Anchors & Framing Specifications

### Station 1 (`[0, 0, 0]`): JGun Torque Multiplier
| Subassembly ID | Occurrence | Inspect Camera Position (m) | Inspect Target (m) | FOV |
|---|---|---|---|---|
| `rotor` | `ROTOR-1` | `[0.18, 0.08, 0.12]` | `[0, 0, -0.06]` | 24° |
| `motor-housing` | `AIR MOTOR HOUSING-MACHINED-1` | `[0.20, 0.09, 0.04]` | `[0, 0, -0.12]` | 24° |
| `flange` | `FLANGE-1` | `[0.18, 0.07, 0.08]` | `[0, 0, -0.03]` | 22° |
| `gearbox-housing` | `P000245-1` | `[0.24, 0.09, 0.14]` | `[0, 0, 0.01]` | 25° |
| `mcu` | `MSP430F6726IPN-1` | `[-0.07, 0.10, -0.36]` | `[0, 0.02, -0.22]` | 25° |
| `lcd` | `MANOMETER LCD BK11356-1` | `[-0.05, 0.08, -0.42]` | `[0, 0.02, -0.24]` | 28° |
| `lipo` | `Tenergy LiPo Battery 3.7 V-1` | `[-0.09, -0.02, -0.34]` | `[0, -0.01, -0.20]` | 25° |

### Station 2 (`[28, 0, -6]`): RL-300 Acoustic SAFE Enclosure
| Subassembly ID | Occurrence | Inspect Camera Position (m) | Inspect Target (m) | FOV |
|---|---|---|---|---|
| `enclosure-chassis` | `ENCLOSURE_CHASSIS` | `[29.80, 1.20, -3.80]` | `[28.00, 0.20, -6.00]` | 28° |
| `composite-panels` | `COMPOSITE_PANELS` | `[30.00, 0.90, -4.20]` | `[28.30, 0.10, -5.80]` | 26° |
| `pump-housing` | `PUMP_HOUSING` | `[28.90, 0.60, -4.60]` | `[28.00, 0.00, -6.00]` | 24° |
| `acoustic-baffles` | `ACOUSTIC_BAFFLES` | `[29.20, 0.80, -5.20]` | `[28.20, 0.20, -6.20]` | 24° |
| `isolation-mounts` | `ISOLATION_MOUNTS` | `[26.80, -0.10, -4.50]` | `[27.50, -0.35, -5.65]` | 24° |
| `duct-intake` | `DUCT_INTAKE` | `[25.80, 0.80, -4.80]` | `[26.90, 0.25, -6.00]` | 26° |
| `duct-exhaust` | `DUCT_EXHAUST` | `[30.40, 0.80, -5.00]` | `[29.20, 0.20, -6.00]` | 26° |

### Station 3 (`[56, 0, -12]`): M249 Receiver Platform
| Subassembly ID | Occurrence | Inspect Camera Position (m) | Inspect Target (m) | FOV |
|---|---|---|---|---|
| `m249-receiver` | `RECEIVER_MONOBLOC` | `[56.25, 0.35, -11.20]` | `[56.00, 0.05, -12.00]` | 26° |
| `m249-trunnion` | `BARREL_TRUNNION` | `[56.22, 0.25, -11.35]` | `[56.03, 0.03, -11.85]` | 22° |
| `m249-rail` | `PICATINNY_TOP_RAIL` | `[56.20, 0.45, -11.40]` | `[56.10, 0.10, -12.08]` | 22° |
| `m249-feed-tray` | `FEED_TRAY_INTERFACE` | `[56.22, 0.32, -11.30]` | `[56.06, 0.08, -11.96]` | 24° |

---

## Automated Verification Outputs

### 1. TypeScript Typecheck
```text
> jgun-portfolio@0.1.0 typecheck
> tsc --noEmit
(Exit code 0, 0 errors)
```

### 2. Station 2 CAD Contract Check
```text
> jgun-portfolio@0.1.0 check:station2
> node scripts/check-station2-contract.mjs

Stage2 contract passed: 2380776 bytes, 7 named roots, AirflowField & AcousticBaffleField mounted.
```

### 3. Fallback and Accessibility Smoke Test
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
dist/index.html                               2.12 kB │ gzip:   0.69 kB
dist/assets/draco_wasm_wrapper-fZCQGLGb.js   58.46 kB
dist/assets/draco_wasm_wrapper-DxJM36Ib.js   58.76 kB
dist/assets/draco_decoder-Z1_iN-Ht.wasm     192.42 kB │ gzip:  63.46 kB
dist/assets/draco_decoder-C32yEggz.wasm     285.75 kB │ gzip:  88.64 kB
dist/assets/draco_decoder-fzg4nYZr.js       719.41 kB
dist/assets/index-BNficXfO.css               37.52 kB │ gzip:   6.87 kB
dist/assets/BootSequence-xqT_TPPv.js          3.01 kB │ gzip:   1.54 kB
dist/assets/ScrollRig-Ce3XuDwt.js            19.65 kB │ gzip:   5.88 kB
dist/assets/ScrollTrigger-a3sj5zmn.js       114.01 kB │ gzip:  45.16 kB
dist/assets/index-BAvfSHpJ.js               223.02 kB │ gzip:  71.08 kB
dist/assets/vanilla-BJ_7VGhu.js             380.07 kB │ gzip: 103.16 kB
dist/assets/SceneCanvas-DwCgr7tH.js         793.32 kB │ gzip: 223.83 kB
✓ built in 5.97s
```

---

## Live Runtime Telemetry Measurements (`:4173` Preview Server)

Programmatic Chrome DevTools telemetry evaluation:

### 1. Station 1 Subassembly Selection (`rotor`)
- `telemetry.camera`: `[0.151, 0.100, 0.122]`, FOV `24.15°`
- `telemetry.stage.active`: `0`
- `telemetry.stage.alpha`: `[1, 0, 0]`
- Console errors: `0`

### 2. Station 2 Subassembly Selection (`composite-panels`)
- `telemetry.camera`: `[29.931, 0.915, -4.207]`, FOV `26.02°`
- Target alignment: accurately dollies to Station 2 `[28, 0, -6]` coordinates without jumping to Station 1.
- `telemetry.stage.active`: `1`
- `telemetry.stage.alpha`: `[0, 1, 0]`
- `HUD detail card visible`: `true`
- Console errors: `0`

### 3. Continuous Scroll Release (Mouse Wheel Event)
- Mouse wheel `deltaY: 15` dispatched
- `hotspotId` automatically resets to `null`
- `HUD detail card visible`: `false`
- Camera seamlessly resumes master navigation spline

### 4. Station 3 Subassembly Selection (`m249-trunnion`)
- `telemetry.camera`: `[56.190, 0.270, -11.347]`, FOV `22.09°`
- Target alignment: accurately dollies to Station 3 `[56, 0, -12]` locking trunnion bore.
- `telemetry.stage.active`: `2`
- `telemetry.stage.alpha`: `[0, 0, 1]`
- `HUD detail card visible`: `true`
- Console errors: `0`
