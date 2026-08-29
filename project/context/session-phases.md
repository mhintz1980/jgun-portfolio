# Session Phases & Skill Activation — JGUN Portfolio

Presession config: what to read, which skills to activate, and what gate must pass before leaving each phase. Skill paths live in [`agent-skills.md`](agent-skills.md). The project rules in [`../../AGENTS.md`](../../AGENTS.md) always outrank this file.

**Division of labor:** the main session owns judgment — triage, design decisions, integration, and verification sign-off. Subagents own scoped mechanical execution. Recipe: give a subagent the exact reading list (files + sections), 1–3 related tasks, the expected artifact, and nothing that requires a design decision. ZCode note: the Agent tool takes no model argument; the saving is keeping subagent tool output out of the main thread, not model selection.

## Phases

| Phase | Enter when | Skills to activate | Exit gate |
|---|---|---|---|
| **P0 Orient** | Every session start | `codebase-memory` only if a graph query is needed | TODO.md + INDEX.md + linked plan read; git state checked; parallel-session contamination check (`.scratch/`, `docs/orzo-*`, `src/components/canvas/`) |
| **P1 Concept & plan review** | A critique, proposal, or intake item arrives | `build-awwwards-quality-sites` (quality bar), `review-animations` / `improve-animations` / `find-animation-opportunities` (motion bar) | Every proposal triaged: rejected, merged, or promoted to a `JG-###` plan with acceptance criteria in `work/inbox/` → `work/plans/` |
| **P2 Scene & motion build** | Accepted plan touches rig, camera, scroll, or shaders | `cad-scene-graph-rigging`, `gsap-scrolltrigger`, `r3f-scroll-performance-guard`, `animated-3d-video-sites`, `build-threejs-scroll-worlds`, `animate`, `cinematic-gsap-lenis-motion-system`; add `glsl-transition-shader-pipeline` for shader work | `npm run typecheck` + `npm run build` green; fresh `:4173` telemetry after preview-server restart |
| **P3 HUD, callouts & a11y** | Overlay, callout, datum, or annotation work | `spatial-hotspot-a11y`, `scroll-scrubbed-visual-sequence`, `review-animations` | Keyboard/focus pass, viewport-collision check (no clipped/truncated HUD at any breakpoint), telemetry clean |
| **P4 Verify & evidence** | Before flipping any TODO checkbox | `webgl-telemetry-verifier`; `asset-and-bundle-hygiene` for asset/bundle changes | Evidence file in `work/evidence/`; TODO + INDEX updated in the same commit |
| **P5 Deploy** | Release window | `asset-and-bundle-hygiene`; runbook in [`deployment.md`](deployment.md) | Production telemetry recorded; runbook checklist complete |

## Presession checklist (P0 expanded)

1. `git status` — classify every dirty/untracked file: mine, another agent's in-flight work, or protected parallel-session material. Never build on or revert another session's uncommitted work without explicit disposition.
2. `npm run typecheck` — a red tree from a dead session is a P0 finding, not a P2 problem; fix or fence it before starting feature work.
3. Read TODO.md → INDEX.md → the linked plan for the current task. Do not re-derive verified history.
4. Confirm which phase today's work is in and activate only that roster.
5. Fresh sessions inherit the vault handoff if one exists — check `06-AI-Agents/` coordination notes before claiming a contested thread.

## Self-handoff rule

When a session ends mid-task: write the handoff (objective, state, files touched, checks run, exact next action), park it in the vault, and leave the tree either green or explicitly fenced (a note in the handoff naming the red files and why). A broken tree with no note is treated as a dead session's draft — reviewed, dispositioned, never silently built upon.
