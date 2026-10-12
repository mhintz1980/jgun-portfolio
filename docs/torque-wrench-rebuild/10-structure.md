# Torque wrench rebuild — structure phase

## Status and inputs

Structure only. No source, tests, or build configuration change in this phase.

Inputs:

- Accepted design: [09-design.md](09-design.md)
- Independent design review: [09-design-review.md](09-design-review.md)
- Owner rulings: [00-owner-rulings.md](00-owner-rulings.md)
- Motion standard: [smooth-scrolling.md](smooth-scrolling.md)
- Owner-supplied Oryzo/Lusion teardown: `C:/vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md`
- Current source inventory on `torque-wrench/rebuild` at `1b414948`.

This structure defines the target file and module boundaries for the private `/torque-wrench/` page. It does not authorize implementation, commit slicing, or product code changes.

## 1. Topology

The new page is a separate document with its own entry point and page-local runtime. The existing portfolio page remains live and untouched until replacement acceptance and authorized publication.

| Surface | Target | Responsibility |
| --- | --- | --- |
| HTML entry | `torque-wrench/index.html` | Page metadata, canonical URL, shared fade/navigation shell, and `#root` mount |
| Build topology | `vite.config.ts` | Adds the private page as a second HTML input while preserving the existing portfolio entry |
| JS entry | `src/torque-wrench-main.tsx` | StrictMode root, shared CSS, shared fade installation, and page provider |
| Page composition | `src/scene/torque-wrench/TorqueWrenchPage.tsx` | Quality tier gating, canvas/poster selection, semantic DOM story, and page-level layout |
| Scroll conductor | `src/scene/torque-wrench/ScrollConductor.tsx` | Native scroll to canonical progress mapping, Lenis/ScrollTrigger lifecycle, reversible state |
| Scene world | `src/scene/torque-wrench/Scene.tsx` | One persistent Three.js/R3F world for the whole page |
| Beat data | `src/scene/torque-wrench/beats.ts` | Declarative, scroll-length-independent beat definitions |
| Beat resolver | `src/scene/torque-wrench/beatTimeline.ts` | Pure mapping from canonical progress to active beat and local beat progress |
| Director registry | `src/scene/torque-wrench/directorRegistry.ts` | Maps beat/director IDs to page-local directors without changing page composition |
| Semantic story | `src/scene/torque-wrench/Story.tsx` | Shared DOM story and interaction equivalents for canvas and poster paths |
| CAD gate | `src/scene/torque-wrench/cadGate.ts` | Lazy import boundary for every module that can load CAD or WebGL dependencies |
| Page state | `src/state/torqueWrenchStore.ts` | External store for canonical progress, active beat, tier, and telemetry |
| Opening director | `src/scene/torque-wrench/OpeningDirector.ts` | Recovered camera rake, paper pressure, shatter, emergence, and unified lightning timing |
| Pit director | `src/scene/torque-wrench/PitDirector.ts` | Pit geometry, material, depth, occlusion, and fissure state |
| Background director | `src/scene/torque-wrench/BackgroundDirector.ts` | Layered background state, depth separation, gradient/dither response, and background parallax |
| Poster path | `src/scene/torque-wrench/Poster.tsx` | High-quality offline-rendered poster and reduced-motion presentation |

No canvas, scroll conductor, or CAD model persists across documents. Navigation to or from this page uses the shared hard-navigation fade through dark.

## 2. Beat data contract

Beats are authored as data on a canonical `0..1` timeline, independent of the final scroll distance.

```ts
interface TorqueWrenchBeat {
  id: string
  start: number
  end: number
  title?: string
  copy?: string
  camera: 'registered' | 'rake' | 'emergence' | 'mechanism' | 'inspection' | 'close'
  scene: 'drawing' | 'breakthrough' | 'pit' | 'mechanism' | 'inspection' | 'close'
  director: 'opening' | 'pit' | 'mechanism' | 'inspection' | 'close'
  interaction?: 'none' | 'inspect' | 'bullet-time'
  poster?: string
}
```

The beat resolver returns:

- active beat ID
- local beat progress
- previous/next beat IDs
- whether the beat is entering, active, or exiting
- a stable state key for deterministic reverse scrolling

Adding a later bullet-time or mini-animation beat must only add a beat entry, a director, and a registry entry. It must not require editing the scroll spine, root page, shared shell, or `Scene.tsx` composition.

Entering, active, and exiting states derive from each beat's progress window and the resolver's pure output, not from traversal history. Transient pointer state is excluded from this contract and from canonical narrative state.

## 3. Page-local runtime boundaries

| Boundary | Rule |
| --- | --- |
| `src/scene/torque-wrench/**` | May import shared shell modules, existing validated drawing modules, CAD rig modules, and page-local state. Must not import the root portfolio `App`, `Chapters`, or `SceneCanvas`. |
| `src/state/torqueWrenchStore.ts` | Page-local external store. Must not import React components or Three.js objects. |
| Root portfolio runtime | Remains untouched by this page except for shared shell primitives and build topology. |
| Shared shell | Consumed from the parallel session's generic HTML entry, fade, navigation, and poster primitives. Those primitives are a blocking implementation dependency. |
| Existing validated modules | `sheetCamera`, `introTimeline`, `paperFlex`, `breakthrough`, `portal`, `electricalScore`, drawing geometry, CAD rig, and inspection patterns are reused through page-local directors rather than duplicated. |
| Cross-document state | None. Hard navigation through dark; no persistent canvas or scroll state. |

### Reuse boundary

| Reuse class | Modules | Structure |
| --- | --- | --- |
| Direct reuse | `paperFlex`, `breakthrough`, `breakthroughGeometry`, `portal`, `portalGeometry`, `electricalScore`, `sheetCamera` pose math, drawing geometry, and CAD assets | Imported by page-local directors or the lazy CAD gate |
| Extraction required before reuse | `TorqueWrenchHero`, `DrawingLinework`, and any component internally coupled to the existing scroll store or chapter ScrollTrigger | The new page does not mount these components as-is. Later planning either reuses their lower-level primitives directly or extracts page-safe primitives while preserving existing callers. |
| Not reused | Root `App`, `Chapters`, `SceneCanvas`, and root `ScrollRig` | Replaced by the page-local composition and conductor |

The new conductor owns canonical progress. The no-root-store and no-extra-ScrollTrigger rules apply transitively to every reused or extracted primitive, not just to page-local wrappers. This preserves the live page and avoids copying validated mechanics into unrelated files.

## 4. Opening and recovery structure

`OpeningDirector` is the only page-local module that couples the recovered opening behaviors:

- camera rake from the September 27 lineage
- model-driven opaque paper pressure from the October 2 lineage
- printed shatter from the October 1 lineage
- continuous wrench emergence from the October 2 lineage
- wooden-desktop-to-pit replacement
- unified light-blue branching electrical timing

It consumes canonical progress and returns a plain state object consumed by `Scene.tsx`. It does not own scroll mapping, DOM copy, or accessibility state.

`PitDirector` owns pit geometry, rock relief, wall angle, depth, no-bottom treatment, and fissure propagation. It receives the opening director's rupture/emergence state and canonical progress, but remains independently testable.

`BackgroundDirector` owns the authored background stack: base gradient, atmospheric depth layers, per-layer parallax, blue-noise dither, and continuous blending with the post profile. It consumes canonical progress and the optional pointer candidate, but does not own camera, post-processing, or pit geometry. Poster and reduced-motion paths consume its offline-rendered still instead of evaluating the live layers.

## 5. Poster, reduced motion, and accessibility

| Path | Responsibility |
| --- | --- |
| `src/scene/torque-wrench/Poster.tsx` | Renders the semantic DOM story with high-quality offline-rendered poster art |
| `public/torque-wrench/posters/` | Stores page-local poster assets produced from high-quality renders, not runtime stills |
| `src/scene/torque-wrench/posterMap.ts` | Maps beat or chapter to poster asset and alt text |

`TorqueWrenchPage.tsx` owns the WebGL-failure fallback: on failure it unmounts the canvas path and renders `Poster.tsx` without losing the shared semantic story. `cadGate.ts` is the only place allowed to import CAD-loading modules, and those imports stay lazy and tier-gated; poster/reduced-motion must not evaluate them.

Reduced motion and poster tier:

- mount no narrative WebGL canvas
- fetch no narrative CAD assets
- render the complete ordered DOM story
- use authored static posters or inspection rasters sourced from high-quality offline renders
- preserve keyboard order, visible focus, and reachable footer

## 6. Performance and rendering structure

The page reserves the following page-local modules for later planning and validation:

| Module | Purpose |
| --- | --- |
| `src/scene/torque-wrench/postProfile.ts` | Continuous grade/profile blending between beats |
| `src/scene/torque-wrench/backgroundLayers.ts` | Background layer definitions and deterministic state mapping |
| `src/scene/torque-wrench/pointerDynamics.ts` | Optional second-order pointer response candidate |
| `src/scene/torque-wrench/renderBudget.ts` | DPR, pixel-count, draw-call, triangle, and shader-compile budgets |

These are structure boundaries only. The Oryzo-derived values in the design remain candidates for later validation, not locked implementation constants.

## 7. Verification structure

| Verification surface | Target |
| --- | --- |
| Beat timeline tests | Pure progress mapping, reverse equality, beat addition without scroll-spine edits |
| Import boundary tests | Page-local runtime does not import root portfolio runtime; shared shell imports remain explicit |
| Page topology tests | Separate HTML entry, shared fade/navigation parity, no cross-document canvas |
| Opening verifier | Page-local camera/pressure/shatter/emergence/pit telemetry on the private page |
| Recovery A/B | Current camera/remap behavior versus the recovered October 2 candidate |
| Motion verifier | Slow, fast, stop, reverse, touch, keyboard, scrollbar, and Oryzo comparative evidence |
| Background verifier | Layer parallax, gradient banding, dither, beat-boundary continuity, and reduced-motion/poster still behavior |
| Tier roster | Full, lite, narrow, reduced-motion, and poster cases |
| Failure/equivalence | WebGL failure fallback and DOM interaction equivalence across canvas and poster paths |
| Three-part motion | Separate pacing, input-response, and camera-continuity assessments |
| Poster verifier | Zero narrative CAD downloads, zero narrative WebGL mounts, correct poster mapping |
| Performance verifier | Frame time, draw calls, triangles, texture memory, shader compilation, DPR/pixel caps |

Runtime verification must use telemetry and unaltered captures. Owner PNG review remains separate from technical verification.

## 8. Implementation dependencies

| Dependency | Status |
| --- | --- |
| Shared HTML entry/fade/navigation/poster primitives | Owned by the parallel Quiet Machine integration branch; blocking implementation |
| High-quality offline poster renders | Later asset production task; not runtime stills |
| Accepted design | Complete |
| Structure | This artifact |
| Implementation plan | Not started; requires separate owner approval |

## 9. Not in this structure

- No commit slicing or workstream plan.
- No source file creation, modification, or deletion.
- No runtime captures, builds, servers, or GPU use.
- No change to the existing live portfolio page.
- No publication, cutover, or archival authorization.
