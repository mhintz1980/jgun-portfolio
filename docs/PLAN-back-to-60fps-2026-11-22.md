# Plan: homepage back to 60 fps, scrub work saved for later (2026-11-22)

**Cost: $0 for every step. Nothing below has run yet.** Steps 3 and 6 publish (a git push and a
deploy), so each needs Mark's go.

## Decisions for Mark (answer these three, then it runs)

1. **Which 60 fps homepage?** (measured 2026-11-22: Chrome on this machine, slow wheel scroll through the whole page)
   - **A. `ccf8f156`, the merged prototype as first deployed (recommended).** This has the paper tear, the chapters, the armament stage, the Chapter 04 cage with 60 frames, and the cage's rim cut-off fix. Every screen has a median of 16.7 ms (60 fps), and page work is about 1 ms per frame. One frame in 20 still hitches on every merged-prototype build.
   - **B. `31e75c81`, the old production `/home/` (built from `d2a820dd`).** This is the older design, before the merged prototype. Every frame is 16.7 ms with no hitches.
   - Live now, for comparison: `ea262c8a` takes 33–50 ms per frame (20–30 fps) on Chapter 04's 4 screens, with about 20 ms of page work per frame.
2. **The 60-frame cage and carbine stages.** These are short scroll-scrubbed frame sets (6° steps) that came before this plan and measured 60 fps. **Keep them (recommended)**, or strip them as well?
3. **Live site:** **roll back to `ccf8f156` in Cloudflare right away (recommended, instant)**, or wait for the rebuilt branch? An immediate rollback drops the music bed until step 6.

## What caused it (so it isn't repeated)

The lag comes from the 1-degree turns (commit `d9f8400a`, first live as `70ac5b5c`). Almost every scroll step swaps in two new 1024×640 WebP frames, and at 360 frames per turn Chrome probably decodes each one on the main thread, which costs about 20 ms. The three beats then stretched that stretch of page from 2 screens to 4. `ccf8f156` steps 6° at a time, so it swaps frames far less often.

## The split: every commit on the branch since `ccf8f156` (`c4d953d6`)

**Keep on the 60 fps homepage (not scrub work):**
- `d68c478a` music bed replaces the synth (main.js audio lines + `proto/merged/audio/music-bed-v1.mp3`)
- `e23604cf` deploy script ships the whole proto folder, so `audio/` reaches /home/
- `5f5da791` handoff skill, git-guard and typecheck hooks, project allowlist (tooling only)
- Docs: `2e62c40d`, `fd1cce08`, `9811fbcc`, `fdf9ce91` (OpenMotion prompt), status table. These get carried as docs and rewritten to match the new state.
- `6cd6e171` phone lens below the header. **Only if** the lens code in `ccf8f156` is the same code; otherwise it stays with the saved work.

**Save for later (scrub work, comes off the homepage):**
- `d9f8400a` 1-degree turns for cage and carbine (360+360 frames each) and the encoder changes
- `ab02e7bc` / `bb607954` Chapter 04 three beats
- `12ab0d8e` / `6c9eacd6` / `0d9be83b` / `54889f99` the thin console (scrub, wipe, finishes)
- `b4fc536d` gear readouts hidden on beats 2-3 (it depends on the beats)
- `00d6d667` the P3 pump and receiver 360 turns ($0.30 Modal) plus the Chapter 03 row hide
- Untracked render sources stay where they are: `.scratch/ch04/` (pump and receiver line+shade PNGs, cage and carbine sets, pilots, Astra packets, perf probes) and `.scratch/arm360/`.

## Steps

1. **Freeze the saved work ($0, local).** Create branch `save/jg044-frame-scrub-2026-11-21` at `d394857d` (today's head, which holds all of the above). Copy `.scratch/ch04/` render outputs to `C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/` so they survive worktree cleanup. Write `docs/SAVED-frame-scrub-2026-11-21.md` on that branch: what is there, which commits, the perf numbers, and what has to be solved before it ships (decode-ahead with ImageBitmap, or scrubbed video).
2. **Build the 60 fps branch ($0, local).** Create `home/60fps-2026-11-22` from `c4d953d6` (decision 1A) or `d2a820dd` (1B). Cherry-pick `d68c478a`, `e23604cf`, `5f5da791` and the docs, resolving any conflicts toward the old stage code. On 1B, the music bed and the deploy fix only apply if the old page has the same audio hooks; if not, they wait.
3. **Push both branches (go needed).** Work branches only; nothing touches main.
4. **Prove 60 fps before deploying ($0).** Run `.scratch/ch04/perf/perf2.cjs` against the local build. To pass, every screen needs a median of 16.7 ms and page work under 2 ms, and it must be no worse than `ccf8f156` (same script). Then one browser pass (desktop and phone, light and dark, reduced motion) with 0 page errors, and the music bed playing when sound is on. Send Mark the numbers and stills.
5. **Mark looks and rules** on the deployed preview URL (Cloudflare Pages gives one per deploy) before production.
6. **Deploy (go needed)** with `scripts/deploy-home-proto.sh --deploy` from the new branch. Live check: the same perf probe plus 0 page errors. Rollback is `ea262c8a` (today's live) or `ccf8f156`.
7. **Paperwork ($0).** In the status table, mark threads D, F, console and P3 as "saved, paused". Point the orchestration prompt and handoff at the new branch, and add a memory note: no frame-scrub stage on the homepage without a perf probe at 60 fps first.

## Not in this plan

No new effects, renders, Modal or Higgsfield runs, and no merge into main. Thread G (worktree consolidation) and the OpenMotion trial (thread E) are unchanged. The OpenMotion prompt still works, but its example frames move to the saved branch (step 1 updates its paths).
