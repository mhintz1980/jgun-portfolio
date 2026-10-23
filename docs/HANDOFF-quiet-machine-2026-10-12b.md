# HANDOFF (2026-10-12b): S3 and the phone header approved and committed; next is the S4 baseline p95

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, local only, nothing pushed. This is a **docs-only session** that sits beside 12a: the poster session owns [HANDOFF-quiet-machine-2026-10-12a.md](HANDOFF-quiet-machine-2026-10-12a.md) and keeps updating it (`a9a146f2`, 09:11). Read both; 12a wins on anything about posters.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend, this session | **USD 0, 0 spawns, no GPU, no Modal.** Docs and git reads only. Orchestrator Sonnet 5.5; Advisor (Opus 5.5) called once at the end |
| Rulings recorded (2026-10-12) | S3 **may change the look** and was started ("Go on S3"); S4 **numbers approved** (plan section 7; S4 not started); header at phone width **look change authorized** |
| S3 APPROVED by you 2026-10-12 (S3a `f5e8ac79`, S3b draw-on `431d23ef`; PNGs and motion approved) | `AirRibbons.tsx` skips a bundle's draws while its weight is exactly 0. **0 changed pixels in 76 compares**; closed frames 119 > 111 draw calls; worst sampled open frame only 143 > 142. Gates green: full vitest 701/50, check:station2, verifier, ribbon-clipping. Evidence `44-s3-ribbon-gating/summary.md`. S3b (real look changes) needs your direction |
| Phone header | **Committed** ("JG-033 QM7: phone header nav on one row"): nav on one row at <= 600 px, header 83 > 62 px; PNGs approved; Opus 5.5 in place of Astra for this change only; WCAG 2.5.8 met by spacing; page-transition 390x844 PASS. Evidence `46-header-phone/` |
| GPU-6 / S4 baseline | **Closed for desktop** (`47-gpu6-baseline/`, committed `cc0dda93`): desktop full p95 11.6 ms, 1.21M triangles, 142 draw calls on AMD Radeon 780M. Phone not required (you: desktop only is enough). S4 lite gets no background layers |
| What none of them waive | Astra, and your PNG/motion approval per change. You waived Astra only for posters and skip-caps; not for S3, S4 or the header |
| Uncommitted (mine) | `docs/quiet-machine-motion-background-plan-2026-10-11.md`, `docs/quiet-machine-shell-readiness-note-2026-10-11.md` (new section 17), this file. Commit by explicit path on your go |
| Waiting on you | (1) V16 frame shifts: approved with a 30k cap, estimated 120-200k tokens, so it needs your go on the cost (see the section below). (2) S4 on the full tier only (budget approved, baseline p95 11.6 ms; Opus ruling per candidate). (3) more S3b transitions only if named. Lite extras: DONE, PNGs approved, Opus ruled, committed |

## What each ruling does and does not unlock
- **S3 may change the look.** Lifts "must match the existing look". Does not lift: unaltered runtime PNGs and motion at the same u values, Astra, or the plan's rule that every stage has your approval quote before it starts (G0). I read "may change" as the ruling, not as the start. Ask once.
- **S4 numbers, approved by you later the same day** (plan section 7). Original proposal text follows; the budget rows are now approved, S4 itself is not started. Headline: the existing verifier pins leave **6 draw calls on full (143 of `< 150`) and 4 on lite (85 of `< 90`)**. Proposal: full <= +5, lite <= +2, <= 100 added triangles, <= 3 new materials (1 lite), <= 8 MB texture (1 MB lite). Today's background is one flat clear colour (`#101b24`), so S4 is all cost. **No frame-time number can be set**: no device-named p95 exists (GPU-6 never run). Taking that baseline needs the single GPU and one existing verifier run, no Modal spend. A pointer layer or third depth layer on full needs the `< 150` pin moved first.
- **Header at phone width.** Page-local, so no torque window: `.qm-header` and the `@media (max-width: 600px)` block in `src/scene/rl300/quiet-machine.css:4,71-75`, markup `QuietMachinePreview.tsx:103` (the `PageNav` inside is shared and must not be edited). Prefer CSS-only so it does not collide with the poster repoint, which edits `QuietMachinePreview.tsx` and `beats.ts`. PNGs needed at 390x844 and 390x667. Existing header pins (`preview.test.ts`, `PageNav.test.tsx`) must still pass unedited.

## Other sessions, as of 2026-10-12 09:11 (read from git and mtimes, not from their reports)
| Session | State | Evidence |
|---|---|---|
| Poster (S5) | **Live.** Beat-4 v2 failed (blown out); v3 is a per-frame exposure key, previewed locally, **not rendered on Modal**; `fix_posters.py` and a new `render_saved.py`/`probe_saved_light.py` are uncommitted; scratch blend written 09:09 | `a9a146f2`, `38-s5-posters/fix/*` mtimes, 12a "Beat 4 brightness" |
| Torque (JG-038) | **Live, Stage 2 work uncommitted** (conductor files, store, `verify-torque-timeline.mjs`, `GATES.md`). Took our `PageNav` (`85ca812a` = QM7 `1f92aa3a`) and removed the public canonical and og:url from its private entry (`dc44fb79`). Both items I flagged in shell note section 16 (consequences 2 and 3) are **resolved on its side**; recorded in shell note section 17 | `git -C ../jgun-torque-wrench log`, status |
| Torque activation `69ac760b` | Still **not merged here, by design** (section 16). The four window files are closed: any new shared edit needs a new written window | shell note sections 15-16 |
| Portfolio, QM-base, hotspot-demo, kilo pool worktrees | Idle (last commit 2026-10-09, or detached) | `git worktree list`, `git log` |

Resource note: one GPU. The poster session uses local Blender; the torque session's timeline verifier may take the GPU. Check before any capture or `verify-jg033-preview`.

## Order that avoids file collisions ("one writer per file")
1. **Poster repoint** (needs your three answers; touches `beats.ts`, `QuietMachinePreview.tsx`, `preview.test.ts`, `verify-jg033-preview.mjs`, `public/images/rl300-*`).
2. **Header phone fix** (CSS only; independent of 1; can run before it).
3. **S3** (touches `beats.ts`, `flow.ts`, `shot.ts`): after 1, because both write `beats.ts`.
4. **S4**: first the baseline p95 on the named GPU and your approval of the numbers, then `BackgroundDirector.ts` and layers. After 3.

Token estimates, plan section "Line one" except the header (mine, unanchored): S3 150-250k, S4 300-450k, header fix 40-80k.

## V16 frame shifts: SUPERSEDED by HANDOFF-quiet-machine-2026-10-12d
The premise here (audit data gone, fresh Blender dump needed, 120-200k tokens) was wrong. The owner's review session verified the inputs are tracked (`1977bfb8`: `asset2/v16-bboxes.json`, `asset2/scripts/load.mjs`; `audit.mjs` repo-relative). Re-estimate and plan: HANDOFF-quiet-machine-2026-10-12d.md, Job 1.

## Open items carried unchanged
QM8 / GPU-6 triangle acceptance (not demonstrated; open frames still carry about 304k cap-pass triangles); V16 vs shipped frame shifts (`35-v16-round-1/asset2/audit.md`); lite has no `rl300-extra-parts.glb`; eager `prepareModel` reservoir test and the load-timeout tests (12a); Astra rulings for any new visual effect.

## Traps (carried)
- `python3` on this machine is a stub that hangs; use `node` or the real interpreter path. Recursive `grep -r` over `project/work/evidence` also hangs: use the Grep tool with a narrow path.
- Heredocs eat backslashes in Python; write `.py` with the Write tool. Node rejects `/c/...` paths.
- The poster session's `fix/*.py` and `final/*.png` are not yours: verify with `git log` and mtimes before touching `public/images/rl300-*`, `POSTERS` or `beats.ts` poster ids.

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; two other sessions share this tree or its neighbours (the S5 poster session, and the torque session in ../jgun-torque-wrench). Then read docs/HANDOFF-quiet-machine-2026-10-12b.md and docs/HANDOFF-quiet-machine-2026-10-12a.md (both, all); 12a wins on posters. The motion plan edits and 12b may still be uncommitted.

Done and approved 2026-10-12, do not redo or re-ask: S3 (S3a f5e8ac79, S3b airflow draw-on 431d23ef; PNGs and motion approved); the phone header (commit "JG-033 QM7: phone header nav on one row"); the poster repoint and V16 master swap (handoff 12c); the S4 budget numbers in plan section 7 are APPROVED (S4 itself not started; frame time needs a measured device-named baseline). Opus 5.5 advisor replaced Astra per change only (draw-on, header); it is not a general waiver.

Standing owner instruction (2026-10-11): add new tests, gate scripts or extra validation only if a previous test can be eliminated; run only the existing required gates once; costs and decisions in line one with the model named; use the advisor (Opus) before building and before declaring done; small edits yourself, no spawns by default.

Task: ask me ONE question with lettered options and a cost for each: (a) the V16 frame shifts: regenerate per-part bbox data (read-only Blender dump of the V16 master, now the fillfix copy; rebuild the deleted scratch loader that asset2/scripts/audit.mjs imports), then a data table applied in prepareModel.ts, PNGs, Opus ruling; estimate 120-200k tokens, over your 30k limit, so ask me first; (b) S4 on the full tier only (budget approved; baseline p95 11.6 ms; Opus ruling per candidate); (c) another S3b transition only if I name it. Lite extras are done and committed. Do nothing before I answer.

Constraints: torque wrench page, src/shared (any file) and public/models/msp-enclosure.glb untouched; V16 master never overwritten by you; no push, PR or deploy; stage by explicit path; commit only after I approve PNGs or say go; kill only PIDs you started; one GPU; Modal only on an explicit go with the cost in line one; verify every report yourself.
```
