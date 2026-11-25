# Handoff — Chapter 03 M249 Blender Rig & `$0` Storyboard (2026-11-24b)

- **Repo / Worktree:** `c:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-scrubbing-videos-ffaf5d`
- **Branch:** `feat/ch03-arm-drop-video` (upstream `origin/feat/ch03-arm-drop-video` at `88ad60d3`, branched from `main` `65a567a2`)
- **Live Site State (unchanged):** `studiomark.dev/home/` = Cloudflare Pages `c658fda9`; `main` pushed at `65a567a2`.
- **Workspace Spend So Far:** `$0.00` (all renders run locally on Blender `5.3.0` Cycles `GPU:HIP:AMD Radeon 780M Graphics`).

---

## Done

1. **Verified & pushed interim Chapter 03 drop reel (`88ad60d3`):**
   - `b13fa627` + `88ad60d3` on `feat/ch03-arm-drop-video` pushed to `origin/feat/ch03-arm-drop-video`.
   - `npm run check` passed (`Biome`, `tsc --noEmit`, 133 test files / 1,567 tests, `check:station2`) prior to push.
   - Project 03 drop landing uses `proto/merged/arm/drop-reel.mp4` (`armament-review-spin-v2.mp4`, lazy-loaded on dive); zero `.glb` files on `/home/`.
2. **Inspected & assembled Mark's CAD from `C:\Projects\CAD\Markimus-M249\` (`.scratch/ch03-m249-video/`):**
   - Audited GLBs (`01_inspect_glbs.py`, `inspect_rev1.py` -> `glb_audit.json`, `rev1_audit.json`).
   - Built `m249_ch03_assembled.blend` (`02_assemble_m249.py`) under `COL_Markimus_Assembled` (`ROOT_M249_Markimus`):
     - Base: `receiver_assy_plus-rev1.glb` (92 meshes, 847,734 tris; `Gas Cylinder` corrected at `Z = +0.01497`).
     - Grafted from `9349999 - Leaf Assembly, Rear Sight.glb`: `9348240 - Pin, Spring-1 (Leaf)`.
     - Grafted from `12556942 - Buffer Assembly.glb`: 2 extra wiper rings (`occurrence of Wiper_graft_0`, `occurrence of Wiper_graft_1`) and 2 extra retainer rings (`occurrence of Retainer_graft_2`, `occurrence of Retainer_graft_3`) — **97 meshes total**.
   - **Strictly enforced Mark's 2026-11-24 asset rule:** Apart from generic springs or fasteners (such as screws), **ONLY** parts from `C:\Projects\CAD\Markimus-M249\` are used for animation/rendering. `m249_FN.glb` (`COL_Reference_M249FN`) is retained **strictly as a non-rendered, non-animated ballpark location/relationship reference only** (`hide_render = True`, `hide_viewport = True`).
3. **Built darker-studio Cycles rig & `$0` 7-shot storyboard (`03_studio_and_storyboard.py`, `04_make_redacted_gdt_and_sheet.py`):**
   - Output `.blend`: `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend`
   - Explode animation (Frames 1 -> 60 -> 120) implementing both Figure 1 & Figure 2 of `PCOOW249Configurations-1.pdf` (user-uploaded):
     - `Magazine Sleeve 1-1-1` fixed on receiver; `Gas Cylinder` forward `-0.32 X` at `Z = +0.015`; `Cocking Handle` offset `+0.055 Y, +0.055 Z`; `Slide-1-1` `+0.10 X` rearward.
     - Coaxial Buffer Assembly explode (`Back Plate-1` coaxial `Z = 0`; `Spring(Compressed)-1` extracted rearward `+X` out the open rear of `Buffer Body`; all 3 bronze Wiper rings and 3 Retainer rings staggered coaxially).
     - Full 30-mesh `Topcover Assembly.IGS` + 35-mesh `12556970 - Rear Sight Assembly` explode using `world_delta_to_local`, with `Lever, Feed` shaded `MAT_Machined_Steel`.
   - 7 rendered Cycles stills (`960x540`, 28 samples, AgX, ~4–8.4 s/frame on HIP GPU, all `inside: true, behind: false`):
     1. `stills/still_01_hero_assembled.png` — Dark-studio hero (Frame 1)
     2. `stills/still_02_metrology_macro.png` — 100mm hand-metrology macro (Frame 1)
     3. `stills/still_03_explode_subassemblies.png` — Receiver subassembly explode (Frame 60)
     4. `stills/still_topcover_explode_3q.png` — Top Cover & Feed Mech explode (Frame 120) + `stills/still_topcover_explode_underside.png` verification view
     5. `stills/still_04_buffer_spring_explode.png` — Coaxial Buffer & OEM spring explode (Frame 120)
     6. `stills/still_05_redacted_gdt_crop.png` — Masked/redacted GD&T print crop (`[REF ONLY]`, no proprietary part geometry)
     7. `stills/still_07_markimus_full_explode_finale.png` — 100% Markimus-M249 deep-explode finale (Frame 120)
   - Contact sheets: `.scratch/ch03-m249-video/storyboard_contact_sheet.png` and `.scratch/ch03-m249-video/verify_03_exploded_details_sheet.png`.
4. **Updated repo planning docs (`TODO.md`, `project/work/plans/JG-044-homepage-merged-concept.md`)** to lock the Markimus-only asset rule (`m249_FN.glb` hidden ballpark ref only).

---

## In Progress

- **Mark's visual sign-off** on `storyboard_contact_sheet.png`, `verify_03_exploded_details_sheet.png`, and `still_07_markimus_full_explode_finale.png`.
- **Missing external M249 subassemblies (still unconverted in `C:\Projects\CAD\Markimus-M249\` as of 2026-11-24):** Barrel, Carry Handle, Bipod, and Handguard. Check whether Mark converted any new GLBs before locking final camera paths.

---

## Exact Next Action

1. Read `.scratch/ch03-m249-video/storyboard_contact_sheet.png` and `.scratch/ch03-m249-video/stills/still_07_markimus_full_explode_finale.png` with Mark's feedback from this handoff boundary, and check `C:\Projects\CAD\Markimus-M249\` for any newly exported GLBs (Barrel, Carry Handle, Bipod, Handguard).
2. If new GLBs were added, graft them into `COL_Markimus_Assembled` inside `02_assemble_m249.py` using `m249_FN.glb` (`COL_Reference_M249FN`, kept hidden & unrendered) strictly for ballpark placement, then re-run `03_studio_and_storyboard.py` and `04_make_redacted_gdt_and_sheet.py`.
3. Once Mark approves the `$0` stills storyboard and camera framing:
   - Author the full ~28 s continuous motion/camera timeline (`24 fps` or `60 fps` per Chapter 03 spec), music bed (no VO), and dark-studio lower-third/redacted-GD&T graphic plates in `m249_ch03_studio_ready.blend` / compositor.
   - Verify with local `$0` low-res test renders + telemetry before presenting any paid Modal/cloud render quote for Mark's approval.

---

## Known Gotchas

- **Blender executable on Windows:** Always invoke `"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe"`; `blender.cmd` fails with `'m' is not recognized`.
- **Blender 5.3 Render API:** Set `scene.render.image_settings.media_type = 'IMAGE'` *before* `file_format = 'PNG'`, and always run with `--factory-startup --python-exit-code 1` + `AGENT_OK`/`AGENT_FAIL` sentinels.
- **SolidWorks glTF Quaternion Parents:** Parent empties in `receiver_assy_plus-rev1.glb` use `rotation_mode == 'QUATERNION'`. Never add raw world deltas to child `.location`; always transform through `world_delta_to_local(ob, world_delta)` evaluated at Frame 1 before keying.
- **Grafted Buffer Rings Exact Names:** `occurrence of Wiper_graft_0`, `occurrence of Wiper_graft_1`, `occurrence of Retainer_graft_2`, `occurrence of Retainer_graft_3`, and leaf pin `9348240 - Pin, Spring-1 (Leaf)`.
- **Line Endings & `node_modules` in Worktrees:** Windows `core.autocrlf=true` causes Biome LF failures on newly written files — verify/normalize LF before committing, keep `node_modules` junctioned (untracked), stage ONLY explicit paths (`git commit -F <msgfile>`), and **never** commit `.scratch/`.

---

## Approval State & Boundaries

- **Approved ($0 local work):** Blender inspection, assembly, rig/lighting/camera iteration, local Cycles GPU preview stills and low-res motion tests inside gitignored `.scratch/ch03-m249-video/`.
- **Blocked without explicit Mark approval:**
  - Any paid Modal, Higgsfield, or cloud GPU spend (quote exact cost first).
  - Any `git push` or Cloudflare Pages deploy.
  - Rendering `m249_FN.glb` geometry (reference only; generic springs/fasteners allowed) or shipping any `.glb` onto `/home/`.
  - Final Chapter 03 video swap requires Astra QA + Mark visual approval.

---

## Tooling Manifest

| Phase | Tool / Artifact | Version / Spec | Purpose | Owner Staging / Status |
| :--- | :--- | :--- | :--- | :--- |
| Ch03 Local Assembly & Previews | Blender CLI + Cycles HIP | `5.3.0` / `GPU:HIP:AMD Radeon 780M Graphics` | CAD import, SolidWorks mate preservation, explode rig, `$0` Cycles stills (`4–8.4 s/frame` at `960x540`, 28 samples) | Active local |
| Ch03 Sheet & Redacted Plates | Python + Pillow | Local script `04_make_redacted_gdt_and_sheet.py` | Masked `[REF ONLY]` GD&T slate (`still_05_redacted_gdt_crop.png`) & contact sheets | Active local |
| Repo QA Gate | `npm run check` / `npm run lint` | Biome + `tsc --noEmit` + Vitest + station2 | Repo formatting/typecheck/tests prior to commits or pushes | Active local (`node_modules` junctioned) |
| Paid Cloud Render (Deferred) | Modal / Higgsfield | Not run | High-res final Chapter 03 video render (if local Cycles GPU is too slow for final 1080p/60fps pass) | **Not used** — blocked on cost quote + Mark go |
| Site Deploy (Deferred) | Wrangler / Cloudflare Pages | Not run in this session | Deploy updated `proto/merged/arm/` reel once approved | **Not used** — blocked on Mark approval |

---

## Suggested Skills

- `blender-agent-core` (`C:\Users\Markimus\.agents\skills\blender-agent-core\SKILL.md`) — required for all Blender/bpy work.
- `blender-mechanical-toolkit` (`.agents\skills\blender-mechanical-toolkit\SKILL.md`) — hard-surface lookdev & CAD Blender helpers.
- `webgl-telemetry-verifier` (`C:\Users\Markimus\.agents\skills\webgl-telemetry-verifier\SKILL.md`) — browser/telemetry verification if touching site runtime later.

---

## Ready-to-Paste Next-Session Prompt

```text
Read:
1. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/AGENTS.md
2. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/TODO.md
3. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/docs/HANDOFF-ch03-m249-blender-rig-2026-11-24b.md
4. C:/Users/Markimus/.agents/skills/blender-agent-core/SKILL.md

Workspace: c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d (branch feat/ch03-arm-drop-video).

Context & Hard Rules:
- Chapter 03 standalone darker-studio M249 video (no VO): render ONLY parts from C:\Projects\CAD\Markimus-M249\ (apart from generic springs/fasteners like screws if needed). Keep m249_FN.glb (COL_Reference_M249FN) strictly hidden & non-rendered as a ballpark location/relationship reference only.
- Stay in $0 local Blender 5.3.0 (Cycles HIP GPU: "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python-exit-code 1). Do NOT run Modal/Higgsfield, push, or deploy without explicit cost quote + Mark's go. Keep all Blender files in gitignored .scratch/ch03-m249-video/. Never commit .scratch/ or run git add -A.

First Actions:
1. Show Mark or review with him the latest .scratch/ch03-m249-video/storyboard_contact_sheet.png, verify_03_exploded_details_sheet.png, and stills/still_07_markimus_full_explode_finale.png, and ask if he wants any adjustments or has exported additional GLBs (Barrel, Carry Handle, Bipod, Handguard) into C:\Projects\CAD\Markimus-M249\.
2. Once Mark confirms the CAD roster and storyboard, build the continuous Chapter 03 camera/explode animation pass and $0 local low-res preview video in .scratch/ch03-m249-video/m249_ch03_studio_ready.blend (preserving SolidWorks QUATERNION world_delta_to_local transforms and exact grafted leaf-pin / buffer-ring names).
```
