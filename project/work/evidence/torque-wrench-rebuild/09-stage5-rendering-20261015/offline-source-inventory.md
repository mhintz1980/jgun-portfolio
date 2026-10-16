# JG-038 Stage 5 — offline immutable-source inventory

**Work ID:** JG-038 (torque-wrench rebuild), Stage 5 lane "Offline source inventory"
(see [wave-ledger.md](wave-ledger.md)).
**Date:** 2026-10-15 (America/New_York).
**Workspace:** `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch
`torque-wrench/rebuild`, HEAD `315052e1ff7f309770e47647a7606ae95d161a2f`.
**Status:** Offline, read-only inventory. No render, no Blender GUI/CLI execution, no GPU,
no browser, no build, no scene or source edit, no Git delivery, no deployment/cutover/archive,
no owner acceptance. Sole write: this file. Protected sibling
`C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` was not read or used. Final art waits for
settled Stage 5 compositions.

**Authority read:** AGENTS.md; [13-implementation-plan.md](../../../../docs/torque-wrench-rebuild/13-implementation-plan.md)
§Stage 5 / §Stage 6 and the 2026-10-12 skill-activation amendment ("no dedicated
still-render/provenance skill was found; do not use mesh-generation or cloud media skills;
preserve immutable source scenes, record settings/assets/hashes and desktop/narrow art
provenance"); [18-stage0-verification-contract-proposal.md](../../../../docs/torque-wrench-rebuild/18-stage0-verification-contract-proposal.md)
(poster/reduced-motion cases, static-cold-load evidence rules);
[poster-production-manifest.md](../../../../docs/torque-wrench-rebuild/parallel-prep/poster-production-manifest.md)
(2026-10-12 preparation record — this file supersedes nothing in it and adds verified hash/size
identity); [wave-ledger.md](wave-ledger.md) and [world-contract.md](world-contract.md)
(Stage 5 interface revision S5-1); `cad-scene-graph-rigging` SKILL.md (D1-AP part-number role
table, rear-extraction offsets, PBR role materials) before any mechanical interpretation.

## 1. Method

Repo-first: `rg` over `docs/`, `scripts/`, `project/`, `README.md`, `TODO.md`, `AGENTS.md`
for `.blend` / `C:/Projects/CAD` / poster references, then narrow inspection of only the named
source directories plus a shallow `C:/Projects/CAD` top-level listing. Every path below was
`Test-Path`-confirmed and hashed this session with `Get-FileHash -Algorithm SHA-256`; sizes are
byte counts from `Get-Item`. Blender CLI availability was verified with `--version` only.
Nothing under `C:/Projects/CAD` was written, opened for edit, or executed.

Cross-check: the measured SHA-256 of
`C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/input-shaft-assembly-parts-v1.blend` equals the
`SOURCE_HASH` literal at `scripts/manufacturing/export_study.py:43`, and the measured hash of
`shifted/p001835-source-extract.glb` equals the value pinned by `measure_g0.py` /
poster-production-manifest. Both were independently re-measured here, not copied.

## 2. Immutable source candidates (verified 2026-10-15)

### 2.1 Whole-wrench subject (mechanism / breakthrough / close)

| Path | Bytes | SHA-256 | Notes |
| --- | --- | --- | --- |
| `C:/Projects/CAD/RL300-SAFE/optimized/jgun-full.glb` | 10,671,700 | `8B07246CF857ACA29D1832815D8D183E0A1FD8EF06DA5A7A089019706A57A257` | **Strongest source candidate.** Byte-identical to the shipped `public/models/Default.glb` (hash matches exactly), i.e. the approved runtime hero asset. |
| `public/models/Default.glb` (in-repo) | 10,671,700 | `8B07246CF857ACA29D1832815D8D183E0A1FD8EF06DA5A7A089019706A57A257` | The actual runtime asset; importing this into a derived Blender scene needs no external path and keeps provenance in-repo. Same bytes as the row above. |
| `C:/Projects/CAD/JGUN.glb` | 213,553,380 | `34DFBC4B23CD13804B394221CB0C2718378D4C60F3F1D2D70134119A156D19DA` | Onshape Fine re-export named by `TODO.md:138` (10.95 M tris, 9 missing screws). Superset fidelity, **not shipped**, large. Optional higher-fidelity offline subject source only. |
| `C:/Projects/CAD/JGUN-1.glb` | 42,952,008 | `9C2F51D1C1B5B8248B4E5C41EDBE308C68D5956FF3E428F98C2CB778C053C8D0` | Fine+Draco rebuild basis for the current `Default.glb` (`TODO.md:141`). |
| `C:/Projects/CAD/Default.glb` | 22,029,208 | `CF7E5623F3BBA46A23412DEC7C95C946D921FF6EE25045E922BF91D0949184AC` | Older CAD-root export (2026-08-20). Superseded; **not** the shipped bytes — do not use as the runtime-identity source. |

### 2.2 Per-part exports (isolation shots for mechanism / inspection)

`C:/Projects/CAD/pneumatic-torque-gun/` holds **352 `.glb` files** (no `.blend`), the Onshape
"Export unique parts as individual files" output for the torque gun. These give clean
single-part geometry without rig consolidation, useful for close-up mechanism and inspection
plates. Example verified row:

| Path | Bytes | SHA-256 | Notes |
| --- | --- | --- | --- |
| `C:/Projects/CAD/pneumatic-torque-gun/Default - K000004-1.glb` | 838,708 | `4E5EEC50AA0E631FA7929F0AD4C3189EE753485C371D5847BF4739F602BE736A` | K000004 rear thrust ring (its own rig unit; rest span z [−0.058, −0.051], ⌀58 × 7 mm). Member of the 352-file set; not individually hashed here. |

### 2.3 Input-shaft / hobbed-shaft sources (inspection chapter)

| Path | Bytes | SHA-256 | Notes |
| --- | --- | --- | --- |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/input-shaft-assembly-parts-v1.blend` | 6,485,113 | `88D1CE4AC7CA112ADCD370E77852CFB9977DFEC81B4BFCB61EE1872895574A89` | Owner-approved assembly-parts scene (`scripts/manufacturing/export_study.py:48`, `tool_clearance.py:42`, `measure_g0.py:347`); hash equals the script's pinned `SOURCE_HASH`. |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/input-shaft-hobbed-v1.blend` | 3,304,209 | `E359708111C31807DB3E3AA71F5DB950CA5A42D435E87AD1602B3D81FB04F2D7` | `TOPOLOGY_SOURCE` (`export_study.py:50`), `measure_g0.py:380`. |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/p001835-hobbed.glb` | 10,846,592 | `043C9628336589C9BA0FDAA9BAC1C7B240598A99DD449EB8DF3DA1A64EE9A428` | Approved hobbed shaft (`classify_contacts.py:413`, `measure_g0.py:253`). |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/p001835-source-extract.glb` | 8,627,448 | `3903BCAE3570E3CC9B225989A6FB2EBD8EC80E1298AC77C0250F50103A13FB47` | SHA-256 pinned in `measure_g0.py:179-185`; re-measured equal. |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/p000725-modified.glb` | 641,292 | `CC6EDFEFBE83E4A1AB0C55D98B80A93D588EF46DEBF4EC774D6881FC1660ABC4` | Approved 1st/2nd-stage housing (`classify_contacts.py:416`, `measure_g0.py:267`). |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/k000210-k000211-moved.glb` | 71,288 | `17569C9A52BF662B599774BA81E2F7DC0D84E2B805707AA8AD09FFF6ED454DC9` | Moved K000210 bearing + K000211 retaining ring. |
| `C:/Projects/CAD/jgun-input-shaft-hobbed/input-shaft-hobbed-v1.blend` | 3,400,370 | not hashed this session | Pre-shift sibling of the `shifted/` scene. Listed for completeness; the `shifted/` copies are the ones the repo scripts name. |

### 2.4 Knurling tool / ring switch

| Path | Bytes | SHA-256 | Notes |
| --- | --- | --- | --- |
| `C:/Projects/CAD/jgun-knurling-tool/knurling-tool-v1.blend` | 628,316 | `7B599CC1F87BA71C2BD83113529FFC3FA986259616C8049C3CA1AC7FD2CB230F` | Editable source scene for the paired knurling study (`build_knurling_tool.py`, `export_knurling_tool.py`, `verify_knurling_tool.py`). |
| `public/models/knurling-tool.glb` (in-repo) | 1,798,620 | `E5BFF99439EB6655EA9EDA3929FCCA2F3E388B98C5742DCEF95C371423C8FBD8` | Committed runtime prop; hash matches the 2026-10-04 verified asset packet. |

### 2.5 Drawing data (drafting chapter)

| Path | Bytes | SHA-256 | Notes |
| --- | --- | --- | --- |
| `public/drawing/jgun-sheet-v2.bin.gz` | 4,205,481 | `8D4A3D10EA75D7221AB510C4CD476FC762F74759E5F8FEE266284AD03FECAEC3` | Precomputed drawing container (cacheVersion 8, containerVersion 3, generated 2026-10-08). |
| `public/drawing/jgun-sheet-v2.evidence.json` | 4,728 | `3DE7C90FDF12BE636CB58A02DFC900E07D2A96419BA2BEB3C3DCF1A57B78B5EB` | `status: verified`, `exact: true`, `gzipBytes` 4,205,481 (matches the container above); 385,817 hard edges, 886,494 smooth edges, 226,783 segments, 254 texts. |

### 2.6 Existing offline inspection rasters (already produced, not poster art)

`public/inspection/shaft/` holds 16 committed WEBPs (`{subject}-{desktop|narrow}.webp` across
8 subjects). Provenance chain, verified present:
`project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/static-shaft-2026-10-06/`
— `raster-manifest.json` (24,198 B), `encode-stills.py`, `capture-completed-renders.mjs`,
16 desktop + 16 narrow raw PNGs, `final-provenance/`. These are the essential-inspection
story rasters, not the ordered-story posters; the manifest records the render-time hash ledger
gap (`assetVersions`) that a Stage 6 poster pass must close.

## 3. Blender CLI availability (verified)

| Path | Bytes | SHA-256 | `--version` |
| --- | --- | --- | --- |
| `C:/Program Files/Blender Foundation/Blender 5.1/blender.exe` | 108,686,296 | `B952B58CAFE44050AE016BDA94C91DE0968B028B1C7082A824D7087985619642` | `Blender 5.1.1`, build 2026-04-14 |
| `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe` | 113,022,936 | `F141A3C5754500E6F84361099A4CD53F0BB7662B6A0D2CFAAA8FBB63E92234A0` | `Blender 5.2.2 LTS`, build 2026-09-15 |

5.1 is the version pinned by this repo's manufacturing pipeline
(`scripts/manufacturing/tool_clearance.py:45`, `tool_clearance_meridian.py:46`;
`export_study.py` documents "Blender 5.1 Decimate vertex-group semantics"), so a Stage 6
renderer should record 5.1.1 unless an explicit version change is accepted. 5.2.2 LTS exists as
a fallback but is not the pinned version. Verified headless invocation pattern already used in
repo: `blender -b --factory-startup --python-exit-code 1 --python <script>`
(`scripts/manufacturing/classify_contacts.py:8`). No Blender process was launched for this
inventory beyond `--version`.

## 4. Chapter-by-chapter source readiness

Ordered story is `TORQUE_POSTER_CHAPTERS` in `src/scene/torque-wrench/posterMap.ts`
(`drafting`, `breakthrough`, `mechanism`, `inspection`, `close`), plus a background still.
`torquePosterMap` is still `[]` — no poster entry exists yet.

| Chapter | Subject source | Runtime-authored elements with no Blender source | Ready? |
| --- | --- | --- | --- |
| `drafting` | Drawing container `public/drawing/jgun-sheet-v2.bin.gz` + evidence JSON | The sheet is a procedural bake of the wrench (rubber-band edge extraction, hatching, 254 texts) — see `jgun-sheet-v2.evidence.json` | **Weakest link** — no CAD/Blender lineage; needs a parent/owner decision on the offline equivalent (derived line-style render, or approved reuse of the container's baked geometry) |
| `breakthrough` | `jgun-full.glb` / `Default.glb` | Paper sheet, vellum flex, shatter/fracture along the traced profile | Subject ready; paper/fracture must be re-authored in the derived scene |
| `mechanism` | `jgun-full.glb` + per-part `pneumatic-torque-gun/` GLBs for isolation | Explosion offsets and rig are code-owned (`cad-scene-graph-rigging` §5 ladder) | Ready; mechanically re-derivable from the documented ladder |
| `inspection` | `shifted/` shaft `.blend` pair + `p001835-hobbed.glb` + `knurling-tool-v1.blend`; 16 rasters already exist | Cutter bullet-time pacing | **Strongest** — the only chapter with a proven offline-art path |
| `close` | `jgun-full.glb` | Pit geometry, unified lightning, post profile | Subject ready; pit/lightning/post re-authored per settled Stage 5 compositions |
| background still | none (authored) | Entire layered background | **Blocked** — depends on `BackgroundDirector.ts` / `backgroundLayers.ts` and a settled post profile (wave-ledger S5-1) |

## 5. Missing prerequisites

1. **No whole-wrench Blender scene exists.** A full-depth census found 101 `.blend` files under
   `C:/Projects/CAD` — 74 in `RL300-SAFE`, 21 in `astra-engine-pump`, 3 in
   `jgun-input-shaft-hobbed`, 1 in `jgun-knurling-tool`, 2 `DD6-SAFE` — and none is a torque
   wrench assembly. The hero subject exists only as GLB. A derived render scene must be authored
   by importing `Default.glb` and saved as a **new** file; no source is modified.
2. **Derived offline render scenes do not exist yet** (poster-production-manifest §6.4). They may
   be planned under workspace `.scratch/` (gitignored, `.gitignore:15`); originals stay immutable
   and nothing under `C:/Projects/CAD` is written.
3. **Background still is unattachable.** The layer system and post profile are being built by the
   pure state/budget lane under interface revision S5-1; the background still cannot be composed
   until those samples and the gradient/dither parameters settle.
4. **Drafting chapter has no CAD-side source.** The drawing geometry is produced by the runtime
   bake, so an offline drafting plate either reproduces that bake in a derived scene or relies on
   an explicit decision to reuse the baked container. This is the single largest source gap and is
   flagged for parent/owner disposition rather than resolved here.
5. **Pit, paper/vellum, fracture and lightning are runtime-authored**; they have no Blender source
   and must be re-authored in a derived scene against settled compositions.
6. **Settled compositions and the completed beat inventory** are required before final mappings
   (plan13 Stage 6 exit note). Representative compositions precede asset production.
7. **Render-time hash ledger.** The earlier inspection-raster capture lacked the consolidated
   `assetVersions` ledger; a Stage 6 pass must record every consumed source hash at render time.

## 6. Framing, cropping, and provenance contract

- Frames (poster-production-manifest §1): desktop `1440×900 @ DPR1` → 2880×1800 master; narrow
  `390×844 @ DPR3` → 1170×2532 master. Narrow switch at
  `POSTER_NARROW_MEDIA = '(max-width: 600px)'` (`src/shared/poster.ts`).
- Per-still provenance for `status: 'final'` art (`validatePosterMap`): `origin: 'offline-render'`,
  non-empty `sourceScene`, `settings`, `assetVersions`. Record Blender version, derived scene
  path + SHA-256, camera position/target/FOV, frame, samples/denoise, resolution, colorspace,
  encoder + quality, output dimensions, and beat/chapter + alt mapping.
- **Runtime canvas PNGs are never poster art** (plan13 Stage 6; 13 §Acceptance). The existing
  runtime captures under `07-autonomous-2026-10-12/` and `08-stage4-opening-recovery/` are
  verification evidence in a separate artifact class and must not be promoted into
  `torquePosterMap` or `public/torque-wrench/posters/`.
- No AI-image generation and no synthetic mesh substitutes for any chapter, including a missing
  drafting source. A gap is reported as a gap.
- Target output location, once composition settles: `public/torque-wrench/posters/`
  (`{chapter}-{desktop|narrow}.webp`), one desktop + one narrow raster per chapter plus
  background; that directory does not exist yet.

## 7. Boundaries honored

Reads only: repo docs/scripts/tests, `public/` asset bytes, and named `C:/Projects/CAD`
directories. No `.blend` or `.glb` was opened for edit, no Blender render or GUI session ran,
no CLI render, no GPU/browser/build/server operation, no config change, no Git staging or
commit, no deployment/cutover/archive, no messaging, no child agents. Other sessions' dirty and
untracked work in this worktree was left untouched (`.scratch/` untracked scratch preserved).
The protected `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` checkout was never accessed.

This inventory closes no gate. It is not owner visual acceptance, not Stage 5 or Stage 6 exit,
and not authorization to render. Final art waits for settled Stage 5 compositions; heavy
scheduling remains parent-owned.

## 8. Drafting-chapter offline source export — contract and verified results

**Added 2026-10-15 (Stage 5 lane), at parent direction.** Parent decision: drafting offline art
derives from the actual procedural CPU source — the real `snapshotDrawing` → `makeDrawingLayout`
→ `composeSheet` chain over the immutable Fine GLB and the frozen fonts — not from invented
artwork and not from a runtime canvas. This section records the contract and the light
verification only; the parent serializes the actual export and render later.

### 8.1 Deliverable

New file, the only script written in this session: [export-torque-offline-source.mjs](../../../../scripts/export-torque-offline-source.mjs).
It is a read-only prototype with five modes: `contract`, `glb`, `container`, `svg`, `layout`.
It opens no GL context, decodes no mesh data, runs no Blender, rasterizes nothing, writes no
build output (esbuild runs with `write: false`, exactly as the existing
`scripts/check-b1b2-contract.mjs` precedent), and writes nothing at all unless `--out` is given.

### 8.2 The exact export path

| Step | Function | File:line | Signature | Purity |
| --- | --- | --- | --- | --- |
| 1 | `buildWrenchRig` | `src/scene/rig/nodeRoles.ts:191` | `buildWrenchRig(root: Object3D): WrenchRig` | CPU |
| 2 | `snapshotDrawing` | `src/scene/drawing/drawingGeometry.ts:202` | `snapshotDrawing(rig: WrenchRig): DrawingGeometry` | CPU |
| 3 | `makeDrawingLayout` | `src/scene/drawing/drawingGeometry.ts:322` | `makeDrawingLayout(aspect: number, bounds: Box3): DrawingLayout` | CPU |
| 4 | `buildEdgeSet` | `src/scene/drawing/sheet/edgeExtract.ts:48` | `buildEdgeSet(position: Float32Array): EdgeSet` | CPU |
| 5 | `depthField` | `src/scene/drawing/sheet/edgeExtract.ts:181` | private; `(gl, geometry, view, sink?) → {z, w, h}` | **GL** |
| 6 | `extractView` | `src/scene/drawing/sheet/edgeExtract.ts:344` | `extractView(gl, geometry, edges, view, sink?): ViewLines` | GL via step 5 |
| 7 | `composeSheet` | `src/scene/drawing/sheet/composeSheet.ts:130` | `composeSheet(gl, data, layout, sink?): ComposedSheet` | GL via step 6 |
| 8 | `exportDrawingPrecompute` | `src/scene/drawing/sheet/drawingCache.ts:126` | `(): Promise<DrawingPrecompute>` | CPU |
| 9 | `encodeDrawingPrecompute` | `src/scene/drawing/sheet/drawingCodec.ts:46` | `(asset): Uint8Array<ArrayBuffer>` | CPU |

Steps 1–4 and 8–9 already run CPU-only. Step 7 returns
`{ ink: InkBuilder, stats: Record<string, number>, marks: Record<string, [number, number]> }`;
the ink builder is a plain accumulator (`segs`, `fills`, `texts`) with no renderer coupling.

### 8.3 The single GL seam, and the interface shapes requested instead of inventing

`depthField` is the one and only GL dependency in the whole drafting pipeline. It is not a
picture of the model — it renders an orthographic depth buffer and reads it back so
`extractView` can decide visibility (hidden-line removal):

- camera: `OrthographicCamera(rect)` at z = 2, near 0.01, far 4;
- resolution: `view.resolution` samples per sheet metre (7000 for 1:1 views, 9000 for 1:2);
- size: `w = max(8, ceil(rect.w × resolution))`, `h = max(8, ceil(rect.h × resolution))`;
- encoding: linear sheet-plane z as 24-bit fixed point over [−0.5, 0.5] m packed into RGB,
  alpha = coverage.

Because it is a z buffer rather than a rendered image, a CPU orthographic rasterizer can
produce the identical buffer. The requested seams, in preference order:

1. `depthFieldCpu(geometry: BufferGeometry, view: ViewSpec): { z: Float32Array, w: number, h: number }`
2. `extractViewFromField(field, geometry, edges, view, sink?): ViewLines`
3. `composeSheetCpu(data: DrawingGeometry, layout: DrawingLayout, sink?): ComposedSheet`

Any one of these keeps `composeSheet` and everything downstream unchanged and introduces no
new design: the CPU field must reproduce the same coverage and visibility decision, so the
registered content is identical. This is reported as a shape request rather than implemented,
because it touches parent-owned extraction code.

### 8.4 The deterministic intermediate (no PNG, no canvas)

The intermediate already has a defined, shipped form: `DrawingPrecompute` / the JGD3 v3
container from `drawingCodec.ts` — `{ version, key, segs, fills, texts, marks, stats, profile }`
where `segs` is stride 9 (`x1 y1 x2 y2 halfWidth group key dur dash`), `fills` is stride 15
(three × `x y group key dur`), and every value is bit-exact f64. That is source geometry and ink
data, not a raster, so it satisfies the "not poster PNG" requirement directly.

### 8.5 Verification actually run (light only)

**Fine GLB is uncompressed — Draco decode is not needed.** `C:/Projects/CAD/JGUN.glb`
(213,553,380 B, SHA-256 `34DFBC4B…`) declares `extensionsUsed: ["PTC_onshape_metadata"]` and
`extensionsRequired: []`; no `KHR_draco_mesh_compression` string appears anywhere in its
12,963,908-byte JSON chunk. Chunks: JSON 12,963,908 + BIN 200,589,444. Header counts: 101
meshes, 10,674 primitives, 337 nodes, 36 materials, 0 images, 42,696 accessors. By contrast the
shipped `public/models/Default.glb` **requires** Draco (`extensionsRequired:
["KHR_draco_mesh_compression"]`, 101 meshes / 10,674 primitives / 345 nodes / 36 materials /
0 images). The parent's preference for the Fine uncompressed GLB is therefore measured, not
assumed.

**The JGD3 container decodes with the real codec.** `container` mode compiles the repository's
own `decodeDrawingPrecompute` (esbuild, in memory) and decodes
`public/drawing/jgun-sheet-v2.bin.gz` (4,205,481 B gz → 16,560,736 B container) with no GLB and
no renderer: 226,783 segments (stride 9), 21 fills (stride 15), 254 texts, 10,203 profile points,
every seg and fill finite, `key` `ab313a48…:non-indexed:89ba7702…`. Those counts match the
shipped `jgun-sheet-v2.evidence.json` exactly, so the decoded intermediate is the same content
the page draws.

**The container emits reproducible vector ink with real text.** `svg` mode emits the
full sheet as SVG in millimetres (800 × 500 viewBox, origin at sheet centre, +Y up): stroke
colour resolved from the real palette (`#15295a` ink, `#a3201c` red, `#24262a` graphite,
`#e2dac4` paper), per-segment stroke width from the stored half-width, and `data-group` /
`data-key` / `data-dur` carrying the runtime reveal timing. Geometry (segs, fills) is exact
by construction.

**Text correction, 2026-10-15 (parent review).** The first emitter wrote
`font-family="/fonts/…"` — a URL, not a binding — and faked horizontal scale with a
`textLength` heuristic that distorted the owner's handwriting. Both are removed. The three
frozen TTFs are now embedded as base64 `@font-face` rules, so the family resolves to the
shipped bytes instead of a URL or a monospace fallback, and no `textLength` or width heuristic
remains anywhere in the file (verified: 0 occurrences of that attribute). Horizontal scale and
rotation are emitted as real transforms, `translate(x y) rotate(deg) scale(sx 1)`, and
`letterSpacing` is converted from ems to millimetres through the authored font size. Every text
element carries an explicit `data-fidelity`: 218 of 254 are `exact`; the 36 that use
`maxWidth` and/or `lineHeight` need runtime layout that SVG cannot reproduce and are labelled
`unverified-wrapping`. Under `--no-embed-fonts` every element is labelled `unverified-font`
and the payload reports `exact: 0`. Owner annotations survive: 130 elements emit per-glyph
transforms in `AcFastReference` graphite (groups 16/17, the handwritten margin notes), for
example `INPUT SHAFT SUN GEAR — P001835`, `DETAIL B`, `SCALE 2:1`.

A full uncropped emit measured 227,086 lines / 34,655,619 characters, piped to a counter with
nothing written to disk and no rasterization.

**Frozen font provenance (SHA-256, read this session):**

| Font | Bytes | SHA-256 |
| --- | --- | --- |
| `public/fonts/BarlowCondensed-Medium.ttf` | 103,360 | `262bd143292ce479ee0cd09a42b47ab173fca8e9c6eb5ed0b5c8a845bc371d17` |
| `public/fonts/BarlowCondensed-SemiBold.ttf` | 109,428 | `7b619d14bc2327509a9ef32b0890f709626f7ecc9ff61191c2a4314c5499d2d9` |
| `public/fonts/AcFastReference.ttf` | 13,392 | `3bff43202631b0a68cfdd42061c10e863407654193ab4d60e4a20bb3b7ee9870` |

Desktop and narrow are crops of this one vector master (SVG `viewBox` / group subset on the
same 800 × 500 mm sheet), so cropping preserves text rather than resampling pixels.

**`--out` cannot touch sources or evidence.** After the same review the writer is restricted to a
NEW file strictly inside the workspace `.scratch/` directory (gitignored working space): a
resolved path outside it is refused, and the write uses exclusive create (`flag: 'wx'`) so an
existing file is never overwritten or truncated. Verified: an attempt to write
`src/scratch-leak.svg` was refused with no file created, and a second write to the same
`.scratch` path failed with `EEXIST` after the first succeeded. Nothing under `src/`,
`public/`, `docs/` or `project/work/evidence/` is writable by this script.

**Fracture and pit export reuse the same container.** `makeBreakthroughGeometry` and
`rasterTornOutline` (`breakthroughGeometry.ts:1057` / `:455`), `makePrivatePitGeometry`
(`PitGeometry.ts`) and `makePortalShaftGeometry` (`portalGeometry.ts:212`) are all CPU and all
consume the same `profile: number[][]` the container already carries (10,203 points here), so no
re-derivation is needed for those plates.

Reproduce with: `node scripts/export-torque-offline-source.mjs contract|glb|container|svg`
(`svg --limit N` previews without emitting the full sheet; `layout` additionally needs
`--bounds x0,y0,z0,x1,y1,z1` from the real `snapshotDrawing`).

### 8.6 Not done here, and open

- No GL depth field was produced, so the ink above comes from the existing JGD3 container baked
  from the current Medium asset (`Default.glb`, Draco-required), not yet regenerated from the
  uncompressed Fine `JGUN.glb`. Regeneration needs steps 1–7 with the CPU seam of §8.3.
- `layout` mode was not exercised against real bounds; it needs `--bounds` from a real
  `snapshotDrawing` run (this lane does no GLB decode).
- SVG `stroke-dasharray` for hidden/center/phantom styles is a documented approximation: the
  runtime dashes in-shader and exposes no metric constants, so those patterns need reconciling
  against the shader before final art.
- SVG text is not exact everywhere. Geometry is exact, and 218 of 254 strings render from the
  embedded frozen outlines, but the 36 strings carrying `maxWidth` and/or `lineHeight` are
  labelled `unverified-wrapping` and must not be treated as final. A final drafting plate should
  either resolve those through runtime layout or convert the text to outlines with the embedded
  font metrics at render time.
- Final background, composition and render still wait for Stage 5 settlement. No poster PNG,
  no AI artwork and no synthetic substitute was produced, and none is authorised by this record.

### 8.7 Real-render glyph and dash fidelity checks (design, 2026-10-15)

**Added 2026-10-15 (Stage 5 lane C), at parent direction.** Sections 8.5/8.6 leave two classes
UNREVIEWED: real-render glyph placement and dash fidelity. This subsection designs both checks
against what the runtime actually draws. Session writes: this subsection (append-only) and
`.scratch/jg038-drafting-fidelity-check.mjs` (gitignored, never committed). No raster, GL,
browser, build, server or Blender was run; the only executions were `node --check` on the
helper and read-only node one-shots over `public/drawing/jgun-sheet-v2.bin.gz`.

Both checks target one runtime chain: container -> fail-closed decode (`drawingCodec.ts:89-141`,
every number finite) -> `installDrawingPrecompute` copies segs/fills/texts verbatim into an
InkBuilder (`drawingCache.ts:170-174`) -> lines packed by `makeInkLines` (`sheetBake.ts:114`,
attributes `ink.ts:359-374`) and text by `makeSheetText` (`sheetBake.ts:120`). Every runtime
render input is therefore a pure function of container bytes plus documented defaults.

#### 8.7.1 Glyph fidelity check (container texts -> runtime Troika inputs -> SVG master)

Mapping actually performed by `makeSheetText` (all `sheetText.ts`): `text.text = item.text`
(:188); font from `SHEET_FONTS[weight ?? 'medium']` (:189, URLs at :19-23, frozen TTFs in 8.5);
`fontSize = item.size / 0.7` metres for print (:190; authored size is cap-height-ish,
`ink.ts:104`); handwriting instead `fontSize = item.size * 1000 / fontHeight` with per-char
`fontHeight` from `REFERENCE_GLYPHS` and a position compensation of rotated
`(fontMinX*scale.x*unit, fontMinY*unit)` (:203-220, metrics defined `referenceHandGlyphs.ts:1-9`);
`anchorX ?? 'left'` (:191); `anchorY`: handwriting/baseline -> `'top-baseline'`, else `?? 'middle'`
(:192); `letterSpacing ?? 0.02` em (:193); `lineHeight ?? 1.15` (:194); linearised colour from
`COLORS_LINEAR` (:30-34, :196) of the same hexes the lines use; `position.set(x, y)` (:200);
`rotation.z = item.rotation ?? 0` (:201); `scale.x = item.scaleX ?? 1` (:202). Handwriting items
are per-glyph records with explicit `letterSpacing: 0`, left/baseline anchors and per-letter
scale/rotation (`ownerAnnotations.ts:107-110`, authored by `handwriting.ts:266-272`).

Equality classes:

- **Bit-exact, provable offline.** Container decode (segs/fills/profile are raw f64 LE with a
  finiteness scan; texts ride the sidecar JSON whose shortest-round-trip stringify/parse is
  identity for finite doubles - `drawingCodec.ts:63`, `:117-139`) and the pure mapping above.
  The helper recomputes expected inputs from the container and needs no render for them.
- **Layout-derived, measured at a real render.** Troika's own advances/breaks surface only via
  `textRenderInfo` block/visible bounds (`sheetText.ts:247-279`), exposed today as
  `window.__drawingProof.captureTextBounds()` (`DrawingLinework.tsx:482`; harness support in
  `scripts/verify-jgun-opening.mjs:344` and `:441`). Fit-cell containment uses a 1e-6 m
  epsilon there (:265-270).
- **Class consistency with the exporter's labels.** Recomputed from the container this session:
  254 texts = 218 `exact` + 36 `unverified-wrapping` (maxWidth/lineHeight set by
  `fitTitleText`, `composeSheet.ts:774-788`), matching 8.5. `unverified-font` exists only
  under `--no-embed-fonts` (exporter :547-551). The helper recomputes the census rather than
  trusting the label, so a regenerated container cannot drift silently.

Concrete probes and thresholds:

1. **Em-size** (deterministic): expected em in mm = `(size/0.7)*1000` print,
   `(size*1000/fontHeight)*1000` handwriting; the SVG `font-size` attribute (mm) must equal it
   within 2%. Predicted from code: the current master emits `size*1000` (exporter :528), i.e.
   0.70x the runtime em for print and ~0.668-0.693x per handwriting char - a systematic FAIL
   the check measures; rescaling the emitter is a parent decision, not made here.
2. **Letter-spacing**: expected `(letterSpacing ?? 0.02) * em` mm; the master omits the
   attribute when the container omits the field (exporter :538) while the runtime defaults to
   0.02 em - measured census: 39 of 254 texts diverge today. Threshold `|delta| <= max(0.005 mm, 2%)`.
3. **Placement** (real render): per-text ink AABB from the runtime canvas vs the same AABB
   from the SVG master raster, both in homography-normalised sheet mm (8.7.3): centre <= 0.10 mm
   and size ratio 1.00 +/- 3% for `exact`; NO placement gate for `unverified-wrapping` (its
   only truth is runtime layout, via captureTextBounds containment). Handwriting additionally
   predicts the per-glyph TTF compensation offset (:215-219) that the master does not
   reproduce; expected centre deltas of that magnitude are listed per glyph, not hidden.
4. **Colour** (real render): modal interior pixel vs `#15295a` / `#a3201c` / `#24262a`
   (`drawingGeometry.ts:44`, `ink.ts:45`, `ink.ts:52`) within +/- 6 per 8-bit channel, with the
   lamp state recorded: text multiplies `0.14 + 0.86*uLampPower` (`sheetText.ts:166`) while
   lines use the uniform colours directly (`ink.ts:335`, uniforms `ink.ts:247-249`), so the
   pure-hex expectation requires a pinned full-lamp state.

#### 8.7.2 Dash fidelity check (segs slot 8 -> in-shader dashes -> SVG approximation)

Decode: `dash = style + 10*pen` with JS/shader-twin decoders (`ink.ts:86-96`, shader
`ink.ts:292`). Runtime consumption: instance attribute `aDash` (`ink.ts:361-374`) -> varyings
`vPen`/`vDash` (`ink.ts:292`) -> fragment on/off windows (`ink.ts:323-330`) and pen colour
pick (`ink.ts:335`). Phase semantics: `m = along*(len + 2*hwEff) - hwEff` (`ink.ts:291`), so
the phase origin is the segment's visible start point; every `path()` piece is its own seg so
phase restarts per piece (`ink.ts:137-149`), while PAPER_FLEX_STEP splitting in `makeInkLines`
keeps `m` continuous within one seg (`ink.ts:346-351`); `hwEff = max(halfWidth, 0.5/px)`
interacts only through that offset and the sub-pixel coverage fade `vCov` (`ink.ts:284-287`,
`ink.ts:322`). The SVG `<line>` per seg with dasharray starting ON at the seg start matches
this phase convention; its values are the documented approximation (exporter :442-449, applied
:498-503) with stroke-width = halfWidth*2000 mm (:501).

Expected run tables (mm) decoded from the shader constants: hidden period 4.5, runs 3.0/1.5;
center period 22.5, runs 15.0/2.5/2.0/3.0; phantom period 30.0, runs 18.0/2.0/2.0/3.0/2.0/3.0.
SVG approximation: hidden 6/3, center 12/3/3/3, phantom 12/3/3/3/3/3. Measured distribution in
this container (helper audit, zero illegal values): solid 226,184; phantom 208; red 194;
graphite 188; center 9; hidden 0 (style exists in code but is unexercised by this asset).
Predicted deltas: hidden first run 3.0 vs 6.0 mm (equal 66.7% duty), center 15.0 vs 12.0 mm
(duty 75.6% vs 71.4%), phantom 18.0 vs 12.0 mm (duty 73.3% vs 66.7%).

Pass/fail: runtime canvas run-lengths vs the shader table `|delta| <= 0.15 mm` per run and
`<= 0.30 mm` cumulative phase drift over the sampled length; SVG master vs runtime
`|delta| <= max(0.3 mm, 10% of period)` per run AND duty-cycle delta <= 5 pp. Predicted from
code: all three dashed styles FAIL the SVG-vs-runtime gate as currently emitted (hidden fails
period 2x; phantom also fails duty by 6.7 pp) - this is the measured form of 8.6's
"documented approximation", reported rather than silently accepted; regenerating the emitter
table from the shader constants is a parent disposition. Stroke width is probed at
`|svg - halfWidth*2000| <= 0.001 mm`. Segs rendered under 2 px are excluded from run
extraction (vCov fades them); the helper's sample list records halfWidthMM per candidate.

#### 8.7.3 Runnable-later procedure (parent-owned; nothing was executed for this design)

Inputs: the container (sha256 `8d4a3d10...fecaec3`, matches 2.5), the helper
`.scratch/jg038-drafting-fidelity-check.mjs`, an SVG master written by
`node scripts/export-torque-offline-source.mjs svg --out .scratch/<master>.svg` (wx,
scratch-only), a dev server on :5199 (`--url=http://localhost:5199`; vite refuses 127.0.0.1),
and the existing proof hooks (`window.__drawingProof`, `window.__telemetry`,
`window.__sheetStats`).

Offline step (any time, no window): `node .scratch/jg038-drafting-fidelity-check.mjs --svg
.scratch/<master>.svg --out .scratch/jg038-fidelity-audit.json`. Report shape: container
identity; dash combos, runtime/SVG run tables, predicted deltas and real-render sample segs;
text class census plus expected runtime em/letter-spacing/anchor/rotation/scale/position per
text; `svgCompare` failure list (exit 1 on any); a thresholds block. Without `--svg` it is the
expectation audit alone. `--out` is exclusive-create and refused outside `.scratch/` (verified
this session: an attempt to write `src/should-not-exist.json` was refused with no file
created; same guard as exporter :742-752).

Real-render step (in the parent's serialized window): (1) open `http://localhost:5199/` with
the default cache path so the runtime consumes the installed container; confirm
`window.__sheetStats.precomputed === 1` and `window.__telemetry.drawing.annotationsReady`.
(2) Pin the beat with `window.__drawingProof.scrollToProgress(...)` so the drafting groups are
revealed; record the camera pose from telemetry. (3) Glyph evidence:
`captureTextBounds()` for runtime bounds + fit-cell containment; a screenshot at the pinned
beat, paper-quad corner detection on PAPER `#e2dac4`, a 4-point homography onto the
800x500 mm sheet, resampled at 1 mm/px, yielding per-text ink AABBs, per-class dash runs along
the helper's sampled segs (>= 3 periods, >= 2 px stroke) and modal interior colours from
`dash.colourProbeSamples`. (4) Compare per 8.7.1/8.7.2 thresholds: AABBs vs captureTextBounds
(self-consistency) and vs the SVG master raster through the same homography; dash runs vs
`dash.runtimeRunsMM` and vs the SVG raster; colours at the pinned lamp. (5) Record every
consumed hash (container, fonts, SVG master) in the evidence folder; the outputs are
verification evidence only and never poster art (section 6). If the window is the rebuild's
private-sheet chapter instead of the intro sheet, the same container->runtime chain applies
(`privateSheetRuntime.ts:370` mounts the same baked text layer) but no text-bounds hook exists
there today: the homography path still works, and a bounds-level text proof there would need a
parent-owned hook. This lane adds no hooks.

#### 8.7.4 What stays unverified until a real render exists

- Runtime glyph positions and advances (troika layout), and the actual line breaks of the 36
  `unverified-wrapping` texts - no offline substitute exists.
- All dash run-lengths in real pixels (the shader table is code truth; pixels are render
  truth), including halfWidth/coverage interaction at the render's effective px scale.
- Real pen/glyph colours after the lamp pipeline and paper interaction at a pinned state.
- Every code-predicted delta above (0.7x em ratio, 39 default-spacing texts, the three dash
  arrays, handwriting TTF compensation) until the 8.7.3 procedure runs and measures them.
- Everything 8.6 already lists as open (no Fine-GLB rebake, `layout` mode unexercised, final
  composition and render).
