# StudioMark 3D Video Bumper — 4 Cinematic Concepts & Production Plan

**Date:** 2026-11-05  
**Selected for Immediate Build:** Concept 1 ("Storm Ignition") & Concept 4 ("Low Puddle Crane-Up")  
**Parked for Future Exploration:** Concept 2 ("Bullet-Time Raindrop & Prism Lock") & Concept 3 ("Precision Assembly → Neon Overdrive")  
**Centerpiece Model:** `sm-kinetic-chevron` (Prismatic optical glass `M` + interwoven `S` with dual internal warm amber neon filaments)

---

## 1. Selected Concepts (Building Now)

### Concept 1: "Storm Ignition" (5.0s · 300 frames @ 60fps)
- **0.0s – 1.2s (Dark Puddle Prelude):** Opens in near-total storm darkness (`ambientDarkness: 0.96`, `emissiveIntensity: 0`, neon off). Heavy raindrops streak down and trigger concentric ripples across the wet asphalt mirror.
- **1.2s – 1.8s (Lightning Silhouette):** A sharp multi-pulse cold blue lightning strike (`ThunderLight`) flashes across the sky and floor, silhouetting the towering prismatic glass **M** and woven **S** bevels before the neon turns on.
- **1.8s – 3.2s (Neon Filament Ignition):** Warm amber neon filaments (`#ffaa44`) inside the `M` pillars and `S` curve ignite from the center outward with an electrical surge (`emissiveIntensity: 0 → 5.5 → 4.2`), sending a golden bloom across the wet puddle reflection while the camera pushes forward and cranes up.
- **3.2s – 5.0s (Hero Lockup & Settle):** The extruded 3D `STUDIOMARK` wordmark and `PRECISION CAD × CREATIVE COMPUTING` subtitle fade/bloom in behind the refracting glass centerpiece as the Kinetic Chevron settles into its gentle showcase gimbal sway.

### Concept 4: "Low Puddle Crane-Up" (5.0s · 300 frames @ 60fps)
- **0.0s – 1.8s (Skimming the Water Mirror):** Camera starts inches above the wet asphalt (`y = 0.28, z = 4.6`), gliding forward while looking slightly down into the rippling mirror reflection of the glowing golden `Kinetic Chevron` and `STUDIOMARK` typography.
- **1.8s – 3.6s (The Reveal Tilt & Crane):** Smooth C2 quintic crane-up (`y: 0.28 → 1.75`, `z: 4.6 → 5.35`) tilting up from the inverted water reflection through the falling rain curtain into the physical 3D glass & neon monogram.
- **3.6s – 5.0s (Rolling Thunder & Lockup):** As the camera settles on the hero framing, a secondary rolling lightning flash sweeps the bevels and ripples while the Kinetic Chevron completes its signature yaw arc into the final lockup frame.

---

## 2. Saved Concepts (Reserved for Later)

### Concept 2: "Bullet-Time Raindrop & Prism Lock"
- **Choreography:** High-speed rain falls at 100% speed (`0.0s–1.0s`), then smoothly time-dilates to **3% bullet-time** (`1.0s–3.4s`) — raindrops hang suspended in mid-air like optical glass beads while the camera performs a fast `110°` spherical orbit around the `Kinetic Chevron`, catching rainbow dispersion (`dispersion: 0.14`) through the frozen droplets and glass bevels. At `3.4s`, a sub-bass thunder hit snaps time back to 100% as the camera locks into the front hero view.

### Concept 3: "Precision Assembly → Neon Overdrive"
- **Choreography:** Starts tight on the separated components: the outer prismatic glass `M` chevron frame (`z = -0.8`), the interwoven glass `S` (`z = +0.8`), and the unlit neon core tubes. Over `0.0s–2.4s`, the `M` and `S` glide together along the Z-axis with precision mechanical deceleration knees. The moment they seat at `z = 0` (`2.4s`), contact sparks a warm neon overdrive pulse (`bloomIntensity: 0.9 → 0.45`) and the camera pulls back to reveal the full `STUDIOMARK` puddle scene.

---

## 3. Tooling & Skills Available Across Your Workspace

- **In-Repo Remotion 4.0.540 (`remotion/`):** Already configured with `@remotion/three`, React 19, Three.js 0.185, and `PostFX.tsx` (`Bloom` + `SMAA` + `ToneMapping`) for deterministic frame-by-frame MP4 rendering.
- **Local Project Toolkits (Indexed in `codebase-memory-mcp`):**
  - `C:\Projects\video-shotcraft` (`SKILL.md` + 150 shot recipe cards including `logo-shrink-wordmark-lockup`, `space-camera-moves`, `graze-face-tour`, plus `references/sound-design.md` and `references/sfx-sourcing.md`).
  - `C:\Projects\OpenMontage` (`threejs_world`, `video_stitch`, FFmpeg encoding & audio mastering pipelines).
  - `C:\Projects\last30days-skill` (Python v3.31 multi-source research engine for Reddit/X/GitHub/HN/YouTube).
- **Repo Cinematography & Motion Skills:**
  - `.agents/skills/r3f-cad-cinematography/SKILL.md` (C1/C2 continuous camera splines & time-dilation clocks)
  - `scroll-film-studio`, `cinematic-gsap-lenis-motion-system`, `higgsfield-generate` (Seedance / Seed Audio).

