# Project Brief — jgun-portfolio (2026-09-29)

A self-contained orientation for any agent handed this repository. Written from the live
repo state on 2026-09-29 (branch `codex/jg033-signature-shot`). Sources: `project/README.md`,
`TODO.md`, `docs/`, `project/context/`, git history, and on-disk measurement. Where this
brief and `AGENTS.md`/`TODO.md` disagree, those win — re-check them.

---

## 1. What this project is

Mark Hintz's portfolio site: a scroll-driven, single-page 3D experience that presents his
real CAD/engineering history as a cinematic narrative. **Stack:** Vite + React 19 + R3F
(three 0.185) + GSAP ScrollTrigger + Lenis. **Deploy:** GitHub `origin`
(`mhintz1980/jgun-portfolio`, authoritative) → Cloudflare Pages → **studiomark.dev**.
Pushing to origin IS deploying.

The hero is the **JGun pneumatic torque wrench** (multi-stage planetary reduction): the site
opens on a registered ANSI C drafting sheet, extracts the model, and dissolves it from PBR
metal into digital wireframe — "shop floor to software". The hero GLB is `public/models/Default.glb`
(13.7 MB, 1.29M tris, Draco) — gitignored, synced from `C:\Projects\CAD\RL300-SAFE\optimized\`
via `npm run sync-assets`.

### Experience inventory (as built)

| Segment | What it is | Code |
|---|---|---|
| CH.01 Drafting sheet | True third-angle ANSI C print (side/plan/section/end views) that excites, extracts, and detaches the model with a shockwave | `src/scene/drawing/` |
| CH.02 Exploded wrench | Scrubbed (0.6) rear-extraction explode ladder with per-stage epicyclic gear ratios | `src/scene/TorqueWrenchHero.tsx` |
| CH.03/CH.04 | Spatial hotspots; tolerance stations S1–S6; M249 CAD-dissolve; airflow/acoustic field | `src/scene/Hotspots.tsx`, `src/scene/stations/`, `src/scene/stages/` |
| `?study=rl300` | Separate owner-review scene "Quiet Machine" (RL300/MSP enclosure study — not the portfolio Station 2) | `src/App.tsx` |
| URL views / tiers | `?view=solid|blueprint|exploded`; full/lite quality; reduced-motion holds the phase-0.20 registered frame; boot loader, poster, HUD | — |

Document height 3120vh; the opening (B1/B2) occupies PROGRESS 0–0.120 stretched over the
first 0.30 of document (owner pacing ruling 2026-09-05).

---

## 2. Original goals (as stated at project start)

The first commit scaffolded a "3D mechanical-to-AI portfolio (Modules 1-4)". The committed
roadmap — `docs/orzo-style-portfolio-implemetation-roadmap.md` (protected reference, never an
approved build spec) — states the goal plainly: **recreate ORYZO AI (by Lusion)** — a
"scroll-driven, single-page WebGL interactive experience" — as an engineering portfolio,
"combining a fixed 3D viewport with synchronized 2D HUD overlays driven by precise
scroll-progress triggers."

- **Five-phase story:** calibration/blueprint intro → wireframe-to-solid transition →
  exploded assembly with telemetry HUD → technical deep-dive case studies → contact/recede footer.
- **Three portfolio projects:** JGun/RL-300 torque multiplier, MSP acoustic pump enclosure,
  M249/MK46 mil-spec reverse engineering.
- **Look:** dark industrial palette (#0e0b08–#16110d) with amber accents (#ff6b1a), bloom,
  chromatic aberration. One persistent canvas behind scroll-pinned DOM; camera scrubs
  between preset poses; scroll drives blueprint → solid → exploded → case-study states.
- The original task spec (`project/archive/superseded/task-spec.md`, superseded by JG-020)
  added seven concrete objectives: datum trackers with SVG leader lines, a three-station
  spatial world with "kinetic whip-pan" camera, wheel-release subassembly inspection,
  planetary "Kinematic Idling", mouse-reactive CFM airflow, velocity-driven post-processing.

### How the plan evolved

- **Foundation (pre-JG):** scaffold, fallbacks (reduced-motion/DPR/no-WebGL), code-split
  canvas, URL views, the scroll/animation spec, D1-AP explode ladder + epicyclic rotation.
- **2026-08-24 "orzo mission":** StageManager + CH.03 airflow; roadmap + multi-station spec
  committed; the `JG-###` work-ID knowledge system installed.
- **JG-014–020 (build-out):** GD&T annotations, MSP enclosure asset, multi-station world,
  whip-pan post, interactive airflow, deploy readiness, subassembly inspection + hotspots.
- **JG-021–024 (choreography + polish):** camera rebuild, unified callouts, JGUN-1.glb
  finish swap (owner PASS).
- **JG-025–031 (hero realism):** handle/rear realism, LCD cluster, anodize, knurl, finish
  rulings (JG-030 supersedes JG-025), cage rotation VERIFIED on live studiomark.dev.
- **JG-032–033 (Station 2 rebuild):** thermal route FAIL → RL300 quiet-machine rebuild
  through owner-gated milestones (7-shot camera sequence, DUCT_INTAKE_AIRWAY reconstruction,
  material rulings, real pump export).
- **JG-034–035 (opening):** opening refit bug; the drafting-table intro + 7 tolerance
  stations — stages 1–3 built and verified, ruling pending (see §3).

**Key supersessions an agent must respect:** task-spec → JG-020 (its sample code "does not
match measured reality" — `animation-spec.md` §5 wins); owner-spec prose ±Z labels are
flipped vs measured reality (measurements win); local rulings supersede earlier ones
(JG-030 > JG-025; `docs/rl300-enclosure-issues-and-ideas.md` > kimi brief §4).

**Unbuilt / deferred (documented, not approved):** M249 point-cloud→wireframe→solid with
hoverable datum pins; cutaway shaders; drag/orbit inspection; V2 asset manifest;
`docs/jgun-animation-improvements.md` §5–14 (only §1–3 were authorized → JG-035);
drawing-cache production-preview measurement before keeping the 25 MB precompute.

---

## 3. Current state (2026-09-29)

**Branch:** `codex/jg033-signature-shot` (only local branch), **40 commits ahead of
`origin/main`** (merge-base `b057f11`). The buzz remote was removed 2026-09-29 (owner);
GitHub origin is authoritative.

**Working tree:**
- Modified: `TODO.md` (+2 JG-035 bullets), `src/scene/drawing/DrawingLinework.tsx`,
  `src/state/scrollStore.ts` — together these are the **navy ink-pulse candidate**: the
  owner rejected the bright additive cyan/white outline pulse against the light paper, so
  the pulse is redrawn non-additive in the shared `INK` navy (luminance recomputed from ink
  color, bloom-gain constants dropped).
- Untracked (all under `project/work/evidence/JG-035-opening-drafting-table/`): the
  2026-09-29 ruling packet (`visual-ruling-packet`, `astra-ink-pulse-review`,
  `astra-ink-pulse-prompt`, `higgsfield-account-reconciliation` .md files) plus capture
  dirs `ink-pulse-candidate-2026-09-29/`, `resolved-close-2026-09-29/`,
  `resolved-close-full-attempt-2026-09-29/`.

**Where JG-035 stands:** built and verified (stages 1–3 committed `d5e13c7`; continuation
fixes `168d0aa`, `b18f9eb`; handoff `5abe1c5`) — but the TODO checkbox stays unchecked
until the **owner + Astra visual ruling** lands. That ruling is the single gate: one call
covering six effects (outline/pulse, sheet tone, contact shadow, title block, camera rake,
vellum close). Astra's stills review: keep the navy direction and current
weight/opacity/timing; stills cannot establish whether the pulse reads as a travelling
event — **a motion clip is required** for that. Contact shadow: the 0.006 m seam is the
named fix candidate if grounding is wanted.

**JG-033 residue (the branch's namesake):** its committed airflow beat is done, but TODO
marks the **entry-path fix (owner ruling 2026-09-23) as NEXT — before routing Astra**
(`SPINES.main` waypoints 0–2 + fan clearance; spec in
`project/work/evidence/rl300-quiet-machine/18-handoff-2026-09-23-entry-path-fix.md`),
then Astra re-review with fresh captures.

**Higgsfield (AI video lane):** the 09-28 "403, 100 credits remain" note is superseded by
the 2026-09-29 read-only reconciliation: CLI 1.1.26 shows a **Plus plan with 1,000 credits;
73.56 remain** from the swept 100-grant (26.44 spent on 13 completed jobs — none matching
the three-clip manifest, which stays `prepared-not-submitted`). Support ticket
`58b9e9a2-…` status unverified. Before spending: confirm the production lane and
prompt/cost set; any output needs prompt/job-ID provenance + a visual ruling.

**Documented next actions (handoff 2026-09-28, in order):**
1. Owner + Astra visual ruling (stills in `continuation-2026-09-27/frames/` + `frames-retry/`).
2. Higgsfield check — done 2026-09-29 (above); if generating: 2× Seedance ≈ 70 credits,
   prompts in `higgsfield-asset-manifest-2026-09-27.json`; still-403 = owner billing decision.
3. Fix-or-ship per TODO; iterate with
   `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5199`;
   restart the :4173 preview after every rebuild; full 6-case roster is done-evidence only.
4. Push once evidence + checks are complete (push = deploy to studiomark.dev). Main is
   untouched pending the ruling.

---

## 4. Concept art & visual targets (what the final state should look like)

Ranked "show an agent the target" set:

1. **`project/context/references/media/jgun-drawing-owner-reference.png`** (2.1 MB) — the
   owner's own JGun drawing; the literal drafting-sheet target for the JG-035 opening.
2. **`project/context/references/media/gdt/`** (4 owner-supplied screenshots, 2026-08-28) —
   `gdt-fcf-style-sheet.png`, `gdt-fcf-single-frame-parallelism.png`,
   `gdt-drawing-splined-hub.png`, `gdt-drawing-ar15-lower.png` — the authoritative visual
   target for datum symbols and feature-control frames in the HUD/callout layer. Style
   reference only: transcribe symbols with values appropriate to the actual parts.
3. **`project/context/references/media/torque-render.webp`** (40 KB) — PBR material/lighting
   reference for the hero; plus `handle-rear/handle-rear-owner-reference.png` (104 KB).
4. **Owner sketches/rulings** (RL300 lane): `lower-fix/owner-intake-placement-sketch-2026-09-24.png`
   (2.0 MB, owner markup defines the target), `acoustic-concept-sheet-2026-09-24.png`,
   `entry-fix/owner-entry-path-ruling-2026-09-23.png` / `owner-mid-path-ruling-2026-09-23.png`.
5. **Target-vs-current pairs** (acceptance shape): `duct-reconstruction/green-target-vs-orange-current-angle-a/-b.png`,
   `renders/airway-BEFORE.png` / `airway-AFTER.png`, `flow-route-arrows-V2RL300-SAF-1171-1.png`.
6. **Current opening candidate** (untracked, pending ruling):
   `JG-035…/ink-pulse-candidate-2026-09-29/p0.0600|0660|0720-1600x900.png` — browser
   captures of the implemented navy ink-pulse outline — the closest artifact to the intended
   final rendered opening. (Reviewed *by* Astra, an AI reviewer; not AI-generated imagery.
   The AI-*generated* lane is Higgsfield video, prepared-not-submitted.)

**Prose descriptions of the intended final state:** the orzo roadmap (palette + five-phase
story — primary intent document); `project/context/architecture/animation-spec.md` §5–5.4
(measured reality, wins over owner prose); `docs/jgun-animation-improvements.md`
(aspirational §5–14, authorized §1–3); the 2026-09-29 ruling packet .md files (current
constraints). Provenance for every recurring input: `project/context/references/source-register.md`.

**Runtime imagery (shipped):** `public/favicon.svg`, `public/og-image.png`,
`public/images/rl300-{exterior,intake,section}-preview.png`.
**Process evidence (not targets):** ~1,095 capture screenshots under `project/work/evidence/`
— verification artifacts, not visual intent.

---

## 5. Important files index

**Governance & queue**
| File | Role |
|---|---|
| `AGENTS.md` | Non-negotiable session rules (read first) |
| `TODO.md` | Canonical approved task queue + verification protocol (line 13) |
| `project/README.md` | Knowledge map + work-ID protocol |
| `project/work/INDEX.md` | Registry: state ↔ plan ↔ TODO ↔ evidence per JG-### |
| `CLAUDE.md` | 3-line pointer shim to AGENTS/TODO (intentional — keep) |
| `project/decisions/` | Dated ADRs |

**Canonical specs & context** (`project/context/`)
| File | Role |
|---|---|
| `architecture/animation-spec.md` | §5–5.4 = measured reality; the canonical scroll/animation spec |
| `owner-specs/animation-exploded-owner-spec.md` | Owner intent (±Z prose flipped vs measurements) |
| `references/source-register.md` | Provenance + usage restrictions for every recurring source |
| `constraints.md`, `deployment.md`, `agent-skills.md`, `session-phases.md` | Durable constraints, deploy runbook, skill paths, phase rosters |
| `domain/jgun-handle-gearbox.md` | Domain mechanics (K=commercial, P=manufactured, A=sub-assembly) |

**Docs** (`docs/`): `orzo-style-portfolio-implemetation-roadmap.md` (protected reference),
`jgun-animation-improvements.md`, `jgun-stages-1-3-implementation-plan.md`,
`kimi-visual-enhancement-brief.md`, `rl300-enclosure-issues-and-ideas.md`.

**Code**
| File | Role |
|---|---|
| `src/App.tsx` / `src/main.tsx` | Chapter DOM, canvas lazy-mount, `?study=rl300` |
| `src/scene/SceneCanvas.tsx` / `CameraRig.tsx` | R3F root; scroll camera incl. JG-035 intro pose |
| `src/scene/TorqueWrenchHero.tsx` / `rig/nodeRoles.ts` | Hero rig; part-number role classification |
| `src/scene/drawing/DrawingLinework.tsx` | CH.01 drafting-sheet system (current ink-pulse work) |
| `src/scene/stations/StationDriver.tsx` | In-canvas tolerance-station projection |
| `src/scene/Hotspots.tsx`, `src/scene/stages/` | Hotspots; station 2/3 world |
| `src/shaders/CadTransitionShader.ts` | CAD-to-code dissolve |
| `src/data/caseStudies.ts` | Chapter copy, ladder offsets, gear ratios |
| `src/state/scrollStore.ts` | Scroll/telemetry state |

**Assets & tooling**
| File | Role |
|---|---|
| `public/models/role-map.json` | Authoritative occurrence names/anchors (committed) |
| `public/models/Default.glb` | Hero (gitignored; `npm run sync-assets`) |
| `public/models/m249-transformed.glb`, `msp-enclosure.glb` | Committed textured/named-root GLBs — regeneration bans apply (AGENTS.md) |
| `scripts/verify-jgun-opening.mjs` | Opening verifier (`--quick`, `--url=http://localhost:5199`) |
| `scripts/deploy-studiomark.ps1`, `scripts/sync-assets.ps1` | Deploy; asset sync |
| `package.json` scripts | `dev`, `build`, `preview`, `typecheck`, `test` (vitest), `check:station2`, `sync-assets` |

---

## 6. Cleanup recommendations (inventory-only; nothing deleted)

Measured 2026-09-29. `.gitignore` already covers all local residue — the real problems are
(a) **679 MB of tracked evidence in git** (1,823 files under JG-035 alone; pack = **461.6 MiB**),
and (b) ~800 MB of gitignored local residue.

### Disk map (top offenders)

| Path | Size | Tracked | Nature |
|---|---|---|---|
| `project/work/evidence/` | 747 MB | **679 MB** | Verification captures committed to git (JG-035 dir alone: 670 MB) |
| `.scratch/` | 745 MB | no | Working scratch (jg023-verify 464 MB, jgun-reswap 373 MB, cine 48 MB, …) |
| `dist/` | 30 MB | no | Build output |
| `output/` | 14 MB | no | Playwright/review captures (quiet-machine matrix, jg033 fuel-flange) |
| `.playwright-cli/` + `.playwright-mcp/` | ~3 MB | no | Tool residue |
| `critique-b-*.png` (root ×3) | 724 KB | no | Aug-28 critique-B captures |
| `.archive/` | 104 KB | no | Pre-`project/archive/` relic |

### Tier 1 — policy going forward (highest value, no history surgery)

Stop committing bulk capture sets. The repo's own doctrine is "verify with runtime
telemetry, never vision alone" — telemetry JSON + a handful of representative stills carry
the evidence; 50–100 PNGs per quick-smoke run do not. Amend AGENTS.md/README guidance:
evidence dirs cap at ~10 representative frames + telemetry + the ruling .md.

### Tier 2 — reclaim the git pack (owner decision required)

`git rm -r --cached` on superseded evidence dirs (jg027–jg032 captures, JG-035 quick-smoke
1–9) + off-repo archive frees the working tree but **not** history; the 461.6 MiB pack only
shrinks via `git filter-repo`/BFG — a destructive, coordinate-first operation on the
authoritative remote (every clone re-fetches). Recommend: do Tier 1 + Tier 3 now; treat the
history rewrite as an explicit owner decision with a documented date window.

### Tier 3 — safe local deletes (gitignored, regenerable)

```bash
rm -rf dist/ output/ .playwright-cli/ .playwright-mcp/   # ~47 MB, all regenerable
rm -f critique-b-desktop-enclosure.png critique-b-desktop-m249.png critique-b-mobile-m249.png
rm -rf .scratch/jg023-verify/ .scratch/cine/ .scratch/lower-fix/ .scratch/entry-fix/ \
       .scratch/tuning/ .scratch/jg028-regression/ .scratch/frames/   # ~590 MB old work scratch
```

### Do NOT touch

- `.scratch/jgun-reswap/` — holds the byte-identical preserved stopgap GLB named by
  `source-register.md` (`jgun-full-fine-gbfix.glb`). Archive-before-delete only.
- `.scratch/breakdown/` — this brief's working material (specs + seat findings).
- `public/models/*.glb`, `role-map.json` — committed assets under regeneration bans.
- `CLAUDE.md`, `docs/` (all five files are live or protected; supersessions are recorded
  in headers, not by deletion), `skills-lock.json`, `.env.local` (never commit).
- `.scratch/` as a whole is protected by AGENTS.md ("never commit") — it is working
  material; only the aged sub-dirs above are trim candidates.

---

## 7. Operating rules for an incoming agent (condensed from AGENTS.md — read it in full)

1. **Read order:** AGENTS.md → TODO.md → `project/work/INDEX.md` → accepted plan →
   context/skills → implement → update evidence → only then check off TODO.
2. **Part numbers are the stable key** (A000606, K000004, P000725…). Stage names conflict —
   never reorder logic on names alone; identity lives on GLB node names; `role-map.json` anchors.
3. **Never regenerate the GLBs** with bare `gltfjsx --transform` / `gltf-transform join`
   (m249 normal-map regression; msp-enclosure root collapse; JGun node collapse).
4. **Update in the SAME commit:** spec §5 tables, README ladder, both rig skills' tables —
   they hardcode the mechanical ladder.
5. **Verify with runtime telemetry, never vision alone.** Restart the :4173 preview after
   every rebuild. Opening verifier needs `--url=http://localhost:5199`; `--quick` to iterate.
6. **Never commit** `.scratch/`, credentials, or protected parallel-session material.
   Superseded docs move to `project/archive/superseded/` with rewritten links, same commit.
7. **Push only after** plan evidence and repo checks are complete — push deploys studiomark.dev.
8. Skills live per `project/context/agent-skills.md` (rig/scene, verification, timeline,
   GSAP, motion canon, higgsfield suite); per-phase roster in `session-phases.md`.

---

*Compiled 2026-09-29 by an orchestration session (3 GLM-5.3-Flash + 1 DeepSeek-Flash
research seats over `codex exec`/ocx, plus on-disk measurement). Working material:
`.scratch/breakdown/` (untracked). Numbers in §3/§6 re-measured directly, not subagent-claimed.*
