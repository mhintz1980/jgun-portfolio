# HANDOFF (2026-10-12c): S5 posters are live in the page (7 WebP stills, beat 4 v3); next is the owner's pick

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, local only, nothing pushed. Supersedes the poster parts of `HANDOFF-quiet-machine-2026-10-12a.md` (still the reference for QM9 skip-caps, K5 and the S5 fix history). Another session (torque-wrench shell readiness) shares the branch and has uncommitted edits in `docs/quiet-machine-motion-background-plan-2026-10-11.md` and `docs/quiet-machine-shell-readiness-note-2026-10-11.md`: not ours, do not stage them. Run `git log --format='%h %ad %s' --date=iso -8` and `git status --short` first.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend, this session | Modal about **USD 0.28** in dispatcher estimates (7 posters 0.1087 + failed beat-4 v2 0.0868 + beat-4 v3 0.0868; actual charge not read). 0 spawns. Orchestrator Sonnet 5.5; Advisor (Opus 5.5) 4 calls |
| Landed (local) | the poster repoint commit "JG-033 QM10: poster repoint ..." (see `git log`); earlier `190e18fd` skip-caps, `421634c2` K5 |
| Owner decisions pending | (a) the beat-1 caption says "A blue shell" over an orange render: change the copy? (b) what next, below |
| Astra | waived for the posters |

## What landed
- **7 stills replace the 3 blue live-page previews.** `public/images/rl300-shot-0N-poster.webp` (1920x1080) and `-960.webp`, 14 files, 887 KB total (the 3 deleted PNGs were about 720 KB). The page serves `srcSet` 960w/1920w, `sizes="100vw"`, explicit `width`/`height`; verified in Chrome: 1440 wide loads the 1920 file, a 390 phone loads the 960 file. Poster CSS unchanged (the stage is an inset box on the dark page; the light still reads fine).
- **Code:** `beats.ts` loses `PosterId` and the 7 `poster:` fields; `QuietMachinePreview.tsx` derives `rl300-shot-0${beat + 1}-poster`. The verifier's live-page `CAPTURE_POSTERS` capture block is deleted (it would have overwritten the renders with blue captures; do not re-add it) and the two `src.includes('intake')` asserts became `'shot-04'`.
- **Beat 4 final = v3** (`final/poster-04-v3.png`, Modal job `rl300_posters_v16_b4v3`, 583-584, only 584 kept): scene exposure keyed to -0.8 EV on frame 584, others -1.5. v2 (a 150 W light) failed blown-out; see 12a.
- **Gates (once):** tsc 0; build 0; npm test 701/701; check:station2 0; verify-jg033-preview exit 0, errors [], `reducedMotionPoster` and `contextLoss` pass; U.4 `cssEqual` true / `sourcesEqual` true; U.1 prints nothing (exit 1). verify-page-transition not run (nav and fade untouched).
- Evidence: `project/work/evidence/rl300-quiet-machine/38-s5-posters/` (`scripts/encode_webp.py`, `repoint-check/` screenshots, `summary.md`), ledger section "QM7b/QM10 poster repoint" in `qm-commit-gates.md`. The 7 source PNGs (`final/`) stay untracked (about 20 MB).

## Incident: the other session's 12b handoff
While writing this handoff I overwrote and then moved away the untracked `docs/HANDOFF-quiet-machine-2026-10-12b.md` written by the docs-only session ("Coordinate Shared Page File Ownership", 09:17). It was rebuilt verbatim from that session's transcript (its Write plus its two Edits) and put back, untracked, not committed; it still says the poster repoint "waits on the owner", which this handoff (12c) supersedes. Check a file does not exist before writing a handoff on a shared branch. The plan now carries a note under `### QM7b` that the posters are Blender renders and the `CAPTURE_POSTERS` block must not be re-added.

## Open items
1. **Beat-1 caption** "A blue shell. A complex machine. One considered envelope." sits over an orange render (`shot.ts`/`beats.ts` copy, owner's words). Other beat copy may also say blue: check with him.
2. **V16 master: SWAPPED 2026-10-12 (owner go).** `C:ProjectsCADRL300-SAFERL300-SAFE-photoreal-V16-review.blend` is now the REVEAL_FILL-fixed copy (sha256 `acce2897bf331cc6...`; read back: Size Y 2.4, Location Y 0.0, 675 objects). The previous master is kept beside it as `RL300-SAFE-photoreal-V16-review.pre-fillfix-2026-10-12.blend` (sha256 `788ae2a2a2f784c5...`, the hash the S5 spec and pipeline scratch copy were pinned to). Blender was not running. Anything pinned to the old hash will now see a mismatch: that is expected.
3. QM8 attribution / GPU-6 triangle acceptance: still not demonstrated (open frames carry about 304k tris of cap passes; a measurement script breaks the test rule unless a test is removed).
4. Motion plan S3 (needs his ruling on look change) and S4.
5. V16 vs shipped frame shifts (`35-v16-round-1/asset2/audit.md`).
6. Header wraps to 3 rows at phone width (look ruling). Lite has no extras (`rl300-extra-parts.glb`).
7. Test debt: the eager "keeps reservoir occurrences..." test; load-timeouts under a full `npm test` when other sessions run (passed this time).

## Traps
- Preview any scripted Blender change from the SAVED blend (`38-s5-posters/fix/render_saved.py`), never from the building session: the v2 light looked right in memory and rendered 19x hot when saved.
- The Modal dispatcher needs at least 2 frames (clone the manifest, take one frame); a dry run creates its output dir: delete it before `--execute`; unset the proxy vars.
- Heredocs eat backslashes (use the Write tool for `.py`/`.mjs`); the trim hook drops the first lines of long output (write to a file, then read it); `git diff --name-only | grep` through rtk can print a stray "Changes:" line: re-run with the files in a variable.
- Files are CRLF (`QuietMachinePreview.tsx`) or LF (`beats.ts`, the verifier): edit by line.

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration; HEAD should be the commit titled "JG-033 QM10: poster repoint ..." or a descendant). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; another session (torque-wrench shell readiness) shares this branch and leaves its own docs edits uncommitted: do not stage them. Then read docs/HANDOFF-quiet-machine-2026-10-12c.md (all). QM9 skip-caps, K5 and the poster repoint (7 WebP stills, beat 4 v3) are done and approved; do not redo them.

Standing owner instruction (2026-10-11): add new tests, gate scripts, mutation proofs or extra validation only if a previous test can be eliminated; run only the existing required gates once; do not reply to preference statements, just apply them. Costs and decisions in line one, model named. Use the advisor (Opus) before building and before declaring done; do small edits yourself rather than spawning.

Task: ask me ONE question, which to do next: (a) beat-1 caption says "blue shell" over an orange render: fix the copy; (b) motion plan S3 per-section state (needs my ruling whether it may change the look); (c) V16 vs shipped frame shifts; (d) the eager "keeps reservoir occurrences..." test. Do not start any before I answer.

Constraints: torque wrench page and public/models/msp-enclosure.glb untouched; V16 master already swapped with the fix (backup .pre-fillfix-2026-10-12.blend kept): do not touch it again without a go; no push, PR or deploy; stage by explicit path; commit only after I approve PNGs or say go; kill only PIDs you started; one GPU; Modal only on an explicit go with the dispatcher's estimate in line one; verify every report yourself; preview Blender changes from the saved blend.
```
