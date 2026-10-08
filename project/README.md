# Project Knowledge Map — JGUN Portfolio

> **Current JG-035 handwriting state, 2026-10-08:** Ac Fast Reference is traced from the owner's `ac-fast.png`, with true font glyphs in the existing text batch, deterministic letter reveal, graphite colour, and retained red/vector marks. Mark accepted the font direction (“close” is enough; “yours looks good”). [Current evidence and handoff](work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/README.md) supersede older handwriting/cache/capture statements below. Full animation acceptance remains separate.

> **JG-035 owner revisions, 2026-10-07/08 — implemented; owner visual acceptance OPEN.** Plan: [registered continuation](work/plans/JG-035-owner-animation-revisions.md) → [checkbox plan](../docs/jgun-owner-animation-revision-plan-2026-10-07.md); evidence: [folder index mapped to O1–O4/R1–R2/S1–S3](work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/README.md). Opening handwriting/camera/electrical score, ring holes/knurl seam and shaft cutter/FOS/normal repair are on `codex/jg033-signature-shot` (`524bdb4`…`2831f35`). Captures used bundled Chromium + SwiftShader software GL in a Linux cloud container (not hardware GL). Open: owner visual approval, inherited G6 desktop-full tier drop, Windows hardware verification, drawing-cache regeneration, static-still regeneration, the final full verifier roster, and visual verification of the all-caps humanized graphite hand (`2831f35`, cache v7; in progress, no capture yet).

> **JG-035 final documentation closeout, 2026-10-06/07.** Start from the [current handoff](work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md) — current-state section first. The owner's [posters-throughout](work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/reduced-motion-owner-decision-2026-10-06.md) policy is verified on the current build (43 files/445 tests, 703 modules, preview PID 16784): lifecycle 14/14, static 4/4 with zero CAD requests, shaft 16 cases / 12 gates / 0 defects at FULL/FULL, B1/B2 31/31. The full opening roster finished 5/6 — desktop-full fails 110 expectations after the effective tier becomes lite, cause unestablished, no waiver. Root G0–G5 are checked; G6 is open solely for that full opening acceptance, and owner visual acceptance remains separate. No commit/push/deploy.

> **Historical — JG-035 recovered implementation, earlier 2026-10-06; superseded by the final release banner above.** Start from the [saved implementation handoff](work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md). The shaft story/runtime, study assets, tools and shared inspection UI exist. Typecheck and 152 inspection tests pass; lifecycle runtime is 12/14 and dedicated shaft verification/final reviews remain open. The planning-only banner below describes an earlier state. G0–G6 closure and owner visual acceptance are still pending.

> **Historical manufacturing planning approval, 2026-10-05.** [Owner model approval and verbatim shaft storyline](context/owner-specs/manufacturing-inspection-storyline-2026-10-05.md), [reviewed Ring Switch/Input Shaft plan](../docs/jgun-manufacturing-inspection-plan.md) and [planning handoff](work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/continuation-handoff.md) capture accepted geometry and parent/Astra/Opus planning agreement. Implementation subsequently proceeded. Use the recovered implementation handoff above for current work and outstanding runtime/owner acceptance.

> **JG-035 revision, 2026-10-03:** Blue-trace / vertical-shaft concepts are owner-approved; runtime implementation and drawing/material corrections are tracked in [the current plan](../docs/jgun-blue-trace-tunnel-plan.md). Older correction evidence below is historical. Runtime owner acceptance remains separate.

> **JG-035 causal portal correction — technically verified 2026-10-02; owner visual review OPEN.** The J-Gun pushes opaque paper from below and is already lit beneath the first rupture; gaps expose deep portal space, never the wooden desk. Storm, fracture, crack light, burned edges, scroll share and downstream mechanism timing are retained. [Active correction plan](../docs/jgun-portal-correction-plan.md). The earlier 184/184 tests, 29/29 B1/B2, six-case roster PASS and technical SHIP belong to the [superseded breakthrough packet](work/evidence/JG-035-opening-drafting-table/paper-breakthrough-2026-10-01/review.md); they do not verify this correction. Current correction checks: 276/276 unit tests, production build/typecheck, 31/31 B1/B2 and Stage 2 PASS. Production captures 2/2 PASS (desktop lite and narrow full), with zero desk pixels in all 12 sampled aperture frames. Runtime roster all 6/6 PASS on the same production build: 344 forward/reverse checkpoints, 96 pinned frames and two reduced-motion static cases, zero failures/errors. The [canonical aggregate](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/verified-roster/summary.json) references four passing full-roster records and two complete repaired forced-lite records. Fresh final read-only review: [Zeno SHIP](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/technical-review.md), with no blocking findings after independent inspection of live source, canonical aggregate and narrow-lite evidence. Technically verified 2026-10-02; owner visual acceptance remains open. [Correction review](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/review.md) · [Handoff](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/handoff.md). Owner visual acceptance remains open. No commit, push or deployment.

This directory contains the durable internal knowledge for the JGUN portfolio. It is deliberately separate from application source and from the concise task queue in [`../TODO.md`](../TODO.md).

> **Rule:** A checked TODO item must link to an accepted plan and verification evidence. A plan without a `JG-###` ID remains a proposal and belongs in `work/inbox/`.

## Required Read Order

1. Read [`../AGENTS.md`](../AGENTS.md) for non-negotiable project rules.
2. Read [`../TODO.md`](../TODO.md) for approved and ordered work.
3. Read [`work/INDEX.md`](work/INDEX.md) for the matching plan ID, status, and evidence.
4. Read the plan in [`work/plans/`](work/plans/) before modifying code.
5. Read relevant durable context in [`context/`](context/), including the named skills in [`context/agent-skills.md`](context/agent-skills.md).
6. After implementation, create or update the linked record in [`work/evidence/`](work/evidence/) before checking the TODO item off.

## Directory Responsibilities

| Directory | Contains | Does not contain |
|---|---|---|
| [`context/`](context/) | Durable architecture, constraints, domain vocabulary, owner specs, skill paths, and source references. | Open work, temporary session notes, and raw task history. |
| [`decisions/`](decisions/) | Dated decisions that remain relevant after their original task is closed. | Proposals or incomplete implementation notes. |
| [`work/inbox/`](work/inbox/) | Untriaged plan drafts and incoming proposals. | Approved work already in the TODO queue. |
| [`work/plans/`](work/plans/) | Accepted `JG-###` plans at stable paths. | One-off scratch notes. |
| [`work/evidence/`](work/evidence/) | Build, telemetry, accessibility, and release evidence tied to a plan ID. | Implementation plan prose. |
| [`work/INDEX.md`](work/INDEX.md) | The registry linking state, plan, TODO entry, and evidence. | Duplicated plan bodies. |
| [`archive/superseded/`](archive/superseded/) | Explicitly replaced documents with a replacement link. | Canonical active specs or plans. |

## Source-of-Truth Boundaries

| Question | Canonical location |
|---|---|
| What is approved and next? | [`../TODO.md`](../TODO.md) |
| What is the full change scope and acceptance criteria? | `work/plans/JG-###-*.md` |
| What evidence proves a task is complete? | `work/evidence/JG-###-verification.md` |
| What is permanently true about the system? | `context/` |
| Why was a durable design choice made? | `decisions/ADR-###-*.md` |

## Opening timing and unchanged canonical ladder

The active opening follows the owner's [portal correction](../docs/jgun-portal-correction-plan.md): registered lit hold .38–.45, five irregular lamp failures .45–.58, visible-dark anticipation .58–.66, glowing profile slit .66–.79, then the J-Gun pushes the paper upward .79–.84. Illumination resolves .79–.81; PBR activates .80–.82, before fracture begins .84. Rupture .84–.88 immediately reveals the already-present J-Gun; its continuous rise runs .79–1, with the pressure push preceding the post-rupture lift. Every exposed profile gap must show opaque, nearly black portal depth with irregular descending walls and white-blue upward light, never walnut. Lamp return .79–.86, perspective .90, `INTRO_SCROLL_SHARE` .50 and reduced-motion park .38 remain unchanged. The print stays opaque (`drawingOpacity = 1`); the perforated sheet remains through global .18 and retires physically .18–.22. These timings are read from the correction source. Current correction checks: 276/276 unit tests, production build/typecheck, 31/31 B1/B2 and Stage 2 PASS. Production captures 2/2 PASS (desktop lite and narrow full), with zero desk pixels in all 12 sampled aperture frames. Runtime roster all 6/6 PASS on the same production build: 344 forward/reverse checkpoints, 96 pinned frames and two reduced-motion static cases, zero failures/errors. The [canonical aggregate](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/verified-roster/summary.json) references four passing full-roster records and two complete repaired forced-lite records. Fresh final read-only review: [Zeno SHIP](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/technical-review.md), with no blocking findings after independent inspection of live source, canonical aggregate and narrow-lite evidence. Technically verified 2026-10-02; owner visual acceptance remains open. [Correction review](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/review.md) · [Handoff](work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/handoff.md). Owner visual acceptance remains open. The earlier [paper breakthrough packet](work/evidence/JG-035-opening-drafting-table/paper-breakthrough-2026-10-01/review.md), storm packets, stages 1–3 and JG-026 opening narratives are historical and superseded where their opening behavior conflicts. Mechanical ladder and downstream windows remain unchanged; the revised extraction pose law and its measured clearance solve are specified in animation-spec §5.0. Enclosure/M249 page separation awaits owner clarification.

B1/B2 occupy global `0.000–0.120` of PROGRESS, which
`pacedProgress()` stretches over `INTRO_SCROLL_SHARE = 0.50` of the
DOCUMENT (owner pacing rulings 2026-09-05 and 2026-10-01). The intro's
normalized axis spends `.00–.38` on focus and drafting, `.38–.45` on the
registered lit hold, `.45–.66` on failures and visible-dark anticipation,
`.66–.79` on the hairline profile slit, `.79–.88` on pressure and fracture,
with model illumination and PBR ready before the first rupture; the model
continues rising to 1. The clearance crossing is solved from transformed
vertices for the current pressure bound, not hard-coded to a phase boundary.
`relativePose` uses a bounded pressure push followed by the u^1.4 lift and
keeps the registered side rotation throughout. Document
height is 3120vh (scroll distance 3020vh); every downstream chapter keeps its
progress span exactly while the main timeline occupies the remaining 0.50 of
raw document scroll.

CH.02 keeps its GSAP ScrollTrigger timeline (`scrub: 0.6`) on
`[data-chapter="1"]`, animating the same proxy object as before: spin
`.12–.47`, gear `.12–1.02`, ghost-in `.27–.47`, explode `.47–.97`,
ghost-out `.54–.79`. Only early CH.01 cues map by `p → .12 + p/3` on
`0≤p≤.18`. Downstream camera/station/LCD windows are unchanged; later
progress is not remapped. Camera damping (`1 - e^-6·Δ`), pointer parallax,
the six-frame pulse shake, the scroll-rest orbit and the gear idle are all
retained — determinism is proved by settle-gating the capture, not by
removing the layers that need to settle.

**Canonical ladder values are unchanged by JG-026:**

| Unit / part identity | Offset (m) |
|---|---:|
| Output spindle P000095 / P000207 | +0.050 |
| Stage 4 A000861 / P003047 | -0.099 |
| Stage 3 A000860 / P003045 | -0.142 |
| Stage 5 A000606 / P001849 | -0.177 |
| Bearing K000004 | -0.197 |
| Stage 2 A000592 / P001837 | -0.230 |
| Stage 1 A000591 / P001836 | -0.255 |
| Clutch A000881 / P000724 / P000297 | -0.291 |
| Handle assembly | -0.354 |

Clutch sliding adds `shift × -0.015 m`. Display turns along the physical driveline from motor to snout (stage1 → stage2 → stage5 → stage3 → stage4) are
`8.0 / 5.2 / 3.38 / 2.20 / 1.43` (`stage1: 8`, `stage2: 5.2`, `stage5: 3.38`, `stage3: 2.2`, `stage4: 1.43`, JG-031 ~65% stage progression); planets counter-rotate by multiplier `3.5`.
Part numbers identify units; stage names cannot reorder them.

**Sheet and projection (owner rulings 2026-09-05).** ANSI C proportion
22:17, landscape on every viewport, 0.905882 × 0.700 m in world units,
fitted to 92% of viewport height — 66.97% of width on 16:9, with the
backdrop wash in the margins either side; it is never cropped to fill the
width. True third angle: the primary side elevation is 1:1 (that is what
lets the model register to a view the code projected), the plan sits above
and the section below on its vertical centreline, and the end view sits
right on its horizontal centreline; measured alignment deviation 0.000000.
Section A–A is a bottom half-section whose cutting-plane line and arrows
are drawn on the parent elevation. Narrow viewports keep the same landscape
sheet and get a scroll-driven camera push-in and pan instead of a separate
portrait arrangement.

The [animation spec §5](context/architecture/animation-spec.md),
both READMEs and the skills registered in
[`agent-skills.md`](context/agent-skills.md)
must accompany behavior/table changes in the same commit. Full/lite retain the
opening sequence; lite uses 45% swelling displacement. Reduced motion
holds the lit registered phase-.38 frame; poster retains the original DOM
poster. [JG-026 evidence](work/evidence/JG-026-b1-b2-verification.md)
is historical and does not verify the breakthrough opening.

## Repository Map (source + tooling, current as of the 2026-09-25 hygiene pass)

If you add, move, or delete a module below, update this map in the same commit.

### Application source (`src/`)

| Path | Role |
|---|---|
| `App.tsx` / `main.tsx` | Root: chapter DOM, canvas lazy-mount, `?study=rl300` review route |
| `components/` | DOM-layer UI: `Chapters`, `TechnicalHUD`, `BootSequence`, `StaticPoster`, `IntroTitles`, `ToleranceStations` (DOM half of the stations), `GdtSymbols` (Y14.5 vector glyphs) |
| `scene/SceneCanvas.tsx` | R3F root: mounts CameraRig, SpatialRig/SpatialWorld, DrawingLinework, StationDriver, composer |
| `scene/CameraRig.tsx` | Scroll camera incl. the JG-035 intro pose (dolly → square-on ortho) |
| `scene/SpatialRig.tsx` / `SpatialWorld.tsx` | The three-station world mounts (the old `StageManager.tsx` was removed 2026-09-25) |
| `scene/TorqueWrenchHero.tsx` + `rig/` | JGun rig: units, explode ladder, materials, nodeRoles, gearRotation, lcdCluster |
| `scene/stages/` | Station 2/3 components: `Station2_AcousticEnclosure`, `M249Stage`, `AirflowField`, `AcousticBaffleField`, `airflowRoute`, `recolorAllowList`, `stageWindows` |
| `scene/drawing/` | CH.01 drafting-sheet system: `DrawingLinework` (bake+render), `drawingGeometry` (layout/HLR), `sheetCamera`, `introTimeline`, `extractionPose`, `DrawingProofRenderer` (proof-mode stills), `sheet/` (ink, text, compose, profile, edgeExtract) |
| `scene/stations/` | Tolerance stations: `stationData` (S1–S6 windows/anchors), `StationDriver` (in-canvas projection), `stationStore` |
| `scene/inspection/` | P003068 finish study: exact CAD ring copy, OD shader mask, verified paired-tool clip, explicit inspection clock and contact telemetry |
| `state/inspectionStore.ts` / `components/RingInspection.tsx` | Discrete entry/return lifecycle, narrative context, accessible dialog, static finish equivalent and Play/Replay controls |
| `components/AuthorshipNotes.tsx` | Screen-reader-only identity heading + transcript of the handwriting (the cream sticky notes and floating chips were removed 2026-10-08) and the inline static equivalent for poster/reduced tiers; reads the same `OWNER_*` strings as the sheet |
| `scene/drawing/electricalScore.ts` | O1 pure `sampleElectrical(t, out)`: accelerating burst/hold outline score, interior-branch score and non-advancing spark, calibrated to a 100 s linear sweep (consumed by `introTimeline.drawingIntroState`) |
| `scene/drawing/sheet/ownerAnnotations.ts` / `handwriting.ts` | O2/O4 owner words, title/career block data, measured anchors (sun gear P001835, output spindle) and deterministic hand-lettering strokes appended to the InkBuilder (red/ink pen colors, `noteInput`/`noteOutput`/`detailE` groups) |
| `scene/inspection/holeApertures.ts` | R1 measured drilled-hole apertures of the P003068 ring and the runtime-owned curved cover patches driven by `holePlugBlend` |
| `scene/inspection/shaft/fosPresentation.ts` | S2 single FOS table (4140 .55 / 4340 .72 / C300 .90, revised blue-only) shared by sampler, shader and DOM panels; provenance string recorded in code/evidence only |
| `scene/inspection/shaft/normalRepair.ts` | S3 creased angle-weighted normal repair with revolved-surface azimuth snap, run once at load |
| `scene/rl300/` | The `?study=rl300` "Quiet Machine" study — a deliberately separate scene (owner review route), not the portfolio Station 2 |
| `scene/backgrounds/` | JG-023 scrubbed procedural backdrop layers |
| `scene/Hotspots.tsx` | CH.03/CH.04 spatial hotspots (CH.01/02 hotspot rendering replaced by the stations) |
| `scene/ScrollRig.tsx` / `scrollCommit.ts` / `PostProcessingComposer.tsx` / `sectionRenderPass.ts` | Scroll wiring, committed-pace, bloom/CA/DOF composer, section render pass |
| `state/`, `shaders/`, `data/caseStudies.ts`, `types/` | Scroll/quality stores, CAD dissolve shader, chapter copy + part-number display names, shared types |

### Verification + tooling (`scripts/`)

Live gates named in TODO.md (`verify-jg0xx-*.mjs`, `check-station2-contract.mjs`, `check-b1b2-contract.mjs`, `lib/preview-pixels.mjs`), the lite-GLB pipeline (`build-jg033-lite.py` + `verify-jg033-lite-asset.mjs`), capture harnesses (`capture-*.mjs`, incl. `capture-owner-revisions.mjs` and `diag-shaft-artifacts.mjs` for the owner-revision evidence), the shared browser launcher `lib/browser-launch.mjs` (Windows path unchanged; bundled Chromium + SwiftShader software GL elsewhere), `deploy-studiomark.ps1`, `sync-assets.ps1`, `og-image-source.html`. `export-sheet-template.mjs` is documented LEGACY (JG-026 layout JSON) — retire once the owner confirms the JG-035 sheet.

### Assets + owner documents

- `public/` — `models/` (GLBs gitignored except committed `m249-transformed.glb` + `role-map.json`), `fonts/` (Barlow Condensed, OFL), `draco/` decoders, `images/rl300-*-preview.png`, Cloudflare bits (`_headers`, `404.html`, `robots.txt`).
- `docs/` — two live owner documents: `rl300-enclosure-issues-and-ideas.md` (open JG-033) and `kimi-visual-enhancement-brief.md` (open JG-032); `orzo-style-portfolio-implemetation-roadmap.md` is protected parallel-session material. Owner reference images live in `context/references/media/`.
- `project/archive/superseded/` — every document explicitly replaced, each with an `ARCHIVED` disposition header and working links.

### Code navigation: the codebase-memory graph

The repo is indexed by the local `codebase-memory-mcp` service. Query **`C-Users-Markimus-.buzz-REPOS-jgun-portfolio`** for this real checkout; the separate legacy `jgun-portfolio` graph may be stale. See [`context/agent-skills.md`](context/agent-skills.md) → "Codebase-Memory Service" for setup and coverage rules. After substantial structural changes, refresh this explicit project/root and check `index_status` plus exact-file `check_index_coverage` before relying on its symbols. The [recovered handoff](work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md) records the October 6 refresh and remaining source fallbacks.

Root [`.cbmignore`](../.cbmignore) prunes the verification-evidence subtree, logs, drawing-cache data and Python bytecode from the structural graph. Read evidence reports and helpers within that subtree directly; they remain preserved. Runtime source, `scripts/` helpers and canonical Markdown plans/specs outside the evidence subtree remain eligible for the full index. Whole-subtree pruning also keeps the coverage inventory from overflowing on thousands of captures.

## Cleanliness Rules (adopted 2026-09-25 after a full dead-file audit)

These keep the repo navigable for agents reviewing it cold. They bind every session.

1. **Superseded ≠ active.** When a doc is replaced, move it to `project/archive/superseded/` with a one-line `> **ARCHIVED YYYY-MM-DD** (was …): reason + replacement` header and rewrite inbound links — all in the same commit. Superseded material never stays in active directories (`work/inbox/`, `docs/`, `context/`).
2. **Inbox items get dispositions.** Every `work/inbox/` proposal is promoted, rejected, or archived when its task closes or a change overtakes it — it does not accumulate. (The 2026-09-25 pass archived 11 stale items; don't recreate the pile.)
3. **No junk files in git.** No `*.bak`/`*.orig`, no root-level screenshots or shell-redirect accident files. Working scratch lives under `.scratch/` (gitignored, and excluded from `npm test` via `vite.config.ts` — keep that exclude intact).
4. **Delete dead code when its successor ships.** If a module is imported nowhere and referenced by no string path (grep the basename repo-wide, check gates + docs), remove it and update the gate scripts/docs that named it in the same commit. Git history is the archive for code.
5. **Every asset has a home and a real extension.** Owner reference images → `context/references/media/`; runtime assets → `public/`. Nothing extensionless (a 2.1 MB `docs/JGUN-DRAWING` PNG hid that way for weeks).
6. **Docs move with behavior.** Renames/removals update `context/` docs and the Repository Map above in the same commit — the same rule that already binds spec §5 tables.

## Protected Material

Do not move, delete, commit, or build on `.scratch/` or `docs/orzo-style-portfolio-implemetation-roadmap.md` until the parallel-session owner explicitly releases it. See [`../AGENTS.md`](../AGENTS.md).
