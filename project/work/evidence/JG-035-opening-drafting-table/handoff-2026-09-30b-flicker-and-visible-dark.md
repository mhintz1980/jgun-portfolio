# JG-035 handoff — 2026-09-30b (more storm flicker; visible dark, not pitch black; scroll budget freed)

> **Status 2026-10-01: implemented and verified; this handoff is now historical.**
> The five-dip storm flicker, visible-dark state, .50 scroll-share pacing and
> track repair landed in the working tree, passed 169 tests, the 6/6 six-case
> browser roster and 19/19 full-tier pixel checks, and were committed and
> pushed to `origin/codex/jg033-signature-shot` at `e5fec59` (2026-10-01).
> Open items — narrow full-tier motion recording, owner visual acceptance and
> the X-ray ruling — are carried in the current handoff:
> `storm-pacing-2026-10-01/handoff-2026-10-01.md`.

Supersedes `handoff-2026-09-30-blackout-emergence.md`. That work is now
**implemented and fully verified** — keep it only as the record of what was
built. This handoff carries Mark's 2026-09-30 review direction after he watched
the running preview.

## Mark's direction (review of the live preview, 2026-09-30)

1. **"This looks good but not exactly what I had in mind."**
2. **More flicker.** The lamp should flicker *more* before it goes out —
   "think scary movie on a stormy night." The current pair of dips is too
   polite; he wants a longer, more erratic, unsettling pre-out stretch.
3. **Not pitch black.** The dark state must go darker *but leave the drawing
   visible* — get dark enough that **the white lightning pops off the page**
   instead of running against bright paper in desk-lamp light. The point is
   contrast for the trace, not a blackout screen.
4. **Scroll budget is freed.** The enclosure and M249 chapters are being split
   onto separate pages, so this page no longer has to preserve their scroll
   length. Go all out on this opening: more dwell, more beats, more absolute
   scroll where it helps.

## State of the tree (verified this session — nothing pushed)

Branch `codex/jg033-signature-shot`, uncommitted, preview running on :4173.

Gates all green on the current source:

- `npm run typecheck` 0 · `npm test` **148/148** · `npm run build` ✓
- `node scripts/check-b1b2-contract.mjs` 24/24 · `npm run check:station2` ✓
- Opening harness **full 6/6** (desktop, narrow, both reduced, both forced
  lite) — `project/work/evidence/JG-035-opening-drafting-table/blackout-emergence-2026-09-30/full/summary.json`;
  quick 2/2 in the same folder.
- Lightning pixel proof (normal vs null trace, same camera, offscreen RT):
  **717 changed bright px / 1440 contour px** desktop, 530/1046 narrow,
  `lampPower 0`, `pulse 1`, zero console errors, shader linked.
- Peak bulge **12 mm** full / **5.4 mm** lite; registration **0 px** at the .70
  hold; contact shadow present at lift, zero at release.

What was built (see §5.0 table + `docs/jgun-blackout-emergence-plan.md`):
registered lit hold to .40, two-dip flicker .42→.48, dark hold .48→.56, white
geometry-derived electrical trace .56→.70, lamp return + bulge .70→.78, metal
presses through .72, extraction .78→1, perspective .84. Scroll-reversible;
reduced motion parks at the lit .40 registered still.

Owner shift-fix context: the reading-lamp pool (suppressed .25→.30) and
intro-frame bloom (set to 0 during the intro) were removed to stop the paper
brightening under the camera settle. Baseline report:
`project/work/evidence/JG-035-opening-drafting-table/pre-pulse-shift-2026-09-30/report.md`.

## What to change next — exact locations and current values

### 1. More storm-flicker

`src/scene/drawing/introTimeline.ts`

- `INTRO_PHASES.flickerStart .42`, `blackoutStart .48` — a 0.06 window is one
  pair of dips. With freed scroll, widen the window (e.g. .40→.54) and add
  more beats.
- `lampFlickerPower()` (~line 131) currently returns: dip to **0.62**,
  recovery **0.92**, dip to **0.22**, out. Suggested direction: 4–6 dips with
  alternating deep/shallow minima, one near-out hold that lasts a beat longer
  than the others, then the final out. Keep it a pure function of `t` — no
  clock, no random, so reverse scroll retraces exactly (repo rule; the
  verifier samples these values deterministically).
- Keep `blackout` telemetry semantics (`lampPower <= 0.03`) or consciously
  re-spec it with the new floor (see below) — the harness gates on
  `lampPower <= 0.001` at the trace checkpoint.

### 2. Visible dark instead of pitch black

The current dark state is near-black. These are the levers, in lighting order:

- `src/scene/drawing/DrawingLinework.tsx` paperFragment (~line 139):
  `light = (0.64 + 0.34*key + 0.1*pool*uReadingPool) * uLampPower` plus
  `+ 0.0025*(1.0-uLampPower)`. The residual term is ~1/255 of the lit paper.
  Raise it to a deliberate dim reading level — target: lit paper currently
  reads ~220/255 at the registered hold, so land the dark state around
  **20–40/255** on the paper with the ink a few steps below, so the drawing
  reads but the trace still pops. Tune visually on the preview; this is a
  taste value, not a measured constant.
- Desk (~line 200): `mix(0.012, 1.0, uLampPower)` — lift the floor
  proportionally so the sheet silhouette keeps its grounding.
- Ink (~line 602): `inkLight = 0.02 + 0.98*lampPower` — ink must stay darker
  than the dark-state paper; verify with a screenshot comparison after the
  paper floor rises (the values compound).
- Lettering: `text.update(reveal, opacity * lampPower)` fades all sheet text
  to 0. Decide whether dimension text/notes should also stay faintly readable
  in the dark state (owner said "the drawing visible" — linework definitely;
  ask or choose and record the decision).

### 3. Keep the trace popping

- `src/scene/drawing/sheet/lightning.ts` — core is white with a 0.30/0.48/0.70
  blue-white glow; with a visible dark floor consider a slightly wider core or
  stronger glow, but the floor lift alone should restore most of the pop.
- `src/scene/PostProcessingComposer.tsx` — intro-frame rest bloom is 0;
  `INTRO_PULSE_BLOOM 0.3` is gated on `telemetry.drawing.blackout`. Bloom
  threshold is 0.6 luminance, so the white core still blooms in the dark
  state. Re-verify the traced pixels after the floor change.

### 4. Spend the freed scroll

- `INTRO_SCROLL_SHARE` (`introTimeline.ts`, currently 0.3) is the lever for
  absolute scroll inside the intro. When the enclosure/M249 chapters leave
  this page the document shortens, so re-derive the share together with the
  new section layout — the goal is slower flicker and a readable trace, not a
  number in isolation.
- Downstream windows are authored in paced-progress units (`0.120 → 1`), so
  they stay valid while they remain on the page; `scrollCommit.ts` and the
  verifier's `rawScrollFor`-based mapping must be re-checked after any share
  or document-height change.
- The page split is its own work item: give the enclosure page and the M249
  page their own `JG-###` IDs in `TODO.md`, and follow the repo hard rule —
  behavior/table changes update `animation-spec.md §5`, the READMEs, and the
  skill tables in the same commit.

## Verification protocol (unchanged)

- Iterate with `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5199`
  against the dev server (needs `--url=` localhost, not 127.0.0.1). Full
  6-case roster is done-evidence only: `--out=<dir>` to control the folder.
- Restart the :4173 preview after **every** rebuild before capturing.
- GPU captures: headed Chrome with `--use-angle=d3d11` — headless drops to
  lite and invalidates full-tier stills.
- Extend/adjust the checkpoints when the flicker window widens: the harness
  samples at fixed intro t values; add the new dip/hold times and keep the
  lightning pixel-proof gate (normal vs null mesh at a fixed camera).
- `scripts/capture-jgun-blackout-motion.mjs` records a 12 s video sweep of
  `t = .40 → 1` against :4173 plus a per-frame telemetry JSON — useful for
  owner review of the new flicker; run it against the built preview.

## Gates

- Owner visual approval of the revised flicker/darkness is required.
- **Nothing is pushed.** `origin` push deploys the live site
  (Cloudflare Pages → www.studiomark.dev). Do not push before owner approval.
- No commit has been made this session; stage only session-owned paths when
  asked (the `.scratch-*` logs and `.scratch/` are not committed).

## Files touched this session (all uncommitted)

- `src/scene/drawing/introTimeline.ts`, `introTimeline.test.ts`
- `src/scene/drawing/DrawingLinework.tsx`
- `src/scene/drawing/sheet/lightning.ts` (new)
- `src/scene/drawing/sheet/paperFlex.ts`, `paperFlex.test.ts`
- `src/scene/drawing/sheetCamera.ts`, `sheetCamera.test.ts`
- `src/scene/PostProcessingComposer.tsx`, `src/scene/TorqueWrenchHero.tsx`
- `src/state/scrollStore.ts`
- `scripts/verify-jgun-opening.mjs`, `scripts/measure-jgun-pre-pulse.mjs` (new),
  `scripts/capture-jgun-blackout-motion.mjs` (new)
- `docs/jgun-blackout-emergence-plan.md`, `README.md`, `project/README.md`,
  `project/context/architecture/animation-spec.md`
- Untracked prior-session evidence under
  `project/work/evidence/JG-035-opening-drafting-table/`

## Carried-forward review notes (nonblocking, pre-existing)

Fresh-context GLM review (2026-09-30) verdict: ship. Two allocation notes,
both predating this session's changes: `DrawingLinework.tsx` destructures the
`paperContactShadow()` tuple per frame, and `drawingIntroState()` /
`introCameraPose()` allocate state/shot objects per call. Pool them if the
zero-per-frame-allocation rule is being enforced strictly.

## Evidence map

- Pre-pulse baseline + cause: `project/work/evidence/JG-035-opening-drafting-table/pre-pulse-shift-2026-09-30/report.md`
- Full roster 6/6: `project/work/evidence/JG-035-opening-drafting-table/blackout-emergence-2026-09-30/full/summary.json`
- Quick 2/2: `.../blackout-emergence-2026-09-30/quick-rerun/summary.json`
- Plan (updated with this session's outcomes): `docs/jgun-blackout-emergence-plan.md`
- Superseded handoff (implemented record): `handoff-2026-09-30-blackout-emergence.md`
