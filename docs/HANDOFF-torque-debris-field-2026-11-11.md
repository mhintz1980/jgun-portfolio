# Handoff: Torque Wrench Debris Field, Metrology Environment, Machining Assets & Bullet-Time Directives

- **Date:** 2026-11-11
- **Author/Session:** Antigravity (Pair Programming Session)
- **Active Branch:** `feat/torque-debris-field`
- **Worktree Path:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\.scratch\worktrees\torque-debris-field`
- **Base Commit:** `7a51bb9d` (`feat(torque-wrench): denser 214-shard 360-degree debris field, near misses, and bullet-time shockwave` pushed to `origin/feat/torque-debris-field` and `origin/torque-wrench/rebuild`)
- **Dev Server Port:** `:5215` (`http://localhost:5215/torque-wrench/`)

---

## 1. Executive Summary

This session accomplished two major physics and rendering milestones requested by Mark on the torque wrench page:
1. **Denser Shard Cloud & Bullet-Time Shockwave:** Increased the paper rupture count from 76 to 214 fragments (`breakthroughGeometry.ts`), structured a sightline-aligned 360° shard cloud (`shardDome.ts`) providing 60–150 fragments across every azimuth of the bullet-time camera orbit with true near-miss close calls (passing within 3.3–10.5 cm of the camera lens), and implemented a triple-ring concentric expanding shockwave shader (`SHOCKWAVE_GLSL` in `privateSheetRuntime.ts`) caught by bullet-time at `p = 0.43`, creeping at 0.10x speed during the orbit, and accelerating outward past the camera as bullet time ends (`p = 0.452..0.47`).
2. **First-Pass Metrology Environment & Interactive Props:** Implemented Option A (precision black Starrett granite surface plate + cast-iron T-slot apron + interactive mechanical pencil, digital calipers, micrometer, gauge blocks, plug pins, V-block, and dial height gauge in `MetrologyWorkbenchProps.ts`).

### Current Owner Review & Critical Directives
Mark reviewed the live build and provided 5 explicit, high-priority feedback items regarding asset quality, environment realism, legacy HUD leaks, portal electricity, and bullet-time perception. These 5 items define the mandate for the receiving session.

---

## 2. Detailed Owner Feedback & Assessment

### Item 1: Opening Desk & Environment Quality Standards
- **Owner Ruling:** The procedural metrology table and the low-poly props in the opening are **not up to portfolio quality standards**. The granite/T-slot apron is better than the flat procedural fake wood, but it will not work in its current state.
- **Visual & Interactive Reference Benchmarks:**
  - **Oryzo (`https://oryzo.ai/`):** Tactile 3D desktop with natural lighting, premium material finishes, realistic room grounding, and delicate physics-based object interactions (nudging, scooting, rolling props on the table with the cursor).
  - **Lusion Gemini Style (`https://exp-gemini.lusion.co/style`):** Gold-standard WebGL atmosphere, volumetric room lighting, cinematic studio environment, shallow depth-of-field blur, and organic transitions between a grounded physical space and high-concept surreal motion.
- **Environment Structure:** Mark does **NOT** want a background that goes on forever into void during the opening. It must **resemble the real world and feel situated inside an authentic room** (an inspection laboratory, metrology cleanroom, or precision machine shop).
- **Depth & Boundary:** The background room should have natural architectural depth, possibly **blurred at a certain focal depth** (depth-of-field / atmospheric drop-off), rather than an infinite procedural ground plane.
- **Transition to Infinite Horizon:** Mark is **open to an infinite horizon / boundless surreal space ONCE the torque wrench model smashes through the desk and the shockwave blast wave hits** (`p >= 0.42`). The opening should begin in a grounded physical room; the violent breakthrough is what shatters the room into the boundless cinematic arena.

### Item 2: Machining Sequence Asset Quality (Knurling Tools & Shaper Cutter)
- **Owner Ruling:** The secondary tooling models used in the machining sequences (the knurling tool and the shaper cutter) **need to be significantly stepped up**.
- **The Contrast Problem:** Next to the hyper-detailed, authentic CAD geometry of the `Default.glb` industrial torque wrench, the procedural/rough tooling meshes look substandard and break immersion.
- **Target:** High-fidelity CAD geometry, realistic toolholder bodies, carbide inserts/cutting wheels with authentic metallic PBR shaders (lathe toolpost, knurl wheels with real diamond teeth/axle pins, shaper cutter disc with precision involute flutes and clamping arbor).

### Item 3: Residual Legacy HUD Text Leaking into Opening & Closing
- **Owner Finding:** The old static DOM HUD text is still visible during the opening sequence and in the final frames after the exploded animation.
- **Exact Leaked Strings Identified:**
  - *Opening Sequence:*
    ```
    [TORQUE WRENCH] [THE QUIET MACHINE] [HOMEPAGE]
    Case study 01 · Work in progress
    Industrial Torque Wrench
    Five chapters: drafting breaks through into mechanism, inspection, and close.
    ```
  - *Final Frames after Exploded Animation:*
    ```
    [TORQUE WRENCH] [THE QUIET MACHINE] [HOMEPAGE]
    Work in progress. Pneumatic Torque Wrench. The five-chapter story runs from drafting and breakthrough into mechanism, inspection, and close.
    ```
- **Root Cause Located:** In `src/scene/torque-wrench/TorqueWrenchPage.tsx`:
  - Lines 75–84: `<header className="torque-header">` renders `<PrivatePageNav>` and `<div className="torque-hero">` with the opening eyebrow, title, and intro.
  - Lines 98–104: `<footer className="torque-footer">` renders `<PrivatePageNav>` and `<p className="torque-colophon">` with the closing colophon text.
  - While `TorqueHUD` is active in `stage === 'scene'`, these static header/footer elements are still mounted in the DOM without being hidden or synchronized, cluttering the screen behind/around the 3D canvas and HUD.

### Item 4: Portal Electricity & Jumping Lightning Bolts
- **Owner Reference Image:** Saved locally at `C:\Projects\Misc\portal-desk.png` (also recorded in conversation media at `C:/Users/Markimus/.gemini/antigravity/brain/c5d6b309-0b51-4d7b-acb9-d4b7c34cabfb/.user_uploaded/media_1794456243804_e0644b3f.jpg`).
- **Visual Behavior in Reference:**
  - Vibrant blue/cyan electrical energy pulses through deep vertical fissures along the rocky subterranean walls of the portal.
  - As the metal torque wrench rises above the drawing, **electricity jumps from the portal lip and rocky walls to the wrench body in the form of multiple dynamic lightning bolts** of varying thicknesses and branch intensities.
  - These lightning arcs must remain active and crackling during the 360° bullet-time orbit.

### Item 5: Bullet-Time Time-Dilation Perception & Mechanics
- **Owner Diagnosis:** Currently, bullet-time feels like **lag** rather than **time slowing down**.
- **Background Parallax / Visual Disorientation:** The background during bullet time needs a strong visual cue—such as a **parallax effect** moving relative to camera rotation/scroll to make the user feel off-balance and perceptually aware of time dilation.
- **Scroll Mechanics:** The simplest and most reliable way to deliver the intended cinematic experience is an **automatic scroll sequence** through the entire bullet-time sequence (`p = 0.430..0.452`) that locks in the exact time curve and does not allow user scroll jitter to cause perceived frame lag.
- **Free Look Opt-Out:** Allow the existing "Free Look / Inspect (F)" mode if the user explicitly presses the button, but default to an authored, deterministic cinematic sweep.
- **Alternative Time-Dilation Indicators to Explore:**
  - Lens distortion / subtle chromatic aberration or radial warp at the periphery during bullet-time.
  - Visual time-scale HUD clock or audio/visual cue (e.g., slow-motion sonic sub-bass pulse / time-dilation readout).
  - Shard trail / air-distortion heat-shimmer refraction around the frozen fragments.

---

## 3. Current Working Tree State

In `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\.scratch\worktrees\torque-debris-field`:

```
 M src/scene/drawing/DrawingLinework.tsx
 M src/scene/torque-wrench/PrivateSheet.tsx
 M src/scene/torque-wrench/privateSheetRuntime.ts
?? src/scene/torque-wrench/MetrologyWorkbenchProps.test.ts
?? src/scene/torque-wrench/MetrologyWorkbenchProps.ts
```

### Committed in `7a51bb9d` (already on `origin`):
- `src/scene/drawing/sheet/breakthroughGeometry.ts` (`FRAGMENT_TARGET = 156`, `BREAKTHROUGH_FRAGMENT_MIN = 110`, `MAX = 320`)
- `src/scene/torque-wrench/shardDome.ts` (360° azimuth golden-angle distribution + 5-role stratification with 40% near-miss grazing shell, 20% mid-field, 40% outer vanguard)
- `src/scene/torque-wrench/shardDome.test.ts`
- `src/scene/torque-wrench/privateSheetRuntime.ts` (Triple-ring concentric shockwave shader `SHOCKWAVE_GLSL`)
- `src/scene/torque-wrench/privateSheetRuntime.test.ts`
- `scripts/verify-jgun-opening.mjs`
- `scripts/verify-page-cinematography.mjs`

### Verification Status:
- TypeScript: `npx tsc --noEmit` passed with 0 errors.
- Unit Tests: `npx vitest run src/scene/torque-wrench/MetrologyWorkbenchProps.test.ts src/scene/torque-wrench/privateSheetRuntime.test.ts src/scene/torque-wrench/shardDome.test.ts` passed (41/41 tests passing).

---

## 4. Key File Architecture & Code Locations

| Component | File Path | Key Responsibilities & Line References |
|---|---|---|
| **Static Header & Footer (Old HUD Text)** | `src/scene/torque-wrench/TorqueWrenchPage.tsx` | Lines 75–84 (`<header className="torque-header">`), Lines 98–104 (`<footer className="torque-footer">`). Needs suppression/conditional display during live scene presentation. |
| **Desk Surface & Shockwave Shader** | `src/scene/torque-wrench/privateSheetRuntime.ts` | Lines 320–420 (`deskFragment`, `SHOCKWAVE_GLSL`, `DEFAULT_FACTORIES.desk`). Currently renders granite/T-slot apron. Needs real-world room enclosure with depth blur transitioning to infinite horizon on rupture. |
| **Drawing Linework Desk Fallback** | `src/scene/drawing/DrawingLinework.tsx` | Lines 188–280 (`deskFragment`). Mirrors desk fragment in non-private drawing pipeline. |
| **Interactive Props System** | `src/scene/torque-wrench/MetrologyWorkbenchProps.ts` | Contains 3D models and physics loop for props. Mark ruled the procedural prop quality insufficient. |
| **Portal Geometry & Materials** | `src/scene/torque-wrench/PitGeometry.ts`, `privatePitMaterial.ts`, `PitDirector.ts` | Owns the rocky pit walls, fissure light, and cap geometry. |
| **Lightning & Electrical Arcing** | `src/scene/torque-wrench/ElectricalDirector.ts`, `src/scene/drawing/sheet/lightning.ts`, `src/scene/torque-wrench/privateSheetRuntime.ts` | `pulseMaterial` and `lightningRibbon`. Needs extension to create jumping 3D lightning bolts between portal walls and rising CAD wrench during bullet time per `C:\Projects\Misc\portal-desk.png`. |
| **Knurling Tool Model** | `src/scene/inspection/ringRuntimeCore.ts` | Line 248 (`public/models/knurling-tool.glb`). Loaded during ring-switch inspection. |
| **Shaper Cutter Model** | `src/scene/inspection/shaft/tools.ts`, `cutterOutline.json`, `shaftRuntime.ts` | Procedural disc (`shaper-cutter-disc`). Needs replacement with high-detail CAD tool geometry. |
| **Bullet-Time Clock & Pacing** | `src/scene/torque-wrench/bulletTime.ts`, `scrollPacing.ts`, `ScrollConductor.tsx`, `OpeningCamera.ts` | Owns bullet-time time dilation (`shatter` shot window `p = 0.430..0.452`). Place to implement auto-scroll lock-in and parallax/time-dilation shader effects. |

---

## 5. Suggested Skills

The receiving agent should activate the following skills:
1. `r3f-cad-cinematography` (`.agents/skills/r3f-cad-cinematography/SKILL.md`) — Authority for bullet-time dual-clock contracts, camera orbits, and HUD safe-framing.
2. `cad-scene-graph-rigging` (`.agents/skills/cad-scene-graph-rigging/SKILL.md`) — Authority for CAD hierarchy, part numbers, and tool integration.
3. `blender-mechanical-toolkit` (`.agents/skills/blender-mechanical-toolkit/SKILL.md`) — For authoring/refining high-fidelity CAD knurling and shaper cutter models in Blender before GLB export.
4. `webgl-telemetry-verifier` (`.agents/skills/webgl-telemetry-verifier/SKILL.md`) — For deterministic verification of transforms, shader states, and camera poses.
5. `cinematic-gsap-lenis-motion-system` (`~/.agents/skills/cinematic-gsap-lenis-motion-system/SKILL.md`) — For smooth scroll locking, auto-advance, and camera choreography.

---

## 6. Exact Next Action & Step-by-Step Plan

### Phase A: Fix Legacy Header/Footer HUD Leak (Item 3)
1. In `src/scene/torque-wrench/TorqueWrenchPage.tsx`, hide or conditionally render `<header className="torque-header">` and `<footer className="torque-footer">` when `stage === 'scene'` (live presentation), or style them with CSS so they do not overlap the opening and closing beats.
2. Verify in browser on `:5215` that the unwanted text blocks disappear during opening and closing frames.

### Phase B: Redesign Opening Environment into a Real-World Room (Item 1)
1. Remove or replace the procedural low-poly metrology props from the active viewport.
2. Create an authentic physical room environment for the drawing table (metrology lab / cleanroom walls, soft directional studio windows/overhead fixture, shallow depth-of-field blur).
3. Connect the breakthrough transition: when `p >= 0.42`, the room breaks away and the shockwave blasts open into the infinite black/graphite arena for the model emergence.

### Phase C: Portal Lightning Arcs to Torque Wrench (Item 4)
1. Inspect `C:\Projects\Misc\portal-desk.png`.
2. Implement 3D dynamic lightning arcs bridging between the portal walls/lip and the rising wrench body during the bullet-time orbit (`p = 0.430..0.452`).
3. Couple lightning arc frequency, branching, and cyan glow intensity to the bullet-time timeline.

### Phase D: Bullet-Time Pacing & Parallax / Time-Dilation Perception (Item 5)
1. Implement automatic scroll locking across the bullet-time sequence so time-dilation plays back at a fixed, cinematic pace without user scroll stutter.
2. Introduce a background counter-parallax or subtle radial time-warp shader effect during the 360° orbit to give the distinct sensation of time slowing down.
3. Retain the "Free Look / Inspect (F)" button for interactive override.

### Phase E: Upgrade Machining Sequence Tool Models (Item 2)
1. High-fidelity replacement for `public/models/knurling-tool.glb` (twin knurl wheels with diamond teeth, hardened toolholder shank, clamping screws).
2. High-fidelity CAD geometry for the gear shaper cutter in `src/scene/inspection/shaft/` (arbor, mounting nut, ground involute teeth, carbide finish).

---

## 7. Boundaries & Approval State
- **Workspace:** All edits stay inside `.scratch/worktrees/torque-debris-field` on branch `feat/torque-debris-field`. Do not touch parent workspace `src/home/*` or uncommitted parent files.
- **Testing:** Maintain 0 TypeScript errors (`npx tsc --noEmit`) and passing unit tests.
- **Commit Discipline:** Stage explicitly by path; push only to `feat/torque-debris-field` (and `torque-wrench/rebuild` if instructed).
- **Owner Rulings:** Preserve Mark's design authority; present visual concepts and screenshots for review.

