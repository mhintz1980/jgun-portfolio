# Torque track — shared-shell readiness acknowledgement

Recorded 2026-10-11 (America/New_York). Work: JG-038, `torque-wrench/rebuild`, `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.

**Acknowledged:** This session read the shell owner's `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/docs/quiet-machine-shell-readiness-note-2026-10-11.md`, supplied directly by the owner. This is the torque-session acknowledgement requested in that note's §9 item 4. It acknowledges receipt and the contract; it does not close torque Stage 0 or certify runtime readiness.

## Delivered contract reported by the shell owner

The note identifies Quiet Machine branch `quiet-machine/integration`, HEAD `97e2d806`, and local unpushed commits for shared page registry, fade/navigation, HTML topology, and transition verification. It reports shared source files clean while unrelated V16 scene edits remain dirty.

- `src/shared/pages.ts`: `PageId`, `TierParam`, `PageEntry`, `PAGES`, `pageHref`, `readTierParam`, `resolveEntryTier`, redirects.
- `src/shared/pageFade.ts`: `installPageFade` returning uninstall, `fadeNavigate`, `releaseFade`, `releaseFadeWhen`, `prefetchPage`, and test-injected `FadeEnv`.
- `src/shared/PageNav.tsx`: `PageLink` and `PageNav`, using hard navigation with `data-fade` links.
- Registry-driven MPA inputs and byte-pinned HTML head shell copies. Torque must consume the delivered owner contract rather than create a separate shell.

The reported contract includes a document-lifetime fade listener installation, an uninstall for shorter lifetimes, bfcache recovery, reduced-motion immediate navigation, and poster/failure readiness release. `releaseFadeWhen` has no cancellation handle; its bounded polling needs consideration in the torque lifecycle checks. Root `jgun` currently has `fadeIn: false`, so fade-out to `/` does not imply fade-in parity there.

## Remaining delivery and verification

| Item | Owner / next action | State |
| --- | --- | --- |
| Shared poster interface | Shell owner delivers the generic poster primitive, beat/chapter poster-map type with alt/provenance, and zero-canvas/zero-CAD test helper. Torque supplies its final high-quality offline art later. | Not delivered |
| Private registry support | Shell owner adds private/hidden semantics with tested exclusion from public `PageNav`, plus torque `PageId` / `PAGES` row and integration contract. Coordinate activation of its HTML input with the torque integrator's Stage 1 entry delivery so the shared build is not broken by a missing input. | Not delivered |
| Delivery to torque worktree | Provide exact files/commit set and a compatible integration handoff. This session has not merged, cherry-picked, copied, or altered the Quiet Machine worktree. | Pending |
| Fresh readiness run | Typecheck, build, and transition verifier against fresh preview on a precisely named tree; disclose/exclude V16 edits without discarding them. Coordinate resources first. | Pending |
| Torque acknowledgement | This document acknowledges the supplied note. Shell owner can link it as receipt evidence. | Complete |

The note reports 177 passing shared tests and a historical 7/7 transition run at `275a4c0a`, with shell unchanged since. These results were not executed or independently verified by this torque session. They do not certify the new private-page or poster contracts.

## Authority and boundaries

Owner plan acceptance and implementation authorization remain recorded and require no repeat approval. Stage 0 remains open; product implementation waits for demonstrated shared-shell readiness. Numerical budgets and current resource coordination remain unresolved. All G0–G9, effects, visual, motion, and publication gates remain separate.

No product source changes, tests, builds, servers, captures, GPU execution, Git integration/delivery, or writes outside the torque worktree were performed for this acknowledgement. The protected portfolio checkout and existing dirty/untracked work remain untouched.
