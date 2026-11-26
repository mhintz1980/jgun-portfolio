---
name: verify-jg
description: Find and run the existing verifier for a JG ticket or page area (torque wrench, J-Gun opening, Station 2, RL300/quiet machine, homepage export, HUD, cascade) instead of writing a new check. Use whenever a change needs runtime proof, a ticket says "verify", or you are about to write a new verify/capture script.
argument-hint: "<JG-0xx | area | script name> [--quick]"
---

# verify-jg

`scripts/` holds about 90 `verify-*`, `check-*`, `measure-*` and `*.node-test.mjs` scripts, and
most tickets already have one. Mark's rule is minimal testing: run the existing check, and add a new
gate only as a swap for removing a redundant one.

## Find the verifier

1. Match by name first: `ls scripts | grep -i "<ticket number or area word>"`
   (e.g. `jg033`, `jg040`, `opening`, `torque-camera-hud`, `station2`, `cascade`, `home-export`).
2. If that finds nothing, read only the first 5 lines of the candidates. Most scripts start with
   a usage comment (`head -5 scripts/verify-*.mjs`). Then search `TODO.md` for the ticket ID. Its
   entries name the "Required proof" scripts and the evidence folder.
3. If several scripts match, run the one `TODO.md` names for the ticket's current stage. Ask
   before running more than two browser-driven verifiers (each one takes minutes).

## Run it

- Start the dev server with the preview tools (`dev` in `.claude/launch.json`, port 5199), never
  from Bash. Pass `--url=http://localhost:5199` because Vite refuses `127.0.0.1`.
- `verify-jgun-opening.mjs`: run `--quick` (~2 min) while iterating. The full 6-case roster is
  "done" evidence only.
- If a verifier runs against a production build, use `npm run build` then `npm run preview` on
  `:4173`, and restart preview after every rebuild (stale hashes mean the canvas never mounts).
- `npm run check` is the non-browser gate: lint, typecheck, unit tests and `check:station2`.
- Known-red at HEAD (read `TODO.md` before blaming your change): `verify-jg032-station2-thermal.mjs`.
- Send output to `.scratch/` or `project/work/evidence/<ticket>/`, never the repo root.

## Report

Lead with the exit code and the PASS/FAIL count. Name the script and the URL it ran against, and
the evidence path if it wrote one. If it produced PNGs, send the images (Mark rules by looking)
instead of describing them. A runtime or geometry claim needs a telemetry number, not just a
screenshot.
