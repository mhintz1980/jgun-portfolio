# HANDOFF: sync the local copy after PR #5 merges (2026-11-02)

For: the agent working in Mark's local folder `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`
(a worktree of `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`, branch `torque-wrench/rebuild`).
From: the cloud thread that built PR #5.

## The situation

- PR #5 (`claude/project-thread-tlq9j4` -> `torque-wrench/rebuild`) adds the private homepage at
  `/home/` and `/armament/`, and renames the torque wrench page. Mark plans to **squash-merge** it
  and delete the branch, so the old commits that still contain unblurred drawings stay out of `torque-wrench/rebuild`.
- On 2026-11-01 the local worktree had **uncommitted changes**: about 17 modified and 8 new files,
  including `scripts/verify-*`, `src/scene/torque-wrench/*` and `contactWitnesses*`. Those changes
  were never pushed, and the cloud thread never saw or touched them.
- The PR edits some of the same areas, so `git pull` may stop with "your local changes would be
  overwritten" or leave merge conflicts.

## Files the PR changes outside the new homepage folders

The new folders are `src/home/`, `public/home/` and `public/fonts/home/`. Check these files against
`git status` first. The **bold** ones are the most likely to clash:

- **`src/scene/torque-wrench/TorqueWrenchPage.tsx`**: H1 `JGUN Torque Wrench` -> `Industrial Torque Wrench`; intro sentence `JGUN Pneumatic Torque Wrench.` -> `Pneumatic Torque Wrench.`
- **`src/scene/torque-wrench/Story.tsx`**: `Mark Hintz’s JGUN design` -> `Mark Hintz’s design`
- `torque-wrench/index.html`: title, og/twitter title and descriptions no longer say JGUN
- `index.html` (root redirect shell): link text `Continue to the Industrial Torque Wrench`
- `src/data/caseStudies.ts`: `machine: 'High-Precision Industrial Torque Wrench'` (was `...Torque Gun`), plus a comment recording Mark's 2026-11-02 rule
- `src/scene/drawing/sheet/composeSheet.ts`: title block `PROJECT:  HIGH-PRECISION INDUSTRIAL TORQUE WRENCH`
- `src/state/scrollStore.ts`: station name `PTG-HP-1000 TORQUE WRENCH`
- `src/components/IntroTitles.tsx`: `A high-precision industrial torque wrench.`
- `src/shared/pages.ts` (+ `pages.test.ts`, `pageTopology.test.ts`): new private pages `home` and `armament`; jgun page name `Pneumatic Torque Wrench`
- `scripts/verify-launch-dist.mjs`: REQUIRED list adds `home/index.html`, `armament/index.html` and 6 `home/drawings/*.webp`
- `TODO.md`, `project/work/INDEX.md`: new JG-039 entries
- New files: `home/index.html`, `armament/index.html`, `src/home-main.tsx`, `src/armament-main.tsx`, `scripts/blur-dimensions.py`, `docs/HANDOFF-homepage-path-a-2026-11-01.md`, `project/work/plans/JG-039-homepage-print-vault.md`

## Owner rule behind the renames (Mark, 2026-11-02)

"Definitely remove the torque gun anywhere it appears as well as the company names." "Torque Gun"
and "JGUN" must not be **displayed** anywhere. Internal identifiers stay as they are: GLB names,
`PageId 'jgun'`, node names, `jgunVisualGates`, comments. When resolving conflicts, keep both the
local work and these renames. Do not bring back the old display strings.

## Steps

1. **Save the local work first. Do not discard anything.**
   - `git status` and `git stash list`. Note every modified or untracked file.
   - Commit the work on a local branch (e.g. `git switch -c local/wip-2026-11-02`, `git add -A`, `git commit`). Or run `git stash push -u -m "local wip before PR5"`. A branch is safer.
2. After Mark has merged PR #5: `git fetch origin` and `git switch torque-wrench/rebuild`.
3. If step 1 used a branch: `git merge origin/torque-wrench/rebuild` into it, or rebase it onto that branch. If step 1 used a stash: `git pull --ff-only`, then `git stash pop`.
4. Resolve conflicts file by file. Keep the local logic and apply the display-string renames above. Search for leftovers: `git grep -nE "JGUN|Torque Gun|TORQUE GUN" -- src torque-wrench index.html`. Only internal identifiers and comments should remain.
5. Check it: `npm run typecheck`, `npx vitest run`, `npm run build`, `node scripts/verify-launch-dist.mjs`. At the cloud head all of these passed (1486 tests, verify-launch-dist OK). Open `/torque-wrench/` and `/home/` in `npm run preview`.
6. **Do not deploy** until Mark says so. Deploying (`scripts/deploy-studiomark.ps1`) puts the renamed `/torque-wrench/` live. `/home/` and `/armament/` stay private (noindex, not in nav), and `/` still forwards to `/torque-wrench/`.

## Not checked by the cloud thread

- Whether textures inside the GLB models, poster frames or videos show "Torque Gun" branding.
- What the local uncommitted changes contain. They may already rename some of these strings differently. If so, ask Mark which wording wins.
