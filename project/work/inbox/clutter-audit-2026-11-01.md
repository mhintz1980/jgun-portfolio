# Clutter audit — jgun-torque-wrench (accumulated development clutter and obsolete code)

Date: 2026-11-01
Status: Read-only audit. Nothing in the repository was modified, installed, executed, or deleted during the audit. The only files this document added are itself and the raw Knip outputs in [`clutter-audit-2026-11-01/`](clutter-audit-2026-11-01/). All removals/changes described here are proposals awaiting owner approval.
Prepared by: ZCode orchestrator session (5 parallel read-only audit lanes + Knip 6.44.1, two passes) for Mark Hintz.
Scope: this worktree only (`C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`, branch `torque-wrench/rebuild` at `723035b5`). Sibling checkouts `jgun-portfolio` / `jgun-quiet-machine` not audited. The `.git` file here is a worktree pointer into the `jgun-portfolio` checkout, so git object storage was not measurable here.

## 1. Method and evidence base

- **Package manager:** npm (`package-lock.json`). 30 modified + 15 untracked paths were present in the working tree at audit time and were preserved untouched.
- **Disk/size:** `du -sb` per directory, `find` counts, files >3 MB enumerated (579 files, 10.2 GB, excluding `node_modules`/`.git`).
- **Duplicates:** md5 over 8,831 asset files ≥4 KB under `public/ src/ docs/ project/ scripts/` + root → 6,313 unique hashes, **919 duplicate groups wasting 998,532,140 B**. `.scratch/` (1.7 GB) was enumerated but not hashed.
- **Reachability:** BFS import closure from the real build inputs plus basename grep across `src/ scripts/ tests/ configs/` (208 non-test + 115 test src files); dynamic `import()`/`React.lazy` checked by hand.
- **Knip 6.44.1** (`npx -y knip@latest`, cache only — not added to the repo): pass 1 default auto-detection; pass 2 with a tuned temp config (raw outputs + the exact config in [`clutter-audit-2026-11-01/`](clutter-audit-2026-11-01/)). Both passes exit 0. Reproduce pass 2 from repo root with:
  `npx -y knip@latest --no-progress --no-exit-code --config project/work/inbox/clutter-audit-2026-11-01/knip.config.json`
- **Not done:** no builds/tests/verifiers were executed (read-only mandate); no `.env`/secret content read; runtime telemetry claims none.

## 2. Active application map (measured, not inferred from filenames)

Vite **MPA**, no router; `build.rollupOptions.input` derives from the `PAGES` registry in `src/shared/pages.ts`:

| Route | Entry | Live tree |
|---|---|---|
| `/` | `index.html` | redirect-only shell → `/torque-wrench/`, or `/quiet-machine/` with `?study=rl300`; no module script (`src/shared/pageTopology.test.ts:123-126` asserts `src/main` is absent) |
| `/torque-wrench/` | `torque-wrench/index.html` → `src/torque-wrench-main.tsx` | `TorqueWrenchPage` → hero, `.torque-stage` (lazy `Scene` via `cadGate.ts:23`) or Poster, `Story` (5 DOM chapters); scroll: `ScrollConductor` (GSAP + ScrollTrigger + Lenis), 44.1 viewports, beats in `beats.ts` |
| `/quiet-machine/` | `quiet-machine/index.html` → `src/quiet-machine-main.tsx` | `QuietMachinePreview` → poster `<img>` beats or lazy `QuietMachineScene` (R3F, `frameloop="demand"`); native scroll |
| `/lifecycle-census.html` | `lifecycle-census.html` → `src/torque-wrench-lifecycle-census-main.tsx` | dev-only JG-038 diagnostic harness, deliberately outside `PAGES`; used by `scripts/verify-torque-lifecycle-census.mjs` — **KEEP** |

Active runtime assets are small and all self-contained GLB (zero external-URI assets): 8 models in `public/models/` (incl. legacy-reserved `m249-transformed.glb`; `pages.ts:32-33` documents M249 as *"out of the registry until it is ready to ship"*), `public/drawing/jgun-sheet-v2.bin.gz`, vendored `public/draco/` (runtime string-path loads — a known Knip false positive), 4 fonts, 36 webp posters, og-image/favicon. 7 npm scripts; Vitest inline in `vite.config.ts`; Playwright `tests/e2e` (1 spec).

## 3. Disk-usage breakdown (~22.3 GB, ~51.8k files)

| Area | Size | Files | Notes |
|---|---|---|---|
| `output/` | **14.0 GB** | 24,369 | gitignored Playwright verify telemetry (`output/playwright` ≈ 13 GB; largest `report.json` 497.1 MB; 5.77 GB PNGs; 916 MB webm) |
| `project/work` | **6.6 GB** | 17,366 | 8,934 images = 4.09 GB + 107 videos = 291 MB; mostly gitignored evidence PNGs (machine-local) |
| `.scratch/` | **1.7 GB** | 4,282 | gitignored; 48+ dated jg038 experiment dirs, 322 GLB snapshot copies, 149 font mirrors |
| `node_modules/` | 309 MB | — | standard, 151 packages |
| `docs/` | 188 MB | 312 | 131 images = 167 MB — owner reference media, tracked → KEEP |
| `dist/` | 26 MB | 73 | gitignored, stale Vite export |
| `public/` | 25 MB | 61 | actual runtime payload (models 17.9 MB) |
| `src/` | 4.3 MB | 324 | application source |
| `scripts/` | 2.5 MB | 112 | verifiers/captures/lib |
| `build/`, `tests/`, `quiet-machine/`, `torque-wrench/` | <15 KB | 4 | `build/excludePublicAssets.ts` is tracked plugin **source**; the two dirs' `index.html` are live MPA entries |
| `.wrangler/` | 0 | 0 | empty tmp only |

No `.vite`/coverage/tsbuildinfo/test-results/playwright-report caches; no test snapshot/fixture dirs; one design asset (0.6 MB `.blend` in evidence). **The real maintained project is ~60 MB; 99.7% of disk is generated telemetry, evidence captures, and scratch.**

## 4. Ranked cleanup opportunities

1. **`output/` telemetry retention** — 14 GB, 62% of the repo, gitignored and reproducible. A keep-N-days policy reclaims ~13 GB with zero git impact.
2. **`.scratch/` archive policy** — 1.7 GB untracked experiment snapshots; archive (not delete) entries older than ~2 weeks. Some items are still referenced (e.g., the render-capture recipe's 9-frame set).
3. **Evidence internal duplicates** — 919 md5-identical groups, ~999 MB, mostly identical-frame PNGs inside capture sets (e.g., 36 identical PNGs in one dir, 11 × identical 1.6 MB shots). Review-gated: these are evidence sets; propose contact sheets before any dedupe.
4. **Legacy app chain ruling** — `src/main.tsx` + `src/App.tsx` + ~58 files unreachable from any build input. Bytes trivial (~1–2 MB); cost is maintenance and agent confusion. Owner architecture decision — see §6.
5. **Exact-duplicate small wins (~30 MB)** — gitignored copies of tracked/runtime files (concept media, GLBs).
6. **Tooling hygiene** — Knip adoption; `esbuild` unlisted at 22 call sites; `draco3d`/`bidi-js`/`file` unlisted; 1 stale e2e spec.

## 5. Candidate table

| Path | Category | Size | Evidence | Confidence | Verification |
|---|---|---|---|---|---|
| `output/` | **REGENERABLE** | 14.0 GB / 24,369 f | gitignored; verify-script telemetry; reproducible per `.gitignore` comment | high | confirm no pending owner review of 2026-10-26+ runs; delete → nothing breaks |
| `dist/` | **REGENERABLE** | 26 MB / 73 f | gitignored Vite export, stale (missing `m249-transformed.glb` vs public/) | high | rebuilt by `npm run build` at next deploy |
| `.wrangler/` | **REGENERABLE** | 0 | empty tmp | high | none |
| `project/.../concept-media` duplicates of `docs/torque-wrench-rebuild/references/2026-10-17-owner-corrections/` PNGs (3 groups) | **PROPOSE REMOVAL** (evidence-side copies) | ~23 MB | md5-identical to tracked docs copies | high | `git ls-files` confirms docs copy tracked; evidence copy ignored |
| `project/.../manufacturing-implementation-2026-10-05/assets/manufacturing-core-{full,lite}-v3.glb`, `project/.../knurling-tool-2026-10-04/knurling-tool.glb` | **PROPOSE REMOVAL** (evidence copies) | ~6.3 MB | byte-identical (md5) to live `public/models/` | high | runtime loads public/ only |
| `src/data/glb-manifests.json` | **PROPOSE REMOVAL** | ~KB | zero imports repo-wide; only *written* by `tests/e2e/dump-glb-manifests.spec.ts:121` (Knip can't adjudicate .json — manual finding) | med-high | grep (done); spec regenerates it |
| Tier A legacy files (26 — see §6) | **NEEDS REVIEW** (ruling-gated) | ~0.5 MB | Knip-verified unreachable from *everything* incl. tooling | high evidence | owner ruling first |
| Tier B legacy files (~30 — see §6) | **NEEDS REVIEW** (ruling-gated) | ~1 MB | unreachable from build inputs but statically referenced by verify scripts/tests; M249 block reserved by `pages.ts:32-33` | high evidence | owner ruling first |
| `src/main.tsx` + `src/App.tsx` | **NEEDS REVIEW** (entry pair) | ~5 KB | no HTML/module reference; asserted absent by `pageTopology.test.ts:123`; superseded by `*-main.tsx` | high | entangled with legacy ruling |
| `tests/e2e/dump-glb-manifests.spec.ts` | **NEEDS REVIEW** | 8 KB | navigates legacy `?debug=rig` route only dead `App.tsx` consumed | high | pair with legacy ruling |
| Historical `scripts/verify-jg0{27,28,31,32,33,36}*.mjs` + one-off capture/measure scripts | **NEEDS REVIEW** (archive candidates) | ~0.5 MB | per-task verifiers for completed/superseded tasks; cited in docs/GATES history | medium | archive to `project/archive/` with manifest |
| `paper-breakthrough-2026-10-01` webm pairs (named + `video/<md5>`) | **NEEDS REVIEW** | ~77 MB | 11 named-capture + md5-named byte-identical pairs | medium | confirm which filename evidence docs cite |
| `.scratch/` | **NEEDS REVIEW** | 1.7 GB / 4,282 f | untracked working scratch (never commit per AGENTS.md); still-referenced capture sets | medium | archive >2-week-old dirs; contact sheets |
| Identical-frame PNG groups in evidence (~897 groups) | **NEEDS REVIEW** | ~965 MB dedupe potential | md5-identical frames within capture sets; provenance of evidence folders | medium | contact sheets → owner review |
| `docs/` images (167 MB), evidence images (4.09 GB), `public/models/Default.glb` (10.7 MB) | **KEEP** | — | owner reference media / evidence / committed runtime model | high | none |
| `@higgsfield/client` dep | **KEEP** (flagged) | node_modules only | 1 ref: `scripts/higgsfield-example.ts` (HF MCP example; repo ships higgsfield skills) | medium | confirm HF workflow still used |
| `tailwindcss` devDep (Knip "unused") | **KEEP** | — | false positive — Knip cannot resolve `@import "tailwindcss"` in CSS (its own config hint admits this) | high | none |
| 152 unused exports + 55 unused types (Knip) | **KEEP** — defer | 0 | contract-pinned knobs/DI types; trimming is churn for no bytes; revisit after knip.json lands | low | later knip pass |
| `esbuild` | **ADD** (hygiene) | — | unlisted import at 22 `scripts/*.mjs` sites; works only via Vite's transitive hoist | high | `npm i -D esbuild` in approved pass |
| `draco3d` (3 sites), `bidi-js` (1 test), `file` (2 b1b2 scripts) | **NEEDS REVIEW** | — | unlisted imports (transitives of three/troika, or unknown origin for `file`) | medium | quick import-site check |

## 6. Legacy chain — superseded vs unreachable (Knip-verified split)

The legacy root app (`src/main.tsx` → `src/App.tsx`) is orphaned from the MPA build inputs and superseded by `torque-wrench-main.tsx` / `quiet-machine-main.tsx`. Deleting it is an **owner ruling, not routine cleanup**, because tests, ~90 verify scripts, and the M249 reservation reference parts of it. Knip's tuned pass splits it precisely:

**Tier A — 26 files unreachable from *everything*, including tooling** (strongest archive candidates):

```
src/components/BootSequence.tsx          src/components/IntroTitles.tsx
src/components/RingInspection.tsx        src/components/ToleranceStations.tsx
src/components/canvas/CameraSplineStudio.tsx
src/components/canvas/ProductStage.tsx
src/scene/backgrounds/backdropConfig.ts  src/scene/backgrounds/BackdropRig.tsx
src/scene/backgrounds/layers/BackdropGradientLayer.tsx
src/scene/backgrounds/layers/BackdropGridLayer.tsx
src/scene/backgrounds/layers/types.ts    src/scene/CameraRig.tsx
src/scene/cinematic/CinematicRigRoute.tsx  src/scene/cinematic/rigRequest.ts
src/scene/drawing/DrawingProofRenderer.tsx
src/scene/inspection/InspectionScene.tsx
src/scene/PostProcessingComposer.tsx     src/scene/SceneCanvas.tsx
src/scene/scrollCommit.ts                src/scene/ScrollRig.tsx
src/scene/SpatialRig.tsx                 src/scene/TorqueWrenchHero.tsx
src/scene/stations/stationData.ts        src/scene/stations/StationDriver.tsx
src/scene/stations/stationStore.ts       src/utils/lenisGsapBridge.ts
```

**Tier B — unreachable from build inputs but still statically referenced by verify scripts/tests** (~30 further files, e.g. `components/{Chapters,TechnicalHUD,StaticPoster,ShaftStoryLayer+css,AuthorshipNotes,GdtSymbols}`, `scene/stages/*` incl. the reserved M249 block, `scene/SpatialWorld`, `scene/Hotspots`, `state/{scrollStore,qualityStore,inspectionStore}`, `shaders/CadTransitionShader`, `utils/glbSceneAuditor`, `data/caseStudies`, `scene/rig/*` shared modules that live code still imports).

Knip false positives documented, not actioned: `tailwindcss` (CSS `@import` unresolvable), `public/draco/*.js` (runtime string-path loads), ~150 evidence-folder scripts flagged "unused" (one-session evidence tools — matches the archive candidates above).

## 7. Totals

| Bucket | Amount |
|---|---|
| Regenerable (`output/`, `dist/`, `.wrangler/`) | **~14.1 GB** |
| Strongly supported removal candidates | **~30 MB** (gitignored duplicates of tracked/runtime originals, `glb-manifests.json`) — the safe strong set is small; bulk is regenerable or review-gated |
| Uncertain / needs review | **~2.7 GB** (`.scratch/` 1.7 GB + evidence dup-PNG ~965 MB + webm pairs 77 MB) + legacy-chain ruling (26 + ~30 files) |

## 8. Proposed small-batch execution plan (NOT started — for approval)

- **Batch 0 — baseline:** record verification state before touching anything: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:station2`, `node --test scripts/*.node-test.mjs`, plus a `git status` snapshot. Preview smoke on :4173 after every src/public-affecting batch (restart server after each rebuild — stale-server rule).
- **Batch 1 — regenerable:** delete `output/` runs outside a retention window (propose: keep 14 days + anything cited in recent evidence docs), then `dist/`, `.wrangler/`. Zero git impact.
- **Batch 2 — safe duplicates:** remove the ~30 MB of gitignored copies whose byte-identical tracked/runtime originals exist, with a manifest of original paths.
- **Batch 3 — backup + review set:** copy all NEEDS REVIEW files to an approved backup **outside the project** (proposed: `C:\Users\Markimus\.buzz\backups\jgun-torque-cleanup-2026-11-01\` with `MANIFEST.md`: original path + hash); generate HTML contact sheets (small read-only Node script, no new deps) into `.scratch/` for the evidence/.scratch image sets.
- **Batch 4 — ruling-gated tooling:** legacy-chain decision (archive-or-delete as its own task spec — must carry the ~90 verify-script references, tests, and M249 reservation with it); stale e2e spec; historical verify scripts; land committed `knip.json` (trimmed per Knip's own hints — vite/playwright/HTML entries auto-resolve) + `npm run knip` script; `npm i -D esbuild`; draco3d/bidi-js decisions.
- Constraints for every batch: no history rewrite; no permanent deletion of uncertain assets; manifest of original paths; re-run Batch 0 checks after each batch; browser/visual verification of both scenes after any `public/` or `src/` change.

## 9. Decisions requested

- **(a)** Adopt `knip.json` + npm `knip` script?
- **(b)** Generate contact sheets for `project/work/evidence` + `.scratch` image review?
- **(c)** Start Batch 1 (output/ retention deletion + dist/)?
- **(d)** Approve backup location for NEEDS REVIEW files?
- **(e)** Legacy chain ruling: archive / delete / keep-as-reference (Tier A vs B)?
- **(f)** Dependency additions: `esbuild` devDep now; `draco3d`/`bidi-js`/`file` after import-site check?

## 10. Verification status and limitations

**Verified:** all numbers come from direct measurement (`du`, `find`, md5 over 8,831 files) and BFS import-closure analysis; Knip ran twice cleanly (exit 0, 6.44.1); raw outputs preserved in [`clutter-audit-2026-11-01/`](clutter-audit-2026-11-01/).
**Not verified / out of scope:** `.git` object store (lives in the jgun-portfolio checkout); `.scratch/` content hashes; no builds/tests were run; no runtime/telemetry checks; nothing was deleted or modified. This audit makes no claims about visual or runtime behavior — per owner policy, telemetry and Mark's perceptual review govern any later change.

## Reviewer kickoff prompt (ready to paste)

> Read `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\inbox\clutter-audit-2026-11-01.md` — a read-only clutter audit of this repo dated 2026-11-01. Verify its claims before acting on any of them: reproduce the Knip pass with `npx -y knip@latest --no-progress --no-exit-code --config project/work/inbox/clutter-audit-2026-11-01/knip.config.json` from the repo root, spot-check sizes with `du -sh output/ project/ .scratch/ dist/`, spot-check duplicate groups with md5sum, and spot-check the legacy-chain claims against `src/shared/pageTopology.test.ts` and `src/shared/pages.ts`. Nothing in the audit has been executed or deleted; all removals await the owner decisions listed in its §9. Do not treat Knip's "unused file/export" output as deletion instructions — the audit's classification columns are the proposal. Report disagreements with evidence; do not modify the repo during review.
