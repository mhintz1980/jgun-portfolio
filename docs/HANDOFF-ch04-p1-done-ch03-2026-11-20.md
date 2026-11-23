# HANDOFF — Chapter 04 P1 done, Chapter 03 ruled, JG-041 rules opened (2026-11-20)

Supersedes `docs/HANDOFF-chapter4-studiomark-2026-11-20.md` for "what next". Read this, then
`project/work/plans/JG-044-ch04-studiomark-plan.md` and
`project/work/plans/JG-044-homepage-merged-concept.md` § "Chapter 03: Armament".

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-prototype-gate-2-be5a82`,
branch `claude/homepage-prototype-gate-2-be5a82`, pushed at `7c3cbdb9` (plus this handoff).
Second lane touched: worktree `jg-041-higgsfield-improvements-d032fb`, branch
`jg-041/higgsfield-improvements`, pushed at `0e3037cb`.

## Done this session

- **P1 cage pilot rendered on Modal** (app `ap-KOdfbhnoUV6BYsQa0a9IV6`): 63/63 PNGs (60 turn
  frames 1536x960 + hero stills steel / clay / black oxide 2048x1280), 495 container-s, 316 s
  wall, **$0.035 measured** (rate-derived; excludes image build) vs $0.28 quote. About 7.9 s per
  frame on Modal vs 47 s locally: re-baseline the P3 quote on this run.
- **60 line frames rendered locally** ($0, 69 s): same azimuths as the shade set (0-354 step
  6), registered one-to-one. Local beats Modal for line passes.
- Outputs (gitignored, never commit): `.scratch/ch04/run-p1-cage/`, `.scratch/ch04/run-p1-line/`,
  sheets `.scratch/ch04/p1-cage-contact-2026-11-20.jpg`, `.scratch/ch04/p1-line-vs-shade-2026-11-20.jpg`.
  Mark has seen the contact sheet; no ruling on the look yet.
- Tooling manifest reconciled: P1 = Modal CPU + `p0_preview.py`; P3 engine is Mark's call;
  DLSS 4.5 dropped; skills staged (scenario-blender-*, blender-image-to-3d).
- **Chapter 03 ruled (Mark)**: drop lands on the approved armament cut
  `armament-review-spin-v2.mp4` (worktree `armament-wiring-clipspin-15a80d`, `remotion/out/`);
  plus a new **M249 reverse-engineering beat** (equipment, scan → Geomagic → SolidWorks, prints
  incl. the custom OEM Drive Recoil Spring). Full record in the merged-concept plan.
- **Music bed kept for background use**: `project/work/evidence/jg-041-showreel/music-bed-v1.mp3`
  (83 s, ElevenLabs via Higgsfield). Backup: `C:\Projects\work-assets\portfolio\jg-041-showreel-audio\`.
- **JG-041 film rules**: M249 allowed, AI-generated audio allowed (`remotion/src/rules.test.ts`,
  `README.md`, `HANDOFF.md`; rules test 39/39). Still banned: `m249-transformed.glb`, `m249_FN.glb`.

## Modal launch gotchas (all fixed or worked around; ICM `errors-resolved`)

Run the launcher from this session type as:
`cd .scratch/ch04 && env -u HTTPS_PROXY PYTHONIOENCODING=utf-8 python launch_ch04.py ... --execute --max-usd <cap>`

1. `HTTPS_PROXY` (opencodex, 127.0.0.1:10200) makes the Modal client demand `python-socks`: unset it.
2. A redirected console is cp1252; Modal prints ✓ and crashes after creating the app: set UTF-8.
   An orphaned app is stopped with `modal app stop -y <id>`.
3. download.blender.org refuses Modal's builder: `launch_ch04.py` now pulls
   `blender-5.3.0-linux-x64.tar.xz` from `mirror.clarkson.edu` with sha256
   `dacb8264197a3f7fda6001285a5a506fc97ee943881261c2c3bd63c882f22e05` pinned. The JG-041 armament
   launcher needs the same change before any 5.3 Modal run.

## Next steps, in order

1. **Ask Mark** for a look ruling on the P1 cage frames (contact sheet already sent).
2. **P2** ($0): encode the 60+60 cage frames to WebP (`cwebp` 1.6.0), Chapter 04 beat 1 and the
   `01 / 02 / 03` pills in `proto/merged/`; stills to Mark.
3. **P3 quote**: DD4SE (`.scratch/ch04/dd4se-nomarks.glb`) + `M249 Receiver Plus.glb` on Modal,
   one quote for both, re-baselined on P1's 7.9 s/frame. Mark picks the engine (CPU
   `p0_preview.py` vs GPU `render_clip.py`) and gives a go with `--max-usd`.
4. **Chapter 03 M249 beat**: blocked on Mark — (a) drawing treatment (masked sheets / line-pass
   renders of his parts / caption only; film and homepage both ban drawings on screen today);
   (b) source material: none of the scan data, Geomagic files, M249 drawings or the Drive
   Recoil Spring print is on this machine. Then a $0 stills storyboard before any spend.
5. JG-041 open items (separate session, its own handoff
   `docs/HANDOFF-showreel-higgsfield-2026-11-17.md` on `jg-041/higgsfield-improvements`): the
   real Cycles carbine re-render (apply the mirror fix first), new identity / StudioMark-tool
   acts (unconfirmed backlog). `remotion/review/hf-2026-11-17/` (19 MB of rejected Higgsfield
   clips) stays untracked unless Mark says commit.

## Constraints

Costs first and a go per Modal/Higgsfield run (an earlier yes does not carry). No dimensions,
GD&T, part or drawing numbers on screen. No `.glb` on `/home/`. Never commit `.scratch/`.
Stage explicit paths. No `src/home/` change before Gate 2.

## Paste-ready prompt for the next session

```
Read C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-prototype-gate-2-be5a82/docs/HANDOFF-ch04-p1-done-ch03-2026-11-20.md first, then the two JG-044 plans it names. Work in that worktree on branch claude/homepage-prototype-gate-2-be5a82.
First action: ask Mark for his ruling on the P1 cage frames (.scratch/ch04/p1-cage-contact-2026-11-20.jpg) and whether to start P2. Do not run Modal or Higgsfield without a stated cost and Mark's go for that run.
```
