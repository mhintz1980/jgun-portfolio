# JG-045 (proposed ID) — Split the final site into a clean repo

Written 2026-11-16. Status: **plan only, awaiting owner go.** Nothing is moved, created
or uploaded. Companion to [JG-044](JG-044-homepage-merged-concept.md).

## Cost and gates first

- **Rough cost:** 150-250k tokens on Fable 5.2, mostly the file inventory and the build
  check. Estimate, not measured. No paid services.
- **Owner does by hand:** create the new GitHub repo, rename the old one, and approve the
  Google Drive upload. Those are account actions.
- **Three owner gates:** the keep list (step 2), the first push to the new repo (step 5),
  switching the live site to deploy from the new repo (step 7).
- **Nothing is deleted** anywhere in this plan.

## Owner decisions, 2026-11-16

1. The current repo `mhintz1980/jgun-portfolio` stays untouched and becomes the archive.
2. The final site goes into a brand new repo with fresh history.
3. Unneeded files are left behind in the archive, not deleted from disk.
4. The split happens after the merged homepage prototype is approved (JG-044 gate 2).
   The final homepage is wired into the new repo, not this one.
5. The project must stay fully editable later, from any computer, if this laptop dies.
6. CAD masters and other large files go to Mark's Google Drive.
7. The live site must not carry source weight.

## Measured, 2026-11-16 (tracked files at `1a41e271`)

| Folder | Size | Goes to |
|---|---|---|
| `project/` | 5.9-6.0 GB | Archive only, except this plan and JG-044 |
| `research/` | 126 MB | Archive only |
| `public/` | 100 MB | New repo, minus anything no page loads |
| `docs/` | 88 MB | Archive only, except one current handoff |
| `src/` | 4 MB | New repo |
| `remotion/` | 1.6 MB | New repo |

No tracked file is over 50 MB, so nothing hits GitHub's 100 MB per-file limit.
`C:\Projects\CAD` is **20 GB**, with 65 files over 100 MB, and is **not in any repo or
backup**. That rules out GitHub for it and exceeds the 15 GB free Google Drive tier, so
the Drive upload needs either paid Drive space or a trimmed set (step 3).
`remotion/` is 321 MB on disk against 1.6 MB tracked; the difference is gitignored
render output.

## Where everything ends up

| Place | Holds | Purpose |
|---|---|---|
| New GitHub repo | Site code, `public/`, three concept prototypes, Remotion source, build config, checks, short README and AGENTS file | Edit and publish from anywhere |
| Old GitHub repo (archive) | Everything as it is today, full history | Salvage |
| Google Drive | CAD masters, Blender files, render frames, anything too big for git | Survive a laptop failure |
| Live site | Build output only | Unchanged for visitors |

Source folders in the new repo add nothing to the live site: only the build output is
uploaded. Step 6 checks this with a number.

## Steps

1. **Inventory.** List what the final site loads: every file referenced by the homepage,
   `/torque-wrench/`, `/quiet-machine/`, `/armament/`, and the three prototypes. Method:
   build the site, then compare the build's inputs against the tracked file list.
2. **Keep list.** One short table for Mark: kept, left behind, and "not sure" items with
   a recommendation each. *Gate 1: Mark approves the list.*
3. **Drive backup.** Measure `C:\Projects\CAD`, the Blender files and the gitignored
   render frames. Give Mark the total and the folder layout before anything uploads.
   Upload on his go. Copies only; the masters on disk are never moved or edited.
4. **Assemble locally.** Copy the keep list into a new folder outside this repo, start
   fresh git history, add a README that says what the project is, how to run and
   publish it, and where the Drive folder and the archive repo are.
5. **Prove it stands alone.** Fresh install, `npm run check`, build, and a browser pass
   of the homepage and the three project pages from that folder only. *Gate 2: Mark
   creates the new GitHub repo and approves the first push.*
6. **Weight check.** Compare the size of the new build output with the current live
   build. It must not be larger because of source folders.
7. **Switch deployment.** Point publishing at the new repo. Confirm the live site matches
   before and after. *Gate 3: Mark approves the switch.*
8. **Mark the archive.** Rename the old repo (Mark), add one line at the top of its
   README pointing to the new repo, and tag the final state.
9. **Restore test.** Clone the new repo into an empty folder and build it, without
   touching the old checkout. This is the proof that a new laptop would work.

## Open checks

1. Size of `C:\Projects\CAD`, the Blender files and the render frames, against free
   space in Mark's Drive.
2. How the live site is published today (which branch or upload step), read from the
   repo before step 7. A git push and a Cloudflare upload are separate actions here.
3. Whether the homepage's fourth project has a page of its own. Three linked pages found.
4. Whether any kept page loads a file by a path built at runtime, which a static
   inventory would miss. The browser pass in step 5 covers this.
5. Video sessions keep working in the old repo. Decide at step 4 how a newly finished
   video file gets from there into the new repo (recommended: copy the finished file only).
6. Secrets: confirm no `.env` or credential file is in the keep list.

## Not in this plan

Deleting anything, cleaning up worktrees, changing the archive's contents, moving video
production, or any change to what visitors see.
