# Quiet Machine program: skill shortlist (2026-10-10)

For the **orchestrator**. Sub-agents have no Skill tool and load no skill frontmatter, so a skill reaches one only by path: write "Read `<absolute path>` before starting; follow it for X only" into the spec. **A path given to a seat that cannot do what the skill needs fails silently**, so the Seat column is binding.

Source: Master Skills Library `C:/Projects/skills-master` (274 skills; index `skills-index.yaml`, generated 2026-10-08). Query: `node _skills-index/skills-index.mjs --tag <tag> --paths` or `skill-find "<task>"`. Read one SKILL.md per need; never bulk-load. Companion rig-skill map: `project/context/agent-skills.md`. Plan: `project/work/plans/JG-033-quiet-machine-integration.md`.

## Seat types
| Seat | Tools | Can run skills that need |
|---|---|---|
| `tier-reader` | Read, Grep, Glob | reading and judging only. No commands, no web, no MCP. |
| `tier-worker` | + Edit, Write, Bash, PowerShell | build, test, gates, scripts. No web, no MCP. |
| `general-purpose` (or `ocx-*` for a different vendor) | all tools incl. web and MCP | web docs, Chrome DevTools MCP. Costs ~70k tokens before work; use only when required. |

## Orchestrator loads (once)
| Skill | Path | When |
|---|---|---|
| `claude-tiers` | `C:/Users/Markimus/.claude/skills/claude-tiers/SKILL.md` (Skill tool `/claude-tiers`) | Session start. |
| `pickup` | `C:/Projects/skills-master/vendor/caneff-agent-skills/pickup/SKILL.md` (23 lines) | Session start, after the handoff. |
| `unlazy` | `C:/Projects/skills-master/local/unlazy/SKILL.md` (113) | Before QM1. It is gate files plus a separate refuting agent that runs the gates, so that agent is a `tier-worker` told "no edits". |
| `handoff` or `/wrap` | `C:/Projects/skills-master/vendor/caneff-agent-skills/handoff/SKILL.md` | End of session. |

## Give to sub-agents by path
| Skill | Absolute path | Lines | Seat | When / commit |
|---|---|---|---|---|
| `tdd` | `C:/Projects/skills-master/vendor/mattpocock-skills/skills/engineering/tdd/SKILL.md` | 39 | `tier-worker` | **QM1, QM2**: new pure modules (`pages.ts`, `pageFade.ts`, `PageNav`). Tests first. |
| `adversarial-code-review` | `C:/Projects/skills-master/local/adversarial-code-review/SKILL.md` | 265 | `tier-worker` told "no edits" (it requires **executed** evidence; `tier-reader` cannot run commands). Prefer a different vendor (`ocx-*`) per the skill, else Opus. | **Opus reviews: QM1, QM2, QM4, QM6, QM9, QM9b.** Reviewer must report failed attacks. Name the sections that apply; it is long. If the skill is dropped for a review, the `tier-reader` review remains a read-only judgement and cannot claim executed evidence. |
| `test-audit` | `C:/Projects/skills-master/vendor/caneff-agent-skills/test-audit/SKILL.md` | 338 | `tier-reader` | **After QM4** (shell v1): do `pageTopology`, `shellBoundary`, `pageFade` tests prove anything? Once, not per commit. |
| `diagnosing-bugs` | `C:/Projects/skills-master/vendor/caneff-agent-skills/diagnosing-bugs/SKILL.md` | 140 | `tier-worker` | Only when a gate goes red unexpectedly or a `QMn-fix` is needed. |
| `read-the-damn-docs` | `C:/Projects/skills-master/local/read-the-damn-docs/SKILL.md` | | **orchestrator or `general-purpose`**: it requires web search, which `tier-worker` lacks. Cheaper: the orchestrator fetches the Vite docs and pastes the facts into the QM4 spec. | **QM4**: Vite multi-page `build.rollupOptions.input`, `appType: 'mpa'`, `--manifest`/`--sourcemap`. |
| `asset-and-bundle-hygiene` | `C:/Projects/skills-master/local/asset-and-bundle-hygiene/SKILL.md` | 45 | `tier-worker` | **QM4** (chunking for a second entry), **QM9b/QM10** (GLB, posters), **QM11** (hosting readiness). |
| `webgl-telemetry-verifier` | `C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md` | 161 | `tier-worker` (Playwright via Node, not MCP) | **GPU-1..GPU-8**, and the QM7 verifier: runtime probes (`window.__quietMachine`), never vision alone. |
| `spatial-hotspot-a11y` | `C:/Projects/skills-master/local/spatial-hotspot-a11y/SKILL.md` | 42 | `tier-worker` | **QM7**: `IntakeHotspot` keyboard and screen-reader behaviour, projection from scene space. |
| `r3f-scroll-performance-guard` | `C:/Projects/skills-master/local/r3f-scroll-performance-guard/SKILL.md` | 72 | `tier-worker` | **QM9** (lite policy, skip caps while closed) and **GPU-6** (60/30 fps p95). |
| `threejs-postprocessing` | `C:/Projects/skills-master/vendor/openmontage-skills/threejs-postprocessing/SKILL.md` | 603 | `tier-worker` | **QM8, QM9**: composer and offscreen cap passes. Name the EffectComposer/cost section. |
| `threejs-loaders` | `C:/Projects/skills-master/vendor/openmontage-skills/threejs-loaders/SKILL.md` | 624 | `tier-worker` | **QM9b only**: full-tier GLB loader swap, Draco. Name the GLTF/Draco section. |
| `threejs-geometry` | `C:/Projects/skills-master/vendor/openmontage-skills/threejs-geometry/SKILL.md` | 549 | `tier-worker` | **QM9/QM9b** if GPU-5 attribution says decimation or instancing. Name the instancing section. |
| `web-perf` | `C:/Projects/skills-master/local/web-perf/SKILL.md` | 208 | **`general-purpose`** (needs Chrome DevTools MCP, not always connected) | **GPU-6/GPU-1**, only if a load-time view (LCP, render-blocking) is wanted. Otherwise skip: the p95 table does not need it. |
| `web-design-guidelines` | `C:/Projects/skills-master/vendor/openmontage-skills/web-design-guidelines/SKILL.md` | 40 | `tier-reader` | **QM5, QM6**: end card, progress bar, header nav review. |

## Optional
| Skill | Absolute path | Seat | Use |
|---|---|---|---|
| `visual-recap` | `C:/Projects/skills-master/vendor/caneff-agent-skills/visual-recap/SKILL.md` (553) | orchestrator | One interactive recap of shell v1 or the branch for the owner, only if asked. |
| `vercel-react-best-practices` | `C:/Projects/skills-master/vendor/openmontage-skills/vercel-react-best-practices/SKILL.md` (148) | `tier-reader` | QM3/QM4/QM7 if the eager-graph gate shows React bundle weight. |
| `type-tightness` | `C:/Projects/skills-master/vendor/caneff-agent-skills/type-tightness/SKILL.md` (174) | `tier-reader` | Once at QM1 if `pages.ts` types look loose though typecheck passes. |
| `codebase-memory` | `C:/Projects/skills-master/local/codebase-memory/SKILL.md` | `general-purpose` or orchestrator | Structural queries if the graph MCP is connected; otherwise grep. |

## Considered and rejected
| Skill | Why not |
|---|---|
| `cad-scene-graph-rigging`, `glsl-transition-shader-pipeline` | Torque wrench rig (D1-AP parts, CH.04 shader). QM must not touch that page; loading them invites edits there. |
| `mutation-audit` | `mutmut`/Python-specific. The plan's named mutations per commit do the job. |
| `wayfinder`, `to-tickets`, `to-spec`, `triage`, `visual-plan` | Planning is approved; not needed to implement. |
| `impeccable`, `scroll-film-studio`, `animated-3d-video-sites` | Visual authority is the owner's and Astra's for this program. |
| `higgsfield-*` | MCP auth failing (401); QM generates no media. |
| `caveman`, `i-have-adhd` | Output-style skills; style already set. |

## Notes
- **Harness-resident skills** (`claude-tiers`, `orchestration`, `impeccable`, ...) show frontmatter in every session regardless; this list cannot remove that. It keeps sub-agents off the library, and `tier-*` agents load no skills anyway.
- If a path 404s, re-run the index query; the index was generated 2026-10-08. All 21 paths above were checked to exist on 2026-10-10.
- The rig skills also exist under `C:/Users/Markimus/.claude/skills/`. Prefer the library path in specs so every harness resolves the same file.
