# S1 seat spec: evidence index (Haiku 5.5, high, tier-worker)

Goal: create ONE file, `project/work/evidence/rl300-quiet-machine/INDEX.md`, mapping every artifact in that directory to a gate. Docs only. Repo `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine` (use absolute paths). Do not edit anything else, do not stage or commit, create no other file, no tests.

Owner approval quote for G0 (record it verbatim in the file header): "Start with S0/S1 and S2A" (owner, 2026-10-11).

## Inputs (read only these)
- `project/work/evidence/rl300-quiet-machine/README.md`; the directory listing (numbered docs `00-` to `33-` and the folders `31-gpu-1`, `32-gpu-2`, `33-gpu-3`, `34-v16-assessment`, `35-v16-round-1`, `36-shell-readiness-run`, `37-s2a`, `astra-rereview`, `baseline-frames`, `duct-reconstruction`, `entry-fix`, `lower-fix`, `qm-commit-gates.md`).
- Gate names B.1-B.4 and U.1-U.4: `project/work/plans/JG-033-quiet-machine-integration.md` lines 45-60.
- Plan gates G0-G9: `docs/quiet-machine-motion-background-plan-2026-10-11.md` lines 107-122.
- Run files and handoffs for status: `docs/HANDOFF-quiet-machine-2026-10-11a.md` (V16 waivers), `project/work/evidence/rl300-quiet-machine/35-v16-round-1/run-A-baseline.md`, `run-B-after.md`, and the first 40 lines of each other folder's run/README file.

## Output format
One markdown table, one row per folder or per file group: `| artifact | what it is (one line) | gate | current/historical | pass/fail/waived/unknown |`.
- The root numbered docs `00-` to `30-` may be grouped as a few rows (by date or theme), marked historical.
- current = produced by a build at or after V16 HEAD `90bc07d2` (folders 35, 36, 37); everything else historical.
- Status ONLY from a line you can cite (file + line) in a run file or handoff; otherwise `unknown`. Never infer pass/fail.
- Record failures and waivers kept as-is. Include: V16 waivers "owner-approved, Astra not consulted" (waived: plan amendment, Opus plan gate, adversarial review rounds, Astra, U.4, mutation proofs, GPU-4..GPU-8; source handoff 2026-10-11a line 14); G4 "waived, owner standing instruction (no new tests); S2a proves the relocation byte for byte, the add-a-beat-by-data claim is claimed, not demonstrated".
- Do not duplicate B/U gates: map new G1-G9 onto existing B.1-B.4 / U.1-U.4 in a short second table.
- `36-shell-readiness-run/` belongs to the shell session: index it, never edit it. `37-s2a/` is being written by other seats right now: one row, status `in progress`.

Report (short): row count, how many `unknown`, anything you could not classify.
