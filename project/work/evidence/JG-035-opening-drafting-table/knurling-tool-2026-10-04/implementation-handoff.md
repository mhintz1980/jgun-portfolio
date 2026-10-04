# JGun — authorship and Ring Switch implementation handoff

## Latest owner direction

The owner asked to model the knurling tool in the open Blender instance, responded positively to the result, then requested: finish the checks, write the next-session handoff to implement the changes already laid out, and commit/push this session's changes. This is the next implementation direction; older documentation-only instructions about the proposed knurling sequence no longer describe the requested continuation.

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`. The current session created an asset and evidence, not website behavior. All pre-existing dirty application work remains outside this session's commit. Next session should work from this actual checkout, inspect its current dirty state, and preserve concurrent ownership.

## Read first

1. `AGENTS.md`, `TODO.md`, `project/README.md`, and animation-spec §5–§5.4. Use the latest owner-provided AGENTS instructions, including skill-find for specialized tasks and stable part-number identities.
2. Asset packet: `project/work/evidence/JG-035-opening-drafting-table/knurling-tool-2026-10-04/README.md`. It links model, export, controls, source scripts, pictures, and verification; avoid duplicating its detail.
3. `docs/jgun-knurling-tool-model-plan.md` and this packet's handoff pointer. Model completion is separate from implementing the animation.
4. Authorship concept packet at `project/work/evidence/JG-035-opening-drafting-table/mark-authorship-concepts-2026-10-04/`: `README.md`, `review.md`, `ring-switch-knurling-request.md`, and `continuation-image-review-2026-10-04.md`. Much of this earlier packet was untracked before this session; only this session's continuation review was selected for the commit.
5. Original owner brief, local-only: `.scratch/antigravity-portfolio-role-chat-2026-10-02.md`. Build scope is before `--STOP HERE FOR NOW AND PLAN AND IMPLEMENT THE SECTION ABOVE BEFORE PROCEEDING---` at line 100. Later material provides foresight only. Never commit .scratch.
6. Current opening work: `docs/jgun-blue-trace-tunnel-plan.md` and its October 3/4 evidence. Preserve cream vellum, blue trace/rupture, deep outline shaft, newest drawing callouts/cutaway, and the measured mechanism ladder. Earlier PASS packets do not verify new work.

## Completed tool

Editable local model: `C:/Projects/CAD/jgun-knurling-tool/knurling-tool-v1.blend`. It is open in Blender in `JGUN_KNURLING_TOOL`, frame 85, with the actual P003068 fit reference visible. Spacebar plays its approximately five-second mechanics demonstration.

Repository copy: `project/work/evidence/JG-035-opening-drafting-table/knurling-tool-2026-10-04/source/knurling-tool-v1.blend`. Builder/export/verification scripts are saved beside it and also in the local CAD folder.

Web asset: `project/work/evidence/JG-035-opening-drafting-table/knurling-tool-2026-10-04/knurling-tool.glb`. Copy into the appropriate public asset location when implementing. It has 12 rigid mesh groups, one sampled clip, five separately moving units, physical opposite-hand wheel teeth, and no exported CAD reference ring/lights/cameras. The editable model retains individual components. The packet documents controller properties and axis conversion.

The owner's latest drawing shows opposed adjustable holders. The modeled mechanism follows that image, replacing the earlier assumption of pivoting scissor arms. Proportions approximate the supplied drawing because its lettered dimension table was absent. The real decoded P003068 ring establishes fit. This is an animation prop, not certified production tooling.

Verification: nominal envelope contact/clearance and traverse checks; final GLB reimport comparison at nine frames across five moving units; saved .blend reopened in a separate Blender process; front/rear/hero/contact renders. No website runtime or manufacturing-result proof exists yet. Verification files in the packet bind the export to its SHA-256.

## Next build scope and order

Save a separate checkbox implementation plan in docs, tied to the canonical task/work registry as appropriate. Begin implementation after saving it. This asset-only plan does not approve unrelated later-chapter ideas.

1. **Identity and authorship:** make Mark visible immediately in readable page text; use actual role/credit wording. Add a restrained personal margin-note layer with DOM transcription while retaining the authored CAD drawing and formal manufacturing ink.
2. **Engineering decision:** present one concise first-person machining/undercut story in the main narrative with optional deeper explanation. Use the actual relevant part and feature rather than the generated packaging layout. Keep undecided facts out of asserted outcomes.
3. **Ring inspection:** create a controlled click/tap/keyboard P003068 macro with clear return/Escape behavior. Maintain one camera owner, store the inspection-entry narrative context, and restore/resume it on exit. Decide placement around the existing scroll timeline in the implementation plan before editing timings.
4. **Manufacturing sequence:** integrate the completed knurling tool and develop the owner's sequence below, on the real Ring Switch geometry.
5. **Responsive and reduced motion:** readable mobile composition, reachable return control, static accessible equivalents in reduced/poster modes, and no forced rapid spin for reduced motion.
6. **Verification:** relevant unit/contract/build checks plus fresh browser telemetry and rendered comparison of the sequence. Use localhost:5199 for the opening verifier; quick is iteration evidence, full six-case roster is required only for declaring opening work done. Restart :4173 after every rebuild. Test enter/exit, reverse scroll, restored pose, tool clearance, partial/full knurl, and material boundaries.

Planet inspection stays optional. The generated arbor and probe are illustrative; authentic fixture, selected occurrence, restraint, and extraction path remain unresolved. Do not implement that proposed measurement setup as verified manufacturing fact.

## Owner's Ring Switch sequence

- Zoom to the initially smooth black Ring Switch while the rest of the assembly fades into darkness.
- Transition the isolated ring to raw aluminium and rapid rotation.
- Bring the knurling tool into contact with its OD; traverse for about one or two seconds.
- Retract and exit the tool, leaving the fresh diamond knurl.
- Return the surface to dark black as the assembled tool returns from darkness.

The existing old Seedance camera/light video is not this manufacturing sequence. Use the newly modeled tool, not that video, for implementation.

Owner references: `C:/Users/Markimus/Pictures/Screenshots/knurl start.png` and `knurl finish.png`. They were directly viewed alongside the generated concepts. They show smooth-to-knurled OD, with bore and smooth edge lands preserved. The newer drawing is archived as `owner-tool-reference.png` in the model packet.

Recommended staging, distinct from fixed owner requirements: show the knurl progressively behind contact/traverse; preserve ring profile and smooth shoulders; keep both wheel hands correct and rolling directions consistent; clear the OD before tool exit; decelerate before the assembly returns; retain relief as black returns. The two-second traverse in the tool's mechanics clip is available for reuse, but the total demonstration duration does not fix the site's storytelling duration.

The full sequence's ring support/drive, entry direction, camera path, start/finish band, total pacing, and optional sound remain implementation decisions. Resolve a consistent presentation setup and document any stylization; no production machining validation was requested. The black/aluminium/black transition is cinematic compression, not a depicted anodizing operation.

## Code locations to investigate

Inspect the graph before structural discovery and verify coverage for source files relied on. Start with the existing rig's P003068 grouping, `src/scene/TorqueWrenchHero.tsx`, `src/scene/rig/materials.ts`, `src/state/scrollStore.ts`, and the app's current camera/inspection input ownership. Existing ring material/OD mask and cylindrical UV logic are likely reuse points; inspect current source before planning changes.

The new tool's GLB is a separate prop. Preserve actual CAD part geometry, stable identifiers, existing ring pin/ball-plunger grouping, measured explosion order, and other asset restrictions. Generated concept fasteners, repeated carriers, dimensions, and typography are appearance references rather than geometry/data sources.

## Outstanding factual checks

Actual role/credit wording; authentic undercut part/revision; operation/feature/revision association for newer .002/.0005/.0004 process notes; anodize thickness versus growth; spool alloy/condition; prior-design cage reduction. Proceed on geometry/interaction work that does not depend on these facts. Do not silently upgrade responsibility claims or substitute old fact-sheet values for newer owner statements.

## Ownership and Git

The session-owned repository paths are the new knurling-tool packet, `docs/jgun-knurling-tool-model-plan.md`, and the authorship packet's `continuation-image-review-2026-10-04.md`. Existing modified README/TODO/work registry/application files, other untracked plans/evidence, .codex/.mimosa/.tmp-probe, and .scratch predate this asset work. Do not stage them merely to make the tree clean.

Current branch at closeout: `codex/jg033-signature-shot`; authoritative origin is `https://github.com/mhintz1980/jgun-portfolio.git`. Commit/push completion is recorded in the chat and closeout evidence; verify live refs before claiming remote state. No deployment was requested.

## Suggested skills

- Run `skill-find "implement a Blender GLB knurling tool and ring surface animation in React Three Fiber"`; pick a fitting entry and read its SKILL.md. Curated catalog is reference-only.
- `cad-scene-graph-rigging`: actual P003068 identity, descendants, rigid grouping, axis/pivot handling.
- `glsl-transition-shader-pipeline`: progressive OD relief/material transitions if custom shader work is needed.
- `r3f-scroll-performance-guard`: camera/timeline ownership and zero-rerender animation updates.
- `gsap-scrolltrigger`: narrative scroll windows and interruption/return semantics.
- `webgl-telemetry-verifier`: pose, material, clearance, and lifecycle proof with runtime telemetry.
- `spatial-hotspot-a11y`: accessible inspection entry/exit and keyboard interaction.
- `asset-and-bundle-hygiene`: prop loading, bundle/static paths, and later browser-performance checks.

Select only skills needed for the actual implementation step. The Blender prop's appearance review does not replace runtime verification or owner acceptance of the integrated site.
