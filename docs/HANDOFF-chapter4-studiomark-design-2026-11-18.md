# Handoff: Chapter 04 ("Renderings, Animation & StudioMark") Design & Planning Session (2026-11-18)

Written: `2026-11-18`
Handoff file: `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\docs\HANDOFF-chapter4-studiomark-design-2026-11-18.md`
Intended workspace for the receiving session: `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a`

---

## 1. Session Context & Read-First Order

### Workspace & Git State (verified 2026-11-18)
- **Open the fresh session directly in:**
  `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a`
  - Do **not** start in a new worktree, and do **not** edit inside `c:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (where the prior research conversation ran).
  - Current git state in this worktree: `HEAD` is detached at `555d773f`, pointing at the same commit as `claude/homepage-prototype-approval-b6962a`, `origin/claude/homepage-prototype-approval-b6962a`, and `claude/homepage-prototype-gate-2-be5a82`. Working tree is clean except gitignored `.scratch/`.
  - Before making any future commit (only after Mark's explicit approval), attach `claude/homepage-prototype-approval-b6962a` rather than committing on detached `HEAD`.
  - **Update 2026-11-18 (later):** this file and the JG-044 plan update were committed and pushed on branch `claude/homepage-prototype-gate-2-be5a82` (one commit on top of `555d773f`). In `b6962a`, first remove the untracked copy of this file, then `git checkout claude/homepage-prototype-approval-b6962a && git merge --ff-only origin/claude/homepage-prototype-gate-2-be5a82` (after `git fetch`). That brings both docs in with no conflict.

### Read-First Order for the Receiving Session
1. **This document:** `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\docs\HANDOFF-chapter4-studiomark-design-2026-11-18.md`
2. **Homepage merged prototype handoff chain:**
   - `docs/HANDOFF-homepage-merged-prototype-2026-11-18.md`
   - `docs/HANDOFF-homepage-merged-prototype-2026-11-17c.md`
   - `docs/HANDOFF-homepage-merged-prototype-2026-11-17b.md`
3. **Repo rules, plans & task state:**
   - `AGENTS.md`
   - `TODO.md` (`Active` section)
   - `project/work/plans/JG-044-homepage-merged-concept.md`
   - `project/work/plans/JG-045-clean-repo-split.md`
4. **Live prototype source:**
   - `proto/merged/index.html`
   - `proto/merged/main.js`

### Current Approval State
- **PLANNING ONLY — DO NOT BUILD YET.**
- Mark approved:
  1. Merging Chapter 04 (`Renderings and visualizations`) and the **StudioMark ("CAD to Ad")** rendering/animation pipeline into one showcase chapter.
  2. The 3 specific assemblies (Section 2 below).
  3. **Option 1** sequencing (scroll-sequenced 3 beats + clickable `01 / 02 / 03` specimen pills).
  4. **Local previews first ($0 cloud spend)** before any Modal Cycles dispatch.
- Mark explicitly instructed: *"Do not do the work yet. Just document what we discussed and then write a handoff for a fresh session to plan it out."*
- Do **not** write production code, modify `proto/merged/`, run Blender renders, dispatch Modal jobs, commit, or push until Mark approves the implementation & asset plan you write.

---

## 2. Owner-Approved Direction for Chapter 04

### Core Concept
- **Merge Chapter 04 + StudioMark:** Chapter 04 (`04 · Renderings, Animation & StudioMark`) showcases both Mark's best existing renderings/animations and new custom-rendered sequences built specifically for `proto/merged/` — turning the chapter from a dead-end 4-image gallery (`href: null`) into proof of the autonomous **StudioMark ("CAD to Ad")** pipeline.
- **Zero `.glb` models on `/home/`:** Everything shown on the sheet and under the lens is pre-rendered video / WebP frame sequences so the homepage stays fast with zero lag.
- **Dual-pass Cycles/Blender architecture (same pattern as `proto/merged/arm/`):**
  - Render each assembly **twice** from the exact same Blender camera so the sheet and lens register pixel-for-pixel:
    1. **Line pass (`line`):** Clean hidden-line CAD wireframe / blueprint on the drafting sheet (as the SolidWorks `.glb` import arrives).
    2. **Photoreal pass (`shade`):** Transparent-background Cycles render composited under the cursor lens.

### The 3 Locked Assemblies (Distinct from Chapters 01–03)
Mark locked these three assemblies for Chapter 04:
1. **Assembly 1 — Torque-Wrench Planetary Carrier Cage:** Any of the **larger 3 cage assemblies** isolated from:
   - `C:\Projects\CAD\Default.glb`
   - `C:\Projects\CAD\RL300-SAFE\optimized\jgun-gearbox.glb`
   - Or individual part GLBs in `C:\Projects\CAD\pneumatic-torque-gun\`
2. **Assembly 2 — `DD4SE` Open-Skid Dewatering Pump:**
   - `C:\Projects\msp-render-pipeline-scene-prep\cad\DD4SE-clean.glb` (33.18 MB, 294 meshes, already wired into `render_worker.py`; original `C:\Projects\CAD\DD4SE.glb`).
   - Pairs directly with the 20-round StudioMark ground-truth photo parity proof (`dd4se-reference-vs-render.png`). *(Verified on disk: `DP150` only has 2D PDF drawings and PNG renders, no 3D GLB/STEP, so Mark selected `DD4SE`.)*
3. **Assembly 3 — Option B (M249 Sub-Assembly):**
   - `C:\Users\Markimus\Downloads\CAD\Armament\armament\Topcover Assembly\Topcover Assembly.glb` (feed tray / topcover mechanism) and/or
   - `C:\Users\Markimus\Downloads\CAD\Armament\armament\M249\M249 Receiver Plus.glb` (also on disk in `C:\Users\Markimus\Downloads\CAD\Armament\armament\M249\`: `9348202_-_Receiver.glb`, `Rear_Sight_Assembly.glb`).

### Before-the-Dive Sheet & Lens Sequencing (Option 1 — Approved)
- **Scroll-sequenced 3 beats** across Chapter 04's scroll band (`0.0–0.33` Planetary Cage → `0.33–0.66` DD4SE Pump Skid → `0.66–1.0` M249 Sub-Assembly):
  - Assemblies turn smoothly as you scroll (plus desktop pointer nudge), matching the registered sheet-linework vs. lens-Cycles treatment.
  - Include clickable **`01 / 02 / 03`** specimen pills on the Chapter 04 panel so a visitor can also jump directly between the three assemblies.

### Bottom of the Paper-Tear Dive (Simulated Interactive StudioMark Console)
Clicking **`Fall into project 04 ↓`** (or **`Fall into StudioMark 04 ↓`**) runs the Astra-approved version `i` paper tear (`TEAR_S = 1.65`) and bore drop (`3.79 s`), landing at the bottom (`#proj`) on either a pipeline-steps video or (preferred) an **interactive simulated version of the finished StudioMark app** powered by pre-rendered frame sets, stills, and MP4 clips (zero `.glb`):
- **Assembly switcher:** Cycle across the 3 Chapter 04 assemblies (Planetary Cage, `DD4SE` Pump Skid, M249 Sub-Assembly).
- **Studio & background switcher:** Light (`White Studio Sweep`), Dark (`Dark Studio Void`), and `Jobsite Plate Composite` (HDRI-lit from background plate).
- **Color / livery / finish swapper:** e.g., Industrial Yellow vs. Rental Blue vs. Raw SolidWorks GLB / Clay; machined steel vs. anodized/oxide finishes.
- **Camera angle scrubber + A/B pipeline wipe:** Scrub camera angle around the pre-rendered model and wipe between `Raw SolidWorks GLB Import` and `Final Cycles Composite`.
- **Pipeline proof & downstream deliverables showcase:**
  - **Pipeline telemetry & parity proof:** Raw CAD → Blender scene build → Cloud Cycles + Product Pixel Integrity Gate (`IoU ≥ 0.995`) → Truth-Photo Parity (`dd4se-reference-vs-render.png`).
  - **Motion & Raw-vs-Post video:** `rl300-hero-master-16x9.mp4`, `rl300-turntable-loop.mp4`, `rl300-clip-A-final-raw.mp4` vs. `rl300-clip-A-final-post.mp4`, plus free viewport camera-preview gates (`rl300-preview-shot1-hook-cutaway.mp4`, `rl300-preview-shot2-doors.mp4`).
  - **Field training & sales presentation proof:** 20-slide pump training & troubleshooting presentation (`C:\Projects\work-assets\portfolio\sample work\powerpoint and training\MSP-URFS-Company-style-example_animated conv 0.png`).
  - **UI reference:** Use the clean coded dark-workshop UI design cues from `C:\Projects\video-app-prep\12-ui-mockups.html` (never the AI `.jpg` mockups).

### Staged Execution Order (Approved)
1. Write the full Chapter 04 implementation & asset plan first (extending `JG-044` or adding a sub-plan) and get Mark's approval.
2. Generate **local preview stills ($0 cloud spend)** for the 3 assemblies and prototype the interactive StudioMark simulator using existing renders/videos.
3. State the exact **Modal Cycles cost estimate** and get Mark's explicit go before any cloud render dispatch.

---

## 3. Research Findings & Asset Reference Map

### StudioMark / MSP Render Pipeline Repositories
1. **`C:\Projects\msp-render-pipeline`** (`README.md`, `render_worker.py`, `composite_worker.py`, `msp_render_cli/`):
   - JSON-manifest-driven Cycles pipeline (`presets`, `validate`, `render`, `composite`, `run`, `new-job`, `dispatch-modal`).
   - Renders transparent `beauty.png` + `mask.png`, lights products directly from HDRI/background plates, synthesizes two-tier shadows (contact line + directional penumbra), and enforces the **Product Pixel Integrity Gate** (machine pixels cannot drift during backdrop/environment edits).
   - Explicitly separates three studio roles: `studio-dark` (gating parity anchor), `studio-white` (surface/roughness/bevel visual approval), and `excavationPit-sunlit` (jobsite composite believability).
2. **`C:\Projects\msp-render-pipeline-scene-prep`** (`PROJECT-BRIEF-2026-09-29.md`, `HANDOFF-2026-10-05b-dd4se-retro-and-code-fixes.md`, `HANDOFF-2026-10-06d-rl300-video-shotcraft-implementation-complete.md`, `scripts/cloud_job_render.py`, `motion/`):
   - Cloud Cycles execution on Modal L4 GPUs under a USD 30/month ceiling (estimate-before / measure-after).
   - Includes the 20-round `DD4SE` photoreal feasibility check (`CAD` in → studio look calibration against real truth photos) and the **Remotion + `video-shotcraft` Motion Workbench** (`motion/`, `export_rl300_timeline.py`, `BlenderPlate.tsx`, `IndustrialCallout.tsx`, `BrandLockup.tsx`, `AudioSequencer.tsx`) outputting 16:9 masters, 15s cutdowns, and 9:16 vertical cuts at $0 cloud spend.
3. **`C:\Projects\video-app-prep`** (`10-build-spec.md` v0.3, `06-pain-log.md`, `09-interview-answers.md`, `11-decision-list.md`, `12-ui-mockups.html`, `08-agent-handoffs/`):
   - Complete product architecture for **StudioMark ("CAD to Ad")**: a single-operator, zero-SaaS web console (local PC first, phone review over Tailscale) targeting 50+ products in 18 months (<1 day per templated model) across sales, marketing, and training.
   - **7-stage pipeline (`0`–`6`):** Automated Model Intake (`STEP`/`GLB` conversion, 996/996 part-name restoration, fastener tagging, `expected_items.json` gap checklist) → Concept → `edit_list.json` Paths & Copy → Free Blender Viewport Preview (`review.html` / A/B wipe / redline pins) → Audio & Graphics Audition Board → Pre-Flight Dispatch Gate + Spend Ledger + Modal Cycles + Photoreal Gate → Social & Training Packaging + Reusable `library/`.
   - Coded UI reference mockups in `12-ui-mockups.html`.

### Sample Work & Visual Asset Vault
- **`C:\Projects\work-assets\portfolio\sample work\rendering pipeline\`** (documented in its `README.md`):
  - `blender-viewport/`: `dd4se-in-blender.png` (raw SolidWorks GLB import), `dd4se-in-blender-r20-scene.png` (automated `render_worker` scene), `rl300-in-blender.png`.
  - `renders-dd4se/`: `dd4se-reference-vs-render.png` (real photo left vs. pipeline render right), `dd4se-r20-az225-beauty.png`, `dd4se-r20-az225-composite.png`.
  - `renders-rl300/`: 8 V16 1080p renders (`rl300-poster1-closed-hero.png`, `rl300-poster2-cutaway.png`, `rl300-poster3-cutaway.png`, `rl300-poster7-cutaway.png`, `rl300-still-closed-hero.png`, `rl300-still-both-doors-open.png`, `rl300-still-closed-front-right.png`, `rl300-still-open-engine.png`) + `rl300-contact-sheet-A.png` / `-B.png`.
  - `process/`: `rl300-preview-shot1-hook-cutaway.mp4`, `rl300-preview-shot2-doors.mp4` (free GPU viewport previews with HUD overlays). *(Note: the 4 `ui-*.jpg` files in `process\` are AI-generated mockups — do NOT use them; use `12-ui-mockups.html` as UI design reference instead.)*
  - `videos/`: `rl300-hero-master-16x9.mp4` (20.7s, 1080p), `rl300-hero-cutdown-16x9.mp4`, `rl300-hero-master-9x16.mp4`, `rl300-hero-cutdown-9x16.mp4`, `rl300-clip-A-final-raw.mp4` & `-post.mp4`, `rl300-clip-B-final-raw.mp4` & `-post.mp4`, `rl300-turntable-loop.mp4` (12.5s 360° orbit).
- **`C:\Projects\work-assets\portfolio\sample work\powerpoint and training\`:**
  - `MSP-URFS-Company-style-example_animated conv 0.png` (20-slide technical pump training & troubleshooting deck) + `.pptx`.
- **`C:\Projects\work-assets\MSP\Renderings\` & `...\other renderings-videos\` & `...\STS_BCP\`:**
  - Additional renders and studio loops (`01-rl300-safe-studio.mp4`, `02-hc150-studio.mp4`, `03-dd6-safe-studio.mp4`, `RL200-dark studio-blue.png`, `RL200-dark studio-yellow.png`, `DP150-RENDERING-FRONT RIGHT*.png`, `DD6-RENDERING*.png`, `gearbox-internals.webp`, `HYDRAULIC-TORQUE-MXT03-ASSY.webp`, `J3DualSpeed.webp`, `angled-torque.png`, `bolt-carrier.webp`, `bolt-group-trio.webp`).
  - **Warning:** Many files in `MSP\Renderings\` and `STS_BCP\` are AI-restyled or carry employer/client logos — filter strictly (see Section 4).
- **Showreel v3 ("The Line") & `JG-041` Backlog (`remotion/README.md`, `remotion/src/scenes/ArmamentAct.tsx`, `TODO.md`):**
  - The current showreel renders site-imported 3D (`WrenchAct`, `MachineAct`) + light-table scan (`ArmamentAct`) + approved Storm Ignition StudioMark logo ident (`LogoIdent`). `JG-041` backlog already calls for an Armament 3D act and a StudioMark rendering-tool act; assets created for Chapter 04 should be planned cleanly alongside those needs.

---

## 4. Critical Guardrails, Sanitization Checks & Open Questions for Planning

### A. Asset & Copy Compliance Issues to Resolve with Mark During Planning
1. **M249 / Armament Compliance:**
   - Confirm exact Assembly 3 pick from `C:\Users\Markimus\Downloads\CAD\Armament\armament\`: `Topcover Assembly\Topcover Assembly.glb` vs. `M249\M249 Receiver Plus.glb` vs. `M249\9348202_-_Receiver.glb`.
   - `m249-transformed.glb` and `m249_FN.glb` remain **strictly banned** (enforced in `remotion/src/rules.test.ts` and `TODO.md`).
   - Confirm IP-safe / display-shell requirements and on-screen wording: pattern/designation only, no third-party brands (no FN/FNH), no dimensions, GD&T, or part numbers on screen.
   - Reconcile `src/home/content.test.ts` line 24 (`['M249', /m249/i]`) when wiring into `src/home/` (note: `JG-044` phase 7 already flagged reconciling the `M249` ban, and `proto/merged/main.js` line 26 already uses `"M249"` in Chapter 03 copy).
2. **Employer / Brand / Product-Name Sanitization on Existing Proofs:**
   - `src/home/content.test.ts` currently bans `MSP`, `Myers`, `Seth`, `RL300`, `JGUN`, and `Torque Gun` on the public homepage.
   - However, several existing sample-work assets carry visible markings/copy:
     - `dd4se-reference-vs-render.png` shows cast `"MYERS-SETH PUMPS"` lettering on the pump housing;
     - `rl300-hero-master-16x9.mp4` ends with the `MSP` + `RL-300 SAFE` lockup;
     - `MSP-URFS-Company-style-example_animated conv 0.png` shows `MSP` logos;
     - `RL200-dark studio-blue.png` / `-yellow.png` carry `"Florida Pumping Solutions"` / `"RL-300"` plates.
   - **Planning question for Mark:** Should these assets be cropped/masked/re-rendered clean for the public site, or does Mark explicitly authorize specific pipeline-proof assets/wording and update `content.test.ts`?
3. **Strict Ban on AI-Generated Product Imagery:**
   - Never use AI-restyled product renders or AI-generated UI mockups from `MSP\Renderings\`, `STS_BCP\`, or `rendering pipeline\process\`:
     - **Exclude:** `ui-master-control-deck.jpg`, `ui-storyboard-audio-sequencer.jpg`, `ui-social-export-suite.jpg`, `ui-critique-redlining-canvas.jpg`, `RL200-JOBSITE.png`, `DD4-render-JobSite.png`, `DD6-SAFE-render-Studio.png`, `torque-lineup.png`, `Mockup__*`, `Image_on_*`, `Mural_*`, and any AI-composited jobsite/garage shots.
     - **Use only:** real SolidWorks/Blender/Cycles renders, real ground-truth studio photographs (for parity comparisons), and coded HTML/CSS UI inspired by `C:\Projects\video-app-prep\12-ui-mockups.html`.

### B. Standing Boundaries Carried Forward (`HANDOFF-homepage-merged-prototype-2026-11-18.md`)
- Paper tear **version `i`** in `proto/merged/main.js` is finished and Astra-approved — do **not** retune it unless Mark asks.
- Nothing goes into `src/home/` before **JG-044 Gate 2** (Mark approves the merged prototype).
- Never put `.glb` models on `/home/`.
- Testimonial attribution is **`"BCP"`** only; never reuse `"Precision Revealed"`.
- **Astra** (`gpt-6.2-astra` on codex) rules on visual effects before they are called done.
- **No Modal or Higgsfield spend** without stating the exact cost first and getting Mark's explicit go for that run.
- Commit by explicit path only (never `.scratch/`); push only with Mark's go (`git push --no-verify`).
- Keep **JG-045 (clean repo split)** in view (starts only after JG-044 Gate 2). Never remove worktree `armament-wiring-clipspin-15a80d`.

### C. Open Questions for the Planning Session to Resolve with Mark
1. **Chapter 04 scope & relationship to `#systems` ("The plus"):**
   - Now that Chapter 04 merges Renderings + Animation + StudioMark, should Section 7 (`#systems`) remain a dedicated Systems Builder section for `PumpTracker` and `CAD/PDM tools` (with StudioMark referencing/jumping back to Chapter 04), or become interactive in its own right?
   - Should the bottom-of-dive StudioMark simulator also link out to a dedicated `/studiomark/` (or `/renderings/`) page via `#pjA`, or is the bottom-of-dive simulator the full experience?
2. **Exact Assembly picks & finish/lighting matrix:**
   - Which specific large cage from `Default.glb` / `jgun-gearbox.glb` (e.g., Stage 1 or Stage 2 carrier + planets) should be isolated for Assembly 1?
   - Which M249 sub-assembly from Option B is primary (`Topcover Assembly.glb` vs. `M249 Receiver Plus.glb`)?
   - Which exact combinations of `(assembly × environment × livery/finish × angle steps)` belong in the **simulator matrix** so WebP/video weight stays fast on `/home/`?
3. **Brand/logo sanitization ruling:** Clean/cropped/masked vs. keeping original brand marks in pipeline proof slides.
4. **Carried open questions from `HANDOFF-homepage-merged-prototype-2026-11-18.md`:**
   - Question #1: What do dives 01–03 land on (showreel passages or one dedicated clip per project)?
   - Question #3: Confirm keeping the existing 120-frame carbine spin on Chapter 03 (`proto/merged/arm/`). *(Note: Question #2 — which model Chapter 04 shows — is now answered.)*

### D. Review additions (homepage session, 2026-11-18; Mark: "update docs with the plan")
The plan stands. These six additions apply to the planning session:
1. **M249 provenance.** The Topcover Assembly part GLBs are IGES conversions with drawing numbers in their filenames (e.g. `Topcover Assembly - 9348253 - Pivot (Short), Link - M249.IGS.glb`). Confirm with Mark that this is his own geometry; apply the BCP-condition display-shell rule from `TODO.md`; keep part and drawing numbers out of every label, filename that ships, and frame.
2. **Weight budget by reuse.** Render the shade pass on transparent so the page draws the light / dark / jobsite backgrounds (no render per background). One 60-frame angle set per assembly serves both the Chapter 04 scroll beats and the console's angle scrub. Finishes and liveries ship as hero-angle stills only. The A/B wipe is the line pass against the shade pass on the same frame (no extra render). Rough total: 6-7 MB of frames for 3 assemblies (the carbine set is 2.16 MB per 60 + 60 frames). Console videos and the 20-slide deck load only when the console opens. The plan states the measured MB.
3. **Gate 2 scope.** The plan states whether the console is part of JG-044 Gate 2 or comes after it. Recommendation: a thin console in Gate 2 (assembly switch, background, angle scrub, A/B wipe); truth-photo parity, videos and the deck after Gate 2, so Gate 2 and JG-045 are not held up.
4. **Pilot first.** Planetary cage only: local $0 preview stills, then one Modal run with its cost stated and Mark's go, before DD4SE and the M249 sub-assembly. Same Blender scene setup as the Chapter 01 torque-wrench pilot.
5. **Questions with defaults.** Every open question in C goes to Mark with a recommended default, so he can answer in one pass.
6. **Astra step.** The plan names an Astra ruling on the console and on every Chapter 04 effect before either is called done.

Cost estimates (not measured): planning session about 150-250k tokens; Modal Cycles for all three assemblies about $2-6 (carbine reference: $0.48 for a full 360-frame render, $0.05 shade-only).

---

## 5. Ready-to-Paste Prompt for the Receiving Session

```text
Open this session on the folder C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a. Do not start in a new worktree and do not edit inside jgun-torque-wrench.

Read in order:
1. C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\docs\HANDOFF-chapter4-studiomark-design-2026-11-18.md
2. docs/HANDOFF-homepage-merged-prototype-2026-11-18.md (and 17c, 17b)
3. AGENTS.md, TODO.md (Active), project/work/plans/JG-044-homepage-merged-concept.md, project/work/plans/JG-045-clean-repo-split.md
4. proto/merged/index.html and proto/merged/main.js

Context: Mark has approved the design direction for Chapter 04 (merging Renderings, Animation & StudioMark) using pre-rendered dual-pass Cycles sequences (no .glb on /home/):
- Locked 3 assemblies (Option 1 scroll-sequenced + 01/02/03 specimen pills):
  1. One of the larger 3 planetary carrier cage assemblies (Default.glb / jgun-gearbox.glb)
  2. DD4SE open-skid pump (C:\Projects\msp-render-pipeline-scene-prep\cad\DD4SE-clean.glb)
  3. M249 sub-assembly — Option B (Topcover Assembly.glb / M249 Receiver Plus.glb)
- Bottom of the paper-tear dive: simulated interactive StudioMark console (switch assemblies, light/dark/jobsite backgrounds, colors/finishes, camera angle scrub, A/B raw-CAD-vs-Cycles wipe, truth-photo parity, finished/raw-vs-post videos, and the 20-slide MSP pump training deck), styled after 12-ui-mockups.html (no AI UI mockups or AI product renders).

Next action: PLANNING ONLY. Do NOT edit prototype code, run Blender/Modal renders, commit, or push yet.
1. Inspect the 3 locked source assemblies and existing curated sample assets in C:\Projects\work-assets\portfolio\sample work\rendering pipeline\ and ...\powerpoint and training\.
2. Ask Mark only the remaining open planning questions (exact cage & M249 sub-assembly picks, simulator finish/angle matrix for weight budget, logo/brand sanitization rule for existing proofs, #systems relationship, plus carried dives 01-03 target and Chapter 03 carbine confirmation).
3. Produce a concrete Chapter 04 implementation & asset-pipeline plan (extending JG-044) covering: Blender dual-pass render setup, WebP/video frame budget, local $0 preview stills gate, exact Modal Cycles cost estimate before any spend, and bottom-of-dive UI architecture. Wait for Mark's approval before building.

Constraints: Paper tear version i is Astra-approved (do not retune). Nothing enters src/home/ before JG-044 Gate 2. No .glb on /home/. No AI-generated product imagery or AI UI mockups. Keep m249-transformed.glb and m249_FN.glb banned; obey armament pattern/designation and no-GD&T/dimension rules. Testimonial = "BCP" only; never reuse "Precision Revealed". Astra rules on visual effects. No Modal/Higgsfield spend without stating cost first and Mark's explicit go. Preserve JG-045 (clean repo split after Gate 2) and worktree armament-wiring-clipspin-15a80d.

Additions (Section 4D): (a) Confirm the M249 Topcover/Receiver GLBs are Mark's own geometry; apply the BCP-condition display-shell rule; no part numbers in labels or frames. (b) Render on transparent; one 60-frame angle set per assembly serves both the chapter scroll and the console scrub; finishes as hero stills only; state the total MB. (c) State whether the console is in Gate 2 or after it; recommend a thin console for Gate 2. (d) Pilot the planetary cage first: $0 local stills, then one Modal run with its cost stated, before the other two. (e) Give every question a recommended default. (f) Add an Astra ruling step for the console and the Chapter 04 effects.

Git: these docs are on origin/claude/homepage-prototype-gate-2-be5a82. Before reading, delete the untracked copy of docs/HANDOFF-chapter4-studiomark-design-2026-11-18.md in b6962a, then git fetch and fast-forward claude/homepage-prototype-approval-b6962a to it (git merge --ff-only).
```
