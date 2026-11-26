---
name: perf-probe
description: Measure per-section frame time and main-thread JS per frame on a portfolio page, compared against the live 60 fps homepage. Run before adding or growing any scroll-scrub, frame-sequence or video stage, and before asking Mark to approve a homepage change.
argument-hint: "[candidate-url] [label]"
disable-model-invocation: true
---

# /perf-probe

Rule this enforces: no scroll-scrub or frame-sequence stage ships without a measured 60 fps
(16.7 ms/frame). On 2026-11-22, 1-degree turns dropped the homepage to 20-30 fps and were rolled
back because nobody had measured frame time.

## Run

The probe is `scripts/perf-probe.cjs <url> <label>`. It opens a **visible** Chrome window
(1440x900, needs the `chrome` channel installed), scrolls the whole page twice (cold, then warm), and
prints per-section (`secN` = scrollY / innerHeight) p50/p95 frame time and JS per frame.

1. **Baseline:** the live homepage, `https://studiomark.dev/home/`, label `live`.
2. **Candidate:** `$ARGUMENTS`, or the page being changed if no URL was given:
   - Vite pages: the `dev` server from `.claude/launch.json` (`http://localhost:5199/<page>/`;
     the dev server refuses `127.0.0.1`). For numbers you'll quote, use `npm run build`
     plus `npm run preview` (`:4173`), and restart preview after every rebuild.
   - The homepage prototype (`proto/merged/`): serve that folder statically and probe its URL.
3. Run each probe **twice** in the foreground, one after the other, never in parallel
   (a single run is noisy):
   ```
   node scripts/perf-probe.cjs https://studiomark.dev/home/ live
   node scripts/perf-probe.cjs <candidate-url> candidate
   ```
   Keep the Chrome window focused and uncovered. A background window gets throttled.

## Report

Lead with one line: worst warm-pass section, candidate p50/p95 frame time compared with live, and
PASS or FAIL against the 16.7 ms bar. Then give a table with one row per section: live vs candidate
frame p50/p95 and JS/frame p50. Flag any section with warm p95 above 20 ms, or JS/frame p50 above
8 ms, as the place to look.

Don't add a new gate or test based on these numbers. The probe is the evidence. Write raw output
to `.scratch/` or the ticket's `project/work/evidence/` folder, never the repo root.
