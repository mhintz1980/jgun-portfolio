# JGUN-D1-AP Animation Specification: 2-Speed Gearbox

## 1. Overview & Mechanical Constraints
This specification governs the exploded-view and kinematic scroll animation for the **JGUN-D1-AP 2-speed torque wrench**. 

**CRITICAL PHYSICAL CONSTRAINT:** 
Unlike single-speed variants, the D1-AP features a large rear clutch assembly. The outer shell (`P000245` / Big Housing) has a necked-down internal bore at the front. 
*   **Forward Disassembly (-Z / Snout):** ONLY the Output Spindle and its immediate bushings/retainers can physically exit through the front.
*   **Rearward Disassembly (+Z / Handle):** ALL five planetary reduction stages and the entire dual-speed clutch assembly must be extracted rearward out of the open back of the housing. 

---

## 2. Component Kinematic Groupings (Node Roles)
Meshes must be classified into the following strict groups based on their SolidWorks part numbers to ensure accurate explosion vectors and rotation.

### A. Static & Exterior Shells
*   **Big Housing:** `P000245` (Anchors at Datum `0.000m`)
*   **Handle Assembly:** `HANDLE_ASSY`

### B. Output Spindle (Forward Exit)
*   **Components:** `P000095` (Output Shaft), `P000207` / `P00207` (Internal Bushing), `K000001` / `K00001` (External Bushing), `K0000740` / `K000074` (Retaining Ring).

### C. Mechanical Clutch (Rearward Exit)
*   **Static Clutch Parts:** `A000881` (Clutch Assy), `P000420` (Intermediate Housing), `P001835` (Input Shaft).
*   **Sliding Shift Parts:** `P003068` (Ring Switch), `P000724` (Shifter Fork), `P000297` (Shifter Cam), `P000464` (Pins).

### D. 5-Stage Epicyclic Gearbox (Rearward Exit)
*   **Stage 1 (Input):** `A000591` (Carrier), `P000247` (Planets)
*   **Stage 2:** `A000592` (Carrier), `P000247` (Planets)
*   **Stage 3:** `A000860` (Carrier), `P000069` (Planets)
*   **Stage 4:** `A000861` (Carrier), `P003046` (Planets)
*   **Stage 5 (Output):** `A000606` (Carrier), `P000248` (Planets)

---

## 3. GSAP Scroll Timeline (Choreography)
The animation is driven by a single GSAP proxy object scrubbed to the page scroll (Chapter 1 sequence). It executes in four distinct, overlapping phases:

1.  **Phase 1: Mechanical Shift (0% - 15%)**
    *   The `Sliding Shift Parts` (Ring Switch, Fork, Cam) translate `-0.015m` axially to simulate locking the high-speed splines.
2.  **Phase 2: Kinematic Spin (15% - 45%)**
    *   The planetary stages execute an epicyclic spin sequence.
    *   Each carrier orbits the central axis based on its specific reduction ratio.
    *   Planets counter-rotate on their local pins (multiplied by `-3.5` relative to carrier rotation).
3.  **Phase 3: Ghost Fade (35% - 60%)**
    *   The exterior `Big Housing` material fades to a 15% opacity ghost material with `depthWrite: false` to reveal the internals.
4.  **Phase 4: Axial Explosion (60% - 100%)**
    *   Components telescope along the Z-axis to their staggered offsets.

---

## 4. Axial Explosion Offsets
During Phase 4, components are displaced along the Z-axis to the following targeted distances (in meters). *Note: Positive values indicate forward travel out the snout; Negative values indicate rearward travel toward the handle.*

| Subassembly | Z-Offset (m) | Direction |
| :--- | :--- | :--- |
| **Output Shaft & Bushings** | `+0.050` | Forward (Snout) |
| **Big Housing (P000245)** | `0.000` | Anchored Origin |
| **Stage 5** | `-0.035` | Rearward |
| **Stage 4** | `-0.070` | Rearward |
| **Stage 3** | `-0.105` | Rearward |
| **Stage 2** | `-0.140` | Rearward |
| **Stage 1** | `-0.175` | Rearward |
| **Clutch (Base Offset)** | `-0.210` | Rearward |
| **Handle Assembly** | `-0.260` | Rearward |

*(Note: The sliding clutch components will sit at `-0.210m` plus their `-0.015m` shift travel, resulting in a final exploded offset of `-0.225m` relative to the datum).*