# Handoff — implement the Design OS HUD direction trial

Date: 2026-10-31. Intended workspace: **`C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`**. This is the torque-wrench checkout, not the sibling `jgun-portfolio` checkout.

## Next action

Execute the bounded concept trial in [the v2 plan](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/inbox/design-os-hud-trial-plan-2026-10-31.md). First re-read current owner direction and check live Git/server/build state; then identify the capture baseline and offer the optional direction question while proceeding with independent setup. Do not start by repairing old cinematic failures or changing the production HUD.

## What Mark requested and what is done

Mark requested: plan the proposed Design OS HUD trial, have **Opus 5.5 at High effort** review and critique it, then prepare this next-session handoff. Planning/review are complete; execution is the next-session task. No Design OS package was installed or initialized, no trial concept was built, and Mark has not chosen a replacement HUD.

- [Source-linked repository review](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/inbox/design-os-review-2026-10-31.md).
- [Canonical trial plan v2](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/inbox/design-os-hud-trial-plan-2026-10-31.md), including scope, checkboxes, output tiers and stop conditions.
- [Capture reconnaissance](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/design-os-hud-trial-2026-10-31/00-capture-inputs.md).
- [Original Opus 5.5 High critique](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/design-os-hud-trial-2026-10-31/01-opus-5.5-high-plan-review.md): **revise before execution**.
- [Parent dispositions](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/design-os-hud-trial-2026-10-31/02-review-dispositions.md): v2 addresses motion method, anchor fairness, workload and the remaining findings. There is no fresh Opus approval of v2.

## Authority and live-state checkpoint

Read `AGENTS.md`, the newest `TODO.md` direction, `project/README.md`, the measured animation specification §§5–5.4, and `project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md`. The policy calls for quieter, model-first visual choices. It permits WIP publication and separates that from technical/final visual completion. This trial does not need another publication or an hours-long mechanical verifier roster.

Planning checkpoint: branch `torque-wrench/rebuild`, HEAD `ccb215b2cbd9f4206691d4c41d1c5c942c251a37`, **29 modified tracked paths and nothing staged**, plus substantial existing untracked material. Those counts exclude later document additions and may drift. Existing source and documentation changes belong to prior/concurrent work; preserve them. No commit, push or deployment was performed in this planning turn. Recheck rather than trusting this snapshot.

The plan stays in the inbox as a research/concept trial. It does not assign a new JG ID or modify the canonical queue. Register production implementation through the existing work protocol after Mark chooses a direction and agrees scope.

## Important implementation traps

1. **Build identity:** publication evidence 74 is `ccb215b2` plus dirty continuation, not clean HEAD. Its fingerprint and algorithm are in capture-inputs. Check available dist before using it; if different, name a new baseline. A rebuild is not required merely for concepts.
2. **Existing screenshots are not clean:** UI is flattened into the verified .418/.735/.940 images. Use layout-preserving browser-only overlay suppression with unchanged narrative/camera/canvas observations. Do not inpaint or stack another HUD over baked UI.
3. **Motion needs explicit input assumptions:** the plan defines representative scroll playback, a 24 fps sequence and timing preflight. Capture anchors for attached labels, or disclose the limited global-composition comparison. A still does not prove moving callouts or production interaction.
4. **External tool isolation:** source is pinned to `369b04155c7e1b8503b8a0ef676ce168d81e5a2e`; package candidate is `ease-design@0.6.2`, Node >=20. The README's `@easestart/design-os` npm endpoint returned 404 during the review. Use help/schema rather than guessing. Run package commands/prototypes outside the repo, with process-scoped `EASE_DESIGN_HOME` and input artifacts there too. Keep the 30-minute/two-failure stop rule.
5. **Outputs and review:** raw media goes to ignored `output/playwright/design-os-hud-trial-2026-10-31/`; capture helpers can use the new trial-owned scratch subtree. Durable text/manifests and one small sheet go to this evidence folder. Never commit scratch or raw media. Use the plan's minimum/deferred tiers and mark partial work honestly.

## Suggested skills

- `context-mode` for large reports and source processing.
- Repository-local `.agents/skills/r3f-cad-cinematography/SKILL.md` for HUD/scene relationships; retain the owner's proportional verification policy.
- `webgl-telemetry-verifier` for capture state/provenance; `codebase-memory` before structural exploration of runtime/projection interfaces.
- `computer-use` or `playwright`, selected for the actual available browser workflow; read that skill before use. Existing capture script declarations are linked in capture-inputs.
- Upstream Design OS designer/concepts and the narrowly selected craft/critique material, under project rules. Avoid wholesale routing installation into this repository.

Delegate disjoint concept work if useful. The concept critic must have fresh context and actual rendered output. The original requested Opus plan review is already done; it is not evidence that the future rendered concepts have been reviewed.

## Verification and stopping point

This planning turn verified document links, capture-file availability, ignored media location and live Git state; it did not run app tests, build, browser capture or installers. Existing source tests/deployment results remain documentary context, not new proof.

Next session should deliver the reviewable minimum packet and separate HUD/tool recommendations. Finish the comparable work before asking Mark to choose. Stop at **HUD direction awaiting Mark**; do not infer production integration, acceptance or broad toolkit adoption. If capture/setup blocks part of the minimum, deliver the useful partial packet and exact missing work.

## Ready-to-paste receiving prompt

In `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`, read `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\evidence\design-os-hud-trial-2026-10-31\HANDOFF.md` and execute its linked v2 HUD trial plan. Recheck live state, preserve existing work, follow the Opus review dispositions, and deliver the comparable concept packet before asking me to choose. Production HUD integration, deployment and broad tool adoption remain outside this trial.
