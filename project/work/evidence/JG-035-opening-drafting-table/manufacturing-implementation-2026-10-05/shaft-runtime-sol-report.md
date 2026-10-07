Implemented the six owned files; shared producer files remain unchanged:

- `shaftRuntime.ts`, `frame.ts`, `schedule.ts`
- `shaftRuntime.test.ts`, `schedule.test.ts`
- [Gate evidence](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/shaft-runtime.md)

Verification passed:

- `npx vitest run src/scene/inspection/shaft`: **90 tests**
- `npm run typecheck`: **pass**

Both housing names and optional `legacyhousing` are supported.

Existing hazard: [kinematics.ts:412](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts:412) transfers withdrawing hob coordinates into progression. The runtime locally holds the completed envelope to prevent tooth regrowth.

Browser proof remains after parent mounting: Draco/shaders, clipping, clearance/framing, finale alignment, allocation measurements, and narrative restoration.

