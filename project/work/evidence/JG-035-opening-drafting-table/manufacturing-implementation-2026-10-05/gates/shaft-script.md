# Gates: Shaft story data, card sampler and DOM card layer

Scope: tool-independent shaft story pieces per ../shaft-script-spec.md. Producer GLM-5.3 stopped at the Z.ai usage cap; parent (Anthropic claude-opus-5-5) completed the leaf: removed an unused test import (typecheck), corrected the chapter-1 transcript to the owner's causal reason (chip clearance past the face end), replaced viewport-scaled fonts and nonzero letter spacing with fixed sizes (34/30 px desktop, 24/22 px narrow; Barlow Condensed display), and fixed two harness bugs (unescaped rgb() regex produced NaN contrast; alloy-only capture moved 16.5 -> 15.8 s because the stamp correctly lands at 16.16 s).

- [x] S1: Exact strings and order; attribution and captions present at the right times.
  EVIDENCE: script.ts SHAFT_CARD_TEXT/SHAFT_STAMP_TEXT/caption constants; script.test.ts codepoint assertions (ASCII U+002D hyphens, U+2014 em dash). verify-shaft-script.mjs PASS at t=15.8/17.5/21/33.5/12 both viewports.
- [x] S2: Timing constraints proven by dense sweep.
  EVIDENCE: attempts 15-17.8, 17.8-20.3, 20.3-22.6; fade 0.14, readable 1.02 s >= 1.0, impulse 0.15 s <= 0.18, settled >= 0.83 s >= 0.8, 0.02 s gap; cool scan 32.8 = withdrawal 32.0 + 0.8; final card 33.2-35. script.test.ts 1/240 s sweep: 16/16 PASS.
- [x] S3: Closed-form, seek-deterministic, allocation-free sampler; reduced motion removes impulse/scan motion.
  EVIDENCE: sampleShaftScript writes only to caller-owned frame; shuffled-seek and same-object tests in script.test.ts PASS.
- [x] S4: DOM contrast, layout at both viewports, polite discrete announcements, transcript gloss; zero console errors.
  EVIDENCE: node project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shaft-script/verify-shaft-script.mjs --url=http://localhost:5199 -> "shaft-script verifier: pass; 10 captures, sweep changes 15 (expected 15), console errors 0". Screenshots desktop-t17_5.png, narrow-t33_5.png inspected by parent.
- [x] S5: Nothing registered or mounted in the app; typecheck and tests pass.
  EVIDENCE: rg finds registerStory only for ring (InspectionScene.tsx:13) and tests; ShaftStoryLayer imported nowhere in src. npm run typecheck exit 0.
- [x] S6: Fresh different-provider review of actual source/evidence.
  EVIDENCE: DeepSeek (deepseek-flash via codex exec, read-only) SHIP: ../shaft-script/independent-review-deepseek.md; independent 1/240 s sweep confirms readable 1.025 s, impulse 0.150 s, settled 1.333/1.033/0.833 s, warm gone by 25, cool at 32.8. Its three minor notes: per-call for...of iterator replaced with an indexed loop; duplicate polite announcement at stamp 'in' removed (status updates only when announced text changes; harness now counts text changes: 12/12 PASS, console errors 0); stamp animation keyed per card retained (restarts per card as intended). Shaft tests 16/16 after edits.

Coupling recorded for G5: hob withdrawal must be complete by 32.0 s so the 0.8 s unobstructed runout hold precedes the 32.8 s cool scan.
