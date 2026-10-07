# JG-035 — Cloud continuation handoff

Start from branch **`codex/jg033-signature-shot`** in `mhintz1980/jgun-portfolio`, using the checkpoint that adds this file. Read `git rev-parse HEAD` for its actual hash. This repository-local handoff supersedes the Windows temporary handoff for cloud continuation.

## First action

Implement the [owner animation revision plan](jgun-owner-animation-revision-plan-2026-10-07.md), starting with P0 and then disjoint opening, ring and shaft workers. Mark approved the [skill lists](jgun-change-request-skill-selection-2026-10-07.md) and requested commit/push so the next session can work in the cloud. No animation revisions from that new plan have been implemented. Existing opening/manufacturing runtime is included as the baseline. [Opus revised-plan review: SHIP](jgun-owner-animation-revision-plan-review-2026-10-07.md) is plan readiness, not runtime or owner visual acceptance.

Read AGENTS, TODO, project README/INDEX, measured animation spec §5–§5.4 and `project/context/agent-skills.md`. Then read the plan and the [prior current-state handoff](../project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md), current-state section first.

## Portable inputs

- [Verbatim owner request](../project/work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/references/owner-change-requests.txt) and all seven image references are checked in beside it. Use these when the historical attachment and `C:/Projects/Misc` paths are unavailable.
- [Selected skill snapshots and provenance](../project/context/cloud-skills/README.md) replace unavailable Windows skill paths. Read `project/context/cloud-skills/<skill-name>/SKILL.md` at the plan's activation phase. Snapshots include supporting references; install nothing merely to resolve a Windows path.
- Runtime GLBs, drawing cache, Draco decoders, fonts, static shaft stills and required test geometry/report fixtures are included. Do not run Windows `sync-assets.ps1` or regenerate protected M249/MSP GLBs.
- Historical capture archives are not all shipped. Documents keep their original evidence paths; where a historical capture is absent, treat the summary as historical and regenerate proof. Current measured test fixtures are included; missing old capture links do not justify claiming new verification.

## Bootstrap and verification

Use repository-relative paths from the cloud checkout. Node 20.19+ or 22.12+ is required by Vite 7; use a current supported Node release. Install dependencies from the lockfile:

```sh
npm ci
npm run typecheck
npm test -- src --fileParallelism=false
npm run build
node scripts/check-b1b2-contract.mjs
npm run check:station2
npm run dev -- --host 0.0.0.0 --port 5199
```

Run verifiers with `--url=http://localhost:5199` and separate `--out=<evidence-directory>` folders. Opening iteration uses `--quick`; ring iteration can use `--focused`. Shaft/lifecycle have neither `--time` nor `--quick`. Exact artifact captures at 1.3/10.9/25.4 seconds must be added to their roster, as the plan specifies. Cache generator takes a positional URL.

Browser harnesses use Playwright's **Chrome** channel. Provision it using `npx playwright install --with-deps chrome` if missing and supported by the cloud environment. Existing Windows D3D11/ANGLE flags may require platform adaptation in the test harness on Linux; preserve scene/tier expectations, record actual renderer and do not reinterpret software rendering as a full-tier pass. Browser/GPU validation has not been performed in a cloud host by this publishing session.

After each production rebuild, restart the known preview server:

```sh
npm run preview -- --host 0.0.0.0 --port 4173
```

Verify live bundle hashes before full browser rosters. Owner review: open the forwarded preview, scroll to Ring Switch or Input Shaft, click **Inspect…**, then **Play sequence**. They remain optional inspections rather than automatic scroll clips.

## Preserve these invariants and gates

Follow the plan's exact mechanical and single-playhead contracts. Detail B currently depicts the fork/clutch; retarget the actual input-shaft sun gear and source callout. Diagnose the ring strip and shaft artifacts before selecting repairs. Preserve the approved 12-second ring / 43-second shaft timings, tooling/contact/clearance, 6 mm lead-out and +2.75 mm rigid support shift. Approximate retrospective FOS presentation is owner-authorized; no on-screen disclaimer. Keep output-shaft hardness notes separate.

Reduced-motion/poster stays DOM/stills-only with zero CAD requests and zero canvases throughout. Inherited G6 is open: historical opening roster 5/6, desktop-full fails after a full-to-lite tier change, cause unknown. Diagnose without waiving expectations; bounded unresolved work may accompany an honest owner preview. Owner visual approval remains separate.

Use available native subagents for disjoint files; parent owns shared interfaces/verifiers. Windows local opencodex endpoint and vault tools are not cloud dependencies. Review with Opus 5.5 if available, otherwise user-authorized GPT-6-Astra. Verify served model or state the limitation; do not export local credentials/config.

Save new evidence under `project/work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/`. Preserve initial status and unrelated work. Implementation can proceed without rediscovering/reapproving the lists; deployment and owner visual acceptance are not implied by this checkpoint.

## Publishing-session checks

Fresh local baseline: typecheck, build, B1/B2 and Station 2 passed. The original local 43 files / 445 tests include eight stale nested-worktree files (88 cases) under `.kilo/worktrees/fantasy-feet`, which are not shipped. The isolated main checkout passed **35 files / 357 tests**, typecheck, build and both contracts using the installed lockfile dependencies. Serial tests avoid a default-timeout failure on the loaded local host without changing assertions.

The isolated build initially exhausted memory while Tailwind's default source detection could scan large historical evidence archives. `src/index.css` now explicitly limits class scanning to `src` and `index.html`, following [official Tailwind documentation](https://tailwindcss.com/docs/detecting-classes-in-source-files#setting-your-base-path); the corrected build passed in 11.49 seconds. This is a build-scope correction, not an animation revision. New bundle hashes differ from the historical baseline; always use the current build's hashes. The [checkpoint manifest](../project/work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/cloud-checkpoint.json) records portable-input hashes, exact verification and limitations.
