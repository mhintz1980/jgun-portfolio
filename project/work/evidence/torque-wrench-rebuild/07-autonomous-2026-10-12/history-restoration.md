# Stage 2 history-restoration observation — 2026-10-12

Parent ran `.scratch/probe-jg038-history.mjs` on fresh build d, installed Chrome
headless, 1440x900 DPR1, private localhost5278. Native seek -> navigate to same-site
favicon -> goBack. Default and unload-handler contexts both restored scrollY24865,
progress0.6300040539170974 and exact stateKey/beat/phase to pre-navigation values.

Both observed pageshow persisted:false. This is actual non-BFCache back-navigation
proof; the default eligible setup did not produce persisted:true, so BFCache runtime
proof remains unestablished. No fake pageshow/browser state or store setter was used.
Do not label eligibility configuration as actual BFCache proof.

Full d timeline verifier:17/17PASS. Following final stale-callback guard, focused
conductor/wrapper tests24/2filesPASS, TypeScript exit0. Build e/final roster pending.
