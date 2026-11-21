# HANDOFF — Homepage live on studiomark.dev, 1-degree turns (2026-11-20, late)

Supersedes `docs/HANDOFF-ch04-p1-done-ch03-2026-11-20.md` for "what next". Read this, then
`project/work/plans/JG-044-ch04-studiomark-plan.md` and
`project/work/plans/JG-044-homepage-merged-concept.md`.

Workspace: worktree `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-prototype-gate-2-be5a82`,
branch `claude/homepage-prototype-gate-2-be5a82` (pushed; see `git log -3`).

## Done this session (Mark's rulings in quotes)

- **P1 ruled:** cage look "approved as is"; hero finish **steel**; P2 go.
- **Rim cut-off fixed** ("fix the cutoff. modal approved"): framing `--fill 0.68` (was 0.62).
  Line local $0; shade Modal `ap-ObFHGlkTM2cAdRa1ImDTMf` **$0.036**. Min margin 32 px.
- **P2 built:** Chapter 04 beat 1 (cage) on stage 4 of `proto/merged/`, own texture slot
  (`tL2/tS2/uC4/uC4Rect`), `uCover` keeps the sheet blank between stage 4 and the armament
  stage, pills `01 Cage / 02 Pump / 03 Receiver` (02-03 inert until P3). The cage steps back
  when a dive starts, so the tear still opens onto the bore.
- **Homepage live** ("immediately replace" the studiomark.dev homepage): Pages deployment
  `ccf8f156`. `scripts/deploy-home-proto.sh` rebuilds the live production commit `d2a820dd`
  (byte-identical to live for /, /home/, /torque-wrench/, /quiet-machine/, /armament/) and swaps
  `proto/merged/` in as `/home/` with the live page's robots/canonical/description. Live check:
  desktop + phone, 0 page errors, 0 failed requests. **Not yet redeployed with the 1-degree
  sets** — run `scripts/deploy-home-proto.sh --deploy` on Mark's go.
- **Smoothness target set (Mark): 1 degree per frame** (360 frames per turn, about 2.5 px of
  scroll per step on desktop). Spin rate: one full turn per screen of scroll (my suggestion,
  Mark asked "what do you suggest?"; not separately confirmed).
  - Cage: 300 new shade frames on Modal (**$0.151**) + 300 line frames local ($0), merged with
    the 60 re-framed frames → `proto/merged/ch4/cage/` (360 + 360, 13 MB).
  - Carbine: odd angles on Blender **5.2.2** (parity with the approved v1 line / v2 Cycles
    shade sets in `C:/Projects/CAD/Armament/renders/`): shade **$0.062** (Modal); line rendered **locally on 5.3.0** ($0) after the Modal line run
    `ap-FcjohJgDChIrPrsm9bpxRx` died on a local DNS drop (`getaddrinfo failed`, no frames returned;
    its partial charge is unknown, ceiling $0.50 — check the Modal bill). Local 5.3 line frames
    match the 5.2.2 originals (ink IoU 0.9996 on the 0/20 deg controls).
    Control frames 0 and 20 deg re-rendered pixel-identical to the originals.
    → `proto/merged/arm/` (360 + 360, l000..l359 / s000..s359).
  - Loader: coarse-first (every 12th, 6th, 3rd, then all; 8 requests in flight), nearest
    loaded frame shown until the exact one arrives.
- Modal spend this session: **$0.25 measured** (0.036 + 0.151 + 0.062) plus the failed line run
  (unknown, at most $0.50).
- Long local renders: launch detached (`Start-Process` a `.cmd`), the session crashed once and
  killed a child Blender mid-run.

## Scripts and tools (new or changed)

- `scripts/encode-ch04-frames.sh <out> <line-dir> <shade-dir> [W H] [crop]` — WebP encode,
  3-digit names, `manifest.json`.
- `scripts/deploy-home-proto.sh [--deploy]` — stage or publish the homepage.
- `.scratch/ch04/launch_ch04.py` (gitignored): Chapter 04 Modal launcher, Blender 5.3.0 from the
  Clarkson mirror, presets `cage-pilot`, `cage-360-fill`; estimate re-based on 8 s/frame.
- `.scratch/arm360/launch.py` (gitignored): copy of the JG-041 carbine launcher pointed at the
  Clarkson mirror (Blender 5.2.2), angle lists allowed (`0,20,1:360:2`). The original in worktree
  `armament-wiring-clipspin-15a80d` still points at download.blender.org, which refuses Modal.

## Open, in order

1. Mark: look at the 1-degree turns (local `http://127.0.0.1:5231/proto/merged/?view=s4`),
   then go to redeploy.
2. **P3 quote** at 360 frames per turn: DD4SE (`.scratch/ch04/dd4se-nomarks.glb`) + `M249
   Receiver Plus.glb`. Each assembly needs its own screen of scroll (page change: stage 4 grows
   from one section to three beats of one screen each).
3. P4 thin console, P5 Astra ruling, Gate 2.
4. Chapter 03 M249 beat: blocked on Mark (drawing treatment; scan/Geomagic/print sources not on
   this machine).
5. JG-041 film lane: own handoff `docs/HANDOFF-showreel-higgsfield-2026-11-17.md` on
   `jg-041/higgsfield-improvements`.
6. New tool to trial: OpenMotion (`C:/Projects/openmotion`), see the orchestration prompt.

## Constraints (unchanged)

Costs first and a go per Modal/Higgsfield/deploy run. No dimensions, GD&T, part or drawing
numbers on screen. No `.glb` on `/home/`. Never commit `.scratch/`. Stage explicit paths.
No `src/home/` change before Gate 2 (the live homepage is served from `proto/merged/` instead).
