# REA integration: implementation plan (2026-10-13)

Companion to `HANDOFF-rea-integration-and-cross-project-strategy-2026-10-12.md`. Originally plan-only.
Status update 2026-10-13: Phases 0, 2 and 3 have since been executed (Phase 3 result in section 6.1);
Phases 1, 4 and 5 remain open or deferred. Not committed.

## 0. Corrections to the handoff (verified 2026-10-13)

| Handoff says | Actual |
|---|---|
| HEAD `8945fa95` | HEAD is `dc44fb79` on `torque-wrench/rebuild` |
| `src/shared/pageTopology.ts` | Does not exist. Only `pageTopology.test.ts` (18.5K); the module under test is `pages.ts` |
| `dist/assets/*.js` to audit | No `dist/` in this worktree; it must be built first |
| `.scratch/` as output path | Not created yet; it is gitignored, so safe to create |
| Torque page source | `torque-wrench/` holds only `index.html`; code is `src/torque-wrench-main.tsx` + `src/scene/torque-wrench/` |
| `resolveBeats` (section 6) | Does not exist. The beat resolver is `sampleTorqueBeat` in `src/scene/torque-wrench/beatTimeline.ts`; `createBeatTimeline` runs once at module load and is not scroll evidence |

## 1. Empirical facts that shape the plan

- **TS/TSX parses.** `analyze-javascript-application` on `pages.ts` + `PageNav.tsx`: 2 files parsed, 0 parse failures.
- **Output blow-up is ~150x.** 7.2 KB of source produced a 1.1 MB result. The 10 MB MCP receive limit therefore caps one
  call at roughly 65 KB of source. `src/shared` (about 190 KB incl. tests) cannot go through the MCP tool.
- **Always use the CLI with output to a file**, then extract with a node one-liner:
  `npx -y rea-agents@6.3.0 analyze-javascript-application <dir> --json > .scratch/rea/<name>.json`
- Probe outputs are in the session scratchpad only; nothing was written inside the repo.

## 2. Guardrails (apply to every phase)

1. Output only under `.scratch/rea/` (gitignored). `export_evidence_bundle` needs an **absolute** path and
   `overwrite:true` to replace.
2. Analyse **copies** of cross-repo files (copy into `.scratch/rea/in/<repo>/`), never point REA at `jgun-quiet-machine`
   directly. Never reference `project/work/evidence/rl300-quiet-machine/38-s5-posters/` or any `public/` image.
3. No commits, no edits to the legacy root page (`index.html`, `src/App.tsx`, `src/scene/SceneCanvas.tsx`).
4. Do not touch the 30+ already-modified tracked files in this worktree; REA is read-only against them.
5. Dev server: `localhost`, not `127.0.0.1` (AGENTS.md). Build to a scratch outDir, not `dist/`.

## 3. Phase 0 — test audit (mandatory prerequisite, owner rule 2026-10-13)

No REA phase may add a test. REA is useful here only as **evidence for deleting** tests.

1. List the large shell tests: `pageFade.test.ts` (33.8K), `pageTopology.test.ts` (18.5K), `shellBoundary.test.ts`
   (10.4K), `posterGuard.test.ts` (7.4K), `pages.test.ts` (7.5K), `PageNav.test.tsx` (5.4K).
2. For each `it(...)`, classify: **keep** (guards a behaviour a user sees), **redundant** (same assertion as another
   test or as `verify-torque-static.mjs` / `check-torque-stage1-boundary.mjs`), **obsolete** (asserts a removed
   path), **brittle** (snapshot of layout constants).
3. Output a table (test, class, one-line reason, proposed action). **Owner approves deletions**; the agent does not
   delete on its own.
4. Run the suite once after approved deletions, not between each one.

Done when: the table exists and the owner has ruled on it.

## 4. Phase 1 — cross-repo shell contract (use case 1)

Value is narrower than the handoff implies: `compare_javascript_export_shapes` compares the **static return shape of
one exported function** between two analysed trees. It does not diff React props or JSX.

1. `grep -n "^export" src/shared/pages.ts src/shared/poster.ts src/shared/posterGuard.ts` — pick exports that return
   plain objects. Likely candidates only; if none, stop here and say so.
2. Copy those files from both repos into `.scratch/rea/in/torque/` and `.scratch/rea/in/qm/`.
3. CLI-analyse each side to JSON; feed the two evidence records to `compare_javascript_export_shapes` once per
   export (module path + export name).
4. Expect `unknown` for dynamic values; treat "added/removed property with complete coverage" as the only hard signal.

Cost: ~5 CLI runs, small. Kill if no export returns an object literal.

## 5. Phase 2 — entry bundle audit (use case 2)

Check whether existing scripts already do this before spending anything:
`scripts/verify-torque-static.mjs`, `scripts/check-torque-stage1-boundary.mjs`.

1. Build to scratch: `npx vite build --outDir .scratch/rea/dist-torque --manifest` (confirm the multi-entry config
   builds `torque-wrench/index.html`; if it also rebuilds the legacy page, that is acceptable since the outDir is
   scratch).
2. **Cheapest, highest-signal check first:** read `.vite/manifest.json`; walk `torque-wrench/index.html` →
   `imports` (static) vs `dynamicImports`. If any static import chunk contains three/@react-three, `cadGate.ts` is
   leaking. No REA needed.
3. Only if (2) is ambiguous: `npx rea-agents@6.3.0 import-reference-source --help` (syntax unverified), import `src/`
   at HEAD, then `compare_source_to_bundle` to map which source modules landed in which chunk.

Cost: one vite build (~minutes of CPU). Kill if the manifest answers it.

## 6. Phase 3 — runtime (use case 3), scoped down

Known limits from the tool schemas:
- `inspect_web_event_listeners` sees only listeners **directly on the first CSS match**. React attaches handlers at
  the root and R3F listens on the canvas, so hotspot handlers will mostly read `unknown`. Run it once on the hotspot
  DOM overlay selector (if hotspots are DOM buttons) and on `canvas`; accept "unknown" as the answer.
- `observe_web_execution` needs an **externally driven** page: something else must scroll while the window is open.

Steps (one run, not a suite):
1. Start the dev server in this worktree on `localhost`; launch Chrome with `--remote-debugging-port=9222` and a
   throwaway profile; `list_browser_targets` to get the target id.
2. Arm `observe_web_execution` (`observation_ms` 20000), then scroll the page from a separate temporary external-driver
   process/script under `.scratch/rea/` - external to the observer, not outside the repo. Read the function-range
   counts for `sampleTorqueBeat` and export the bundle to `.scratch/rea/runtime-evidence.json`.
3. Kill Chrome and the dev server.

Done when: one JSON exists and the answer to "was `sampleTorqueBeat` executed during scroll" is yes/no/unknown.
Do not turn this into a checked-in script.

### 6.1 Result (executed 2026-10-13) — Phase 3 complete

**YES.** `sampleTorqueBeat` executed 31 times during externally driven scroll on
`http://localhost:5207/torque-wrench/`. Deciding REA record
`ev_cb35afa9606fb296fd770dde54f6aaaceae5d1073a69dbfa3419bc694c22ff5c`, window
2026-10-13T08:01:25.677Z-08:01:45.695Z (20 s), 33 fully contained Playwright wheel inputs spanning progress
0.0019416-0.9981041, canvas mounted. Coverage was function-only, count 31, scriptId 23, UTF16 range
[3241, 3322) in the served `beatTimeline.ts` (SHA-256 `fb3166dd6e3c6dc84a34c8c60451fea0b0b059db43ee78982ff8c62133e72eb1`).
`createBeatTimeline` did not appear in coverage; its absence is UNKNOWN rather than zero, and a load-time hit
would not have been evidence either way.

Evidence: `.scratch/rea/runtime-evidence.json` with companion `.scratch/rea/runtime-context.md`; completion
record `docs/HANDOFF-rea-phase3-complete-2026-10-13.md`. Phase 3 closes nothing in JG-038.

## 7. Phase 4 — GLB forensics (use case 4)

`public/models/*.glb` is gitignored and synced from `C:\Projects\CAD\RL300-SAFE\optimized\`. Compare **against the sync
source**, not git. A 20-line node script reading the GLB JSON chunk (node count, material count, normalTexture
presence) answers the same question as `inspect_artifact` at less cost; use REA's `compare_artifacts` only if a byte
digest comparison between the synced copy and the source is wanted. Run only when someone re-exports a model.

## 8. Phase 5 — unknowns ledger (use case 5): recommend skip

`record_unknown` state lives in a single MCP session, and `TODO.md` is already the canonical queue. A second ledger
creates a reconciliation job. Open owner rulings (intake framing at u=0.51, chevron tone) belong in `TODO.md`.
Use `export_evidence_bundle` only to archive a phase's evidence, not to track decisions.

## 9. Order and spend

| Phase | Needs | Rough cost | Do it? |
|---|---|---|---|
| 0 audit | reading tests | one agent, medium | **first, blocking** |
| 2 step 1-2 | vite build + manifest read | one build | yes |
| 1 | 5 small CLI runs | low | only if step 1 finds object-returning exports |
| 3 | Chrome + dev server + driver | one session | optional, one shot |
| 4 | node script | trivial | only on next re-export |
| 5 | — | — | skip |
| 2 step 3 | import-reference-source | unknown syntax | only if manifest is ambiguous |

## 10. Paste prompt for the executing session

```text
Execute docs/rea-integration-implementation-plan-2026-10-13.md in c:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench
(branch torque-wrench/rebuild). Start with Phase 0 (test audit) and stop for owner approval before deleting anything.
All REA output goes under .scratch/rea/. Do not touch jgun-quiet-machine or the 38-s5-posters folder, do not commit,
do not add tests.
```
