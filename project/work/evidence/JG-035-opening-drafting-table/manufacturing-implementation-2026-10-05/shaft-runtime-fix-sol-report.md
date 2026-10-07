Completed within the specified ownership.

Changed paths:

- [frame.ts](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/frame.ts): F1 removed the erroneous **0.6 mm** offset; cutter face now matches `edgeY`.
- [kinematics.ts](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts): F2 retains **0.25 / 0.50 / 0.75** depth ahead of passes 2–4. Shared progression now holds the completed hob envelope from **30.2 s**.
- [shaftRuntime.ts](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/shaftRuntime.ts): F3 disposes the hob thread exactly once; removed the local withdrawal workaround.
- [shaftRuntime.test.ts](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/shaftRuntime.test.ts) and [kinematics.test.ts](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.test.ts): added regressions covering every finding.
- [shaft-runtime.md](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/shaft-runtime.md): appended R8, including the corrected R3 justification.

Verification:

- `npx vitest run src/scene/inspection/shaft` — **98 tests passed**, 7 files.
- `npm run typecheck` — **passed**, exit 0.

Parent edits preserved. No git commands or queue-doc reads.

