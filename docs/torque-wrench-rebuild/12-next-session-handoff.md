# Torque wrench rebuild — next-session handoff, 2026-10-11

> Historical planning checkpoint; superseded by [HANDOFF-2026-10-14-parallel-functional.md](HANDOFF-2026-10-14-parallel-functional.md). The plan was written/authorized and implementation proceeded. Do not stop for the obsolete approval action below.

## Workspace

- Work in `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.
- Branch: `torque-wrench/rebuild`.
- HEAD at handoff: `1b414948cafbf635ff3bb56c367c8a4651f30a7f`.
- Do not edit or switch the protected main checkout at `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`.

## Current phase

Design and structure are accepted. Planning is approved but the implementation plan artifact has not yet been written.

Exact next action: create `docs/torque-wrench-rebuild/13-implementation-plan.md` from the accepted design and structure, then stop for owner approval before any implementation work.

## Read first

1. [Owner rulings](00-owner-rulings.md)
2. [Motion standard](smooth-scrolling.md)
3. [Design](09-design.md)
4. [Design review](09-design-review.md)
5. [Structure](10-structure.md)
6. [Structure review](10-structure-review.md)
7. [Enclosure agent brief](11-enclosure-agent-brief.md), only if coordinating with the enclosure agent
8. Oryzo/Lusion teardown: `C:/vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md`

## What is already decided

- The private page remains `/torque-wrench/`.
- Existing live page stays untouched until replacement acceptance and authorized publication.
- The opening recovery baseline is October 2, with October 1 shatter and September 27 camera rake.
- The design and structure are accepted.
- Planning is approved; implementation is still gated.
- The subtle layered background is an explicit owner requirement, not an implied post-processing effect.
- Poster/reduced-motion art must come from high-quality offline renders, not runtime stills.
- The Oryzo findings are design input and teardown-derived candidates, not locked implementation constants.
- REA is available in the cloned repo used for the Oryzo teardown; the enclosure agent should review its tools and use cases, but that does not expand this track’s scope.

## Next-session work outline

1. Write the implementation plan artifact at `docs/torque-wrench-rebuild/13-implementation-plan.md`.
2. Keep the plan scoped to the accepted design and structure; do not reopen settled decisions.
3. Include the shared-shell dependency, CAD/WebGL import gate, page-local runtime, beat data, director registry, background system, poster path, and verification gates.
4. Preserve the existing dirty and untracked evidence.
5. Stop after the plan artifact for owner approval.

## Boundaries

- No product code changes yet.
- No builds, captures, servers, or GPU work unless separately authorized.
- No commit, push, PR, deploy, or publish.
- Ports 4173 and 5199 are free as of this handoff.

## Ready-to-paste prompt

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild. Read docs/torque-wrench-rebuild/00-owner-rulings.md, smooth-scrolling.md, 09-design.md, 09-design-review.md, 10-structure.md, and 10-structure-review.md. Design and structure are accepted; planning is approved but the implementation plan artifact is not yet written. Create docs/torque-wrench-rebuild/13-implementation-plan.md from the accepted design and structure, preserving the private /torque-wrench/ page goal, shared-shell dependency, page-local runtime, beat data, explicit layered background, high-quality offline posters, and all verification gates. Do not modify product code, run builds/captures/servers, or touch the protected main checkout. Stop after the plan artifact for owner approval.
```
