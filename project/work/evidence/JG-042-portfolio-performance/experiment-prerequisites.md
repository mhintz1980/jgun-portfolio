# P05/P06/P09 prerequisite audit

Source baseline: `6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`. No runtime, model, package or lockfile modifications accepted.

## Model and loader inventory

Local repo skills consulted: threejs-asset-pipeline and threejs-loaders (target r186; installed r185.1 source/types take precedence). `npx --no-install gltf-transform inspect public/models/Default.glb` failed ENOVERSIONS; no CLI was installed. Deterministic GLB JSON-chunk inspection supplies the structural inventory below; it is not a decoded geometry or expansion census.

| Asset | Bytes | Nodes / mesh definitions / primitives / mesh-bearing nodes | Extensions used |
|---|---:|---|---|
| Default.glb | 10,671,700 | 345 / 101 / 10,674 / 162 | KHR_draco_mesh_compression |
| knurling-tool.glb | 1,798,620 | 18 / 12 / 12 / 12 | none |
| manufacturing-core-full.glb | 678,008 | 8 / 8 / 8 / 8 | KHR_draco_mesh_compression |
| manufacturing-core-lite.glb | 415,424 | 8 / 8 / 8 / 8 | KHR_draco_mesh_compression |
| msp-enclosure.glb | 2,671,600 | 560 / 196 / 224 / 551 | KHR_draco_mesh_compression |
| rl300-lite.glb | 1,186,488 | 560 / 196 / 206 / 551 | KHR_draco_mesh_compression |
| rl300-extra-parts.glb | 387,588 | 22 / 19 / 19 / 19 | KHR_materials_clearcoat |
| m249-transformed.glb (held back) | 892,092 | 1 / 1 / 1 / 1 | EXT_texture_webp, KHR_draco_mesh_compression |

All eight GLBs in public/models were enumerated and parsed. None declares EXT_meshopt_compression or KHR_texture_basisu. Only M249 contains images (three WebP); M249 remains excluded. This bounds the asset-extension claim to this local inventory, not arbitrary future models. No decoded primitive identity, D1-AP role-map or draw-call parity test was run for a re-export because no re-export exists. Local Default.glb differs in length from the live 10,672,957-byte research payload; never pool their results.

RuntimeWorld.tsx loads `/models/Default.glb` with drei useGLTF and explicit `/draco/`. ringRuntimeCore.ts parses knurling-tool through three GLTFLoader. Shaft story selects full/lite manufacturing-core. QuietMachineScene.tsx uses three GLTFLoader with local Draco for its selected enclosure and parallel extra-parts. The installed drei/core/Gltf.js imports MeshoptDecoder from three-stdlib and enables it by default. No direct KTX2Loader/MeshoptDecoder configuration was found in src by the bounded source scan. Removing a nonexistent local setting cannot establish tree-shaking; disabling a hook flag alone does not prove import removal.

**P05: deferred.** CLI unavailable, prep/decode attribution unresolved, no paired readiness gain/visual parity/decoded expansion proof. Do not re-export or change URLs/caching.

**P06: deferred without adoption.** Asset-extension prerequisite is promising, but no measured production-byte removal and no complete full/lite/QM decode-and-readiness comparison exists. A changed shared loader would require a separate proven candidate; baseline loader behavior stays intact. No claimed bundle saving.

## Dependency lanes

Official package-registry metadata confirms R3F 9.8.2 and three 0.187.0 exist. R3F 9.8.2 supports React >=19 <19.4 and three >=0.156. Official [R3F release](https://github.com/pmndrs/react-three-fiber/releases/tag/v9.8.2) highlights portal cleanup, dynamic DPR, JSX typing, pointer capture and demand-frame removal fixes. These are correctness candidates, not measured performance gains for this application. No corresponding reproducible app defect was established here.

Official [three r187 release](https://github.com/mrdoob/three.js/releases/tag/r187) includes changes to MeshPhysicalMaterial BRDF, PMREM and deprecated APIs, plus many targeted fixes. Those can change this site's material/environment appearance. No applicable reproduced defect or measured benefit justifies adopting that rendering change without a separate comparison and full roster.

**P09: both lanes deferred.** Version facts were verified independently; neither dependency was installed or modified. No v10 alpha, combined upgrade, migration or upgrade-as-ROI claim.

## Delegation outcome

Two selected GLM-5.3-Flash/high worker contexts produced no usable files before being stopped after extended elapsed time. Parent completed these bounded audits; no substitute model was dispatched. P10 fresh implementation review remains a separate requirement, with GLM-5.3/high selected.
