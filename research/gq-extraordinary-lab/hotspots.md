# Hotspots — GQ "The Extraordinary Lab" (scroll / animation / 3D drivers)

Target: https://www.gq.com/sponsored/story/the-extraordinary-lab
Embed origin: https://interactive.gq.com/audemars-piquet-gq-rd5/

Production bundles are **minified, no source maps** (no `//# sourceMappingURL` in any fetched chunk) — file/line references below are bundle chunks + the minified identifiers/configs visible in them. **Line ranges: unknown (minified).** Everything below is [seen] in the downloaded public JS unless marked [inferred]. Bundles were downloaded once for string-level analysis and deleted afterwards; identifiers quoted here are a few identifying lines only.

## File list (with roles)

1. `assets/BIhX5qj-.js` — entry chunk, 1,665,452 bytes (1.63 MB wire). Contains:
   - **three.js r172** full runtime (`const Ix="172"`, MIT banner; writes canvas `data-engine="three.js r172"`).
   - **Lenis 1.1.20** (`window.lenisVersion="1.1.20"`). Wheel/touch engine classes: wheel handler class `$J` (`constructor(n,e={wheelMultiplier:1,touchMultiplier:1})`, emits `"scroll" {deltaX,deltaY,event}`); the app's Lenis instantiation: `content: domTarget.children[0], lerp: L$()?1:.05, wheelMultiplier: 2.1, syncTouch: true` — virtual scroll over the app container (the document never scrolls). `L$` (the lerp switch) definition not resolved — unknown, likely a touch/reduced-motion style check [inferred].
   - **GSAP 3.12.5 core** (`version="3.12.5"`) + **ScrollTrigger** (`ScrollTrigger.create`, `defaults({scroller:window}`) + **CustomEase** (`registerEase("_CE", …)`).
   - GSAP ticker drives Lenis: tick callback runs `lenis.raf(t*1000)` and computes `_deltaCoeff` toward `i*60` via `gsap.ticker.deltaRatio()` — one clock for scroll + animation.
   - **Asset loader framework**: `en.isResourceAdded(o)` resource-registry warnings; typed manifest arrays (see below live in the scene chunk).
   - **Audio manager**: `new AudioContext`, `_globalGainNode`, `mute()/unmute()` with `gain.linearRampToValueAtTime` fades; store action `setAudioAnalyser` (audio feeds shader uniform).
   - **App store defaults**: `interactionController, audioLinePosition, applyGlowMask:true, applyDoF:true, lowPerfMode:false`.
   - **Debug URL params** via `mi()`: `debugDom, remindScrollY, audio, skipLoader, keepFloorMirror, showDeviceInfo, lowPerfMode` (e.g. `?skipLoader` bypasses preloader).
   - **detect-gpu 5.0.70**: `benchmarksURL:"https://unpkg.com/detect-gpu@5.0.70/dist/benchmarks"`, `failIfMajorPerformanceCaveat` — runtime GPU tiering.
   - Nuxt 3.11.2 / Vue 3 runtime + createWebHistory router (single route).
2. `assets/CROz8He7.js` — **scene chunk** (lazy dynamic import), 1,043,107 bytes. The 3D core:
   - **Typed asset manifest** (entries like `{type:"gltf",path:"/webgl/global/models/scene_compressed.glb",name:"model/scene"}`):
     `pv=[{…scene_compressed.glb, name:"model/scene"}, {…watch_compressed.glb, name:"model/watch"}]`; `sensoriallayerthreearms.glb` as `"sensorial-layer-three-arms"`; PBR texture lists under `/webgl/pbr/table1|2|3/…` (`table1shiny-diffuse-RGBM.webp`, `…-specular-RGBM.png`), `/webgl/pbr/waterfall-*`, `/webgl/ground/ground_Roughness.webp`, glow masks `…glowmask.png`, `/webgl/global/misc/` (white/black/fallback-normal/displaylightcookie), `menu/menuwatchframe.webp`, `watch1|2|3.exr`.
   - **Camera config**: `cameras:{default:{position:[0,0,3],fov:50,near:.1,far:1e3}, orbit:{position:[15,14.7,16.2], target:[2.9,-1.5,1.2], fov:45, near:.01}}`; camera rig class `wp` reading `_config.rotation/_config.fov` with `frustum:{min:.01,max:1e3}`, `fov:{min:1,max:180}` (Theatre-style editable ranges).
   - **Section choreography**: `sections:[{deepDive:{transition:{mainSceneCenter:{x:3.625…,y:.511…,z:3.034…}}, watch:{rotation:{x:0,y:0,z:0,w:1}}}}, {deepDive:{transition:{mainSceneCenter:{x:-.526…, z:-4.091…}, watch:{rotation z:-.71,w:.71}}}}, …]` — per-section camera center + watch quaternion; multiple "deepDive" sections.
   - **Section/sensorial binding**: `_sectionStore.currentTableSection`; watch rotation pulled from Theatre: `this._theatre.data["sensorialLayer"+g].watchRotation`.
   - **Custom multi-pass composer**: class `Ap{constructor({dpr=1, passCount=5, dimensions}…)}` with dither tail (`FragColor += dither`); named passes/objects: `_lensflareProgram`, `_bloomPassCount`, `_dofBlurPass`, SMAA shader chunks (`SMAA_RT_METRICS`), lut loader (`_lutLoader`), composite shader uniforms `uGrainStrength, uVignetteStrength, uTableHaloStrength, uSubtitleProgress/subtitleGradient, audioLine` with grain `hash12(gl_FragCoord.xy + uTime)`; Theatre wiring: `theatreObjects={fishEyeObj, rgbShiftObj, filmgrainObj, vignetteObj, lumafilterConfigObj, bloomConfigObj, …}` each with `onValuesChange` live reconfigure.
   - **Mouse fluid simulation**: double-buffered FBOs `this._fbo={read:new J(w,h,{count: lowPerfMode?1:2, depthTexture…}), write:…}`; update throttle `this._tick % (device.mobile?2:4)===0` with `_performanceMode` forced on mobile; `_smoothedMouse`, `_cameraZoom` on the section controller.
   - **GSAP transitions in scene**: `fromTo(proxy,{value:0},{value:1,duration:t,ease:"sine.inOut", onUpdate:…})` driving `slerpQuaternions` (watch rotation) and a camera zoom `$n(v,0,.5,0,.1)` mapping; second tween family uses a custom ease symbol `yd` with `onComplete: reset sensorialLayerProgress`.
   - Store defaults: `applyGlowMask:true, applyDoF:true, lowPerfMode:false`.
3. `assets/C4irFK9B.js` — 763,026 bytes, lazy. **Theatre.js 0.7.2 core bundle** (`Theatre_CoreBundle`, `version "0.7.2"`) plus bundled @theatre/studio React UI strings (theatrejs.com docs links, `*.theatre-project-state.json`) — studio ships in prod here (likely dev/debug affordance).
4. `assets/BGl2_TTZ.js` — 124 KB, early. Role not resolved (vendor split) — unknown.
5. `assets/D-3hq5pL.js` (849 B), `By59hpON.js` (5.2 KB), `D-3hq5pL`/`BHc--7SF`/`CROz8He7` style tiny chunks — trivial modules, not analyzed.
6. `assets/HomePage.Dqy6SVbs.css` (49 KB) + `default.ps2yTGsN.css` — scene/UI styles.
7. GQ host page: `/verso/static/*.js` webpack chunks + `presenter-articles.*.js` (Condé Nast Verso React shell — host only, does not drive the 3D) [seen in network log].

## Scroll → 3D binding (how wheel input reaches the scene)
- Wheel/touch → Lenis (virtual, `wheelMultiplier 2.1`, `syncTouch`) → `"scroll"` events with deltas → app scroll store (`scrollY` reads, `remindScrollY` debug flag) → section progress drives camera between `sections[].deepDive.transition.mainSceneCenter` positions while Theatre.js sequences drive per-section object state (`_theatre.data["sensorialLayer"+n]`), and GSAP tweens (`sine.inOut` + custom ease) slerp the watch quaternion / camera zoom between them. [seen structure; exact wiring between Lenis scroll events and `_sectionStore` is inferred from names — the store update call itself was not isolated: unknown]
- ScrollTrigger is present and defaults `scroller:window`, but no `scrollerProxy` was found; its role in the fixed-viewport app is not visible — unknown.

## Notes for reconstruction
- The experience = fixed full-screen canvas + DOM UI layer; "scroll" is a wheel-driven scene scrub, not document scroll. Directly portable idea for the JGun rig: per-section camera-center + object-quaternion transition table (plain JSON-ish config) tweened by GSAP with a single shared clock (GSAP ticker feeding Lenis raf).
- Post stack (Theatre-controlled bloom, DOF, SMAA, vignette, film grain, RGB shift, fisheye, LUT) is authored as individually tunable Theatre objects — equivalent to a uniform-driven "look" panel.
- Audio is a first-class signal: analyser → `audioLine` texture uniform → waveform line drawn in the composite pass; subtitles rendered as DOM text styled against the same shader band.
