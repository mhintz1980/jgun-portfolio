# Stage 1 foundation — local CPU validation

Date: 2026-10-11 (America/New_York). Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`, HEAD `8945fa95cc70b74bdcc9da27cc0573c3d1157da4`. These are parent-executed commands against the untracked foundation. No private HTML/registry activation or browser/GPU verification was performed.

## Final command results

Commands used installed Node `C:/nvm4w/nodejs/node.exe` and local package CLIs, sequentially.

| Command | Result | Scope |
| --- | --- | --- |
| `node scripts/check-torque-stage1-boundary.mjs` | Exit 0, `pass: true`, no errors | 16 eager source modules; one lazy target, `Scene.tsx`; exactly `cadGate.ts -> ./Scene`. No eager narrative GPU package or root runtime/store import. |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0, no diagnostics | Current repository TypeScript including new files. |
| `node node_modules/vitest/vitest.mjs run src/scene/torque-wrench src/state/torqueWrenchStore.test.ts src/shared --maxWorkers=1` | Exit 0, 13 files / 253 tests passed, 4.85 s | 233 shared tests and 20 Stage 1 tests. Node/SSR and pure lifecycle contracts; no real DOM/browser. |
| `node .scratch/torque-stage1-20261011-01a12d12/build-private-module.mjs` | Exit 0 | Delivered Vite/React/Tailwind config, private JS entry only, in-memory input override, `publicDir: false`, scratch output. No HTML input or registry activation; no repository `dist/`. |

The scratch build emitted:

- `assets/torque-wrench-CXHCUIPs.js`: entry, no static chunk imports, dynamic import of Scene, 41 module IDs; 65,128 gzip bytes (entry and entire eager JS graph).
- `assets/Scene-CpRhW43u.js`: deferred placeholder, one module; imports the entry's shared React runtime.
- No eager narrative dependencies from Three/R3F/GSAP/Lenis/postprocessing/troika/three-stdlib in the bundle metadata audit.
- Manifest at `.scratch/torque-stage1-20261011-01a12d12/dist-module/.vite/manifest.json`. No public assets copied.

The build warned that `/fonts/BarlowCondensed-SemiBold.ttf` could not resolve at build time. This diagnostic intentionally disables the public directory; the referenced font exists in repository `public/fonts/`. Actual public delivery remains for the coordinated HTML build. No circular dependency or missing module error was reported.

Resource snapshot immediately before the diagnostic build: free RAM 6.49 GB, sampled CPU 62%; scoped ports 4173/4191/4193/5199 clear. This was a bounded serial CPU build, not a performance measurement or exclusive GPU reservation. No task server, browser or GPU process was launched.

## Defects found and repaired before final checks

Initial source gate passed and 13 tests passed, but TypeScript exposed an invalid `PosterImage` export import. Source inspection also found the live-tier loader stranded at `idle`, missing entry HMR disposal, and no scene failure boundary. These were repaired by the GLM worker. The actual production lifecycle now has regression coverage rather than relying on SSR to execute effects.

Parent subsequently fixed ready-store remount attachment, typed the Scene's async/WebGL `onFailure` port, guarded static-tier loads and stale completion, and sampled reduced motion on listener setup. The Scene is an honest zero-Canvas foundation placeholder. Error-boundary source and callback plumbing exist; actual WebGL initialization/context-loss behavior remains untested until a renderer exists.

Final lifecycle cases include initial loading, rejection/terminal failure, disposed completion, failed-document skip, poster skip, ready remount, and downgrade while load is pending. Story remains outside the scene/poster conditionals. Real browser focus persistence, keyboard behavior, remount subscription census and cold-load zero-CAD/zero-canvas proof remain open.

## Scope and remaining checks

These checks support the new private page-local static foundation only. They do not close Stage 1's HTML/topology exit or any G0–G9 gate. The shell owner must apply and verify the [coordinated activation packet](shell-activation-packet.md), including pinned HTML, noindex, private registry row and shared test pins. No Vite config edit is needed because input derives from the registry.

Final offline posters/provenance, conductor/directors, CAD extraction, effects, hardware/mobile performance and owner PNG/full-motion acceptance remain future work. Audit 16/reconciliation 17 require refresh before extraction; mappings require audit before conductor tuning. Independent GLM review is source/evidence advisory and does not substitute for the plan's Astra or owner acceptance gates.
