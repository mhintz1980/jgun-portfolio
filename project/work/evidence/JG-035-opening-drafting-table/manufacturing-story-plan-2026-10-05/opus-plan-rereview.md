# Opus-5.5 plan re-review — JG-035 manufacturing stories

Date: 2026-10-05. Reviewer: claude-opus-5-5, bounded re-review of `docs/jgun-manufacturing-inspection-plan.md` lines 47–62, 78–80, 97–107 and 148–152. The prior fix-first report, `opus-final-plan-review.md`, is preserved unchanged.

**PLAN VERDICT: ship.** The plan is ready to implement. This is not runtime, visual or owner approval.

**Remaining blocking findings: none.**

**B1 is resolved.** Lines 53–56 and 78–80 meet each part of the earlier finding:

- They name the hashed legacy `Default.glb` occurrence and the isolated grooved source, and require checking that the two correspond.
- They define a derived blank with stock restored to the measured tip OD.
- They add offline partial-depth and full-depth states driven by engagement, with chips only in the current cutting region.
- The first quarter orbit shows only the region actually worked.
- The 11–15 s recap brings back the same deterministic camera follow, with an explicitly time-compressed completion or a captioned time skip.
- All ten teeth match the source before the first card.

G2 owns the new assets, and G4 verifies stock removal, that no finished slot gets cut, and that the completion is honest under both seek and playback.

**B2 is resolved.** Line 103 builds the finale in an inspection-local assembled root that does not depend on the entry stage. It prefers inspection-owned clones. Where narrative objects are reused, it leases their full transforms, visibility and materials and restores them on exit. Line 105 adds the round-trip assertions for exploded entry and for blueprint entry, plus a snapshot of background, lights and post effects. The shot list (line 62) and G2 (line 149) carry the same assembled root.

**Non-blocking notes for implementation:**

1. At 0–2 s, swap the toothed narrative shaft for the grooved blank while it is hidden or fully masked by the fade, so teeth never visibly vanish.
2. The 11–15 s compressed recap raises the stroke rate. Run the plan's existing strobing and display-rate checks on this beat at the 30 fps lite floor.
3. The cutter engagement that drives the shaping states depends on G0 cutter data. If the illustrative cutter's tooth count or ratio changes, rebake those states.
4. I did not re-read the card list in this bounded pass, so the switch to exact ASCII hyphens is unverified here. The G6 card-content assertion should check that the characters match exactly.
