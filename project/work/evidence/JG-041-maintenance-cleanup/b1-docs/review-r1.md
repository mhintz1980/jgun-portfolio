# JG-041 B1 — Independent adversarial review R1 (zai/GLM seat)

**Verdict: SHIP** — no blocking findings. Four non-blocking observations below.

Reviewer R1 ran on GLM-5.3 (zai seat), independent of the Anthropic implementer. Reviewed the
actual unstaged worktree diff on `codex/cleanup-2026-11-05` (baseline `0b284226`), not the summary.

## Findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | Non-blocking | The JG-040 TODO task line is not byte-identical to HEAD: a 174-char delimited note `*(History note 2026-11-05: ...original text preserved.)*` was inserted mid-line after `Committed \`009aa4ae\``. Stripping the note reproduces the HEAD line byte-for-byte (node check: `original text exactly preserved: true`). This is the "explicitly dated appended note" allowance applied inline; zero content lost. | TODO.md L15; compare `git show HEAD:TODO.md` L55 |
| 2 | Non-blocking | One moved banner (2026-10-28 owner visual handoff) links an absolute Temp-folder file outside the repo. It resolves today, existed at HEAD, and was moved verbatim — pre-existing fragility, not B1-introduced. | status-history T-entries; link checker (resolves, 0 broken) |
| 3 | Non-blocking | INDEX JG-040 row does not name `235f6fc4`/`0b284226` (TODO says "post-release tracker commits ... no later release record"; current-status names both hashes). Consistent across records; no inflation. | project/work/INDEX.md JG-040 row; TODO.md L17; current-status "Later, not released" |
| 4 | Non-blocking | Banner math is 31+24 only because each source kept exactly one undated structural banner (TODO "Canonical approved task queue" L7; README "Rule" L6). History holds exactly 55 dated banners. Worth stating explicitly when the next batch touches these files. | counts below; TODO.md L7; project/README.md L6 |

## Re-run checks

### 1. Losslessness (scripted vs `git show HEAD:TODO.md` / `HEAD:project/README.md`)

- Task lines: HEAD TODO 36, after TODO 37 (+1 = new JG-041 entry). 35/36 verbatim; the 36th is
  the JG-040 line covered by finding 1 (original exactly recoverable). README: 0 task lines.
  **No task-line content vanished.** After-count is HEAD+1, explained by the JG-041 intake entry.
- Banners: HEAD TODO 32 `> **` paragraphs = 31 dated moved + 1 undated canonical banner kept;
  HEAD README 25 = 24 dated moved + 1 undated Rule banner kept. History record: exactly 55
  banner paragraphs (`### T-01..T-31`, `### R-01..R-24`). Every one of the 55 matches the HEAD
  text after neutralizing only link targets (`](...)` to placeholder, `../` collapsed) — i.e.
  re-relativization only, no rewording detected anywhere.
- Provenance spot-checks vs HEAD: T-01→TODO L2, T-02→L3, T-03→L5; R-01→README L2, R-02→L3,
  R-24→L37 — all correct. History header discloses line numbers refer to the pre-B1 worktree
  (baseline + intake edit); intake did not shift the banner region, so they hold at HEAD too.
- JG-035 stranded unchecked task: HEAD L232 (after Operating Constraints) → after L134 (end of
  Active), verbatim, still unchecked. Matches the claimed move.

### 2. Link integrity (scripted over ALL links, stronger than the 25-link minimum)

- Counts: TODO.md 116, project/README.md 34, INDEX.md 138, status-history 103, current-status 12
  → **403 links, 403 resolved, 0 broken** (filesystem existence + heading-anchor validation).
  Implementer counts match exactly.
- History-file links re-relativized from `project/context/` (e.g. `../work/evidence/...`,
  `owner-specs/...`) all resolve; TODO/README pointers to the two new records resolve.
- Anchor audit: repo-wide, only `TODO.md#active` and `TODO.md#queued` are referenced
  (37 refs / 12 files); both headings kept (after L11 / L136).
- `torque-tracker-2026-11-05/v2/` resolves in this worktree (tracked here); the current-status
  caveat "untracked in the shared checkout" is accurate for that checkout and disclosed.

### 3. Factual reconciliation (read release-2026-11-04.md + 00-owner-rulings 2026-11-03/04/05)

| Claim | INDEX | TODO | current-status | Primary source | Match |
|---|---|---|---|---|---|
| Stage 1 accepted 2026-11-03 | yes | yes | — | rulings L264 | yes |
| Stage 2 executed 2026-11-03, NOT accepted as a whole | yes (early chrome, rail rows 04/05, FOS +50% thickness, leader rejected) | yes (verbatim ruling detail) | — | rulings L308–334 (explicit ".56 vs .62 studyVisible", rows 04/05, 0.6→0.9rem, leader "remove") | yes |
| Stage 3 released 2026-11-04: e796fe69 / source f83f4ba3 / rollback 81b234d0 | yes | yes | yes (full hashes) | release evidence identity table | yes |
| Owner visual acceptance of Stage 3 OPEN | yes | yes | yes | evidence "does not relabel ..."; parent-accepted call | yes |
| 2026-11-05 phone-framing follow-up deferred, unchecked | yes ("framing deferred") | yes (`- [ ] ... Deferred; not started`) | yes | commit 0b284226; rulings L339 section | yes |
| 235f6fc4 / 0b284226 unreleased | not named | "post-release tracker commits ... no later release record" | names both | no release record after e796fe69 | yes |
| JG-039 addendum "homepage HTML identical after Stage 3 release" | — | — | — | release evidence 20/20 HTML identity + preserved boundaries | yes |

No manufactured acceptance or status inflation found; every open item stays open.

### 4. JG-041 registration

TODO L13 and the INDEX JG-041 row both exist and accurately state: B0–B3 first pass, branch
`codex/cleanup-2026-11-05`, pushed baseline `0b284226`, B2/B3 scope, B4 deferred as its own
milestone, deletions only after independent cross-provider review, B1 executed with report link
and pending parent review. Registration lives in the unstaged diff (HEAD has no JG-041); that is
the pre-B1 intake edit disclosed in the history header, not a B1 defect.

### 5. Scope discipline

`git status --porcelain`: docs lane = TODO.md, project/README.md, project/work/INDEX.md (M) +
untracked context/status records and the JG-041 evidence dir (b1-docs: report.md, restructure.py).
package.json / package-lock.json / knip.json / scripts/* = parallel B2 lane, ignored per brief.
Untracked `project/work/plans/JG-041-maintenance-cleanup.md` is the pre-B1 intake plan referenced
by the TODO/INDEX links; it resolves. No out-of-scope docs writes found.

### 6. Parent-accepted judgment calls — confirmed recorded as accepted, not re-flagged

Stage 3 owner visual acceptance OPEN; long per-task sub-bullets retained in TODO; showreel/logo
lane status artifact-derived with the untracked-checkout caveat.

## Conclusion

The banner move is provably reword-free, the single modified task line preserves its original
text inside a delimited dated note, all 403 links resolve, the JG-040 status story matches the
release evidence and owner rulings with no acceptance inflation, JG-041 registration is accurate,
and the diff stays inside the declared lane. **SHIP.**

— R1 (GLM-5.3, zai seat), 2026-11-05

