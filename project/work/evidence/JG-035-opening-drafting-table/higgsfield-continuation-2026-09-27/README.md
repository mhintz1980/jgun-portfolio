# Higgsfield continuation — 2026-09-27

## Parent direction

Prioritize an empty blue-grey acoustic lab for RL300 and a warm workshop plate for the post-opening exploded-view sequence. The CAD assembly must remain the visual subject: fixed camera/exposure, empty centre, no equipment, people, text or invented products. Keep the workshop bench low in frame. Use sparse dust rather than pulsing illumination, which would compete with the engineering callouts. No site integration is approved by this record.

The parent selected these treatments and authored `batch-request.json`. The handoff authorized credit spending and identified Seedance 2.5 at 5 seconds / 720p / 16:9. Cheap image probes were optional; these two already-defined environments did not need a separate mood-selection round. Reserve the remaining 30 credits rather than force the third plate into a different quality tier.

## Live evidence

- Hosted MCP endpoint: `https://mcp.higgsfield.ai/mcp`, initialized successfully with protocol `2025-03-26`.
- Existing authentication read from the user's Claude MCP configuration, in memory only. No credential copied into this folder or script.
- `balance`: 100 credits, plus plan.
- `models_explore(get, seedance_2_5)`: t2v supported, 4–30 seconds, 720p supported, 16:9 supported, audio can be disabled.
- `generate_video(get_cost=true)`: exactly 35 credits; no job submitted. Two requested clips total 70 credits.
- `generate_video_batch`: zero of two submitted; both rejected with HTTP 403 `only_mcp_usage_on_trial_is_available`.
- One single-video recovery attempt for acoustic lab: same HTTP 403. Support request ID: `58b9e9a2-5ff4-4fc4-8f45-1ed4cc74642c`.
- Balance re-checked after the failures: still 100 credits, plus plan — no credits were spent.

This contradicts the prior handoff's assumption that a connected MCP server plus a visible balance proves trial generation works. Read-only account access and cost estimation work; actual submission fails even through the hosted MCP tools. No job IDs or output media exist, so there is nothing to poll, download or visually approve. Do not repeat submissions until the account/server restriction is resolved. Do not change billing or cancel the trial.

## Reproduction

`scripts/higgsfield-mcp-call.ps1` is a small PowerShell JSON-RPC transport for this environment, where Higgsfield was not exposed as a native Codex tool. It uses the configured server URL and authentication without printing credentials. Request files are reviewable and contain no secrets. `submission-result.json` records the failed batch. Calling a generation request can spend credits once the account issue is resolved; balance/model/cost requests are read-only.

Raw outputs, if later generated, belong outside `public/` with prompts and job IDs. The parent must review composition and motion before integration; loop quality and mobile payload require separate measurements.
