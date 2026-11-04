# CAD to web: model prep, camera paths, scroll binding

## 1. CAD → Blender

- **Export:** STEP or high-quality STL/OBJ/FBX from the CAD tool. Pick a tessellation that is coarse on flat faces and finer only on visible curves. Most CAD exports are far denser than the web needs.
- **Units and scale:** CAD usually works in mm, while glTF and three.js treat 1 unit as 1 meter. Scale the model to real-world meters in Blender (×0.001 from mm) so lights, camera near/far and physical values behave correctly.
- **Up-axis:** glTF is +Y up. Leave the Blender exporter's "+Y Up" option on and model with Z-up in Blender as usual.
- **Normals:** CAD meshes often have bad shading. Use Shade Auto Smooth (about 30°) and mark sharp edges, or apply a Weighted Normal modifier for machined parts.
- **Hierarchy:** group parts by assembly and give them clear names (`frame`, `pump_head`, `engine`, `fasteners_*`). Exploded views and HUD callouts target these names in code.
- **Repeated parts:** link duplicates (bolts, fittings) as instances. Later compression can turn these into GPU instancing.
- **Materials:** use one Principled BSDF per real material. The exporter supports Metal/Rough PBR and Unlit, and maps Base Color, Metallic, Roughness, Normal, Emission and others from Principled BSDF inputs.

### Gotchas seen on real CAD exports
- **Renamed nodes:** three.js `GLTFLoader` sanitizes node names (`PropertyBinding.sanitizeNodeName`: whitespace → `_`, strips `[]:./`) and suffixes duplicates (`_1`, `_2`), so `getObjectByName('D1-AP Gearbox Assy-rev2-1 <1>')` returns nothing. The starter's resolver handles this. In your own code, sanitize before lookup.
- **Display-color materials:** STEP/SolidWorks exports usually come through as `metalness 0 / roughness 1` with a raw RGB per part, which renders chalky. Remap by color (starter: `materials: 'cad-auto'`) or by part number.
- **Already in meters:** many pipelines (e.g. glTF Transform outputs) are in meters already. Check `gltf-transform inspect` bbox before scaling. Then work in model-relative units (starter: `fitToModel: true`).
- **Duplicate fastener occurrences** at the root level are common. Explode or label them as a group.
- **Heavy triangle counts** (e.g. 2.5M render vertices) are fine on a desktop GPU but slow in headless capture. Give screenshots extra settle time.

## 2. Camera path (choose one)

**A. Bake it in Blender (best if you're comfortable in Blender)**
- Animate the camera along a Bezier path (Follow Path constraint), or keyframe it directly. Add an empty as the look-at target with a Track To constraint.
- **Bake the animation to keyframes** (Object › Animation › Bake Action, with Visual Keying) before export. The glTF exporter exports object transforms, pose bones and shape keys, but **ignores** animation of other properties (lights, materials) and constraints.
- Export glTF with **Cameras** on and animation included.
- In three.js, drive the clip time from scroll instead of playing it:

```js
const mixer = new THREE.AnimationMixer(gltf.scene);
const clip = gltf.animations.find(a => a.name === 'CameraPath');
mixer.clipAction(clip).play(); // keep it playing (not paused) — mixer.setTime() does the scrubbing
const cam = gltf.cameras[0];      // render with this camera; update its aspect on resize

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.create({
  trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: 1,
  onUpdate: self => mixer.setTime(self.progress * clip.duration),
});
```

**B. Theatre.js (best for fine-tuning in the browser)**
- Use `@theatre/studio` during development to keyframe the camera, lights and material values with the graph editor. Ship only `@theatre/core` (Apache 2.0; the studio editor is AGPL and stays out of the production bundle).
- Bind scroll progress to `sheet.sequence.position`.

**C. Code splines (best for procedural moves)**
- `THREE.CatmullRomCurve3` for both the camera position and the look-at target (two curves). Sample `curve.getPointAt(t)` with `t` from ScrollTrigger progress, and damp toward the sampled point each frame.
- `camera-controls` (yomotsu) for smooth transitions between saved views (fit to a part's bounding box for "focus on component" beats).

**Cinematic rules of thumb**
- Move either the camera or the subject per beat, not both.
- Use a longer lens for product shots (FOV 20–35°) and a wider one only for "inside the machine" moments.
- Ease into and out of each beat. Keep damping consistent (ScrollTrigger `scrub: 1` or Lenis `lerp` of about 0.1).
- Reference framing: ShotDeck (tags for lens, framing, lighting) or FILMGRAB.

## 3. Optimize (glTF Transform)

```bash
npm install --global @gltf-transform/cli
gltf-transform inspect model.glb                      # see what's heavy
gltf-transform optimize model.glb model.opt.glb --compress meshopt --texture-compress webp
gltf-transform optimize -h                            # list all options for your version
```

- Meshopt compresses geometry **and animation**. Use it when the file includes a baked camera path. Draco is geometry-only.
- Inspect the result at https://gltf.report and check materials in the Khronos glTF Sample Viewer (https://github.khronos.org/glTF-Sample-Viewer-Release/).
- For React Three Fiber, `npx gltfjsx model.glb --transform` generates a component and compresses the model in one step.
- Loaders: `GLTFLoader` + `MeshoptDecoder` (meshopt) or `DRACOLoader` (Draco), plus `KTX2Loader` if you use KTX2 textures.

## 4. Scroll architecture (default)

A working version of everything below ships in `assets/starter-vanilla/` (placeholder model included).
Copy it instead of starting from scratch.


- One fixed full-screen `<canvas>` behind the DOM, with Lenis smooth scrolling feeding ScrollTrigger:

```js
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

- DOM sections define the story beats and their scroll length. Each beat gets a ScrollTrigger (or one master timeline with labels) that drives camera, part offsets (exploded view), material and HUD state.
- Exploded view: store each part's assembled position, tween along a per-part offset vector, and stagger by assembly order.
- Respect `prefers-reduced-motion`: swap scrubbing for discrete fades between pre-set camera views.
- Performance: cap DPR at about 1.5–2, render on demand when idle, and keep draw calls low (merge static parts, instance fasteners).
