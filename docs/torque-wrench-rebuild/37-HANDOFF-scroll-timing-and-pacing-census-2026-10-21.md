# JGUN Torque Wrench — Scroll Animation Timing, Pacing Census & "Stop and Appreciate" Handoff

**Date:** 2026-10-21  
**Workspace:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`  
**Branch:** `torque-wrench/rebuild` (HEAD: `bdcb22f3`, clean working tree)  
**Author / Harness:** Antigravity IDE (Opus 5.5 session interrupted by model quota limit; completed and handed off via Gemini 3.8 Flash)  
**File Location:** `docs/torque-wrench-rebuild/37-HANDOFF-scroll-timing-and-pacing-census-2026-10-21.md`  

---

## 1. Executive Summary & Goal

### User Objective
Address severe scroll pacing imbalances across the private interactive torque wrench page (`/torque-wrench/`):
1. **Pacing Disparity**:
   - Stretches of "scroll and scroll with no significant change" (e.g., Drafting table, middle of the Ring switch knurl).
   - Compressed stretches where camera sweeps, machining operations, and part fades all collide at once (e.g., Clutch switch, Isolation orbit, Materials test, Extraction), forcing the user to struggle to slow down.
2. **Stop and Appreciate**:
   - Allow the user to stop anywhere along the path and look around without losing the narrative trajectory.
   - Dual modes: passive subtle parallax (±25–30° deflection cone when paused) and an active inspection toggle (free orbit around subject with automatic camera whip-back on scroll resume).
3. **Timed Vignette Option**:
   - For long continuous operations (the 28s Ring knurl and 43s Input Shaft story), provide locations that trigger a sequence to run over a predefined duration (like pressing play on a film), with manual scroll scrubbing available as an override.

---

## 2. Work Accomplished This Session

### A. Audit of Previous Agent Plan & Mathematical Flaw Discovery
A prior agent proposed reducing drafting scroll with multiplier `0.45x`, reducing ring multiplier `18x -> 4.5x`, and capping narrative velocity. Opus-5.5 audited this against `src/scene/torque-wrench/scrollPacing.ts` and discovered critical flaws:
1. **Mathematical Inversion Bug**: The derivative weight in `scrollPacing.ts` is:
   $$w(u) = 1 + (m - 1)(1 - \cos(2\pi u))$$
   If multiplier $m < 0.5$, then at the midpoint ($u = 0.5$), $w = 1 + 2(m - 1) < 0$. The derivative becomes negative, inverting scroll progression and breaking seek, reload, and reverse scrubbing.
2. **The "Slog & Rush" Double-Whammy Root Cause**: The cosine weight function enforces $1.0\times$ at span boundaries while peaking at $(2m - 1)$ in the center. For the Ring Switch ($m = 18$):
   - First 10% and last 10% move at near $1.0\times$ (**0.42 viewports each**). The camera rushes in and out.
   - The middle 40% peaks at **$35\times$** (**24.5 viewports**). The machining drags on endlessly.
3. **Ignored Collision Beats**: The previous plan ignored Clutch (2.4 vp), Isolation (2.6 vp), Materials (4.4 vp), Return (1.3 vp), Extraction (3.3 vp), and Exploded Hold (0.5 vp) — all running at unbuffered $1.0\times$.

### B. Oryzo.ai REA Teardown Review (`oryzo-lusion-teardown.md`)
Opus-5.5 reviewed the reverse-engineered Lusion engine:
- **No Story Velocity Capping**: Oryzo does *not* decouple narrative time from scroll position; 3D content is a pure mathematical function of scroll ratio.
- **Scroll Slicing**: Oryzo prevents sensory overload by slicing effects into sequential non-overlapping scroll windows rather than stacking camera, text, and shaders.
- **Lenis Tuning**: Our current Lenis instance (`conductorRuntime.ts:242`) uses `{ duration: 0.8 }` (fixed ease). Switching to `{ lerp: 0.2 }` natively replicates Oryzo’s `1 - exp(-12 * dt)` exponential smoothing without extra dependencies.
- **Second-Order Dynamics**: Pointer look utilizes $f = 1.35, z = 0.5, r = 1.25$. For our cinematography, this offset should fade to zero while scrolling and unlock when the user pauses.

### C. Automated Headless Pacing Census (Step 0)
Rather than guessing or trusting multimodal vision models (which confabulate on dark CAD viewports), an automated headless census was built and executed:
- **Preview Server**: Running on port `5341` (daemon task `task-70`, `npx vite preview --port 5341 --strictPort`).
- **Census Script**: `.scratch/pacing-census/census.mjs`.
  - Swept the entire page in **0.1 viewport increments** (953 physical samples across 95.24 viewports).
  - Queried `window.__torqueNarrative` and `window.__torqueWorld` per frame.
  - Recorded camera position, quaternion, FOV, mechanical rig channels (`shift`, `explodeFactor`, `stageZ`, `handleZ`), inspection runtime (`ring.time`, `subjectTime`), isolation opacity, DOM copy opacity, and downsampled luminance frames (noise floor: `0.00`).
  - Output: `.scratch/pacing-census/run.json` (13 MB, 0 errors, 100% full tier).
- **Analysis Script**: `.scratch/pacing-census/analyze.mjs`.
  - Processed all 953 samples and generated `.scratch/pacing-census/summary.json`, `rows.json`, and an SVG telemetry chart `pacing-chart.svg`.

---

## 3. Measured Census Findings (Hard Data)

Total physical scroll range: **95.24 viewports** (85,718 px at 900px height).

| Beat ID | Narrative Span ($p$) | Viewports | Camera Deg/vp | Opacity Rate | Mech Rate | Machining Rate | Peak Concurrent | Dead vp | Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `drafting-detail` | `0.000 – 0.060` | 2.6 | 19.4°/vp | 0.0 | 0.0 | 0.0s | 2 | 0.0 | Fast pan across drawing |
| `drafting-authorship` | `0.060 – 0.105` | 2.0 | 34.2°/vp | 0.0 | 0.0 | 0.0s | 1 | 0.0 | Title block hold |
| `drafting-input-note` | `0.105 – 0.150` | 1.9 | 52.3°/vp | 0.0 | 0.0 | 0.0s | 1 | 0.0 | Detail B note hold |
| `drafting-output-note`| `0.150 – 0.195` | 2.0 | 69.5°/vp | 0.0 | 0.0 | 0.0s | 1 | 0.0 | Output note hold |
| `drafting-rake` | `0.195 – 0.265` | 3.1 | 10.5°/vp | 0.0 | 0.0 | 0.0s | 1 | 0.6 | Sheet travel |
| `drafting-registered` | `0.265 – 0.320` | 2.4 | 0.0°/vp | 0.0 | 0.0 | 0.0s | 0 | **2.4** | **Dead Hold**: Zero motion |
| `breakthrough-anticipation`|`0.320 – 0.360`| 1.7 | 0.0°/vp | 0.0 | 0.0 | 0.0s | 0 | **1.7** | **Dead Hold**: Lamp flicker |
| `breakthrough-trace` | `0.360 – 0.395` | 3.0 | 0.0°/vp | 0.0 | 0.0 | 0.0s | 0 | **3.0** | **Dead Hold**: Shader web only |
| `breakthrough-pressure`| `0.395 – 0.420` | 2.8 | 11.4°/vp | 0.0 | 0.0 | 0.0s | 1 | 0.5 | Model pushes paper |
| `breakthrough-rupture` | `0.420 – 0.435` | 1.7 | 18.8°/vp | 0.0 | 0.0 | 0.0s | 1 | 0.6 | Paper tears |
| `breakthrough-emergence`|`0.435 – 0.460` | 3.7 | 35.2°/vp | 0.0 | 0.0 | 0.0s | 2 | 0.3 | Rises above pit |
| `inspection-ring` | `0.460 – 0.505` | **35.5** | 23.4°/vp | 7.0 | 0.0 | 28.0s | **3** | **12.9** | **Major Slog**: 37% of site! |
| `mechanism-switch` | `0.505 – 0.560` | 2.4 | **133.9°/vp**| 1.0 | 1.0 | 0.0s | **3** | 0.2 | **Severe Rush**: 321° cam turn |
| `inspection-isolation`| `0.560 – 0.620` | 2.6 | **197.7°/vp**| 2.0 | 0.0 | 0.0s | 2 | 0.6 | **Severe Rush**: 514° cam turn |
| `inspection-shaping` | `0.620 – 0.680` | 3.9 | 12.4°/vp | 0.0 | 0.0 | 7.1s | 2 | 0.6 | Cutter contacts groove |
| `inspection-bullet-time`|`0.680 – 0.720` | 4.8 | 10.2°/vp | 0.0 | 0.0 | 2.3s | 2 | 0.6 | Cutter contact orbit |
| `inspection-materials` | `0.720 – 0.755` | 4.4 | **117.6°/vp**| 0.0 | 0.0 | **15.2s**| 2 | 1.5 | **Severe Rush**: 517° cam turn + FEA |
| `inspection-hobbing` | `0.755 – 0.790` | 5.2 | 68.1°/vp | 0.0 | 0.0 | 7.0s | 2 | 0.0 | 354° cam turn + hob cut |
| `inspection-runout` | `0.790 – 0.825` | 1.8 | 47.7°/vp | 1.0 | 0.0 | 11.3s | 2 | 1.0 | 86° cam turn + dial indicator |
| `inspection-return` | `0.825 – 0.855` | 1.3 | **144.4°/vp**| 1.9 | 0.0 | 0.0s | 2 | 0.6 | **Severe Rush**: 188° cam return |
| `mechanism-extraction` | `0.855 – 0.930` | 3.3 | **103.6°/vp**| 1.8 | **13.6** | 0.0s | **3** | 0.1 | **Severe Rush**: 342° cam + 5 stages |
| `mechanism-exploded-hold`|`0.930 – 0.940`| **0.5** | 0.1°/vp | 0.0 | 0.0 | 0.0s | 0 | 0.5 | **Lost Payoff**: Blown in 0.5 vp! |
| `close-settle` | `0.940 – 0.980` | 1.7 | 26.0°/vp | 0.0 | 14.5 | 0.0s | 2 | 0.0 | Wrench reassembly |
| `close-ownership` | `0.980 – 1.000` | 0.9 | 0.3°/vp | 0.0 | 0.1 | 0.0s | 1 | 0.8 | Final composition hold |

### Key Takeaways from the Data:
1. **Continuous 8.2 Viewport Dead Zone** (`p = 0.2533` to `0.3985`): Across `drafting-registered`, `breakthrough-anticipation`, and `breakthrough-trace`, the camera does not move at all, and no geometry transforms. The user scrolls through over 7,000 pixels with only subtle 2D linework and blue shader cracks.
2. **The 35.5 Viewport Ring Swamp**: Over 37% of the entire site's physical scroll is trapped inside a single 27mm ring switch knurl inspection. 12.9 of those viewports have near-zero visual motion.
3. **The Five Critical Rush Collisions**:
   - `mechanism-switch`: 321° camera sweep + shift slider in 2.4 viewports (134°/vp).
   - `inspection-isolation`: 514° orbit around the entire wrench + background fade in 2.6 viewports (198°/vp).
   - `inspection-materials`: 517° orbit + 15.2s of FEA material evaluation in 4.4 viewports (118°/vp).
   - `mechanism-extraction`: 342° camera orbit + 13.6 units of 5-stage mechanical explosion separation in 3.3 viewports (104°/vp).
   - `mechanism-exploded-hold`: Allocated only **0.5 viewports** (450 px). The exploded assembly is gone before the reader can even orient their eyes.

---

## 4. Architectural Solutions & Next Actions

### Step 1: Flat-Top / Trapezoidal Pacing Kernel (`scrollPacing.ts`)
Replace the pure raised-cosine multiplier kernel with a trapezoidal/smoothstep kernel that maintains a constant multiplier across the interior and smooth cubic blends at the ends:
- Eliminates the $(2m - 1)$ center spike that created the 35× slog in the ring.
- Guarantees $w(u) \ge m > 0$, completely preventing scroll direction inversions.

### Step 2: Scroll Budget Reallocation
Maintain the total page length (~90–95 viewports) while reallocating physical distance:
1. **Reclaim from Ring Switch**: Drop ring multiplier from 18 down to ~4.5x (reclaiming ~25 viewports).
2. **Reclaim from Drafting Dead Zone**: Compress the 8.2 vp static drawing hold to ~3 vp.
3. **Reinvest in Rushed Collisions**:
   - `mechanism-switch`: Expand from 2.4 vp to 5.0 vp (~64°/vp).
   - `inspection-isolation`: Expand from 2.6 vp to 5.5 vp (~93°/vp).
   - `mechanism-extraction`: Expand from 3.3 vp to 6.5 vp (~52°/vp).
   - `mechanism-exploded-hold`: Expand from 0.5 vp to **3.5 vp** (gives the user an actual hold to inspect the parts).
   - `inspection-materials`: Sequence the camera move *before* the FEA material swap instead of stacking them simultaneously.

### Step 3: Timed Vignette Engine ("Play Sequence" with Scrub Override)
Incorporate the owner's concept:
- When arriving at the Input Shaft machining ($p = 0.62$) or Ring Knurl ($p = 0.46$), a sleek HUD button/indicator offers: `[ ▶ Play Machining (Space) ]`.
- Sequence advances smoothly on wall clock time (leveraging the already-present `inspectionPlayback.ts`).
- If the visitor scrolls, native scroll scrubbing seamlessly resumes control.

### Step 4: "Stop and Appreciate" Camera Controller (`RuntimeWorld.tsx`)
- **Mode A (Passive Look Parallax)**:
  - Add mouse pointer tracking filtered through Oryzo's `SecondOrderDynamics` ($f = 1.35, z = 0.5, r = 1.25$).
  - When scroll velocity is 0, allow a bounded ±25° spherical look-cone around the active camera target.
  - As scroll resumes, dynamically lerp the look offset back to zero so authored trajectory is never corrupted.
- **Mode B (Active Free Look Toggle & Whip-Back)**:
  - Floating HUD pill `[ 🔍 Free Look / Inspect (F) ]`.
  - Freezes scroll progress $p^*$, mounts orbit controls centered on the active part.
  - When toggled off OR when wheel delta $|\Delta y| > 80\text{px}$, executes an automatic 0.6s quintic camera slerp back to the authored narrative pose and unlocks scroll.

---

## 5. Artifacts and File Locations

- **Census Raw Data**: `.scratch/pacing-census/run.json` (953 samples, telemetry + luminance).
- **Census Summary**: `.scratch/pacing-census/summary.json`.
- **Census SVG Telemetry Chart**: `.scratch/pacing-census/pacing-chart.svg`.
- **Census Automation Script**: `.scratch/pacing-census/census.mjs`.
- **Census Analysis Script**: `.scratch/pacing-census/analyze.mjs`.
- **Preview Server**: Running in background on port `5341` (`task-70`).
- **Core Pacing Code**: `src/scene/torque-wrench/scrollPacing.ts`.
- **Story Beats**: `src/scene/torque-wrench/beats.ts`.
- **Camera Rig**: `src/scene/torque-wrench/JourneyCamera.ts` and `RuntimeWorld.tsx`.
- **Playback Clock**: `src/scene/torque-wrench/inspectionPlayback.ts`.

---

## 6. Ready-to-Paste Prompt for Receiving Session

```markdown
Resume the JGUN private torque-wrench rebuild scroll timing and "Stop and Appreciate" implementation.

1. Review the canonical handoff document:
   docs/torque-wrench-rebuild/37-HANDOFF-scroll-timing-and-pacing-census-2026-10-21.md
   and the measured census data in .scratch/pacing-census/summary.json.

2. Current Repository State:
   - Workspace: C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench
   - Branch: torque-wrench/rebuild (HEAD bdcb22f3, working tree clean)
   - Vite preview server is already running on port 5341 (daemon task-70).

3. Immediate Next Actions:
   a. Refactor `src/scene/torque-wrench/scrollPacing.ts` to replace the cosine kernel with a flat-top trapezoidal kernel that prevents center-spiking and eliminates negative derivatives.
   b. Rebalance the pacing spans in `scrollPacing.ts` and `beats.ts`:
      - Reduce Ring Switch multiplier from 18 to ~4.5x.
      - Compress the drafting dead zone (0.265 to 0.395).
      - Expand the rushed collision beats (`mechanism-switch`, `inspection-isolation`, `mechanism-extraction`, and especially `mechanism-exploded-hold` from 0.5 vp to 3.5 vp).
   c. Implement the "Stop and Appreciate" camera in `RuntimeWorld.tsx`:
      - Mode A: Passive SecondOrderDynamics pointer look (±25° cone) active only when scroll is stationary, fading to 0 during scroll.
      - Mode B: Active Free Look toggle button with 0.6s quintic whip-back on wheel scroll resume.
   d. Re-run `node .scratch/pacing-census/census.mjs --origin=http://localhost:5341 --force` and `analyze.mjs` to prove that rush collisions and dead zones have been resolved.
   e. Ensure all unit tests (`npm test`) and typecheck (`npm run typecheck`) pass before finalizing.
```
