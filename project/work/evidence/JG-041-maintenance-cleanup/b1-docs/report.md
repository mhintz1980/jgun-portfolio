# JG-041 B1 — status/navigation documentation cleanup report (2026-11-05)

Worktree: codex/cleanup-2026-11-05. Prose-only change; no builds or browsers run; no commits. Generated and verified by [restructure.py](restructure.py) (re-runnable only on the pre-B1 files; it asserts the banner counts).

## What moved where

| File | Dated banners before | Moved to history | Blockquote lines after |
|---|---|---|---|
| TODO.md | 31 (plus 1 non-dated queue rule) | 31 | 3 (2 pointer banners + the queue rule) |
| project/README.md | 24 (plus 1 rule) | 24 | 2 (1 pointer banner + the work-ID rule) |

- New history record [status-history-2026-11-05.md](../../../../context/status-history-2026-11-05.md): 55 banners verbatim (T-01..T-31, R-01..R-24) with source file and original line number. Only relative link targets were rewritten (repo-root-relative from TODO.md, project-relative from README.md) by resolving each against its original directory and re-relativizing to project/context/.
- New current-status record [current-status-2026-11-05.md](../../../../context/current-status-2026-11-05.md).
- TODO.md order is now: title, two pointer banners, queue rule + start paragraph, Active, Queued, Task Intake, Verified Legacy Work, Operating Constraints. No queue was reordered. The one unchecked task stranded after Operating Constraints (JG-035 handoff 2026-10-08, text unchanged) was moved to the end of Active; no task was deleted.
- INDEX.md rows JG-039, JG-040, JG-041 updated; all other rows untouched.
- Anchor search (git grep of TODO/README anchors): only TODO.md#active and TODO.md#queued are referenced elsewhere (INDEX, plans); both headings still exist. No banner anchors were referenced, so no redirects were needed.

## Reconciliation decisions

- JG-040 Stage 3 release: deployment e796fe69, source f83f4ba3, rollback 81b234d0, from [release-2026-11-04.md](../../JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md). The earlier TODO entry text ("Open: ... push/deploy", 009aa4ae unpushed) was preserved with a dated history note and a new Stage 3 paragraph, not deleted.
- Stage 2 status: INDEX said Stage 2 not started; owner rulings of 2026-11-03/04 in docs/torque-wrench-rebuild/00-owner-rulings.md record Stage 2 executed, then not accepted as a whole on 2026-11-04. INDEX now says so.
- Owner visual acceptance of Stage 3 is recorded as OPEN (the release evidence records Mark approving the corrections for release, not a final visual acceptance); nothing was marked accepted.
- 2026-11-05: HUD copy deck approval (rulings file) and the narrow/phone framing follow-up (TODO Active, untracked tracker evidence read only in the shared checkout) are listed as later state. The follow-up item stays unchecked and deferred.
- JG-039: row keeps its published-2026-11-03 status; added that the Stage 3 release left the homepage HTML identical (release evidence, Preserved boundaries).
- Post-release commits: git merge-base --is-ancestor f83f4ba3 235f6fc4 exit code 0 (0 means the tracker commit follows the release). No release record exists after e796fe69, so they are described as not released.
- studiomark logo/bumper and showreel lanes are described only from observed shared-checkout artifacts (modified src/scene/studiomark-logo files, BUMPER-CONCEPTS-2026-11-05.md, remotion/src/Showreel.tsx, public/video files); their status is not otherwise recorded, so the record says so.

## Link check

Method: regex extraction of every markdown link target in each touched or created file; non-http targets resolved against the file directory and tested with os.path.exists; #anchor targets checked against markdown headings of the target file. Links that miss in the worktree but exist in the shared checkout (untracked evidence not yet integrated) are listed separately. Broken sets for the pre-B1 TODO/README/INDEX were computed the same way to separate pre-existing breakage from new breakage.

| File | Local links checked | Broken | Resolve only in shared checkout |
|---|---|---|---|
| TODO.md | 116 | 0 (see note) | 0 |
| project/README.md | 34 | 0 | 0 |
| project/work/INDEX.md | 138 | 0 (see note) | 0 |
| project/context/status-history-2026-11-05.md | 103 | 0 | 0 |
| project/context/current-status-2026-11-05.md | 12 | 0 | 0 |

Newly broken links versus the pre-B1 files: 0.

Note: the script run flagged exactly one miss in TODO.md and INDEX.md, the b1-docs/report.md link, because the script writes that report after checking. The file now exists, so that miss is a check-ordering artifact, not a broken link. No pre-existing broken links were found in the five files.

## Intentionally left in place

- Long per-task narrative sub-bullets under Active and Queued (JG-033, JG-035, JG-038 and others) stay in TODO.md; moving them would change task records, and the plan limits B1 to the dated banners. Candidate for a later pass.
- Root README.md and deployment status docs were not touched.
- Section 5 of the plan names "TODO.md ~86 KB"; Active/Queued bulk remains, so TODO.md shrinks by the banner volume only (see git diff --stat).
