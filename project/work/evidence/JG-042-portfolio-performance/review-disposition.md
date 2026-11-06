# Sonnet review disposition

Fresh selected reviewer `anthropic/claude-sonnet-5-5` / high; first delivered review: fresh-review-sonnet-final.md (filename is historical, not a final acceptance label). Parent independently checked findings.

1. **M249/wiring provenance clarified.** `git show 6ec4fe06:build/excludePublicAssets.ts` already exports `['models/m249-transformed.glb']`; vite.config.ts already imports and registers excludePublicAssets(). Exactly four exclusions are NEW; five entries total. No Vite wiring change. Initial review lacked the baseline/config, so this was a verification gap, not an introduced policy change.
2. **Readiness resolution disclosed.** Producer now records readinessObservationResolutionMs 1000 and explains polling + evaluation latency, DOM-only home readiness and document-only home/QM input checks. Old rows have the resolution explicitly recorded in the reviewed summary. No sub-second comparison claim.
3. **Timing exclusions enforced in the machine-readable summary.** paired-baseline/summary.json conservatively excludes the ENTIRE original narrow torque timing group, with reason, excludedReadinessMs and null median/range. Functional valid counts remain 60/60. Raw runs remain untouched. A separate uncontended rerun can provide replacement narrow timing evidence; no performance adoption depends on the affected values.
4. **Attribution corrected.** Snapshot readiness uses 1 s polling. Seek settles narrative first, allowing the runtime's pending .60 world hold until inspection.ready; both clocks are still captured. The old table is explicitly PRE-CORRECTION, and a corrected rerun is retained separately. No old quantitative boot attribution used.
5. **Boot contention removed.** Attribution byte checks run through Node before browser launch, outside the measured window.
6. **Identity strengthened.** Natural rows field renamed preflightIdentity. Cache-condition script verifies entry/scene/Default bytes, fixture cache hash and actual navigated HTML hash. Candidate manifest now identifies committed implementation fff71e0988de6d461c308c4ed8f31813f24329ad and records sourceDiffSha256/source inputs. Baseline/candidate byte array equality proves identical output, independent of source labels.
7. **Status text reconciled.** README, experiment audit and review record reflect completed roster/build/cache diagnostics and owner-approved Sonnet replacement. No pending review is claimed accepted.
8. **Optional corrections.** Duplicate profile/route keys rejected, even-count median corrected and regression tested. Home/QM pixel-response, window-bound latency, absent shader/GPU/power data and the shared fallback outcome for missing/stale are limitations, not fabricated observables. Distinct fixture SHA/version/interception records distinguish missing/stale test inputs; their expected live fallback result is intentionally the same.

Actual isolated-commit checks: npx tsc --noEmit => no errors; seven pure Node files => 41 tests / 41 PASS, 0 FAIL; npm run build => PASS. Later JS-only review fixes require updated pure Node checks; they do not change any product bundle or TypeScript member closure. No full cinematic or performance-budget acceptance is claimed.

## Final follow-up

fresh-review-sonnet-followup.md: **ACCEPT (tooling and exclusion scope)**, no code defect or release blocker; reviewer ran no tools and explicitly qualified pack coverage. This is the second delivered review and the last review round.

- R1: plugin comment now accurately distinguishes the independent M249 launch gate from the local-only plugin test; no new gate behavior.
- R2: initial startup-cache-candidate remains labeled pre-hardening evidence; startup-cache-hardened reruns the exact six functional conditions with entry/scene/model preflight, fixture hash and navigated HTML verification, explicit polling resolution and missing/stale shared-fallback limitation.
- R3: summary now names the author/native patch and exact post-run exclusion rule; the generator's ordinary summary is deliberately distinct from this annotated review artifact. Raw rows remain unchanged.
- R4: review-corrected aa4814b9dd41920542c2b89f190d85a73bfa89eb was checked at exact detached HEAD: no TypeScript errors, 42/42 pure Node checks. Production build and final metadata receipt identify artifact/source separately. The reviewer pack intentionally condensed the full identity JSON; it is not the executable --identity file. The actual full manifest with sourceInputs/files is preserved.
- R5: stale reviewer/status labels reconciled; preflightIdentity naming corrected. Corrected attribution's position-match statement comes from the parent's inspection of recorded checkpoint values, not an additional assertion in capture-portfolio-attribution.mjs. Replacement narrow torque run completed 10/10 valid and is retained separately.

No third review is claimed. No review grants deployment/publish authorization. Original FAIL/partial observations and unresolved measurements remain explicit.
