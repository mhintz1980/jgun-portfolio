# TODO — jgun-portfolio

Canonical task queue. Authoritative task list for current and upcoming sessions. State: `main` (local-only). All work telemetry-verified on :4173.

---

## 🎯 Next Session Priority — P000420 OSHA Speed Indicator Painted Grooves

### [ ] P000420 Speed Indicator Grooves (Blue lower / Red upper)

**Mark's specification (2026-08-25, with attached reference render):**
> "I'm not seeing the red and blue paint grooves on the P000420, which is the clutch housing that the ring switch rotates around. There is two grooves I'm referring to: one on the upper portion near the handle assembly (Red) and one groove on the lower portion near the gearbox (Blue). Only one of the grooves is exposed from underneath the ring switch at a time.
> - When the ring switch is up against the handle (shift = 0), the lower **Blue** paint groove (`#005DAA` OSHA Blue) is exposed.
> - As the ring switch rotates and shifts down the gearbox (shift = 1), it covers the blue painted groove and exposes the upper **Red** groove (`#C8102E` OSHA Red).
> - The painted grooves make the user aware of what speed the gearbox is in."

**Geometry & Implementation Plan:**
1. `P000420` (intermediate clutch housing) outer diameter has two circumferential annular grooves flanking the helical cam slots:
   - **Upper groove (near handle, $-Z$)**: painted `#C8102E` (OSHA Safety Red). Exposed when ring switch slides $+Z$ down to the gearbox (High Speed / Shift 1).
   - **Lower groove (near gearbox, $+Z$)**: painted `#005DAA` (OSHA Safety Blue). Exposed when ring switch sits against the handle (Low Speed / Shift 0).
2. **Implementation approaches**:
   - **Approach A (Procedural Torus / Cylinder Overlays)**: Create two thin colored torus/annulus geometry rings mapped to P000420's OD at the exact measured Z coordinates of the grooves, parented to `clutch-static` (`P000420`), using `grooveBlue` and `grooveRed` physical materials.
   - **Approach B (Shader / Vertex-Color mapping on P000420)**: Map cylindrical coordinate thresholds in `materials.ts` / custom shader on P000420.
3. Verification:
   - At 0%–5% scroll (shift = 0): Blue groove visible below ring switch; Red groove covered.
   - At 10%–12% scroll (shift = 1): Red groove visible above ring switch; Blue groove covered.

---

## ✅ Completed (Pass 4 & Corrections — 2026-08-25)

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

---

## 📋 Queued Tasks (Pass 3 & Enhancements)

- [ ] **Pass 3 Fix 1 — K000004 Bearing Extraction**:
  - Extract $K000004$ bearing ring right behind $A000606$ (third cage in ladder). Re-derived offset from §5.3 ladder.
- [ ] **Pass 3 Fix 2 — Display Rotation Turns (Kinematic override for visual impact)**:
  - `ROTATION_TURNS = { stage1: 8, stage2: 2.24, stage3: 1.5, stage4: 1, stage5: 0.5 }`.
- [ ] **Design Decisions (Mark's call, parked)**:
  - CH.02 camera framing at full extraction; reassembly beat; ending beat.
- [ ] **Deploy / Hosting**:
  - DNS & hosting setup on `studiomark.dev` (Porkbun).

---

## ⚠️ Gotchas & Operating Rules

- Restart the `:4173` preview server after EVERY rebuild (`stale server + rotated hashes → canvas never mounts`).
- Verify with runtime telemetry, never vision alone.
- Part numbers (`A000606`, `K000004`, `P000725`, `P000420`, `P003068`…) are the stable keys.
- Never commit `.scratch/` or parallel-session files (`src/components/canvas/`, `docs/orzo-style-portfolio-implemetation-roadmap.md`).
