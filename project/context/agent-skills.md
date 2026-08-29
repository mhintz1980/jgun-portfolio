# Cross-Agent Skill Map — JGUN Portfolio

This document is the durable lookup map for agents working in `jgun-portfolio`. Read the applicable `SKILL.md` **before** changing the relevant code. The project operating rules in [`AGENTS.md`](../../AGENTS.md) remain authoritative.

> **Canonical rule:** Prefer the harness-local copy for the agent that is currently running. If a harness-local copy is absent, read the shared copy at `C:\Users\Markimus\.agents\skills\<skill>\SKILL.md` directly. Do not substitute a generic web-development workflow for one of these project-specific skills.

| Work type | Required skill | ZCode path | Claude Code path | Codex path | Shared fallback path |
|---|---|---|---|---|---|
| CAD scene roles, D1-AP identity, rigid groups, explosion ladder | `cad-scene-graph-rigging` | `C:\Users\Markimus\.zcode\skills\cad-scene-graph-rigging\SKILL.md` | `C:\Users\Markimus\.claude\skills\cad-scene-graph-rigging\SKILL.md` | `C:\Users\Markimus\.codex\skills\cad-scene-graph-rigging\SKILL.md` | `C:\Users\Markimus\.agents\skills\cad-scene-graph-rigging\SKILL.md` |
| Runtime WebGL proof, telemetry probes, no screenshot-only acceptance | `webgl-telemetry-verifier` | `C:\Users\Markimus\.zcode\skills\webgl-telemetry-verifier\SKILL.md` | `C:\Users\Markimus\.claude\skills\webgl-telemetry-verifier\SKILL.md` | `C:\Users\Markimus\.codex\skills\webgl-telemetry-verifier\SKILL.md` | `C:\Users\Markimus\.agents\skills\webgl-telemetry-verifier\SKILL.md` |
| R3F scrolling, frame-work budget, quality tiers, reactive-state avoidance | `r3f-scroll-performance-guard` | `C:\Users\Markimus\.zcode\skills\r3f-scroll-performance-guard\SKILL.md` | `C:\Users\Markimus\.claude\skills\r3f-scroll-performance-guard\SKILL.md` | `C:\Users\Markimus\.codex\skills\r3f-scroll-performance-guard\SKILL.md` | `C:\Users\Markimus\.agents\skills\r3f-scroll-performance-guard\SKILL.md` |
| GSAP timelines, ScrollTrigger lifecycle, Lenis coordination, scroll beats | `gsap-scrolltrigger` | `C:\Users\Markimus\.zcode\skills\gsap-scrolltrigger\SKILL.md` | `C:\Users\Markimus\.claude\skills\gsap-scrolltrigger\SKILL.md` | `C:\Users\Markimus\.codex\skills\gsap-scrolltrigger\SKILL.md` | `C:\Users\Markimus\.agents\skills\gsap-scrolltrigger\SKILL.md` |
| Semantic CAD anchors, leader lines, keyboard-operable spatial annotations | `spatial-hotspot-a11y` | `C:\Users\Markimus\.zcode\skills\spatial-hotspot-a11y\SKILL.md` | `C:\Users\Markimus\.claude\skills\spatial-hotspot-a11y\SKILL.md` | `C:\Users\Markimus\.codex\skills\spatial-hotspot-a11y\SKILL.md` | `C:\Users\Markimus\.agents\skills\spatial-hotspot-a11y\SKILL.md` |
| CAD-to-wireframe transition, shader ownership, GLSL pass | `glsl-transition-shader-pipeline` | `C:\Users\Markimus\.zcode\skills\glsl-transition-shader-pipeline\SKILL.md` | `C:\Users\Markimus\.claude\skills\glsl-transition-shader-pipeline\SKILL.md` | `C:\Users\Markimus\.codex\skills\glsl-transition-shader-pipeline\SKILL.md` | `C:\Users\Markimus\.agents\skills\glsl-transition-shader-pipeline\SKILL.md` |
| GLB/CAD asset readiness, compression, bundle and deploy audit | `asset-and-bundle-hygiene` | `C:\Users\Markimus\.zcode\skills\asset-and-bundle-hygiene\SKILL.md` | `C:\Users\Markimus\.claude\skills\asset-and-bundle-hygiene\SKILL.md` | `C:\Users\Markimus\.codex\skills\asset-and-bundle-hygiene\SKILL.md` | `C:\Users\Markimus\.agents\skills\asset-and-bundle-hygiene\SKILL.md` |
| Motion-led 3D landing-page composition and sequence direction | `animated-3d-video-sites` | **No installed ZCode copy. Read shared fallback directly.** | `C:\Users\Markimus\.claude\skills\animated-3d-video-sites\SKILL.md` | `C:\Users\Markimus\.codex\skills\animated-3d-video-sites\SKILL.md` | `C:\Users\Markimus\.agents\skills\animated-3d-video-sites\SKILL.md` |
| Indexed codebase graph lookup, impact tracing, and semantic retrieval | `codebase-memory` | `C:\Users\Markimus\.zcode\skills\codebase-memory\SKILL.md` | `C:\Users\Markimus\.claude\skills\codebase-memory\SKILL.md` | `C:\Users\Markimus\.codex\skills\codebase-memory\SKILL.md` | **No shared fallback; use the harness-local copy.** |
| UI animation craft — purpose gating, curves, durations, springs, reduced-motion | `animate` | None (shared only) | None (shared only) | None (shared only) | `C:\Users\Markimus\.agents\skills\animate\SKILL.md` |
| Animation critique and codebase-wide motion audit (read-only, outputs fix plans) | `review-animations`, `improve-animations`, `find-animation-opportunities` | None (shared only) | None (shared only) | None (shared only) | `C:\Users\Markimus\.agents\skills\review-animations\SKILL.md` · `..\improve-animations\SKILL.md` · `..\find-animation-opportunities\SKILL.md` |
| Premium art-direction bar — originality, honest assets, a11y and perf safeguards | `build-awwwards-quality-sites` | None (shared only) | None (shared only) | None (shared only) | `C:\Users\Markimus\.agents\skills\build-awwwards-quality-sites\SKILL.md` |
| Cinematic GSAP + ScrollTrigger + Lenis motion language | `cinematic-gsap-lenis-motion-system` | None (shared only) | None (shared only) | None (shared only) | `C:\Users\Markimus\.agents\skills\cinematic-gsap-lenis-motion-system\SKILL.md` |
| Scroll-driven Three.js chapter worlds; scroll-scrubbed reversible sequences | `build-threejs-scroll-worlds`, `scroll-scrubbed-visual-sequence` | None (shared only) | None (shared only) | None (shared only) | `C:\Users\Markimus\.agents\skills\build-threejs-scroll-worlds\SKILL.md` · `..\scroll-scrubbed-visual-sequence\SKILL.md` |

> 2026-08-28: the five shared-only rows above were added from `emilkowalski/skills` (animation craft/review) and `MengTo/Skills` (design/motion canon, stack-matched subset). MengTo's remaining ~110 technique skills and its `gsap-scrolltrigger-storytelling` (duplicate of the official GreenSock skill) were deliberately not installed — pull on demand from the upstream repo if a specific technique is needed.

## Codebase-Memory Service

The project agents already have a local **`codebase-memory-mcp`** installation. It is not necessary to install the repository linked in the task. The verified executable is:

```text
C:\Users\Markimus\AppData\Local\Programs\codebase-memory-mcp\codebase-memory-mcp.exe
```

It reports version `0.10.4` and exposes graph tools including `index_repository`, `search_graph`, `query_graph`, `trace_path`, `get_code_snippet`, `get_architecture`, `search_code`, `index_status`, `check_index_coverage`, and `detect_changes`.

Codex already contains an `mcp_servers.codebase-memory-mcp` entry. Claude Code has the `codebase-memory` skill and dedicated agents at:

```text
C:\Users\Markimus\.claude\agents\codebase-memory.md
C:\Users\Markimus\.claude\agents\codebase-memory-scout.md
C:\Users\Markimus\.claude\agents\codebase-memory-auditor.md
```

Before making exhaustive or negative codebase claims, agents must check that the JGUN project is indexed and use the skill’s coverage guidance. A graph result is evidence only for indexed paths; it is not proof that unindexed source is absent.

## Mandatory Invocation Rules

| Change or task | Read before work | Required verification |
|---|---|---|
| Rig roles, offsets, part identities, GLB grouping | `cad-scene-graph-rigging` | `webgl-telemetry-verifier` |
| Any scroll behavior, GSAP timeline, or Chapter timing | `gsap-scrolltrigger` and `r3f-scroll-performance-guard` | `webgl-telemetry-verifier` after a fresh `:4173` preview restart |
| Spatial leader lines, HTML/R3F callouts, datum/GD&T overlays | `spatial-hotspot-a11y` | Keyboard/focus behavior plus viewport and telemetry check |
| GLB, texture, Draco, shader, or asset-budget changes | `asset-and-bundle-hygiene`; also `glsl-transition-shader-pipeline` where applicable | Production build, asset validation, and runtime telemetry |
| Broad structural search, impact analysis, or refactor scoping | `codebase-memory` | Index status and coverage check before asserting complete results |

The fixed requirements still apply: use part numbers rather than ambiguous stage names, never bare-regenerate `m249-transformed.glb`, and verify the live canvas via telemetry after restarting the preview server.[1]

## Reference

[1] [`AGENTS.md` — JGUN operating rules](../AGENTS.md)
