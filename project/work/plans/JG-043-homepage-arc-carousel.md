# JG-043 — Homepage arc carousel

> **Coordination note 2026-11-08 (from a parallel ZCode session) — read before committing JG-043:**
> 1. `origin/main` and `origin/showreel-v3` moved to `306b2880`; this worktree's `torque-wrench/rebuild` is still at `a77f549b`. The new commits touch files this lane also has dirty: `src/home/HomePage.tsx` (adds `<ShowreelSection />` under the hero + one import), `TODO.md`, `project/context/current-status-2026-11-05.md`. Commit or stash first, then merge `origin/main` (expected: small, non-overlapping hunks).
> 2. Owner ruling 2026-11-08: the StudioMark showcase "Precision Revealed" is **rejected**. `/home/stacks/renderings/06.webp` (1920×1080, labelled "Showreel frame, planetary stages title") appears to be a frame from it — the `ProjectStack.tsx` source comment says one frame comes from the showcase film. Replace it with a showreel v3 frame and relabel before committing.
> 3. Do not commit the untracked showcase files in this worktree (`public/video/studiomark-showcase-precision-revealed.*`, `remotion/showcase*`, `scripts/showcase/`, showcase plan/inbox/evidence).

Owner request, 2026-11-07: replace each landing-page project image stack with the arc card carousel identified as `kedhareswer/arc-card-carousel` on 21st.dev, expand every project's image collection, update current documentation, and prepare a next-session handoff. The supplied screenshot is the visual reference. Keep project links, mobile access, keyboard operation, reduced motion, and the existing portfolio content rules intact.

## Scope and acceptance

- Four project sections have an accessible, responsive arc gallery with additional relevant imagery or clearly identified placeholders.
- Verify the production build and focused homepage tests, plus browser interaction at desktop and narrow widths and with reduced motion. Record actual results and limitations separately from visual approval.
- Preserve unrelated work in the shared checkout. This local change does not by itself update the public deployment.
- Update the current homepage/status navigation and leave a handoff with a ready-to-paste continuation prompt.

## Status

Implemented locally; focused browser checks pass. Full homepage verifier timed out after 13 passing cases, so complete that run and record its outcome. Owner visual review and any publication remain open. See [the dated homepage record](../../../docs/homepage-arc-carousel-2026-11-07.md).
