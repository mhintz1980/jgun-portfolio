# JG-035 — Cloud continuation handoff

Start from branch **`codex/jg033-signature-shot`** in `mhintz1980/jgun-portfolio`, using the checkpoint that adds this file. Read `git rev-parse HEAD` for its actual hash. This repository-local handoff supersedes the Windows temporary handoff for cloud continuation.

## First action

Implement the [owner animation revision plan](jgun-owner-animation-revision-plan-2026-10-07.md), starting with P0 and then disjoint opening, ring and shaft workers. Mark approved the [skill lists](jgun-change-request-skill-selection-2026-10-07.md) and requested commit/push so the next session can work in the cloud. **Status update 2026-10-08:** the O1–O4, R1–R2 and S1–S3 revisions are now implemented on this branch (`524bdb4`…`2831f35`; see the [evidence index](../project/work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/README.md)), with verification partial and owner visual acceptance open; captures were bundled Chromium + SwiftShader software GL in a Linux cloud container (not hardware GL). The sentence that follows is the original checkpoint wording: no animation revisions from that new plan had been implemented at the checkpoint. Existing opening/manufacturing runtime is included as the baseline. [Opus revised-plan review: SHIP](jgun-owner-animation-revision-plan-review-2026-10-07.md) is plan readiness, not runtime or owner visual acceptance.

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

## Next-session handoff (written 2026-10-08, branch head `aeb1ee7` + this commit)

Read this section first. Everything below is on `codex/jg033-signature-shot`; no PR exists and none should be opened unless the owner asks.

### BLOCKER 1 — the handwriting must be redone (owner rejected the 2831f35 hand)

- **What the owner said:** the notes' placement/content looked good, but the type-like hand was hard to tell from the drawing typeface ("too neat"), so a humanized, all-caps hand in **black ink or graphite pencil** was requested. The first humanization (`2831f35`, graphite colour index 2) was then rejected: *"far too squiggly/wavy. Each stroke of the pencil should form a line or arc, not a series of waves where a deliberate line should be. Who wrote this, Michael J. Fox?"* A screenshot with yellow highlights (`references/handwriting-rejected-2831f35-annotated.png`; frames `owner-revisions-2026-10-07/after-hand/opening-desktop-t0p17.png` show the same defects) marks **blobby thick clusters inside letters** (N, T, R, A, E in FAILURE POINT / ALTERNATE MATERIALS), **wildly inconsistent pen weight between words**, **wavy strokes** and letters that run together.
- **Success references (the owner's two images, checked in as `owner-revisions-2026-10-07/references/handwriting-success-1.png` and `handwriting-success-2.webp`; the owner's yellow-highlighted screenshot of the rejected hand is `handwriting-rejected-2831f35-annotated.png` beside them):** (1) fast, confident ALL-CAPS fineliner, tall narrow capitals, uneven size/baseline/spacing; (2) neat notebook all-caps. In both, every stroke is ONE decisive straight line or single smooth arc, pen weight is uniform, and the human feel comes only from letter size, lean, baseline drift and spacing.
- **Why it went wrong:** the engine in `src/scene/drawing/sheet/handwriting.ts` added per-stroke sine wobble, double-struck retraces, end overshoot and ±35 % pressure width. Those are the tremor/blobs. Remove them; keep the deterministic seeding, all-caps, bounds, graphite colour plumbing (colour index 2, `uInkGraphite`, cache v7) and the red marks.
- **Redo spec:** straight segments or single-curvature arcs/Béziers sampled smoothly; one pen width (pressure ≤ ±10 %, smooth along a stroke); no retrace/overlap inside a letter except a clean T/crossbar junction; no overshoot stubs; guaranteed visible gaps (≥ .25 letter-width between neighbours, even late in a line); human variation only at letter level (height/width ±~8 %, per-letter lean ±~4° around a consistent ~4–6° forward lean, small line slope, uneven word gaps, crossbar-height variation). Red strikes = two clean near-straight strokes (single slight bow); `handLine` = straight with at most one smooth bow; `handCircle` = smooth slightly imperfect overlapping ellipse. Halve graphite grain on thick strokes (output ring/leader at 0.0005 m showed a dashed-hatch pattern).
- **Tests to add:** per-stroke turning angle between consecutive segments ≤ 25°, ≤ 1 curvature sign change for non-S/non-`?` glyphs, no self-retrace, pen-width spread ≤ ±10 %, minimum inter-letter gap.
- **Process lesson:** render the actual strokes to a PNG with PIL and compare to the two reference images BEFORE any scene capture, then capture t = .15/.17/.24 at 1440×900 and 390×844 and look at them yourself. The previous agent's PIL preview "looked human" but the in-scene render did not; do not accept a sub-agent's self-assessment. The owner stopped the agent that produced the rejected hand — only start a new one if the owner says so (or do it directly).
- Output note was lowered (`oTop` .102 → .088, commit `aeb1ee7`) because it overprinted the AIR MOTOR callout on the whole-sheet view; **re-check** on a converged frame (t = .24 and .29, desktop and narrow) — not yet captured after the move.

### What is done and committed (verified by tests unless noted)

- Tests: 41 files / 433 tests, `tsc --noEmit` clean, B1/B2 contract 31 PASS at `2831f35`. (Re-run after the redo.)
- **O1** electrical burst/hold score + interior branches (verified in captures `after-o1`); jagged triangle-wave shard tunnel walls `4035be9` (captures `after-o1b`; desk-exposure / far-closure sightline proofs NOT re-run — do it in P5). Mouth contour is still the exact torn contour (paper/rim/desk cut are authored against it); only walls got jagged.
- **O2/O3/O4** notes content, Detail B on the sun gear (red circle + routed leader + arrow), close-reading remap and shots, headline card 2 moved to the traverse between reads (`IntroTitles.tsx` window [.172,.222]), title block / career rows. Verified in `after-p1e` (desktop + narrow). Optional translucent second layer: **not adopted** (see `handwriting-humanization.md`).
- **R1/R2** ring hole plug + knurl seam fix; **S1** cutter composition; **S2** FOS presentation with camera retuned to the real panel rects (`camera.test.ts` desktop model block x57.6–397.6/py148–246, FOS bar x1342–1420/py148–488; narrow compact block py346–392); evidence `after-s2b`. **S3** normal repair `normalRepair.ts` (creased angle-weighted + revolved-surface azimuth snap): streaks on journals/hob flank removed, residual **relief-groove lumpiness at 10.9 s is geometric** (flat-shaded capture shows facets) — report honestly to the owner, re-meshing the shaft in CAD would be the real fix.
- Docs/spec §5/TODO/README/evidence index and the updated verifier scripts are committed (`714dadb`). Plan checkboxes: 21 ticked, 40 open, each with an inline status.

### Not done / open (in priority order)

1. Handwriting redo (BLOCKER 1) and re-capture; then ask for owner visual approval separately.
2. **Run the verifier rosters on a fresh :4173 build** — the updated `verify-shaft-inspection.mjs`, `verify-ring-inspection.mjs` (+ `scripts/lib/seam-roi.mjs`), `verify-jgun-opening.mjs` were edited by a sub-agent and **have never been executed**; expect assertion/threshold fixes (the seam-ROI ratio 0.4 is uncalibrated; opening verifier reads the `uReveal` uniform which may not be reachable; the cutter-right check is a scene-graph projection). Opening needs `--url=http://localhost:5199` (dev) or the :4173 preview as the others; use `--quick` for iteration. Never relax a tier expectation to pass. One verifier shaft run was started and interrupted — no results exist.
3. **Regenerate the precomputed drawing cache** (`public/drawing/jgun-sheet-v2.bin.gz` says `cacheVersion: 5`; code is v7, so every load falls back to the live bake). Probe `scripts/precompute-drawing.mjs` under SwiftShader; if it cannot run here, record it as a Windows-side step. Then regenerate drawing/poster stills and the static shaft stills; check reduced-motion/poster paths stay DOM/stills-only with zero CAD requests/canvases.
4. `window.__drawingProof` extensions (sampled score values, branch counts/extent, annotation identity/bounds, camera anchors) — not started (`DrawingLinework.tsx`, hook installed near line 663).
5. O4 title-block capture at t .065–.10 (code/tests only so far); tablet 768×1024 captures for P1 acceptance; O1 fixed-rate timing capture (first 10 % = .20 s etc.); S3 ±.05 s artifact assertions; `stampScale` is sampled in `script.ts` but `ShaftStoryLayer.tsx` still plays the CSS stamp impulse.
6. Inherited **G6** (desktop-full opening tier drop, cause unknown) stays open and honest. Windows hardware-GL verification stays open: ALL captures so far are bundled Chromium + SwiftShader under `?qualityLock`, which is not a hardware pass.
7. Independent Opus/Astra review with a served-model receipt, then the final commit/push. Do not push to another branch, do not open a PR, never commit `.scratch/`, never regenerate the protected GLBs.

### Practical notes for the next session

- Cloud environment: bundled Chromium + SwiftShader, ~1–2 min per capture. `scripts/lib/browser-launch.mjs` handles launch; `scripts/capture-owner-revisions.mjs --only=ring|ringmask|shaft|opening --times=... --viewports=desktop,narrow --nogate` (use `--nogate` for rupture-era times; the camera-convergence gate times out there). `scripts/diag-shaft-artifacts.mjs --times --variants --viewport=390x844` captures shaft frames (waits 12 s after entry; early shaft captures otherwise show the narrative).
- Rebuild + restart the :4173 preview after every code change and verify bundle hashes before judging a capture; keep `pkill -f`/`pgrep -f` patterns out of your own command line (they match the shell and exit 144) — put them in a script file.
- Delegating to sub-agents is encouraged by the owner (parallel docs/verifier/code work worked well), but give them disjoint files, forbid commits/captures, and verify their visual claims yourself.
