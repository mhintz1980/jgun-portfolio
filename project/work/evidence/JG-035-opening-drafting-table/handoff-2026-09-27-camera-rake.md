# JG-035 handoff — 2026-09-27 (camera rake + session wrap)

Read `handoff-2026-09-26c-stages-2-3-visibility.md` first — its mission and the
Astra/Higgsfield context still apply. This session executed that handoff's owner
direction #1 (camera tilt toward the desk) plus delegated workstreams.

**Committed `d118b8e` on `codex/jg033-signature-shot` (ahead 4 of origin, NOT pushed).**
Typecheck 0, 142/142 tests. Owner + Astra visual ruling still pending on everything below.

## What changed

### 1. Camera rake (owner direction 26c #1) — implemented, NOT yet visually approved
- `introTimeline.ts`: new `INTRO_PHASES.registrationEnd = 0.5`; new `illumination`
  channel (lights reach full by `riseStart`).
- `sheetCamera.ts` `shots()`: exact square-on/ortho-1 hold `t .4–.5` (the registered
  pulse window), then lowers `elev 90→58°`, `ortho 1→0` by `riseStart .6`; same
  side-view target/dist/fov throughout; constant from `.6` to `1` — the existing
  CameraRig hero blend (`orbitStart .72`) takes over with no snap (continuity test
  at 800 samples).
- Registration gates rescoped (agent-executed): `verify-jgun-opening.mjs` 0.1 px gate
  now applies **only at p=.06** (t=.5, hold end); `.066/.072` recorded as intentional
  `tiltParallax`; new objective camera-movement gates at `.072`/`.084`. Verifier
  default URL fixed to `localhost:5199`. `sheetCamera.test.ts` rewritten (3 tests ×
  2 aspects: hold / tilt+monotone / continuity). `introTimeline.test.ts` locks phase
  ordering incl. `REDUCED_MOTION_INTRO_T ≤ registrationEnd`.
- Live captures + telemetry: `camera-pressure-2026-09-27/first-rake/` (p .06/.066/
  .072/.084, all ok, tier lite→full, parallax 23→72 px as designed). Capturer
  `scripts/capture-jgun-opening.mjs` (fresh GPU page per frame, settle-gated,
  context-loss retry, writes frames.json telemetry).

### 2. Vellum close + lit metal (fixes found by probe, `camera-pressure-2026-09-27/diagnostics/`)
- Problem found: `uVellum` was keyed to monotonic pbr — after the model swings/lifts
  past the *static* baked footprint, a false translucent hole would open in paper+desk
  (part of the "grip dark/flat" at p=.084). Also metal under the 43%-alpha vellum was
  double-dimmed (material pbr mix × studio-light pbr scaling ≈ 0.42×).
- `paperFlex.ts` `paperVellum(poseT, crossing, pbr, …)`: vellum now closes with the
  same solved-separation release envelope as the flex — paper/desk re-opaque in
  lockstep with the lift, no hole possible.
- `SceneCanvas.tsx` StudioRig: `activation` uses `intro.illumination` (full by t=.60)
  while `TorqueWrenchHero` keeps `intro.pbr` for the material mix — metal through the
  vellum is fully lit.
- **Not yet re-captured after these two fixes** — next session should re-run the
  capture script before the Astra packet.

### 3. Precompute binary container v2 (agent-executed)
- `drawingCodec.ts` + `drawingCache.ts` + `precompute-drawing.mjs` +
  `convert-drawing-precompute.mjs`: lossless little-endian binary container,
  **exact roundtrip verified** (`"exact": true`), wire 6.11 MB → **3.96 MB gz (−35%)**.
  Old JSON asset kept until the prod-preview measurement decides keep/drop.
  Cache sniffs both host encodings; any corruption → fail closed to live bake
  (truncation/corrupt-metadata/NaN/version tests included).
- STILL OWED: production-preview (`npm run preview` → :4173, restart after build)
  cold-start measurement — dev-server ordering was already known not to flip.

### 4. Poster-tier fallback (agent-executed)
- `Chapters.tsx` + new `staticChapter.ts`: poster tier now shares reduced-motion's
  one-card native-scroll gate (the old `&& reducedMotion` escape rendered all four
  glass cards stacked over the fixed poster).
- `StaticPoster.tsx`: viewport-centered huge title demoted to small sheet furniture.
- New `StationNav.tsx` (+App wiring): poster tier keeps accessible station nav via
  the existing `navigateToStation` no-Lenis fallback; no camera/material HUD.
- Owed: browser visual pass on the poster tier + e2e checks (blocked on GPU
  coordination this session).

### 5. Higgsfield (26c #2) — researched, credentialed, NOT fired
- `higgsfield-readiness-2026-09-27.md`: live API contract verified; OpenMontage's
  wrapper is incompatible (wrong auth/host/paths/model IDs) — don't use it.
- Prompt pack: `higgsfield-asset-manifest-2026-09-27.json` (3 atmosphere-only clips:
  RL300 anechoic lab, precision workshop haze, M249 metrology lab; restraint rules,
  estimate-first workflow).
- Skill: `~/.claude/skills/higgsfield-video/SKILL.md` (invocable as `/higgsfield-video`).
- Credentials: owner chose paste-in-chat delivery; at wrap time the key had not yet
  been pasted. **Next session: if `jgun-portfolio/.env.local` lacks
  `HF_API_KEY_ID`/`HF_API_KEY_SECRET`, ask Mark to paste the key, write it there
  (gitignored), never into memory/commits.** Credits were said to expire ~2026-09-28
  (owner-stated, unverified) — run the manifest's estimate→fire→poll→download
  checklist immediately once credentialed; every clip still needs an Astra ruling.

## Next steps (in order)

1. Paste-in Higgsfield key → `.env.local` → run the asset manifest (credits expire).
2. Re-capture `first-rake` frames after the vellum/illumination fixes
   (`node scripts/capture-jgun-opening.mjs --points=0.06,0.066,0.072,0.078,0.084`).
3. Astra ruling packet (convention: `rl300-quiet-machine/16-astra-rereview-packet.md`
   — one call, images attached, effort high) covering: the 4 committed visibility
   effects + camera rake + vellum close. Known open visual items from GLM's QA:
   silhouette glow reads hologram-ish (warm/dim it or fade with pbr), sheet tone
   drift across the sequence, contact-shadow direction swing, title-block legibility
   at the rake end, smallest text tier at the legibility floor.
4. `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5211` (or
   :5199 when that session's server is gone), then the full 6-case roster for
   done-evidence.
5. Prod-preview precompute measurement (keep/drop v2 asset).
6. Poster-tier visual pass + e2e.
7. Push when evidence complete (repo rule).

## Gotchas

- Port 5199 is owned by another chat's dev server; this session used :5211
  (`rl300-review` config in `.claude/launch.json` — it's just a second vite instance).
- The in-app browser pane drops to poster tier under GPU contention with playwright
  captures — use playwright (`--use-angle=d3d11`) for evidence, pane only for quick looks.
- One fresh page per capture frame; context-loss retry is in both capture scripts.
- `fable-advisor` seat is credit-blocked on this account right now (429) — route
  reviews to Astra per the standing rule anyway.
