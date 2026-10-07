# Handoff — JG-035 blue-trace / rock-tunnel portal direction

2026-10-03, America/New_York. Status: owner direction received; NO implementation, NO concept media, and NO repo source changes were made this session. Worktree: C:\Users\Markimus\.buzz\REPOS\jgun-portfolio (always the realpath; C:\Projects\jgun-portfolio is a junction and breaks production builds). Branch: codex/jg033-signature-shot. Large uncommitted JG-035 drift already exists from earlier sessions — inspect live git status and preserve it.

This direction revises the look delivered by the portal correction handoff at project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/handoff.md and docs/jgun-portal-correction-plan.md. That packet's machine verification (276/276 tests, 6/6 roster, zero desk pixels) remains historical fact, but the owner has now rejected the current look in six specific corrections. Old handoffs are context only; verify every claim against the live tree.

## Owner direction (2026-10-03)

1. After the lightning outline, the interior of the profile view on the drawing is bright white. That is wrong: the lights are out, and the interior must read like the rest of the sheet — cream vellum paper, no internal glow.
2. The only light source is the outline trace itself, and it should carry a blue tint.
3. The webbing the trace makes across the view must be more pronounced and read light blue.
4. The hole that remains currently shows an empty space plus a planar object in the background. Replace both with a deep tunnel — deeper than the viewer can see, like a hole made through rock. Nothing void-like or desk-like/planar may terminate the view.
5. The tunnel walls should have cracks that glow the same light blue as the profile outline trace and the paper webbing.
6. The overall read must be an obvious doorway to another realm or dimension.

## Required sequence — concept first, build only after owner approval

Phase 0 is mandatory and comes before any code changes. The owner explicitly asked for generated preview media first.

1. Invoke the repo-local higgsfield-generate skill (.agents/skills/higgsfield-generate/SKILL.md) and use the Higgsfield CLI to generate concept stills and/or a short video of the corrected sequence. Suggested coverage:
   - Pre-rupture sheet: interior matches paper tone (lights out), blue-tinted outline trace, pronounced light-blue webbing across the view.
   - First rupture: a tunnel mouth in rock — no empty void, no planar background object.
   - Deeper look: tunnel walls with glowing light-blue cracks; depth that visibly exceeds what the camera can resolve.
   - Motion beat: trace, then webbing, then rupture, then the tunnel doorway.
2. Save outputs under concept-media/ inside this evidence folder and present them to Mark for review. Prior project Higgsfield usage notes live in project/work/evidence/JG-035-opening-drafting-table/handoff-2026-09-27b-higgsfield-mcp-live.md.
3. Do NOT begin implementation until Mark approves the concept. This review gate is the owner's instruction for this revision.

## Reconciliation question to settle during concept review

The 2026-10-02 correction deliberately made the J-Gun immediately visible and lit beneath the first rupture. The new direction says the profile interior stays paper-dark, with light coming only from the blue trace and webbing. When presenting the concept media, confirm with Mark whether the metal reveal now waits for the rupture beat, or stays immediate but unlit/blue-lit. Do not silently change the causal ruling either way.

## Candidate locations (verify live; taken from the current dirty tree)

- src/scene/drawing/sheet/lightning.ts — outline trace color/intensity; needs the blue tint to become the sole light.
- src/scene/drawing/sheet/breakthrough.ts — web apertures, backlight, printed stock; prime suspect for the bright-white profile interior.
- src/scene/drawing/sheet/portal.ts — current five wall levels, opaque floor at -0.32 m, white/blue fissures and bounce; needs a rock-bore tunnel with greater perceived depth and light-blue-only crack glow. Remove any read of a planar terminator or empty void.
- src/scene/drawing/DrawingLinework.tsx — integration of stock, backlight, portal, and probes.
- src/scene/drawing/introTimeline.ts, extractionPose.ts, TorqueWrenchHero.tsx — only if the reconciliation decision moves timing or emergence.
- scripts/capture-jgun-breakthrough.mjs and scripts/verify-jgun-opening.mjs — extend for the new pixel and telemetry gates.

## Verification gates after implementation

- Pixel and telemetry probes (never vision alone): profile-interior luminance matches paper tone with no bright-white band; trace and webbing hue fall inside the blue target and webbing coverage is measurably more pronounced; aperture samples show tunnel-wall coverage with zero desk contribution and zero planar-background contribution; crack glow appears only on tunnel walls.
- node scripts/capture-jgun-breakthrough.mjs --url=http://localhost:4173 --out=<new-folder> and node scripts/verify-jgun-opening.mjs --url=http://localhost:4173 --out=<new-folder>. --quick is iteration evidence only; the full six-case roster is done evidence. Restart the :4173 preview after EVERY rebuild.
- Repo gates: npm run typecheck, npm test, realpath npm run build, B1/B2 contract, npm run check:station2; cover full/lite and reduced-motion paths.
- Owner visual acceptance is a separate, required gate. Machine PASS does not close JG-035.

## Session-start notes

- Read AGENTS.md, TODO.md (JG-035 header), project/README.md, and project/context/architecture/animation-spec.md §5–5.4 before work.
- A Vite dev server may still be serving http://localhost:5173 from the 2026-10-03 Codex session; production verification still requires a freshly restarted :4173 preview.
- Never stage .scratch/, .tmp-probe/, or .mimosa/. The codebase-memory graph predates these edits — rely on live source, not graph completeness.
- If a plan doc is created for this revision, save it under docs/ with checkboxes and keep it current, per the owner's standing JG-035 workflow.

## Suggested skills

- higgsfield-generate — Phase 0 concept stills/video via the Higgsfield CLI.
- webgl-telemetry-verifier — runtime probes and programmatic pixel comparisons.
- r3f-scroll-performance-guard — timeline/scroll-share and performance budgets.
- glsl-transition-shader-pipeline — shader work on trace, webbing, tunnel glow, and crack light.
- context-mode — keep large command and capture output out of the main context.

