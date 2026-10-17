# R1–R5 execution plan — 2026-10-16

Status: bounded implementation and verification complete; independent reviewer SHIP. Owner visual approval remains open. Owner explicitly authorized a scoped commit on2026-10-17; push and deployment remain unauthorized. Owner selected Sol/high workers and Astra/medium reviewer; optional GLM-5.3/max worker used for fill follow-up, which hit provider429 after a partial edit inspected/completed by parent.

## Authority and preflight

- Owner requests implementation of R1–R5 plus Studio PMREM in three disjoint write lanes, hardware-GL A/B telemetry and pixel comparison, then independent review.
- Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.
- Verified branch: `torque-wrench/rebuild`.
- Verified HEAD: `1d66ff2b91e8a55d21ea1afb401a3ad995553f4a`.
- Authoritative review: `docs/webgl-review-2026-10-16/webgl-architecture-review-2026-10-16.md`.
- Historical baseline: `docs/webgl-review-2026-10-16/evidence/runtime-telemetry-probe.json` and its seven PNGs. Do not overwrite them.
- All five authorized application source paths are clean at preflight. Protected tracked asset/document diff is empty.
- Existing dirty/untracked files include GATES.md, TODO.md, agent-skills.md, REA handoffs/plan, the review folder, and extensive project evidence. Preserve all existing files, including `.scratch/`.
- No commit, push, or deployment without explicit owner approval after verification.

## Binding verification and selection

Both installed role TOMLs and this session's spawn contract pin:

| Role | Actual fixed binding | Requested binding | Result |
|---|---|---|---|
| tier-reader | gpt-6-luna / high | zai/glm-5.3-flash / high | Mismatch; configurable default role can launch requested GLM |
| tier-worker | gpt-6.1-sol / high | gpt-6.1-sol / high | Match |
| tier-reviewer | gpt-6-astra / medium | google/gemini-4-argon / medium | Mismatch; requested model absent from live spawn contract |

Do not change global role files or silently substitute. Actual backend serving is not independently proven by agent self-identification.

Live model menu:

| Option | Model | Supported efforts / route |
|---|---|---|
| A | zai/glm-5.3-flash | low, high, max, ultra; configurable role |
| B | zai/glm-5.3 | low, high, max, ultra; configurable role |
| C | deepseek/deepseek-flash | low, high, max, ultra; configurable role |
| D | anthropic/claude-sonnet-5-5 | low, medium, high, xhigh, max, ultra; configurable role |
| E | gpt-6-luna | low, medium, high, xhigh, max; tier-reader fixed high |
| F | gpt-6.1-sol | tier-worker fixed high |
| G | gpt-6-astra | tier-reviewer fixed medium |

Proposed available lineup: optional GLM Flash/high bounded reader, three Sol/high workers, Astra/medium independent reviewer. Reviewer substitution awaits selection. User may instead select GLM-5.3/high for independent review or retain Gemini pending runtime refresh. The parent retains its existing model and effort.

## Wave ownership and interface revision 1

| Owner | Exact mutable files | Contract and done-when |
|---|---|---|
| Lane 1 / Sol high | src/scene/SceneCanvas.tsx; src/scene/PostProcessingComposer.tsx | R1 DPR cap/budget, explicit composer resize, warm-ready guards; R2 full-tier supported 4x samples, lite SMAA, redundant backbuffer AA/stencil disabled, effect dithering; Studio PMREM generated/disposed safely. Preserve quality APIs and scene environment lifecycle. |
| Lane 2 / Sol high | src/scene/rig/materials.ts | Restore authored role environment gains under r185; object-space micro-roughness for specified turned-metal roles; derivative specular AA at a valid shader stage. Preserve singleton caching, existing knurl hook, ghost cloning and intro activation. |
| Lane 3 / Sol high | src/components/ToleranceStations.tsx; src/scene/TorqueWrenchHero.tsx | Explicit child SVG visibility reset; delta-based pointer damping with clamped delta. Preserve scroll-driven base pose, reduced-motion rules, and annotation API. |
| Parent | New task evidence and verification artifacts only | Preservation manifest, review actual diffs, serialize Vite/Chrome/GPU work, hardware telemetry, captures, pixel comparison, integration, final report. Source handover required before any parent correction. |
| Independent reviewer | No writes | Read integrated diff and actual verification evidence; return verdict and exact findings. Reviewer must differ from authors. |

No lane owns sectionRenderPass.ts, nodeRoles.ts, CameraRig.tsx, lockfiles, canonical plans, existing evidence, protected models, or protected roadmap. The review's optional changes outside the five named paths are excluded. Any required interface change must be reported to parent before crossing ownership.

The review's shader snippets are design sketches: expand and modify actual envmap shader source rather than replacing inside an unexpanded include string; place normal derivatives only after the referenced normal exists. Confirm against installed Three.js shader chunks before implementation.

## Parent acceptance sequence

1. Record accepted lineup, full dirty/untracked preservation hashes, and available local resources before dispatch.
2. Launch three self-contained lane briefs at selected settings. Workers may read dependencies and required skills; no workers launch Vite, Playwright, hardware-GL probes, builds with shared outputs, nested agents, or Git delivery.
3. Parent prepares equivalent baseline/candidate harness while workers edit. All browser/server/GPU activity stays serialized on parent.
4. On stable worker handover, inspect actual diff and source hashes; run typecheck, relevant contract tests, and production build. Restart any task-owned :4173 preview after each rebuild; never stop another owner's process.
5. Run installed Chrome hardware ANGLE/D3D11; record GPU string and reject software GL as hardware evidence. Match baseline viewport 1440x900 and deviceScaleFactor 2, query quality state and program/FBO details, capture the same seven stops.
6. Stops: 0.048 registered intro; 0.103 rupture; 0.150 hero; 0.350 exploded/ghost; 0.470 LCD; 0.650 enclosure; 0.850 M249. Settle before comparing and record temporal/dynamic differences.
7. Confirm composer physical dimensions at DPR 1.5/1.25/1.0 (2160x1350, 1800x1125, 1440x900), supported sample counts, full/lite/poster/reduced-motion behavior, dithering, zero cold-warm declines, shader compilation, and R5 forward/reverse visibility and pointer behavior.
8. Compare 120-frame sweep and seven screenshots against supplied baseline; distinguish measured change from causal claims. Historical baseline calls its sweep DPR2 but its recorded drawing buffer is 2160x1350 at actual DPR1.5; label actual measurements rather than assume the title is accurate.
9. Calibrate lighting with subject-mask luminance/clipping and role separation where reliably measurable. Do not substitute whole-frame statistics for subject/role masks. Record any unresolved acceptance criterion explicitly.
10. Independent selected reviewer reads actual delivered bytes and evidence. Resolve findings within accepted scope, up to two review rounds, with renewed verification for material changes.
11. Recheck preservation, branch and HEAD. Report actual checks and limitations; owner visual approval and Git delivery remain separate gates.

## Current checkpoint

- [x] Read named review and telemetry baseline.
- [x] Read repository startup instructions/context and relevant skill contracts.
- [x] Verify branch, HEAD, clean lane source paths, protected tracked diff, and installed/live role bindings.
- [x] Show wave ownership, available lineup, live model menu, and explicit mismatch.
- [x] Receive one-time model selection. Sol workers Curie (lane 1), Helmholtz (lane 2), Fermat (lane 3); all fixed high. Astra/medium independent review selected. Additional GLM-5.3/max worker option authorized.
- [x] Dispatch three disjoint Sol/high implementation lanes; all delivered/released and closed.
- [x] Parent integrated clone correction and calibrated Studio PMREM radiance.
- [x] Final candidate21 runtime gates, compiled gains, four photometric stops, role separation, yaw/pitch and source/framing acceptance PASS.
- [x] Parent hardware A/B and seven historical pixel comparisons; symmetric performance-only repetitions recorded without steady60fps claim.
- [x] Final production build/typecheck and4production smoke cases PASS; B1/B2 31/31. Controlled full suite1013passed/4skipped/1pre-existing portal failure reproduced on pre-task baseline.
- [x] Independent Astra/medium review completed two rounds: fix-first evidence corrections, then SHIP.
- [x] Same-runtime fingerprint confirms1445preserved original files; protected assets/dirty files unchanged, branch/HEAD unchanged.
- [x] Saved results.md, acceptance.json, raw evidence, and independent-review.md.
- [ ] Owner visual acceptance; any Git delivery requires explicit owner approval.
