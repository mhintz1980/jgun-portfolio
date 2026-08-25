# TODO — jgun-portfolio

Canonical task queue. Authoritative task list for current and upcoming sessions. State: `main` (local-only). All work telemetry-verified on :4173.

---

## 🎯 Next Priority — Pass 3 & Enhancements

### [ ] Pass 3 Fix 1 — K000004 Bearing Extraction
- Extract $K000004$ bearing ring right behind $A000606$ (third cage in ladder). Re-derived offset from §5.3 ladder.

### [ ] Pass 3 Fix 2 — Display Rotation Turns (Kinematic override for visual impact)
- `ROTATION_TURNS = { stage1: 8, stage2: 2.24, stage3: 1.5, stage4: 1, stage5: 0.5 }`.

---

## ✅ Completed (Pass 4 & Corrections — 2026-08-25)

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

---

## 📋 Queued Tasks (Pass 3 & Enhancements)

- [ ] **Ring Switch Knurling Normal Map (P003068)**:
  - Generate/apply a high-resolution diamond crosshatch knurl normal map to the outer cylindrical diameter of `P003068`. Currently rendering as smooth anodized aluminum without surface texture.
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
