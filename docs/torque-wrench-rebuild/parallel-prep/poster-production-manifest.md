# JG-038 Stage 6 offline poster production manifest — preparation only

**Work ID:** JG-038 (torque-wrench rebuild), Stage 6 preparation.
**Date:** 2026-10-12 (America/New_York).
**Workspace:** `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`.
**Status:** Preparation record only. No render, no new art, no build/browser/GPU run, no config change, no Git delivery, no publication. Owned write: this file. Other dirty/untracked work in the worktree belongs to concurrent sessions and was not touched. The protected `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` checkout was not read or used.

**Authority read:** AGENTS.md; [13-implementation-plan.md](../13-implementation-plan.md) including the 2026-10-12 skill-activation amendment (row: "Offline poster producer — Plan Stage 6 ... no dedicated still-render/provenance skill was found; do not use mesh-generation or cloud media skills; preserve immutable source scenes, record settings/assets/hashes and desktop/narrow art provenance"); [09-design.md](../09-design.md) (background system + accessibility/poster rules); [10-structure.md](../10-structure.md) (beat contract §§2, poster path §5); [posterMap.ts](../../../src/scene/torque-wrench/posterMap.ts); shared contract `src/shared/poster.ts` + `src/shared/posterGuard.ts`; `C:/Projects/skills-master/local/asset-and-bundle-hygiene/SKILL.md` (read before asset/path/provenance checks); `C:/Projects/skills-master/local/spatial-hotspot-a11y/SKILL.md` (semantic-equivalent guidance for alt text).

## 1. Framing contract

| Variant | CSS frame | Raster pixel proposal (recorded exactly at render) |
| --- | --- | --- |
| Desktop | 1440×900 @ DPR1 | 2880×1800 (2× master) |
| Narrow | 390×844 @ DPR3 (emulated touch) | 1170×2532 (3× master) |

- Narrow crop switches at `POSTER_NARROW_MEDIA = '(max-width: 600px)'` (`src/shared/poster.ts`).
- Framing evidence basis: Stage 0/1 verification matrix "D 1440x900 DPR1 desktop / N 390x844 DPR3 touch/mobile" (`project/work/evidence/torque-wrench-rebuild/05-stage1-integration/activation-validation.json` line 57).

## 2. Chapter inventory (five chapters + background)

Chapter ids are the stable keys from `TORQUE_POSTER_CHAPTERS` in `posterMap.ts`; story copy is the accepted design copy in `src/scene/torque-wrench/Story.tsx` (`CHAPTER_COPY`). Alt text below is a draft basis from that copy — final alt text is confirmed with final art; empty alt fails `validatePosterMap`.

| id | Scene/camera per structure §2 | Draft alt text basis |
| --- | --- | --- |
| `drafting` | `drawing` / `registered` | "Engineering drawing of the JGUN torque wrench: intact drafting sheet, handwritten annotations, and a traced profile held in a calm, registered view." |
| `breakthrough` | `breakthrough` / `rake`–`emergence` | "Solid wrench model pushing up through opaque paper; the printed sheet fractures along the traced profile as the wrench rises through the opening." |
| `mechanism` | `mechanism` / `mechanism` | "Cutaway of the wrench housing showing the gear train, clutch, and extraction sequence in measured order." |
| `inspection` | `inspection` / `inspection` | "Input-shaft cutter inspection in bullet time: subject nearly stopped while the camera moves at normal speed around it." |
| `close` | `close` / `close` | "Finished torque wrench settled over the pit as the last of the unified lightning fades." |
| background still | authored layered background (design09 "Layered background") | "Layered atmospheric background: dark radial gradient with depth layers separating the subject from the pit and cavern." |

Background rules from design09: two/three depth layers, gamma-correct radial gradient with blue-noise dither, continuous post-profile blend; reduced-motion/poster paths consume an offline-rendered background still, never live parallax layers.

## 3. Candidate source inventory (existence verified 2026-10-12)

All paths named by repository scripts/evidence; each was Test-Path verified. Existing immutable CAD scenes are preserved; any Stage 6 render scene must be a **derived** file created only after parent-stage readiness.

### Blender source scenes (external CAD, read-only sources)

| Source | Named by | Exists |
| --- | --- | --- |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/input-shaft-assembly-parts-v1.blend` | `scripts/manufacturing/export_study.py:48`, `scripts/manufacturing/tool_clearance.py:42`, `scripts/manufacturing/measure_g0.py:347` | yes |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/input-shaft-hobbed-v1.blend` | `export_study.py:50` (TOPOLOGY_SOURCE), `measure_g0.py:380` | yes |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/p001835-hobbed.glb` (approved hobbed shaft) | `classify_contacts.py:413`, `measure_g0.py:253` | yes |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/k000210-k000211-moved.glb` (moved supports) | `classify_contacts.py:416`, `measure_g0.py:266` | yes |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/p000725-modified.glb` (housing) | `classify_contacts.py:416`, `measure_g0.py:267` | yes |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/p001835-source-extract.glb` | `measure_g0.py:179-185`, SHA-256 pinned `3903bcae3570e3cc9b225989a6fb2ebd8ec80e1298ac77c0250f50103a13fb47` (both copies equal) | yes |
| `C:/Projects/CAD/RL300-SAFE/optimized/jgun-full.glb` → shipped as `public/models/Default.glb` | `scripts/sync-assets.ps1` | yes |
| `C:/Projects/CAD/RL300-SAFE/msp-enclosure-draco.glb` (Blender glTF I/O v5.1.19 + Draco) → `public/models/msp-enclosure.glb` | `scripts/sync-assets.ps1` header | yes |
| `C:/Projects/CAD/m249.glb` → `public/models/m249-transformed.glb` (committed, never bare `gltfjsx --transform`) | `scripts/sync-assets.ps1` header, AGENTS.md hard rule | yes |

Toolchain: Blender 5.1 at `C:/Program Files/Blender Foundation/Blender 5.1/blender.exe` (verified; the version used by the manufacturing scripts and the manufacturing-core exporter).

### Runtime GLBs / page assets with version hashes

Recorded in the Stage 0 readiness ledger (`project/work/evidence/torque-wrench-rebuild/03-stage0-readiness/local-20261011-01a12c92/readiness.json` lines 453-460; `public/models` is clean in the current worktree, so these hashes remain the current bytes):

| Asset | SHA-256 |
| --- | --- |
| `public/models/Default.glb` | `8b07246cf857aca29d1832815d8d183e0a1fd8ef06da5a7a089019706a57a257` |
| `public/models/knurling-tool.glb` | `e5bff99439eb6655ea9eda3929fcca2f3e388b98c5742dcef95c371423c8fbd8` |
| `public/models/m249-transformed.glb` | `1c251f45b05b736a08858e47c53c8fa779870b636bb1a174d1422d8003305423` |
| `public/models/manufacturing-core-full.glb` | `17f90d73a8312bb9b91b3e4468ea3a598e046df0897714091243fed6722183be` |
| `public/models/manufacturing-core-lite.glb` | `b38b91fa4371a1f04c28214ed5d6aaf8d97ffedb3e099d8eadea691c09200e6f` |
| `public/models/msp-enclosure.glb` | `c1c919ab8f747e9e2bd9eeb51b5ac31ee66dc39145cac44ad7c8fddfa056428e` |
| `public/models/rl300-lite.glb` | `d4c0d9a70e45e5fa6c06ae38635336a2d03837c3cf3b3ce48a4aaab5da566ea4` |
| `public/models/role-map.json` | `8c2699ad2e01302aad3e553a22bafc21fbfbb8fa301b6160c39e03f10fad302a` |

- `manufacturing-core-full/lite.glb` provenance: `scripts/manufacturing/export_study.py` (derived "assembled study" from `input-shaft-assembly-parts-v1.blend` + `input-shaft-hobbed-v1.blend`; Blender 5.1; "not a replacement for Default.glb" per its frame intent).
- `knurling-tool.glb` upstream: verified tool GLB at `project/work/evidence/JG-035-opening-drafting-table/knurling-tool-2026-10-04/knurling-tool.glb` (exists; same SHA-256 as the runtime copy).
- Drawing data for the drafting chapter: `public/drawing/jgun-sheet-v2.bin.gz` + `public/drawing/jgun-sheet-v2.evidence.json` (status "verified", cacheVersion 8, containerVersion 3, generated 2026-10-08).

## 4. Existing offline inspection rasters (available, with provenance — no composition claim)

16 committed rasters: `public/inspection/shaft/{subject}-{desktop|narrow}.webp` for subjects `revised-blank`, `material-attempts`, `hobbed`, `cool-stress`, `cutter-exit`, `support-before`, `support-after`, `assembled-finale` (P001835 shaft story; capture times 8.4–42.5 s recorded in the manifest below).

Provenance chain (all in `project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/static-shaft-2026-10-06/`):

- `raster-manifest.json` — hashes for all 16 WEBPs and 16 source PNGs; 2×8 target grid (desktop+narrow × 8 times); audit confirmed 0 mismatches.
- `completed-render-capture/` + `capture-completed-renders.mjs` — Playwright capture from a dev-server runtime render on 2026-10-06 (17:59:11–17:59:38Z), camera drift 0 per shot; `encode-stills.py` encodes to public WEBP.
- `final-provenance/static-shaft-final-provenance-audit.md` — independent CPU render-state equivalence verdict after the contact-linked kinematics correction; CPU equivalence only, not a rendered-execution claim. Disclosed gap: the four CAD GLBs have no capture-time hash ledger; only filesystem timestamps prove they were unchanged.

**Non-claim:** these are renders of the pre-rebuild inspection scene captured from the live runtime, not offline Blender renders, and they were not composed for the five-chapter JG-038 framing. They may serve as provenance-documented reference for the `inspection` chapter still. Nothing existing is claimed to satisfy the updated compositions.

## 5. Proposed future art outputs (exact names, not yet produced)

Under `public/torque-wrench/posters/`, one desktop + one narrow raster per chapter plus background; root-relative src; PNG/WEBP allowed by the shared validator (WEBP proposed to match the inspection convention). Each lands in `torquePosterMap` as `status: 'final'` with complete provenance.

| File | Frame / proposed pixels |
| --- | --- |
| `drafting-desktop.webp` / `drafting-narrow.webp` | 1440×900 / 390×844 CSS |
| `breakthrough-desktop.webp` / `breakthrough-narrow.webp` | 1440×900 / 390×844 |
| `mechanism-desktop.webp` / `mechanism-narrow.webp` | 1440×900 / 390×844 |
| `inspection-desktop.webp` / `inspection-narrow.webp` | 1440×900 / 390×844 |
| `close-desktop.webp` / `close-narrow.webp` | 1440×900 / 390×844 |
| `background-desktop.webp` / `background-narrow.webp` | 1440×900 / 390×844 |

Per-still provenance required by `validatePosterMap` for `final` art (`src/shared/poster.ts`): `origin: 'offline-render'`, non-empty `sourceScene`, non-empty `settings`, non-empty `assetVersions`. Per plan13 Stage 6, also record output dimensions and the beat/chapter + alt mapping. Recommended `settings` content: Blender version, derived scene file path + SHA-256, camera position/target/FOV, frame, samples/denoise, resolution, colorspace, encoder + quality. `assetVersions`: SHA-256 map of every consumed source (immutable scene, derived scene, GLBs, drawing data) captured in a render-time hash ledger — the ledger the previous capture lacked (audit disclosure 2).

## 6. Remaining geometry/composition prerequisites before any render

1. Beat inventory: `beats.ts` / `beatTimeline.ts` and final camera/scene mapping per chapter (Stage 2); Stage 6 exit requires the completed beat inventory for final mappings.
2. Mechanism + cutter bullet-time choreography and pit geometry (Stage 3 compatibility work: extracted rig/drawing/pit primitives; G3).
3. Background layer design/implementation (`BackgroundDirector.ts`, `backgroundLayers.ts`, Stage 4/G6) — the background still cannot be composed before the layer system exists.
4. Derived offline render scenes do not exist yet; they must be built from the immutable sources above only after parent-stage readiness, without saving over any source.
5. No dedicated offline still-render skill exists; the procedure (settings/hash/provenance discipline, desktop/narrow art provenance) is defined by plan13's amendment row and this manifest, with no mesh-generation or cloud media substitutes.
6. Representative compositions must settle before asset production runs independently (Stage 6 entry note); owner aesthetic review is deferred and not blocked now.
7. WebGL-failure/reduced-motion path checks (zero narrative CAD/canvas) apply after art lands (G7); static cold-load evidence cannot retroactively zero earlier CAD downloads.

## 7. Boundaries honored

Reads only outside this file; no tests, builds, servers, browser or GPU runs; no config change; no Git staging/commit/push; no child agents or chat messaging; no publication scope; protected sibling checkout untouched; `.scratch/` and other sessions' dirty/untracked files preserved.
