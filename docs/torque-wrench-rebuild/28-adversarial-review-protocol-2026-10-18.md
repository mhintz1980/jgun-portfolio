# Adversarial review protocol - lightning cracks + cavernous portal (JG-038, 2026-10-18)

Reviewer role: independent, READ-ONLY, adversarial. Your job is to try to FAIL the work against a high visual standard,
then report honestly. You did not author it. Edit nothing; no git commit/push; do not touch .scratch or protected assets.
Reviewer #1 = GPT-6.1-Sol/High. If the work fails and Astra retries, reviewer #2 = Gemini-4-Argon with the same protocol.

## Inputs (absolute paths; no searching needed)
Repo: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench. Rubric and blockers: docs/torque-wrench-rebuild/27-astra-lightning-portal-brief-2026-10-18.md section 6.
References (view them first): docs/torque-wrench-rebuild/references/2026-10-17-owner-corrections/
  R3 01-paper-webbing.png (electrical look) | R4 cavernous-pit-should-llok-like-this.png (cavern) |
  R7 codex-clipboard-cc93b69b-01e6-4f38-af35-4a88919652c9.jpg, R8 codex-clipboard-e9daf951-475c-45c7-bd69-3ae476d557e7.jpg (fracture geometry) |
  R2 profile-view-cracks-low-quality-wrong-color.png and R5 shattered-glass-wrong-color.png (REJECTED looks the work must not resemble).
Candidate frames: output/playwright/jg038-lightning-20261017/astra-final-NNN.png (NNN = scroll fraction x 1000) and the author's report.
Baseline for before/after: base-340.png, a-*.png, b-*.png in the same folder.

## Procedure
1. View every reference, then every candidate frame. Compare R3 vs lightning frames, R7/R8 vs the web, R4 vs cavern frames at the same
   magnification; zoom/crop into regions when judging (view_image detail original).
2. Authenticity: confirm the frames were produced from the current source (file times newer than the last edit of the owned files; run
   git status / list timestamps). If you capture your own frames, use a separate port (Sol 5301, Argon 5311):
   npm run build is NOT needed if dist is current; start npm run preview -- --host localhost --port <port> --strictPort as an open exec session,
   then TW_BASE=http://localhost:<port> node output/playwright/jg038-lightning-20261017/frames.mjs review-<name> 0.28,0.295,0.31,0.33,0.34,0.36.
   Do not use port 5281 (owner review) or 5291 (author).
3. Run mechanical gates: npx tsc --noEmit; the vitest list in brief section 5; confirm no console errors in the capture index JSON.
4. Hunt for failures: smooth drawn-arc cracks, plastic/neon filaments, whitened cores, uniform line width, flat slate cavern, missing lip relief,
   visible desk through the aperture, visible flat bottom/closure disk, glass-coloured or dark shards, black wedges, z-fighting, popping between
   consecutive frames, hairlines outside the profile, reduced-motion/poster regression (snapshot via the harness if cheap).
5. Do NOT accept telemetry or the author's claims in place of what you see in the frames.

## Verdict format (reply exactly in this shape)
VERDICT: PASS | FAIL
Scores (1-5): lightning=_, topology=_, cavern=_, shards=_, continuity=_, overall=_ ; mean=_
Blockers found: <list or none>
Evidence: <frame file names + what you saw, per axis, concrete>
Mechanical gates: tsc=<ok/err>, tests=<n/n>, console errors=<none/list>
If FAIL: the three most valuable specific fixes, ranked, each with the target frame and the reference relationship it should match.
PASS requires every axis >= 4, mean >= 4.3 and zero blockers. Reviewer pass is a quality gate, not owner acceptance.


## Amendment 2026-10-18 (late): reviewer roster after the Argon handoff
Argon (previously reviewer #2) is now the AUTHOR of the next fix set, so it cannot review it. The formal gate for that set is: reviewer A = GPT-6.1-Sol/High, reviewer B = Claude Opus 5.5/High (anthropic/claude-opus-5-5), same protocol, same rubric (doc27 section 6), candidate frames argon-final-NNN.png, author report argon-fix-report.md, reviewer ports Sol 5301 and Opus 5311 (Argon uses 5321, owner 5281). B runs only if A passes or if the owner asks for a second opinion; if either fails, STOP and alert the owner. Reviewers must check the Argon fix list items A-D and the Keep list from the handoff.

## Amendment 2026-10-18 (later still): timing check
Reviewers additionally verify Fix E: run node output/playwright/jg038-lightning-20261017/timing.mjs <from> <to> <step> <tag> on their own port and confirm lights-out (lampPower <= .03) to first burst <= .008 of the document, 3-4 bursts, visible holds, and web starting right after the last burst; judge the feel (earthquake / thin-lake ice) from matched frames at the new crack fractions. Skills: reviewers may read webgl-telemetry-verifier for the mechanical gate only.
