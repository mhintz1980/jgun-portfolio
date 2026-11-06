# JG-041 B3 storage inventory summary

Generated 2026-11-06 01:25:34Z. READ-ONLY inventory of the shared checkout output/ tree; no files deleted, moved, or modified. Bytes are logical file bytes (Length sum), not disk allocation.

## Bytes by classification

| classification | runs | files | logical_bytes |
|---|---:|---:|---:|
| ARCHIVE-candidate | 4 | 462 | 281257166 |
| HOLD-active | 19 | 7762 | 3326092769 |
| HOLD-owner-review | 9 | 1155 | 385155309 |
| KEEP-unknown | 101 | 13097 | 8618921701 |
| PINNED | 12 | 2962 | 2050517224 |

DELETE-candidate before pin/hold exclusions (raw unpinned class): 0 runs,  bytes
DELETE-candidate after exclusions (final class): 0 runs,  bytes
Excluded from raw DELETE by pin/hold rules: 0 runs,  bytes
ARCHIVE-candidate: 4 runs, 281257166 bytes

## Area rollups

| area | runs | files | logical_bytes |
|---|---:|---:|---:|
| (output-root) | 20 | 20 | 1358482 |
| (playwright) | 37 | 3019 | 1468584217 |
| cascade-control-refinement-2026-10-30-full-r2 | 5 | 5621 | 1024141923 |
| final-cascade-2026-10-26 | 7 | 10585 | 2063420222 |
| high-low-feature-proof | 4 | 1632 | 332973274 |
| owner-corrections | 49 | 1644 | 4131673578 |
| page-cinematography | 4 | 2265 | 3335216406 |
| page-cinematography-2026-10-28 | 19 | 652 | 2304576067 |

## Top 20 largest runs

| path | files | logical_bytes | newest_mtime_utc | classification |
|---|---:|---:|---|---|
| output/playwright/page-cinematography/73-reconciliation-final | 1005 | 1264502182 | 2026-10-31 04:31:37Z | PINNED |
| output/playwright/page-cinematography/control-refinement-2026-10-30-full | 321 | 944913237 | 2026-10-30 21:40:30Z | HOLD-active |
| output/playwright/final-cascade-2026-10-26/final-approved | 4765 | 860311378 | 2026-10-27 05:29:19Z | KEEP-unknown |
| output/playwright/page-cinematography/73-reconciliation | 622 | 859620612 | 2026-10-30 23:52:01Z | HOLD-active |
| output/playwright/owner-corrections/2026-10-26T01-55-10-410Z | 210 | 856081528 | 2026-10-26 02:55:39Z | KEEP-unknown |
| output/playwright/owner-corrections/2026-10-26T00-49-19-092Z | 215 | 718446677 | 2026-10-26 01:15:03Z | KEEP-unknown |
| output/playwright/final-cascade-2026-10-26/four-case-unfaded | 3965 | 711329972 | 2026-10-27 04:48:33Z | KEEP-unknown |
| output/playwright/owner-corrections/56-ratio-solid-r2 | 245 | 579150488 | 2026-10-26 12:11:23Z | KEEP-unknown |
| output/playwright/owner-corrections/56-ratio-solid-r4 | 245 | 577888835 | 2026-10-26 12:47:50Z | KEEP-unknown |
| output/playwright/page-cinematography-2026-10-28/production-07 | 297 | 566131475 | 2026-10-28 06:24:06Z | KEEP-unknown |
| output/playwright/page-cinematography-2026-10-28/production-05 | 156 | 542760781 | 2026-10-28 05:55:00Z | KEEP-unknown |
| output/playwright/owner-corrections/54-planet-orbits-r4 | 232 | 445727641 | 2026-10-26 09:12:55Z | KEEP-unknown |
| output/playwright/cascade-control-refinement-2026-10-30-full-r2/1440-full | 1405 | 367937962 | 2026-10-30 21:02:34Z | HOLD-active |
| output/playwright/cascade-control-refinement-2026-10-30-full-r2/1440-lite | 1405 | 367005615 | 2026-10-30 21:05:06Z | HOLD-active |
| output/playwright/page-cinematography-2026-10-28/production-06 | 98 | 334546329 | 2026-10-28 06:09:16Z | KEEP-unknown |
| output/playwright/jg040-corrections-narrow2 | 317 | 272135844 | 2026-11-04 06:58:17Z | HOLD-active |
| output/playwright/page-cinematography-2026-10-28/production-03 | 7 | 272037866 | 2026-10-28 05:27:09Z | KEEP-unknown |
| output/playwright/page-cinematography/73-narrow-lite-recovery | 317 | 266180375 | 2026-10-31 04:41:45Z | PINNED |
| output/playwright/final-cascade-2026-10-26/iteration3 | 926 | 246186083 | 2026-10-27 04:36:08Z | KEEP-unknown |
| output/playwright/final-cascade-2026-10-26/axis0-trial | 926 | 245587478 | 2026-10-27 04:39:37Z | KEEP-unknown |

## Method

- Run units: children of output/playwright/ (the five largest areas expanded run-level: owner-corrections, page-cinematography, page-cinematography-2026-10-28, final-cascade-2026-10-26, cascade-control-refinement-2026-10-30-full-r2), children of output/high-low-feature-proof/, and every other child of output/ including loose files at output root. The plan table pins/holds for jg040-corrections-narrow2, owner-visual-preview-2026-10-28 and jg040-stage3-20261104 are applied at their run level.
- Measurement: Get-ChildItem -Recurse -File -Force per run; logical bytes = sum of Length; newest = max LastWriteTimeUtc. No file contents read; reparse-point traversal excluded (default).
- Git status per run: git -C <repo> ls-files -- <path> (tracked file count) and git -C <repo> check-ignore -q -- <path>.
- Reference search per run name, exact command template: rg -l --fixed-strings -- "<runName>" <repo>/docs <repo>/project <repo>/scripts <repo>/src <repo>/remotion <repo>/*.md <repo>/*.json <repo>/*.ts <repo>/*.mjs
  - rg respects .gitignore by default, approximating tracked scopes; hidden files and ignored paths are not searched.
  - A grep miss is evidence only for these scopes. Fixed-strings matching can false-positive on shared name prefixes (e.g. jg040-corrections-narrow matches inside jg040-corrections-narrow2 mentions); this inflates reference_count in the safe direction.
- Classification order: PINNED (plan s4 seed + evidence 70/72/73/74 cited sets + JG-039 homepage proof + JG-040 release/review sets) > plan-table holds > high-low-feature-proof held-area inheritance > newest mtime >= 2026-10-29Z HOLD-active > name pattern (jg040*, torque-tracker*, studiomark*, logo*, live-2026-11-04*, stage3*, cascade*, owner*) HOLD-owner-review > inactive < 2026-10-22T04:00Z with refs ARCHIVE-candidate > inactive, 0 refs, untracked+ignored DELETE-candidate > else KEEP-unknown.

## Ambiguities for parent decision

- Evidence numbering: 70 and 74 are packets under project/work/evidence/torque-wrench-rebuild/; 72 and 73 are docs under docs/torque-wrench-rebuild/. Pins were materialized from the plan s4 seed text plus rg -o extraction of cited output/ paths from those four sources plus the JG-039/JG-040 records.
- output/playwright/torque-camera-hud-2026-10-21/: the plan pins only its after/ subdir; the run-level row is marked PINNED conservatively (never-delete direction).
- output/high-low-feature-proof/: task text calls the area pinned; plan s4 says it remains held. Subruns cited by evidence 70 are PINNED; remaining subruns inherit HOLD-owner-review.
- output/playwright/torque-camera-hud-jg040-rebaseline/: pinned as a JG-040 review set via stage3 record citation (seed expansion), not an explicit plan line item.
- reference_count counts any scope file containing the run name as a substring; mention vs citation is not distinguished.
- Runs classified HOLD-active purely by mtime may simply be concurrent-lane writers (HUD/logo/showreel own other trees, but output/ writes from parallel sessions are possible); treat deletes as unsafe without a writer check regardless of class.
- Evidence 70 cites output/high-low-feature-proof/geometry/analyze-geometry.mjs, but no geometry/ child exists under output/high-low-feature-proof/ on disk (children: 73-same-program, 73-terminal-final, control-centroid-2026-10-30, control-refinement-2026-10-30). The cited file is not present, so no geometry row exists in the manifest; the citation itself is now recorded here for the parent to resolve.
- DELETE-candidate set is empty: every run inactive before 2026-10-22T04:00Z has inbound references in the searched scopes. Per plan s4/B3, a correct empty deletion set is acceptable.
