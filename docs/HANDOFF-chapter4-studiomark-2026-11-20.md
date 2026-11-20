# Handoff: Chapter 04 (Renderings, Animation & StudioMark), P1 quote ready (2026-11-20)

Written 2026-11-20.

**Workspace:** worktree `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82`,
branch `claude/homepage-prototype-gate-2-be5a82` (tracks origin; this handoff's commit is local, not pushed).
- Open the next session on this folder. Do not start in a new worktree.
- Another session has also committed to this branch (Blender 5.3.0 pin, PATH shim, tooling
  manifest rule: `000170f9`, `c3f6a823`, `855f1d01`). Check `git log` before editing the plan.
- `homepage-prototype-approval-b6962a` still holds an untracked copy of
  `docs/HANDOFF-chapter4-studiomark-design-2026-11-18.md`; its branch has not been
  fast-forwarded to this one. Leave it unless Mark asks.

**Read first:** this file, then `project/work/plans/JG-044-ch04-studiomark-plan.md` (the
Chapter 04 sub-plan: rulings, quote, phases, tooling manifest), then
`project/work/plans/JG-044-homepage-merged-concept.md`, `AGENTS.md`, and for background
`docs/HANDOFF-chapter4-studiomark-design-2026-11-18.md` and
`docs/HANDOFF-homepage-merged-prototype-2026-11-18.md`.

## Where things stand

1. **Chapter 04 plan approved** by Mark 2026-11-19 ("Approve, start P0").
2. **P0 done ($0, local):** preview stills of all three assemblies; sanitization checks.
3. **Pump marks filled** (Mark's ruling: "Fill them in mesh") in a scratch copy:
   `.scratch/ch04/dd4se-nomarks.glb`. The source GLB is untouched.
4. **P1 quote ready, not run:** cage pilot on Modal, **estimate $0.28, hard ceiling $0.88**.
   Mark was asked "Run the P1 cage pilot on Modal, capped at $0.90?" and has **not answered**.
   No Modal spend has happened.

## Decisions (Mark)

- Assembly 1: stage 4 cage **A000861** (52 mm, 5 planets), isolated from `C:/Projects/CAD/Default.glb`.
- Assembly 2: **DD4SE** pump, `C:/Projects/msp-render-pipeline-scene-prep/cad/DD4SE-clean.glb`.
- Assembly 3: **`M249 Receiver Plus.glb`, Mark's own geometry**, BCP-condition display shell;
  no part or drawing numbers on screen or in shipped file names.
- Brand marks: **clean them**; `content.test.ts` bans stay.
- Gate 2 needs only a **thin console** (assembly switch, background, angle scrub, A/B wipe).
- Pump: **fill the marks in the mesh** (not cover removal plus angle-hiding).
- Defaults applied, not ruled (Mark may override): dives 01-03 land on one clip per
  project; chapter 03 keeps the carbine spin; `#systems` stays with one line to Chapter 04;
  three finishes per assembly as hero stills.

## Done this session

- Reviewed Mark's Chapter 04 planning prompt; added six review additions to the design
  handoff; updated JG-044 (`2ddde861`, pushed earlier, on this branch).
- Wrote the Chapter 04 sub-plan with cost, rulings, weight budget, page architecture and
  phases (later commits by the other session: `c497b6a6`, `ce14a6d0`, `488259fb`).
- P0 stills (Blender 5.2.2, CPU): `.scratch/ch04/p0-stills-2026-11-19.png`.
- Receiver check: its 2 embedded images are a stock rubber texture, no marks.
- Pump marks located and filled (Blender 5.3.0): four parts, 0 open edges; before/after
  sheet `.scratch/ch04/p0-pump-before-after-2026-11-19.png` (sent to Mark).
- Local timing for P1: 2 shade frames at 1536 px / 64 samples on 4 threads took 103 s,
  about 47 s per frame.
- Modal launcher `.scratch/ch04/launch_ch04.py` written; dry run gave the quote; quote
  recorded in the Chapter 04 plan (this handoff's commit).

## Not done

- **P1 Modal run:** waits for Mark's go with a cap. Nothing rendered on Modal.
- P2-P5 (frame encode, Chapter 04 beats in `proto/merged/`, thin console, Astra, Gate 2).
- The Blender 5.3.0 Linux download used by the Modal image was **not verified**:
  blender.org answers 403 to this machine, even for the 5.2.2 URL earlier Modal runs used.
- The plan's tooling manifest (written by the other session) says P1 uses "Modal Cycles
  GPU" and "a copy of `render_clip.py`". The launcher actually built is **CPU** and renders
  with **`p0_preview.py`**. Reconcile the manifest row with what runs (or switch to GPU)
  before P1, and tell Mark if the quote changes.
- Gate 2 items still open from earlier handoffs (Astra on the rest of the prototype,
  phone film crop, header overlap, carried concept 3 flaws, 30 fps drop, audio).
- JG-045 repo split waits for Gate 2.

## Exact next steps

1. Ask Mark the pending question: run the P1 cage pilot on Modal with `--max-usd 0.90`?
   Do nothing on Modal without an explicit go for that run.
2. Before running: reconcile the tooling-manifest P1 row (CPU + `p0_preview.py` vs GPU +
   `render_clip.py`). If you switch, re-run the dry run and give Mark the new quote first.
3. On Mark's go, run it alone (not chained after other work), from a normal shell:
   `cd .scratch/ch04 && python launch_ch04.py --glb cage-A000861.glb --out run-p1-cage --preset cage-pilot --execute --max-usd 0.90`
   If the image build fails on the Blender download, stop and report; no frames are billed.
4. Check `run-p1-cage/result.json` (status, png_got 63, measured cost), make a contact
   sheet, send the stills to Mark, record the measured cost in the plan.
5. Render the 60 line frames locally ($0): `p0_preview.py --passes line` with the same
   azimuths, width 1536, `--fill 0.62`.
6. Then P2 per the plan.

## Files and commands

- Plan: `project/work/plans/JG-044-ch04-studiomark-plan.md`.
- Scratch (gitignored, never commit) in `.scratch/ch04/`:
  - `p0_preview.py`: line (Workbench + Freestyle) and shade (Cycles) stills; flags
    `--keep --export-keep --hide --metal --clay --oxide --fill --aspect --passes --az --width --samples`.
  - `cage-A000861.glb`: the isolated stage 4 cage.
  - `fill_marks.py`: fills stencil cutouts; `name*` also fills slivers in the logo area.
  - `dd4se-nomarks.glb`: the cleaned pump. Render P3 from this file.
  - `probe.py`: which part sits under a pixel of a `p0_preview` render.
  - `partview.py`: renders single parts face-on.
  - `find_text.py`: lists parts by triangle count and size.
  - `launch_ch04.py`: Modal launcher, dry run by default.
  - Stills: `p0-stills-2026-11-19.png`, `p0-pump-before-after-2026-11-19.png`, `out/`, `time/`.
- Blender: `C:/Program Files/Blender Foundation/Blender 5.3/blender.exe` (5.1 and 5.2 were
  uninstalled 2026-11-19). A `blender` shim is at `~/.local/bin/blender.cmd`.
- Local CUDA does not load (`CUEW initialization failed`), so local Cycles runs on CPU.
- The armament lane's original launcher: `remotion/clips/armament/modal/launch.py` in
  worktree `armament-wiring-clipspin-15a80d` (never remove that worktree).

## Tooling manifest

| Phase | Tools (version) | Purpose | Notes |
|---|---|---|---|
| P0 (done) | Blender 5.2.2 local, `p0_preview.py` | Stills | Pump fill and P1 timing ran on 5.3.0 |
| P1 (quoted) | Blender 5.3.0 on Modal CPU (4 CPU / 8 GB), `launch_ch04.py`, `p0_preview.py`, modal client 1.5.1, Python 3.13 | Cage shade frames + hero stills | Plan manifest says GPU + `render_clip.py`; reconcile first |
| P1 line | Blender 5.3.0 local Workbench | 60 line frames | $0 |
| Not used | Higgsfield, R3F/drei on `/home/` | — | — |

## Suggested skills

- `blender-agent-core` before any Blender work.
- `asset-and-bundle-hygiene` when encoding the web frame sets (P2).
- `impeccable` for the thin console (P4).
- `anthropic-skills:verification-before-completion` before calling a phase done.

## Handoff Numbers

- Context at handoff: 313721 tokens (313.7k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Files Modified

- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\docs\HANDOFF-chapter4-studiomark-design-2026-11-18.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\project\work\plans\JG-044-homepage-merged-concept.md
- C:\Users\Markimus\AppData\Local\Temp\claude\9b7c7f6526e79e9e\fd0011a9-5d80-444a-a910-257d0099debc\scratchpad\glbinfo.py
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\project\work\plans\JG-044-ch04-studiomark-plan.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\.scratch\ch04\p0_preview.py
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\.scratch\ch04\find_text.py
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\.scratch\ch04\probe.py
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\.scratch\ch04\partview.py
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\.scratch\ch04\fill_marks.py
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-gate-2-be5a82\.scratch\ch04\launch_ch04.py

## Commits

None (cockpit list for this session's tool calls). The commit that adds this handoff and the
plan's quote follows it; verify with `git log --oneline -3`.

## Key Assumptions to Verify

- The branch is clean apart from `.scratch/` after the handoff commit — verify with: `git status --short`
- The quote is in the plan — verify with: `grep -n "Estimate \$0.28" project/work/plans/JG-044-ch04-studiomark-plan.md`
- The dry run still gives the same quote — verify with: `cd .scratch/ch04 && python launch_ch04.py --glb cage-A000861.glb --out run-p1-cage --preset cage-pilot`
- The cleaned pump exists and the source is untouched — verify with: `ls -la .scratch/ch04/dd4se-nomarks.glb C:/Projects/msp-render-pipeline-scene-prep/cad/DD4SE-clean.glb`
- Only Blender 5.3 is installed — verify with: `ls "C:/Program Files/Blender Foundation/"`
- The modal client is installed and configured — verify with: `python -c "import modal;print(modal.__version__)" && ls ~/.modal.toml`
- No Modal run has happened — verify with: `ls .scratch/ch04/run-p1-cage` (expect: no such directory)

## Dead Ends

- **Removing the engine cover to drop the MSP logo:** the DD4S letters are on the corner
  plates and survive it; Mark chose filling the mesh instead.
- **`bmesh.ops.holes_fill` for the letter openings:** some letters (M, E, S) stayed open and
  caps faced the wrong way. Per-loop `triangle_fill` with the sheet normal, then orienting
  each cap from a neighbouring sheet face, closed all of them (0 open edges).
- **Filling only by hole size on the engine cover:** small slivers of the MSP logo stayed.
  The `name*` mode also fills small pieces inside the lettering's bounding box.
- **Relative `--out` paths in Blender:** files landed in `C:\.scratch\...`. Pass absolute paths.
- **Checking blender.org from this machine** (curl, urllib, browser user agent): 403 for
  every URL, including the known-good 5.2.2 one. Not evidence that 5.3.0 is missing.
- **Local GPU:** CUDA does not load; all local Cycles is CPU.

## Last Request from the User

> Yes, get the quote

Status: Answered. The quote is $0.28 estimated, $0.88 ceiling; Mark has not yet answered
whether to run it.
