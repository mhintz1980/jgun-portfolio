# G1 shell gate

State: IMPLEMENTED / PRODUCER CHECKS PASS within W1; fresh Anthropic review OPEN. Full G1 integration remains OPEN. Requested reasoning: high. This session has no independent served-model/provider receipt; do not infer one from the request. No staged changes, commit, push or deployment by W1.

- [x] Read accepted manufacturing plan, lifecycle-contract.md, contract-review.md and R3F performance skill. Preserve dirty/staged work and shared integration ownership.
- [x] Typed ring/shaft interfaces, immutable per-story chapters/assets/duration metadata, explicit runtime factory registry. Default ring metadata has no fake factory. No shaft trigger/runtime/static substitute.
- [x] StoryRuntime root:Object3D and ready:Promise<void>; create remains synchronous. Optional store runtime, epoch-scoped lifecycle assignment and instance disposal. Exact W2 compile/warm/ready contract in ../shell/notes.md.
- [x] Backward-compatible ring entry, idempotent exit, epoch failures/status/controls/retry, session cancellation/abort, owned disposal and shared borrow release.
- [x] Absolute seek/chapter/replay, end hold, manual intent vs hidden suspension, delta/stamp guards and allocation-free ordinary advancement. Export only: W1 installs no playhead driver.
- [x] Labeled seek, >=44px controls, concise generic header, loading/compiling/error Return, retry, focusin/Tab guard, removed-trigger fallback, dynamic inert isolation, effect-local scroll/Lenis/opacity restoration.
- [x] Focused unit checks: 4 files / 26 tests PASS, including existing lifecycle lease tests. Final focused run: 2026-10-05 14:27:59 local command output.
- [x] Scoped shell TypeScript check PASS, includes all W1 source/tests and browser harness. It does not stand in for repository typecheck.
- [x] Real DOM shell browser proof: desktop 1440x900, narrow 390x844, reduced-narrow and poster-narrow PASS; zero page/console errors and zero CAD requests. Final records: ../shell/dom-report.json and four matching PNG captures. No WebGL scene mounted in this proof.
- [x] Repository typecheck: final `npm run typecheck` PASS (exit 0). Two intermediate runs found four unused imports in integration-owned renderLease.ts:1; concurrent W2 work corrected them. W1 did not edit that file.
- [x] Fresh different-provider review of actual W1 diff and evidence.
  EVIDENCE: Z.ai GLM-5.3 read-only review SHIP (../shell/independent-review-glm.md; 2 LOW, 2 INFO, no blockers; its INFO about an unwired visible deadline is stale: InspectionScene now uses createVisibleLoadDeadline). Parent (Anthropic claude-opus-5-5) reran the four-file command: 4 files / 26 tests PASS, and verify-shell.mjs --url=http://localhost:5199: 4 cases, failures [] (producer report preserved as ../shell/dom-report-producer.json).
- [x] W2 shared driver, leased compilation/1px warm render, visible-time timeout migration, epoch boundary capture, camera/render/end-hold restore, real context loss and resource census.
  EVIDENCE: ../integration-source-audit-2026-10-06.md I1 confirms the single -10 driver (InspectionScene.tsx:25-28; the unwired visible-deadline INFO from ../shell/independent-review-glm.md is stale: createVisibleLoadDeadline is wired). Leased compile/warm readiness and restore PASS both widths in ../runtime/lifecycle/parent-final-2026-10-06 (V1/V3); epoch boundary capture in V3 late-byte completion plus shaft N2; camera/render/end-hold restore S7 81 assertions per viewport/run, camera delta 0 (../runtime/shaft/contact-parent-run-1/2); real context loss N3 exits/disposes once; resource census constant across warmed cycles (V4 census cases, S7). Fresh different-provider review: ../final-glm-integration-review.md SHIP. The combined opening-roster + owner-acceptance item below remains open (full opening triage active and separate: pending).
- [ ] Integrated ring runtime and fresh opening iteration regression; full roster/build/repository checks at integration, then owner runtime visual acceptance.

Commands from repository root:

```powershell
npx vitest run src/state/inspectionStore.test.ts src/scene/inspection/session.test.ts src/scene/inspection/story.test.ts src/scene/inspection/lifecycle.test.ts
npx tsc --noEmit -p project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shell/tsconfig.shell.json
npm run typecheck
node project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shell/verify-shell.mjs --url=http://localhost:5201
```

The isolated shell proof is served by a hidden Vite process on localhost:5201 (PID 31156 when started). Its HTML/TSX lives only under shell evidence; it is not an application entry or a shaft implementation. It never calls the new playhead advance function. W1 did not edit the original scene's wall timer or advance block. Final source refresh observed W2's new driver calling the export at InspectionScene.tsx:25 and a real ring factory registration; those concurrent edits are not shell-owned or verified by the DOM harness. Nash owns scripts/verify-manufacturing-inspection.mjs and runtime/ evidence. Integrated acceptance remains with W2/Nash and the fresh Anthropic reviewer.
