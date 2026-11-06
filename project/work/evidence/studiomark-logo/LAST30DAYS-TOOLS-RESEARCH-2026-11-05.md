# Comprehensive `/last30days` & Cross-Project Tooling Research Report (2026-11-05)

- **Research Engine:** `/last30days` v3.31.0 (`C:\Projects\last30days-skill\skills\last30days\scripts\last30days.py`) + Product Hunt / Khronos / Google Open Source web supplements + Local Cross-Project Audit (`C:\Projects\video-shotcraft`, `C:\Projects\OpenMontage`, `C:\Projects\img2threejs`, in-repo `remotion/`).
- **Date Range Covered:** `2026-10-06` to `2026-11-05`
- **Raw Evidence Corpus:** [`C:\Users\Markimus\Documents\Last30Days\3d-webgl-three-js-remotion-video-and-creative-web-tools-raw-v3.md`](file:///C:/Users/Markimus/Documents/Last30Days/3d-webgl-three-js-remotion-video-and-creative-web-tools-raw-v3.md) (111 ranked items across 10 active sources: Reddit `r/threejs`/`r/reactjs`, X, TikTok, Hacker News, GitHub, Dev.to, Bluesky, LinkedIn, Pinterest, Web).
- **Companion Bumper Specs:** [`BUMPER-CONCEPTS-2026-11-05.md`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/studiomark-logo/BUMPER-CONCEPTS-2026-11-05.md)

---

## Executive Summary

Over the last 30 days, two major shifts occurred across the 3D WebGL / Three.js and programmatic motion-design ecosystems:

1. **Code-Driven 3D Motion Studios Have Replaced Manual Timeline Keyframing for Brand Bumpers & Product Trailers:**
   - The dominant workflow across X (`@e1genqq`, `@Damir_Akaza`, `@Leviwoyun`, `@kurisinaa`), TikTok (`@kunaldeshmukh987`, `@github.signals`, `@argunbadur`), and GitHub (`iart-ai/motion-skills`, `latifurrofik/TCon`) pairs a **deterministic Three.js / React Three Fiber 3D scene** with **frame-stepped headless Chromium capture or `@remotion/three`**, overlaid with crisp vector/HUD typography (`anime.js` / `Satori` / CSS SVG) and mastered with FFmpeg + procedural/Freesound audio.
   - Notably, your own local repositories (`video-shotcraft` and `img2threejs`) appeared at the very top of `@Leviwoyun`'s viral X thread (2,554 likes, 341 reposts) and `@ModengSir`'s 2026 open-source 3D/video roundup.

2. **WebGPU, TSL (Three.js Shading Language), Meshlet Instancing, and Open-Source glTF Tooling Reached Production Maturity:**
   - **Three.js `r187`** shipped on 2026-10-30 (`r/threejs`, 425 upvotes) with improved color/shadow fidelity, WebGPU stability, and the new **`MeshletDrawingPipeline`** capable of rendering ~2 billion instanced triangles at 60 FPS (`r/threejs`, 141 upvotes).
   - **Gestaltor** (the 3DCommerce-certified visual glTF/GLB node-level editor by UX3D) went free and open-source, providing a zero-Blender way to inspect and edit `.glb` node hierarchies, materials, and textures without risking destructive `gltfjsx --transform` passes.

---

## Part 1: 3D Video, Bumper & Motion Graphics Tools (Last 30 Days + Local Ecosystem)

### 1.1 Programmatic Video & 3D Rendering Engines

| Tool / Library | License | Primary Signal & Source | What It Does | Fit for StudioMark Bumpers |
|---|---|---|---|---|
| **Remotion 4.x / 5.0 + `@remotion/three`** | Source-Available (Free for individuals & teams <= 3) | **#1 Most Mentioned** across X (`@e1genqq`, `@Damir_Akaza`), GitHub (`latifurrofik/TCon`), TikTok (`@kunaldeshmukh987`, `@argunbadur`), Product Hunt | React-based frame-accurate video framework. `@remotion/three` provides `<ThreeCanvas />` (WebGL2) and `<ThreeWebGPUCanvas />` (WebGPU + TSL shaders) synchronized to `useCurrentFrame()`. Remotion CLI `--gl=angle` enables hardware-accelerated headless GPU rendering. | **Installed in repo (`remotion/`).** Ideal for wrapping bumper renders into reusable `<Sequence>` compositions (`1920x1080` 16:9 and `1080x1920` 9:16) and combining them with Showreel v3. |
| **Deterministic R3F Clock + Playwright Frame-Stepper + FFmpeg (`video-shotcraft` pattern)** | MIT / Open Source | X (`@damkina7` 475k-star stack breakdown), `iart-ai/motion-skills`, and local `C:\Projects\video-shotcraft` | Exposes a deterministic simulation step (`window.__studioMarkBumper.seekToTime(t)`) inside the live R3F application so every shader (`uTime`), raindrop position, splash ring, lightning pulse, and camera spline is a pure mathematical function of `t = frame / fps`. Playwright steps frame-by-frame at `1920x1080` and pipes PNGs into `ffmpeg` (`libx264 -crf 15 -pix_fmt yuv420p` + `libvpx-vp9`). | **Best Primary Renderer for `StudioMarkScene`.** Why? Because `StudioMarkScene` uses Drei's `MeshReflectorMaterial` (multi-pass offscreen FBO mirror), an offscreen `WebGLRenderTarget` GPU ripple normal generator (`RainFloor.tsx`), and `@react-three/postprocessing` `EffectComposer` (Bloom + ToneMapping). Running natively in Vite + Chromium via deterministic frame-stepping preserves 100% of these multi-pass FBO effects with zero frame jitter! |
| **`HyperFrames` (by HeyGen)** | Apache 2.0 (Open Source) | X (`@Damir_Akaza` score 71, `@cutetoxicguy`), `orshot.com` | Newly open-sourced HTML/CSS/GSAP-to-MP4 programmable video engine built specifically for AI coding agents (Claude Code, Codex, Cursor) with no team-size limits. | Great alternative when rendering pure DOM/SVG/GSAP motion cards or title plates. |
| **`iart-ai/motion-skills` & `Open 3D Skills`** | Open Source (GitHub) | GitHub (`github.com/iart-ai/motion-skills`, score 62), TikTok (`@github.signals`, 3,797 views) | 50 open-source agent skills across 14 packs covering kinetic typography, logo stings, WebGL scenes, Safari-compatible transparent video (`hevc_videotoolbox` / `libvpx-vp9` alpha), and a **deliver-and-verify loop** (freeze key frames, tile a contact sheet, probe MP4 metadata). | We adopt its **deliver-and-verify contact-sheet + ffprobe gate** alongside `video-shotcraft`'s `verify_shot.py`. |
| **`anime.js` v4 + `Satori` Hybrid Overlay Stack** | MIT / MPL-2.0 | TikTok (`@kunaldeshmukh987`), X (`@e1genqq`, `@kurisinaa`) | Pairs a real Three.js 3D background layer with frame-indexed SVG/DOM stroke & typography animations (`anime.js`) and instant cover/poster frame generation (`Satori`). | Inspires our crisp HUD title & reticle lockup overlay (`BumperOverlayHUD.tsx`) synced to the final lockup of Bumpers #1 and #4. |
| **`Revideo` & `Motion Canvas`** | MIT (Open Source) | Product Hunt / `rendercomp.com` / `wireflow.ai` | TypeScript-first programmatic animation and headless video rendering frameworks with live timeline scrubbing. | Reference architecture for procedural signal/tween timelines. |

### 1.2 Audio Synthesis & Sound Design Tooling (For Cinematic Bumpers)

| Tool / Pipeline | Location / Source | Capabilities | Role in StudioMark Bumpers |
|---|---|---|---|
| **In-Browser `ProceduralStormAudio` (`Web Audio API`)** | [`src/scene/studiomark-logo/audio.ts`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/studiomark-logo/audio.ts) | Real-time pink-noise rain synthesizer (`bandpass` + `lowpass`), sub-bass sine/noise thunder generator. | Extend with **Bumper Sound Cues**: electrical neon ignition hum/crackle, deep cinematic sub-bass impact drop (`55Hz -> 24Hz`), and harmonic metallic/glass lockup chime so interactive browser playback has full cinematic audio! |
| **Offline WAV Mastering Generator (Python `numpy`/`scipy` + `ffmpeg`)** | `C:\Projects\video-shotcraft\scripts\compose_audio.py` + custom deterministic bumper audio script | Synthesizes sample-accurate 48kHz 24-bit stereo WAV tracks synced to the exact millisecond of each bumper's keyframes (rain patter, distant storm rumble, high-voltage arc ignition at `t=1.2s`, sub-bass drop + glass harmonic chord at `t=3.0s`, reverberant tail) and muxes into the MP4/WebM via `ffmpeg` (`aac -b:a 320k` / `libopus`). | Guarantees the exported MP4 and WebM bumper files have broadcast-ready stereo sound design with zero copyright restrictions. |

---

## Part 2: Non-Video Creation Tools to Help `jgun-torque-wrench` & `studiomark.dev`

While running `/last30days` across `r/threejs`, Hacker News, Dev.to, GitHub, LinkedIn, Bluesky, and Product Hunt, we cataloged every non-video creation tool that can directly improve `jgun-torque-wrench` and `studiomark.dev`:

### 2.1 Core 3D Rendering, Performance & Shader Tools

1. **Three.js `r187` & `MeshletDrawingPipeline`**
   - **Links:** [Reddit `r/threejs` Release Thread (425 pts)](https://www.reddit.com/r/threejs/comments/1xjhxal/threejs_r187_released/) | [Reddit `MeshletDrawingPipeline` Demo (141 pts)](https://www.reddit.com/r/threejs/comments/1xmncnq/2_billion_triangles_mostly_instanced_at_60_fps/)
   - **What it is:** Released October 30, 2026, `r187` refines WebGPU color/shadow accuracy, MaterialX noise channels ([PR #34833](https://github.com/mrdoob/three.js/pull/34833)), and introduces experimental meshlet GPU drawing pipelines capable of pushing ~2 billion instanced triangles at 60 FPS.
   - **How it helps `jgun-torque-wrench`:** Our hero torque wrench (`Default.glb`), M249 (`m249-transformed.glb`), and MSP Enclosure (`msp-enclosure.glb`) rely heavily on instanced fasteners and dense mechanical teeth. Upgrading from Three.js `0.185` to `0.187` (when R3F peer deps align) unlocks cleaner shadows and meshlet instancing.

2. **Device-Relative Pixel-Ratio Governor (`jonasjavier` Dev.to Pattern)**
   - **Link:** [A pixel-ratio governor for Three.js that doesn't trust 60 fps](https://dev.to/jonasjavier/a-pixel-ratio-governor-for-threejs-that-doesnt-trust-60-fps-4380)
   - **What it is:** A lightweight adaptive DPR controller that avoids the "120Hz ProMotion trap" (where a scene dropping from 120fps to 60fps looks like "60fps OK" to naive governors while stuttering) and avoids choking mobile/integrated GPUs. It benchmarks the device's own best sustainable frame pace at `dpr=1.0` and steps DPR up in `0.25` increments only if the device holds its native pace.
   - **How it helps `studiomark.dev`:** Directly complements our `r3f-scroll-performance-guard` skill for keeping scroll-scrubbed CAD scenes at locked native refresh rate across phones, laptops, and 120Hz monitors.

3. **`NixieFX` - Browser-Based Visual Particle Editor for Three.js**
   - **Link:** [Three.js Resources - Tools & Extensions](https://threejsresources.com/best/tools--extensions)
   - **What it is:** A real-time visual particle system studio in the browser with point/box/sphere/cone emitters, turbulence/attractor physics forces, color/size-over-lifetime curves, and direct JSON/Three.js code export.
   - **How it helps `studiomark.dev`:** Instead of hand-tuning particle math blindly in code, you can visually art-direct rain splashes, welding sparks, fluid mist, or machining chips and export the parameters directly into R3F `<instancedMesh>` components.

4. **Three.js `TSL` (Three.js Shading Language) Shader Packs & Codrops Interactive Clusters**
   - **Links:** [LinkedIn - Peter Csipkay's 42 TSL Shaders](https://www.linkedin.com/posts/petercsipkay_threejs-webgpu-tsl-activity-7517860870778105856-mWRw) | [Bluesky `@xrtech.dev` - Codrops Interactive 3D Cluster with TSL](https://bsky.app/profile/xrtech.dev/post/3mz6pruiesq2b) | [Three.js Resources - Best Shaders](https://threejsresources.com/best/shaders)
   - **What it is:** Node-based shaders written in TypeScript/JavaScript (`three/tsl`) that compile automatically to both **WGSL (WebGPU)** and **GLSL (WebGL2)**.
   - **How it helps `jgun-torque-wrench`:** As we evolve CH.04 (`CadTransitionShader`) and custom cutaway/hologram shaders, authoring in TSL makes them automatically WebGPU-ready while preserving WebGL2 fallback.

### 2.2 CAD, glTF Asset Pipeline & Scene Authoring Tools

5. **Gestaltor (3DCommerce-Certified Visual glTF / GLB Editor - Newly Open-Sourced)**
   - **Link:** [gestaltor.com](https://gestaltor.com)
   - **What it is:** Created by UX3D (co-authors of the Khronos glTF specification), Gestaltor transitioned to a free, open-source desktop/web tool in early 2026. It lets you open any `.glb`/`.gltf` file, inspect the exact node hierarchy, edit PBR material slots, swap normal/roughness textures, inspect Draco/meshopt compression, and save non-destructively.
   - **How it helps `jgun-torque-wrench`:** In `AGENTS.md`, we have strict rules protecting `public/models/m249-transformed.glb` (whose normal map regresses if touched by `gltfjsx --transform`) and `public/models/msp-enclosure.glb` (whose 7 named roots `ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`, etc. collapse under `gltfjsx --transform`). Gestaltor lets you edit materials, textures, and node names directly inside the `.glb` without ever running `gltfjsx --transform` or round-tripping through Blender!

6. **Blender 5.1 Real-Time glTF Pipeline + Vertex Animation Texture (VAT) Exporter**
   - **Links:** [Three.js Resources - Tools & Extensions (Blender VAT Plugin)](https://threejsresources.com/best/tools--extensions)
   - **What it is:** Blender 5.1's updated glTF exporter and the Blender Vertex Animation Texture (VAT) generator bake complex mechanical/deforming animations into compact floating-point textures decoded in a vertex shader at near-zero CPU cost.
   - **How it helps `jgun-torque-wrench`:** Ideal if we ever add flexible hoses, cables, bellows, or fluid/stress animations to CAD assemblies without heavy skeletal skinning overhead.

7. **`StringTune-3D` (HTML DOM Attribute-Synced Three.js Objects)**
   - **Link:** [Three.js Resources - Tools & Extensions](https://threejsresources.com/best/tools--extensions)
   - **What it is:** Syncs Three.js 3D object transforms, visibility, and shader uniforms directly to HTML DOM attributes (`data-*`) and scroll positions.
   - **How it helps `studiomark.dev`:** Clean bridge between DOM case-study cards and persistent 3D background/foreground objects.

8. **Google `Three-Live` & `dioramas` (Interactive 3D Scene & Site Frameworks)**
   - **Links:** [Google Open Source Blog - `Three-Live`](https://opensource.googleblog.com) | [X `@ModengSir` / `@Leviwoyun` - `dioramas`](https://x.com/ModengSir/status/2113415844583940432)
   - **What they are:** `Three-Live` bridges LLM-generated procedural Three.js code into live-controllable 3D/WebXR scenes; `dioramas` is an open-source Three.js/WebGL framework with 20 ready-to-use cinematic interactive site templates.
   - **How they help `studiomark.dev`:** Rapid prototyping references for upcoming learning/build pages on `studiomark.dev`.

9. **`Radix` by SparkJS (WebGPU 3D Gaussian Splat Renderer on Three.js)**
   - **Link:** [sparkjs.dev/radix](https://sparkjs.dev/radix/) ([Show HN](https://news.ycombinator.com/item?id=50292475))
   - **What it is:** A high-speed WebGPU 3D Gaussian Splat renderer built natively on top of Three.js.
   - **How it helps `studiomark.dev`:** Lets you drop real-world scanned workshop/machining environments or physical prototypes (Gaussian Splats) directly into the same Three.js scene as analytical CAD meshes.

10. **`WAMR3D` (Rust/WASM WebGPU Renderer with a Three.js-Style API)**
    - **Link:** [Dev.to - WAMR3D](https://dev.to/aymen94/wamr3d-a-native-webassembly-3d-engine-with-a-threejs-style-api-and-its-own-webgpu-renderer-9ok)
    - **What it is:** A Rust + WebAssembly 3D engine exposing a Three.js-compatible API that batches hot draw-submission paths for up to ~8x lower CPU draw-call overhead in WebGPU.

---

## Part 3: Chosen Architecture for Building Bumpers #1 & #4

Based on the research above, here is the exact tool stack we are using to build **Concept 1 ("Storm Ignition")** and **Concept 4 ("Low Puddle Crane-Up")**:

1. **Deterministic Dual-Mode Bumper Engine inside `src/scene/studiomark-logo/`:**
   - New module [`src/scene/studiomark-logo/bumperTimeline.ts`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/studiomark-logo/bumperTimeline.ts): Pure mathematical evaluator `evaluateBumperState(mode, timeSec)` for:
     - **`storm-ignition` (4.5s, 270 frames @ 60fps):**
       - `0.00s - 1.10s` (*Macro Refraction Push*): Camera glides close along the dark wet puddle (`y: 0.42 -> 1.45, z: 3.1 -> 3.6`), grazing the dark unlit **Kinetic Chevron** optical glass facets while rain streaks past.
       - `1.10s - 2.30s` (*Dual Lightning + Neon Filament Ignition*): Double atmospheric lightning strike (`t = 1.15s` and `t = 1.32s`) illuminates the storm; the internal warm amber/gold neon filaments (`chevMNeon` & `chevSNeon`) surge from `0.05` to `7.5` emissive intensity before settling at `4.8`, sending a shockwave ripple across the puddle (`rippleStrength` spike).
       - `2.30s - 3.60s` (*180-Degree Hero Dolly & Gimbal Lock*): Camera dollies back along a smooth C2 spline to the hero showcase framing (`[0, 1.82, 5.25]`) while the Kinetic Chevron completes a precision rotation lock (`rotation.y -> 0`) and the 3D `STUDIOMARK` monument + HUD title plate ignite in the background.
       - `3.60s - 4.50s` (*Crystalline Hold & Fade-Ready Lockup*): Gentle breathing hold with crisp specular highlights and reflection clarity.
     - **`puddle-crane` (5.0s, 300 frames @ 60fps):**
       - `0.00s - 1.50s` (*Inverted Puddle Mirror Gaze*): Camera starts inches above the wet black asphalt (`position: [0, 0.22, 4.4]`, looking down at the puddle reflection `[0, 0.05, 0.4]`). A heavy raindrop impact triggers concentric Faraz ripples across the inverted glowing reflection of the **Kinetic Chevron** (`STUDIOMARK`).
       - `1.50s - 3.30s` (*Vertical Crane-Up + Roll-Up Tilt*): Smooth vertical crane ascent (`y: 0.22 -> 1.85, z: 4.4 -> 5.3`) while tilting the lens upward from the puddle mirror (`target.y: 0.05 -> 1.88`) straight into the floating 3D **Kinetic Chevron** centerpiece as a lightning flash silhouettes the crystal M and woven S.
       - `3.30s - 5.00s` (*Hero Showcase Lockup*): The monogram settles into its upright showcase poise with warm gold/cyan rim lighting, 3D `STUDIOMARK` backdrop glow, and sleek lower-third technical signature (`STUDIOMARK.DEV // PRECISION CAD × CREATIVE COMPUTING`).
2. **Deterministic Clock Override across Scene Components:**
   - Pass `simTime?: number | null` (and `bumperState`) into `StudioMarkCenterpiece`, `RainFloor`, `RainDrops`, `RainSplashes`, `ThunderLight`, and `StudioMarkText` so when a bumper is playing in the browser OR being frame-stepped by Playwright (`window.__studioMarkBumper.seekToTime(t)`), every single particle, ripple, light pulse, and camera move is 100% deterministic!
3. **Interactive Browser Director Bar + Web Audio Bumper Synthesizer:**
   - Add one-click buttons in [`InspectorUI.tsx`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/studiomark-logo/InspectorUI.tsx) (and a sleek Cinematic Letterbox + Title Lockup HUD [`BumperOverlayHUD.tsx`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/studiomark-logo/BumperOverlayHUD.tsx)) so you can play/scrub **Bumper 1: Storm Ignition** and **Bumper 4: Low Puddle Crane-Up** live in `studiomark-logo.html` with synchronized procedural Web Audio (`triggerBumperSoundtrack`).
4. **Broadcast 60fps MP4 & WebM Rendering + Remotion Integration + Contact-Sheet Verification:**
   - Synthesize master stereo WAV soundtracks (`48kHz`) for both bumpers, capture 60fps lossless frames via headless Chromium WebGL2, encode H.264 MP4 (`crf 15`) + VP9 WebM into `public/video/`, register both bumpers in [`remotion/Root.tsx`](file:///c:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/remotion/Root.tsx), and verify with contact sheets + `ffprobe`.
