# Owner review and control-baseline refinement — 2026-10-30

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`
Branch: `torque-wrench/rebuild`

## Owner decisions

All eight items in handoff 71 were explained individually and approved by Mark.
Item 5 approval explicitly requires the control-baseline refinement.
Mark selected option 1 for the study-only hob lead-out: accept existing geometry
and framing, document measured visibility, and check it during full verification.
This does not establish full verification or final owner visual acceptance.

### Subsequent approval and checkpoint — 2026-10-30

Mark subsequently approved all current changes ("It's all approved") and requested
that they be committed and pushed before returning with further notes. This closes
the owner approval gate for the current work and authorizes Git delivery. The
technical verification gaps and recorded failures below remain open. No deployment
was requested. Earlier references to pending owner acceptance describe the previous
review state and do not require another approval of this checkpoint.

## Execution checklist

- [x] Record all eight approvals and the study-only runout choice in handoff 71.
- [x] Refine mask controls to compare against the same patched shader with an empty band.
- [x] Verify focused contracts, typecheck, and a fresh production build.
- [x] Verify null/full controls at the known discrepant poses on desktop and narrow.
- [x] Run all four defined cascade cases with dense over-limit replay; preserve actual failures (all four fail; dense replay stops at the first failing pose).
- [ ] Complete exhaustive dense replay after resolving its recorded failures.
- [ ] Complete the current same-build six-case page cinematography roster (desktop-full FAIL, desktop-lite incomplete, four cases without results).
- [x] Run full camera/HUD assertions, including camera and subject reverse error (both aspects FAIL three assertions; reverse checks PASS).
- [ ] Full opening-specific proof: inherited legacy verifier is incompatible with the private route; record that gap and assess current runner coverage.
- [x] Save actual results and remaining gates in committed-path evidence.

## Git checkpoint verification and remaining work

Fresh checkpoint checks: 55 focused tests across feature masks, final cascade,
shaft camera and schedule PASS; 18 page-verifier Node tests PASS; both modified
verifier scripts pass Node syntax checks; `npm run build` PASS (includes TypeScript).
`git diff --check` PASS before documentation reconciliation; recheck before commit.

Existing runtime reports were inspected during closeout, not rerun:

- Cascade: all four desktop/narrow full/lite cases completed, overall FAIL.
  Sampled alias, window-pixel and dense-pixel gates fail. Dense replay stops at
  its first failing input-sun pose around 55.83–55.86 s; exhaustive replay is open.
- Page cinematography: desktop-full completed with framing/HUD and beauty-replay
  failures; desktop-lite is incomplete and the other four cases have no results.
  The six-case roster is incomplete and failing.
- Camera/HUD: both aspects retain the three failures listed in evidence 72.
- Opening-specific proof and the inherited 66.9 s source-takeover C1 stop remain open.

Report locations and measured coverage are saved in evidence 72 `SUMMARY.md`.
Owner approval authorizes this checkpoint and push with these findings recorded.

## Boundaries

Preserve approved timing, mechanical laws, part identities, materials, lighting,
shaper framing, and suspended callouts. Do not edit protected GLBs or `.scratch`.
Parent owns builds and browser runs; serialize heavy captures and use task-owned
ports. Never treat quick captures as completion evidence. Keep the study runout
residual explicit; do not widen the source tooth region or relax exact-zero gates.
The inherited 66.9 s source-takeover C1 stop and owner visual acceptance remain
open until independently resolved. No deployment is authorized by this review.
