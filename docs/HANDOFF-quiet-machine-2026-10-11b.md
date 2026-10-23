# HANDOFF (2026-10-11b): V16 round 2 closed and owner-approved; nothing in flight

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, HEAD `40a0b353`. Tree clean except untracked `project/work/evidence/rl300-quiet-machine/38-s5-posters/` (not from this session; the S5 posters track). Nothing pushed. Ports 4173 and 5199 free (curl exit 7) at the stop.

## Line one (owner skim)
| Item | Value |
|---|---|
| Spend, this session | **0 spawns, 0 GPU runs.** Orchestrator Sonnet 5.5 only (reading, 1 `SendUserFile` of 8 PNGs, 1 ICM store). Advisor (Opus 5.5) not called. All-time unchanged: 2,975,689 tokens (handoff 11a) |
| Why so cheap | Handoff 11a was stale: round 2 had already been captured and committed by another session (`efea0537`, 14:27) after the handoff was written (13:28). I did not redo the capture |
| Owner rulings this session | Round-2 PNGs approved; verifier lite compare loosened (accepted); exhaust stack + connector confirmed **keep**; `v16Materials.test.ts` stays tracked; MAN unlisted pieces keep saved V16 materials; all five recommendations approved |
| Owner decision pending | Which next: QM7, AO pass vs V16-stills-as-posters (S5), motion/background plan approval. **Nothing started.** |

## State of the V16 track: DONE
- Code: `90bc07d2` (per-part materials, `prepareModel`/scene wiring, round-2 fixes). Evidence + extras GLB + verifier tweak: `efea0537` (message: "Owner-approved (V16 track), Astra not consulted. Outside the plan's row numbering").
- The four round-2 fixes are in and approved by PNG: connector pipe on the muffler boss, EXHAUST PIPE-1 aligned (runtime `EXHAUST_STACK_OFFSET = [0.4, 0, -0.0496]`), CPM panels kept in the cross-section, MAN as V16's 8 pieces (6,163 tris) with V16 materials.
- Owner PNGs (before/after pairs): `project/work/evidence/rl300-quiet-machine/35-v16-round-1/round2/for-owner/`.
- Measured by the capture session (I read the logs, I did not re-run): full-tier draw calls 138-142 against pin `< 150`, batches 49; verifier rerun `VERIFIER EXIT 0` (`round2/verify-jg033-preview-rerun.log`). **Lite draw calls were not recorded** (only the exit-0 verifier covers the `< 90` pin).
- **Gate loosened, owner accepted:** `scripts/verify-jg033-preview.mjs` now compares lite against full only for RULING parts (3-line change in `efea0537`). First run failed `lite must preserve ruled geometry: EXHAUST PIPE-1 578 !== 2896` because the stack is `keep`, not ruled, and `rl300-lite.glb` is stale. Lite GLB stays stale until QM9.
- **Not re-run at HEAD:** typecheck, `npm test`, build, check:station2. Last known (other session): typecheck 0, 645/646 tests (unrelated 5 s timeout in `src/scene/inspection/shaft/camera.test.ts`, passes alone), build 0. HEAD also contains the unrelated S2a commit `40a0b353`.

## Rulings in force (his words, 2026-10-10/11)
- "i approve your suggestions": V16 materials-and-parts track. Waived: plan gate, review rounds, Astra (report "owner-approved, Astra not consulted"), U.4, mutation proofs, GPU-4..8.
- D2 camera views approved. D3 end card copy option 1 ("Closed again." + numbered nav; its 4 measured defects are fixed in QM7, not started). D4 structural items approved, scroll length unlocked, 900vh provisional (`QM_LENGTH_VH`); **look items (reservoir tone, panel 2a tone, chevron visibility) were to be ruled after the V16 round, which is now approved: they are due for his ruling.** D1 stale `rl300-lite.glb` kept stale until QM9.
- Standing: NO new tests, gate scripts, mutation proofs or extra validation; run the existing gates once; do not reply to preference statements, just apply them (memory `feedback-minimal-testing`).
- `v16Materials.test.ts` (19 tests: 7 map lookup, 8 prepareModel on synthetic parts, 4 real-GLB count pins) stays tracked. I offered "trim" to drop the 4 brittle real-GLB pins; he approved my keep recommendation, so it is **not** trimmed.

## Open items, none started
1. **Next-work choice (his):** QM7 (end card + defects); AO pass vs V16 Cycles stills as posters (S5; `38-s5-posters/` is untracked evidence from that track); motion/background plan `docs/quiet-machine-motion-background-plan-2026-10-11.md` (stages need approval one by one; commit `40a0b353` already contains S1 + S2a from another session, which I did not verify).
2. **Look-item rulings** (see D4 above).
3. **V16 vs shipped frame shifts, his call, NOT changed** (`35-v16-round-1/asset2/audit.md`): engine group `904j-e28t_eng` 34 parts +14.9 mm z; `RL300-CPM-3000` and `RL300-P-FFM-1000` +14.0 mm z; `COMPOSITE_PANELS` 16 parts +94 mm x; `ENCLOSURE_CHASSIS` 36 parts +9.1 mm z; `PUMP_HOUSING` 4 parts +29 mm y. Other fused shipped nodes like MAN: `V2CONTROL_PANEL,_URFS-2` (18 pieces), `4874323_VG01_REV01_MS-1` (2 pieces); each needs a Blender extras pass.
4. QM9 lite policy / lite GLB regeneration.

## Traps new this session
- **A handoff can be stale within minutes when another session shares the branch.** First check: `git log --format='%h %ad %s' --date=iso -8` against the handoff timestamp, then `git status`, before believing "not committed". Reading the log first would have cost nothing; spawning the GPU seat would have cost 100k+.
- Carried from 11a: name-match GLB nodes after the same sanitizing as V16 names; V16 vs shipped frames differ per part group; `rtk` rewrites `git diff`/`git log`/`grep` (use `rtk proxy` for evidence); the preview binds `localhost`, probe `localhost`; use the start/stop-preview helpers in `35-v16-round-1/scripts/`, never match PIDs by command line; Bash cwd persists, use absolute paths; read-gate hook blocks big whole-file reads once.

## Spawn ledger (this session)
| # | Work | Seat | Effort | Tokens |
|---|---|---|---|---|
| | none | | | 0 |
| | **This session** | | | **0** |
| | **All-time** | | | **2,975,689** |

## Prompt
```
Resume the Quiet Machine track in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine (branch quiet-machine/integration; HEAD should be 40a0b353 or a descendant). Do not resume from chat memory. First run `git log --format='%h %ad %s' --date=iso -8` and `git status --short`; another session shares this branch and may have committed since. Then read docs/HANDOFF-quiet-machine-2026-10-11b.md (all). The V16 track is DONE and owner-approved; do not recapture or recommit it.

Use /claude-tiers (you are the orchestrator; the advisor counts as the Opus gate; give sub-agents skill paths from docs/quiet-machine-skill-shortlist-2026-10-10.md; they have no Skill tool). Standing owner instruction: NO new tests, gate scripts, mutation proofs or extra validation; run only the existing required gates once (typecheck, npm test, build, check:station2, U.1/U.2, verify-jg033-preview); keep seat specs short; do not reply to preference statements, just apply them. Costs and decisions in line one, model named, token ledger per spawn.

Task: ask me one question, which of these to do next: (a) QM7 end card + 4 measured defects, (b) AO pass vs V16 Cycles stills as posters (S5), (c) approve/schedule the next stage of docs/quiet-machine-motion-background-plan-2026-10-11.md, (d) rule on the pending look items (reservoir tone, panel 2a tone, chevron visibility). Do not start any of them before I answer.

Constraints: torque wrench page and public/models/msp-enclosure.glb untouched; no push, PR or deploy; stage by explicit path; commit only on my go; kill only PIDs you started; one GPU, one Sonnet/high capture seat; verify every seat report yourself; owner-approved, Astra not consulted for the V16 track only (visual effects elsewhere still need Astra).
```
