# Shaft verifier review corrections — 2026-10-06

**Ready for parent release to production browser proof. Runtime acceptance remains unverified.** All six FIX-FIRST findings are implemented in `scripts/verify-shaft-inspection.mjs`. This correction pass ran no browser, GPU work, server, build, git command, or app/CAD mutation. `gates/shaft-runtime-browser.md` remains unchanged. Historical diagnostic/preview reports were not edited.

`node --check scripts/verify-shaft-inspection.mjs` exited **0**. Corrected verifier SHA256: `e916bcd0ddc3471dbf21c6a108a8e400cba2fba25ae1b1cd2327019a932db943`.

## Implemented checks

1. **Network scope:** Node request events are installed before navigation and retained through exit/context teardown. `allCAD` inventories GLB/GLTF/BIN/OBJ/STL/FBX/PLY; inspection manufacturing/knurling and narrative requests have separate inventories. Poster asserts zero **allCAD**; reduced motion asserts zero **inspection** requests. Static assertions run after the entry/exit step even if it failed. Reduced narrative requests explicitly leave lifecycle V4's broader zero-CAD policy unresolved; S8 does not waive it.
2. **Target draw evidence:** S8 instruments the study-owned legacy/approved shaft meshes' `onBeforeRender`, preserving the original callbacks and GLTF node names. Each callback records ancestor visibility, material visibility/opacity, vertices, camera layers, world bounding-box projection and viewport intersection, plus epoch/playhead/sample/camera/render stamps. Isolate through materials require legacy; revised wipe requires both; hobbing through finale require approved. A cap mesh cannot substitute for the target. The scene color draw is paired with a PNG readback after synchronous composer output passes complete, before browser framebuffer clearing. Depth override passes are excluded. Readback epoch/time/stamps must equal the color-draw tuple. PNG SHA256 and target witnesses are stored with each capture. Existing luma/non-modal/bucket nonblank thresholds remain unchanged.
3. **Independent copy/timing oracle:** the four literal material strings, FAILED, designer attribution, illustrative caption and recap caption are hardcoded in the verifier. Independent attempt boundaries are 15..17.8, 17.8..20.3, 20.3..22.6; the final heat-treatment card is 33.2..35 with no stamp. The oracle holds full-readable text after the .14-second fade for 1.02 seconds before FAILED, then a .15-second stamp impulse; checks straddle the stamp transitions independently of imported sampler constants. Attribution 15..22.6, recap 11..15, warm stress 15..25 and cool stress 32.8..35 are independent. DOM exact-copy/telemetry checks and authored sampler agreement are separate, so changing the authored shared string cannot silently update the oracle.
4. **Entry and tier:** blueprint and exploded entry assertions observe the actual mode immediately before clicking and in the settled pre-entry snapshot. A fetch hook records the runtime-owned manufacturing asset selection before bytes/compilation with its session/kind/status and entry record. The selected URL authoritatively establishes the effective factory tier; it is checked against the corresponding asset metadata and Node network request. Entry-requested tier and later adaptive tier are reported separately; only full-to-full/lite or lite-to-lite creation is accepted. Later adaptive downgrades cannot relabel which variant created the runtime.
5. **Source anchors:** nonexistent InspectionController mapping is removed. Symptoms now map to field-specific runtime publication/apply lines. The obsolete poster throw mappings are corrected in new evidence and the harness, without rewriting historical JSON.
6. **N1 visible failure:** denied fetch now requires one visible DOM error paragraph with exact text `The study could not load. Return or try again.`, stores its text/visibility plus a screenshot, and retains error telemetry, enabled retry, recovery and focus assertions.

## Corrected live source mappings

| Symptom | Current source anchor |
|---|---|
| Camera restoration observation | `src/scene/CameraRig.tsx:229` |
| Historical missing shaft story throw | `src/scene/inspection/story.ts:88` |
| Entry lookup | `src/state/inspectionStore.ts:53` |
| Shaft trigger | `src/components/RingInspection.tsx:155` |
| Canvas story registration | `src/scene/inspection/InspectionScene.tsx:16` |
| Factory tier/context | `src/scene/inspection/InspectionScene.tsx:110` |
| Asset selection | `src/scene/inspection/shaft/shaftRuntime.ts:271` |
| Progression state writes | `src/scene/inspection/shaft/shaftRuntime.ts:327` |
| Target visibility/apply | `src/scene/inspection/shaft/shaftRuntime.ts:349` |
| Retained tooth counts | `src/scene/inspection/shaft/shaftRuntime.ts:421` |
| Cutter | `src/scene/inspection/shaft/shaftRuntime.ts:422` |
| Hob | `src/scene/inspection/shaft/shaftRuntime.ts:424` |
| Card/stamp | `src/scene/inspection/shaft/shaftRuntime.ts:425` |
| Stress | `src/scene/inspection/shaft/shaftRuntime.ts:426` |
| Supports/endpoint | `src/scene/inspection/shaft/shaftRuntime.ts:427–428` |
| Finale assembly | `src/scene/inspection/shaft/shaftRuntime.ts:429` |
| Narrative alpha | `src/scene/inspection/shaft/shaftRuntime.ts:434` |
| Owned disposal | `src/scene/inspection/shaft/shaftRuntime.ts:439` |
| Ahead-of-face retained-depth shader mask | `src/scene/inspection/shaft/progression.ts:286` |
| Disabled Play | `src/components/RingInspection.tsx:173` |
| Visible error content | `src/components/RingInspection.tsx:165` |

These anchors describe current live source. They annotate the historical findings without claiming a new runtime result. Graph coverage reported no recorded gaps but changed metadata for the relied-on source files; actual conclusions use direct current source reads, not graph freshness.

## Checks retained and release protocol

S1–S8/N1–N4 execution paths remain in both viewports. The <=.05-second shaping sweep, live shader uniforms, retained-partial stock count, wholly non-engaged interval scan, no stock advance/engagement on returns, gain-to-counted-engagement checks, previous-pass depth, chip/tool/contact checks, 3-frame paused slow-exit stability, 1e-6 camera restore, existing projection tolerance, exact discrete restoration and owned N3 disposal checks are retained. No tolerance was broadened in this correction pass.

Await parent release before running against the rebuilt/restarted production preview. Then complete two sequential runs with distinct new output directories:

```powershell
node scripts/verify-shaft-inspection.mjs --url=http://localhost:4173 --out=project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/shaft/final-run-1
node scripts/verify-shaft-inspection.mjs --url=http://localhost:4173 --out=project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/shaft/final-run-2
```

Results must agree. Parent independent runtime proof/review remains required. Reassess the previously failed complete S2 causal sweep/uniforms, settled desktop restore, desktop N3 entry timeout, and rebuilt poster entry/network/focus. New draw/readback and factory bindings also need fresh runtime confirmation. Do not mark browser gates from this readiness note.
