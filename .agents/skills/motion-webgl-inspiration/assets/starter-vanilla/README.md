# Scroll-story starter (vanilla three.js + GSAP ScrollTrigger + Lenis)

A no-build starting point for a CAD-driven scroll story. It has one fixed WebGL canvas behind
DOM sections, a spline or baked-glTF camera, an exploded view, projected HUD callouts with
leader lines, and a reduced-motion fallback. It runs immediately with a placeholder pump-package
assembly, so you can check motion and layout before your model is ready.

## Run

```bash
cp -r ~/.agents/skills/motion-webgl-inspiration/assets/starter-vanilla ./site
cd site && python3 -m http.server 8080   # or: npx serve .
# open http://localhost:8080
```

ES modules need a server; opening `index.html` directly from disk won't work.

## Files

| File | Edit it for |
|---|---|
| `scene.config.js` | Model URL and scale, HDRI, tone mapping, camera beats, exploded offsets, callout text |
| `index.html` | Copy: one `<section data-beat>` per beat, in the same order as `CONFIG.beats` |
| `style.css` | Font pairing (`--font-display`, `--font-mono`), HUD accent color, section lengths |
| `main.js` | Only for new behaviors (extra post-processing, per-beat material changes, etc.) |

## Swap in your model

1. Export from Blender as GLB, keeping assembly node names (`engine`, `pump_end`, `frame`, etc.).
2. Compress: `gltf-transform optimize model.glb models/model.opt.glb --compress meshopt --texture-compress webp`
3. Set `modelUrl: './models/model.opt.glb'`, and set `modelScale: 0.001` if the model is still in mm.
4. Rename the keys in `explode` and `callouts` to match your node names. The console warns about any name it can't find.
5. Re-aim the `beats` camera and target points for your model's size.

### Real CAD exports: settings that matter

Tested on a 0.24 m, 560k-vertex Draco CAD assembly (316 parts, 36 materials):

- **`fitToModel: true`**: beat cameras, targets and explode offsets become multiples of the model's
  bounding radius, measured from its center. Use it for any real model. It also fits the ground,
  shadow frustum and clip planes, so a 0.2 m tool and a 5 m skid both work.
- **`materials: 'cad-auto'`**: CAD exports usually carry display colors only (metalness 0,
  roughness 1), which renders chalky. This upgrades neutral colors to metal (light = machined,
  dark = black oxide) and saturated colors to paint. Authored PBR materials are left alone.
- **Node names:** use the names exactly as the CAD/Blender export wrote them, e.g.
  `'A000606-1 <1>'` or `'occurrence of P000245-1'`. The loader's renaming (spaces → `_`, dropped
  `[]:./`, `_1` suffixes) is resolved for you. A name shared by several nodes (duplicate fasteners)
  explodes **all** of them. Use part numbers or assembly names, not stage labels.
- **`minCameraDistance`** (× radius): stops spline swings passing through the model. For exploded
  views, set it to about 1 + the largest explode offset (e.g. 3.0).
- **Per-beat `mobile: { camera, target }`**: long, thin parts need a more foreshortened angle in
  portrait than dolly-back alone gives. On narrow screens, callouts dock along the bottom with
  leader lines up to each part.
- **Callout specs:** only facts you can stand behind (part numbers, counts, envelope from the
  bounds). Don't invent ratings.

**Baked camera instead of splines:** in Blender, animate a camera, bake it (Visual Keying), name the
action `CameraPath`, and export with Cameras enabled. The starter detects the clip and camera and
scrubs it from scroll progress.

**HDRI:** download a 1K–2K `.hdr` from Poly Haven into `env/` and set `hdrUrl`. Without one,
the starter uses three.js `RoomEnvironment`.

## How scroll maps to the scene

- Beat *i* arrives when section *i*'s top reaches the top of the viewport.
- Between beats, a smoothstep ease makes the camera settle on each beat instead of drifting through it.
- Damping is frame-rate independent (`CONFIG.damping`, per 60fps frame).
- `prefers-reduced-motion`: no Lenis, no damping, and the camera snaps directly to each scroll position.
- Desktop pushes the model right of the copy (`frameOffsetX`). Portrait screens dolly the camera back.

## Test

```bash
node ../scripts/capture-scroll-frames.mjs http://localhost:8080 frames            # desktop
node ../scripts/capture-scroll-frames.mjs http://localhost:8080 frames --mobile   # 390×844
```

This writes screenshots at 0/25/50/75/100% and exits non-zero on console errors. It waits for
damping to settle and CSS fades to finish, because heavy CAD scenes under software GL render
slowly and HUD fades start late. The page exposes
`window.__scrollStory.state()` for debugging.

## Pinned versions

three 0.187.0, gsap 3.15.0, lenis 1.3.27 (import map in `index.html`). Bump them deliberately and
re-run the frame capture.
