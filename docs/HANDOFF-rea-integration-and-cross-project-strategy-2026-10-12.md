# HANDOFF: REA Architectural Integration & Cross-Project Strategy

> **Completion pointer (2026-10-13):** this strategy handoff is superseded. The completed current record is
> `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\HANDOFF-rea-phase3-complete-2026-10-13.md`, with the executable
> plan at `docs/rea-integration-implementation-plan-2026-10-13.md` (Phases 0, 2 and 3 executed; Phase 3 result YES,
> 31 `sampleTorqueBeat` executions during external scroll). Two corrections: HEAD at handoff time was `dc44fb79`,
> and `resolveBeats` never existed. This document stays as historical context.

**Date:** 2026-10-13 (Updated)  
**Handoff File:** `c:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\HANDOFF-rea-integration-and-cross-project-strategy-2026-10-12.md`  
**Workspace:** `c:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (with cross-reference to `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine` and `C:\Projects\rea`)  
**Status:** IN-FLIGHT / INTERRUPTED — Claude Opus was cut off mid-task by API overload / quota while probing REA and tracing source tools. The deep step-by-step implementation plan was in progress and needs to be completed by Claude CLI.

---

## 1. Operating Coordinates & Commit Baselines

- **`jgun-torque-wrench`:** Branch `torque-wrench/rebuild`, HEAD `8945fa95`
  - `JG-038` Stage 0 is verified and closed (shared shell readiness passed, numerical performance budgets accepted in `docs/torque-wrench-rebuild/18-stage0-verification-contract-proposal.md`).
  - Stage 1 is authorized: private entrypoint at `torque-wrench/index.html` and `src/torque-wrench-main.tsx`, consuming `PageNav.tsx` and enforcing `cadGate.ts`.
  - Legacy root page (`index.html`, `src/App.tsx`) remains untouched.
- **`jgun-quiet-machine`:** Branch `quiet-machine/integration`, HEAD `1f92aa3a` / `e2770620`
  - QM7 landed (end card copy, numbered nav, mobile header clearance).
  - V16 round 2 extra parts GLB landed (`public/models/rl300-extra-parts.glb`).
  - Beat-local motion landed in `beats.ts`.
  - **CRITICAL PARALLEL WORKER GUARD:** A separate session is running Modal Blender Cycles renders into `project/work/evidence/rl300-quiet-machine/38-s5-posters/`. **Do NOT touch, clean, or overwrite this folder or public images.**
- **Tooling Repo (`C:\Projects\rea`):**
  - Indexed in Codebase Memory (14,201 nodes, 70,600 edges).

---

## 2. Updated Testing Rule (Owner Ruling, 2026-10-13)

**Audit & Prune Prerequisite Rule (replaces mechanical 1:1 swap):**
- **Do NOT blindly pile on tests.** Piling on redundant, obsolete, or brittle tests adds severe compute/token costs, forces unnecessary refactors that do not improve the product, and creates false-failure maintenance churn.
- **Mandatory First Step Before Adding Tests:** Agents must thoroughly review, audit, and eliminate existing redundant, outdated, or low-value tests *first*.
- **Quality Standard:** Every remaining and new test must be strictly justified, high-signal, and cost-effective. Run existing gates once at milestone boundaries rather than generating intermediate test bloat.

---

## 3. What Opus Discovered Before Being Interrupted

Opus was actively probing REA's MCP tools on this Windows system and exploring how to apply them non-invasively when it hit API quota/overload limits:

1. **REA Tool Availability on Windows Host (Empirically Checked via `binary_session`):**
   - **Active & Usable:**
     - *JavaScript/Application Graph:* `analyze_javascript_application`, `compare_source_to_bundle`, `compare_application_versions`, `compare_javascript_export_shapes`, `trace_application_feature`, `trace_javascript_semantics`, `build_reconstruction_obligation_ledger`, `evaluate_reconstruction_coverage`.
     - *Browser/CDP Runtime:* `capture_browser_scenario`, `capture_web_screenshot`, `compare_web_screenshots`, `compare_web_captures`, `inspect_web_page`, `inspect_web_event_listeners`, `observe_web_execution`, `analyze_web_bundle`, `trace_web_module_imports`, `trace_web_source_location`.
     - *Artifacts & Lifecycles:* `open_binary`, `close_binary`, `inspect_artifact`, `compare_artifacts`, `export_evidence_bundle`, `import_evidence_bundle`, `get_evidence_bundle`, `inspect_analysis_view`.
     - *Residual Unknowns:* `record_unknown`, `update_unknown`, `list_unknowns`, `verify_unknown_resolution`, `verify_reconstruction`.
   - **Unavailable on Windows:** Native disassembler providers (Hopper/Ghidra/pwntools) report `provider_missing` or `unsupported_host` for Linux ELF diagnostics, firmware extraction, and Android tooling.
2. **Key Technical Discovery (Transport Constraint):**
   - Running `analyze_javascript_application` on `src/shared` completed but returned an MCP error: `resource_constraint` (`reported_limits: default_receive_buffer_bytes: 10485760`, response exceeded 10 MB).
   - **Operational Solution for Agents:** Do not dump large AST graphs over raw stdio. Either:
     a) Analyze smaller, targeted directory subpaths;
     b) Ingest via `export_evidence_bundle` to a scratch file and inspect through `inspect_analysis_view`; or
     c) Use CLI directly: `npx -y rea-agents@6.3.0 analyze-javascript-application <path> --json`.
3. **Where Opus Got Cut Off:**
   - Opus was tracing `importReferenceSource` in `C:\Projects\rea\src\application\ReferenceSourceImport.ts` and `cliCommandNames.ts` (`import-reference-source`) to see how historical git trees can be imported into REA for zero-risk AST comparisons.
   - It was interrupted before synthesizing the step-by-step agent implementation plan that avoids interfering with parallel sessions.

---

## 4. In-Flight REA Use Cases to Flesh Out

Claude CLI should finish fleshing out and structuring these exact use cases into an actionable agent workflow:

1. **Cross-Repo Shell Contract Guard:**
   - Using `compare_javascript_export_shapes` to verify `src/shared/PageNav.tsx` and `pageTopology.ts` across `torque-wrench` and `quiet-machine` to prevent regressions without adding brittle unit tests.
2. **Multi-Entrypoint Bundle & Tree-Shaking Audit:**
   - Using `import-reference-source` and `compare_source_to_bundle` against `dist/assets/*.js` to verify that `cadGate.ts` strictly prevents Three.js from leaking into the initial HTML entry or static poster fallbacks.
3. **Passive CDP Event Listener & WebGL Runtime Auditing:**
   - Using `inspect_web_event_listeners` to verify 3D hotspot click handlers without dispatching synthetic clicks.
   - Using `observe_web_execution` to trace scroll scrubbing and beat-resolver execution coverage without adding new test assertion scripts. (**Completed 2026-10-13:** the named symbol `resolveBeats()` does not exist; the resolver is `sampleTorqueBeat`, which executed 31 times during external scroll. See `HANDOFF-rea-phase3-complete-2026-10-13.md`.)
4. **Binary glTF/GLB Container Forensics:**
   - Using `inspect_artifact` and `compare_artifacts` to audit glTF buffer digests and ensure `public/models/msp-enclosure.glb` and `m249-transformed.glb` never suffer hierarchy collapses or dropped normal maps during exports.
5. **Multi-Session Evidence & Unknowns Ledger:**
   - Using `record_unknown` and `export_evidence_bundle` to track unresolved owner rulings (intake framing at $u=0.51$, chevron tone) across parallel agent sessions without relying on volatile chat memory.

---

## 5. Non-Interference Guidelines for Other Sessions

- **Do NOT touch:** `project/work/evidence/rl300-quiet-machine/38-s5-posters/` (Modal worker active).
- **Do NOT touch:** The legacy root page (`index.html`, `src/App.tsx`, `src/scene/SceneCanvas.tsx`) in `jgun-torque-wrench`.
- **Do NOT commit or push** without owner review of visual PNG artifacts.
- **REA operations must run read-only or against isolated `.scratch/` output paths.**

---

## 6. Prompt to Resume in Claude CLI

```text
Resume task in c:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench (branch torque-wrench/rebuild, HEAD 8945fa95).
Read the in-flight handoff:
c:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\HANDOFF-rea-integration-and-cross-project-strategy-2026-10-12.md

Key context for you:
1. Opus was NOT finished thinking through this task. It hit its quota/overload limits mid-investigation while tracing REA tools (C:\Projects\rea) and testing the analyze_javascript_application stdio buffer limits.
2. Owner testing rule update (2026-10-13): It is NOT a mechanical "1-for-1 delete swap" rule. Rather, auditing and pruning existing redundant, obsolete, and bloated tests is a MANDATORY PREREQUISITE step before adding any new tests. Every test must be high-signal and justified; do not pile on tests that increase maintenance and token costs without helping the product.
3. Parallel sessions are active: A Modal session is currently generating S5 section posters in C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine\project\work\evidence\rl300-quiet-machine\38-s5-posters\. Do not touch that directory or public images.
4. Goal for you: Take the empirical REA tool findings (JS analysis, compare_source_to_bundle, compare_javascript_export_shapes, inspect_web_event_listeners, observe_web_execution, export_evidence_bundle) and construct a complete, walked-through implementation plan for an agent to execute them safely without colliding with parallel work.
```
