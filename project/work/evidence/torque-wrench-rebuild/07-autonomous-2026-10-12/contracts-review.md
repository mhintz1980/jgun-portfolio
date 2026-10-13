# JG-038 Stage2/Stage3 contract preflight review — final round 2

Date: 2026-10-12 (America/New_York). Reviewer: independent read-only preflight seat. Workspace:
`C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`.

## Verdict

**FIX FIRST — Stage2 is not exit-ready, and Stage3 production extraction remains blocked.** The
architecture is directionally correct, but the accepted interface/evidence must be reconciled
before Stage2 exit. No G0–G9 gate is closed by this review.

Round 1 reviewed the saved contracts and source seams. This final round 2 also inspected the
then-visible Stage2 sources: `beats.ts`, `beatTimeline.ts`, `directorRegistry.ts`, the store,
conductor runtime/wrapper, `Scene.tsx`, `cadGate.ts`, and the current boundary checker. No test,
build, browser/server/GPU run, product edit, Git operation, protected-sibling access, spawn, or
cross-chat message was performed. Product workers remained active; source observations are not a
final implementation review.

## Blockers / required fixes

1. **Pure-timeline evidence is absent.** `contract-v1.md` assigns `beats.test.ts`,
   `beatTimeline.test.ts`, and `directorRegistry.test.ts`; all are absent, and no alternate test
   imports the timeline/registry APIs. Endpoint, invalid-data, mutation, unknown-director,
   reverse/seek/hold, and added-beat/registry fixtures remain unproved. Land and run the named
   tests in the parent-owned test window.
2. **Conductor interface drift.** The saved contract specifies `ScrollConductor props:{store}`;
   visible source requires `{ store, onFailure }` and `Scene.tsx` supplies it. Amend the accepted
   contract and callback/failure ownership, or change the wrapper. Do not exit with contract/source divergence.
3. **Pre-rupture pit metadata.** `breakthrough-trace` (`.36–.395`) is `scene: 'pit'` and
   `director: 'pit'` before pressure/rupture, while design09 forbids a separate pre-emergence
   cavern preview. Reclassify the beat under drawing/breakthrough and the opening director, or bind
   explicitly that `scene` is classification only and pit mount/reveal is gated by rupture/emergence;
   add a `.394999` no-reveal fixture.
4. **Exact skill-WHEN contradiction.** `contract-v1.md` requires timeline lane
   `scroll-scrubbed-visual-sequence`; plan13 says that skill is only for an actually authorized
   image/video sequence and explicitly not the pure beat resolver/live Three world. Remove it from
   the timeline brief unless that scope changes; require `animate` only if that lane authors
   easing/transition behavior.
5. **D1 null flex binding is under-specified.** Current `Extraction` caches a non-null field. Define
   null as an explicit binding: clear cached field/tier state, set `pressureTravel = 0`, recompute
   crossing from retained support/rest-minimum law; add `full field → null → full field` parity checks.
6. **D2 cancellation/fault ownership needs stricter wording.** Check the external signal before
   fetch/decode/install, each side-effecting bake step, and resolve; external abort throws a recognizable
   `AbortError`, never falls back to live bake, and never publishes a result. Install a partial disposer
   from first retained allocation; make cleanup continue-on-error; require exception-safe compound factories
   or disclose pre-return allocation limits; define whether an abort after cache install retains or rolls
   back the CPU cache/`latest` entry.

## Required clarifications

- Bind the registry lifetime now demonstrated by source: immutable `TORQUE_DIRECTOR_IDS`, no
  module-global mutable registration, and instance-scoped `createDirectorRegistry` with complete,
  duplicate-free pure registrations. Its `beatTimeline` edge is type-only and has no CAD value import.
- Record that `subscribeBeat` does not replay on subscribe; consumers initialize from
  `getNarrativeSample()`. The store correctly separates lifecycle snapshots from imperative progress,
  emits lifecycle listeners only for tier/status changes, emits beat listeners only on active-beat identity
  change, copies the listener set during emission, and does not notify lifecycle subscribers for diagnostics.
- Treat `text.ready` as a non-cancellable late-result seam: epoch-check `text.ready.then`, ignore late
  resolution after dispose, and add a late-ready-after-dispose fixture.
- Name the four SKILL.md files claimed by extraction-contracts.md, with exact WHEN, or remove the count.
- Review beat distances against provisional targets: at 44.1 viewports, several major beats are outside
  the approximate 150–250vh starting band (sheet rake ≈309vh; mechanism extraction ≈331vh). These are
  composition candidates, not budget failures, and require motion review.
- Measure or optimize the JSON.stringify state-key work on the scroll-hot path if Stage2/G5 evidence shows
  it is material; precomputed stable beat metadata can avoid per-frame serialization.

## Verified alignments

- Saved extraction-contracts.md §6 correctly requires D-core to wait for “this contract and Stage 2 exit”;
  preparation may overlap, production extraction may not. Any stale “no Stage2 closure required” copy must
  use the saved ordering. Pure extraction math does not reorder stages.
- Pure resolver mechanics visibly cover 0..1 without gaps/overlaps, assign shared boundaries to the next
  beat, include 1 in the final beat, clamp finite out-of-range progress, reject nonfinite progress, and derive
  deterministic state without traversal history. The missing named tests still block exit.
- Registry metadata remains eager-safe: `beats.ts` has no imports; `beatTimeline.ts` imports pure registry
  metadata; `directorRegistry.ts` imports `beatTimeline` type-only; the store’s eager path stays pure; the
  sole deferred browser/CAD entry remains `cadGate -> ./Scene`.
- Store churn contract is satisfied in source: progress is absent from lifecycle snapshots; `setProgress`
  emits no lifecycle subscriber; beat notifications occur only on identity change; diagnostics writes emit no
  lifecycle notification; no frame-level React subscription is introduced.
- Conductor runtime visibly retains Lenis 1.1/`autoRaf:false`, one GSAP ticker callback in milliseconds,
  lag smoothing off, one page-global ScrollTrigger, no numeric scrub, finite rejection/clamping, terminal
  teardown, and scoped cleanup. Browser input/reload/refresh behavior remains to be proved.
- M1 preserves part-number identity, measured rear-extraction ladder, fork −Z travel, ring +Z travel and
  positive rotation, physical display-turn order, planet counter-rotation, and cached destructive rig merge.
  Matched-input legacy parity remains the required G3 proof.
- C1 preserves one private camera writer and separates subject time from authored camera time; the current
  fixed machining camera is not accepted as bullet time. Explicit playback remains a bounded host-arbitrated interaction.
- D2 correctly borrows rather than disposes `DrawingGeometry`, assigns `SheetBakeResult` disposal to the
  sheet director, identity-guards flex-field clearing, and defers snapshot disposal until after bake disposal
  and last frame use, subject to blocker 6.
- All 16 MasterSkillLibrary paths named by plan13 exist, as do the four non-local roster paths. This review
  read docs-first, R3F performance-guard, and CAD rigging skills without repeating the inventory.

## Evidence and gate boundaries

- Stage 0 is closed only as authorization/readiness plus approved verification limits, not runtime performance acceptance.
- Stage 1 is complete only at static-foundation scope: its 14-case/396-assertion roster and zero static CAD
  requests do not prove actual WebGL initialization/context loss, GPU cleanup, hardware GL, final posters,
  performance, or owner acceptance.
- Stage 2 has visible source plus retained baseline/interface evidence only. Pure tests, integrated static/type
  checks, actual browser canonical-progress behavior, and final artifact review remain pending. No Stage2 exit is claimed.
- All G0–G9 remain open. Stage1 evidence may contribute to G0/G7 input but closes no gate.

## Ownership release

This reviewer owned and wrote only
`project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/contracts-review.md`.
That path is released at save. No product, plan, contract, test, script, shared, protected, or Git path
was modified.
