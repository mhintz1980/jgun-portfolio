# Current status — updated 2026-11-13

Concise record maintained under JG-041 B1. It points to evidence instead of copying test rosters. Older dated banners: [status history](status-history-2026-11-05.md). Queue: [TODO.md](../../TODO.md). Registry: [INDEX.md](../work/INDEX.md). Owner policy: [evolving portfolio and visual review](owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md) (publish useful work in progress, HUD provisional, keep models central).

## Release identity (what is deployed)

- **Latest release:** owner-approved JG-042 WIP candidate, verified 2026-11-07. Cloudflare Pages project jgun-portfolio (direct upload), production deployment `00413abd-482f-4a8b-8365-6ab2da8fbe5a`, built from source `8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a` on origin/torque-wrench/rebuild. Rollback deployment `e796fe69-b95b-4de9-93b1-cdfd2844b343`. Evidence: [release record](../work/evidence/JG-042-portfolio-performance/release-2026-11-06/README.md). This publishes the complete reviewed branch candidate, including earlier HUD/tracker, maintenance and merged media work; it does not complete deferred performance, showreel or visual work.
- **Public pages served:** /home/ (JG-039 homepage, deployment 2b33b2f4 from 876f11fc on 2026-11-03; [release evidence](../work/evidence/JG-039-homepage/release-2026-11-03.md)), /torque-wrench/ (Stage 3 HUD), /quiet-machine/. The root forwards to /home/; the private armament page keeps its visibility policy and redactions.
- **Release history:** the prior JG-040 Stage 3 release was `e796fe69` / source `f83f4ba3` ([record](../work/evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md)). The tracker and other commits through `8d8f045b` are now in the reviewed WIP release. Later documentation/evidence closeout commits do not change its deployed source. Deferred phone framing and provisional HUD remain open. The showreel direction is "The Line" (owner-confirmed 2026-11-13; see the Showreel lane below); the "The Thread" homepage section committed on `main` 2026-11-08 is off-direction, undeployed, and will be replaced by the accepted "The Line" cut.

## Active lanes

| Lane | State | Pointers |
|---|---|---|
| JG-040 HUD follow-ups | Stage 3 released. 2026-11-05: HUD copy deck approved and facts confirmed ([rulings](../../docs/torque-wrench-rebuild/00-owner-rulings.md)). Narrow/phone camera framing during the Inspection cascade (about .806-.825) is a deferred follow-up; try a small camera-angle shift first. | [plan](../work/plans/JG-040-hud-d-inline.md), [tracker captures 2026-11-05](../work/evidence/JG-040-hud-d-inline/torque-tracker-2026-11-05/v2/) (untracked in the shared checkout at the time of writing) |
| JG-041 cleanup | B0-B3 first pass on codex/cleanup-2026-11-05; B1 (this documentation cleanup) executed. B4 legacy-root retirement is a separate later milestone. | [plan](../work/plans/JG-041-maintenance-cleanup.md), [evidence](../work/evidence/JG-041-maintenance-cleanup/README.md) |
| studiomark logo / bumper | Work in the shared checkout: studiomark-logo scene edits and bumper video concepts (Storm Ignition and Low Puddle Crane-Up selected, two others parked); not part of any release. | BUMPER-CONCEPTS-2026-11-05.md under work/evidence/studiomark-logo/ (untracked in the shared checkout) |
| Showreel | **2026-11-13 owner confirmation: the showreel direction is "The Line"** — the rework slices owner-approved 2026-11-09 on `torque-wrench/rebuild` (logo ident `0de294ef`, slice 1 `e3c05882`, slice 2 `f2b5ae44`; approvals in that branch's `docs/HANDOFF-showreel-v3-2026-11-09b.md`/`-09c.md`). "The Thread" is not the direction; its homepage section (`src/home/ShowreelSection.tsx`, committed on `main` 2026-11-08, undeployed) will be replaced by the accepted "The Line" cut. Next: armament act with real 3D models (needs the local CAD prep lane). The StudioMark showcase "Precision Revealed" remains **rejected** — never commit or reuse it. | [TODO JG-041 (showreel)](../../TODO.md#active), [owner ruling](../../docs/torque-wrench-rebuild/00-owner-rulings.md), [remotion/README.md](../../remotion/README.md) |

## Open gates

- Owner visual acceptance of the Stage 3 HUD (release approval is recorded; final visual acceptance is not).
- Evidence 73 FAIL/deferred results (strict framing/HUD gates, alias residuals, opening semantic proof, independent final review) stay open follow-ups, not publication blockers under the owner policy.
- JG-038 gates G0-G9, and the unchecked JG-032 to JG-037 owner reviews, remain as listed in TODO.md.
- Pending owner confirmation: the FEA drafting-note idea (ruling of 2026-11-05) is not to be implemented until Mark confirms.

## Next actions

1. Owner review of the Stage 3 live HUD; then decide on the deferred phone-framing follow-up.
2. Continue visual concepts with Mark, models central; show high-speed readability issues first.
3. Finish JG-041 B1 review, then B2 (tooling reproducibility) and B3 (storage manifests) per the plan; no deployment from the cleanup branch.
4. Update this file and the INDEX row with each future release instead of adding banners to TODO.md or project/README.md.
