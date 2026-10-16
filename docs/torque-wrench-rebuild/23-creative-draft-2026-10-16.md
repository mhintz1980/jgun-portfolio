# JG-038 drawing-breakthrough creative draft — 2026-10-16

Authority: handoff 22 and Mark's continuation instruction. Branch `torque-wrench/rebuild`, starting HEAD `7c42c151`. Draft styling only; no visual acceptance inferred. Full suites, matrices, AC, reviews, parity work, publication, push, deployment, cutover and archival remain outside this pass.

## Ownership and interfaces

| Lane | Exclusive write paths | Contract | Status |
|---|---|---|---|
| Drawing | `src/scene/torque-wrench/privateSheetContent.ts`, new `privateDrafting.ts` and its test | Preserve `applyPrivateSheetContent(InkBuilder): InkBuilder`, cached input immutability, annotations and red `RUN FEA.`; private-only drafting corrections | Delivered; ownership released; focused tests passed |
| Cavern | `src/scene/torque-wrench/PitGeometry.ts`, its test | Preserve `makePrivatePitGeometry(outline): PortalShaftGeometry`, mouth registration, closure matching and disposal | Delivered; ownership released; focused tests passed |
| Parent | Private effects helper/runtime, opening timing/camera and focused tests; this ledger | Parent owns shader integration, deterministic subject/shard time versus continuous camera time, build and preview | Preparing |

Selected workers: drawing `anthropic/claude-sonnet-5-5/high`; cavern `zai/glm-5.3/high`, configurable default roles. Both dispatched. Owner subsequently requested focused approval by Astra (`medium`, high if necessary) or Opus 5.5/high; selected live fixed `tier-reviewer` role `gpt-6-astra/medium`. This authorizes a scoped approval of these patches, not the parked broad review/AC package. Parent integrates once stable. Shared drawing modules remain read-only unless a necessary private extension is separately established.

Baseline: 1,254 dirty/untracked entries; source files clean. Existing TODO/evidence/scratch preserved. Candidate f preview observed as node PID 47448, port 5288, serving `.scratch/jg038-two-findings-20261015-f`. Sibling preview PID 48636/port 4173 is protected.

References: exact images and motion reference in documents 21 and 22. Named pit target is `03-deep-tunnel-feedback.png`; near-vertical fractured walls, no visible floor. Drawing screenshot marks section hatching escaping beneath the housing and relocates detail B/D circles and letters. Preserve immutable CAD and protected siblings.

## Draft validation

- Integrated TypeScript passed; 44 affected tests across seven files passed. Candidate a production build passed, and a freshly launched task preview served its exact HTML (HTTP 200, SHA256 matched).
- Astra fixed `tier-reviewer` (`gpt-6-astra/medium`) approved the scoped source draft with no blocker. This is source approval only, not formal gates or Mark's visual acceptance.
- One desktop/full focused live smoke: six opening checkpoints, zero browser/GLSL errors, shader warm ready, 99 fragments, 22-ring cavern max radial deviation 0.0794207m. Across narrative p=.43001 to .44000, physical t=.85969 to .86285 while camera position moved: [.35743,.51033,.12] to [.35761,.48857,.13738]. Geometry/time observations do not establish reference parity.
- Actual first draft exposed a visibility blocker: departing shards fell behind the intact stock too early. Parent increased the initial lift and delayed gravity; the physical endpoint remains below -.3m, reverse/seek remain pure. Candidate b and the second scoped Astra check cover this correction.
- Drawing worker limitation: hatch cleanup detects exterior-reachable air, not every sealed cavity. B/D placements are approximate readings of the owner markup; B/E proximity is a named live-view point for Mark.
- No full suites, matrices, AC, performance runs, parity work, push, deployment, cutover, archival or owner-acceptance inference. Original dirty TODO/evidence/scratch and sibling processes were not edited. Original historical PID 47448 was absent at restart, so nothing was killed; new preview launched only after confirming 5288 was free.

## Current owner-view candidate

- Candidate **b**, build `.scratch/jg038-creative-20261016-b`, served at `http://localhost:5288/torque-wrench/`; preview PID 47540, verified command and HTML/build SHA256 match. Candidate a's task-owned preview was stopped before starting b.
- The flight correction passed 26 focused runtime tests and a second Astra/medium approval. Candidate b production build passed. The updated six-checkpoint desktop/full smoke completed with zero browser/GLSL errors; shader warm ready remained 1. TypeScript passed for the integrated draft before the arithmetic-only flight fix; the combined follow-up command timed out before returning a new tsc/build result, so the production build was run separately and completed.
- Unaltered owner-view captures: `.scratch/jg038-creative-20261016-p0.355.png`, `...-p0.389.png`, `...-p0.43.png`, `...-p0.44.png`, `...-p0.453.png`. These now show candidate b. Scratch remains uncommitted.
- Live page opened through Codex (queued by app). Next action is Mark viewing the actual page and naming the next visual fix. No additional styling pass or gate closure is inferred from source approval.
