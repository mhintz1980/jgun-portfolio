# Historical planning handoff — JG-035 manufacturing inspections

**Superseded as the continuation entry point, 2026-10-06:** implementation has begun and substantial work is saved. Resume the [recovered implementation handoff](../manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md), its execution PLAN/status log and actual evidence. The original planning instructions below describe the pre-implementation state; they do not require repeating completed measurements or rebuilding implemented leaves. Acceptance gates remain open until their evidence and independent reviews are reconciled.

Written 2026-10-05. **Ready to implement.** This session was planning only: owner approval and verbatim storyline recorded; parent/Astra/Opus concept reviews and reconciliation complete; general plan drafted and Astra detail pass incorporated; Opus's two final findings corrected; bounded Opus re-review **SHIP** and Astra final delta **AGREE**. No blocking plan findings remain. Full review sequence and attribution: [review-ledger.md](review-ledger.md). Planning readiness is not geometry/runtime certification.

## Historical planning entry and instructions

Follow repo session-start instructions, then read:

1. [Canonical implementation plan](../../../../../docs/jgun-manufacturing-inspection-plan.md).
2. [Owner text and approval](../../../../context/owner-specs/manufacturing-inspection-storyline-2026-10-05.md).
3. [Concept consensus](concept-consensus.md), [Astra detail pass](astra-plan-detail-review.md), [Opus final SHIP](opus-plan-rereview.md), [Astra final agreement](astra-final-refinement-confirmation.md), and [asset baseline](approved-asset-baseline.md). Preserve the prior [fix-first report](opus-final-plan-review.md) as review history; its blockers are resolved.
4. `project/context/architecture/animation-spec.md` §5–§5.6 and `project/context/agent-skills.md`; use live source/specs instead of stale skill timing/rotation tables.

At this planning checkpoint, implementation was the next-session request and the first step was G0 — freeze, measure and camera blockout. That work has since progressed: use the recovered implementation handoff to identify remaining G0 evidence/review gaps, then resume those gaps rather than starting G0 from scratch. Preserve other sessions' work and dispatch bounded independent work after shared interfaces and file ownership are clear.

## Accepted direction

Mark approved modified P001835-2, P000725 and bearing/ring K000210/K000211 after Blender review: **6 mm authored hob lead-out, +2.75 mm shaft-local Y shift**. Do not reopen the superseded 1.885 mm option. Ring Switch P003068 concept was previously approved and already has a 12-second implementation; refine it rather than rebuild it blindly.

The shaft story preserves the quarter-orbit impression, shaped-cutter exit/chip clearance macro, three material/FAILED cards, revised smooth blank → hobbing → cooler stress illustration, exact support relocation, spinning planets/cages and full assembly finale. The detailed shot list, readability anchors and physical-truth boundaries are in the plan, not duplicated here.

Scope is a shared optional inspection, with a revised inspection-study assembly finale and explicit **Return to narrative** restoring the original saved main rig. Do not overwrite `Default.glb`, retune ladder/window constants or silently adopt revised parts in the main narrative. That scope choice was reconciled with Astra and Opus and needs no new approval question. Owner approval of models/concepts does not establish runtime or solved-FEA approval.

## Historical first deliverable and measurement requirements

The original first deliverable was G0 evidence in a new implementation-dated folder. Existing results now live in `../manufacturing-implementation-2026-10-05/`; reconcile those results and open acceptance gaps before adding evidence. The required record remains a source/occurrence/transform registry, reproducible dimensions, minimum swept-tool clearances with uncertainty, old/new support delta, and camera blockout. Obtain a provider-diverse mechanical review of that evidence before accepting the tooling choreography.

- Locate and re-hash `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/` files against `approved-asset-baseline.md`. Source shaft GLB is ~10.85 MB; derive a compressed study bundle rather than loading it into the regular narrative.
- Measure actual lead-out, journal and shoulder. The handoff's 13.79 mm floor-exit prose and build report's `leadout_end_y_mm = 14.0639481319` are not interchangeable. The handoff-derived 0.14 mm gap is unverified and says nothing about the entire tilted moving tool. Preserve the accepted shape while measuring.
- Pin shaper tooth count/form, signed generating motion, axial stroke/overtravel, relieved return; pin hob starts/setting/tool envelope against the accepted lead-out. Build a grooved shaping stock blank and engagement-driven cutting states; the first quarter does not finish all teeth. The recap explicitly completes them with fast strokes/slow apparent orbit or an honest captioned time skip before material attempts. Cinematic orbit comes from the deterministic shaft-following camera, then eases into machine-frame macro. Do not invent a production tool or copy an unsigned ratio.
- Measure legacy and approved support transforms in one shaft-local frame. Approved assets already contain the shift. End = approved placement; start = measured legacy placement; rigid pair keeps its relative transform. No added endpoint offset. Housing and integral journal/groove are alternate design geometry, not extra sliding parts.
- Check revised teeth against planets and all neighbours, including previously unchecked K000180-1 spring. Check bearing-race separability. Resolve source's one non-manifold edge and normals only in derived copies, with silhouette/fit evidence.
- Establish identity extraction before destructive consolidation: the shaft belongs to shared clutch/static buckets, so hiding a whole bucket may remove unrelated parts. Stable occurrence/part identity is mandatory. Freeze lifecycle/telemetry adapter interfaces before parallel shared-file edits. Pose the shaft finale in an inspection-local assembled root even for blueprint/exploded entry; prefer clones or lease/restore all reused transforms and render state. Test exploded entry → assembled finale → identical saved exploded Return.

The planned sequence was G1 shared shell, G2 assets/tooling, G3 ring refinements, G4 shaping/materials, G5 hobbing/support/finale, G6 integration/fallback/final review. None was implemented in this planning session; later implementation progress is recorded in the recovered handoff. The plan's unchecked overall acceptance gates do not mean those implementations are absent.

## Required adversarial review protocol

Each stage must pass a fresh reviewer from a different provider from its producer. Examples: OpenAI GPT-6.1-Sol → Anthropic Sonnet-5.5 or Z.ai GLM-5.3; Z.ai GLM-5.3/Flash → OpenAI/Anthropic; DeepSeek-Flash → OpenAI/Anthropic/Z.ai. GLM reviewing GLM-Flash does not count as different-provider review. Use the live tool/CLI catalog; no silent model substitution.

Hand reviewers the stage spec, actual diff/assets, commands/results, same-frame telemetry/rendered checkpoints and known limitations. Require **ship / fix-first / rethink** and precise findings. Fix blocking findings, rerun affected checks and obtain a fresh verdict. Mechanical geometry, lifecycle/accessibility and visual/performance axes all need evidence. Parent independently checks the claims; review prose is not proof. Record requested versus observed model/provider/effort and routing request IDs as this session did in the ledger. A failed/unavailable reviewer is not SHIP.

Use controlled file ownership: integration owner alone edits shared camera/hero/inspection scene; separate workers can own asset preparation, shaft sampler, ring adapter, shell and verifier as mapped in plan §5. Do not revert another worker's edits. The producer cannot accept their own work.

## Verification inherited, not completed here

The earlier [authorship/knurling handoff](../authorship-knurling-implementation-2026-10-04/continuation-handoff.md) reports historical 7/7 inspection runtime and technical SHIP. It does not prove the new plan's implementation. Its plan/registry checkboxes may still say implementing; reconcile against actual files and evidence, do not infer absence or tick them from memory.

The earlier opening quick run failed because the capture was lite when full was required. It is invalid full-tier evidence, not an established renderer regression. Use the plan's quick protocol while iterating; full six-case roster only for final integration. Do not close JG-035 from a planning verdict.

After code/assets change: proportional unit tests/typecheck, then integration `npm test`, build, B1/B2 contract and Stage 2. **Restart :4173 after every rebuild.** Ring verifier: `node scripts/verify-ring-inspection.mjs --url=http://localhost:4173 --out=<new-evidence-dir>`. Opening iteration: `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5199` on a confirmed full-tier GPU session. Extend/add the shaft verifier after its telemetry contract is defined; it does not exist merely because this handoff mentions it.

Include desktop/narrow, cold/delayed CAD, blueprint/exploded entry, every direct chapter seek, reverse/replay, Return/Escape during load/motion/error, hide/show pause policy, poster/reduced/context loss, five warmed entry/exit resource cycles, exact transforms and card content, readable surface/contact/clearance pixels, motion-only performance windows, and zero console errors. Mark's runtime visual acceptance is the final look gate after technical cross-provider SHIP.

## Repository boundaries and session-owned files

Extensive staged opening/inspection changes predate this planning session. `.scratch/` is never committed. No source, asset or CAD implementation changes were made here; no commit/push/deploy was requested or done.

This session adds `docs/jgun-manufacturing-inspection-plan.md`, the owner-storyline file and this evidence folder; it adds approval/continuation pointers to the earlier handoff and planning/registry documents. Read the closeout verification in the ledger for final ownership checks. Never stage the whole repository. The earlier staged `.gitignore` contains unrelated hunks and remains someone else's ownership concern.

## Suggested skills

- `C:/Users/Markimus/.agents/skills/orchestration/SKILL.md` — routing, bounded ownership and served-model evidence; current public tool schema wins over historical model names.
- `C:/Users/Markimus/.codex/skills/cad-scene-graph-rigging/SKILL.md` — stable part/occurrence identity, extraction/merge ownership and transforms; current spec wins over historical display-turn tables.
- `C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md` and `C:/Users/Markimus/.agents/skills/gsap-scrolltrigger/SKILL.md` — mutable proxy, one camera/clock, lifecycle cleanup and scroll restore.
- `C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md` — live proof, material/transform checks paired with rendered visibility.
- `C:/Users/Markimus/.agents/skills/read-the-damn-docs/SKILL.md` — reference-backed tool/process conventions. Manufacturer references are linked in the asset baseline; they do not establish this particular production setup.
- `handoff` — write the next continuation with evidence and open issue locations; use this project's evidence folder as explicitly requested rather than losing the handoff in a temporary directory.
