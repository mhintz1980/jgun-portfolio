# HANDOFF (b): kick off QM0 (Quiet Machine integration), 2026-10-10

Paste the block under "Prompt" into a fresh session with cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`. Everything else in this file is what that session reads next.

## Where things stand
| Item | State |
|---|---|
| Branch | `quiet-machine/integration`, worktree `jgun-quiet-machine`. Not pushed. |
| Structure (rev 2) | Committed `d826cd38`, owner-approved. `docs/quiet-machine-integration-structure-2026-10-10.md` |
| Plan | Committed `520b6982`, owner-approved after two Opus rounds. `project/work/plans/JG-033-quiet-machine-integration.md` (14 commit specs, gates B / U.1-U.4, GPU-1..GPU-8) |
| Skill shortlist | `docs/quiet-machine-skill-shortlist-2026-10-10.md` (orchestrator-only; hand sub-agents an absolute path; it has a binding Seat column) |
| Docs commit | Shortlist, this handoff, the plan's Skills row and the old handoff's status banner are written but may be uncommitted; the prompt's step 0 commits them. |
| Owner rulings recorded | Q1 = option (a); lane worktree name `jgun-qm-lane-<QMn>` |
| Not yet answered | Q2 merge target, Q3 Astra/fade, Q4 fade receiver on `/`, Q5 deep links, Q6 extensibility, Q7 GPU windows, Q8 TODO/INDEX. The plan's defaults stand. Q7 is needed by GPU-1 (after QM4), not before. |
| Code written | None. No `node_modules` here; QM1 pre-flight runs `npm ci`. |
| Strays | Three empty untracked files in the worktree root (`2`, `key`, `document.querySelector('.qm-poster`). Not ours. Do not stage, delete or read them. Always stage by explicit path. |

## What QM0 is
Haiku / high, docs only, no GPU, no build, review by the advisor (about 60k). Two edits: an "Extension record" section appended to `JG-033-rl300-quiet-machine.md`, and `d201ea8` added to the `commits:` list in `JG-032-station2-thermal-visualization.md`. Its post-commit gate compares `HEAD~1..HEAD`, so this docs commit (shortlist, handoff, plan row) must already be the parent. Spec: plan section "QM0: factual plan-doc fixes" (goal: record in the two plan docs that the pin is withdrawn, the pages are split, and JG-032 includes `d201ea8`). Gate: U.1 allows only its two plan files, plus U.3 (`check-station2-contract.mjs`, needs no `node_modules`). QM0 is the cheap checkpoint: if it is clean, QM1 (Sonnet + Opus review, needs `npm ci`) follows.

## Do not relitigate (handoff §2, FINAL)
Own page and own scroll per product; hard navigation with a fade through dark (fade needs Astra approval); QM at `/quiet-machine/`; M249 slot reserved only, offline until JG-037; ~500k triangle target with device-named p95; one intake hotspot; torque wrench page untouched until a cutover the torque track owns. The scroll-axis pin work is withdrawn.

## Process rules that cost us time this session
1. **Worker reports are claims.** Every hand-back was verified with `git status`, `wc -l`, greps and file mtimes. Keep doing that; two reports were partly wrong in small ways.
2. **Review cost.** Opus `tier-reader` review: about 70-90k when the spec lists the checks and says "be economical", 154k when it was open-ended. Write-heavy `tier-worker` spawns ran 90-230k. Tell reviewers what to verify and to read the source only where a check needs it.
3. **Two-round review cap** per piece, then stop and bring the owner the open findings.
4. **A connection error loses the report, not the work.** Check the file on disk before re-running a spawn.
5. **Long single writes look stuck.** A 700-line plan write took 19 minutes with a silent transcript. Check the file mtime before killing.
6. **Token ledger (owner is auditing spawn cost).** Keep a scratch table: agent, seat, effort, tokens, tool calls, minutes, from each completion notice. Fold it into the evidence README at QM11. Do not commit it earlier (U.1 allowlist).
7. **Owner reads little.** Costs and decisions in line one, with the model named. Send PNGs for visual rulings; do not describe them.
8. No push, PR or deploy. Visual effects need Astra (`gpt-6-astra`, codex surface) before "done". One GPU, one seat: the JG-035 session owns hardware GL and ports 4173/4174/5203/5205; ask the owner, never assume.

## Prompt
```
Read docs/HANDOFF-quiet-machine-2026-10-10b.md, then project/work/plans/JG-033-quiet-machine-integration.md sections A, B and "QM0", and docs/quiet-machine-skill-shortlist-2026-10-10.md. Do not resume from chat memory.

Use /claude-tiers (you are the orchestrator; Opus approves plans and reviews critical work, the advisor tool counts as the Opus gate). Load pickup (C:/Projects/skills-master/vendor/caneff-agent-skills/pickup/SKILL.md) now; load unlazy (C:/Projects/skills-master/local/unlazy/SKILL.md) before QM1. Give sub-agents skills by path from the shortlist, one SKILL.md per need; they have no Skill tool.

Step 0: if `git status --short` still shows docs/HANDOFF-quiet-machine-2026-10-10.md, docs/HANDOFF-quiet-machine-2026-10-10b.md, docs/quiet-machine-skill-shortlist-2026-10-10.md or project/work/plans/JG-033-quiet-machine-integration.md as modified/untracked, commit exactly those paths by explicit path as one docs commit (QM0's HEAD~1..HEAD gate needs it as the parent). My pasting this prompt is the go for that commit.

Task: run QM0 only. Spawn one Haiku tier-worker (effort high) with the plan's QM0 spec as a self-contained prompt. Verify its diff yourself (git status, git diff, the U.1 gate and U.3 from plan section B). Commit by explicit path. Then stop and report: files changed, gate outputs, the spawn's token cost, and what QM1 needs from me (npm ci, Opus review, the first Opus spawn). Do not start QM1 until I say go.

Constraints: torque wrench page untouched; no push/PR/deploy; stage by explicit path (three stray untracked files exist); keep a scratch token ledger per spawn; Q1 is ruled (a), Q2-Q8 use the plan's defaults.
```
