# Project Knowledge Map — JGUN Portfolio

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

## JG-026 intro timing and unchanged canonical ladder

B1/B2 occupy global `0.000–0.120` of PROGRESS, which
`pacedProgress()` stretches over `0.30` of the DOCUMENT (owner pacing
ruling 2026-09-05). Normalized `0–.14` focuses the registered ANSI C
print, `.14–.30` is reserved for the opening text, `.30–.56` traces the
profile excitation, `.56–.88` extracts the model, `.88–.96` is the
computed detachment and its single shockwave pass, and `.96–1` fades the
print. The crossing is computed from transformed vertices, not hard-coded
to a phase boundary. Document height is 3120vh (scroll distance 3020vh);
every downstream chapter keeps its progress span exactly and gains 1.25x
absolute scroll distance.

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
must accompany behavior/table changes in the same commit. Full/lite retain focus/excitation/lift; lite omits plane displacement.
Reduced motion holds the fully focused registered phase-.20 frame; poster
retains the original DOM poster. [JG-026 evidence](work/evidence/JG-026-b1-b2-verification.md)
records remaining proof and Mark's pending `?chapter=0` visual ruling.

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
| `scene/rl300/` | The `?study=rl300` "Quiet Machine" study — a deliberately separate scene (owner review route), not the portfolio Station 2 |
| `scene/backgrounds/` | JG-023 scrubbed procedural backdrop layers |
| `scene/Hotspots.tsx` | CH.03/CH.04 spatial hotspots (CH.01/02 hotspot rendering replaced by the stations) |
| `scene/ScrollRig.tsx` / `scrollCommit.ts` / `PostProcessingComposer.tsx` / `sectionRenderPass.ts` | Scroll wiring, committed-pace, bloom/CA/DOF composer, section render pass |
| `state/`, `shaders/`, `data/caseStudies.ts`, `types/` | Scroll/quality stores, CAD dissolve shader, chapter copy + part-number display names, shared types |

### Verification + tooling (`scripts/`)

Live gates named in TODO.md (`verify-jg0xx-*.mjs`, `check-station2-contract.mjs`, `check-b1b2-contract.mjs`, `lib/preview-pixels.mjs`), the lite-GLB pipeline (`build-jg033-lite.py` + `verify-jg033-lite-asset.mjs`), capture harnesses (`capture-*.mjs`), `deploy-studiomark.ps1`, `sync-assets.ps1`, `og-image-source.html`. `export-sheet-template.mjs` is documented LEGACY (JG-026 layout JSON) — retire once the owner confirms the JG-035 sheet.

### Assets + owner documents

- `public/` — `models/` (GLBs gitignored except committed `m249-transformed.glb` + `role-map.json`), `fonts/` (Barlow Condensed, OFL), `draco/` decoders, `images/rl300-*-preview.png`, Cloudflare bits (`_headers`, `404.html`, `robots.txt`).
- `docs/` — two live owner documents: `rl300-enclosure-issues-and-ideas.md` (open JG-033) and `kimi-visual-enhancement-brief.md` (open JG-032); `orzo-style-portfolio-implemetation-roadmap.md` is protected parallel-session material. Owner reference images live in `context/references/media/`.
- `project/archive/superseded/` — every document explicitly replaced, each with an `ARCHIVED` disposition header and working links.

### Code navigation: the codebase-memory graph

The repo is indexed by the local `codebase-memory-mcp` service (see [`context/agent-skills.md`](context/agent-skills.md) → "Codebase-Memory Service" for setup, coverage rules, and when to prefer graph queries over grep). Re-index after structural changes: `index_repository` on this path, then `index_status` to confirm.

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
