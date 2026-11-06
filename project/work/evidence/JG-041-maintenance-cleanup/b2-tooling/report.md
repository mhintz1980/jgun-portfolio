# JG-041 B2 tooling evidence

Worktree baseline HEAD 0b284226. Existing unrelated TODO, index, plan and evidence changes were left intact. `package-baseline.json` records baseline root scripts and dependency declarations. Eight scripts were repaired; the root package has seven npm scripts. Playwright was already declared `^1.56.1` and lock resolved 1.56.1.

## Changes and dependency versions

Root package and lock: added exact devDependencies esbuild 0.28.2, draco3d 1.5.7, bidi-js 1.0.3; all were previously transitive at those same lockfile versions. No other lockfile changes. npm install created worktree-local node_modules, exit 0; npm audit confirms the baseline and current lockfiles both report the same five affected packages and five vulnerabilities (2 moderate, 3 high); audit commands exited 1 for findings. Baseline/current raw JSON is saved alongside this report. The lockfile diff contains only the three devDependency pins. `knip.json` models MPA, dev entries, source and tooling consumers plus Remotion's separate dependency boundary. The no-op public ignore was removed. Public assets referenced by runtime URL strings are outside the configured source project globs and are not assessed for use; no explicit Knip ignore is needed. CSS/JSON are included as project patterns, although Knip notes that some extensions have no registered compiler. Knip is static analysis, not an asset-reference audit. Remotion dependencies were not installed; all its source files are currently entries to preserve shared consumers, so Remotion is NOT analysed for unused files in this baseline. A Remotion-installed run with narrowed real entry points is deferred.

## Cache inventory and repair

Fresh pre-edit `rg -n -F npm-cache scripts` found exactly these eight operational defaults, all the same absolute `file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs`; root-level .mjs/.cjs/.ts/.tsx scan found none. Historical evidence is unchanged. The post-edit search is saved in `cache-search-after.txt` (no matches). Overrides are deliberate and remain optional.

| Script | Old form | New form | Override preserved |
|---|---|---|---|
| capture-b1b2-baseline.mjs | static cache import | static `playwright` import | N/A |
| capture-rl300-baseline.mjs | dynamic override or cache | override or `playwright` | Y |
| verify-b1b2-rebuild.mjs | static cache import | static `playwright` import | N/A |
| verify-b1b2-supplemental.mjs | dynamic override or cache | override or `playwright` | Y |
| verify-jg027-lcd-cluster.mjs | dynamic override or cache | override or `playwright` | Y |
| verify-jg028-handle-realism.mjs | dynamic override or cache | override or `playwright` | Y |
| verify-jg031-gear-rotation.mjs | dynamic override or cache | override or `playwright` | Y |
| verify-jg032-station2-thermal.mjs | dynamic override or cache | override or `playwright` | Y |

## Knip 6.44.1

Raw and configured outputs are saved adjacent to this report. Both commands used `--no-exit-code`, exited 0, and are diagnostic, not clean passes. Raw ran after install and script/dependency repair, before config; the first pre-install attempt exited 2 due to missing Vite/Playwright config dependencies and was replaced with the meaningful installed baseline. Configured output was refreshed after rebasing onto b466843e; the raw baseline remains from the earlier tree. The added logo render script accounts for the ffmpeg diagnostic. Counts by category:

| Rule | Raw | Configured |
|---|---:|---:|
| Unused files | 277 | 2 |
| Unused dependencies | 1 | 1 |
| Unlisted dependencies | 0 | 1 |
| Unlisted binaries | 0 | 3 |
| Unresolved imports | 0 | 1 |
| Unused exports | 210 | 159 |
| Unused exported types | 59 | 57 |
| Duplicate exports | 9 | 9 |
| Configuration hints | 1 | 3 |

The two unused-file leads are `src/main.tsx` and `src/scene/studiomark-logo/index.ts`; retain them for the B4 milestone, not action in B2. Other configured findings include Remotion fonts, three-stdlib and remotion/ffmpeg binaries. The unresolved `/src/scene/drawing/sheet/drawingCache.ts` import is a known Vite runtime-path false positive. These are leads requiring investigation, not deletion instructions. Knip hints flag CSS/JSON patterns; Knip does not prove string-referenced asset usage. Configured file count is not comparable as a deletion metric because root scripts and tests are explicitly retained entry consumers.

## Validation

Fresh raw output and exit codes are saved in `validation-typecheck.txt`, `validation-scripts.txt`, `validation-node-tests.txt`, and `validation-vitest.txt`. The ESM smoke resolves the common package specifier from the worktree, shared by all eight scripts; it does not import the campaign modules themselves.

- npm install --save-dev --save-exact esbuild@0.28.2 draco3d@1.5.7 bidi-js@1.0.3: exit 0; real worktree install.
- npx tsc --noEmit: exit 0.
- node --check each of eight scripts: all exit 0.
- ESM import resolution and chromium export smoke for each script's package specifier: exit 0; no script campaign run. An initial CommonJS-resolution-based smoke exited 1 because it selected the CommonJS entry without the expected named ESM export; corrected ESM resolution succeeded. All scripts live in the same scripts directory.
- node --test scripts/*.node-test.mjs: exit 0, five files, 36 tests passed.
- Targeted Vitest draco consumers v16Materials, supportProvenance, nodeRoles: exit 0, 22 tests passed; bidi sheetInkRuntime: exit 0, 8 tests passed. esbuild directly consumed by operational scripts, no source changes; no specific esbuild Vitest consumer identified.
- git diff --check on scoped tracked files: exit 0.

No Remotion install, browser campaigns, servers, source trimming, commits or deployment. Baseline Knip was captured before config but after repair/install because the initial no-node_modules run failed; this limits strict pre-change comparison. No framework package upgrades in the lock diff.
