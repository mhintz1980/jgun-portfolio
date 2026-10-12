# JG-038 — QM window closure acknowledged, PageNav synced, public URL claims removed

2026-10-12 (America/New_York). Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`. Trigger: owner relayed the Quiet Machine session's window-closure message.

## Window closure

Quiet Machine closed the section 15 coordination window in its note's section 16, commit `2bef1960` on `quiet-machine/integration`. Read-only review of `69ac760b` confirmed the section 10 recipe; term 4 was closed **without merging** `69ac760b` into the QM branch, by owner decision, because torque Stage 1 is a zero-Canvas placeholder with G0-G9 open and the QM branch's verifiers are written for two pages. The merge happens at the integration point that lands both tracks. Standing consequence recorded by QM: the registry differs between branches (torque row active here, inactive there) and a later window starts from the torque copy of `pages.ts`.

## PageNav sync from QM7 (commit `1f92aa3a`)

QM s16 consequence 2: the torque page ran the older nav; sync QM7 before Stage 2 navigation work. Scope decision: **file-only** — `src/shared/PageNav.tsx` taken from `1f92aa3a` (landed here as `85ca812a`). The full commit and any merge of it would have dragged QM scene files, QM evidence, and post-window QM state onto this branch ahead of the agreed joint landing. The three shared window files (`pages.ts`, `pages.test.ts`, `pageTopology.test.ts`) were intentionally **not** synced: their diff against QM7 is exactly this branch's activation, which stands per s16 consequence 1.

The new props (`label`, `numbered`, `currentAsText`) are opt-in with backward-compatible defaults; `TorqueWrenchPage` usage is unchanged. Adopting numbered rows / current-as-text on the torque page is Stage 2 work under a future window if it touches the pinned files.

## Public URL claims removed from the private entry

QM s16 consequence 3 flagged that `torque-wrench/index.html` declared `https://studiomark.dev/torque-wrench/` via `canonical` and `og:url` on a noindex private page, and delegated the decision to this track via the owner relay ("your call whether to change them"). Decision: **remove both lines**. `canonical` plus `noindex` is a contradictory crawler signal, `og:url` repeated the same public claim, and the public URL is not authorized to exist yet. This deviates from the activation packet's metadata proposal (recorded in 05-stage1-integration/final-review.md); the fade sub-block, robots meta, and module entry are untouched and no test or verifier pins these lines.

Residual, owner call later: `og:title`/`og:description`/`twitter:*` remain, so a scraper hitting the URL could still build a basic link preview. Full preview suppression means dropping those tags too; not done now to keep the change to exactly what was flagged.

## Verification

- `npx tsc --noEmit` exit 0 (with QM7 PageNav in place).
- `npx vitest run src/shared src/scene/torque-wrench`: 12 files, 256/256 pass (08:23 UTC).
- `npx vitest run src/shared` after the HTML edit: 8 files, 240/240 pass (08:24 UTC) — fade-sub-block pin, noindex pin, and three-entry list all hold.

## Boundaries

No push or other Git delivery. No further edits to the four window files without a new named window; QM owns the next window start point per its note. Stage 2 has not begun.
