# JG-035 — Blue trace and rock tunnel revision

2026-10-03. Status: implementation and runtime review stills complete; static and aperture pixel gates pass; full runtime acceptance remains open because browser verification encounters quality fallback/canvas retirement.

Authority: `project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/handoff.md`.

- [x] Read handoff, task queue, project protocol, skill map and animation context; inspect live dirty tree.
- [x] Confirm Higgsfield authentication and live GPT Image 2.5 schema.
- [x] Generate three reference-based concept stills: intact paper/webbing, first rupture, deep rock tunnel. Four outputs including a corrected rupture revision.
- [x] Inspect concept fidelity and save media, prompts and generation records in the revision evidence folder. See `concept-media/review.md` for retained limitations.
- [x] Resolve emergence timing from owner markup: model breaks through at first rupture; shaft is revealed only once model rises clear.
- [x] Re-render approval stills from owner feedback: intact paper, model-driven first rupture, near-vertical extruded-outline shaft with no visible bottom. Saved and inspected in `concept-media/feedback-rerender/`; review records two located feedback files and missing third.
- [x] Owner approved revised effects in chat: model-first rupture and near-vertical outline shaft.
- [x] Correct P003068 Ring Switch: heavy diamond knurl over entire outer diameter, 6061-T6 black anodize matching handle, preserve pins/fasteners and mechanical behavior. Material tests and runtime normal map / 4,292 UV vertices recorded.
- [x] Move five drawing callouts per owner screenshots: output spindle and GD&T above-left; gearbox, clutch housing and ring switch in evenly spaced lower-left staircase with parallel leaders and correct anchors.
- [x] Move Air Motor above-right and expose the actual assembly through an oval local cutaway; move the profile FCF below the clutch label and share its feature leader while preserving .004 A|E.
- [x] After concept approval, implement cream paper interior, blue-only trace/webbing, deep irregular rock walls and matching crack light.
- [x] Add shaft wall/floor/model/desk null comparisons and blue/white pixel telemetry. Four fresh aperture frames pass with no desk/floor/neutral-white shaft pixels; paper/webbing stills are ready for owner review.
- [x] Verify typecheck, 288 unit tests, realpath build, 31/31 B1/B2 contract and Stage 2; restart preview after rebuild.
- [ ] Run quick iteration capture, then fresh full six-case roster covering full/lite/reduced motion.
- [ ] Obtain independent technical review and separate owner visual acceptance; update matching canonical docs.

Preserve pre-existing changes. Generated stills describe appearance; they do not establish runtime correctness. Owner markup settles model-first emergence and chat approves effects. Runtime implementation review remains open. No commit, push or deployment requested.

Final still/pixel packet: `project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/drawing-review/`.
Owner follow-up corrected the Clutch Housing leader off the Ring Switch and moved its text/FCF together to the green markup box. Version-4 cache roundtrip, production build/typecheck and updated drawing still pass. This placement supersedes the earlier evenly spaced clutch label; broader runtime failures remain open.

2026-10-04 placement follow-up (`drawing-callouts-cutaway-FEEDBACK-1.png`):
- [x] Move Output Spindle below-left of the spindle, housing farther left/below, Clutch Housing below-left again, and Ring Switch lowest with its label to the right of its elbow; match all four marked endpoints inside their respective parts.
- [x] Preserve part numbers and GD&T; keep the output frame above-left independently of its relocated label and move the clutch frame with its label.
- [x] Bump/regenerate the drawing cache, build, start fresh preview, and capture drawing-only runtime evidence with placement telemetry. Version 5 exact HTTP roundtrip, production build/typecheck, 31/31 B1/B2, Stage 2 and settled capture pass. [Placement evidence](../project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/drawing-review/feedback-1-2026-10-04/review.md). Broader runtime acceptance remains open.
Full runtime attempt: `optimized-runtime-roster/` in the same evidence folder. Do not treat earlier aborted `verified-*`, `runtime-roster-final` or `callback-check` runs as passing verification. Browser callbacks now have a bounded wait. Covered shaft meshes wait until pressure and render after opaque stock to avoid unnecessary shading.
