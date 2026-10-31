# Scenario Blender skills adoption — execution checklist (2026-10-31)

> Status: **implementation complete 2026-10-31; runtime evaluations PASS; independent review pending/dispatched.** Evidence: [scenario-blender-skills-adoption-2026-10-31](../evidence/scenario-blender-skills-adoption-2026-10-31/SUMMARY.md). This is the
> receiving session's checklist for [the adoption plan](C:\Users\Markimus\.codex\visualizations\2026\10\31\01a1914a-1531-7322-8b9b-307820bd9c0d\scenario-blender-skills-adoption-plan.md),
> registered here under the work-ID protocol as an inbox entry (no `JG-###` id was issued for it;
> the owner's same-day implementation prompt is the authority, and no existing task identifier was
> reused). Promote to a `JG-###` plan/TODO entry only if the owner wants this tracked as project work.
>
> Boundaries honored: this task touches no production assets, no runtime source, no animation/ladder
> behavior, and no deployment. Git changes stay uncommitted. Publication policy
> ([owner spec 2026-10-31](../context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md))
> is unaffected — Blender evidence does not become a site gate.

## Phase 0 — establish the current contracts

- [x] Read applicable AGENTS.md files (user global, jgun-torque-wrench; skills-master has none) and
      session-start docs: TODO.md, project/README.md, owner publication/visual policy,
      animation-spec §5–§5.4 headings, project/context/agent-skills.md.
- [x] Read skills-master README.md, vendor/README.md, overrides.yaml schema and index tooling usage.
- [x] Capture branch/status in both repos: skills-master `main` @ `1dae6d6` (concurrent scroll-film-studio
      edits present — preserved); jgun-torque-wrench `torque-wrench/rebuild` (44 dirty/untracked — preserved).
- [x] Verify source checkout revision `7f4b801c7248d51b093ec365aceb114bd06139e6` and root MIT license
      (© 2026 Scenario Inc.). No id/path collisions with the current index (0 `scenario*` ids).
- [x] Verify Blender executable: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` →
      **5.2.2 LTS**, Python **3.13.10**, Node 22.19.0. Upstream targets 5.2.1.
- [x] Register this checklist (this file) referring to the plan; no existing task identifier repurposed.

## Phase 1 — acquire the source into skills-master

- [x] `vendor/scenario-labs-skills` sparse clone pinned at the approved commit (root LICENSE/README +
      `skills/dcc/blender`), detached pin, byte-identical, unedited, gitignored (vendor/*).
- [x] Provenance: tracked `docs/scenario-blender-adoption.md` + ignored `vendor/scenario-labs-skills.SOURCE`.

## Phase 2 — curate and verify discovery

- [x] overrides.yaml: path-scoped entries for the 14 approved ids; blockout path-excluded; notes that
      packages are local-capable, need sibling expert scripts, use the local project adapter (never
      Scenario MCP/skill_get). First 7 = project shortlist; last 7 = optional references.
- [x] Rebuild + determinism check; programmatic comparison of indexed vendor id/path set vs the exact
      14-id allowlist; verify read paths + referenced resources exist.
- [x] skill-find spot checks: hard-surface bevel, product lighting, UV/normal bake, GLB round-trip,
      Geometry Nodes diagnostics.
- [x] vendor/README.md row + README.md counts updated from the regenerated index; pre-existing entries
      confirmed unchanged.

## Phase 3 — project routing and the adapter

- [x] `.agents/skills/blender-mechanical-toolkit/SKILL.md` — short routing/CAD-protection adapter;
      routes the 7 shortlisted domains to absolute vendor paths; declares the contract stack
      (blender-agent-core, cad rigging/cinematography, owner publication policy, local bridge/headless,
      local sibling resolution, derived-copies-only, `bx_audit.deliverable()` gap classification,
      no `ground()`/rescale on registered CAD, M249/MSP protections, no new publication gates,
      single-Blender-process discipline).
- [x] Add adapter + domain paths to `project/context/agent-skills.md`; one brief AGENTS.md route.
- [x] Verify routing from ≥2 harness conventions by direct file reads/resolved import paths.

## Phase 4 — focused behavioral verification (disposable fixtures only)

- [x] Eval 1: mechanical export + gate interpretation (named multipart fixture, parent transform,
      off-center pivots, intentional separation; round-trip vs Three.js GLTFLoader; floating findings
      classified; hashes unchanged).
- [x] Eval 2: hard-surface diagnosis (Boolean/bevel groove fixture; clamping identified; scoped fix on
      the derived copy; reopen saved artifact + review renders).
- [x] Eval 3: UV/material/light pipeline (metal/paint/plastic fixture; bake path; map roles/color
      spaces; saved images; disposable browser harness load on the project's Three.js stack).
- [x] Machine-readable checks + small evidence set under `project/work/evidence/scenario-blender-skills-adoption-2026-10-31/`;
      bulky artifacts stay in the Temp workspace. FAIL/deferred reported honestly.

## Phase 5 — integration review and delivery

- [x] Recheck both git statuses and scoped diffs; confirm session-owned edits only.
- [x] Validate adapter metadata; confirm pin/license/14-indexed/blockout-excluded/7-routes.
- [ ] Independent review of curation + adapter + verification claims (single Blender process).
- [ ] Handoff doc + ready-to-paste continuation prompt; separate completion states for
      **library acquisition / index+discovery / project routing / runtime evaluation**.
- [x] No commit, push, deploy, or PR unless the owner separately requests it. Never stage `.scratch/`.
