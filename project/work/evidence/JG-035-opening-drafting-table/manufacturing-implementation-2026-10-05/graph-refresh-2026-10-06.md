# Structural graph refresh — October 6, 2026

Owner requested correction of documentation that could mislead the next session and a useful structural graph refresh. This record is indexing evidence, not application runtime acceptance.

## Final result

| Field | Verified value |
|---|---|
| Project to query | `C-Users-Markimus-.buzz-REPOS-jgun-portfolio` |
| Real repository root | `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` |
| Service executable | `C:/Users/Markimus/AppData/Local/Programs/codebase-memory-mcp/codebase-memory-mcp.exe`, version 0.10.8 |
| Mode / result | `full` / `indexed`; subsequent `index_status` = `ready` |
| Generation | `2026-10-06T16:12:35Z` |
| Nodes / edges | **5,820 / 20,935** |
| Skipped source files | **0** |
| Partial parser files | **2**, listed below |
| Coverage inventory | complete; 32 ignored-file entries stored of 32; hash records complete; generation matches |
| Shareable artifact | not requested; `persistence:false`, no graph DB written into the repo |
| Index log | `C:/Users/Markimus/cbm-cache/logs/C-Users-Markimus-.buzz-REPOS-jgun-portfolio-1791303155.log` |

The separate legacy `jgun-portfolio` registry shares the physical root but retained its older 5,445-node / 14,975-edge index when inspected. Query the explicit active project above; do not assume both registrations have the same generation. `C:/Projects/jgun-portfolio` is a junction to the real root, not another checkout.

## Why structural scope was corrected

The initial unfiltered full refresh returned a pipeline error. The recommended fast diagnostic parsed generated verification data into **16,496,801 nodes**, with registry memory around **17,478 MB RSS**. That diagnostic worker was stopped after identifying the cause; its request subsequently timed out. No unrelated service process was stopped.

Excluding individual generated JSON/log files made a full refresh succeed at 7,975 nodes / 27,004 edges, but the ignored-file inventory overflowed: 2,000 records stored out of 9,200, producing `coverage_unavailable` across otherwise indexed paths. That was an intermediate result, not the final graph.

The final root [`.cbmignore`](../../../../../.cbmignore) prunes the entire `project/work/evidence/` subtree, logs, generated `public/drawing/` cache and Python bytecode. This reduced the exclusion inventory to 32/32 and allowed the final full refresh above. Canonical plans/specs outside the evidence tree, runtime source, `scripts/` helpers and authored JSON remain eligible. Evidence reports and any helper scripts within evidence must be read directly; all their files remain on disk and in the recovery backup. This configuration changes indexing only, not Git tracking, assets or app behavior.

Local authoritative docs consulted: `C:/Projects/codebase-memory-mcp/docs/cbmignore.md`, `README.md`, and `docs/CONFIGURATION.md`, plus live MCP tool schemas and CLI `index_repository --help`. The observed active cache root is `C:/Users/Markimus/cbm-cache`; its worker logs identified the capture-data explosion.

## Verification and remaining limits

- `search_graph` resolves `src/scene/inspection/shaft/shaftRuntime.ts` → `createShaftRuntime`, lines 101–454, with no more result pages for that bounded query.
- `get_code_snippet` matches the live function exactly after normalizing CRLF/trailing newline. Both normalized SHA-256 values are `48781ca12a07b6d5df6ef2dc491c360022ef5f9f388e2f2f194cd72aa2353426`.
- Exact-file coverage checks included the runtime, kinematics, shaft UI, session helper, clearance script, lifecycle verifier, entry documents, canonical plans and agent-skills map. Scope checks covered `src/scene/inspection` and `scripts/manufacturing`, with no further pages. Inspection source has no recorded parse gap; the scripts scope reports only the intentionally excluded `__pycache__` directory.
- **Do not call the freshness checks clean:** they continue to return `metadata_changed` immediately after the completed rebuild, despite matching generation and complete hash records. Direct-source reads were performed for the new runtime/kinematics/UI/session/clearance/verifier files, and all 92 backed-up source/script files still match their saved SHA-256. The runtime's exact graph/live source match is positive proof for that bounded symbol, not proof of graph completeness.
- `trace_path`'s default inbound CALLS query for the runtime factory returned no callers. This is not a dead-code/absence claim: callback/registration references need USAGE/CALL_REFERENCE queries and live-source confirmation when material.
- Known partial parser ranges remain `scripts/deploy-studiomark.ps1:25–26` and `src/scene/rl300/QuietMachinePreview.tsx:64`. Those lines were read directly. Use live-source fallback for any conclusions involving them.
- Final documentation validation checked 265 local links with no broken targets. All 92 backed-up source/script files retain their saved SHA-256, and all seven root acceptance gates remain unchecked.
- Evidence packets are excluded by design, including this report and the handoff. Read them from disk. Plans, flags, node totals and `ready` status never replace runtime proof or owner acceptance.

Documentation-only corrections and indexing configuration did not alter application source, CAD, acceptance checkboxes, existing staging or HEAD. No commit, push or deployment performed.
