# Higgsfield account reconciliation — 2026-09-29

Read-only CLI check on 2026-09-29; no generation or download was submitted.
The 2026-09-28 handoff remains a historical record of the 403 observed then.

## Current account and ledger

- CLI 1.1.26 reports a valid OAuth session, Plus plan and **1,000 credits**.
- The 2026-09-26 grant was 100. The ledger then records 26.44 credits spent
  on 13 completed jobs: twelve Soul V2 stills (0.12 each) and one 5-second
  Cinematic Studio 3.0 video (25). A subscription cycle on 2026-09-29 swept
  the remaining 73.56 credits and granted 1,000 new credits.
- The failed hosted MCP submissions from 2026-09-27 are real, but the handoff's
  "no credits spent, 100 remain" and "no media exists" statements are no
  longer accurate for the account as a whole. The ledger does not attribute
  the completed jobs to those failed submissions.
- The support-ticket ID is `58b9e9a2-5ff4-4fc4-8f45-1ed4cc74642c`.
  The CLI has no ticket-status command; its current status is unverified.
- A read-only Seedance 2.5 cost estimate still returns 35 credits for
  5 seconds / 720p / 16:9. The prior trial-specific 403 condition no longer
  matches the Plus account, but hosted MCP generation has not been re-tested.

## Completed-job provenance

None of the 13 jobs match `higgsfield-asset-manifest-2026-09-27.json` by
model, medium or prompt. The manifest calls for three 10-second locked-off
industrial footage plates. The completed batch contains twelve 2016 × 1344
stills with prompts for assorted environments and one 5-second push-in video
toward an industrial pump. No job ID appears in the repository or `public/`.
The manifest status `prepared-not-submitted` remains correct.

Potential still-image mood references, based on prompt metadata only:

| Job ID | Prompt subject | Possible use and mismatch |
|---|---|---|
| `f2e12952-fabc-4f93-9bf9-fd1dbc42d632` | dark warehouse with overhead beam | Acoustic mood, but warm rather than blue-grey and no foam wedges |
| `9f097537-c798-4d07-9c69-c6bca0c1a9d7` | machine hall with dust and skylights | Dust/light reference, but visibly a factory hall |
| `1e2b2147-7cb1-4bbb-832b-73d83c6571d0` | warm industrial workshop with blurred toolboxes | Workshop mood, but tools violate the empty-bench brief |
| `893432d5-fe3d-487c-9ca9-8f2a4fe0a9fa` | empty white gallery | Neutral Station 3 reference, but no metrology-lab architecture |

Those assets were not viewed or accepted as site assets during this account
check. The single video (`7a95bf2f-10d1-467e-8844-a16440f4da0c`) moves the
camera toward machinery, contrary to the manifest's restraint rules. The
account returned accessible result URLs for all 13 jobs during a HEAD-only
check. The batch's author and intended use are not established by local
evidence; the job list alone cannot settle either.

## Decision before further media work

The earlier time pressure from expiring trial credits is gone. A current
generation request would spend credits and create an asset with a different
model/duration from the saved manifest. Confirm the intended production lane
and prompt/cost set before submitting it. Any output needs prompt/job-ID
provenance and a visual ruling before site integration. Nothing in this note
changes JG-035's application verification or owner-approval gate.
