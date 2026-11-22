# HANDOFF — homepage back at 60 fps, film in the reticle (2026-11-22)

Supersedes `HANDOFF-homepage-live-360-2026-11-20.md` (now on the saved branch only).

## State

- **Live:** studiomark.dev/home/ = Pages `3f1d4db1`, built from `home/60fps-2026-11-22` @ `3c8a4b78` (pushed).
  Rollbacks: `86c97c20` (same page without the film change), `21d338ca` (the plain `ccf8f156` build).
- **Branch `home/60fps-2026-11-22`**, worktree `.claude/worktrees/home-60fps-2026-11-22`: `c4d953d6` (the `ccf8f156` build)
  plus the music bed, the deploy fix (ships the whole proto folder), hooks and handoff skill, the phone lens fix, docs,
  and the film-in-reticle change. The film stays in the reticle from the top through Ch01 and Ch02 and fades out at
  pS 2.3–2.55. The full-lens moment keeps the 3D gear stack. Astra (gpt-6.2-astra) accepted it with that fix.
- **Saved, paused:** `save/jg044-frame-scrub-2026-11-21` @ `1f0d512a` (pushed) holds the 1° turns, Ch04 three beats,
  thin console and P3 pump/receiver turns. See `docs/SAVED-frame-scrub-2026-11-21.md` on that branch.
  Render sources: `C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/` (4,493 files, 3.5 GB).
- Why: Mark felt lag on 2026-11-22. With the 1° turns, Ch04 ran at 33–50 ms per frame with about 20 ms of JS per frame.
  Plan and split: `docs/PLAN-back-to-60fps-2026-11-22.md`.

## Measuring

`.scratch/perf2.cjs <url> <label>` (headed Chrome; keep the window open) gives median frame time and JS per frame
for each screen. A single run can be noisy; re-run before concluding. `.scratch/errs.cjs` checks page errors in
8 cases. `.scratch/serve.mjs <root> 8795` serves /home/ locally.

## Open

1. A Ch04 screen (60-frame cage stage, film off) intermittently runs at a 33 ms median on live, with JS about 1 ms
   per frame. It was there before 2026-11-22; the cause is not found yet (GPU/compositor or CDN frame loads).
2. OpenMotion trial (thread E): `docs/PROMPT-openmotion-trial-2026-11-21.md` now points at the saved frames.
   Mark starts `claude` in `C:/Projects/openmotion` and pastes it.
3. Thread G: `integration/tw-film-2026-11-21` stays local; metrology is NOT pushed (Mark). Conflicts wait for Gate 3.
4. Film (JG-041) direction, the Ch03 M249 beat and a better music track wait on Mark.

## Gotchas

- New worktrees have no `node_modules`: the pre-push hook (Biome) fails there. Push from the main checkout.
- Modal can't launch from a background session (sandbox HTTPS_PROXY). Mark runs `launch_ch04.py` in his own PowerShell.
- Every visual change goes to Astra: `codex exec -m gpt-6.2-astra -s read-only -i <png> - < brief.md`.
- No frame-scrub stage returns to the homepage without a perf probe at 60 fps and Mark's go.
