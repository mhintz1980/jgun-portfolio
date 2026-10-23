# test-audit: src/scene/rl300/preview.test.ts (2026-10-11)

**39 judged · 3 cut · 6 rewrite · 30 kept** (2 of the kept are `documented-intent`, confirm-before-acting). Report only: no test was touched. Pass one (`audit.mjs`) flagged 1 candidate (`:213`); the other 8 findings are from the judgment sweep. Findings log: `findings.jsonl`.

## Cut (3 tests; 703 -> 700)
| Line | Test | Why |
|---|---|---|
| 648 | pins the length knob and the end-card threshold | Asserts constants equal their own literals; fails whenever you move the (unlocked) scroll length. `END_CARD_AT` is already pinned by behaviour at :670-671. |
| 578 | initialStudyMode keeps normal motion on WebGL unless quality=poster | Duplicate: tier table is `src/shared/pages.test.ts:159-175`, delegation is :583, `u` is :574/:614. |
| 213 | returns deeply equal flow state for repeated progress samples | Tautology (pass one): `f(u)` equals `f(u)`; cannot catch a shared mutable return. |

## Rewrite (6; none adds a test)
| Line | Test | Fix |
|---|---|---|
| 85 | repaints shell roles... | Line 94 swallowed an `expect` into a `//` comment: it never runs. Covered by :136. Delete the remnant. |
| 483 | authors the acoustic encounter... | Block :532-540 tests a local copy of the shader's window literals; build it from `WINDOWS.chevronResponse*` or drop the block. |
| 583 | initialStudyMode takes its tier from resolveEntryTier... | Drop the three restating expects :591-593. |
| 601 | hands the fade release to the shared runtime... | Source-text formatting regex :605 breaks on a rename; keep :603-604 only. |
| 682 | prefetches the torque gun page once... | Two implementation-shape regexes :687-688; drop them, keep the count and `pageHref` pin. |
| 96 | keeps reservoir occurrences... | Eager (also asserts insulation blue and intake-root drop). Low value; leave if you prefer. |

## Documented intent (kept, confirm)
- `:153` count pins (7/18/1) fail on any new ruled part; the arithmetic is commented.
- `:607` source pins guard the QM4-fix context-loss bug.

## Not findings
- `:62` (8,000 expects over 1,001 samples x 2) and `:404`, `:346`, `:280` are long and eager but each follows one owner ruling; splitting them would add tests, so they stay.
- `:346` and `:404` carry a copied smoothness loop (15 deg, radius .05); a shared helper would shrink the file but not remove a test.

## Applying (opt-in, not done)
Cuts delete 3 tests and the rewrites are line deletions; expected `npm test` 700 passed. Cheapest safe order: the three cuts, then the line-94 remnant and the :591-593 and :605 deletions.

## Applied (owner approved 2026-10-11)
All 3 cuts and 5 of 6 rewrites (`:96` left as is). `npm test`: 700 passed + `camera.test.ts` K5 timed out at 5 s under full-suite load (untouched file; passes alone, 53/53 with `preview.test.ts`). tsc 0. Build, check:station2, U.4 and verify-jg033-preview not re-run: no runtime source changed.
