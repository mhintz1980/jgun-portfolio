# G3/G7 functional compatibility preparation — parallel lane, 2026-10-14

Lane: read-only source analysis plus this file only. No verifier was run, no source or shared
doc edited, no new harness created. All commands below are parent-scheduled; parent owns
browser/build/GPU windows and .scratch/stage4-continuity.mjs.

## State snapshot (frozen build s)

Parent integration update: cutter/control runtime roster is now complete on build s, four cases each258/258 with zero errors/unmapped responses; see `functional-cutter-20261014-s/report.json`. Static D/N each7/7 pass in `../05-stage1-integration/runtime/functional-20261014-s-D.json` and `-N.json`. Static verifier rejects outputs outside that owned runtime folder; use unique explicit filenames there and link them in the Stage4 index. Preparation notes below retain their delivery-time snapshot; pending cutter and static lanes are superseded by this update.

- Build `.scratch/jg038-stage4-20261013-s` served at `http://localhost:5288/torque-wrench/`.
  The build root IS the dist root (`assets/`, `torque-wrench/`, `.vite/` directly under it), so
  verifiers take `--build-dir=.scratch/jg038-stage4-20261013-s`.
- `review-manifest-20261013-s.json` generated: 347 source / 6 preserved / 4 reports / 116 PNGs.
- Parent continuity `continuity-20261014-s3-D/N`: 1083 observations each, 0 errors/requests,
  0 intervals >100 ms, maxima 17.1 / 16.9 ms. G5 and continuous clearance remain open.
- Parent cutter roster on build s in progress; D-full 258/258 already recorded.
- Tier URL API: `?quality=full|lite|poster` (`src/shared/pages.ts:91-110`); base URL given to
  verifiers must carry no query/hash — case URLs are derived by the harness.

## Historical PASS (do not re-attribute to build s)

| Evidence | Build | Where |
| --- | --- | --- |
| Static/fallback 14/14 (396/396) | Stage 3 `88e8038e…` | GATES G2/G7, `07-autonomous-2026-10-12` |
| Timeline 17/17 (382/382) | Stage 3 `88e8038e…` | GATES G1 |
| Real `WEBGL_lose_context` → poster/DOM-story fallback | Stage 3 | GATES G2/G7 (drawing-integration F) |
| Cutter/controls 4/4 cases × 258/258 (D/N × full/lite) | Stage 3 `88e8038e…` | GATES G3 |
| Mechanical parity desktop/full 3493 PASS / 0 FAIL / 0 UNVERIFIED | Stage 3 `88e8038e…` | GATES G3 |
| Effects s D/N 70/70, 71/71 served assets | build s | `08-stage4-opening-recovery` README |

## Pending on build s (G3/G7 functional roster)

Static 14/14, timeline 17/17, narrow/lite mechanical parity, remaining cutter lanes (parent
in-flight), and a context-loss re-run have no recorded build-s reports in this folder.

## Dependency-ordered minimal run sheet

Run serialized, preview already restarted post-build. Order: shell/fallback proof first (cheap,
no GPU roster), then mechanical identity lanes, then cutter, then context loss.

1. **Static/fallback roster — G7 core.** Two runs:
   `node scripts/verify-torque-static.mjs --url=http://localhost:5288/torque-wrench/ --viewport=D --build-dir=.scratch/jg038-stage4-20261013-s`
   then `--viewport=N`. Expected: 7/7 per viewport (static-full, lite `?quality=lite`,
   poster-explicit `?quality=poster` with zero canvas, reduced-motion poster floor,
   scene-import-abort and scene-render-throw fallback with story/controls/focus preserved,
   scene-mql-downgrade one-way step-down). Provenance: build-dir manifest byte-checks before launch.
2. **Timeline/input roster — G3 controls + G7 mql/poster cases.** Two runs:
   `node scripts/verify-torque-timeline.mjs --url=http://localhost:5288/torque-wrench/ --viewport=D --build-dir=.scratch/jg038-stage4-20261013-s`
   then `--viewport=N`. Expected: 9 cases D (incl. live-scrollbar-drag) + 8 N = 17/17; native
   input only; forward/reverse equality. Explicit `--out` must stay inside
   `07-autonomous-2026-10-12`; default dir is fine with a fresh harness-stamped report.
3. **Mechanical parity all lanes — closes the G3 narrow/lite-parity line.**
   `node scripts/verify-torque-mechanical-parity.mjs --url=http://localhost:5288/torque-wrench/ --viewport=all --tier=all --build-dir=.scratch/jg038-stage4-20261013-s`
   Expected per lane: 0 FAIL / 0 UNVERIFIED over 10 progress cases × 14 channels across the
   four private/legacy documents; comparison claims require matched renderer/tier/viewport/buffer.
   Historical desktop/full must not be relabeled as narrow/lite evidence.
4. **Cutter/controls roster — parent-owned, in flight.** Same syntax family:
   `node scripts/verify-torque-cutter.mjs --url=http://localhost:5288/torque-wrench/ --out=<NEW dir under project/work/evidence/torque-wrench-rebuild> --build-dir=.scratch/jg038-stage4-20261013-s`.
   Expected: 4/4 cases × 258/258 (D-full done; D-lite, N-full, N-lite remain), geometry
   witnesses (contactRect/subjectTransforms) present, controls incl. Escape → trigger focus return.
5. **Real context-loss fallback re-run — G7 failure line.**
   `node scripts/verify-torque-drawing-integration.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --only=F`
   Expected: injected context loss → poster layer + DOM story/controls intact, no CAD re-import
   (page failure is terminal by design: `TorqueWrenchPage.tsx:12-13,33-36`).

## What existing scripts cannot prove

- **Continuous clearance (G3):** cutter samples 7 progress points (SLOW subset 5) and parity
  samples 10 cases; no verifier proves per-frame clearance across the inspection window. Stays
  with parent continuity/G5 work.
- **WebGL *initialization* failure (G7):** no torque verifier launches a GPU-less browser;
  `verify-torque-static.mjs:33-35` explicitly defers actual WebGL-init acceptance, and
  auto-poster via `qualityStore.ts:32-47` is unexercised. Reuse path if the parent authorizes an
  extension: `launchConfig({ extraArgs })` already accepts extra Chromium args
  (`scripts/lib/browser-launch.mjs`); do not duplicate harnesses.
- **Visible focus / tab order / footer reachability (G7):** `torque-wrench.css:39-41,56` define
  `:focus-visible` and skip-link focus, and the cutter asserts functional focus return, but no
  verifier asserts visible focus rendering or DOM order across header/story/footer.
- **Poster art mapping/provenance:** `torquePosterMap` is empty (`posterMap.ts:19`) — posters are
  labeled placeholders pending Stage 6, so poster-explicit cases prove structure, not final art
  or provenance binding.
- **Final motion/pacing acceptance (G3/G5):** owner decision; no script closes it.

## User-flow findings

No substantive product user-flow bug found in lane scope. Two intended behaviors documented for
reviewers: reduced-motion mid-session change is a one-way step-down to the poster floor
(`tier.ts:17-20`, `TorqueWrenchPage.tsx:33-42`); the inspection Escape handler is a window-level
listener that closes the disclosure and restores trigger focus regardless of focus target while
open (`Story.tsx:44-51`). Both match the authored contract; no fix recommended.

## Limitations

Analysis is static; no command in this file has been executed by this lane. Hardware-render
claims require the parent's Windows Chrome ANGLE/D3D11 launch records; software-GL launches are
never a hardware full-tier pass. Report default locations: static → its owned RUNTIME_DIR,
timeline → `07-autonomous-2026-10-12/runtime-timeline`, parity →
`07-autonomous-2026-10-12/runtime-mechanical-parity`, cutter/effects → new dirs under
`project/work/evidence/torque-wrench-rebuild`. This file prepares evidence; it closes no gate
and implies no acceptance.
