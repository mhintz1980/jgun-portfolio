REVISE (1 blocking finding: legacy root entry `src/main.tsx` is suppressed in knip.json)

Reviewer: R2 (Anthropic seat), JG-041 B2. Worktree `codex/cleanup-2026-11-05`. Reviewed the actual artifacts, not the summary.

## Findings

| # | Severity | Evidence | Recommended fix |
|---|---|---|---|
| 1 | **BLOCKING** (config honesty; B2 brief and B4 dependency) | `knip.json` line 15 lists `"src/main.tsx"` as an entry. No MPA page uses it: `src/shared/pages.ts` has no such HTML entry, `index.html` is a redirect-only shell, and `src/shared/pageTopology.test.ts:126` asserts the root HTML does NOT contain `src/main.tsx`. It is the legacy root app (`App` + `index.css`). My re-run with only that entry removed (temp config in %TEMP%, repo untouched) reports `Unused files (2): src/main.tsx, src/scene/studiomark-logo/index.ts`. The "277 -> 1" headline therefore hides the legacy root entry, which the B2 brief says must not be suppressed and which B4 uses the baseline to find. | Remove `src/main.tsx` from `entry`, regenerate `knip-configured.txt`, and update the report to 277 -> 2 (the legacy entry appears as unused). |
| 2 | Medium | The remotion workspace `entry` is `src/**/*.{ts,tsx,...}` plus `scripts/**` and root files, so every file in it is an entry and Knip can never report an unused file there. `project` is `**/*`. That is a blanket entry rather than a boundary. It is also unvalidated: `remotion/node_modules` does not exist (Test-Path False). The report admits the missing install. | Narrow to real entries (`src/index.ts`, `remotion.config.ts`, `scripts/*.mjs`, tests), or state in the report that the workspace is not analysed until deps are installed. Deferring to the Remotion install follow-up is acceptable if disclosed. |
| 3 | Low | `"ignore": ["public/**"]` is a blanket glob. Knip reports it as a hint ("Remove from ignore"), so it has no effect. The brief asks for explicit string-path public-asset exceptions. The report presents it as a deliberate exception. | Delete it, or replace with named paths if any are really needed. |
| 4 | Low (evidence) | Typecheck, `node --check`, ESM smoke, 36 node tests and 30 Vitest tests have no saved raw output. Only knip raw files and `cache-search-after.txt` exist. Exit codes appear in prose only. B2 "done" asks for saved syntax/module-resolution output. The first line of report.md says "Seven scripts" while its table lists eight. | Save a `validation-log.txt` with commands and exit codes. Fix "Seven" to "Eight". |
| 5 | Low (claim scope) | The report says 5 vulnerabilities "not investigated". My `npm audit` shows the same 2 moderate + 3 high, and the lockfile diff is only 3 lines in root devDependencies, so the pins introduced none. The report does not say this. | State "pre-existing; lockfile resolution unchanged". |
| 6 | Info / follow-up | The unresolved import `/src/scene/drawing/sheet/drawingCache.ts` (`scripts/precompute-drawing.mjs:60`) is a Vite-served runtime path inside a browser-side import (false positive). `three-stdlib` unlisted, `@remotion/fonts` unused, and the `remotion`/`ffmpeg` binaries are leads, correctly framed as such. | None for B2. |
| 7 | Preference | The bare `playwright` specifier resolves relative to the script's location, which works here (repo-local node_modules). Failure when missing is Node's native ERR_MODULE_NOT_FOUND, explicit enough. A wrapper message would be nicer. | Optional. |

## Per-item checks

1. **Status/diff scope.** Changed paths are package.json, package-lock.json, the 8 scripts, untracked knip.json and the evidence dir. TODO.md, project/README.md, INDEX.md, project/context/* and the plan belong to the B1 lane and were ignored. OK.
2. **package.json / lock.** Exactly +3 lines in each: `bidi-js 1.0.3`, `draco3d 1.5.7`, `esbuild 0.28.2` as exact devDependencies, in the root `packages[""]` block only. No other lock line moved, so no version drift. Nothing removed (tailwindcss 4.3.3, playwright ^1.56.1, types intact; public/draco still present). OK.
3. **Scripts.** Each of the 8 is a one-line change. The 2 static imports (capture-b1b2-baseline, verify-b1b2-rebuild) now read `from 'playwright'`; they had no override before. The 6 dynamic ones keep `process.env.PLAYWRIGHT_MODULE || 'playwright'`. OK.
4. **knip.json entries vs vite config.** `PAGES` entries with `htmlEntry` are torque-wrench/, quiet-machine/, index.html, home/, armament/; all five are in `entry`. Also covered: lifecycle-census.html, studiomark-logo.html, `src/studiomark-logo-main.tsx`, `src/torque-wrench-lifecycle-census-main.tsx`. The page mains (home, armament, quiet-machine, torque-wrench) are reached through the HTML entries (checked the module script tags). Script/test/config/build globs cover all six extensions. Remotion is a separate workspace. Defects: findings 1-3.
5. **Evidence consistency.** The report table matches the raw files and my re-run (1 unused file, 1 unused dep, 1 unlisted dep, 2 binaries, 1 unresolved import, 159 exports). The raw baseline's unused dependency is `@higgsfield/client` (package.json:17); the configured run no longer flags it and flags `@remotion/fonts` instead. That is plausible, since scripts now count as consumers, but the report does not mention it. The caveat that the baseline is post-install rather than pre-change is disclosed honestly.

## Re-ran (read-only, in the worktree)

- `git status --porcelain`, `git diff --stat`, `git diff -- package.json package-lock.json scripts`: as above.
- `rg -n -F "npm-cache" scripts`: no matches (rg exit 1).
- `rg -n -F "npm-cache"` over the repo excluding node_modules, lockfile, evidence and .scratch: hits only in TODO.md and project/work/plans/JG-041-maintenance-cleanup.md. These are prose (B1 lane and plan history), not operational code. `cache-search-after.txt` also says no matches.
- `npx tsc --noEmit`: no errors, exit 0.
- `node -e "import('playwright')..."`: typeof chromium is object, so ESM resolution works.
- `PLAYWRIGHT_MODULE=file:///nonexistent/x.mjs node scripts/verify-jg031-gear-rotation.mjs`: the override is honored and fails loudly (ERR_INVALID_FILE_URL_PATH) with no silent fallback.
- `npx --yes knip@6.44.1 --no-exit-code` (configured): counts match the report.
- Temp-config knip run without `src/main.tsx`: 2 unused files (finding 1).
- `npm audit`: 5 vulnerabilities (2 moderate, 3 high), as reported.
- Not re-run: `node --test scripts/*.node-test.mjs` (36 tests) and the targeted Vitest (30 tests). Those claims rest on the report's prose only.

## Personal-cache operational default check

None remains. All 8 scripts use the `playwright` package specifier or an explicit `PLAYWRIGHT_MODULE` override. `scripts/` contains zero npm-cache strings. The remaining repo hits are the prose documents named above (classified: documentation/history, not operational).

## Done-criteria (plan section 5, B2)

- Direct tooling deps declared: met.
- No personal-cache default, including with overrides unset: met.
- Unused-file baseline covers every retained consumer without suppressing the legacy root entry: NOT met (finding 1).
- Saved syntax/module-resolution evidence: partly met (finding 4).
