# Scrubbed backgrounds — scroll-scrubbed procedural backdrop layers

**Status:** proposal (untriaged). Not an implementation authorization. Suggested ID at
triage: **JG-023** (next free; INDEX highest is JG-022). Companion skill roster:
[`scrubbed-backgrounds-skill-roster.md`](scrubbed-backgrounds-skill-roster.md).

**Source material:** 2026-08-31 owner kickoff ("backgrounds that scrub along with the
scroll animations"); full architecture design from the 2026-08-31 plan-mode session
(2 Explore sweeps + direct verification — do not re-derive); 2026-08-31 owner review of
the design, whose 8 corrections are folded into this document as binding constraints
(see Correction record at the end). P1 roster skills were read directly per the
deactivation protocol: scroll-scrubbed-visual-sequence (native scroll = source of truth,
same scroll → same state), animated-3d-video-sites, scroll-film-studio,
build-awwwards-quality-sites, glsl-transition-shader-pipeline.

**Plan impact:** does **not** change JG-021, but overlaps its open files (SceneCanvas
StudioRig region; the bloom behavior PostProcessingComposer owns) — rollout sequencing is
left to the owner alongside the open JG-021 ruling. Does not change JG-022 (tier behavior
is extended, not altered).

---

## Intended outcome

Per-chapter procedural GL backdrop layers that scrub reversibly with scroll behind all
three stations, replacing the flat `#05070a` background during the flagged pilot — zero
media payload, no new dependencies, and no regression to the owner-approved JG-021 look.
Behind a module-scope const flag; the pilot chapter and further rollout are owner rulings.

## Renderer decision (decided; owner-reviewed)

**Procedural GL layers, renderer-pluggable.** Rejected alternatives, on the record:

- **Video scrub — rejected**, on three legs that each stand alone: seek/decode jank vs the
  PerformanceMonitor 45–60 bounds
  ([SceneCanvas.tsx:188-199](../../../src/scene/SceneCanvas.tsx)); baked SDR cannot match
  the ACES-graded live scene; and it reverses the 2026-08-30 standing note (jgun video =
  modal/ambient, never scroll-scrub). 4 chapters × 2–6 MB of clips would also add payload
  on the order of the entire current geometry load. *Supporting note only:* the orzo
  roadmap's "< 5MB total geometry budget"
  (`docs/orzo-style-portfolio-implemetation-roadmap.md:48`) signals the intended payload
  discipline, but it is a **geometry** budget and `public/models/` already exceeds it ~4x
  (19.2 MB on disk) — do not cite it as a live constraint.
- **Image-sequence plates — deferred to Rev-2** pluggable path. Frame-exact and
  art-directable, but ~1–2 MB/chapter, needs a decoded-frame LRU, and baked plates fight
  the per-chapter camera moves (FOV moves 22→34 across 18 keyframes in `CameraRig.tsx`,
  from a 42 initial at [SceneCanvas.tsx:176](../../../src/scene/SceneCanvas.tsx)). Rev-2
  needs a `public/textures/` convention + Blender export pipeline.
- **Procedural GL — chosen.** ~0 media payload, infinitely smooth scrub, composites
  inside the live ACES pipeline, reuses proven repo idioms.

**Metrology scaffold (pasted Station-01 proposal): separate intake.** Its Option B
pre-rendered EXR environment is a static N=1 plate — exactly the Rev-2 plate path — but it
conflicts with repo reality: a second `<Canvas>` + drei `<ScrollControls>` would fight
Lenis/ScrollTrigger and the fixed-canvas architecture (dual scroll authorities); its
assets (`jgun-asme.glb`, `metrology-lab-env.exr`, substrate PNG) are invented (none
exist); `envMapIntensity` is a no-op on `scene.environment` in this three version; its
`<Html>` leader lines duplicate HotspotButton/SpatialHotspotAnchor. Salvage for later:
substrate-blueprint underlay idea; Cycles metrology-lab render pipeline note for Rev-2.

## Affected files / system areas

- **New** `src/scene/backgrounds/`:
  - `backdropConfig.ts` — per-chapter palettes; consumes `STAGE_TRANSITIONS` from
    `stageWindows.ts` (wrenchOut `[0.525,0.565]`, enclosureOut `[0.72,0.76]`,
    stageWindows.ts:21-27). Never duplicate window numbers.
  - `BackdropRig.tsx` — imperative per-frame driver + 1–2 **camera-locked** mesh layers
    (gradient/depth plane + optional grid/dust shader layer).
  - Backdrop shaders (unlit, `fog={false}`, authored in linear space).
- **Touch:** `src/scene/SceneCanvas.tsx` (mount `BackdropRig` inside `<Canvas>`),
  `src/state/scrollStore.ts` (add `telemetry.stage.backdropAlpha`; optionally
  `telemetry.scroll.velocity` — see Capture harness).
- **Untouched by design:** `PostProcessingComposer.tsx` (Bloom + FxDriver — post-glow-saga
  owner constraint), `CameraRig`, `SpatialWorld`, `TorqueWrenchHero`, `StaticPoster`
  (poster tier swaps the whole canvas and keeps its own 48px grid DOM background,
  StaticPoster.tsx:16).
- **On accept (triage, same change):** plan → `project/work/plans/JG-023-*.md`, INDEX
  row, TODO line.

## Architecture

**Topology — camera-locked, stated explicitly.** Stations sit 28 m apart
(scrollStore.ts:34-36: `[0,0,0]` / `[28,0,-6]` / `[56,0,-12]`) with hard `visible`
toggles (SpatialWorld.tsx:65-73), and the camera flies between them through what currently
reads as intentional void. The backdrop is therefore **camera-locked** — a moving-skybox
fiction. It is NOT a continuous world: a world-spanning backdrop would become visible
during inter-station flights and change the void read. No cross-station parallax is
promised or delivered.

**BackdropRig (the only new per-frame logic).** Copy the StudioRig smoothstep crossfade
idiom (SceneCanvas.tsx:127-138) — the established progress-bound environment-change
pattern:

- Progress authority: `getScrollState().progress` read inside `useFrame` (zero React
  re-renders). **Never** the laggy ScrollTrigger-written `chapter` flag
  (ScrollRig.tsx:46; AND-gate precedent `287bf05`), and never the hero timeline's
  `scrub: 0.6` proxy — the laggiest channel.
- Per-chapter palette pairs lerped across the `STAGE_TRANSITIONS` windows with the same
  `smoothstep01` shape StudioRig uses.
- `visible = false` on layers whose alpha ≤ 0.001 (stageEnvelope behavior) — zero draw
  calls when a layer is out.
- Zero per-frame allocation: palette Colors, lerped values are module-level, mutated in
  place.

**scene.background / fog rules.**

1. **Mutate in place, never reassign.** `<color attach="background">` at
   SceneCanvas.tsx:200 is a live declarative R3F attach; `scene.background = new
   Color(...)` fights it on any SceneCanvas re-render AND allocates per frame. Use
   `scene.background.setRGB(...)` / `.lerpColors(...)`. Same for fog if tracked:
   `scene.fog.color.set(...)`, `.near =`, `.far =`.
2. **`fog={false}` on backdrop materials (owner decision, 2026-08-31).** Scene fog near
   is 25 m (SceneCanvas.tsx:201), so a camera-locked plane receives zero fog anyway —
   "fog applies" is struck from the procedural rationale. The depth ramp is authored in
   the shader instead, decoupling the backdrop from fog values the pending JG-021 ruling
   could still move. If scene.fog color tracking is kept, it serves **scene-content**
   blending during inter-station flights, not the backdrop.
3. **Keep the base `scene.background` near-black** (tier rule — see Tier matrix).

**Flag.** `SCRUBBED_BACKGROUNDS` module-scope const, documented revert value `false`
(`PANELS_OPAQUE` / `AIRFLOW_FIELD_VISIBLE` / `BLOOM_MUTED_AT_STATION2` pattern; no
central flags module exists). `false` ⇒ BackdropRig early-returns ⇒ module no-op.

**Bloom luminance constraint (hard).** Bloom (`luminanceThreshold={0.6}`,
PostProcessingComposer.tsx:134-140) runs **before** `<ToneMapping ACES_FILMIC>` (:141),
so it samples the pre-tone-mapped linear buffer: any backdrop content whose linear
luminance crosses 0.6 blooms, and the halo is indistinguishable from the JG-021 glow the
owner spent five experiments chasing. **Authored backdrop peak linear luminance < 0.6 at
every checkpoint**, verified by measurement (bloom force-disabled vs enabled pixel delta,
or a readPixels probe) — never by eye.

**Telemetry.** Add `telemetry.stage.backdropAlpha` (0..1), written per frame by
BackdropRig, read via `window.__telemetry` (scrollStore.ts:248). Two-line shape: field in
the `TelemetryStage` interface (scrollStore.ts:195-215) + initializer literal
(scrollStore.ts:241) — same shape as JG-017's `transitionIntensity` (:214, :241).

## Tier matrix

| Tier | Backdrop behavior |
|---|---|
| full | gradient + grid/dust layers, bloom/aberration untouched |
| lite | gradient-only (composer lite already drops aberration) |
| reducedMotion | static backdrop at store progress (ScrollRig unmounts; JG-022 local-listener precedent) |
| poster | untouched — StaticPoster replaces the canvas |

**Reduced-motion tone mapping (measured reality, corrects the earlier "no ACES at all"
assumption):** R3F 9.7.0 sets `gl.toneMapping = ACESFilmicToneMapping` on the renderer by
default, and `@react-three/postprocessing` 3.1.1 forces `NoToneMapping` **only while the
composer is mounted** (restored on unmount; PostProcessingComposer.tsx:120 returns null
for poster/reducedMotion). Consequences:

- A backdrop rendered as a **mesh** gets the same ACESFilmic curve in both full and
  reduced tiers (applied at material output vs final buffer — same curve).
- The tier-divergent pieces are: `scene.background` (raw framebuffer clear in
  reduced-motion vs tone-mapped inside the composer buffer in full) and **bloom presence
  (full/lite only)**.
- Therefore: keep `scene.background` near-black (divergence negligible at that luminance),
  author visible content on the mesh, and gate with a full-vs-reduced A/B capture at a
  matched checkpoint (acceptance criterion 7). Do NOT author "post-ACES" values — that
  would double-apply the curve to the mesh.

## Performance budget (measurable restatement)

- +0 media bytes; ≤10 KB min JS; 0 new dependencies.
- ≤2 layers / 2–3 draw calls; `visible=false` when alpha ≤ 0.001.
- Zero per-frame allocation (module-level scratch, mutate in place).
- **Frame-time delta vs the flag-off baseline** at 1080p DPR≤2, integrated-class — this is
  what the repo already measures (no timer-query probe exists). If a GPU-time number is
  wanted, adding an `EXT_disjoint_timer_query_webgl2` probe is explicit build work, not an
  assumption. Fallback if the delta is material: half-res render target, or drop the dust
  layer.
- PerformanceMonitor `[45,60]` one-way tier ratchet (SceneCanvas.tsx:188-199) must not
  fire during verification scrubs.

## Rollout — OPEN OWNER CHOICE, presented neutrally

The original design recommended piloting CH.03. The 2026-08-31 review overturned that:
CH.03 = Station 2, the one station with an open owner dispute about exactly how bright and
glowy it looks (JG-021 unchecked pending the materials-round-3 visual ruling;
`STUDIO_ENV_STATION2` 0.35 / revert 0.5 and `STUDIO_STATION2_SCALE` 0.25 all movable,
SceneCanvas.tsx:110-114). A new backdrop behind that station confounds a ruling that has
not landed. **No recommendation — the owner picks alongside the JG-021 ruling:**

- **CH.01 pilot** — hero station; look already passed owner review; clean attribution if a
  glow question resurfaces; CH.03 rolls after JG-021 closes.
- **CH.03 pilot** — strongest art-direction payoff (the deep-teal hush carries the most),
  but backdrop and the pending JG-021 materials/lighting ruling become mutually
  confounding; a failed owner pass will not cleanly attribute to one or the other.

Either way: `SCRUBBED_BACKGROUNDS` flag ON for the pilot chapter only, owner ruling at a
`?chapter=` stop point, then remaining chapters (per-chapter consts gate each one).

## Art direction concepts

- **A — Per-chapter bench atmosphere** (camera-locked; renamed from "Inspection Bench",
  which promised world continuity the rig cannot deliver): CH.01 warm key pool, CH.02 cyan
  blueprint-grid wash, CH.03 deep teal hush, CH.04 point-dust nebula. All palettes
  authored under the bloom luminance constraint.
- **B — Blueprint Film:** StaticPoster's 48px grid language (StaticPoster.tsx:16) live as
  scrub-parallaxed underlays — lowest identity risk.
- **C — Metrology Plates:** Rev-2 pre-rendered backdrops (out of scope Rev-1).

## Execution protocol (`/unlazy`, orchestrated, adversarial verification)

**Binding on whoever builds this.** Skill activation timing lives in the companion
[`scrubbed-backgrounds-skill-roster.md`](scrubbed-backgrounds-skill-roster.md); this section
is the discipline the roster is activated inside.

### Gates, and how they relate to this document

`/unlazy` Rule zero: the acceptance gates go in a file before work starts. That file is
**not** a third set of criteria — it is derived one checkbox per item from the nine
`## Acceptance criteria` below, with `CHECK:`/`EXPECT:` lines wherever a command can decide
the outcome.

| Artifact | Role | Location | Fate |
|---|---|---|---|
| `GATES.md` + `gates/*.md` | unlazy enforcement ledger, machine-checked | worktree root, **untracked** | discarded at merge |
| Plan `## Acceptance criteria` | the repo's accepted contract | `project/work/plans/JG-023-*.md` | committed |
| Evidence file | measured results | `project/work/evidence/JG-023-*-verification.md` | committed |

Run `node <unlazy-skill-dir>/scripts/gate-check.mjs GATES.md` to execute checks and record
evidence. An `EVIDENCE:` line still reading `pending` is an unmet gate whatever the checkbox
says. A gate that becomes genuinely impossible gets `ABANDON: <gate id> <reason>` in the file
and in the report — never a silent drop.

### Mode: orchestrated, tree depth 4

Per unlazy scale guidance ("tree 4 or 5 for a subsystem"). The driver writes `PLAN.md` plus
one gates file per leaf under `gates/`, then runs each leaf as a **fresh subagent** with a
narrow brief. A leaf brief is the contract plus its gates file — never the driver's history.

**Contracts before fan-out.** L2–L4 all touch `src/scene/backgrounds/`. `PLAN.md` fixes the
module interface, the `backdropConfig` shape, and the `SCRUBBED_BACKGROUNDS` flag name
**before** any leaf launches. Deep effort that does not integrate is waste.

| Leaf | Deliverable | Maps to | Model |
|---|---|---|---|
| L1 | Worktree from `origin/main@287bf05`, `npm install`, `sync-assets.ps1`, typecheck/build/`:4173` green | P0 | strong |
| L2 | `backdropConfig.ts` + `BackdropRig.tsx` core — progress lerp, in-place mutation, flag | Architecture | strong |
| L3 | Gradient/grid layers, `fog={false}` shader ramp, luminance capped < 0.6 linear | Architecture + AC 6 | strong |
| L4 | Tier matrix + `telemetry.stage.backdropAlpha` | Tier matrix, AC 4/7 | strong |
| L5 | Capture harness (settle-gated), determinism + perf runs | AC 2/3/5 | strong |
| L6 | Bundle/asset hygiene, evidence file, same-frame PNG pairs | AC 8 | cheaper OK |

Branch gates at **integration** (L2+L3+L4 merged, interfaces match, no flag drift) and
**verification** (all probes green, evidence complete). Six finished leaves can still be a
broken product; branch gates are where that is caught.

### The adversarial layer (owner directive)

`/unlazy` ships two verification layers — leaf self-check, then parent re-run of the same
checks. A third layer is required here, and it catches what neither structurally can: **a
gate that passes on paper because it was measured in the wrong place.**

**Protocol.** After the parent re-run passes for a leaf, the driver launches a **separate
adversarial subagent** briefed to *refute*, not confirm. It receives only the leaf's gates
file, the diff, and the evidence lines — never the leaf agent's reasoning. It returns either
a refutation with a reproduction, or an explicit "could not refute" per gate. **A leaf is not
done until an adversary has failed to break it.** The adversary reads `review-animations`
for the scrub-feel rubric and `webgl-telemetry-verifier` for probe methodology.

Standing targets — each is a real failure mode identified in this build, not a generic
checklist:

1. **Bloom gate (AC 6) sampled where the backdrop is invisible.** Was luminance measured at
   a checkpoint where `backdropAlpha` > 0.5, or at one where the layer had faded out?
2. **"Pixel-identical" (AC 2/3) captured mid-scroll.** Settle-gated on stable
   `telemetry.stage.alpha`, or taken on a wall-clock timer?
3. **Tier parity (AC 7) compared against the wrong pipeline.** Divergence is
   `scene.background` and bloom presence only — was the mesh compared (should match) and the
   background compared (should not)?
4. **"Zero per-frame allocation" asserted, not measured.** An allocation profile, or merely
   an absence of `new` in the diff? `.lerpColors` into a reassigned target still allocates.
5. **Flag-off revert (AC 2) faked.** Was `SCRUBBED_BACKGROUNDS` actually flipped to `false`
   and rebuilt, or was the diff `git stash`-ed? Only the first proves the revert contract.
6. **Bundle delta (AC 8) against a stale baseline.** Measured against `origin/main@287bf05`
   built in the *same worktree*, or quoted from this plan?
7. **Any number in the final report.** See Correction record item 9 — this failure mode
   already fired once in this document. Re-measure, or label unverified.

### Report audit

At report time, **re-measure every number before stating it**, or label it unverified. Paste
the gates ledger with its `N of N` count. Reports whose numbers are wrong while their
substance is right is unlazy's most reproducible tested failure, and this build is dense with
numbers: 0.6 bloom threshold, 25 m fog near, 22–34 FOV, ≤10 KB, six checkpoints, 28 m station
spacing, 19.2 MB current geometry.

### Optional hard enforcement

unlazy ships a Claude Code Stop hook that structurally blocks ending a turn while gates are
unchecked. It changes harness behavior, so the driver **offers it once and never installs it
silently**:

```
node C:/Users/Markimus/.agents/skills/unlazy/scripts/install-hooks.mjs
```

Removal is `--uninstall`. Everything else in the protocol works without it.

## Acceptance criteria

1. `npm run typecheck`, `npm run build`, `scripts/check-station2-contract.mjs` green in
   the worktree.
2. **Flag-off parity:** `SCRUBBED_BACKGROUNDS = false` is same-frame pixel-identical to
   main at matched checkpoints (same-frame pairs — standing directive).
3. **Determinism:** forward vs reverse scrub → pixel-identical frames at checkpoints
   0.10 / 0.30 / 0.50 / 0.65 / 0.80 / 0.95 via the capture harness below.
4. **Telemetry:** `backdropAlpha` matches stageEnvelope expectation ±0.02.
5. **Perf:** 10 full-page scrubs, p95 ≤ 16.7 ms frame time, max ≤ 50 ms, zero
   PerformanceMonitor decline events; frame-time delta vs flag-off baseline recorded.
6. **Bloom gate:** measured backdrop peak linear luminance < 0.6 at every checkpoint
   (bloom force-off vs on pixel delta, or readPixels probe).
7. **Tier parity:** full/lite/reduced/poster behave per matrix; full-vs-reduced A/B
   capture at a matched checkpoint, divergence documented.
8. **Bundle:** delta ≤ 10 KB min JS; +0 media bytes (asset-and-bundle-hygiene).
9. **Final gate:** owner visual ruling at `?chapter=` stop points, same-frame pairs.

## Capture harness (determinism gate)

`?chapter=` seeds progress once at store creation and only offers 0 / 0.35 / 0.60 / 0.85
(scrollStore.ts:64-109) — it cannot hit the six checkpoints, and Lenis smoothing + async
GLB load mean wall-clock capture races the scene. Harness:

1. Drive `window.__lenis.scrollTo(document.documentElement.scrollHeight - innerHeight)
   * p, { duration: 0 })` (`__lenis` is the established probe surface, scrollStore.ts:50).
2. Settle-gate the capture on `window.__telemetry`: `telemetry.stage.alpha` stable across
   ≥30 frames (|Δalpha| < 0.001) before screenshotting. Note: `telemetry.scroll` has **no
   velocity field today** — if velocity gating is wanted, add
   `telemetry.scroll.velocity` following the same two-line shape as `backdropAlpha`
   (JG-017 `transitionIntensity` precedent, scrollStore.ts:214 + :241).

## Unknowns

- Pilot chapter pick (owner; see Rollout).
- Whether the JG-021 ruling moves Station-2 light values before a CH.03 pilot — palettes
  for CH.03 get authored/finalized after that ruling if CH.03 is picked.
- Whether the dust layer survives the perf budget on integrated GPUs (half-res RT or
  drop-dust fallback specified).
- Rev-2 plates pipeline (format, `public/textures/` convention, Blender export) — deferred.

## P0 (at build kickoff, not planning)

`git worktree add` from `origin/main @ 287bf05` (HEAD level with origin; worktree isolates
this work from concurrent main activity). The worktree needs `npm install` +
`scripts/sync-assets.ps1` — `Default.glb`, `jgun-gearbox.glb`, `jgun-handle.glb` are NOT
in git (only `m249-transformed.glb` + `msp-enclosure.glb` are committed). Serve `:4173`
from the worktree; restart the server after every rebuild (stale server + rotated hashes →
canvas never mounts).

## Revert

`SCRUBBED_BACKGROUNDS = false` ⇒ BackdropRig early-returns; flag-off parity is acceptance
criterion 2. No shared-state changes outside the flagged module.

---

## Correction record (2026-08-31 owner review of the original design)

1. **Bloom is the exposure risk, not "untouched"** — bloom-before-tonemap order means
   linear luminance ≥ 0.6 blooms; hard constraint + acceptance gate 6 added.
2. **"Fog applies" was false** — fog near 25 m never reaches a camera-locked plane;
   owner decision: `fog={false}` + shader-authored ramp.
3. **scene.background mutate-in-place rule** added (attach + zero-alloc).
4. **Camera-locked framing made explicit; Concept A renamed** (no cross-station
   continuity promise).
5. **CH.03 pilot recommendation withdrawn** — presented as a neutral owner choice due to
   the open JG-021 confound.
6. **Reduced-motion tone-mapping mechanism corrected** — R3F renderer default IS ACES;
   divergence is confined to `scene.background` + bloom presence; "author in post-ACES
   space" dropped.
7. **Determinism gate given a real capture harness** (deep links insufficient; settle
   gate spec; velocity telemetry gap named).
8. **No third *record*** — acceptance criteria live in this document's own section
   (template `project/work/templates/plan.md` §Acceptance Criteria) + measured results in
   the evidence file. **Revised 2026-08-31 (second review):** the earlier wording said
   "GATES.md dropped", which contradicts `/unlazy` Rule zero now that unlazy is the
   execution contract. Reconciled in §Execution protocol — the untracked worktree
   `GATES.md` is a machine-checked *ledger* derived from these same nine criteria, not a
   competing record, and it is discarded at merge. Also: "inbox drafts stay untracked per
   current repo practice" was false (README.md, task-spec.md, jgun-handle-rear-redesign.md
   are tracked) — tracked at triage like any intake batch.

9. **Two fabricated/overstretched numbers caught in verification review (2026-08-31)**, both
   in the renderer-decision rationale, both now fixed:
   - *FOV.* The image-sequence deferral cited "FOV 42→34→28→50". All 18 `CameraRig.tsx`
     keyframes run 22–34 (`24,24,22,25,25,28,25,34,30,28,28,26,28,28,26,22,22,24`); there
     is no 42 and no 50 in the rig — 42 is the initial `<Canvas>` fov (SceneCanvas.tsx:176)
     and 50 appears nowhere. The argument survives, the numbers did not.
   - *Media budget.* The video rejection led with "the <5 MB new-media budget". The orzo
     roadmap (`:48`) states a **geometry** budget, and `public/models/` already exceeds it
     ~4× (19.2 MB). Demoted to a supporting note; the three self-standing legs now lead.

   Both are the `/unlazy` "confident wrong number" failure mode, which is why it is
   adversary standing target 7.
