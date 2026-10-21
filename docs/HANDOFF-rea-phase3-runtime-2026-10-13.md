# Handoff: REA Phase 3 (runtime observation) - next session

Date: 2026-10-13
Workspace: C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench
Branch: torque-wrench/rebuild
Scope of this handoff: execute **Phase 3 only** of the REA integration plan.

## What the next session is for

Run one runtime observation of the torque page and answer a single question: **did the beat resolver
actually execute while the page was scrolled?** Answer it yes / no / unknown and leave one JSON
behind. Do not turn this into a suite, a checked-in script, or a test.

Read first, in this order:

1. docs/rea-integration-implementation-plan-2026-10-13.md - section 6 is the phase spec, section 2 is
   the guardrails that still apply.
2. .scratch/rea/phase2-result.md - the scratch build this session can reuse.
3. .scratch/rea/phase0-audit/findings.md - Phase 0 disposition and the ruling of record.
4. docs/HANDOFF-rea-integration-and-cross-project-strategy-2026-10-12.md - background only; its
   technical corrections are already folded into the 2026-10-13 plan.

## State on entry

REA Phases 0 and 2 are complete. The seven Phase 0 test deletions were included by a concurrent
session in commit `4e620d48` (JG-038 Stage 3 integration). This session made no commit. The REA
documents remain untracked and scratch evidence remains gitignored. Do not commit in the next task.

- Phase 0: 7 of 9 proposed test cuts applied in src/shared/pageTopology.test.ts,
  src/shared/pages.test.ts and src/shared/posterGuard.test.ts. Two cuts were withheld and all six
  proposed rewrites were overturned by the ruling. `npx vitest run src/shared` = 8 files, 233 tests,
  green.
- Phase 2: the torque entry does not statically pull three.js. A scratch build already exists at
  .scratch/rea/dist-torque/ (752 modules, 22.78s) plus .vite/manifest.json.

## Correction to the plan: `resolveBeats` does not exist

The plan's section 6 and the 2026-10-12 handoff both ask whether `resolveBeats` executed during
scroll. That symbol appears nowhere in the source; only those two documents name it. The real beat
resolver is:

- `sampleTorqueBeat(progress)` - src/scene/torque-wrench/beatTimeline.ts:99. Runs per progress change.
  **This is the function to observe.**
- `createBeatTimeline(...)` - src/scene/torque-wrench/beatTimeline.ts:29. Runs once at module load
  (the module-level `torqueTimeline` at :97). If it appears, that is a load-time fact, not evidence
  of scroll-time execution. Do not report it as the answer.
- Consumed by src/state/torqueWrenchStore.ts:98 as `initial.sample ?? sampleTorqueBeat`, so the
  production path is the module default. A store built with an injected `sample` would bypass it.
- Beats data: src/scene/torque-wrench/beats.ts (`TORQUE_BEATS`, `TORQUE_SCROLL_VIEWPORTS`).

## Steps

1. Decide what to serve. The plan says dev server. Vite dev serves transformed ESM modules, so
   function attribution may land on the served `beatTimeline.ts` module; that is workable but
   unproven. If attribution is ambiguous, fall back to the Phase 2 build with
   `npx vite preview --outDir .scratch/rea/dist-torque`. Record which one was used.
2. Start the server on **localhost**, never 127.0.0.1 (AGENTS.md; the dev server refuses it).
   vite.config.ts sets `appType: 'mpa'`, so the page is its own document at
   http://localhost:PORT/torque-wrench/. Default dev port is 5173 and preview 4173, but AGENTS.md
   references a :5199 URL for the opening verifier, so confirm the actual bound port before pointing
   anything at it.
3. Launch Chrome with `--remote-debugging-port=9222` and a throwaway `--user-data-dir` under
   `.scratch/rea/`, then call
   `mcp__rea__list_browser_targets` and keep the torque page target id.
4. Arm `mcp__rea__observe_web_execution` with `observation_ms` around 20000, then scroll the page
   with an external driver - Playwright is available as a devDependency (^1.56.1). Put any temporary
   driver script under `.scratch/rea/`; external means a separate process from the observation.
   nothing inside the page will scroll itself.
5. Read the function-range counts for `sampleTorqueBeat`. Export the result with
   `mcp__rea__export_evidence_bundle` to the **absolute** path
   `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\.scratch\rea\runtime-evidence.json`,
   passing `overwrite: true` if that file already exists.
6. Kill Chrome and the server. Leave no process behind.

## Optional, cheap, and honestly scoped

`mcp__rea__inspect_web_event_listeners` only sees listeners attached directly to the first CSS match.
React delegates at the root and R3F listens on the canvas, so expect `unknown` for almost everything.

Note also that the plan's hotspot probe has **no target on the torque page**. src/scene/Hotspots.tsx
renders real `<button>` elements inside drei `<Html>`, which makes it probeable, but it belongs to the
legacy scene and is not reachable from the torque entry (check-torque-stage1-boundary.mjs confines the
entry to src/shared, src/scene/torque-wrench and the private-reuse paths). Run the probe on the torque
page's `canvas` if present. Record the absent hotspot overlay as not applicable; delegated listeners
that the tool cannot attribute remain unknown. Keep this task on the torque page.

## Done when

`.scratch/rea/runtime-evidence.json` exists and the answer to "was `sampleTorqueBeat` executed during
scroll" is stated as yes, no, or unknown, with the evidence that decides it. One run, not a suite.

## Boundaries

- Output only under `.scratch/rea/` (gitignored).
- Do not commit, do not add tests, do not turn any of this into a checked-in script.
- Do not touch the legacy root page (index.html, src/App.tsx, src/scene/SceneCanvas.tsx).
- Do not point any tool at the jgun-quiet-machine repo, and never reference
  project/work/evidence/rl300-quiet-machine/38-s5-posters/ or anything under public/.
- Leave the pre-existing modified tracked files alone.

## Concurrency warning

Another writer is active in this worktree. During the 2026-10-13 session, `TODO.md` went from clean to
modified and docs/torque-wrench-rebuild/HANDOFF-2026-10-13-stage3.md appeared, neither by that
session. Re-check `git status` before and after this phase, and stage only paths you own. Do not
assume the working tree is untouched by others.

## Carried-forward open items (not part of Phase 3)

- src/shared/pageTopology.test.ts:116 cannot fail: `readFileSync` at :42 runs at module load, so a
  missing entry throws ENOENT before :116 executes. Low priority. Needs its own ruling.
- Two withheld Phase 0 cuts remain live candidates: src/shared/pageTopology.test.ts:351-357 and
  src/shared/pages.test.ts:189-191. Reasons are recorded in .scratch/rea/phase0-audit/findings.md.
- Six src/shared/PageNav.test.tsx rewrites were overturned on documented intent. Do not re-raise them
  without new evidence.
- Phases 1, 4 and 5 of the plan are still unexecuted. Phase 1 is live but narrow
  (`checkPosterPath` is the only export returning a constructed object). Phase 5 is recommended to
  skip.

## Suggested skills

- `reverse-engineer-anything` (r1) - the REA toolchain this phase uses.
- `webgl-telemetry-verifier` (r0) - runtime probes over vision, which is the rule in this repo.
- `playwright` (r0) - the external scroll driver.
- `codex-tiers` (r0) - only if you delegate seats; this phase is small enough to run inline.

## Ready-to-paste prompt for the receiving session

```text
Execute Phase 3 of docs/rea-integration-implementation-plan-2026-10-13.md in
c:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench (branch torque-wrench/rebuild).

Read docs/HANDOFF-rea-phase3-runtime-2026-10-13.md first; it carries the entry state, the plan's
corrections, and the boundaries. The headline correction: resolveBeats does not exist - the function
to observe is sampleTorqueBeat at src/scene/torque-wrench/beatTimeline.ts:99.

One runtime observation, one JSON, one yes/no/unknown answer. All REA output under .scratch/rea/.
Do not touch jgun-quiet-machine or the 38-s5-posters folder, do not commit, do not add tests, do not
turn it into a checked-in script.
```

## Project status + checklist + next task (2026-10-13)

### Project status

JG-038 is the private `/torque-wrench/` rebuild. Current HEAD is `4e620d48` on
`torque-wrench/rebuild`. The canonical [TODO entry](../TODO.md) reports Stages 0–2 closed and a
Stage 3 integration checkpoint. The project is still incomplete: Stage 3 exit, Stages 4–6,
G0–G9 acceptance, final effects review, and owner visual/motion acceptance remain open.

The main task list is [13-implementation-plan.md](torque-wrench-rebuild/13-implementation-plan.md).
Its opening banner and Stage 2 checkboxes lag behind the dated Stage 2 closure recorded later in the
same file and in the canonical TODO. This summary follows those closure records; it does not silently
check off the main plan or treat integration as acceptance.

Implemented so far:

- Separate private HTML/JS entry, shared navigation/fade, and ordered Drafting, Breakthrough,
  Mechanism, Inspection, and Close DOM chapters with reachable controls/footer.
- Tier selection before narrative imports, semantic poster/reduced-motion and failure paths,
  and page-local state/resource cleanup.
- Beat data, pure timeline sampling, one canonical scroll conductor, reverse/seek/reload/hold
  handling, and extension-fixture proof. Provisional scroll distance and final pacing remain open.
- Page-safe drawing pose/bake extraction, ring/shaft inspection cores, canonical wrench mechanics,
  opening/mechanism/inspection directors, private sheet, one R3F Canvas, and one camera writer.
- Explicit shaft-study play/pause/seek controls are implemented; operation, cutter framing,
  occlusion/clearance, and matched mechanical parity still need runtime acceptance.
- Pre-mount WebGL capability checks and context-loss fallback to the semantic story. Automatic
  downgrade preserves an open disclosure; user close/Escape restores trigger focus.

Recorded verification at the Stage 3 checkpoint: TypeScript exit 0; 73 files / 947 passing tests
with 4 pre-existing skips; static/fallback browser 14/14 cases and 396/396 assertions;
timeline/conductor browser 17/17 cases and 382/382 assertions; drawing integration 5 PASS / 0 FAIL /
1 UNVERIFIED (BFCache). These are existing checkpoint results, not fresh runs for this summary.
Cold sheet baking can block the main thread for multiple seconds and remains a performance concern.

Current working-tree state: root `GATES.md` is modified; the REA plan and two REA handoffs are
untracked. The seven shared-test deletions are already committed in `4e620d48`. Preserve existing
changes and inspect status again before execution.

### Main-plan checklist

- [x] Stage 0 — owner authorization, shell readiness, work registration, baseline/resource checks,
  and approved verification matrix/budgets. Skill reading remains an ongoing obligation.
- [x] Stage 1 — private document, semantic chapters, tier/fallback foundation, local store/cleanup,
  topology and existing-entry preservation.
- [x] Stage 2 — beat contract and pure resolver, endpoint/overlap validation, conductor isolation,
  canonical progress, initial Lenis baseline, and fixture extension; closed by the dated
  [Stage 2 closure](../project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage2-closure.md).
- [x] Stage 3 implementation — lower-level reuse/extraction, import isolation, mechanics/director
  wiring, inspection cores and private world integration recorded in the
  [checkpoint](../project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-integration-checkpoint.md).
- [ ] Stage 3 exit — independent integrated review (file absent when checked), real cutter
  framing/occlusion/clearance, control operation, subject/camera timing and matched mechanics proof;
  optional pointer-state separation remains unchecked in the main plan.
- [ ] Stage 4 — controlled camera/remap A/B, opening pressure/shatter/emergence recovery,
  irregular pit/depth/occlusion, electricity and continuity proof. Recovery work has not begun;
  existing director scaffolding does not close this stage.
- [ ] Stage 5 — explicit background depth layers, gradient/dither, continuous post/parallax,
  pointer suppression, measured render caps and input/tab-resume behavior.
- [ ] Stage 6 — final offline poster art with provenance/crops/alt text, complete semantic story,
  final tier/accessibility and failure roster. Existing fallback proof is partial evidence.
- [ ] G0–G9 — all acceptance gates remain open. Staged implementation closures do not close them.
- [ ] Independent Astra effects/technical acceptance and owner visual/full-motion acceptance.

REA side task:

- [x] Phase 0 — test audit; seven cuts applied, two cuts and six rewrites retained; shared suite
  verified 8 files / 233 tests passing.
- [x] Phase 2 — scratch build and manifest audit; private static import closure excludes three/R3F.
- [x] Phase 3 — runtime observation complete 2026-10-13: **YES**, `sampleTorqueBeat` executed 31 times in the
  deciding window. Evidence `.scratch/rea/runtime-evidence.json` + `.scratch/rea/runtime-context.md`;
  completion record `docs/HANDOFF-rea-phase3-complete-2026-10-13.md`.
- [ ] Phase 1 — conditional return-shape comparison; not executed.
- [ ] Phase 4 — deferred until a model re-export. Phase 5 remains recommended to skip.

### Next task — REA Phase 3 runtime observation (SUPERSEDED: executed 2026-10-13; see completion addendum)

The next session performs **REA Phase 3**, not the rebuild's Stage 3 exit or Stage 4 implementation.
Observe `sampleTorqueBeat` during externally driven scrolling of `/torque-wrench/`. Use localhost,
a task-owned server/browser and a throwaway Chrome profile; recheck ports and scratch-build freshness.
Do not reuse stale build identity after source changes. Record the source/build identity, observation
window, actual scroll input and function-range execution evidence.

Deliver `.scratch/rea/runtime-evidence.json` and a yes/no/unknown answer. A module-load hit alone is
insufficient: distinguish scroll-window `sampleTorqueBeat` counts from `createBeatTimeline` at load.
This one observation does not close the remaining rebuild gates. Close only processes started by
the session. No source changes, deletions, tests, commits, or protected-folder access are authorized.

Ready-to-paste prompt (as issued, and executed):

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild.
Read docs/HANDOFF-rea-phase3-runtime-2026-10-13.md, including its final project status/checklist.
JG-038 Stages 0–2 are closed; Stage 3 is integrated but its exit and G0–G9 remain open.
HEAD at handoff is 4e620d48; inspect live status and preserve concurrent work.

Execute only Phase 3 of docs/rea-integration-implementation-plan-2026-10-13.md.
resolveBeats does not exist: observe sampleTorqueBeat in
src/scene/torque-wrench/beatTimeline.ts during externally driven scroll on /torque-wrench/.
Use one task-owned runtime observation, record source/build identity, and export evidence to
C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/.scratch/rea/runtime-evidence.json.
Report yes/no/unknown with the deciding function-range counts; load-time execution alone is not proof.

All output and temporary drivers/profiles go under .scratch/rea/. Use localhost, preserve root
GATES.md and existing REA documents, and stop only your own server/browser processes afterward.
Do not touch jgun-quiet-machine, the protected jgun-portfolio checkout, or the 38-s5-posters folder.
Do not modify source, delete anything, add tests, commit, push, publish or begin rebuild Stage 4.
```

## Completion addendum (2026-10-13)

Phase 3 is **complete**: **YES**, `sampleTorqueBeat` executed 31 times inside the deciding observation window
while an external Playwright driver scrolled `/torque-wrench/`.

- Deciding record `ev_cb35afa9606fb296fd770dde54f6aaaceae5d1073a69dbfa3419bc694c22ff5c`; window
  2026-10-13T08:01:25.677Z-08:01:45.695Z (20 s), 33 fully contained wheel inputs, progress 0.0019416-0.9981041,
  canvas mounted.
- Function-range coverage: count 31, scriptId 23, `http://localhost:5207/src/scene/torque-wrench/beatTimeline.ts`,
  UTF16 range [3241, 3322), function-only (`isBlockCoverage` false). Captured served-module SHA-256
  `fb3166dd6e3c6dc84a34c8c60451fea0b0b059db43ee78982ff8c62133e72eb1`.
- `createBeatTimeline` is absent from coverage, which is UNKNOWN rather than zero; a module-load hit would not
  have been evidence regardless.
- The first capture `ev_25f5e9b3520c75c55dcbefd407038b6377a5da42ec6947bf898f3e01634244e2` had no overlapping scroll
  and is excluded; it is retained inside the export for transparency.
- Evidence: `.scratch/rea/runtime-evidence.json` (3 REA records, 46,188,577 bytes; the file export avoided the
  10 MB MCP transport limit) and its companion `.scratch/rea/runtime-context.md` (source/build identity, all 33
  inputs, observed window/count, stable resolver/conductor identity, cleanup).
- Cleanup: task-owned Vite PID 50084 and Chrome PID 21376 stopped (ports 5207 and 9222 closed), independent driver
  PID 33780 exited 0, no files deleted.

The "Next task — REA Phase 3 runtime observation" section above is retained as the executed record and is now
superseded. The next task is the JG-038 Stage 3 exit proof, not another Phase 3 run. Full record:
`docs/HANDOFF-rea-phase3-complete-2026-10-13.md`.
