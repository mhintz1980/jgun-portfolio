# Preview capture worker — released 2026-10-28

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.

Exact write ownership, now released to parent:

- `scripts/preview-owner-visual-corrections.mjs` (new).
- `project/work/evidence/torque-wrench-rebuild/66-owner-visual-preview-2026-10-28/capture-worker.md` (new; this note).

No source, asset, build, browser, Git or `.scratch` operations were performed. Other workers' files were preserved. The parent owns source integration and all browser/build execution.

## Usage after integration

Run from the workspace against the parent's intended integrated server/build:

```powershell
node scripts/preview-owner-visual-corrections.mjs '--url=http://localhost:5199/torque-wrench/?quality=full' '--out=output/playwright/owner-visual-preview-2026-10-28/integrated-preview' --mode=all --video=1
```

`--mode=camera|tool|pacing|all` defaults to `all`; video defaults off. URL parsing preserves query `=` characters. Viewport is 1440×900. Only native `scrollTo` is used; production `scrollFraction` maps page progress to scroll distance. No camera/clock setters, material changes, visibility changes or proof-capture mutation APIs are used.

Camera points: .865, .89, .915, .94, .985. Tool points: .685, .701, .717. Pacing display times: 44.4, 45.3, 46.2, 54.9, 58.7, 63.8 seconds. The pacing clock is bundled in memory with esbuild at invocation time; `cascadeProgressAtTime(time) - .115` follows the existing study-to-page domain mapping. Four camera images are featured as styleframes; all requested points are retained.

Outputs are `report.json`, `index.html`, screenshots and, optionally, one context WebM under `video/`. Video records .815→.825 then .855→.995 with 50 native scroll steps per sweep, each waiting 80ms plus rAF. The context recording also includes its page startup and endpoint settling; it is not trimmed. Actual elapsed sweep times and actual scroll landings are reported. The default output is a sibling of the existing `before-camera` baseline; for another output location the gallery looks for `../before-camera`.

The report always labels the proposal `PREVIEW_ONLY`; capture `completion`, fatal `error`, individual capture errors and browser errors are separate. It records actual camera/subject time, progress, renderer/backend/tier and native scroll positions. Exit code 1 indicates capture errors or reported browser errors. Capture completion grants no owner or engineering acceptance. The gallery keeps owner acceptance OPEN and explicitly limits the 60-tooth tool to presentation evidence.

## Actual check output

Command: `node --check scripts/preview-owner-visual-corrections.mjs`

- Exit code: `0`.
- stdout/stderr: empty.

No script execution, browser capture, build, unit tests or full verification roster was run. Runtime behavior and final integrated visuals remain unverified; parent capture and owner appearance/pacing review remain outstanding.

## Ready-to-paste receiving prompt

Continue in `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`. Read `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/torque-wrench-rebuild/66-owner-visual-preview-2026-10-28/capture-worker.md`. The preview worker has released exactly `scripts/preview-owner-visual-corrections.mjs` and this note. Next, finish integrating the other workers' authorized source changes, then use the invocation above against the intended integrated server to capture the visual proposal. Parent retains all build/browser ownership; restart any :4173 preview after rebuilding. Preserve the dirty tree and existing task boundaries. This utility is PREVIEW_ONLY; owner appearance/pacing acceptance and full same-build verification remain OPEN. No Git delivery, deployment, protected asset or `.scratch` changes are authorized by this note.
