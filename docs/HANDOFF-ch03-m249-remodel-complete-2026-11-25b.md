# Handoff — Chapter 03 M249 5-Assembly Remodel & CAD Fit Corrections (2026-11-25b)

- **Workspace:** `c:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-scrubbing-videos-ffaf5d`
- **Branch:** `feat/ch03-arm-drop-video` (branched directly from `main` `65a567a2` == `origin/main` == live `studiomark.dev/home/` Pages `c658fda9`; `origin/feat/ch03-arm-drop-video` at `88ad60d3`)
- **Previous Handoff:** `docs/HANDOFF-ch03-m249-remodel-list-2026-11-25a.md` (`0856388b`)
- **Workspace Spend So Far:** `$0.00` (local Blender `5.3.0` Cycles `GPU:HIP:AMD Radeon 780M Graphics`)

> **CRITICAL WORKTREE CONSOLIDATION WARNING:**
> All Blender source `.blend` files, modular remodel scripts, reference photos, and Cycles verification sheets (`92` files / `344.77 MB`) live inside **gitignored** `.scratch/ch03-m249-video/` inside this worktree directory! **Do NOT delete or prune `homepage-scrubbing-videos-ffaf5d` without first moving/preserving `.scratch/ch03-m249-video/`.**

---

## Done

1. **Immutable Backup of Mark's Manual Trigger Blend:**
   - Copied Mark's `2026-11-25 05:40:15 AM` `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend` to `.scratch/ch03-m249-video/backups/m249_ch03_studio_ready_2026-11-25_0540_mark_backup.blend` (`47,504,070` bytes, SHA-256 `C31806CA5935050655DCF93FA5B7A9B787C639ECBD76419A835D03BC6CAB48FB`), recorded in `.scratch/ch03-m249-video/backups/backup_manifest.json` and verified intact after all runs.
2. **Locked Owner Variant Rulings & Clean Native Blender 5.3.0 Remodeling (`$0.00` Local):**
   - Replaced all 5 `m249_FN.glb`-derived `FIT_*` placeholder assemblies (`22` `REMODEL_*` meshes total, `0` old `FIT_*` meshes left, `non_manifold_edges: 0`, `loose_verts: 0`, `ob.color = (1.0, 0.42, 0.06, 0.0)`, `F140–F249` isolation keyframes & `FIT_*` `location` fcurves preserved):
     1. **`FIT_Barrel_Assembly` + `MOD_Carry_Handle` (`01_build_barrel.py`):** Long Standard SAW Barrel Fig. 3 (`12011986`) with hollow slotted birdcage flash hider, rear chamber locking collar & bottom lug seated in `Barrel Support-1-1`, gas block + protective-ear front sight + machined gas regulator mating `9348347 - Head, Gas Cylinder-1-1`, and modular `MOD_Carry_Handle` (collar, bent bow + nut, 4-finger-grooved polymer grip).
     2. **`FIT_HeatShield_Assembly` (`02_build_heatshield.py`):** Curved U-channel shroud (`12540405`) with two 4-column × 3-row cooling banks (24 ports), center rivets, recessed inner thermal baffle, and bifurcated front fork + side spring clips straddling the front sight base.
     3. **`FIT_Handguard_Assembly` (`03_build_handguard.py`):** Fig. 7 Accessory Rail Handguard (`12993771`: Right `12993773`, Left `12993772` `B26–B32`) in `MAT_Anodized_Aluminum`, clearing `9348203 - Body, Receiver-1` sidewalls and `9348206 - Bushing, Front-1-1`, with 15-slot 3/9 o'clock Picatinny rails, 2 oblong vents per side, 10-slot bottom rail + forward QD/sling window, and 2× `NAS1352-08-10P` SHCS fasteners.
     4. **`FIT_Trigger_Assembly` (`04_build_trigger.py`) & `9350026 - Pistol Grip-1-1` (`06_swap_and_verify.py`):** Fig. 5 Item 14 (`9348350`) with `FIT_Trigger_FrontLug` kept deleted.
        - **Trigger Frame width (`15:45 PM` ruling):** Narrowed `REMODEL_Trigger_Frame_9348352` uniformly along `X:[0.0831..0.2471]` to **`20.40 mm`** (`Y:[-10.2..+10.2] mm`) so it rests cleanly **inside** `Trigger Frame Support-1-1` (`±10.82 mm`) and **between** `9348211 - Block, Rear-1-1-1` (`±11.70 mm`); updated safety (`±13.2 mm`), flush mid-frame pins (`±10.6 mm`), front cross-pin (`±18.8 mm`), and rear takedown pin (`±17.2 mm`).
        - **Pistol Grip butt-up & Trigger Guard notch (`17:39 PM` ruling):** Welded `9350026 - Pistol Grip-1-1` (`dist=1e-4`), shifted its `location[2]` fcurve down `-0.0215 m` (preserving `-0.125 m` explode stroke), bisected its top flat at `Z = -0.02122 m` so it **butts flush underneath `REMODEL_Trigger_Frame_9348352`** with zero penetration, cut a `10.8 mm` (`Y:±5.4 mm`) front resting notch (`X:[0.1440..0.1585]`), and routed `REMODEL_Trigger_Guard_9348370`'s hooked rear leg (`9.4 mm` wide) cleanly into that notch at `X = 0.1538`.
     5. **`FIT_Bipod_Assembly` + `PIVOT_Bipod_Hinge` (`05_build_bipod.py`):** Yoke collar clamping `Gas Tube Support-1-1`, hinge pin + swivel head on `PIVOT_Bipod_Hinge`, and folded 3-notch U-channel legs + extension rods + spiked skid feet clearing the bottom Fig. 7 rail by `3.5 mm`.
3. **Rear Sight Assembly Left-Side-Only Knurled Knob & Feed Tray Check (`06_swap_and_verify.py`):**
   - **Per Mark's 2026-11-25 15:45 PM CAD export correction**, relocated `9350015 - Knob Assembly-1` from the erroneous outer right (`+Y`) rear position to the **outer left (`-Y`) front windage axis** (`loc = [-0.01975, -0.00910, -0.01800]`, matching `9350015 - Knob Assembly`'s quaternion orientation, coaxial with `9350006 - Screw, Machine-1`), and re-keyed `F1..F280` `location` fcurves so **both** left-side knurled knobs sit at `Y:[-26.1..-17.3] mm` at Frame 1 and explode outward to `-Y` (`Y < -55 mm`) at `F120`, preserving `F140–F249` isolation.
   - **Feed Tray verification (`17:39 PM`):** Verified `Feed tray.IGS-1` (`2,708` verts, parented to `Topcover Assembly.IGS` with `F60`/`F120` explode keyframes) is already seated on `9348203 - Body, Receiver-1` (`X:[-0.01122..0.07977], Y:[-0.04216..0.02084], Z:[0.04097..0.08097]`) matching `C:\Projects\CAD\Markimus-M249\Feed tray.IGS.glb` (`best_rms_mm = 3.594`, retained existing keyed CAD mesh).
4. **Telemetry & Cycles HIP Verification (`06_swap_and_verify.py`):**
   - Saved `.scratch/ch03-m249-video/remodel/m249_ch03_studio_remodeled_v3.blend` and updated `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend`.
   - `CAM_Anim_Review` framing `inside: true, behind: false` at all 7 checkpoints (`[F1, F60, F120, F175, F194, F224, F280]`).
   - Rendered Cycles HIP contact sheets (`verify_01..05.png`, `verify_06_closeup_mating_sheet.png`, `verify_07_hero_and_explode_sheet.png`, `verify_08_corrections_sheet.png`, `verify_09_grip_and_feedtray_sheet.png`) and verified visually against Mark's photos.

---

## Gitignored Local Inventory (`.scratch/ch03-m249-video/`)

- `m249_ch03_studio_ready.blend` — Updated production-ready 280-frame Cycles HIP scene (with all 5 remodeled assemblies + Rear Sight fix)
- `backups/m249_ch03_studio_ready_2026-11-25_0540_mark_backup.blend` + `backup_manifest.json` — Immutable SHA-256 backup of Mark's `05:40 AM` save
- `remodel/common_m249.py`, `01_build_barrel.py` .. `05_build_bipod.py`, `06_swap_and_verify.py` — Deterministic `$0` local remodel & swap pipeline
- `remodel/asm_01_barrel.blend` .. `asm_05_bipod.blend` & `m249_ch03_studio_remodeled_v3.blend` — Standalone assembly files + v3 studio snapshot
- `remodel/verify_01..05.png`, `verify_06_closeup_mating_sheet.png`, `verify_07_hero_and_explode_sheet.png`, `verify_08_corrections_sheet.png`, `verify_09_grip_and_feedtray_sheet.png` — Cycles HIP visual verification sheets
- `references/ref_01..ref_05.jpg`, `01..05_*.py`, `m249_ch03_assembled.blend`, `stills/`, `storyboard_contact_sheet.png`, `verify_01..03_*.png` — Earlier assembly/storyboard pipeline

---

## Exact Next Action

> **Owner Ruling (2026-11-26 — Interim Site Video Scope):** Proceeding now with rendering & animating the current M249 assembly so visitors have a live WIP video on the site while Mark models the remaining missing major components (e.g., Fig. 6 bolt/piston/operating-rod internals, Fig. 1 small hardware/barrel-locking lever, Fig. 10 shoulder rest/buttplate). Those missing major components will be added later and the Chapter 03 video revised accordingly (consistent with the evolving-portfolio owner policy).

1. **Chapter 03 Interim Video Render & Animation:** Render the 280-frame sequence from `m249_ch03_studio_ready.blend` (local Cycles HIP or quoted Modal/cloud run **only after explicit Mark cost approval**), cut the dark-studio no-VO animation + redacted GD&T beat, wire into `proto/merged/arm/drop-reel.mp4`, and run Gate 2 before any push/deploy.
2. **Visual Verification & Subsequent Revision:** Review `.scratch/ch03-m249-video/remodel/verify_06_closeup_mating_sheet.png`, `verify_07_hero_and_explode_sheet.png`, `verify_08_corrections_sheet.png`, and `verify_09_grip_and_feedtray_sheet.png` (or via `05_open_review_ui.py`), publish the interim WIP cut upon Mark's go, and follow up with a revised cut once Mark finishes modeling the remaining major components.
3. **Worktree Consolidation Note:** `feat/ch03-arm-drop-video` branches cleanly from `main` (`65a567a2`, matching live `studiomark.dev/home/` `c658fda9`). Keep this worktree intact until `.scratch/ch03-m249-video/` (`344.77 MB`) is rendered/migrated.

---

## Known Gotchas

- **NEVER delete this worktree (`homepage-scrubbing-videos-ffaf5d`) before copying `.scratch/ch03-m249-video/`** (`92` files / `344.77 MB` are gitignored and exist only here on disk).
- **NEVER run `03_studio_and_storyboard.py` over `m249_ch03_studio_ready.blend`** — it reads the old `m249_ch03_assembled.blend` and would erase both Mark's trigger edits and the 5 remodeled assemblies; rebuild/re-swap via `remodel/06_swap_and_verify.py` instead.
- **Blender binary:** Always invoke `"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python-exit-code 1` (never `blender.cmd`).
- **Worktree hygiene:** Verify LF line endings before commits, keep `node_modules` junctioned (untracked), stage ONLY explicit paths (`git commit -F <file>`), and **never** commit `.scratch/`.

---

## Approval State & Boundaries

- **Approved (`$0` local work):** Blender remodeling, fitting, Cycles HIP preview renders, and contact sheets inside gitignored `.scratch/ch03-m249-video/`.
- **Blocked without explicit Mark approval:** Any paid Modal / Higgsfield / cloud spend (quote exact cost first), any `git push`, any Cloudflare Pages deploy, or adding any `.glb` to `/home/`. Final Chapter 03 video swap requires Astra QA + Mark visual sign-off.

---

## Tooling Manifest

| Phase | Tool / Skill | Version / Location | Purpose | Owner Staging / Status |
| :--- | :--- | :--- | :--- | :--- |
| Image-to-3D Mechanical Remodeling | Blender CLI + Cycles HIP | `5.3.0` / `GPU:HIP:AMD Radeon 780M Graphics` | Procedural hard-surface remodeling & Boolean/manifold QA of the 5 M249 assemblies + Rear Sight fix | Completed locally (`$0.00`) |
| Modeling & Review Discipline | `blender-agent-core`, `blender-image-to-3d`, `blender-mechanical-toolkit` | `C:\Users\Markimus\.agents\skills\...` & `.agents\skills\...` | Fidelity contracts, Form/Production gates, hard-surface bevel/manifold checks | Active local |
| Cloud GPU Render (Deferred) | Modal / Higgsfield | Not run | High-res final Chapter 03 video render (only after Mark preview approval) | **Not used** — blocked on cost quote + Mark go |
| Site Deploy (Deferred) | Wrangler / Cloudflare Pages | Not run | Chapter 03 video publication to `studiomark.dev` | **Not used** — blocked on Mark approval |

---

## Ready-to-Paste Next-Session Prompt

```text
Read first:
1. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/AGENTS.md
2. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/TODO.md
3. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/docs/HANDOFF-ch03-m249-remodel-complete-2026-11-25b.md

Workspace: c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d (branch feat/ch03-arm-drop-video, branched from main 65a567a2).

Context & Hard Rules:
- All 5 M249 assemblies are cleanly remodeled and swapped into .scratch/ch03-m249-video/m249_ch03_studio_ready.blend (with 20.4 mm Trigger Frame + flush Pistol Grip + 10.8 mm Trigger Guard notch + left-side-only Rear Sight knurled knobs verified in verify_06..09.png).
- 2026-11-26 Owner Ruling: Proceed now with rendering & animating the current assembly as an interim WIP site video while Mark models the remaining missing major components (Fig. 6 bolt/piston/op-rod internals, Fig. 1 small hardware/barrel-locking lever, Fig. 10 shoulder rest/buttplate) for a later revised video cut.
- Keep .scratch/ch03-m249-video/ (344.77 MB gitignored) protected; never commit .scratch/, never run git add -A, and do NOT run Modal/Higgsfield/push/deploy without explicit cost quote + Mark's go.
- Always invoke Blender 5.3.0 via "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python-exit-code 1.

Next Action:
1. Proceed with rendering & animating the 280-frame interim Chapter 03 video cut from m249_ch03_studio_ready.blend (local Cycles HIP or quoted cloud render upon Mark's approval) + Gate 2 verification.
2. Mark the interim video as WIP (missing major components noted) and revise the video later once Mark finishes modeling the remaining components.
```
