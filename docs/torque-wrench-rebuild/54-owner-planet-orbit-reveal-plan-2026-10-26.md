# Owner refinement: planets orbit before their carriers

Date: 2026-10-26. Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.

Mark approves the new shaft-driven sequence overall and requests this focused refinement. Reference: `C:/Users/Markimus/Pictures/Screenshots/position-planetsFadeIn .png` (literal space before `.png`). This supersedes the reveal ordering and constant continuation speed in implementation 51, while preserving R1/F1–F4 and the successful initial engagement.

- [x] Read checkpoint, brief 50, live dirty state and approved routing in 51.
- [x] Revalidate preview entry/report hashes and all three protected source model hashes before changes.
- [x] Check graph coverage: generation 2026-10-25T07:41:36Z is stale for these files; use current source for the implementation.
- [x] Delay Stage 2 planet appearance until the camera shows Stage 1's integral sun at approximately the supplied reference angle.
- [x] For physical stages 2, 5, 3 and 4, reveal planets first, show their engagement/orbit, then fade in their already-spinning carrier. Keep invisible carrier pivots active.
- [x] Progressively increase the common input speed through these reveals. Integrate speed analytically so all linked shaft/carrier/planet angles remain continuous and reversible; preserve relative ratios and existing engagement through 40.2 s.
- [x] Retain the 58 s duration and final source handoff. Source registration preserves tooth conjugacy, with the inherited rewind/index reset explicitly documented in evidence 55.
- [ ] Focused source checks, typecheck/build and current-build desktop/narrow runtime proof including reverse/shuffled seeks, separate alpha channels, completed planet orbit, smooth acceleration and source handoff.
- [ ] Independent critical review, resolve concrete findings, present revised preview for owner acceptance.

Interpretation for implementation: a fully visible planet set should complete at least one carrier revolution before that carrier's physical meshes begin appearing. The speed ramp applies to the common input drive, so previous stages accelerate together; do not independently boost each stage or change the physical stage/ratio ladder.

Ownership: Sol/high `tier-worker` owns shaft `schedule.ts`, `camera.ts`, `shaftRuntime.ts`, `script.ts` and corresponding tests only; any necessary shaft story/kinematics duration change requires interface notice first. Parent owns this plan, runtime verifier/evidence, top-level docs and shared host integration. Astra/medium `tier-reviewer` is independent/read-only. These native pins and efforts are exposed in the current tool roster and fall within the existing selection in 50/51; no new selection is needed. Role names constrain behavior, not filesystem permissions.

Preserve all pre-existing dirty and untracked work. No staging, commit, push, deployment, protected-model regeneration, unrelated cleanup, or broader acceptance. Owner visual acceptance remains open. Do not replace the eight original screenshots or the new reference. Existing source ladder values remain relative speed ratios; a changed integrated drive does not authorize changing that ladder.
