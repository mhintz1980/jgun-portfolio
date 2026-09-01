# INBOX — Five-plans synthesis: unified visual & animation direction

**Status:** untriaged draft. Assign JG-### work IDs at triage per `project/README.md`
(the owner-spec portion is already filed as [`animation-redo.md`](animation-redo.md)).
**Sources:** `C:\Projects\five-plans\Plan1.md` … `Plan5.md`, graded 2026-09-01 against repo
head (`11f4173`, 1 unpushed docs commit) + standing owner rulings. Review method:
`code-review-and-quality` (5-axis, adapted to plan documents) + `idea-refine` (converge,
Not-Doing discipline) + `spec-driven-development` (capability map) +
`planning-and-task-breakdown` (phase/AC structure) + `doubt-driven-development` (adversarial
pass, logged in Appendix B). All repo facts below verified via codebase-memory + targeted
reads (file:line cited); plan-internal numbers that could NOT be verified are marked
**UNVERIFIED**.

---

## 1. Chapter-number map

Owner docs and repo docs use different chapter numbers. This plan uses **repo numbering**
throughout: CH.01 JGun hero → CH.02 "Inside the Reduction Train" → CH.03 "Airflow Against the
Noise Floor" (RL-300, station 2) → CH.04 "From Point Cloud to Production Code" (M249).
Owner-spec "CH.01" spans repo CH.01–CH.02; owner-spec "CH.02" = repo CH.03; M249 (repo CH.04)
is owner-deferred. Full table: `animation-redo.md`.

## 2. Verdict summary and the Plan1/2-vs-Plan3 tension

| Plan | Grade | One-line verdict |
|---|---|---|
| Plan 1 — "Unified WebGL pipeline" | **C** | Good instincts (badge occlusion, asset budgets) wrapped in a stale repo map: proposes building backgrounds, particulates, ACES, FOV animation, and DPR scaling that already exist. |
| Plan 2 — "Artistic Direction Master Plan" | **C+** | Strongest prose, weakest grounding: its progressive-staging and zero-collision axes are real gaps; its heatmap suite, damped-chase camera blueprint, and LOD/detect-gpu stack fail scope, determinism, and dependency discipline. |
| Plan 3 — "Visual Direction v2" | **A−** | The only plan that verified the repo first and self-disclosed what it could not see. Corrective thesis is right. Adopted as the governing frame with two softenings. |
| Plan 4 — "Owner Spec v2" (agent-elaborated) | **B** | Rich cinematic elaboration of the dictation; ~12 additions are NOT owner-ruled and several conflict with the dictated beats or locked look. Treated as an options sheet, filed in `animation-redo.md`. |
| Plan 5 — "Owner spec v1" (condensed) | **A** | Canon owner dictation + filing instruction. Executed verbatim as the consolidated `animation-redo.md`. |

**The tension, resolved (explicit recommendation):** Plans 1/2 prescribe *feature stacking*
toward Oryzo/Gemini; Plan 3 prescribes *restraint* — art direction, camera continuity, text
restraint, load behavior — and warns that Lusion themselves rejected "more real-time render
complexity" as the route to their look. **Plan 3's frame wins.** Evidence, not taste:

1. **Plans 1/2 misread the repo.** They propose building: living backgrounds (= JG-023 layers,
   armed CH.01/02/04), GPU particulates (= AirflowField's single-draw point system,
   `AirflowField.tsx:268`, plus AcousticBaffleField's wavefront rings), ACES tone mapping (=
   `PostProcessingComposer.tsx:141`), camera FOV animation (= `CameraRig.tsx:405`, goals
   42/36/36/35 + inspect 22–34), cursor/pointer parallax (= `CameraRig.tsx:393-394`), idle
   life at rest (= `TorqueWrenchHero.tsx:292-298`), dynamic resolution (= `PerformanceMonitor`
   + `DPR_STEPS`, `SceneCanvas.tsx:25,189-200`). A plan that re-proposes shipped systems
   cannot be the build order.
2. **The perf budget is real and tight.** Governing gate (made quantum-aware per the JG-023
   evidence ruling): p95 ≤ the display's vsync quantum (the 16.7 ms literal was
   upheld-as-disclosed against this display's measured 16.80 ms quantum — the evidence
   recommends quantum-aware gates so future work doesn't inherit a false-red), max ≤ 50 ms,
   zero PerformanceMonitor declines, and Δ vs flag-off ≈ 0 as the operative regression check.
   There is ~0 headroom for always-on post passes like DOF + grain + vignette + leaks + N8AO.
3. **The look is owner-locked.** The JG-021 glow saga (6 experiments run of 7 numbered; the
   airflow-off run was skipped by owner ruling) converged on the current materials/bloom/
   lighting; AgX swaps, bloom re-tunes, and rim-light rigs would re-open a settled ruling.
4. **Owner scope rules.** The animation redo = owner CH.01+CH.02 only; M249 deferred. A
   four-chapter heatmap suite is out of scope by definition.
5. **The owner already dictated the cinematic direction** (Plans 4/5). Where Plans 1/2 agree
   with it (backgrounds matter, seamless continuity), the owner spec owns the work; where
   they disagree, the owner wins.

Plans 1/2 are therefore mined for their few genuine, verified gaps — progressive GLB
loading, badge occlusion fading, asset-size targets — which are merged below with full
source attribution. Everything else lands in §6 (Not Taken).

## 3. Governing rules (any phase that violates one does not build)

Hard rules from `AGENTS.md`: part numbers are identity; never bare-regenerate
`m249-transformed.glb` / `msp-enclosure.glb`; spec §5 + README ladder + rig tables sync in
the same commit as behavior; `.scratch/` never committed; runtime telemetry, never vision
alone; fresh `:4173` after every rebuild; `origin` authoritative — push only after checks and
Mark's order.

Standing rulings carried: no exit button ever (Escape = a11y parity); backgrounds play a
critical role, final layout at the round-table; JG-023 backdrop system is evolved, never
replaced; CH.03 backdrop layer stays held until JG-021's Station-2 ruling closes; panels
opaque + current material look locked; owner scope = CH.01+CH.02 (M249 deferred); measured
reality (`animation-spec.md` §5–§5.4) beats owner prose on ±Z labels.

## 4. Capability map

| Module id | Responsibility | Depends on | Sources |
|---|---|---|---|
| `jg021-close` | Owner visual ruling closes JG-021; capture approved reference frames as the visual baseline; then arm CH.03 backdrop (one-const flip + smoke + uniform re-probe) | — | P3 Gate 0; TODO JG-021; JG-023 follow-up |
| `asset-staging` | Defer `msp-enclosure.glb` + `m249-transformed.glb` fetch off the boot path (idle/scroll-prefetch); no blocking loader after first 3D frame | — (parallelizable) | P2 Ph1; P3 Ph1 |
| `camera-rail` | Replace straight-lerp + per-segment smoothstep with one tangent-continuous path (centripetal Catmull-Rom or cubic Bézier), scroll→arc-length; authored holds stay explicit; keep the goal-is-pure-function + final-damp pattern | `jg021-close` | P3 Ph2; filed intake `inspect-orbit-cutaway-camera-easing.md`; P2 Ph3 (superseded form) |
| `narrative-layer` | Bring CH.03/CH.04 to the CH.01/02 edge-caption language; on-demand case-study disclosure (extend the CH.02 pattern, `Chapters.tsx:182-202`); detailed bullets behind a quiet control | `jg021-close` | P3 Ph3; P2 §D |
| `badge-occlusion` | Fade DOM GD&T badges when scene geometry occludes the anchor (single raycast or depth read per badge per frame budget permitting) | — (P3 domain) | P1 Ph4.3; P2 §D |
| `backdrop-evolution` | Evolve JG-023 layers toward Plan3's A/B/C frequency model + per-chapter palettes (CH.01 warm studio, CH.02 cyan X-ray, CH.03 teal→amber anchor field, CH.04 graphite/violet); zero media, tier matrix, bloom-luminance gate discipline | `jg021-close` (CH.03), **round-table** (layout) | P3 Ph4 + visual table |
| `station-lighting` | Per-station photographic *principles* documented (JGun warm key/edge; enclosure keeps approved palette, airflow field carries color; M249 neutral metal); NO code until owner reopens the locked look | `jg021-close` | P3 Ph6; P1 Ph2 + P2 Ph2 (rejected forms) |
| `inspection-orbit` | Bounded scroll orbit on selected subassembly; scroll past bound (either direction) releases; Escape a11y; no exit button | `camera-rail` | Filed intake; P3 Ph5; owner B4 |
| `cutaway` | P000245 housing cutaway: plain clipping plane FIRST; section shader only if the cut face fails review; single assembly only | `inspection-orbit` | Filed intake; P3 Ph5 |
| `redo-B` / `redo-C` | Owner beats B1–B5 / C1–C6 per `animation-redo.md` | `camera-rail`; B1/B5 + C3/C6 backgrounds also `backdrop-evolution`/round-table; C4/C5 gate on Mark's overlays | P4/P5 |
| `motion-polish` | Timing/acceleration/dwell/text-entrance tuning — LAST, after the rail + beats exist | all above | P3 Ph7 |

**Build order:** `jg021-close` → `asset-staging` ∥ `camera-rail` → (`narrative-layer` ∥
`badge-occlusion` ∥ `backdrop-evolution`*) → `inspection-orbit` → `redo-B` → `redo-C` →
`motion-polish` → (`cutaway`, fenced experiments). *`backdrop-evolution` non-CH.03 layers can
start after the round-table fixes the layout.

## 5. Work items with acceptance criteria + verification gates

Every item inherits the repo-wide gate: `npm run typecheck` + `npm run build` green;
`scripts/check-station2-contract.mjs` green when Station 2 is touched; fresh `:4173`
telemetry after rebuild; full/lite/poster tiers + reduced-motion; same-frame before/after
pairs (owner directive); perf p95 ≤ vsync quantum / max ≤ 50 ms / zero PerformanceMonitor
declines / Δ-vs-baseline ≈ 0 (quantum-aware per JG-023 evidence §"vsync quantum");
bundle ≤ +10 KB min JS / +0 media unless stated. Skill rosters per `session-phases.md`; paths
in `agent-skills.md`. Lazy activation — read each SKILL.md when its phase starts.

### W1 — `asset-staging` (size M; sources: P2 Ph1, P3 Ph1)
Boot loads DOM + fonts + `Default.glb` only; `msp-enclosure.glb` and `m249-transformed.glb`
prefetch on idle / scroll-approach (thresholds proposed at build: ~25% / ~55% progress); no
model pop-in on station entry.
- AC: boot network transfer excludes the two deferred GLBs; hero-ready before either
  finishes; entering CH.03/CH.04 shows no pop-in (settled frames at station entry).
- Verify: network trace at boot + station-entry telemetry, all tiers (record CLS during the
  boot trace — Plan2 Ph1.4 adopted here); note
  `jgun-gearbox.glb`/`jgun-handle.glb` are already staged-but-unloaded derivatives
  (`TorqueWrenchHero.tsx:43-45`) — do not add them to the boot path either.

### W2 — `camera-rail` (size L; sources: P3 Ph2, filed intake, owner B4/C5 needs)
Promote the filed camera-easing intake. One continuous path, tangent-continuous through
internal control points; scroll maps to arc length, not raw spline parameter; keep the
existing final damping layer and the framing-bias/portrait/LCD-orbit override stack; JG-021's
measured keyframes become control points, not casualties.
- AC: finite-difference camera velocity is continuous at segment joins (no zero-velocity
  stall except authored holds); reversing scroll retraces the same path; subject stays inside
  JG-021 framing boxes and out of text-safe areas at 1440×900 / 1280×720 / 390×844.
- Verify: telemetry camera probes at the existing checkpoint set + new join points;
  `__threeCamera` bbox-NDC probes; same-frame pairs at every authored stop.

### W3 — `narrative-layer` (size M; sources: P3 Ph3, P2 §D)
CH.03/CH.04 lose the always-expanded `bg-slate-950/80 backdrop-blur-md` cards
(`Chapters.tsx:207-233`); they gain the transparent edge-caption treatment + an on-demand
disclosure control (the CH.02 `[ + CASE STUDY ]` pattern, `:182-202`). No new design system.
- AC: with disclosures closed, model silhouette and text never collide at authored stops
  (DOM-rect probe vs safe area, desktop + 390×844); page narrative still reads with cards
  closed; keyboard operable disclosure.
- Verify: DOM-rect telemetry (the JG-021 probe method), full/reduced/poster; **owner visual
  ruling at stop points before merge** (P3-domain changes get a Mark pass — JG-021 lesson).

### W4 — `badge-occlusion` (size S/M; sources: P1 Ph4.3, P2 §D)
Badges/anchors currently project unconditionally (`Hotspots.tsx:298-301`, no Raycaster in
file). Add occlusion fade: one raycast (or depth-buffer read) per visible badge, opacity
eased; a11y attributes unaffected (screen readers keep full labels).
- AC: badges fade when the anchor is behind opaque geometry and restore on clear; zero
  per-frame allocation; no regression in the existing stacking-collision logic.
- Verify: telemetry occlusion probes (anchor behind `COMPOSITE_PANELS` at station 2 as the
  test case), frame budget unchanged vs before.

### W5 — `backdrop-evolution` (size M per chapter; sources: P3 Ph4 + P3 chapter table)
Extend `BackdropRig`/layers (gradient + grid today: `BackdropGradientLayer.tsx:55-61`,
`BackdropGridLayer.tsx:49-80`) toward Plan3's three frequencies: A low environmental light
per chapter mood; B an engineering field (CH.03 heat/flow field built from the 7 verified
STATION2_CAD_ANCHORS projected to screen UV — 3–6 anchors, restrained intake→teal→amber
palette, NO FBO); C sparse fine atmosphere. Layer C very light or absent.
- AC: per JG-023's own gate set — flag-off pixel parity, forward/reverse determinism
  (bit-identical backdrop rows at checkpoints), backdrop peak linear luminance < bloom gate,
  tier matrix incl. reduced A/B, bundle ≤ +10 KB / +0 media, telemetry channel per layer.
- Verify: the JG-023 settle-gated capture harness, reused as-is. CH.03 layer builds only
  after `jg021-close`; ALL layout waits for the round-table (standing ruling).

### W6 — `inspection-orbit` + `cutaway` (sources: filed intake, P3 Ph5, owner B4)
Bounded scroll orbit (start 45–75°, tuned per part) after `HOTSPOT_INSPECT_FRAMES` dolly;
scroll past bound either direction releases to the rail; Escape = a11y parity; no exit
button. Cutaway: `THREE.Plane` clipping on P000245 housing only before any custom cap shader.
- AC: orbit is bounded and reversible; release blends back to the rail without a cut;
  contract script stays green; cutaway shows acceptable cut face on the housing only.
- Verify: camera telemetry through enter→orbit→release; same-frame pairs; owner visual
  ruling at stop points.

### W7 — `redo-B` / `redo-C` (owner spec; sizes and split per `animation-redo.md` triage notes)
Build the owner beats exactly as filed there — including the standing constraints
(2020vh re-windowing cascade, ghost-regression dependency, tier fallbacks, sync-commit rule).
Not repeated here; that file is the spec of record.

### W8 — `motion-polish` (size S; source: P3 Ph7)
Only after W2 + W7 exist: acceleration, dwell, target lag, text entrances. Visual rhythm
target: move → settle → understand → reveal → leave. Same-frame pairs at identical frames
for every change.

### Fenced experiments (opt-in only, delete-on-fail)
- Gaussian-splat **passive ambient background** A/B (P3 §10) — never the moving rig; aligns
  with the hybrid-video memory ruling (modal/ambient only, never scroll-scrub).
- LOD geometry variants (P2 Ph1.3) — only if mobile telemetry demands it after W1.
- Sound layer (P4 §2.5) — post-CH.03, owner opt-in, prominent mute.

## 6. Intentionally NOT taken (with sources)

| Item | Source | Why not |
|---|---|---|
| FBO thermal/airflow background field | P1 Ph1.1 | JG-023 layers exist; P3: "Do not start with an off-screen framebuffer"; +2 fullscreen passes vs 0-headroom budget |
| N8AO / AccumulativeShadows contact grounding | P1 Ph2.3, P2 §A.3 | New dependency + per-frame AO cost; look owner-locked; not requested |
| AgX tone-mapper swap / exposure regrade | P1 Ph2.4 | ACES live (`PostProcessingComposer.tsx:141`); re-grades every owner-approved color |
| Bloom re-tune (threshold 0.85–0.92, tight radius) | P1 Ph2.4 | Bloom settings are the settled end-state of the JG-021 glow arc (6 experiments run of 7 numbered; rest 0.25 / threshold 0.6 / peak 0.65) |
| `MeshPhysicalMaterial` upgrade (clearcoat 0.85, anisotropy 0.75, orange-peel normals) | P1 Ph2.1 | Re-opens the owner-approved material set; per-fragment cost on a 0-headroom budget; revisit only if Mark reopens materials |
| Fine-grain dither/lens-grain pass (1.5%) | P1 Ph2.4 | New always-on post pass; banding has never been measured as a defect on this scene — not taken without evidence |
| "Replace flat background" / studio cyc wall | P1 Ph1.2 | False premise — JG-023 layers armed CH.01/02/04; evolve, don't replace (standing ruling) |
| FOV mandate 32–38° telephoto / per-chapter FOV schedule | P1 Ph3.3, P2 Ph3.2 | FOV is already animated (42/36/36/35, inspect 22–34); framing passed 3 owner rounds — locked |
| Dynamic resolution via `<AdaptiveDpr>` | P1 Ph5.2 | Equivalent exists: `DPR_STEPS` staircase + `PerformanceMonitor` decline/incline (`SceneCanvas.tsx:25,189-200`) |
| Damped inertial micro-parallax | P1 Ph3.2 | Already exists as a pointer-parallax override in the camera goal stack (`CameraRig.tsx:393-394`) |
| Draw-call budget <25 / InstancedMesh push | P2 Ph1.2 | Rig already merges per unit×role; draw-call count never measured — a metric in search of a problem; measure first if ever revisited |
| Canvas-dimension lock to eliminate CLS | P2 Ph1.4 | Cheap and sensible — adopted as a W1 verification line-item (record CLS in the boot trace); not a standalone work item |
| Four-chapter heatmap/FEA shader suite | P2 §B, Ph4 | Out of owner scope (CH.04 deferred); violates one-trick-per-chapter; sole survivor = B4 thermal-flash, filed as an owner yes/no in `animation-redo.md` |
| Damped-chase camera blueprint (`damp3` toward targets w/ parallax in target) | P2 §3.B | Stateful chase makes the camera history-dependent; the repo pattern (goal = pure f(progress), final exp-damp) preserves reverse-scroll retracing — keep the repo pattern |
| `detect-gpu` + geometry tiering | P2 Ph1.3–4 | New dependency for what PerformanceMonitor already adapts; LOD stays a fenced experiment |
| Audio-haptic accents | P2 Ph6.3 | Not owner-requested; P4 defers it too; fenced experiment |
| CH.02 interactive scrub slider | P2 Ph6.2 | Permanent HUD chrome (P3 §13 bans); not requested |
| Full Plan4 elaboration set (slow-mo, thermal flash, orbit range, clamshell peel, paint-strip narrative + flakes, 3D text, cursor states, per-beat post-value table, point-cloud→M249, sound, out-of-scope C6 dissolve, B1 3D sheet — plus the beat-level embellishments: B3 scanline-ghost/shavings/explosion-lines/ring pre-translate, B4 3D HUD, B5→C1 page-turn, C2 hex-pulse/pull-through, C4 capsule tracers/ribbon trails/curl noise, C6 smoke/heat-shimmer, B2 sheet bulge) | P4 | Not owner-ruled; every one now filed for Mark's yes/no in `animation-redo.md`'s elaboration tables; several contradict the dictated beats or locked look |
| KTX2 "because advanced" / new animation library / video conversion / free OrbitControls / new Stage Manager | P3 §13 (P3 rejecting older ideas; adopted) | P3's removal list accepted wholesale |
| Lighthouse 32 mobile / 11 desktop "recorded baselines" | P3 §Result | **UNVERIFIED** — no Lighthouse record exists anywhere in the repo (grep). If real, they live outside git; re-measure before citing |

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Ghost regression (`animation-spec.md` §5.2: `ghostCount` = 0, fade no-ops) | B3's ghost beat reads wrong after redo | Fix or owner-accept before B3 re-windowing |
| 2020vh re-windowing cascade from B1/B2 intro | Every downstream 0.xxx beat shifts | Remeasure stageWindows/PATH_SEGMENTS/hero windows together in one commit set |
| `Default.glb` 8.4 MB eager (P1's <4 MB budget is aspirational, not contract) | First-load cost dominates | W1 removes the *other* GLBs from boot; a JGun re-export pass is ask-first (rig names at risk) — separate decision for Mark |
| Chapter-number confusion (owner vs repo) | Wrong chapter edited, wrong backdrop armed | Map pinned in §1 + `animation-redo.md`; cite repo numbers only |
| Parallel-agent commits to main | Contention | Worktree verify, explicit paths, re-check git mid-task (standing memory) |
| Post effects creep (ripple pass B2, DOF) on 16.7 ms budget | Perf gate failures late | Each new pass is tier-gated + scoped + measured before the next lands (JG-023 discipline) |

## 8. Open questions for Mark (decision list)

1. **JG-021 final visual ruling** — already pending; gates CH.03 backdrop arm + W3/W5/W6.
2. **Round-table session** — gates all background layout (W5, B1 sheet, B5 table, C3 backdrop).
3. **Plan4 elaboration sheet** — the 22-row yes/no table in `animation-redo.md` (slow-mo?
   thermal flash? orbit range? clamshell vs dictated cross-section? paint-strip narrative?
   3D text? cursor states? sound? scanline ghost? explosion lines? hex pull-through? ribbon
   tracers? heat shimmer? etc.).
4. **Camera-rail promotion** — confirm `camera-rail` (W2) as the next JG-### after JG-021
   closes, before redo beats are authored.
5. **W1 prefetch thresholds** — idle-based vs scroll-percent (25%/55% proposed) — either is
   buildable; owner preference only.
6. **`Default.glb` size** — invest in a rig-safe re-export/reduction pass later? (ask-first;
   NOT a bare gltfjsx regen.)
7. **Splats/LOD/sound fenced experiments** — want any of them scheduled, or leave unfenced
   ideas in the inbox?

## Appendix A — per-plan critique grids

Axes: **Feas** = feasibility vs current repo; **Perf** = risk vs 60fps budget; **Art** =
art-direction value; **Scope** = discipline; **Rul** = consistency with standing rulings;
**Fact** = factual grounding vs repo. Grades: strong / mixed / weak.

### Plan 1 — Unified WebGL pipeline (C)
| Axis | Grade | Evidence |
|---|---|---|
| Feas | mixed | Stack versions correct (React 19.2.8, R3F 9.7.0, three 0.185.1, Tailwind 4.3.3 — `package.json`); but 6 of its Phase 1–3 systems already exist (JG-023, AirflowField, ACES, FOV animation, idle motion, DPR scaling) |
| Perf | weak | FBO field + N8AO + grain + heat-map blend are all always-on candidates against a 16.7 ms p95 with vsync-quantum headroom ≈ 0 |
| Art | mixed | Occlusion-aware badges and asset budgets are genuinely good; thermal/FEA toggle is decorative without data ("not simulation data unless real simulation data exists" — P3) |
| Scope | weak | No engagement with owner scope, JG-021/023 state, or the locked look |
| Rul | weak | Bloom/threshold + cyc-wall + AgX proposals contradict locked look + evolve-don't-replace ruling |
| Fact | weak | "Background is never… reacts to orientation" — background was already procedural+scrubbed; "generic HDRIs" — actually PMREM RoomEnvironment with station-scoped crossfade (`SceneCanvas.tsx:38-58,138`) |

### Plan 2 — Artistic Direction Master Plan (C+)
| Axis | Grade | Evidence |
|---|---|---|
| Feas | mixed | Progressive staging + card slimming buildable today; LOD/detect-gpu/heatmap suite all new builds with no owner mandate |
| Perf | weak | 6-axis post stack, DOF everywhere, per-chapter FOV churn — uncosted; "≥55 FPS" target is *looser* than the repo's verified p95 gate |
| Art | strong | The five axes name the right qualities (momentum, atmosphere, restraint); best-written plan |
| Scope | weak | Four-chapter shader suite + scrub slider + audio collide with owner scope and one-trick-per-chapter |
| Rul | mixed | Zero-collision typography honors JG-021's safe-area work; OrbitControls-unlock inspection conflicts with controlled-rail canon (P3 Rule 4) and the intake's bounded design |
| Fact | mixed | Camera critique half-right (misses that segment 1's target uses triple-smoothstep and segment 2 is an arc — `caseStudies.ts:322-323`, arc impl `:341-355`); "draw calls <25" never measured |

### Plan 3 — Visual Direction v2 (A−)
| Axis | Grade | Evidence |
|---|---|---|
| Feas | strong | Every phase maps to a verified file/state (BackdropRig, Chapters cards, PATH_SEGMENTS, JG-021 gate) |
| Perf | strong | Explicitly defers heavy effects behind loading + composition; keeps the existing gates |
| Art | strong | "Measured Machine Cinema," one-trick-per-chapter, move→settle→understand→reveal→leave |
| Scope | strong | Removal list (§13) is the discipline the other plans lack |
| Rul | strong | Evolve JG-023, no exit button, CH.03 hold, JG-021 Gate 0 — all match standing rulings |
| Fact | mixed | Camera/cards/backdrop claims all verified; the Lighthouse 32/11 "recorded baselines" are NOT in the repo (**UNVERIFIED**); honestly self-disclosed it could not screenshot the site |

### Plan 4 — Owner Spec v2, agent-elaborated (B)
| Axis | Grade | Evidence |
|---|---|---|
| Feas | mixed | Beat structure buildable; ~20 new files + DOF/time-dilation/post-stack is a 10–13-week program claimed without perf budgeting |
| Perf | weak | Per-beat post-value table + always-on atmosphere stack + DOF rack-focus — uncosted vs budget |
| Art | strong | Transition grammar (shared elements across cuts) and "causality over choreography" are the best ideas in any plan |
| Scope | mixed | Stays in CH.01+02 mostly, but C6→M249 dissolve exits scope; 12 unruled elaborations (filed for Mark) |
| Rul | mixed | Preserves no-exit-button; backgrounds-first honors the standing note — but finalizes an Atmosphere system the round-table owns, and clamshell/slow-mo/±120° alter dictated beats |
| Fact | mixed | Integration points named correctly (cloneMaterials, GdtSymbols, HOTSPOT_INSPECT_FRAMES); calls reduced-motion a "tier" (it is an orthogonal boolean, `qualityStore.ts:23`); "m249 GLB when ready" — it has shipped since JG-015-era |

### Plan 5 — Owner spec v1 (A)
| Axis | Grade | Evidence |
|---|---|---|
| Feas | strong | Reuse-vs-new table verified accurate line-by-line (file:line checks in `animation-redo.md`) |
| Perf | strong | Tier-fallback + same-frame + telemetry constraints carried verbatim |
| Art | strong | It is the owner's voice — the reference all other plans answer to |
| Scope | strong | CH.01+02 only, M249 deferred, inputs enumerated |
| Rul | strong | Encodes every standing ruling including no-exit-button and measurements-win |
| Fact | strong | Filing instruction executed this session; constraint list matches repo scripts |

## Appendix B — adversarial pass record (doubt-driven-development)

A fresh-context adversarial reviewer (read-only subagent, disprove bias; received ARTIFACT +
CONTRACT only — no author reasoning, no verdicts) reviewed both draft documents before
commit and checked ~25 file:line citations plus all five source plans itself. Cross-model
second opinion: **skipped — non-interactive autonomous session** (announced per skill
policy; Gemini/Codex CLIs not invoked without explicit owner authorization).

**Result: 8 findings — 3 MAJOR, 5 MINOR. All 8 classified valid + actionable and fixed in
the filed versions.** One cycle; no second fresh-context pass (the fixes are mechanical
corrections of the flagged text; re-reviewing an unchanged artifact returns the same
findings).

1. MAJOR — AcousticBaffleField described as "one draw call" particulates; it is ~11
   wavefront-ring meshes (`AcousticBaffleField.tsx:32-33,209-232`). Fixed §2 point 1:
   AirflowField is the single-draw system.
2. MAJOR — The 16.7 ms p95 gate was presented as plainly "verified" although the JG-023
   evidence rules it **upheld-as-disclosed** against this display's 16.80 ms vsync quantum
   (no build can measure p95 < 16.8 here). Fixed: gate restated quantum-aware in §2 and §5.
3. MAJOR — "Each [Plan4 elaboration] filed for Mark's yes/no" was false: ten beat-level
   embellishments were missing from `animation-redo.md`'s table. Fixed: table extended to
   22 rows.
4. MINOR — Inspect FOV range is 22–34, not 20–34 (20 belongs to the shift-zoom hold,
   `caseStudies.ts:443`). Fixed in §2 and §6.
5. MINOR — Glow saga: 6 experiments ran of 7 numbered (exp 2 skipped by owner ruling,
   JG-021 evidence). Fixed in §2 and §6.
6. MINOR — The 45–75° orbit figure was misattributed to the filed intake; it originates in
   Plan3 Ph5 (the intake leaves the range open). Fixed in `animation-redo.md`.
7. MINOR — Four Plan1/2 proposals had no disposition (CLS dimension lock; clearcoat/
   anisotropy material upgrade; lens-grain pass; damped micro-parallax). Fixed: §6 rows
   added (micro-parallax → already exists, `CameraRig.tsx:393-394`; CLS → folded into W1
   verification; the other two → not taken with reasons).
8. MINOR — Segment-2 "arc" was cited to `PATH_SEGMENTS` (`caseStudies.ts:254-259`) instead
   of the arc implementation (`:341-355`). Fixed in Appendix A.

Reviewer verdicts on the drafts: clause A (citation accuracy) REFUTED → corrected as above;
clause B (complete triage) REFUTED → corrected as above; clauses C–H (rulings, unverified
marking, owner-voice separation, chapter map, internal consistency, no fabricated work)
COULD-NOT-REFUTE as-is.

## Appendix C — sources

- Plans: `C:\Projects\five-plans\Plan1.md` … `Plan5.md` (read in full this session).
- Rulings/canon: `AGENTS.md`, `TODO.md`, `project/context/architecture/animation-spec.md`
  §5–§5.4, `project/context/session-phases.md`, `project/README.md`, standing memories
  (JG-021 glow saga, JG-023 X1, owner 08-31 dictation).
- Verification sweep 2026-09-01: all `file:line` cites in this document (Explore subagent +
  main-agent greps against repo head `11f4173`).
