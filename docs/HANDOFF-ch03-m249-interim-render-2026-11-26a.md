# Handoff — Chapter 03 M249 Interim Render & Tooling/Rule Checkpoints (2026-11-26a)

- **Workspace:** `c:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-scrubbing-videos-ffaf5d`
- **Branch:** `feat/ch03-arm-drop-video` (branched from `main` `65a567a2` == `origin/main` == live `studiomark.dev/home/` Pages `c658fda9`; `origin/feat/ch03-arm-drop-video` at `21cbe853`, local commits ahead)
- **Previous Handoff:** `docs/HANDOFF-ch03-m249-remodel-complete-2026-11-25b.md`
- **Workspace Spend So Far:** `$0.00` (local Blender `5.3.0` Cycles `GPU:HIP:AMD Radeon 780M Graphics`)

> **CRITICAL WORKTREE CONSOLIDATION WARNING:**
> All Blender source `.blend` files, modular remodel scripts, backups, references, and Cycles verification sheets (`94` files / `380.85 MB` / `399,345,630` bytes) live inside **gitignored** `.scratch/ch03-m249-video/` in this worktree. **Do NOT delete or prune `homepage-scrubbing-videos-ffaf5d` before migrating `.scratch/ch03-m249-video/`.**

---

## Done

1. **M249 5-Assembly Remodel, CAD Fit Fixes, and Interim WIP Scope Logged (commits on `feat/ch03-arm-drop-video`):**
   - `21cbe853` — Replaced all 5 `m249_FN.glb` placeholder `FIT_*` assemblies with native Blender `5.3.0` `REMODEL_*` meshes, narrowed `REMODEL_Trigger_Frame_9348352` to `20.40 mm`, relocated `9350015 - Knob Assembly-1` to the outer left (`-Y`) windage axis with re-keyed `F1..F280` explode curves, and recorded `docs/HANDOFF-ch03-m249-remodel-complete-2026-11-25b.md` (see that handoff for full part dimensions and `.scratch/ch03-m249-video/` file inventory).
   - `0a37d7fa` — Welded `9350026 - Pistol Grip-1-1`, bisected top flat at `Z = -0.02122 m` to butt flush under `REMODEL_Trigger_Frame_9348352`, cut a `10.8 mm` front notch cradling `REMODEL_Trigger_Guard_9348370`, and verified existing keyed `Feed tray.IGS-1` placement (`verify_09_grip_and_feedtray_sheet.png`).
   - `520618fd` — Recorded Mark's 2026-11-26 owner ruling in `TODO.md` and `docs/HANDOFF-ch03-m249-remodel-complete-2026-11-25b.md`: proceed with rendering and animating the current M249 assembly as an interim WIP site video while Mark models remaining missing major components for a later revised video cut.
2. **Session Learnings Applied (`/learn`, committed in this handoff checkpoint):**
   - Updated `.agents/skills/blender-mechanical-toolkit/SKILL.md` (`## Blender 5.3.0 Procedural Remodeling & CAD-Fit Notes`: `use_clamp_overlap`, outward-normal checks before `EXACT` booleans, 2D `(x, r)` hollow revolves, world-space boolean cutters + assertions, SolidWorks CAD `.glb` seam welding + `bisect_plane`/`holes_fill`, inner clevis clearance measurements, and studio backdrop/numpy contact-sheet rendering).
   - Updated `AGENTS.md` (`## Hard rules`: gitignored `.scratch/` preservation during worktree pruning, and immutable SHA-256 `.blend` backups before running headless bpy scripts over owner-edited files).
   - Updated `TODO.md` to link this handoff under `JG-044`.

---

## In Progress

- **Chapter 03 Interim Video Render & Animation (`JG-044`):** `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend` (`280` frames, Cycles HIP, immutable `05:40 AM` owner backup preserved in `.scratch/ch03-m249-video/backups/`) is ready for the full 280-frame render and video assembly pass.
- **`npm run check` status:** Not run in this session (only `.agents/skills/`, `AGENTS.md`, `TODO.md`, and `docs/HANDOFF-*.md` were edited; zero `src/` or build/test code changed). Run `npm run check` once runtime/video assets or app code are modified.

---

## Next Action

Render the 280-frame interim Chapter 03 animation from `.scratch/ch03-m249-video/m249_ch03_studio_ready.blend` (stay `$0.00` local Cycles HIP, or provide an exact cost quote and obtain Mark's explicit approval before any Modal/cloud GPU run), assemble the darker-studio no-VO cut + redacted `[REF ONLY]` drawing beat (noted as WIP with major components missing), wire into `proto/merged/arm/drop-reel.mp4`, and run Gate 2 before any push or deploy.

---

## Known Bugs / Deferred Items & Gotchas

- **Missing Major M249 Components (Intentional WIP Deferral):** Fig. 6 bolt/piston/operating-rod internals, Fig. 1 small hardware/barrel-locking lever, and Fig. 10 shoulder rest/buttplate are absent from the current assembly per Mark's 2026-11-26 ruling; the interim video must be treated as WIP and revised after Mark finishes modeling those components.
- **Verification Scope:** No `npm run check` or Gate 2 browser run was executed during this doc/skill/remodeling handoff session; verify Gate 2 + runtime build checks when wiring the rendered video into `proto/merged/arm/drop-reel.mp4`.
- **Worktree & Blend Safety:**
  - Never delete or prune `homepage-scrubbing-videos-ffaf5d` before migrating `.scratch/ch03-m249-video/`.
  - Never run `03_studio_and_storyboard.py` over `m249_ch03_studio_ready.blend` (use `remodel/06_swap_and_verify.py` and keep `.scratch/ch03-m249-video/backups/` read-only).
  - Always invoke Blender 5.3.0 via `"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python-exit-code 1`.
  - Commit strictly by explicit file path with LF line endings; never stage `.scratch/`.

---

## Approval State & Boundaries

- **Approved:** `$0.00` local Blender/Cycles HIP preview renders, 280-frame local video render/assembly, and local commits on `feat/ch03-arm-drop-video`.
- **Blocked without explicit Mark approval:** Any paid Modal / Higgsfield / cloud compute spend (quote exact cost first), any `git push` (note `AGENTS.md`/`origin/feat/ch03-arm-drop-video` is untouched here — confirm before pushing), any Cloudflare Pages deploy, adding `.glb` models to `/home/`, or committing `.scratch/`.

---

## Suggested Skills

- `blender-agent-core` (`C:\Users\Markimus\.agents\skills\blender-agent-core\SKILL.md`)
- `blender-mechanical-toolkit` (`.agents/skills/blender-mechanical-toolkit/SKILL.md`)
- `blender-image-to-3d` (`C:\Users\Markimus\.agents\skills\blender-image-to-3d\SKILL.md`)
- `handoff` (`.agents/skills/handoff/SKILL.md`)

---

## Tooling Manifest

| Phase | Tool / Skill | Version / Location | Purpose | Owner Staging / Status |
| :--- | :--- | :--- | :--- | :--- |
| Remodeling & Verification Renders | Blender CLI + Cycles HIP | `5.3.0` / `GPU:HIP:AMD Radeon 780M Graphics` | Procedural M249 remodeling, CAD fit checks, and `verify_01..09.png` contact sheets | Completed locally (`$0.00`) |
| Knowledge & Rule Guardrails | `blender-mechanical-toolkit`, `AGENTS.md` | Repo `.agents/skills/` & root | Documented Blender 5.3.0 remodeling pitfalls, `.scratch/` worktree safety, `.blend` SHA-256 backup rule | Updated & committed locally |
| Cloud GPU Render (Deferred) | Modal / Higgsfield | Not run | High-res Chapter 03 render (if chosen over local HIP) | **Blocked** — requires cost quote + Mark go |
| Site Publication (Deferred) | Git push / Cloudflare Pages | Not run | Publish wired `drop-reel.mp4` after Gate 2 + Mark sign-off | **Blocked** — requires explicit Mark go |

---

## Ready-to-Paste Next-Session Prompt

```text
Read first:
1. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/AGENTS.md
2. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/TODO.md
3. c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/docs/HANDOFF-ch03-m249-interim-render-2026-11-26a.md

Workspace: c:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d (branch feat/ch03-arm-drop-video, branched from main 65a567a2).

Next Action:
Render the 280-frame interim Chapter 03 animation from .scratch/ch03-m249-video/m249_ch03_studio_ready.blend (stay $0.00 local Cycles HIP, or quote exact cost and wait for Mark's approval before any Modal/cloud run), assemble the darker-studio no-VO cut + redacted [REF ONLY] drawing beat (noted as WIP with Fig. 6 internals, Fig. 1 small hardware/barrel-locking lever, and Fig. 10 shoulder rest/buttplate deferred for a later revised video cut), wire into proto/merged/arm/drop-reel.mp4, and run Gate 2 + npm run check.

Boundaries & Approval State:
- Approved: $0.00 local Blender 5.3.0 ("C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python-exit-code 1) work and local commits by explicit path.
- Blocked without explicit Mark approval: any paid Modal/Higgsfield/cloud spend, any git push, any Cloudflare Pages deploy, adding .glb assets to /home/, or committing/deleting .scratch/ch03-m249-video/ (94 files / 380.85 MB gitignored).
```
