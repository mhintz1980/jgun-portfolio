# 04 — Clipping planes + stencil capping: technical reference

Reference only. No design decisions here — section-group strategy, dynamic-cap vs. authored-capped-variant,
and file layout are owned elsewhere.

**Citations.** `[EX:n]` = line `n` of
`raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_clipping_stencil.html` (fetched 2026-09-10,
326 lines; rendered at `threejs.org/examples/webgl_clipping_stencil.html`). `[MAT]` `[REN:n]` `[CLIP]`
`[PLANE:n]` = `node_modules/three/src/` → `materials/Material.js`, `renderers/WebGLRenderer.js`,
`renderers/webgl/WebGLClipping.js`, `math/Plane.js` — three
**0.185.1** as installed; the docs pages for `Material`/`WebGLRenderer`/`Plane` are generated
from that JSDoc, so this is the same text. `[PP]` = postprocessing 6.39.4 `build/types/index.d.ts`. `[R3PP]`
= @react-three/postprocessing 3.1.1 `dist/{EffectComposer.d.ts,index.js}`. `[R3F]` = @react-three/fiber
9.7.0 `dist/events-*.esm.js`. Stack per `package.json`: three 0.185.1, fiber 9.7.0, drei 10.7.8,
r3f-postprocessing 3.1.1, postprocessing 6.39.4, React 19.2.8.

---

## 1. The mechanism

A clipping plane is a per-fragment `discard`, not a geometry operation — three uploads each plane as a
view-space `vec4` and kills fragments on its negative side `[CLIP]`, so the cut face was never modelled and
nothing fills it. The result is a hollow shell: you see through the cut into the inside of the far wall, or
into nothing when the material is `FrontSide`. The stencil trick manufactures the missing face by counting,
per pixel, how many back faces minus front faces of the solid lie behind the plane — for closed geometry
that count is non-zero exactly where the plane passes through material. That count lives in the stencil
buffer. A flat quad lying on the plane is then drawn with a stencil test so it paints only where the count
says "inside solid" — that quad is the cap.

---

## 2. The canonical two-pass recipe (transcribed)

### 2a. Counting group — `createPlaneStencilGroup()` `[EX:66–103]`

Two invisible meshes share **the same geometry** as the visible object, clipped by the same plane. Shared
base `[EX:69–74]`, then one clone per side `[EX:77–99]`:

```js
const baseMat = new THREE.MeshBasicMaterial();
baseMat.depthWrite = false;  baseMat.depthTest = false;  baseMat.colorWrite = false;
baseMat.stencilWrite = true;
baseMat.stencilFunc  = THREE.AlwaysStencilFunc;    // never rejects; every fragment runs its op

const mat0 = baseMat.clone();                      // BACK faces  [EX:77-82]
mat0.side = THREE.BackSide;   mat0.clippingPlanes = [ plane ];
mat0.stencilFail = mat0.stencilZFail = mat0.stencilZPass = THREE.IncrementWrapStencilOp;

const mat1 = baseMat.clone();                      // FRONT faces [EX:89-94]
mat1.side = THREE.FrontSide;  mat1.clippingPlanes = [ plane ];
mat1.stencilFail = mat1.stencilZFail = mat1.stencilZPass = THREE.DecrementWrapStencilOp;

const mesh0 = new THREE.Mesh( geometry, mat0 );  mesh0.renderOrder = renderOrder;  // [EX:84-85]
const mesh1 = new THREE.Mesh( geometry, mat1 );  mesh1.renderOrder = renderOrder;  // [EX:96-97]
```

(Upstream writes the three ops on separate lines; folded here for length, values as transcribed.) All three
ops get the same value because `stencilFunc` is `AlwaysStencilFunc` and `depthTest` is off — every
rasterized fragment lands in exactly one bucket and all three must count. The `*Wrap` ops (GL `INCR_WRAP` /
`DECR_WRAP`) wrap modulo 256 instead of clamping at 0/255, so `+1`/`−1` cancel exactly regardless of
ordering. Both meshes share a `renderOrder`; the ops commute, so their order relative to each other does not
matter.

### 2b. Cap quad `[EX:149, 158–186]`

```js
const planeGeom = new THREE.PlaneGeometry( 4, 4 );          // one geometry, reused per cap [EX:149]

const planeMat = new THREE.MeshStandardMaterial( {
  color: 0xE91E63, metalness: 0.1, roughness: 0.75,
  clippingPlanes: planes.filter( p => p !== plane ),        // cap is clipped by the OTHER planes
  stencilWrite: true,
  stencilRef:   0,
  stencilFunc:  THREE.NotEqualStencilFunc,                  // draw only where count !== 0
  stencilFail:  THREE.ReplaceStencilOp,
  stencilZFail: THREE.ReplaceStencilOp,
  stencilZPass: THREE.ReplaceStencilOp,                     // writes stencilRef (0) back
} );

const po = new THREE.Mesh( planeGeom, planeMat );
po.onAfterRender = function ( renderer ) { renderer.clearStencil(); };   // [EX:175-179]
po.renderOrder = i + 1.1;                                                // [EX:181]
```

`NotEqualStencilFunc` + `stencilRef: 0` is the whole test: paint where back-minus-front is non-zero, i.e.
where the plane is inside material. `ReplaceStencilOp` writes `stencilRef` (0) back as it goes;
`onAfterRender → clearStencil()` then wipes the buffer so the next plane's count starts clean. In three
0.185.1 `clearStencil()` is `this.clear( false, false, true )` `[REN]`.

The cap lives on a **separate group under the scene** (`poGroup`) `[EX:184–186]`, not under the model — the
plane is world-space, so the cap must not inherit the model transform. The counting group *does* go under
the model `[EX:183]`.

### 2c. Ordering `[EX:85, 97, 155, 181, 204]`

`i + 1` (→ 1, 2, 3) = counting meshes for plane `i`; `i + 1.1` (→ 1.1, 2.1, 3.1) = that plane's cap quad,
which clears the stencil after itself; `6` = the visible clipped object. Caps must resolve before the
visible object draws, and each plane's count must be isolated from the next — hence interleaved fractional
ordering plus the per-cap clear.

### 2d. Visible material + renderer `[EX:190–198, 202–204, 219, 225]`

```js
const material = new THREE.MeshStandardMaterial( {
  color: 0xFFC107, metalness: 0.1, roughness: 0.75,
  clippingPlanes: planes, clipShadows: true, shadowSide: THREE.DoubleSide,
} );
const clippedColorFront = new THREE.Mesh( geometry, material );
clippedColorFront.castShadow = true;  clippedColorFront.renderOrder = 6;

renderer = new THREE.WebGLRenderer( { antialias: true, stencil: true } );   // stencil REQUESTED
renderer.localClippingEnabled = true;
```

### 2e. Per-frame cap placement `[EX:303–314]`

```js
plane.coplanarPoint( po.position );
po.lookAt( po.position.x - plane.normal.x,
           po.position.y - plane.normal.y,
           po.position.z - plane.normal.z );
```

`Plane.coplanarPoint(target)` is `target.copy(normal).multiplyScalar(-constant)` `[PLANE:296]`. The `lookAt`
target is position minus normal, orienting `PlaneGeometry`'s +Z *against* the normal so the cap faces the
viewer on the kept side.

---

## 3. Local vs. global clipping

| | `material.clippingPlanes` | `renderer.clippingPlanes` |
| --- | --- | --- |
| Scope | objects using that material | **every object the renderer draws** |
| Default | `null` `[MAT]` | `[]` `[REN:251]` |
| Gate | requires `renderer.localClippingEnabled === true` `[MAT]` | none — active whenever non-empty `[CLIP]` |
| Space | world `[MAT]` | world `[REN:251]` |

`[CLIP] init()` computes `enabled = planes.length !== 0 || enableLocalClipping || …`, and `setState()`
short-circuits on `if ( ! localClippingEnabled || planes === null || planes.length === 0 … )`. The two sets
are **unioned**: `setState()` writes local planes after `lGlobal = numGlobalPlanes * 4` slots, copies global
state into the leading slots, then `this.numPlanes += nGlobal` `[CLIP]`.

**The plan needs local (`material.clippingPlanes`).** One `WebGLRenderer` draws every station.
`renderer.clippingPlanes` would cut the JGUN stage, the contact shadow, and the drawing plane along with the
RL300 — there is no per-object exemption from a global plane. The existing sectioning already works this
way: `src/scene/stages/Station2_AcousticEnclosure.tsx:257` assigns `clone.clippingPlanes = [CUT_PLANE]` on
per-part material clones, gated to `CUT_ROOTS = {ENCLOSURE_CHASSIS, COMPOSITE_PANELS}` (`:206`, `:227`).

**`localClippingEnabled` is already on here:** `src/scene/SceneCanvas.tsx:312`, in the
`<Canvas onCreated>` callback. Live hazard: `src/scene/drawing/drawingGeometry.ts` saves the flag at `:591`,
forces it `true` at `:593`, restores at `:714` around an offscreen render — anything reading the flag must
tolerate that window.

---

## 4. Transforming the plane into model space

A clipping `Plane` is interpreted in **world space**. Three re-projects it into view space every frame —
`plane.copy( planes[i] ).applyMatrix4( viewMatrix, viewNormalMatrix )` with `viewMatrix =
camera.matrixWorldInverse` `[CLIP: projectPlanes]` — and never consults the mesh's `matrixWorld`. So a plane
authored in the model's own coordinates is wrong by the model transform. `Plane.applyMatrix4( matrix,
optionalNormalMatrix )` `[PLANE:314]` ("the matrix must be an affine, homogeneous transform") transforms
`coplanarPoint`, applies the normal matrix to the normal, re-normalizes, then recomputes `constant =
-referencePoint.dot(normal)`.

Author in model space, push to world — one-shot, then the per-frame sweep into a **persistent** instance
(never allocate, never mutate the authored plane):

```ts
modelRoot.updateWorldMatrix(true, false)                   // matrixWorld must be current
const nm = new Matrix3().getNormalMatrix(modelRoot.matrixWorld)
const worldPlane = modelPlane.clone().applyMatrix4(modelRoot.matrixWorld, nm)
material.clippingPlanes = [worldPlane]

// per frame, _modelPlane carrying the swept constant:
_worldPlane.copy(_modelPlane)
_worldPlane.applyMatrix4(modelRoot.matrixWorld, _nm.getNormalMatrix(modelRoot.matrixWorld))
```

Mutating a plane a material already references is free — `projectPlanes` re-reads and re-uploads it every
frame `[CLIP]`, so animating `plane.constant` needs no invalidation call.

**Common mistakes.** (1) Assigning a model-local plane directly, then wondering why the cut is
offset or tilted. Current code sidesteps this by authoring in world units
(`Station2_AcousticEnclosure.tsx:202–205`, `CUT_STATION_X = 28`; the comment at `:198` says "Clipping planes
are world-space") — a model under a scaled or rotated root cannot. (2) Calling `applyMatrix4` repeatedly on
the *same* instance each frame: destructive and compounding — always `copy()` first. (3) Skipping
`normalize()` `[PLANE:143]` after building from a hand-written normal;
`setFromNormalAndCoplanarPoint(normal, point)` `[PLANE:92]` assumes unit length, and a non-unit normal makes
`constant` stop being a distance, so sweeping it moves the cut at the wrong rate. (4) Parenting the cap
under the model — the plane does not inherit transforms, so the cap must not either `[EX:186]`.

---

## 5. R3F adaptation notes

**Stencil must be requested on the canvas.** three 0.185.1 defaults `stencil = false` in the
`WebGLRenderer` parameter destructure `[REN]`. Fiber 9.7.0 builds the renderer as `gl = new
THREE.WebGLRenderer({ ...defaultProps, ...glConfig })`, `defaultProps` being `{ canvas, powerPreference:
'high-performance', antialias: true, alpha: true }` and `glConfig` the `gl` prop `[R3F]` — `stencil` is not
in fiber's defaults either. **This repo does not request one:** `SceneCanvas.tsx:304` is `gl={{ antialias:
true, powerPreference: 'high-performance' }}`. It would need `stencil: true` added. This is a WebGL *context
attribute* — not togglable after creation; changing it remounts the renderer and drops the GL context.

**Renderer flags.** `localClippingEnabled` is a plain property, settable from
`<Canvas onCreated={({ gl }) => …}>` (where this repo sets it, `:306–312`) or from a child via `useThree(s
=> s.gl)`. Unlike `stencil`, it is live-togglable.

**Two materials on one geometry.** The counting pass draws the same `BufferGeometry` twice with
different materials — declaratively, two `<mesh>` elements referencing the same geometry object, each with
its own material child. `attach="material"` / `attach="geometry"` is inferred for material and geometry
elements, but writing it explicitly is always safe. Reuse a loaded GLTF `node.geometry` **by reference**;
cloning doubles VRAM for nothing.

**`needsUpdate` caveat — mostly unnecessary, verified.**

- Changing the *number* of clipping planes on a material (`null` → `[plane]`) already forces a program
  rebuild: `WebGLRenderer.js:2456–2458` sets `needsProgramChange = true` when
  `materialProperties.numClippingPlanes !== clipping.numPlanes || materialProperties.numIntersection !==
  clipping.numIntersection`. No manual `material.needsUpdate = true` for that transition.
- Changing plane *values* needs nothing — re-projected per frame `[CLIP]`.
- `stencilWrite`, `stencilFunc`, `stencilRef`, the three ops, and `side` are GL state, not shader defines,
  so they should not recompile. Inferred from their absence in the program-change checks at
  `WebGLRenderer.js:2390–2480`; not traced through `WebGLState` — see §10.
- Residual risk is R3F re-creating a material instance on a prop change and dropping an
  imperatively-assigned `clippingPlanes`. Assign it in the same place every frame, or pass it as a JSX prop.

---

## 6. EffectComposer interaction — partly UNRESOLVED

Verified about this repo's composer (`src/scene/PostProcessingComposer.tsx:143`, `<EffectComposer
multisampling={0}>` → ChromaticAberration (full tier) → Bloom → ToneMapping):

- @react-three/postprocessing 3.1.1 `EffectComposerProps` **does** expose `stencilBuffer?: boolean` `[R3PP]`
  and forwards it verbatim: `new EffectComposerImpl(gl, { depthBuffer, stencilBuffer, multisampling,
  frameBufferType })`. The destructure gives **no default**, so it arrives `undefined`.
- postprocessing 6.39.4 ctor JSDoc: `@param {Boolean} [options.stencilBuffer=false]` — "Whether the main
  render targets should have a stencil buffer" `[PP]`.
- The repo passes no `stencilBuffer` prop → **the composer's render targets have no stencil attachment
  today.**
- The library is stencil-aware: its `useFrame` runs `if (stencilBuffer && !autoClear) gl.clearStencil();`
  before `composer.render(delta)` `[R3PP]`.
- postprocessing's `ClearPass` ctor is `(color = true, depth = true, stencil = false)` and `RenderPass` owns
  a `clearPass` `[PP]` — stencil clearing inside the render pass is off by default too. three's
  `autoClearStencil` defaults `true` `[REN:225]`; r3f-pp sets `gl.autoClear = autoClear` (prop default
  `true`) around `composer.render` `[R3PP]`.

**Two independent stencil attachments exist in this app, and neither has one today.** With the
composer mounted, `RenderPass` renders the scene into the composer's off-screen `inputBuffer`, so the
composer's `stencilBuffer` option governs. With it unmounted — `PostProcessingComposer` returns `null` for
`tier === 'poster'` or `reducedMotion` (`:137`) — the scene goes straight to the canvas default framebuffer,
where the `gl={{ stencil }}` context attribute governs. A capped section that must survive reduced-motion
needs both.

**Not determined — verify at runtime, do not assume.** Whether the forwarded `stencilBuffer` truly
produces a usable attachment, whether `clearStencil()` hits the bound target or the default framebuffer,
whether MSAA preserves stencil, and whether `autoClear` fights the per-cap clear are all open — §10 items
1–4. The upstream example runs with no composer at all, so it proves none of them.

---

## 7. Cost model

**Clipping is nearly free; capping is not.** A clipping plane adds one `vec4` uniform and a
per-fragment discard `[CLIP]` — zero extra draw calls. That is why `Station2_AcousticEnclosure.tsx` can
afford `clone.clippingPlanes = [CUT_PLANE]` on every part of two GLTF roots. Capping changes the arithmetic
entirely.

**Per capped unit, per plane, the cap pass adds:** 2 draw calls over the *full* geometry of that
unit (back count, front count); 1 cap-quad draw plus a `clearStencil()` full-target clear `[EX:177]`; 2
extra full vertex-transform + rasterization passes (no color write, but the vertex shader still runs); 2
extra material/program instances — the `baseMat.clone()` pair `[EX:77, 89]` — because `clippingPlanes` is
per-material.

**What scales the cost.** Dominant term: `draw calls = 3 × (capped units) × (planes)`. Secondary:
rasterized fragments for the counting passes — `depthTest = false` means **no early-Z rejection**, so every
triangle of the unit is fully rasterized — and cap-quad overdraw, since the quad must cover the
cross-section (upstream's is `PlaneGeometry(4, 4)` `[EX:149]`).

**Why per-part across hundreds of CAD meshes is the failure mode** (plan §89: *"Do not apply an
expensive cap pass independently to hundreds of CAD parts"*): the RL300 GLTF is CAD-derived and the existing
code already walks it part-by-part cloning materials. At 400 parts and one plane that is ~1200 extra draw
calls per frame on top of ~400 base draws — a 4× multiplier, 800 of them writing no color — and it defeats
mesh consolidation, since each part needs its own material pair. Upstream runs one geometry × three planes =
6 counting draws + 3 caps total `[EX:151–188]`; that is the scale the technique is designed for.

**The term to hold down is the number of *capped units*, not the number of parts** — the counting
pass costs the same 2 draws over a merged buffer as over a single part. How to group is not decided here.

---

## 8. Known limitations

- **Closed geometry required.** Back-minus-front only balances for watertight, consistently-wound manifold
  solids. Open shells, sheet bodies, and cracked CAD tessellations give counts that never return to zero —
  caps bleed outside the solid or vanish inside it. Biggest risk for imported CAD; the plan names it at §160
  (*"Thin or intersecting CAD surfaces make caps unreliable"*).
- **Zero-thickness surfaces have no interior.** A sheet body gives `+1 −1` at the same pixel → count 0 → no
  cap. Thin walls modelled as surfaces need real thickness first.
- **8-bit stencil, modulo 256.** `*Wrap` wraps rather than clamps, so ≥256 overlapping surface layers along
  a view ray alias back to a false zero.
- **Intersecting solids.** Two interpenetrating closed solids in one counting group still give a non-zero
  count throughout their union, so the cap is geometrically right — but it is one flat material, so parts
  cannot be tinted differently without separate groups (multiplying §7's cost).
- **Coplanar facets.** Geometry lying exactly on the cut plane, and the cap quad itself, are coplanar —
  expect z-fighting unless depth handling is arranged or the plane never rests on a face.
- **Shadows.** Local clipping is skipped in the shadow pass unless `clipShadows = true` —
  `[CLIP] setState()` short-circuits on `renderingShadows && ! clipShadows` — so without it the object casts an
  *uncut* shadow. Upstream sets `clipShadows: true` + `shadowSide: DoubleSide` `[EX:196–197]`; this repo
  already sets it (`Station2_AcousticEnclosure.tsx:258`). The cap quad neither casts nor receives shadows
  unless deliberately configured.
- **`clipIntersection`** `[MAT]`: "Changes the behavior of clipping planes so that only their intersection
  is clipped, rather than their union." Default `false`; a **no-op with one plane**. `[CLIP]` sets
  `numIntersection = clipIntersection ? numPlanes : 0` from the *local* count and appends globals
  afterwards, so global planes combine as union regardless.
- **Transparency.** Counting materials use `colorWrite = false`, so blending is irrelevant to them — but the
  cap draws opaque and will not follow a part's `transparent` / `opacity` / `depthWrite: false` setup (as
  used for `COMPOSITE_PANELS`, `:261–266`).
- **Cap extent.** A finite `PlaneGeometry` truncates the cap if the cross-section exceeds it — size from the
  model's bounding sphere, not a literal.

---

## 9. Code sketch — **UNVERIFIED, NOT RUN IN THIS REPO**

> Shape only. Not typechecked, not executed, not benchmarked here. Single plane, single
> pre-merged geometry; says nothing about grouping, tier gating, or the §6 stencil questions.

```tsx
const _nm = new Matrix3()
// geometry: ONE merged section group, not a per-part mesh (§7)
// modelRoot: whatever modelPlane's constants were authored against
// modelPlane: model-space; swept by animating .constant
export function CappedSection({ geometry, modelRoot, modelPlane, capSize = 4 }: Props) {
  // gl.localClippingEnabled is already true — SceneCanvas.tsx:312
  const worldPlane = useMemo(() => new Plane(new Vector3(-1, 0, 0), 0), [])
  const clip = useMemo(() => [worldPlane], [worldPlane])
  const capRef = useRef<Mesh>(null)

  useFrame(() => {
    modelRoot.updateWorldMatrix(true, false)
    worldPlane.copy(modelPlane)                                 // never mutate the authored plane
    worldPlane.applyMatrix4(modelRoot.matrixWorld, _nm.getNormalMatrix(modelRoot.matrixWorld))
    const cap = capRef.current; if (!cap) return
    worldPlane.coplanarPoint(cap.position)                                            // [EX:307]
    cap.lookAt(cap.position.x - worldPlane.normal.x,                              // [EX:308-312]
               cap.position.y - worldPlane.normal.y,
               cap.position.z - worldPlane.normal.z)
  })

  const count = { depthWrite: false, depthTest: false, colorWrite: false, clippingPlanes: clip,
                  stencilWrite: true, stencilFunc: AlwaysStencilFunc }
  const ops = (o: number) => ({ stencilFail: o, stencilZFail: o, stencilZPass: o })

  return (
    <>
      {/* counting pass — both share `geometry`, both under the model root */}
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial attach="material" side={BackSide} {...count} {...ops(IncrementWrapStencilOp)} />
      </mesh>
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial attach="material" side={FrontSide} {...count} {...ops(DecrementWrapStencilOp)} />
      </mesh>
      {/* cap — sibling of the model, NOT a child (§4 mistake 4) */}
      <mesh ref={capRef} renderOrder={1.1} onAfterRender={(r) => r.clearStencil()}>
        <planeGeometry args={[capSize, capSize]} />
        <meshStandardMaterial attach="material" color="#8a9099" metalness={0.1} roughness={0.75}
          stencilWrite stencilRef={0} stencilFunc={NotEqualStencilFunc} {...ops(ReplaceStencilOp)} />
      </mesh>
      {/* visible clipped shell, drawn last */}
      <mesh geometry={geometry} renderOrder={6} castShadow>
        <meshStandardMaterial attach="material" clippingPlanes={clip} clipShadows
          shadowSide={DoubleSide} color="#1b2b4d" metalness={0.2} roughness={0.5} />
      </mesh>
    </>
  )
}
```

Unverified sketch specifics: whether fiber 9.7.0 forwards an `onAfterRender` prop onto the `Object3D` hook
(upstream assigns it imperatively `[EX:175]`); whether `<mesh>` accepts a shared `geometry` prop without
cloning; whether the counting meshes must be explicitly re-parented under `modelRoot` rather than rendered
inline.

---

## 10. To verify

1. **Does `<EffectComposer stencilBuffer>` (r3f-pp 3.1.1) actually yield a usable stencil?** The prop exists
   and is forwarded `[R3PP]`, the option is documented defaulting `false` `[PP]` — but postprocessing's
   render-target construction was not traced to confirm it reaches `WebGLRenderTarget` with a
   `DEPTH24_STENCIL8` attachment.
2. **Does `renderer.clearStencil()` clear the composer's bound render target** or the default framebuffer?
   Load-bearing for the per-cap clear `[EX:177]`.
3. **Does `multisampling > 0` preserve stencil** through postprocessing's MSAA resolve? Moot at
   `multisampling={0}`, but it constrains future AA changes.
4. **Does `autoClear = true`** (r3f-pp default, used here) conflict with the per-cap `clearStencil()`
   ordering?
5. **Do stencil properties and `side` truly avoid a shader recompile?** Absent from the program-change
   checks at `WebGLRenderer.js:2390–2480`, but not traced through `WebGLState` / `WebGLPrograms` cache-key
   construction.
6. **Does fiber 9.7.0 forward an `onAfterRender` prop** to `Object3D.onAfterRender`? §9 assumes it. 7. **Is
a per-cap `clearStencil()` needed with only one cut plane?** Upstream needs it because
   three planes share one buffer `[EX:151]`; a single-plane sweep may be able to rely on
   `autoClearStencil` `[REN:225]`.
8. **Cost of adding `stencil: true` to `SceneCanvas.tsx:304`** on tiers that never section — an extra 8 bits
   per pixel on the default framebuffer, unmeasured here.
