# JG-035 portal correction — review

Owner correction dated 2026-10-02. Technically verified: complete six-case browser verification PASS and fresh technical review SHIP. Owner visual acceptance open. Previous paper-breakthrough and storm packets are historical for spatial staging.

The real J-Gun pushes the intact opaque paper from below during .79–.84. The lift is bounded against every source vertex and the same bilinear paper-flex texture used by the shader, including full/lite amplitudes and stock thickness. Illumination completes .81; PBR completes .82. Fracture .84–.88 reveals an already-present lit object that keeps rising to 1. The camera rake remains .79–.89 and perspective starts .90. Storm, cracks, printed thick fragments, burned rim, scroll share .50, reduced park .38 and downstream mechanisms remain.

The wooden desk shader permanently removes the profile. Five descending wall rings and an opaque floor at sheet-local −.32 m enclose cavernous depth behind the initial model, with black strata, white/blue fissures, upward bounce and a deterministic irregular pulse. There is no foreground portal cover between paper and recessed metal.

Production still/motion capture: **desktop and narrow PASS**, including reverse .865/.825/.72, zero console errors and live canvas through handoff. Desktop naturally ran lite; narrow ran full. The pixel witness renders the same scene with the model, portal surfaces and desk hidden individually, using the projected torn aperture minus live stock/rim and a two-pixel inset.

| First rupture .8405 | Model pixels | Portal pixels | Desk pixels inside opening |
|---|---:|---:|---:|
| Desktop / lite | 169 | 12 | 0 |
| Narrow / full | 479 | 62 | 0 |

All six measured phases per viewport (.8405/.845/.855/.865/.88/.92) had zero desk pixels inside the visible opening. At .855 the model fills the visible aperture and no separate portal pixel is exposed. At .88 and .92 both viewports expose portal depth around the emerging object. Portal/model control regions remain unchanged; hiding the desk can change control regions outside the aperture, as expected.

Static checks: parent reran 276/276 unit tests (includes .kilo worktree tests), production build/typecheck, 31/31 B1/B2 synthetic contracts and Stage 2 asset contract after the illumination telemetry addition. The initial quick/dev runs are diagnostic failures and are not final evidence: one lacked illumination telemetry, desktop stepped down to lite, and the first capture reached poster before completing.

Initial read-only review found no blocking scene-code defect but returned fix-first pending fresh complete browser proof. That proof is now complete: all six cases PASS with zero failures and zero console errors. Fresh final reviewer Zeno independently inspected source and completed records and returned SHIP with no blocking findings. No commit, push or deployment.

The first strict roster passed desktop/full, narrow/full and both reduced cases. Its two forced-lite cases disconnected during the initial quality transition before a single opening checkpoint. The verifier now waits for shader warmup plus the initial FPS window and requires a live canvas after forcing lite. The desktop-lite quick retry and full forward/reverse reruns of both forced-lite cases PASS. The full-tier gate and production quality policy are unchanged. The final aggregate references the four successful strict records and two complete reruns from the same build: 344 forward/reverse checkpoints, 96 pinned frames, and two reduced static cases.

Media and machine records:

- [Immediate rupture, desktop](production-capture/desktop/t-0_8405.png)
- [Emerging J-Gun and remaining portal, desktop](production-capture/desktop/t-0_92.png)
- [Desktop motion](production-capture/desktop/breakthrough.webm)
- [Narrow motion](production-capture/narrow/breakthrough.webm)
- [Capture summary](production-capture/summary.json)
- [Verified six-case roster](verified-roster/summary.json)
