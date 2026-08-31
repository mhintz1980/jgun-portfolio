# Skill roster — scrubbed-backgrounds planning & build

*Companion to [`2026-08-31-scrubbed-backgrounds-plan.md`](2026-08-31-scrubbed-backgrounds-plan.md)
(2026-08-31 owner kickoff: backgrounds that scrub along with the scroll animations).
Revised 2026-08-31 after the verification review — the renderer decision (procedural GL)
forced several re-prioritizations, and the `/unlazy` orchestrated protocol added roles.
Skills are DEACTIVATED from the menu — read the `SKILL.md` directly at the path given,
lazily, at the phase listed. All paths are user-level and valid from any worktree; all 21
below verified present against the 43 skills in `C:\Users\Markimus\.agents\skills\`.
Canonical rosters: `../context/session-phases.md` (P0–P5) and `../context/agent-skills.md`.*

**Who is who.** *driver* = the orchestrating session. *L1–L6* = the leaf subagents defined in
the plan's §Execution protocol. *adversary* = the separate refutation agent that runs after
each leaf's parent re-run.

## Mandatory

| Skill | When | Who | Why |
|---|---|---|---|
| `unlazy` | **Before any work** — Rule zero, gates before work | driver | The execution contract. Nothing starts until `GATES.md` exists |
| `codebase-memory` | P0, before writing leaf briefs | driver | How briefs carry accurate `file:line` context without every leaf re-exploring. Previously listed "optional" — it is not, in orchestrated mode |
| `r3f-scroll-performance-guard` | Entry to L2 / L3 / L4 | every leaf touching `useFrame` | Owns the zero-rerender and zero-allocation contracts the adversary probes at standing target 4 |
| `glsl-transition-shader-pipeline` | Entry to L3 | L3 | **Promoted from Conditional** — procedural GL *is* the chosen renderer. Owns the `fog={false}` depth ramp and the sub-0.6-linear luminance cap |
| `webgl-telemetry-verifier` | Entry to L5 | L5 + adversary | Runtime probes over vision — AGENTS.md hard rule: vision confabulates on the dark scene |
| `asset-and-bundle-hygiene` | L6 | L6 | Acceptance criterion 8: ≤10 KB min JS, +0 media bytes |

## Recommended

| Skill | When | Who | Why |
|---|---|---|---|
| `build-threejs-scroll-worlds` | Entry to L2 | L2 | Scene-graph idiom for scroll-driven world layers |
| `cinematic-gsap-lenis-motion-system` | Entry to L2 | L2 | The Lenis/ScrollTrigger contract the backdrop must not fight |
| `gsap-scrolltrigger` | L2, reference | L2 | Official scrub reference — consult, do not re-architect |
| `build-awwwards-quality-sites` | Concept pitch | driver | Quality bar |
| `design-taste-frontend` | Concept pitch | driver | **Added** — the plan pitches three concepts (A/B/C) and needs a standard to judge them against |
| `review-animations` | Integration + verification branch gates | **adversary** | **Added** — gives the refutation agent a real scrub-feel rubric instead of ad-hoc judgment |
| `web-perf` | L5 | L5 | **Added** — chrome-devtools MCP is already the probe hard-dependency; this is the skill that drives it. Serves acceptance criterion 5 |

## Reference only — demoted by the renderer decision

| Skill | Status |
|---|---|
| `scroll-scrubbed-visual-sequence` | **Demoted from "MOST on-point".** Its subject is video / image-sequence scrub — rejected and deferred respectively by the renderer decision. Read only if the Rev-2 plate path revives. Its one durable contribution is already absorbed: native scroll = source of truth, same scroll → same state |
| `animated-3d-video-sites` | **Demoted.** Video-background is rejected on the record and reverses the 2026-08-30 standing note. Rev-2 only |
| `scroll-film-studio` | Concept-pitch format only (the plan's A/B/C section borrows it) |

## Escape hatches — named triggers, otherwise do not load

| Skill | Trigger |
|---|---|
| `cad-scene-graph-rigging` | Only if the 3D rig itself must change to composite with backdrops. It currently does not |
| `spatial-hotspot-a11y` | Only if HUD callouts end up riding on the new backgrounds. The a11y pass is otherwise a documented no-op — no baked text, no scroll trapping, backgrounds sit behind content |
| `self-healing-docs` | If the stale `TODO.md:32/36` + INDEX.md "commit local only, not pushed" notes get folded into this change (`origin/main` is level with `HEAD` at `287bf05`) |
| `handoff` / `wrap-session` | P5 closeout only |

**MCPs:** chrome-devtools is the probe hard-dependency (no file fallback). codebase-memory
MCP is mandatory for the driver, optional for leaves.
