# 30 — JG-038 T1 completion record + next-session handoff (2026-10-19)

## 0. Owner ruling and state

- Owner ruling 2026-10-19 (chat): "all changes are approved. good job." — this is the owner
  acceptance of the T1 lightning/pit pass (satisfies the T3 intent for this work) and it
  authorizes commit + push, superseding the earlier "no commit/push" boundary of doc 29.
- T1 (Argon fixes A incl. D, E, B, C) is complete. Implementation evidence lives in
  `output/playwright/jg038-lightning-20261017/` (frames `argon-final-218..360.png`,
  `timing-argon-after-E.json`, `argon-fix-report.md`). `output/` is gitignored, so the
  report and timing JSONs are preserved in-repo under
  `docs/torque-wrench-rebuild/evidence-jg038-argon-20261019/`; frames are local-only and can
  be regenerated with `frames.mjs` (section 8).
- Gates at commit time: `npx tsc --noEmit` clean; 8 focused test files / 47 tests pass;
  `npm run build` passes; 20/20 frames captured with zero console errors.

## 1. What changed (summary — full detail in the evidence report)

- **Fix A/D** (`PitGeometry.ts`, `privatePitMaterial.ts`, `privateSheetRuntime.ts`): the 226
  icosahedron pebbles are replaced by a 14-ring fold-free stratified cliff-shelf/overhang/
  shear-plane mesh spanning the whole bore (chord-aware reach per contour point); facet
  lighting now orients on `vRockNormal` (fixes the left-gearbox washout and right-handle
  black crush); rock palette darkened to basalt with warm mouth bounce; isotropic squiggle
  veins replaced by fwidth-stabilized ~2 px branching blue fissure bolts; the torn lip is a
  progressive vellum tear (`aLipRoot`/`aLipProfile`) that stays hidden and zero-width until
  `uFracture > .02` — the .310 lip pop-on and z-fighting speckles are gone (`rocks`
  renderOrder 2 + fracture gate + web micro-lift at shatter onset).
- **Fix E** (`ElectricalDirector.ts`, `OpeningDirector.ts`): private 4-burst earthquake score
  (`PRIVATE_BURST_KEYS` 0 -> .24 -> .52 -> .82 -> 1, holds .26/.18/.12 s) and a monotone
  `privateElectricalClock`. Measured on the served build: lights-out -> first burst dropped
  from .0340 (~2,140 px) to ~.0030-.0050 (~190-315 px); zero fully-black scroll; profile
  completes in 4 bursts over .0295 (~1,856 px); the interior web starts immediately after the
  last burst and runs the same burst/hold rhythm to .290; post-web hold and shatter (.3075-
  .31) unchanged. `INTRO_KNOTS`, camera, lamp flicker and shared drawing files untouched.
- **Fix B** (`privateFractureWeb.ts`): Level-0 Voronoi seams subdivided and multi-octave
  jittered; Level-1 primaries from 3-4 hubs plus 16 perimeter-inward trunks now span gearbox,
  clutch, body and handle with strict T-junction termination; 26,602/78,000 vertices.
- **Fix C** (`privateSheetRuntime.ts`): decaying hold afterglow (.68 -> .46) keeps grown
  filaments alive while `burstEnergy` stays exactly zero in holds; ice-cyan core
  (.45, .82, 1.0) with royal-blue additive halo (.02, .26, .98); periodic perimeter saw-teeth
  removed.

## 2. Committed in this change

Src (single-writer set from doc 29 section 4): `PitGeometry.ts` + test,
`privatePitMaterial.ts` + test, `privateFractureWeb.ts` + test, `ElectricalDirector.ts` +
test, `OpeningDirector.ts` + test, `privateSheetRuntime.ts`.
Docs: 23-29 rebuild docs + 29 prompt, references/ (R2-R10 owner images), 00-owner-rulings,
13/21/22 doc updates, TODO.md queue update, agent-skills map, this doc + the 30 prompt,
`evidence-jg038-argon-20261019/` (report + timing JSONs + frame index).

**Deliberately NOT committed (unrelated drift preserved for its owners):** the T5/T4 lane
files (`src/scene/inspection/**`, `InspectionDirector*`, `RingInspection*`,
`RuntimeWorld.tsx`, `TorqueWrenchPage*`, `scrollPacing*`, `torque-wrench.css`,
`PrivatePageNav.tsx`), GATES.md (EOL-only diff), and all bulk PNG evidence under `output/`.
The next session must reconcile this drift with the T5 owner before staging anything.

## 3. Next tasks and the review protocol (owner ruling 2026-10-19)

Every subagent task runs three seats:

1. **Worker** — Claude Sonnet-5.5/High or GPT-6.1-Sol/High implements (code, or a read-only
   review report for T2).
2. **Adversarial reviewer** — GLM-5.3 or GLM-5.3-Flash/High attacks the result read-only
   (diff, frames, timing JSON) and must try to fail it.
3. **Decision approver** — Claude Opus-5.5/High arbitrates disagreements and approves key
   decisions (geometry approach, timing budgets, file ownership, scoring disputes) before the
   task continues or merges.

Any reviewer FAIL stops the task and alerts the owner — no automatic retries. This protocol
supersedes doc 28's Sol-then-Opus lineup; doc 28's rubric and scoring axes still apply.

| Task | Scope | Files | Parallel? |
|---|---|---|---|
| T2 formal review of argon frames | read-only scoring vs R3/R4/R7/R8/R10 + re-run timing.mjs | none | yes (no code writes) |
| T4 gold hob confirmation | one served frame check | read-only + browser slot | yes, but serialized captures |
| T5 C2 Ring Switch knurl relocation | implement + verify (doc 25 section 5 numbers) | beats, MechanismDirector, InspectionDirector, RingInspection, ringAnchor, RuntimeWorld, scrollPacing, torque-wrench.css | file-authoring parallel; captures serialized with T4 |
| T6 C3 bullet time | shatter-coupled super-slow + hob engagement | shares shatter files | only after owner confirms post-T3 scope |
| T7 C1 R9 camera | split vs morph | camera return path | BLOCKED on owner answer — do not implement |

## 4. Skills roster (when to use)

- **Parent/orchestrator**: `orchestration` (seat delegation + proving which model served),
  `parallel-workstreams` (disjoint file ownership, integration evidence),
  `codex-tiers` (model/effort per seat).
- **Every implementer and verifier**: `webgl-telemetry-verifier` — mandatory before any
  measurement, visibility or timing claim (telemetry probes and pixel counts, never vision
  alone).
- **T5/T6 rig + mechanism work**: `cad-scene-graph-rigging`; any scroll-timeline change:
  `r3f-scroll-performance-guard` + `gsap-scrolltrigger` (reference).
- **T6 animation craft**: `animate` / `review-animations` / `improve-animations` plus the
  MengTo canon (`build-awwwards-quality-sites`, `cinematic-gsap-lenis-motion-system`).
- **Deploy/hosting discussions only**: `asset-and-bundle-hygiene`. Structural discovery:
  `codebase-memory`. Session close: `wrap-session` or `handoff`.
- **Do not load** per repo cost rules unless the exact sub-problem needs them:
  `glsl-transition-shader-pipeline` (CadTransitionShader only), `spatial-hotspot-a11y`,
  `reverse-engineer-anything`, `unlazy`, `context-mode`.

## 5. Hard rules (unchanged)

- 5281 is the owner's server: never start, stop or rebuild-serve it; use 5321 for your own
  preview and restart it after EVERY rebuild.
- Never regenerate `public/models/{Default,m249-transformed,msp-enclosure}.glb`; never add
  them to `sync-assets.ps1`.
- `INTRO_KNOTS` and `openingTimeAt` in `OpeningDirector.ts` are frozen (OpeningCamera
  depends on them).
- Keep the depthTest/renderOrder gating at `privateSheetRuntime.ts` ~714/718, the paper
  shards, and the seam/aperture geometry byte-identical.
`src/scene/drawing/**` is shared and read-only — private overrides only.
- Never commit `.scratch/`; stage only your task's files; a reviewer pass is not owner
  acceptance — the owner approves visually at 5281.

## 6. Commands (from repo root, PowerShell)

1. `npx tsc --noEmit`
2. `npx vitest run src/scene/torque-wrench/privateSheetRuntime.test.ts
   src/scene/torque-wrench/privateFractureWeb.test.ts src/scene/torque-wrench/PitGeometry.test.ts
   src/scene/torque-wrench/privatePitMaterial.test.ts src/scene/torque-wrench/privateElectricGeometry.test.ts
   src/scene/torque-wrench/ElectricalDirector.test.ts src/scene/torque-wrench/PitDirector.test.ts
   src/scene/torque-wrench/OpeningDirector.test.ts` (8 files / 47 tests)
3. `npm run build`
4. `npm run preview -- --host localhost --port 5321 --strictPort` (open exec session)
5. `$env:TW_BASE='http://localhost:5321'; node output/playwright/jg038-lightning-20261017/frames.mjs <tag> <fractions>`
6. `$env:TW_BASE='http://localhost:5321'; node output/playwright/jg038-lightning-20261017/timing.mjs <from> <to> <step> <tag>`

Ready-to-paste prompt: `docs/torque-wrench-rebuild/30-START-NEXT-SESSION-PROMPT-2026-10-19.txt`.
