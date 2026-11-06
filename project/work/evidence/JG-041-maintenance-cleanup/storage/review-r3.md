# JG-041 B3 review R3 (Anthropic seat, claude-sonnet-5-5)

## Verdict: APPROVE-EMPTY

Zero deletions is correct and safe. No run is a missed DELETE-candidate. Nothing in KEEP-unknown qualifies for deletion or archiving, and no flip occurs under stricter reference matching. Two non-blocking notes follow (file-count claim, one pin-closure observation).

## What drives the empty result

The delete test is dominated by the age screen, not by the reference search. Only 4 of 145 runs have newest mtime before 2026-10-22T04:00Z. All four are the ARCHIVE-candidates, and each has real inbound path references. Every other run is newer than the cutoff (the oldest non-archive run is quiet-machine, 2026-10-24 06:11Z), so it is ineligible regardless of references.

## Findings

| # | Area | Result | Severity |
|---|---|---|---|
| 1 | Inventory recompute | All 145 rows match exactly (files, bytes, newest mtime), well past the required 20-run sample. Total 25,438 files / 14,661,944,169 B equals a full recursive scan of output/ (no unmanifested file). | OK |
| 2 | File-count claim | The task text says 23,796 files. The manifest rows sum to 25,438 (462+7762+1155+13097+2962), and my scan gives 25,438. The 23,796 figure is wrong or stale. The bytes figure is correct. | Note |
| 3 | ARCHIVE-candidate refs | Author fixed-string and path-form (output/playwright/<run>) give identical counts: followon 5/5, knurl 2/2, lightning 9/9, route-scope 2/2. Matches are docs/torque-wrench-rebuild/23..34 files citing the run path. Real citations, no flip. | OK |
| 4 | Oldest 12 KEEP-unknown, stricter refs | Author counts reproduced exactly. Path-form drops to zero for owner-corrections 2026-10-26T01-39-08-865Z and 2026-10-26T01-55-10-410Z (five others were already zero). All have mtime 2026-10-25..26, so they are 10-11 days old at 2026-11-05 and fail the 14-day rule. Not eligible. | OK |
| 5 | Age screen, HOLD-active | Newest mtimes from my scan equal the manifest for every HOLD-active row (all >= 2026-10-29Z). Runs in the 10-22..10-29 window are correctly not delete-eligible. | OK |
| 6 | Tracked-status clause | Vacuous, as suspected. output/ is ignored by .gitignore:22 in both checkouts. git ls-files -- output returns 0 in both, and 0 of 145 rows has tracked files or lacks ignore. So "untracked" is true for everything and gives no protection. Consequence: every run is a single copy with no Git recovery, so deletion safety rests only on the age, pin and reference gates. | Note |
| 7 | Pin closure | All 12 PINNED rows present, covering every plan s4 named set: 73-reconciliation-final, 73-narrow-lite-recovery, torque-camera-hud-73-final, torque-camera-hud-2026-10-21, studiomark-wip-2026-10-31, jg040-stage3-20261104, studiomark-home-release-local, -production, home-header, hlp/73-same-program, hlp/73-terminal-final, plus torque-camera-hud-jg040-rebaseline. Output/ paths cited by JG-039 and JG-040 records resolve to PINNED rows. | OK |
| 8 | Pin-closure observation | Leaf-name search of 17 cited source files (evidence 70/74, docs 72/73, JG-039, JG-040) hits two unpinned rows: quiet-machine (KEEP-unknown; in release-2026-11-03.md, README.md, publication-smoke.json, release-2026-11-04.md) and cascade-control-refinement-2026-10-30-full-r2/report.json (HOLD-active; release-2026-11-03.md). A path-form search of release-2026-11-03.md found no playwright/quiet-machine match, so the quiet-machine hits are probably page-name mentions rather than output citations. I did not read file bodies to confirm. Both rows are already non-deleted, so this is safe. Consider promoting both to PINNED in a later pass. | Note |
| 9 | hlp geometry citation | Evidence 70 cites output/high-low-feature-proof/geometry/analyze-geometry.mjs. Confirmed absent: output/high-low-feature-proof/ has exactly 4 children (73-same-program, 73-terminal-final, control-centroid-2026-10-30, control-refinement-2026-10-30). No safety effect. | Note |

## Re-run commands and numbers

Full recompute (PowerShell), all 145 manifest rows:

    Get-ChildItem -LiteralPath <repo>\<path> -Recurse -File -Force   # sum Length, max LastWriteTimeUtc, count
    -> exact-match rows 145 of 145; files 25438; bytes 14661944169
    Get-ChildItem <repo>\output -Recurse -File -Force
    -> files 25438; bytes 14661944169 (identical, so manifest coverage is complete)

Reference searches (scopes: docs project scripts src remotion plus root *.md *.json *.ts *.mjs):

    A  rg -l --fixed-strings -- <leaf>                                  (author's command)
    B  rg -l -w --fixed-strings -- <leaf>                               (word boundary)
    C  rg -l --fixed-strings -e output/<area>/<run> -e <backslash form> (path form)

| run | newest mtime | A (author) | manifest | B | C |
|---|---|---:|---:|---:|---:|
| jg038-route-scope-20261017 (ARCHIVE) | 10-17 | 2 | 2 | n/r | 2 |
| jg038-knurl-20261017 (ARCHIVE) | 10-17 | 2 | 2 | n/r | 2 |
| jg038-lightning-20261017 (ARCHIVE) | 10-19 | 9 | 9 | n/r | 9 |
| jg038-followon-20261019 (ARCHIVE) | 10-19 | 5 | 5 | n/r | 5 |
| quiet-machine | 10-24 | 461 | 461 | 461 | 4 |
| stage1-cascade | 10-25 | 13 | 13 | 13 | 4 |
| stage1-cascade-r2 | 10-25 | 1 | 1 | 1 | 1 |
| stage1-cascade-r3 | 10-25 | 2 | 2 | 2 | 2 |
| owner-corrections/2026-10-25T21-56-08-287Z | 10-25 | 0 | 0 | 0 | 0 |
| owner-corrections/2026-10-25T22-45-14-873Z | 10-25 | 0 | 0 | 0 | 0 |
| owner-corrections/2026-10-26T00-49-19-092Z | 10-26 | 2 | 2 | 2 | 1 |
| owner-corrections/2026-10-26T01-39-08-865Z | 10-26 | 1 | 1 | 1 | 0 |
| owner-corrections/2026-10-26T01-43-35-061Z | 10-26 | 0 | 0 | 0 | 0 |
| owner-corrections/2026-10-26T01-55-10-410Z | 10-26 | 1 | 1 | 1 | 0 |
| owner-corrections/2026-10-26T03-01-31-617Z | 10-26 | 3 | 3 | 3 | 2 |
| owner-corrections/54-planet-orbits-r1 | 10-26 | 0 | 0 | 0 | 0 |

n/r = not run for ARCHIVE rows, because path-form already equals the author count. A search of the cleanup worktree adds one hit per ARCHIVE run; I did not inspect those extra hits, and the cleanup branch's own evidence files are a likely source.

Tracked and ignored checks:

    git -C <repo> ls-files -- output               -> 0 (shared checkout and worktree)
    git check-ignore -v output/playwright/x        -> .gitignore:22:output/
    per-row ls-files + check-ignore, 145 rows      -> 0 bad

## Flips under stricter matching

None with a deletion consequence. Seven old KEEP-unknown runs reach zero path-form references, and 50 KEEP-unknown rows have zero author-counted references. All are younger than the cutoff, so each fails the age clause.

## Forward-looking note (no action this pass)

As KEEP-unknown rows age past 14 days, the zero-reference ones become delete-eligible. The earliest are the 2026-10-25 owner-corrections runs, around 2026-11-08. A later pass must re-run the age screen, apply a path-form reference check, and weigh the pin observation in finding 8. Because the tracked clause is vacuous and output/ has no Git backup, a later pass should prefer archive-then-delete over direct deletion.

## Method limits

Metadata only; no file contents read except cited-source search hits (file names only). Reparse points were not traversed (default). Only the 16 runs above were reference-searched under all variants; the other rows were checked by age screen and recompute only.
