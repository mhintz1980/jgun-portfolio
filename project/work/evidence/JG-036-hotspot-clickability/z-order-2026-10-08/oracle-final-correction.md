# JG-036 oracle final correction — implementation record

Ownership: `scripts/verify-jg036-hotspot-layering.mjs` + this record + static-only report only. Product source untouched; no GPU/browser run (owner stills gate).

## Correction 1 — exact authored inspect-goal oracle

- `sourceContract` retains the esbuild-bundled authored caseStudies module (`dataModule`); the runtime oracle uses its `EXPLODE_OFFSETS.handle`, `framingBiasVec`, and `HOTSPOTS` — no drift-prone duplicates.
- `authoredInspectGoal` models CameraRig §6–§7 from measured scroll progress, measured explode factor, and viewport aspect: rotor z += `EXPLODE_OFFSETS.handle·explode`; portrait dolly/FOV ramp `1+w(1+0.8·ch4)`, `fov+10·w` (w = smoothstep(clamp((p−.5)/.06)); ch4 ramps .76→1.00 over .24); framing bias = authored `framingBiasVec(p)` × flightAtt (windows .53–.598 / .722–.758; ×.25 portrait) × afterIntro (releaseEnd .12 over .03), applied along `left = normalize(fwd.z, 0, −fwd.x)` with meters `bias·dist·tan(fov/2)` (×aspect for x; −Y portrait).
- Authored dolly is computed independently and asserted against telemetry (`dollyDelta ≤ .001`); the position unwrap divides the telemetry goal around the pre-bias authored pivot using the authored dolly — no telemetry tautology.
- Tolerances after exact wrappers: target ≤ .01, fov ≤ .01, position ≤ .045 (residual budget: pointer parallax ≤ .036, rotor rest-orbit ≤ .006). Failure reasons name the failed term.

## Correction 2 — scoped HUD card oracle

- Card text comes from the Close button's selected detail container (`ancestor::div[2]`, TechnicalHUD card root) and asserts keeper label, authored `HOTSPOTS.detail`, and `OCCURRENCE: <occurrence>`; body text is no longer used.

Preserved: native actionability clicks, DOM-derived chapter control, Enter+Space with computed focus ring, pinned-pointer/progress exit baseline, extra-badge census.

## Receipts

- `node --check` PASS (final file state).
- Genuine `--static-only --label=oracle-final-correction` PASS, exit 0; report: `oracle-final-correction-1791509320293-verification-report.json` (SHA-256 `8DC2D7916A6E1B28EC7792C89ACAB84C989E7A25EBD25C3B2B1B133DCA01F283`). Stale pre-fix static report removed.
- Verifier SHA-256: `95A73C1418158D9AE530A98FA8B88382D042FE3D3F255BAE763FFEF0F234B314`.
- Runtime sign-off intentionally unclaimed — ready for fresh independent review.
