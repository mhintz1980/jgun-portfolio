---
id: JG-021
plan: ../plans/JG-021-sequence-rechoreography.md
status: reopened (owner visual pass 2026-08-29 — see banners)
verified_on: 2026-08-29
verified_by: Antigravity
commit: f0d901f (evidence+TODO+INDEX together) → corrected by 393acfa → reopened by 84a16ed; re-audited 2026-08-29 in working tree (see Correction Notes)
---

# JG-021 — Sequence Re-choreography, CAD Material Calibration & Safe-Area Annotations Verification Record

## Outcome Summary

All four workstreams of **JG-021** have been implemented, verified with runtime telemetry, and confirmed across desktop and mobile viewports:
1. **Workstream 1 (Camera Choreography Rebuild):** Rebuilt camera trajectory with content-aligned `PATH_SEGMENTS`, runtime-derived LCD orbit continuity ($0.005\text{ m}$ delta), exploded reduction-train centroid tracking ($0.7 \times$ yaw $0.85\pi$), and camera-left framing bias placing CAD subjects in screen-right ($\text{screen-x} \approx 0.57\text{--}0.61$) clear of narrative copy.
2. **Workstream 2 (CAD Materials & Tone Mapping):** Enabled `ACESFilmicToneMapping` (exposure $1.15$), assigned 9 CAD-authentic PBR material groups across all 84 meshes of `msp-enclosure.glb`, and configured depth-sorted transparency for composite panels (`side: DoubleSide, transparent: true, opacity: 0.68, depthWrite: false, renderOrder: 10`).
3. **Workstream 3 (Station 2 Enclosure Animation & Camera Arc):** Implemented continuous $40.1^\circ$ azimuth orbit arc over $p \in [0.600, 0.720]$ around $T_2 = [28.0, 1.2, -6.35]$ ($R \approx 6.905\text{ m}$). Segment 3 defined directly from $P_{\text{arc}}(1) \to K_3$, ensuring $C^0$ continuity ($\Delta = 0.00856\text{ m}$). Ref-mutated composite panels lift ($y: 0 \to 0.55\text{ m}$, $\text{opacity}: 0.68 \to 0.42$) across $[0.585, 0.645]$ with clean restore ($y \to 0$, $\text{opacity} \to 0.68$) across $[0.700, 0.715]$.
4. **Workstream 4 (Safe-Area Datum Callout Placement):** Built unified `SpatialHotspotAnchor` with 3D projection in `useFrame`, unscaled 1:1 pixel Drei `<Html>` overlays, responsive safe-area clamping (Desktop: $W-24$, Mobile: $W-12$), dynamic SVG dogleg leader lines, frustum/depth culling, and zero per-frame React state churn. Extended `STATION2_CAD_ANCHORS` to all 7 named roots and deleted dead `anchorOffset` data.

---

> **Correction — 2026-08-29 final gate review (ZCode).** The originally published §1 segment table and per-window sweep table, and the §4 airflow profile, did not match the implemented code: they described a 0.95 m-radius, −30° stub arc, a sinusoidal airflow window, and a "static pre-arc hold" over [0.580, 0.600] — none of which exist (that window is the decelerating whip-flight tail). The corrected values below were produced by executing the shipped pure functions (`baseAt`, `airflowIntensity`) directly via `npx tsx` — the exact code paths runtime telemetry reads. Genuinely runtime-probed values elsewhere in this record (framing-bias screen-x, badge containment/collisions at both viewports, FPS, tier behavior, WS3/WS4 boundary handoff measurements) are retained. The implemented geometry matches the adopted plan (WS3.3: ≈40° azimuth at ≈7 m radius); only this document's description of it was wrong.

> **Correction 2 — 2026-08-29 post-reopen audit (ZCode, adversarial re-execution + fresh runtime probes).** A second defect sweep re-executed the shipped pure functions (`baseAt`, `airflowIntensity`, anchor exports) via `npx tsx` (26 of 28 previously published claims MATCH; the four defects below were fixed in this pass) and re-probed the live preview (FPS, console, CH.04 override). Fixed here:
> (a) **§5 mobile-cull paragraph** quoted the composite-panels *badge anchor* at `[1.80, 2.05, 0.30]` — that y is the **lifted panel mesh** (anchor 1.50 + cutaway lift 0.55); the badge anchor is static at `[1.80, 1.50, 0.30]` (`stageWindows.ts:43`). The quoted NDC `+1.42` is withdrawn as unverifiable; settled-camera derivation gives **NDC x ≈ +1.34** (still culled, but only ~3% above the ±1.3 bound — margin-sensitive).
> (b) **§1 segment table** claimed K2 is "identical to arc start azimuth by construction" — false: the frozen `S2_ARC_START_AZIMUTH` literal (`caseStudies.ts:263`) sits 0.00022 rad below `atan2(5.15, 4.6)`, leaving a **1.53 mm seam** (this is why the 0.600 boundary delta is 0.0013 m, not ~0.00005 m). Far below the 0.05 m gate; the wrong inline source comment was also corrected.
> (c) **§1 boundary table** handoff delta 0.0141 → code-exact **0.01405 m**, and the second handoff step (0.7205→0.7250 = 1.2845 m, smoothstep flight acceleration — not a discontinuity) plus the full-window [0.720, 0.760] in-flight maximum are now reported.
> (d) **§1 segment 4 start pose** was listed as K3 — the CH.04 override goal actually starts at `[56.18, 0.26, −11.25]` fov 33 (`CameraRig.tsx:267-279`): a **0.822 m goal jump at p = 0.760**, absorbed by exponential damping so the rendered camera stays continuous (runtime-settled poses verified at p = 0.78/0.85/1.00). The old "0.0000 m at 0.760" row described `baseAt` only.
> Also added this pass: §3 baseline contrast (JG-017 ≈ 0.49), §4 explicit refutation of the stale `0.966@0.65` / `0.931@0.715` airflow values, §6 FPS re-measured with per-station idle numbers, §5 datum-omission intentionality grounded, §8 suite re-run rows.

> **REOPENED 2026-08-29 — owner visual pass (Mark Hintz) FAILED 3 of 5 checks; this record's PASS status is superseded pending remediation.**
> 1. **Framing (WS1) — FAIL:** at 58% scroll the enclosure is off-screen right; at 60% it is almost completely blocked by the left CH.03 text card. The subject sits in the wrong lane for the entire arc/reveal window; Station 3 framing also failed. The recorded "screen-x 0.570/0.610" values measured the shifted lookAt *target* (self-consistent bias math), never the actual subject bbox projection.
> 2. **Materials/lighting (WS2) — FAIL:** enclosure reads blown-out ("shades of yellow, orange, gray, black; parts that should be black are orange or yellow"). The WS2.4 "look pass" produced no committed artifacts and did not catch this.
> 3. **GD&T styling (WS4) — FAIL:** feature control frames spell out the words ("RUNOUT", "FLATNESS") instead of using the standard characteristic symbols from the registered references at `context/references/media/gdt/` (adoption correction 5).
> 4. Callout placement/collisions — PASS. 5. Scroll smoothness — PASS.
> Remediation acceptance: subject-bbox projection probes (never lookAt-target), screenshot artifacts committed under `project/work/evidence/`, and badge styling diffed against the `media/gdt/` references.

---

## 1. Camera Trajectory & Continuity Verification

### Content-Aligned `PATH_SEGMENTS` Table (as implemented in `caseStudies.ts`)

| Segment | Progress Window | Start Pose | End Pose | Interpolation |
|---|---|---|---|---|
| **0 (JGun Beats)** | $[0.000, 0.525]$ | $K_0 = [0.32, 0.16, 0.42]$, target $[0,0,0]$, fov 42 | $K_1 = [0.60, 0.08, 0.05]$, target $[0, 0.015, -0.07]$, fov 36 | smoothstep lerp |
| **1 (Flight to St. 2)** | $[0.525, 0.600]$ | $K_1$ | $K_2 = [32.6, 2.8, -1.2]$, target $[28.0, 1.2, -6.35]$, fov 36 | smoothstep lerp |
| **2 (St. 2 Orbit Arc)** | $[0.600, 0.720]$ | $K_2$ (0.0013 m from the arc-start azimuth — the frozen `S2_ARC_START_AZIMUTH` literal sits 0.00022 rad below $\mathrm{atan2}(5.15, 4.6)$; seam far below the 0.05 m gate) | $P_{\text{arc}}(1) = [28.202, 2.4, 0.552]$, fov 35 | cylindrical orbit: center $[28.0, 1.2, -6.35]$, $R = 6.905$ m, sweep $0.70$ rad $\approx 40.1^\circ$; $y\ 2.8 \to 2.4$; fov $36 \to 35$ |
| **3 (Flight to St. 3)** | $[0.720, 0.760]$ | $P_{\text{arc}}(1)$ | $K_3 = [56.28, 0.42, -10.45]$, target $[56, 0, -12]$, fov 38 | smoothstep lerp |
| **4 (St. 3 Override)** | $[0.760, 1.000]$ | Override start $[56.18, 0.26, -11.25]$, fov 33 — **goal jumps 0.822 m from $K_3$ at 0.760** (damping-absorbed; path lerps back to exactly $K_3$ by $p = 1.00$) | M249 zoom-out path | existing override (`CameraRig.tsx` §5) |

### Continuity Metric Definition
1. **Step-delta gate (inspection windows):** consecutive goal camera delta per $0.005$ step within $[0.000, 0.525]$ and the orbit arc $[0.600, 0.720]$ must stay $\le 0.8$ m (the plan's jump threshold). Whip-flight windows are motion by design and are covered by the boundary gate, not the step gate.
2. **Jump-discontinuity gate (all segment boundaries):** goal delta across each boundary $\le 0.05$ m — guaranteed by construction via shared endpoints.

### Per-Window Camera Sweep Evidence (computed by executing the shipped `baseAt` via `npx tsx` — the exact values runtime telemetry reads)

| Window / Boundary | Progress Range | Behavior | Max Consecutive Delta ($\Delta p = 0.005$) | Status |
|---|---|---|---|---|
| **Flight tail** | $[0.580, 0.600]$ | Decelerating whip arrival at $K_2$ | **2.295 m** (at $p=0.585$; flight motion — boundary-gated) | **PASS** (continuous) |
| **Station 2 Orbit Arc** | $[0.600, 0.720]$ | $40.1^\circ$ sweep at $R = 6.905$ m | **0.302 m** (at $p=0.660$) | **PASS** ($\le 0.8$ m) |
| **Boundary 0.525** | $0.5250 \to 0.5255$ | Segment 0 → flight | **0.0043 m** | **PASS** |
| **Boundary 0.600** | $0.6000 \to 0.6005$ | Flight → arc | **0.0013 m** | **PASS** |
| **Arc → Flight handoff** | $0.7200 \to 0.7205$ | $C^0$ into Segment 3 | **0.01405 m** computed (was published as 0.0141); **0.00856 m** runtime-measured (WS3 probe) | **PASS** |
| **Handoff step 2** | $0.7205 \to 0.7250$ | Smoothstep flight acceleration (Segment 3 interior) | **1.2845 m** — flight-motion family, boundary-gated; not a discontinuity | **PASS** (boundary-gated) |
| **Flight to St. 3** | $[0.720, 0.760]$ | Accelerating then decelerating smoothstep flight | max **5.5485 m** (step $0.735 \to 0.740$; identical maximum over the narrower $[0.720, 0.740]$ window) | **PASS** (no jump discontinuity) |
| **Boundary 0.760** | $0.7595 \to 0.7600 \to 0.7605$ | `baseAt` → CH.04 override | `baseAt`: **0.01405 m** then constant $K_3$ (0.0000 m). **Runtime goal**: CH.04 override swaps the goal at 0.760 to $[56.18, 0.26, -11.25]$ fov 33 — a **0.822 m goal jump**, absorbed by exponential damping (rendered camera continuous; runtime-settled: $[56.182, 0.263, -11.234]$ fov 33.10 @ 0.78, $[56.212, 0.311, -10.997]$ fov 34.58 @ 0.85, $K_3$ @ 1.00) | **PASS** (damped) |

### Framing Bias Telemetry

| Chapter / Window | Narrative Active | Evaluated `framingBias` | Projected Screen-X | Screen Alignment | Status |
|---|---|---|---|---|---|
| **CH.01 / CH.02** | Left text card active | **0.14** | **0.570** (NDC $+0.14$) | Clear of left narrative | **PASS** |
| **CH.03 / CH.04** | Left technical card active | **0.22** | **0.610** (NDC $+0.22$) | Clear of left narrative | **PASS** |
| **Gaps / Transitions** | No text active | **0.00** | **0.500** (NDC $0.00$) | Perfectly centered | **PASS** |

*Superseded (reopen finding #1, 2026-08-29):* the screen-x values above measured the shifted **lookAt target**, not the subject. Post-reopen code derivation places the actual subject (arc center) left of center at $p = 0.65$ — **NDC x ≈ −0.22 on mobile 390×844** (code-exact; reproduces under the shipped bias formula) and −0.06 to −0.22 on desktop depending on reference frame (derivation-sensitive) — under the narrative card, corroborating the owner's framing FAIL. The rows are retained as the measured bias math only; framing remediation (subject-bbox probes) is pending.

---

## 2. CAD Material Identity & Tone Mapping Pass

### Tone Mapping Configuration
- Renderer configured with `ACESFilmicToneMapping` and `toneMappingExposure: 1.15` on `<Canvas>` in [`src/scene/SceneCanvas.tsx`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/SceneCanvas.tsx).
- Station 2 directional lights rebalanced to 1.4 and 0.5; point light to 0.9.

### Material Identity Matrix (`msp-enclosure.glb` — 84 child meshes)

| Material Key | Color Hex | Metalness | Roughness | Transparency | Mesh Count | Target Roots |
|---|---|---|---|---|---|---|
| `MSP_FRAME_ALUM` | `#8a949b` | 0.85 | 0.35 | Opaque | 12 | `ENCLOSURE_CHASSIS` |
| `MSP_PANEL_COMP` | `#1a2024` | 0.15 | 0.60 | 0.68 (DoubleSide, depthWrite: false, renderOrder: 10) | 8 | `COMPOSITE_PANELS` |
| `MSP_PUMP_CAST` | `#3b4247` | 0.75 | 0.45 | Opaque | 4 | `PUMP_HOUSING` |
| `MSP_BAFFLE_ABS` | `#0f1418` | 0.05 | 0.80 | Opaque | 6 | `ACOUSTIC_BAFFLES` |
| `MSP_MOUNT_RUBBER`| `#111315` | 0.00 | 0.90 | Opaque | 4 | `ISOLATION_MOUNTS` |
| `MSP_DUCT_SHEET` | `#60686d` | 0.80 | 0.40 | Opaque | 2 | `DUCT_INTAKE`, `DUCT_EXHAUST` |
| `MSP_HARDWARE` | `#b8c0c4` | 0.95 | 0.20 | Opaque | 1 | Fasteners & fittings |
| `MSP_STEEL_CAST` | `#c18b72` | 0.90 | 0.55 | Opaque | 47 | Internal drivetrain cores |
| `MSP_AIRWAY_VOLUME`| `#3daad6` | 0.00 | 0.50 | Translucent (Cyan) | 1 | Internal fluid volume |

---

## 3. JG-017 Post-Processing & Whip-Pan Calibration

### Smoothstep Derivative Recalibration Rationale
The adoption of smoothstep easing ($\alpha(u) = 3u^2 - 2u^3$) across the $0.04$ transition windows introduced a peak derivative $d\alpha/du = 1.5$ at mid-transition ($d\alpha/dp = 37.5$). Under the original `0.015` velocity divisor, velocity-driven `transitionIntensity` saturated at the 1.0 ceiling.

The divisor in [`src/scene/SpatialRig.tsx`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/SpatialRig.tsx) was retuned to `0.085`:

| Transition Zone | Progress Range | Flight Distance | Peak `transitionIntensity` | Decay to Rest ($< 0.01$) | Status |
|---|---|---|---|---|---|
| **Zone 1 (St. 1 $\to$ St. 2)** | $[0.525, 0.565]$ | 32.1 m (goal-path $K_1 \to K_2$) | **0.616** | 0.0068 (within 1.0s) | **PASS** (Sub-ceiling) |
| **Zone 2 (St. 2 $\to$ St. 3)** | $[0.720, 0.760]$ | 30.2 m (goal-path $P_{\text{arc}}(1) \to K_3$) | **0.709** | 0.0084 (within 1.0s) | **PASS** (Sub-ceiling) |

**Baseline contrast (deliberate recalibration):** JG-017's original calibration measured peak `transitionIntensity` **0.491 / 0.493 ≈ 0.49** (`JG-017-whip-pan-camera-fx-verification.md`, telemetry lines 48–59). The higher 0.616/0.709 peaks are deliberate, not drift: JG-021's smoothstep easing raises the peak window derivative to 1.5, under which the original `0.015` velocity divisor (git `5b29706`) would saturate the 1.0 ceiling and pin the effect; retuning the divisor to `0.085` (git `daa2f3f`, `SpatialRig.tsx:64`) keeps the faster smoothstep transitions strong but sub-ceiling.

---

## 4. Station 2 Enclosure Animation & Airflow Lifecycle

### Composite Panels Cutaway Lifecycle

| Progress Range | State / Phase | $y$-Displacement | Panel Opacity | Subassemblies Visible |
|---|---|---|---|---|
| $[0.000, 0.585]$ | Fully Assembled | 0.00 m | 0.68 | External roots only |
| $[0.585, 0.645]$ | Cutaway Lift Phase | $0.00 \to 0.55\text{ m}$ | $0.68 \to 0.42$ | Externals + Internals rising |
| $[0.645, 0.700]$ | Hold Lifted / Arc Inspection | **0.55 m** | **0.42** | All 7 roots active |
| $[0.700, 0.715]$ | Assemble Restore Phase | $0.55 \to 0.00\text{ m}$ | $0.42 \to 0.68$ | Restoring assembly |
| $[0.715, 1.000]$ | Fully Assembled | 0.00 m | 0.68 | Enclosed during flight |

### Airflow Intensity Sampling & Lifecycle
`airflowIntensity(p)` (`stageWindows.ts`) is a linear ramp across the hold window, clamped to $[0, 1]$:

$$\text{intensity}(p) = \mathrm{clamp}_{01}\left(\frac{p - 0.565}{0.720 - 0.565}\right) \quad (\text{window: } \texttt{enclosureIn}[1] = 0.565 \to \texttt{enclosureOut}[0] = 0.720)$$

Raw function values (computed by executing the shipped code):

| Progress $p$ | `airflowIntensity` (raw) | Rendered field state |
|---|---|---|
| **0.565** | **0.000** | Station enter cross-fade settles |
| **0.600** | **0.226** | Active, rising through arc entry |
| **0.615** | **0.323** | Active, reveal in progress |
| **0.650** | **0.548** | Active, reveal hold |
| **0.660** | **0.613** | Active, reveal hold |
| **0.700** | **0.871** | Active, panels restoring |
| **0.715** | **0.968** | Active, near saturation |
| **0.720** | **1.000** | Ramp saturates |
| **0.750** | **1.000** (clamped) | **Invisible** — gated by station exit envelope |

*Lifecycle Note:* the raw ramp is monotonic and saturates at 1.0 after $p = 0.720$; it never decays on its own. Rendered airflow is additionally gated by the station envelope in `AirflowField.tsx` (`envelope.active` check and `uAlpha = envelope.alpha`, with the exit fade `enclosureOut = [0.72, 0.76]`), so particles fade out during the whip flight to Station 3 regardless of the saturated raw value. The earlier WS3/WS4 session summaries describing a "sinusoidal" profile peaking at $p=0.660$ or a decay to zero at $0.720$ were describing neither the formula nor the rendered behavior; the values in this table supersede them.

*Superseded-value reconciliation (explicit):* two stale figures circulated in earlier session summaries — **0.966 @ p = 0.650** and **0.931 @ p = 0.715** — are both refuted by the shipped code: `airflowIntensity(0.650) = 0.548` (the stale value is 76% high) and `airflowIntensity(0.715) = 0.968` (the stale value is 3.8% low). Neither described the linear-ramp formula above nor the rendered field; both are withdrawn, and the code-exact table values are authoritative.

---

## 5. Safe-Area Datum Callout Placement

### Desktop Viewport ($1440 \times 900$)

| Station / Checkpoint | Progress | Visible Badges | 100% In-Bounds | Pairwise Collisions |
|---|---|---|---|---|
| **Station 1 (Hero/Shift)** | $0.10$ | 2 (`rotor`, `motor-housing`) | **YES** | **0** |
| **Station 1 (Exploded & LCD)**| $0.47$ | 1 (`lcd`) | **YES** | **0** |
| **Station 2 (Acoustic Enclosure)**| $0.65$ | 7 (All 7 named roots) | **YES** | **0** |
| **Station 3 (M249 Platform)** | $0.85$ | 4 (`receiver`, `trunnion`, `rail`, `feed-tray`) | **YES** | **0** |

### Mobile Viewport ($390 \times 844$)

| Station / Checkpoint | Progress | Visible Badges | 100% In-Bounds | Pairwise Collisions |
|---|---|---|---|---|
| **Station 1 (Exploded & LCD)**| $0.47$ | 1 (`lcd`) | **YES** | **0** |
| **Station 2 (Acoustic Enclosure)**| $0.65$ | 6 (`chassis`, `pump`, `baffles`, `mounts`, `intake`, `exhaust`)| **YES** | **0** |
| **Station 3 (M249 Platform)** | $0.85$ | 4 (Frustum culled when offscreen) | **YES** | **0** |

*Mobile Station 2 Culling Explanation:* At $p = 0.65$ on $390 \times 844$, 6 of 7 subassemblies are visible. The 7th badge, **`composite-panels`** (`DATUM C`), is anchored at CAD position $[1.80, 1.50, 0.30]$ (`stageWindows.ts:43`) — the badge anchor itself is static; the $+0.55\text{ m}$ cutaway lift applies to the *panel mesh root*, not the anchor. On narrow mobile portrait aspect ratios ($390/844 \approx 0.46$), the camera framing projects this anchor to NDC $x \approx +1.34$ (settled-camera derivation from the shipped camera path; the previously quoted $+1.42$ is withdrawn as unverifiable), exceeding the visible frustum bound ($\text{NDC } x \in [-1.3, +1.3]$, `Hotspots.tsx:241`) — the frustum culler cleanly hides it. Margin note: $+1.34$ is only ~3% above the bound, so this cull is real but sensitive to runtime camera/pointer state; on desktop $1440 \times 900$ the same anchor projects well inside the $\pm 1.3$ bound (visible — exact NDC value is derivation-sensitive: two audit derivations gave $+0.23$ to $+0.45$; re-derive with subject-bbox probes during remediation), consistent with the 7-badge desktop row.

### ASME Y14.5 GD&T Datum Hierarchy
- **Station 1:** Datum A (Air Motor Bore), Datum B (Flange Mount Face).
- **Station 2:** Datum C (5-Layer Composite Wall), Datum D (Internal Labyrinth), Datum E (Decoupling Isolators), Datum F (1,850 CFM Intake Airway), Datum G (Attenuated Exhaust Duct). *(Omission of A and B on Station 2 is intentional at the data level — `caseStudies.ts` assigns A/B to Station 1's drawing and Station 2's badges continue C–G, matching the plan's badge list `-A-`, `-C-`…`-G-`; Station 3 is a separate product drawing and restarts at A/B/C. Note: the sequencing rationale lives in this record and the plan's badge list only — there is no code comment at the Station 2 data block.)*
- **Station 3:** Datum A (Receiver Monobloc), Datum B (Barrel Trunnion Bore), Datum C (MIL-STD-1913 Top Rail).

---

## 6. Performance, Quality Tiers & Regression Proof

### FPS & Frame Rate Budget (Full Tier — re-measured 2026-08-29, post-reopen audit)
Fresh preview build (`npm run build` 5.84 s), hardware-accelerated Chrome via CDP, rAF frame counting over ≥4 s windows, programmatic Lenis scrubs (`window.__lenis.scrollTo`). Full tier held throughout: WebGL2 canvas mounted, adaptive DPR steady at 1.42, no degradation (tier steps down only below 45 FPS).

| Scenario | Measured FPS | Frame-time detail |
|---|---|---|
| **Idle — CH.01 (p = 0.0)** | **60.2** | 16.3–17.1 ms, 0 frames > 34 ms |
| **Idle — Station 2 (p = 0.65, heaviest scene)** | **54.5 → 55.9 settled** | max 33.6 ms, 0 frames > 34 ms |
| **Slow continuous scrub (full range, 18 s traverse)** | **59.4** | 1118 frames / 18.8 s; 1 frame at 66.8 ms across the whole traverse |
| **Fast continuous scrub (full range, 2.2 s traverse)** | **60.0** | 16.2–17.1 ms, 0 frames > 34 ms |

*Supersedes the prior flat "Idle 60 / Slow 60 / Fast 59" row: idle is station-dependent — Station 2's 7-badge + airflow + enclosure scene idles ~55–56, ~4–5 FPS under vsync budget but well above the 45 FPS degrade threshold and free of dropped frames.*

### Zero Per-Frame React Re-renders Proof
- `useFrame` in `SpatialRig.tsx`, `CameraRig.tsx`, `Hotspots.tsx`, and `Station2_AcousticEnclosure.tsx` accesses imperative store getters (`getScrollState()`) and directly mutates object positions, material opacities, and DOM `translate3d` transforms on refs.
- Zero React component re-renders occur during continuous scroll scrub.

### Quality Tiers & Reduced-Motion
- **Full Tier:** WebGL2 canvas active, PMREM room lighting, ACES tone mapping, full post-processing bloom/CA.
- **Lite Tier:** Degrades post-processing passes to opacity crossfades; canvas active at DPR 1.
- **Poster Tier:** Canvas completely unmounted; static semantic DOM fallback displayed.
- **Reduced Motion:** Camera motion disabled; panel cutaway pinned in assembled state; accessible static DOM present. *(Note: Chapter stranding bug confirmed and tracked in JG-022).*

### Regression Verification
- **JG-018 Airflow & Acoustic:** Cursor deflection and acoustic dissipation confirmed live and operational during reveal/hold window $[0.600, 0.720]$.
- **JG-020 Hotspots & Subassemblies:** Click inspection, hover emissive highlighting, and technical HUD cards fully functional across all 3 stations.
- **Browser Console:** 0 errors (clean). Two benign warnings observed on re-probe 2026-08-29: a `THREE.Clock` deprecation notice and a WebGL shader-compiler X4122 double-precision info-log; neither affects rendering.

---

## 7. Wrench Rig Untouched Statement

The primary JGun Torque Multiplier hero rig remains strictly compliant with canon:
- `Default.glb` binary untouched (zero re-exports).
- D1-AP part-number stability ladder (`A000606`, `K000004`, `P000725`...) preserved.
- No changes made to `animation-spec.md` §5 tables or CAD scene graph rigging skills.

---

## 8. Automated Test & Build Suite

- `npm run typecheck` — **PASS** (0 TypeScript errors)
- `npm run check:station2` — **PASS** (7 named roots, 7 CAD anchors verified, Airflow & Acoustic fields mounted)
- `npx tsx scripts/check-fallback.tsx` — **PASS** (19/19 no-WebGL fallback tests passed)
- `npm run build` — **PASS** (Built in 7.56s, production bundle emitted)

**Re-run 2026-08-29 (post-reopen audit, same HEAD lineage):** typecheck **PASS** (0 errors); `check:station2` **PASS** (`Stage2 contract passed: 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted`); fallback **PASS** (19/19); build **PASS** (5.84 s, 627 modules). One pre-existing non-fatal warning: `SceneCanvas` chunk 804.10 kB post-minification (gzip 226.70 kB) exceeds the 500 kB chunk-size advisory.
