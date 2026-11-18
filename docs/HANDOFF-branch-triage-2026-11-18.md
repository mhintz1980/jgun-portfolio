# Handoff: jgun-portfolio branch triage (2026-11-18)

Written 2026-11-18 by the homepage tear session. **This session is research and a proposal.** It changes no branches, worktrees or stashes until Mark rules on each row.

## The job

Sort every branch of `mhintz1980/jgun-portfolio` into one of four buckets, with evidence for each:
1. **Merge**: it has unique work that belongs in `main`.
2. **Delete**: everything in it is already in `main` or in a branch that is kept.
3. **Verify first**: something about it is unclear (unique commits of unknown value, a dirty worktree, a remote that is gone, old work).
4. **Keep as is**: an active line, or the live-site branch.

Deliver a table Mark can rule on, row by row. Then act only on his ruling.

## Hard rules

- **Ask first.** No merge, branch delete, worktree remove/prune, stash drop, push or remote-branch delete without Mark's go for that exact item. A push needs `--no-verify` and its own go every time.
- **JG-045 says "Nothing is deleted anywhere in this plan."** That plan is `project/work/plans/JG-045-clean-repo-split.md`, on branch `claude/homepage-prototype-approval-b6962a`. The old repo becomes the archive after gate 2.
  - So present deletion as "tag `archive/<branch>` on the tip, then delete the branch name". The commits stay reachable that way.
  - Let Mark decide whether to delete at all before the split.
  - Do not start the repo split itself: it waits for gate 2.
- **Dirty worktrees:** never remove or prune a worktree that has uncommitted, untracked **or gitignored** work files. Check with `git -C <path> status --short --ignored`. List those files and ask.
- **Live sessions:** never remove a worktree that a Claude desktop session is still using. That includes at least `homepage-prototype-approval-b6962a` (the tear session) and `homepage-tear-feedback-be2031`. Check open and linked sessions first. Prefer the app's own worktree cleanup to a bare `git worktree remove`.
- **Stashes:** the stash stack (7 entries) is shared by all worktrees and sessions. Never `git stash pop` or `git stash drop`. Report the stashes as rows of their own.
- **The live site:** first find out which branch, or which upload step, publishes the live site (JG-045 open question 2). Read the deploy config and CI workflows, and look at the hosting docs. That branch is "keep" no matter how it looks.
- Commit by explicit path only, never `.scratch/`. Read `AGENTS.md` first. Don't read the 31 KB `TODO.md` beyond its Active section.
- Mark skims, so put the decision table first.

## Where things are

- Main checkout: `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`. It is **on `showreel-v3`, not `main`**, with 11 dirty files.
- Remote: `origin` = `https://github.com/mhintz1980/jgun-portfolio.git`. `main` = `origin/main` = `1a41e271` (2026-11-14).
- `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` is a **worktree of this same repo** (branch `torque-wrench/rebuild`, 59 dirty files), not a separate repo.
- There are 15 worktrees in total, some outside the repo:
  - `jgun-home-redesign`
  - `~/.codex/worktrees/jg041-b4-retirement/...`
  - `~/.local/share/kilo/worktree-pool/.../bumpy-battery` (detached HEAD)
  - `jgun-torque-wrench/.scratch/worktrees/*`
- Start the triage session in the main checkout, not in a worktree. A worktree session's guard blocks writes to other worktrees.

## Snapshot: 37 local branches (2026-11-18)

Columns:
- **ahead/behind** = commit counts against `main`;
- **uniq** = patches not in `main` (`git cherry main <b>`; cherry-picked commits don't count);
- **contained in** = other local branches whose history includes this branch's tip;
- **dirty** = uncommitted plus untracked files in the branch's worktree.

Re-run the commands under "Regenerate" before acting: this is a snapshot.

### Fully in `main` (0 ahead)
| Branch | Last commit | Worktree (dirty) | Note |
|---|---|---|---|
| `main` | 11-14 | none | **Keep.** The merge target; equal to `origin/main` |
| `claude/advisor-opus-c070f2` | 11-14 | advisor-opus-c070f2 (0) | |
| `claude/armament-wiring-clipspin-15a80d` | 11-14 | none | The branch name can go. Its worktree **folder** is now on `jg-041/armament-wiring` and must be kept (see Line A) |
| `claude/homepage-tear-feedback-be2031` | 11-14 | homepage-tear-feedback-be2031 (0) | The session that wrote this |
| `claude/jg-041-armament-cad-cb235e` | 11-13 | none | 15 behind |
| `claude/jg-041-higgsfield-improvements-d032fb` | 11-14 | none | |
| `claude/jg-041-spin-shot-review-12f814` | 11-14 | jg-041-spin-shot-review-12f814 (**2**) | **Keep the worktree.** It has 2 untracked docs of real work: `docs/ANSWERS-homepage-armament-frames-2026-11-16.md` and `docs/HANDOFF-armament-lane-2026-11-16.md`. The branch name can go once they are committed somewhere |
| `codex/homepage-authoritative-export-20261114` | 11-14 | none | 4 behind |
| `codex/homepage-session-to-main-20261114` | 11-14 | none | Tracks `origin/main`, 8 behind |
| `showreel-v3` | 11-08 | **main checkout (11)** | The main checkout is on it. Check its 11 dirty files |

### Line A: the torque-wrench / site rebuild lineage
Each branch below is contained in the ones below it in this table. Tips: `jg-041/higgsfield-improvements` and `feat/metrology-models`.

| Branch | Ahead / uniq | Contained in | Worktree (dirty) | Upstream |
|---|---|---|---|---|
| `claude/jg-041-line-slice-2` | 10 / 8 | homepage-redesign-20261111 and everything below | none | none |
| `claude/homepage-redesign-20261111` | 11 / 9 | torque-wrench/rebuild, … | `jgun-home-redesign` (**11**) | none |
| `feat/torque-debris-field` | 12 / 10 | canvas-release, torque-wrench/rebuild, … | `.scratch/worktrees/torque-debris-field` (**23**) | none |
| `codex/homepage-canvas-release-20261113` | 17 / 13 | torque-wrench/rebuild, … | none | `origin/torque-wrench/rebuild` (behind 1) |
| `torque-wrench/rebuild` | 18 / 14 | home/canvas-heading-sync, metrology-models, jg-041/* | `jgun-torque-wrench` (**59**) | `origin/torque-wrench/rebuild` |
| `home/canvas-heading-sync-2026-11-14` | 18 / 14 | metrology-models, jg-041/* | none | `origin/torque-wrench/rebuild` |
| `jg-041/armament-spin` | 21 / 17 | armament-wiring, higgsfield-improvements | none | none |
| `jg-041/armament-wiring` | 23 / 19 | higgsfield-improvements | armament-wiring-clipspin-15a80d (1) **keep the worktree** | `origin/jg-041/armament-wiring` |
| **`jg-041/higgsfield-improvements`** (tip) | 24 / 20 | none | jg-041-higgsfield-improvements-d032fb (1) | none |
| **`feat/metrology-models`** (tip) | 21 / 19 | none | `.scratch/worktrees/metrology-models` (0) | none; has merged `origin/main` |
| `wip/metrology-workbench` | 13 / 11 | none | none | none |
| `codex/homepage-export-production-20261114` | 17 / 13 | none | none | `origin/codex/homepage-export-production-20261114` |

Notes on Line A:
- **The `armament-wiring-clipspin-15a80d` worktree holds chapter-video assets that exist nowhere in git:**
  - the 180 source carbine line frames, `remotion/clips/armament/ar15-pattern-carbine-a/line/`, which `remotion/.gitignore` ignores;
  - an untracked `project/work/evidence/JG-041-armament-act/` folder.

  Removing that worktree would lose them. `render_clip.py` is tracked.
- The two tips diverge. Their shared base, `torque-wrench/rebuild`, may be what feeds the live site. Check this first.
- `codex/homepage-export-production-20261114` is not contained anywhere. Commit `e2fe5308` on `main`, "record verified owner-export homepage publication", suggests its content may have reached `main` in another form. Compare the trees, not just the commits.

### Line B: the homepage prototype lineage
Each branch below is contained in the ones below it in this table. The tip is `claude/homepage-prototype-approval-b6962a`.

| Branch | Ahead / uniq | Contained in | Worktree (dirty) | Upstream |
|---|---|---|---|---|
| `claude/studiomark-homepage-redesign-b936a9` | 3 / 3 | 32e311, concept-3, concepts-merge, b6962a | none | none |
| `claude/studiomark-homepage-redesign-32e311` | 4 / 4 | concept-3, concepts-merge, b6962a | none | none |
| `claude/homepage-concept-3-verdict-f323c0` | 8 / 8 | concepts-merge, b6962a | homepage-concept-3-verdict-f323c0 (0) | origin (local is ahead 1) |
| `claude/homepage-concepts-merge-2a1f76` | 12 / 11 | b6962a | homepage-concepts-merge-2a1f76 (0) | origin (local is ahead 1) |
| **`claude/homepage-prototype-approval-b6962a`** (tip) | 17 / 16 | none | homepage-prototype-approval-b6962a (0) | **none; never pushed** |

Notes on Line B:
- b6962a holds the gate-2 prototype: the paper tear (Astra-approved), the armament stage and its frames, and the handoffs.
  - Its latest commits are `d21ebd43`, `5d38d9f0` and `d907f75a`; the counts above include them.
  - JG-044 rule: nothing goes into `src/home/` before Mark approves the prototype.
  - Merging `proto/merged/` into `main` is Mark's call.
  - The branch exists only locally. It may be worth a push (with Mark's go) as a backup.
- Line B is behind `main` by 0, so it is based on the current `main`.

### Other branches (unique work, not contained anywhere)
| Branch | Last commit | Ahead / uniq | Upstream | First thing to check |
|---|---|---|---|---|
| `claude/project-thread-kad6t1` | 10-24 | 16 / **0** | gone | All of its patches are already in `main`, so likely delete |
| `claude/project-thread-tlq9j4` | 11-02 | 13 / 10 | gone | JG-039 armament "under construction" work |
| `codex/jg033-signature-shot` | 10-13 | 5 / 5 | gone; `origin/archive/codex/jg033-signature-shot` exists | Probably archived already. Compare it with the archive ref |
| `archive/ccr-review-20261007` | 10-07 | 1 / 1 | none | Named as an archive already |
| `backup/jg043-local-carousel-duplicate-2026-11-14` | 11-14 | 9 / 7 | none | Named as a backup. Is JG-043 in `main`? |
| `claude/advisor-opus-4e6f71` | 11-15 | 3 / 3 | none | JG-041 handoff/wiring docs |
| `claude/claud-design-homepage-edit-8f0c1c` | 11-10 | 2 / 2 | origin | Homepage handoff docs |
| `claude/jg-041-line-slice-2-9026ef` | 11-12 | 2 / 2 | none | JG-041 handoff docs |
| `codex/jg041-b4-retirement` | 11-06 | 3 / 3 | none | Worktree in `~/.codex/worktrees` (**2** dirty) |
| `docs/f1-f2-owner-ruling-reconciliation` | 10-31 | 1 / 1 | none | JG-038 docs |

### Remote-only branches (no local branch)
| Ref | Last commit | Ahead of `main` |
|---|---|---|
| `origin/archive/codex/jg033-signature-shot` | 10-13 | 5 |
| `origin/claude/homepage-print-vault` | 11-01 | 1 |
| `origin/torque-wrench/1b-grooves-ring-camera` | 10-24 | 3 |
| `origin/torque-wrench/prototype-brief-1-2-4` | 11-01 | 1 |

### Other items
- **7 stashes**: list them with `git stash list --format='%h %cs %gs'` and show each one's file stat.
- **The detached kilo worktree `bumpy-battery`**: find out what commit it's on and whether it's dirty.

## Method

1. **Read first:**
   - `AGENTS.md`;
   - `TODO.md`, the Active section only;
   - `project/work/plans/JG-045-clean-repo-split.md` (on b6962a: `git show claude/homepage-prototype-approval-b6962a:project/work/plans/JG-045-clean-repo-split.md`);
   - the newest `docs/HANDOFF-*` files that mention a branch.
2. **Find the live-site branch** before anything else.
3. **Regenerate the snapshot** with the commands below and note anything that changed.
4. **For every branch with unique patches**, check whether the work landed elsewhere in another form. Use `git cherry -v main <b>`, then `git diff main...<b> --stat`. Then look at the files: are the same contents already in `main` or in a kept tip? That is a tree comparison, not a commit comparison.
5. **For every dirty worktree**, list the files with `git -C <path> status --short`.
   - Sort them: generated output, scratch, or real work.
   - Real work gets "verify first".
6. **Put each row in a bucket**, with one line of evidence each. For "merge", name the target and the order. Line A and Line B would each merge as a single tip.
7. **Show Mark the decision table** (an artifact page is fine) and wait for his ruling.
8. **Then do only the rows he approved:**
   - tag `archive/<branch>` before any delete;
   - `git worktree remove` only for clean worktrees;
   - report each action, including the hash it acted on.

## Regenerate

From `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`:

```bash
git fetch --prune origin
git worktree list
git for-each-ref --format='%(refname:short)|%(committerdate:short)|%(upstream:short)|%(upstream:track)' refs/heads |
while IFS='|' read b d up tr; do
  ab=$(git rev-list --left-right --count main...$b); u=$(git cherry main $b | grep -c '^+')
  in=$(git branch --contains $b --format='%(refname:short)' | grep -vx "$b" | tr '\n' ' ')
  echo "$b | $d | behind/ahead $ab | uniq $u | up $up $tr | in: $in"
done
git stash list --format='%h %cs %gs'
```

Note: `git fetch --prune` only updates remote-tracking refs and changes no branches. Still, say before running it.

## Done when

- Mark has a table with every branch, remote-only ref, stash and worktree in one of the four buckets, each with its evidence.
- The live-site branch is identified, with its source cited.
- Nothing is changed in git without a ruling from Mark on that row.

## Paste prompt for the fresh session

How to start it:
- Open the session on the plain folder `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`, with no new worktree.
- Or run `claude` in a terminal from that folder.

A worktree session can't write outside its own worktree.

> Start in `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio` (the main checkout, not a worktree). Read `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\docs\HANDOFF-branch-triage-2026-11-18.md` first, then `AGENTS.md` and the JG-045 plan it names.
>
> Your job: sort every branch, remote-only ref, stash and worktree of `mhintz1980/jgun-portfolio` into merge / delete / verify-first / keep, with one line of evidence each. Find the branch that publishes the live site first.
>
> This is research and a proposal. Change nothing in git without my go for each row: no merges, deletes, prunes, stash drops or pushes. JG-045 says nothing is deleted, so propose "tag `archive/<branch>`, then delete" and let me decide. Show me the decision table first, short.
