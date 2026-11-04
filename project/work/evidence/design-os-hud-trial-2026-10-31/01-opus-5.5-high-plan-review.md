# Plan review — Design OS HUD direction trial

Reviewer: claude-opus-5-5, at the parent's requested configuration "Opus 5.5, High effort". This file records the requested configuration only; it does not prove the effort level used at runtime.
Date: 2026-10-31
Reviewed draft: `project/work/inbox/design-os-hud-trial-plan-2026-10-31.md`, "Draft v1, awaiting the requested Opus 5.5 High critique" (124 lines). Line numbers below (L##) refer to that version.
Also read: owner policy `project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md`, source review `project/work/inbox/design-os-review-2026-10-31.md`, evidence 74 `SUMMARY.md`, focused source greps (`TorqueInspectionOverlay.tsx`, `RuntimeWorld.tsx`, `Scene.tsx`, `.gitignore`, verifier scripts), and the parent's scout notes on existing captures and Design OS memory behavior.
Scope: plan critique only. No installer, build, browser, server or package command was run. No plan, handoff, TODO, instruction or source file was edited.

## Verdict

**Revise before execution.** The plan sets the right boundaries. It keeps the owner decision open, isolates the tool, is honest about causality and preserves FAIL/deferred history; keep all of that. It is not yet actionable as written, for three reasons:

1. The motion comparison has no feasible capture method and no definition of "normal speed" for a scroll-driven scene.
2. The current HUD is partly anchored to 3D parts, so concepts built over flat frames cannot be compared fairly without per-frame anchor data.
3. The deliverable set (24 stills, 8 videos, executable prototypes with keyboard/focus/reduced-motion checks, CLI checks, critic, manifest) does not fit the stated 2.5–3 hour budget and exceeds what the owner policy asks for in a first concept round.

None of these blocks the trial, and each has a small fix.

## Findings, prioritized

### P1 — Motion comparison is underspecified and probably infeasible as budgeted (Phase 0 L65, Phase 2 L89, budget L91)

The torque scene is scroll-driven. "Normal-speed" and "playback rate" (L65) have no meaning until the plan fixes an assumed scroll velocity (progress per second) for the chosen interval. The existing seek interface (`window.__torqueNarrative` / `scrollFraction`, used by `verify-torque-camera-hud.mjs` with a 15 s seek timeout) supports deterministic frame stepping, not real-time recording. A real-time screen recording of WebGL on this machine would have uneven frame pacing and could not be reused bit-identically across conditions. L89 already asks for one compositor, which implies a frame sequence, but nothing says how to produce it.

Minimal fix: in Phase 0, define the clip as a deterministic PNG sequence. Choose the progress interval and an assumed scroll rate, seek per frame at a fixed fps (24 is enough), capture clean frames and encode them with the local `ffmpeg` (present via WinGet). Record whether any bullet-time component depends on wall-clock time. If one does, frame stepping will not reproduce what a visitor sees, and the manifest must say so. Budget about 240–300 frames per viewport, and time the seek settle on the first 10 frames before committing to both viewports.

### P1 — Anchored callouts make concept-over-frame comparison unfair without anchor tracks (Phase 0 L64, Phase 2 L83–L89)

The current overlay (`TorqueInspectionOverlay.tsx` L223–L250) contains hotspot cards, SVG leader lines and reticles that follow projected part positions every frame, plus a shaft HUD. A static HTML concept laid over a clean frame or clip cannot place a part label or "details on demand" against the moving part. Two biases follow. Concepts drift toward edge-only text because that is all the builder can place, and the comparison quietly favors whichever direction avoids part anchoring over whichever reads best.

Minimal fix: when capturing each clean still and frame, also export the screen-space anchor positions the runtime already computes. Read the card and reticle rects, or the projected hotspot points, into `anchors.json` keyed by frame. Concepts that show part context must consume that track. If the export is not cheap, state the limitation in `brief.md` and in the critic prompt.

### P1 — Deliverable volume exceeds the budget and the owner policy's ask (Owners/deliverables L44–L56, Phase 2 L87–L89, Phase 3 L95–L98, budget L91, completion L111)

The owner policy asks for "a small set of visually understandable concepts" shown as "images of representative frames" before a large build. The plan asks for all of the following within roughly 90–120 minutes of concept and packet work:

- 18+6 stills and 6+2 videos;
- executable prototypes covering disclosure, focus, longest label, loading state, keyboard, reduced motion and console errors;
- upstream lints and `look`;
- a separate critic and a decision file.

That does not fit. Through the L91 escape hatch ("strongest honest partial packet"), a partial trial becomes the likely outcome by design, which makes the L111 completion criterion misleading.

Minimal fix: tier the completion criteria.

- **Required for Mark's choice:** 3 concepts plus control over the 3 states at both viewports (24 stills), one comparison sheet, one desktop motion clip per concept plus control (4 clips), a short rationale per concept, the critic, the provenance manifest and the tool-utility notes.
- **Optional or deferred to post-selection:** narrow-viewport clips, executable keyboard/focus/reduced-motion behavior, longest-label and loading-state checks. These belong to the selected direction's production intake, where they matter. For the concept round, one static frame per concept with disclosure open and one with it closed is enough.

With tiers in place, "partial" carries meaning.

### P2 — State selection does not match available scene states (Phase 0 L63)

"Assembled overview, busy exploded assembly, close inspection/readout" are abstract categories. The parent's scout found real captures at progress .418 (opening), .735 (shaft inspection/FEA) and .940 (exploded drivetrain) for both viewports, already used by evidence 73 and the lightweight verifier. "Assembled overview" may not correspond to any stable progress point. The shaft inspection also has its own continuation domain (`InspectionDirector`, `inspectionPlayback.seek`).

Minimal fix: name these three progress points as the defaults, record which progress/time domain each uses, and allow substitution only with a recorded reason. The existing HUD-baked PNGs are reference only; re-capture both the clean and HUD frames in the same run so the control and the concepts share pixels.

### P2 — HUD suppression can change scroll mapping (Phase 0 L64)

The plan says "reversible browser-only suppression" without saying how. Applying `display:none` to in-flow page elements (chapter text, nav, the WIP label) can change document height and the scroll-to-progress mapping, so "same progress" stops meaning the same camera. `RuntimeWorld.tsx` L770–L795 also injects a free-look button into the canvas host.

Minimal fix: suppress with `visibility:hidden` or `opacity:0` from a capture-only injected stylesheet. Assert that `__torqueNarrative.snapshot().progress` and the canvas size are identical with and without suppression for each state, and record the selector list. Keep the direct `gl.render` beauty path out of the comparison: the scout noted that `grooveCapture().beauty` bypasses the postprocess chain.

### P2 — Build identity step should be concrete (Phase 0 L62)

Evidence 74 records a reproducible bundle fingerprint, `3585205b145f73daff2354bb2ce9fbc19efb47c875c1ceed9c77e997027d3a6b` (sorted-file SHA-256; the algorithm is in that SUMMARY), built from `ccb215b2` plus dirty state. The working tree has kept changing since then.

Minimal fix: compute the fingerprint of the existing local `dist/` with the documented algorithm.

- If it matches, capture from that bundle via the preview server and call it the published build.
- Otherwise, capture from current source as a new named baseline and record `git status` and HEAD.

Do not rebuild `dist/` only to capture. If a rebuild is required, note that it overwrites the local copy of the published bundle, and follow the `AGENTS.md` rule to restart the :4173 preview server after every rebuild.

### P2 — Design OS isolation needs concrete settings, and folder location matters for Codex (Boundaries L34, Phase 1 L73–L79)

L34 places Design OS init in "a disposable subfolder of the trial", which is inside the repo's `.scratch/`. That causes two problems.

1. Codex and other harnesses load `AGENTS.md` files along the path from the repo root to the working directory. A generated `AGENTS.md` inside the repo tree would be loaded by any builder or subagent whose cwd is that folder, which is exactly what L74 is trying to prevent.
2. The parent confirmed that upstream memory autorecord writes to the nearest `design/` directory based on the target artifact path, not the cwd. Prototypes in `.scratch/…/concepts/` that are checked by a command initialized elsewhere can still have memory written beside them.

Minimal fix:

- Run `ui init` and all package commands in a folder outside the repo, for example `C:\Projects\scratch\design-os-trial-2026-10-31\`, with `EASE_DESIGN_HOME` set to a subfolder there.
- Copy the prototypes into that folder before running lints or `look`, then copy the results back.
- Record a before/after directory listing for each command in `trial-log.md`.
- Keep the builder's cwd in the repo trial subtree, which contains no generated `AGENTS.md`.

Related: `look` likely needs a Playwright browser. A browser download counts as installation under the L77 stop rule (30 minutes or two failures); say so explicitly.

### P2 — Tool-utility assessment targets the CLI and under-measures the likely value (Phase 1 L77, Phase 3 L100, Phase 4 L105)

The source review rates concept definition and the builder/critic split as **High** value, and the lints as **Medium** and narrow. The plan spends most of its tool effort on installation and CLI checks, then defines reference-only use as "not a successful CLI adoption trial" (L77). That is accurate, but the verdict could end up driven by npm/Windows friction when the useful part is Markdown workflow material.

Minimal fix: name four observable questions in `decision.md`.

1. Before the concept template, the builder writes a 5-minute brief. Did the template change that brief or the concepts?
2. Did `look` or the lints find any real prototype defect? Count true and false positives.
3. How many minutes did setup and adapter friction cost?
4. Which named installed skills does it duplicate?

That gives an honest utility record without the controlled experiment the plan rightly declines.

### P2 — Owner direction intake and concept ownership (Purpose L11, Phase 2 L85)

The owner policy says "Mark supplies general direction, then agents present a small set of visually understandable concepts." The three hypotheses come from the Design OS review, not from Mark. The plan calls them "starting hypotheses", and no pause is required, but the handoff gives Mark no opportunity to add a reference or drop a direction before 2–3 hours of work.

Minimal fix: at session start, the receiving session asks one optional multiple-choice question covering a reference, a direction to drop and a direction to add. It waits about 2 minutes, then proceeds with the stated hypotheses. `brief.md` separates owner-supplied direction (quieter, model-first, the old `main` HUD was too busy) from agent hypotheses, as L84 intends.

### P3 — Durable evidence location and media size (Boundaries L33)

`project/work/evidence/` is not Git-ignored; `output/`, `.scratch/` and `dist/` are. Evidence 74 kept captures under the ignored `output/` and referenced them from its summary. Eight videos plus 24 full-size PNGs could add tens of MB of untracked files, which a later scoped commit could sweep in.

Minimal fix: keep media and prototypes under `output/design-os-hud-trial-2026-10-31/` (ignored and durable on disk). The evidence folder holds only Markdown, the manifest, a compressed comparison sheet and an index, under a stated size cap (for example 5 MB). Preserve the PolyForm Shield notice for any substantial upstream text copied into evidence.

### P3 — Smaller clarity issues

- L60 "Inspect port ownership": name the ports, 5199 (dev, `localhost` only per `AGENTS.md`) and 4173 (preview).
- L72 "Verify that the package contains the required designer materials": list the files actually needed (concept template, designer SKILL, look contract, critique material) so the check is binary.
- L76 and L96 both require upstream static checks; merge them so the work isn't done twice.
- L98 critic: define the critic as a subagent with no builder context. Give it the anchor limitation and the assumed scroll rate so it does not judge the clips as live behavior.
- L107 "Update this plan's checkboxes": append a dated execution note rather than rewriting reviewed sections, so these line references stay valid.
- L111: reference the tiers from the third P1 fix.

## Optional improvements

- Add a cheap fourth reference: the current HUD with content subtracted (same layout, fewer elements). It shows Mark whether he wants "less" or "different", and it makes the tool-attribution caveat concrete.
- Show Mark the comparison sheet first, then the clips. The owner policy's readability procedure (normal size and speed, with a pointer to where to look) applies directly to the clips.
- Log seek settle time per frame on the first run; it decides whether the narrow clips are affordable.

## Keep unchanged

These parts are sound and protect existing work and the owner's choice:

- the separate HUD and tool decisions (L13–L18) and the non-causal framing;
- the boundaries list (L32–L38);
- the rule against overlaying a concept on HUD-baked frames (L68);
- the pinned package and commit with no unpinned fallback (L72, L77), and the stop rule;
- `decision.md` defaulting to "awaiting Mark" (L106).

