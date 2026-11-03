# Handoff — JG-040 HUD Stage 1 shipped (D + inline), owner visual review open

Date: 2026-11-03. Intended workspace: **`C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`**
(worktree of jgun-portfolio, branch `torque-wrench/rebuild`).

## Owner ruling and scope

Mark chose **HUD concept D (A+ museum caption) with inline technical content** on 2026-11-03
("Lets go with D and Inline"), from the v2 concept packet
(`project/work/evidence/design-os-hud-trial-2026-10-31/`, doc 07 + `comparison-sheet-v2.jpg`).
Ruling recorded in `docs/torque-wrench-rebuild/00-owner-rulings.md` § 2026-11-03. JG-040 is
registered: [plan](../project/work/plans/JG-040-hud-d-inline.md) ·
[evidence](../project/work/evidence/JG-040-hud-d-inline/README.md) · TODO/INDEX updated.

## What shipped (Stage 1) — uncommitted working tree

- **New:** `src/scene/torque-wrench/TorqueHUD.tsx`, `src/scene/torque-wrench/torque-hud.css`,
  `project/work/plans/JG-040-hud-d-inline.md`, `project/work/evidence/JG-040-hud-d-inline/`
  (README + 6 parity stills + checks.json).
- **Modified by this session:** `conductorRuntime.ts` (additive `torqueLenisScrollTo` +
  optional `scrollTo` on the Lenis interface + latest-instance tracking),
  `Story.tsx` (export `CHAPTER_COPY` + `InspectionControl`; story `inert`+`aria-hidden` and
  no InspectionControl in live mode), `TorqueWrenchPage.tsx` (mounts `TorqueHUD` when live),
  `torque-wrench.css` (live story `visibility:hidden`; dead inspection-fixed rules removed;
  free-look button bounded 42/44 px), `TODO.md`, `project/work/INDEX.md`,
  `docs/torque-wrench-rebuild/00-owner-rulings.md`, trial `decision.md` (RESOLVED note).
- **Pre-existing dirty state:** the branch carries ~40 modified paths from prior/concurrent
  sessions (publication evidence 74 lineage) plus other untracked material. `TODO.md`,
  `INDEX.md`, and `00-owner-rulings.md` already had edits before this session — this
  session's changes stack on top. Preserve all of it; nothing was committed or pushed.

## Key implementation facts

- **ScrollTrigger/beats/pacing/cameras untouched** (owner asked; 486/486 torque-wrench tests
  unchanged confirm). Rail seek maps each chapter's first **beat window** start through the
  existing `torqueScrollFraction` inverse pacing map and scrolls via the conductor's own
  Lenis (`torqueLenisScrollTo`) — never native scroll fighting Lenis.
- Live mode hides the flowing story (`visibility:hidden` + `inert` + `aria-hidden`); the
  pacing grid tracks and static/poster modes are untouched. The HUD is the story's visible
  equivalent (`aria-live` caption). `InspectionControl` renders exactly once per mode
  (HUD in live, story otherwise) so `#torque-inspection-detail` never duplicates.
- HUD accents use the approved concept's warm gold; the page's older chrome uses cyan.
  Palette unification is an open owner-review question (recorded in the plan), not a defect.
- Verification this session: typecheck clean; 53 files / 486 tests pass; build clean;
  dual-viewport browser smoke (`.scratch/jg040/hud-smoke.cjs`) incl. rail seek landing
  Mechanism at narrative progress 0.461; 6/6 parity stills at .418/.735/.940; zero console
  errors. Framing gates (`verify-torque-camera-hud.mjs`, HUD-rect clearance) were **not**
  re-baselined — deferred per the 2026-10-31 owner policy; no threshold weakened.

## Exact next actions

1. **Owner visual review of the shipped chrome** (open now). Preview: from the repo run
   `npx vite preview --port 5341` then open `http://localhost:5341/torque-wrench/`
   (a server may still be running on 5341 from 2026-11-03). Review against the concept
   sheet `comparison-sheet-v2.jpg`; note deviations (caption anchoring feel, rail legibility
   over bright geometry, mobile Chapters bar, gold-vs-cyan accents).
2. On owner feedback: fix within Stage 1 scope, or promote items to Stage 2.
3. **Stage 2** (plan § Stage 2): framing/HUD-rect re-baseline + `verify-torque-camera-hud`
   update for the new chrome geometry; tracked caption→shaft leader via the anchored-callout
   system; fixed brand mast decision; live Min-FOS value sync into the inline strip;
   reduced-motion/poster caption parity; motion review of the new chrome.
4. Commit boundaries: commit/push/deploy only on owner instruction; if committing, keep
   prior-session dirty files out of the JG-040 commit unless the owner rules otherwise.

## Boundaries and approval state

- Owner approval covers the **direction** (D + inline) and Stage 1 implementation work, not
  visual acceptance of the shipped chrome, Stage 2, deployment, or merging.
- Do not restore the old main-site HUD, do not weaken framing thresholds to clear gates, do
  not regenerate protected assets (`public/models/Default.glb`), and do not treat evidence
  73/74 items as fixed by this change.
- Concept-trial servers/prototype (`:8780/:8781/:8782`, temp workspace
  `%TEMP%\design-os-hud-trial-2026-10-31\concepts-v2-1102-zcode`) are disposable review
  artifacts; the trial evidence folder in-repo is the durable record.
