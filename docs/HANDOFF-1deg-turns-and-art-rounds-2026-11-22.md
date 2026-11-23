# HANDOFF: 1° turns at 60 fps + three art rounds (2026-11-22, evening)

Follows `docs/HANDOFF-homepage-scrubbed-video-2026-11-22.md` (worktree `homepage-scrubbing-videos-ffaf5d`) and executes its plan `docs/PLAN-scrubbed-video-2026-11-22.md`.

## Result

- **Branch `jg044/bitmap-ring`** (worktree `.claude/worktrees/jg044-bitmap-ring`, off `home/60fps-2026-11-22` @ `6a65e15e`). Not pushed, not deployed.
  - `6f17ddbb` spike A (`createImageBitmap` ring): **failed** the gate (sec5 min 1 s fps 24–35). Upload volume, not decode.
  - `11f47745` **worker decode + raw upload + velocity stride**: a Worker decodes each WebP to raw bytes (flipped, shade premultiplied, line layer packed to one R8 byte), the main thread uploads a `DataTexture` from a ring of 3; decode stride 1° when slow, up to 6° when fast; every 24th frame kept resident as a fling fallback.
  - `caac5d94` art rounds 1–3 (below).
- Carbine (`arm/`) and cage (`ch4/cage/`) now ship the 360-frame 1° sets from `save/jg044-frame-scrub-2026-11-21` (26 MB vs 4.6 MB). Pump and receiver were not added (they need the save branch's beat logic).

## Measurements (perf3.cjs, 1920×1080, headed Chrome, same session)

| | 60-frame base (`6a65e15e`) | 1° worker build (`11f47745`) |
|---|---|---|
| warm, rolling 1 s min fps, whole page | 30.0 | 57.9 |
| warm, sec5/sec6 min fps | 47.9 / 53.0 | 57.9 / 59.9 |
| fling min fps | 29.9 | 49.0 |
| cold min fps | 37.3 | 39.0 (sec3–5, while the 26 MB set streams) |
| warm lag, requested vs shown angle | n/a | p95 ≤ 2°, max 4° |

After `caac5d94`, the machine was capped at 30 fps for every build, **including the untouched base** (p50 33.4 ms, JS about 1.2 ms per frame), so the final build was not re-measured at 60. Re-run both before deploying:
`node C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/perf-2026-11-22/perf3.cjs http://localhost:8820/home/ final`.

## Art rounds (Astra = gpt-6.2-astra, xhigh)

Approved by Astra: lens reel framed to the lens and lifted on cream (`0.04 + 0.96*pow(rgb,0.7)`); headline visible on first paint, canvas fades in over 200 ms; carbine ink clears in .12 screens before the gear train returns over .18. Also: footer "Issued for review" (Astra's line), carbine copy for 360 × 1°, gapless music bed v2 (tail crossfaded into head, 61.7 s, −21.5 LUFS, AudioBuffer loop; about 13 dB louder than v1 on the page).

**Rejected (open):** the idle lens path. From 6.7 screens until the ink clears, the idle lens should track the receiver centre of the *shown frame*, not the static carbine rect. Needs a per-frame centroid (e.g. one bbox per frame in the manifest).

## Next steps (in order)

1. Re-measure at 60 Hz (base vs `caac5d94`). Deploy only on Mark's go.
2. Astra's dark-disc fix (no new video): in the cover path, mask the shaded layer to the model silhouette so empty lens areas show the paper grid; keep the rim and orange index.
3. Idle lens on the receiver centroid (above).
4. Title-free lens export of the reel (needs a video export; storyboard below).
5. Memory: an off-screen set keeps about 50 MB of coarse frames plus its window (up to about 130 MB). The `?relbm` idle release made the page about 20 fps and is off by default; cause unknown.
6. Phone + Fast 3G gate from the plan was not run (no phone in this session).

## Video storyboard: title-free lens reel (not done, needs an export)

Same 26 s edit, re-exported without title cards. The lens shows the centre square at full height, so titles at the left of frame get cut ("que Wrench").
- 0–8 s: torque wrench body, slow push along the barrel. Highlight travels left to right.
- 8–14 s: exploded planetary stack, callouts kept, centred.
- 14–26 s: enclosure and pump package. Brighter grade (mean luma 50 already reads well).
Encode as now: 1280×720 H.264 crf 28, no audio, faststart, about 2 MB.

## Lyria prompt (music bed v3)

"Instrumental loop, 76 BPM. A quiet drafting room after hours. Felt-piano pairs, brushed paper for percussion, a warm low synth pulse, an occasional muted metal tap. Curious, precise, understated. Leave space for the fall and climb sounds. Keep the pulse even through chapter changes and let the tail loop cleanly. 60 seconds, no fade-in or fade-out."

## Files

- Probe, screenshot and audio scripts plus every round screenshot: `C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/perf-2026-11-22/` (`perf3.cjs`, `shots.cjs`, `sheet.py`, `sndcheck.cjs`, `astra.sh`, `norange.mjs`, `shots/`). Serve with `node norange.mjs <worktree> <port>`.
- Branch `home/art-rounds-2026-11-22` (`7aefea8a`) has round 1 on the 60-frame build. It is superseded by `caac5d94`.
- Local servers: 8820 serves `jg044-bitmap-ring`, 8821 serves `home-art-rounds`, 8812 serves the 60 fps worktree.

## Paste prompt

```
Read C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg044-bitmap-ring/docs/HANDOFF-1deg-turns-and-art-rounds-2026-11-22.md first, then AGENTS.md and TODO.md. Workspace: that worktree, branch jg044/bitmap-ring (unpushed, not deployed; head 6f55a51c). Step 1: serve it with `node C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/perf-2026-11-22/norange.mjs <worktree> 8820` and the 60 fps worktree on 8812, then re-measure both with perf3.cjs (same folder) at 1920x1080 with the desktop idle; the last runs were capped at 30 fps for every build while the desktop was in use. Step 2: Astra's dark-disc fix (mask the lens's shaded layer to the model silhouette so empty areas show the paper grid; keep the rim and orange index), then the idle lens on the receiver centroid from 6.7 screens; send screenshots to gpt-6.2-astra for approval. No deploy or push without Mark's go; push from the main checkout.
```
