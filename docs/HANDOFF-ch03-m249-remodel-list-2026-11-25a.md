# Handoff — Chapter 03 M249 Placeholder Fit, Mark's Blender Edits & 5-Assembly Remodel Plan (2026-11-25a)

- **Workspace:** `c:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-scrubbing-videos-ffaf5d`
- **Branch:** `feat/ch03-arm-drop-video` (local at `7606ab2d` + this doc commit; `origin/feat/ch03-arm-drop-video` at `88ad60d3`; branched from `main` `65a567a2`)
- **Live Site State (unchanged):** `studiomark.dev/home/` = Cloudflare Pages `c658fda9`; `main` pushed `65a567a2` (no `.glb` on `/home/`).
- **Previous Handoff:** `docs/HANDOFF-ch03-m249-blender-rig-2026-11-24b.md`
- **Workspace Spend So Far:** `$0.00` (local Blender `5.3.0` Cycles `GPU:HIP:AMD Radeon 780M Graphics`)

---

## Done

1. **Interim Drop & Authoritative CAD Rig (`65a567a2`, `b13fa627`, `88ad60d3`, `7606ab2d`):**
   - Pushed `feat/ch03-arm-drop-video` (`88ad60d3`); locked dark-studio no-VO Chapter 03 M249 spec in `TODO.md` & `project/work/plans/JG-044-homepage-merged-concept.md`.
   - Assembled Mark's 97-mesh CAD (`receiver_assy_plus-rev1.glb` + grafted `9348240` leaf pin & 4 buffer wiper/retainer rings) under `COL_Markimus_Assembled`.
2. **280-Frame Explode Rig, Slide Clearance & 11-Part Receiver Weldment Sweep (`$0` local):**
   - Pulled `9348392 - Slide-1-1` rearward `+0.185 m` X (`37.5 mm` clear behind `9348211 - Block, Rear-1-1-1`, `64.4 mm` ahead of `12556937 - Back Plate-1`), verified via telemetry at `F60` and `F120`.
   - Kept all 11 Receiver Weldment parts locked together during `F1–F139`, then isolated them (`F140–F249`) with a 16-frame quick explode, sequential front-to-back amber highlight sweep (`ShaderNodeObjectInfo` + alpha pulse `F164–F222`), and rigid snap-back confirmation pulse (`F239–F247`).
   - Built continuous `CAM_Anim_Review` (`F1–F280`, `24 fps`) + `05_open_review_ui.py`; verified `inside: true, behind: false` at `[F1, F60, F120, F175, F194, F224, F280]` and on all 8 Cycles stills.
3. **Placeholder Fit Extraction & Mark's Manual Blender GUI Edits (Preserved in `m249_ch03_studio_ready.blend`):**
   - Extracted & fitted 5 missing external placeholder assemblies from `C:\Projects\CAD\M249\m249_FN.glb` onto Mark's 97-mesh CAD (`FIT_*` empties -> `116` meshes total, unrequested `COL_Reference_M249FN` kept hidden).
   - **CRITICAL — Mark's manual GUI edits saved in `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend` (`2026-11-25 05:40:15 AM`) — DO NOT overwrite this `.blend` blindly!** Audited diff vs `m249_ch03_assembled.blend`:
     - **Deleted:** `FIT_Trigger_FrontLug` (duplicate of Mark's `Trigger Frame Support-1-1`)
     - **Moved `FIT_Trigger_Frame`:** `+0.0075 m` Z -> Frame-1 world bbox `X:[0.0831..0.2471], Y:[-0.0182..0.0159], Z:[-0.0449..-0.0002]`
     - **Moved `FIT_Trigger_And_Guard`:** `+0.002 m` X, `+0.010 m` Z -> Frame-1 world bbox `X:[0.0861..0.1481], Y:[-0.0058..0.0062], Z:[-0.0457..-0.0117]`
     - **Moved `FIT_Trigger_CrossPin`:** `-0.003 m` X, `+0.0075 m` Z -> Frame-1 world bbox `X:[0.0848..0.0948], Y:[-0.0175..0.0177], Z:[-0.0168..-0.0068]`
     - Also mirrored those exact deltas into `.scratch/ch03-m249-video/02_assemble_m249.py` (without re-running Blender over Mark's saved file).
4. **Saved All 5 Reference Images Locally in `.scratch/ch03-m249-video/references/`:**
   - `ref_01_m249_saw_profile.jpg` — Complete right-side M249 SAW profile (standard polymer handguard, long barrel, carry handle, deployed bipod, trigger group)
   - `ref_02_trigger_mechanism_assy_fig5_item14.jpg` — `PCOOW249Configurations.pdf` Fig. 5 Item 14 (`9348350`) assembled Trigger Mechanism profile
   - `ref_03_barrel_assy_fig4_item13.jpg` — `PCOOW249Configurations.pdf` Fig. 4 Item 13 (`12556953`) assembled Barrel + Gas Block/Regulator + Front Sight + Carry Handle
   - `ref_04_accessory_rail_handguard_fig7.jpg` — `PCOOW249Configurations.pdf` Fig. 7 Accessory Rail Handguard (`12993771`: Right `12993773`, Left `12993772` `B26–B32`, Screws `NAS1352-08-10P`)
   - `ref_05_heatshield_assy_fig3_item12.jpg` — `PCOOW249Configurations.pdf` Fig. 3 Item 12 Heatshield Assembly (`12540405`, 3×8 hole pattern + front fork tangs)

---

## PDF & CAD Folder Search Findings

Searched `C:\Projects\CAD\Markimus-M249\`, `C:\Projects\CAD\M249\`, `C:\Projects\CAD\`, `C:\Projects\work-assets\`, `C:\Projects\`, `Downloads`, `Documents`, `Desktop`, and OneDrive/User folders:

- **Found M249 PDFs (only inside `C:\Projects\CAD\Markimus-M249\`):**
  1. `C:\Projects\CAD\Markimus-M249\PCOOW249Configurations.pdf` — Complete 24-page *Ohio Ordnance Works OOW249 / OOW249 (Para) Parts Catalog* (Sept 2016), Figs. 1–12 exploded photo plates + Part Number / NSN BOM tables.
  2. `C:\Projects\CAD\Markimus-M249\PCOOW249Configurations Copy.pdf` — Duplicate copy (4,310,430 bytes).
  3. `C:\Projects\CAD\Markimus-M249\PCOOW249Configurations-1.pdf` — 4-page Figs. 1–2 subset.
  4. `C:\Projects\CAD\Markimus-M249\M249-SAW.jpg` & `PCOOW249Configurations Copy conv\PCOOW249Configurations Copy conv 0.png` — High-res photo breakdown and full catalog composite sheet.
- **No separate dimensioned manufacturing drawing PDFs** exist anywhere on disk for the missing external M249 subassemblies. (Other PDFs found were unrelated pump/quote/RL200/DD/AR-15/torque-gun docs.)
- **Existing Native CAD in `C:\Projects\CAD\Markimus-M249\` Worth Checking First:**
  - `Barrel Carrying Handle Assy.SLDASM` (native SolidWorks assembly — unconverted `.glb`!)
  - `709870994135 - Trigger Bar Pivot Pin.SLDPRT`
  - `drive-download-20261125T025716Z-1-001\Carbine_Buffer_Spring_Compressed.stp`, `Takedown_Spring_Compressed_Front.stp`, `Takedown_Spring.stp`

---

## Master Remodel Parts List (Antigravity + Opus + Astra)

Every `FIT_*` placeholder currently fitted from `m249_FN.glb` **must be replaced with clean, accurate Blender-remodeled geometry** fitted directly to Mark's 97-mesh CAD landmarks and `m249_ch03_studio_ready.blend` envelopes:

| # | Target Empty / Group | Part / Sub-Component (`PCOOW249` BOM Part # & Fig.) | Reference Assets | Markimus CAD Mating & Exact Envelope (`m`) | Remodel Scope & Notes |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `FIT_Barrel_Assembly` | **Barrel, Chamber Locking Collar & Flash Hider** (Fig. 3 Item 14 `12011986` Long / Fig. 4 Item 13 `12556953` Short); **Front Sight Base/Post/Key/Pin** (`9348441`, `9348442`, `9350047`, `9350048`); **Gas Block & Gas Regulator Knob/Collar**; **Carry Handle** (`12557008` Bow, `9348438` Finger-Grooved Grip, `12557020` Ring, `12557012` Pin, `12557009` Bushing, `MS24585-C279` Spring, `9348439` Washer, `9348440` Nut) | `ref_03_barrel_assy_fig4_item13.jpg`; `PCOOW249Configurations.pdf` pp. 7–10; `M249-SAW.jpg`; native `Barrel Carrying Handle Assy.SLDASM` | Rear chamber seats into `Barrel Support-1-1` (`X=[-0.0312..0.0063]`, bore `Z_center = +0.0461 m`); gas regulator lower cylinder meets `9348347 - Head, Gas Cylinder-1-1` (`X=[-0.2801..-0.2301]`, `Z_center = +0.0150 m`); envelope `X ≈ [-0.541..-0.031]` (Long) | Remodel clean machined barrel w/ slotted flash hider, rear locking lug collar (`-0.031..+0.005 X`), stepped gas block + grooved regulator knob (`ref_03`), protected-ear front sight + post, and contoured finger-grooved carry handle (`Barrel Carrying Handle Assy.SLDASM` if exportable) |
| **2** | `FIT_HeatShield_Assembly` | **Heatshield Assembly** (Fig. 3 Item 12 `12540405`) | `ref_05_heatshield_assy_fig3_item12.jpg`; `PCOOW249Configurations.pdf` p. 7; `ref_01_m249_saw_profile.jpg` | Spans above barrel & front receiver top flange (`Z_top = +0.0499 m`), rear sits ahead of `Barrel Support-1-1` / feed cover area (`X ≈ [-0.240..-0.080]`, `Z ≈ [+0.046..+0.072]`) | Stamped-steel curved U-channel shroud with 3 rows × 8 circular cooling ports, front bifurcated retaining fork tangs hooking around front sight base (`ref_05`), clean shell thickness (`~1.2–1.5 mm`) |
| **3** | `FIT_Handguard_Assembly` | **Option A (Modern Railed):** Fig. 7 Accessory Rail (`12993771`: Right `12993773`, Left `12993772` marked `B26–B32`, 2× `NAS1352-08-10P` SHCS)<br>**Option B (Classic Polymer):** Fig. 8 Guard, Hand (`12556973`) — or combine bottom ribbed heat-polymer body + side Picatinny rails if desired | `ref_04_accessory_rail_handguard_fig7.jpg` (Fig. 7); `ref_01_m249_saw_profile.jpg` & `PCOOW249Configurations.pdf` pp. 15–18 | Wraps cleanly outside `9348203 - Body, Receiver-1` sidewalls (`Y = ±0.0231 m`) & clears `9348206 - Bushing, Front-1-1` (`X=[-0.207..-0.177]`, `Z=[-0.020..+0.010]`); placeholder envelope `X ≈ [-0.220..-0.020]`, `Z ≈ [-0.040..+0.032]` | Remodel crisp symmetrical shell (`~3–4 mm` wall) with front circular pin relief notch, side ribs (`12556973`) and/or MIL-STD-1913 Picatinny rails + oblong vent slots + fastener counterbores (`ref_04`), zero z-fighting on receiver rivets |
| **4** | `FIT_Trigger_Assembly` | **Trigger Mechanism Assembly** (Fig. 5 Item 14 `9348350`):<br>• `9348352` Frame, Trigger *(replaces widened `FIT_Trigger_Frame`)*<br>• `9348370` Guard, Trigger *(stamped spring-steel loop)*<br>• `9348354` Trigger Assembly *(curved shoe + sear-trip tang)*<br>• `9348364` Safety, Small Arms *(cross-bolt push button w/ groove)*<br>• **Pins / Screws (optional):** `9348367`, `9348353`, `9348363`, `11826255`, `9348246`, `9348372`, `709870994135` | `ref_02_trigger_mechanism_assy_fig5_item14.jpg`; `PCOOW249Configurations.pdf` pp. 11–12; `m249_ch03_studio_ready.blend` **(Mark's manual moves!)** | Front clevis mates `Trigger Frame Support-1-1` (`X=[+0.070..+0.100]`, `Z=[-0.022..+0.006]`); rear lug mates `9348211 - Block, Rear-1-1-1` (`X ≈ +0.246`); bottom seats Mark's `9350026 - Pistol Grip-1-1` (`X=[+0.149..+0.212]`, `Y=±0.0155`).<br>**Use Mark's edited `m249_ch03_studio_ready.blend` placement:**<br>• Frame `X:[0.0831..0.2471], Z:[-0.0449..-0.0002]`<br>• Guard `X:[0.0861..0.1481], Z:[-0.0457..-0.0117]`<br>• Pin `X:[0.0848..0.0948], Z:[-0.0168..-0.0068]` | Replace non-uniformly scaled `FIT_Trigger_Frame` (`m249_FN`) with exact stamped-channel Frame (`33–34 mm` OD, `24–25 mm` ID clevis, side pin bores, front hinge slot, rear pin ear per `ref_02`), formed wire Trigger Guard (`ref_02`), true `9348354` Trigger (`ref_02` + Fig. 5 #4), and cross-bolt Safety (`9348364`)! Keep `FIT_Trigger_FrontLug` **deleted**. |
| **5** | `FIT_Bipod_Assembly` | **Machine Gun Bipod Assembly** (Figs. 11–12, `PCOOW249` pp. 23–25):<br>• Gas-Tube Clamp Collar / Yoke<br>• Swivel Head & Spring Hinge Pivot (`PIVOT_Bipod_Hinge`)<br>• Left & Right Stamped-Channel Legs (3× deployment detent notches)<br>• Articulated Spiked Skid Foot Pads | `ref_01_m249_saw_profile.jpg`; `M249-SAW.jpg`; `PCOOW249Configurations.pdf` pp. 2, 23–25 | Clamps cleanly on `Gas Tube Support-1-1` (`X=[-0.2706..-0.2313]`, collar ID `~36 mm`); swivel hinge sits around `(-0.255, 0.0, -0.036)`; folded legs tuck beneath handguard bottom (`Z ≈ [-0.064..-0.042]`, extending rearward to `X ≈ -0.005`) | Remodel clean collar yoke (`pp. 23–24`), hinge block + spring pin, twin tapered legs with 3 positioning notches + inner extension tubes, and L-shaped claw feet; rig around `PIVOT_Bipod_Hinge` so legs fold cleanly AND can deploy down if needed |

*(Out of scope unless requested later: Fig. 1 tiny loose pins/ejector/barrel-locking lever, Fig. 6 bolt/piston/return-rod internals, Fig. 10 shoulder rest/buttplate.)*

---

## In Progress / Open Decisions

- **Confirm two quick variant choices with Mark before remodeling:**
  1. **Handguard variant:** **Fig. 7 Picatinny Accessory Rail** (`ref_04`, modern MK46/M249 rail) vs **Fig. 8 Standard Ribbed Polymer** (`ref_01`, classic M249) vs bottom polymer + side rails?
  2. **Barrel & Carrying Handle:** **Long Barrel Fig. 3** (`12011986`) vs **Short Para Barrel Fig. 4** (`ref_03` `12556953`), and can Mark export `C:\Projects\CAD\Markimus-M249\Barrel Carrying Handle Assy.SLDASM` to `.glb` so we don't have to remodel the carrying handle?

---

## Exact Next Action

1. Inspect Mark's saved `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend` (`2026-11-25 05:40:15 AM`) directly (render a close-up Workbench/Cycles check of the moved Trigger Group if desired, **without overwriting the `.blend`**) and confirm the 2 variant choices above with Mark.
2. Coordinate **Antigravity + Opus + Astra** (`blender-agent-core` + `blender-image-to-3d` + `blender-mechanical-toolkit`) in modular Blender scripts inside `.scratch/ch03-m249-video/remodel/` to model the 5 clean mechanical assemblies (`Barrel`, `Heat Shield`, `Handguard`, `Trigger Mechanism`, `Bipod`) against `ref_01..ref_05` and Mark's exact CAD mating envelopes (`m`).
3. Swap the newly remodeled meshes into `m249_ch03_studio_ready.blend` (removing all `m249_FN.glb`-derived `FIT_*` geometry while preserving Mark's trigger alignment and keyframes), run full telemetry + Cycles verification renders + Astra review, and proceed to the full Chapter 03 video cut.

---

## Known Gotchas

- **NEVER blindly re-run `03_studio_and_storyboard.py` over `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend`:** Mark manually edited `FIT_Trigger_*` directly inside `m249_ch03_studio_ready.blend` at `2026-11-25 05:40:15 AM` (diff already mirrored to `02_assemble_m249.py`, but keep his `.blend` backed up before running any new script!).
- **Blender binary:** Always invoke `"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python-exit-code 1` (never `blender.cmd`).
- **Blender 5.3 APIs:** Layered/Slotted Actions require traversing `action.layers -> strips -> channelbags -> fcurves`; `scene.render.image_settings.media_type = 'IMAGE'` before `file_format = 'PNG'`.
- **Non-highlighted mesh alpha:** Initialize every mesh in `COL_Markimus_Assembled` with `ob.color = (1.0, 0.42, 0.06, 0.0)` so `ShaderNodeObjectInfo` doesn't emit unwanted amber glow.
- **Worktree hygiene:** Verify/normalize LF line endings before commits, keep `node_modules` junctioned (untracked), stage ONLY explicit paths (`git commit -F <file>`), and **never** commit `.scratch/`.

---

## Approval State & Boundaries

- **Approved (`$0` local work):** Blender remodeling, fitting, Cycles HIP preview renders, and contact sheets inside gitignored `.scratch/ch03-m249-video/`.
- **Blocked without explicit Mark approval:** Any paid Modal / Higgsfield / cloud spend (quote exact cost first), any `git push`, any Cloudflare Pages deploy, or adding any `.glb` to `/home/`. Final Chapter 03 video swap requires Astra QA + Mark visual sign-off.

---

## Tooling Manifest

| Phase | Tool / Skill | Version / Location | Purpose | Owner Staging / Status |
| :--- | :--- | :--- | :--- | :--- |
| Image-to-3D Mechanical Remodeling | Blender CLI + Cycles HIP | `5.3.0` / `GPU:HIP:AMD Radeon 780M Graphics` | Precision procedural hard-surface modeling & Boolean/bevel QA of the 5 missing M249 assemblies | Active local |
| Modeling & Review Discipline | `blender-agent-core`, `blender-image-to-3d`, `blender-mechanical-toolkit` | `C:\Users\Markimus\.agents\skills\...` & `.agents\skills\...` | Fidelity contracts, Form/Production gates, hard-surface bevel/manifold checks | Active local |
| Multi-Agent Modeling Coordination | `orchestration` (Antigravity + Opus + Astra) | `C:\Users\Markimus\.agents\skills\orchestration\SKILL.md` | Split remodeling & adversarial visual/dimensional verification across agents/harnesses | Ready for next session |
| Cloud GPU Render (Deferred) | Modal / Higgsfield | Not run | High-res final Chapter 03 video render (only after remodel + Mark preview approval) | **Not used** — blocked on cost quote + Mark go |
| Site Deploy (Deferred) | Wrangler / Cloudflare Pages | Not run | Chapter 03 video publication to `studiomark.dev` | **Not used** — blocked on Mark approval |

---

## Suggested Skills

- `blender-agent-core` (`C:\Users\Markimus\.agents\skills\blender-agent-core\SKILL.md`)
- `blender-image-to-3d` (`C:\Users\Markimus\.agents\skills\blender-image-to-3d\SKILL.md`)
- `blender-mechanical-toolkit` (`.agents\skills\blender-mechanical-toolkit\SKILL.md`)
- `orchestration` (`C:\Users\Markimus\.agents\skills\orchestration\SKILL.md`)
- `handoff` (`.agents\skills\handoff\SKILL.md`)

---

## Ready-to-Paste Next-Session Prompt

```text
Read first:
1. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/AGENTS.md
2. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/TODO.md
3. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/docs/HANDOFF-ch03-m249-remodel-list-2026-11-25a.md
4. C:/Users/Markimus/.agents/skills/blender-agent-core/SKILL.md
5. C:/Users/Markimus/.agents/skills/blender-image-to-3d/SKILL.md
6. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/.agents/skills/blender-mechanical-toolkit/SKILL.md

Workspace: c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d (branch feat/ch03-arm-drop-video).

Context & Hard Rules:
- Stay $0 local in Blender 5.3.0 ("C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python-exit-code 1). Do NOT run Modal/Higgsfield, push, or deploy without explicit cost quote + Mark's go. Never commit .scratch/ or run git add -A.
- DO NOT blindly overwrite .scratch/ch03-m249-video/m249_ch03_studio_ready.blend — it holds Mark's 2026-11-25 05:40 AM manual Trigger edits (already backed up/mirrored in 02_assemble_m249.py); back it up before modifying.
- All 5 fitted m249_FN.glb placeholder assemblies (FIT_Barrel_Assembly, FIT_HeatShield_Assembly, FIT_Handguard_Assembly, FIT_Trigger_Assembly, FIT_Bipod_Assembly) must be replaced with clean remodeled Blender parts built from the saved references (.scratch/ch03-m249-video/references/ref_01..ref_05.jpg + C:\Projects\CAD\Markimus-M249\PCOOW249Configurations.pdf) and Mark's exact CAD mating envelopes.

First Actions:
1. Back up .scratch/ch03-m249-video/m249_ch03_studio_ready.blend and inspect Mark's saved reference images (.scratch/ch03-m249-video/references/ref_01..ref_05.jpg).
2. Confirm with Mark the 2 open variant choices (Fig. 7 Picatinny Rail Handguard vs Fig. 8 Standard Polymer Handguard; Long Fig. 3 vs Short Para Fig. 4 Barrel + whether C:\Projects\CAD\Markimus-M249\Barrel Carrying Handle Assy.SLDASM can be exported), then coordinate Antigravity + Opus + Astra per the Master Remodel Parts List in docs/HANDOFF-ch03-m249-remodel-list-2026-11-25a.md to model and swap in the 5 clean assemblies.
```
