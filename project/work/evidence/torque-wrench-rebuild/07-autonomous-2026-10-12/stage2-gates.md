# Stage2 leaf gates

- [x] Baseline audit retained before conductor implementation.
  EVIDENCE: motion-baseline.md at baseline dc44fb79; source refresh and historical limitations separated.
- [x] Accepted interface and disjoint ownership saved before dispatch.
  EVIDENCE: contract-v1.md; canonical plan13 skill roster.
- [x] Pure timeline/registry tests pass, including extension and invalid inputs.
  CHECK: npx vitest run src/scene/torque-wrench/beats.test.ts src/scene/torque-wrench/beatTimeline.test.ts src/scene/torque-wrench/directorRegistry.test.ts
  EXPECT: exit 0
  EVIDENCE: pause-checkpoint.md; integrated 12-file/133-test run exit 0, 2026-10-12.
- [x] Store/conductor lifecycle and no lifecycle-notification churn tests pass.
  CHECK: npx vitest run src/state/torqueWrenchStore.test.ts src/scene/torque-wrench/conductorRuntime.test.ts src/scene/torque-wrench/ScrollConductor.test.tsx
  EXPECT: exit 0
  EVIDENCE: pause-checkpoint.md; integrated 12-file/133-test run exit 0, 2026-10-12.
- [x] Integrated TypeScript/import boundary and production topology checks pass.
  EVIDENCE: Current TypeScript exit 0; production build E succeeded with private eager closure limited to private entry, React and shared navigation, and one lazy Scene edge. Current source-boundary refresh exit 0 on 2026-10-12 after the entry flushSync correction.
- [x] Actual browser canonical progress/seek/reload/hold/reverse, static preservation and conductor cleanup checked.
  EVIDENCE: runtime-timeline/full-e.json 17/17 PASS, exit 0 against .scratch/jg038-stage2-20261012-e at localhost:5278. Build E static proof: ../05-stage1-integration/runtime/stage2-static-e.json 14/14 PASS. Historical full-d.json predates the final active guards and is retained as iteration evidence only.
- [x] Independent review of concrete Stage2 artifact complete.
  EVIDENCE: stage2-review.md; Goodall GLM-5.3/High, two rounds, current source clear after required findings resolved. Final exact-build browser run now passes. Reviewer ownership released.

**Stage2 exit satisfied 2026-10-12.** D-core/D-bake production extraction and the parallel parent mechanics branch may begin under extraction-contracts.md and the recorded external-session ownership. Non-BFCache history restoration is proved separately; BFCache itself remains unproved. Optional review follow-ups R7–R9 remain tracked for later harness/physical-range refinement.

Stage2 contract proof is not Stage3 CAD/director implementation or G2 actual GPU lifecycle acceptance. Final G0–G9 remain separately tracked.
