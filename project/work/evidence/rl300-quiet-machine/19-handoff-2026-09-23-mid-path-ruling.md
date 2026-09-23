# Handoff — 2026-09-23 (evening): mid-path ruling decoded, entry APPROVED, mid-path rebuild next

Supersedes [`18-handoff-2026-09-23-entry-path-fix.md`](18-handoff-2026-09-23-entry-path-fix.md) on
next-action only. Handoff 17 §"things that will bite" and handoff 18's scope guard still apply.

    branch   codex/jg033-signature-shot @ b057f11 == main == origin (docs push below adds 1 commit)
    tree     UNCOMMITTED source changes (the approved entry work — see §1). `.scratch/`, `.codex/`,
             `.zcodeignore` never commit.
    server   vite preview :4173 — currently serving the PRE-fix1 build (curl localhost:4173, IPv6).
             RESTART after every rebuild (house rule).

## 1. Entry work: DONE and owner-approved — but tree ≠ dist

Owner ruled 14:48 ("three blue lines…") → executed via pair-dispatch, adversarially reviewed, fixed:

- `src/scene/rl300/flow.ts` — SPINES.main entry waypoints 0–3 (4 pts) replaced by 5 pts:
  `[-.40,1.44,1.55] [-.40,1.45,1.40] [-.40,1.60,1.23] [-.40,1.75,1.056] [-.40,1.76,.86]`.
  12 → 13 points; later waypoints byte-identical.
- `src/scene/rl300/preview.test.ts` — corridor test re-mapped (loops i 2..9; tails main[10..12];
  canopy turn-down main[7] ≤ .564; comment updated). New test 'keeps the entry approach in the
  owner-ruled band, clear of the slanted floor' pins centerline-to-owner-strands AND the real
  rendered envelope via exported `airPaths('main', 6)` (fan + half-width), thresholds .020/.030/.015.
- `src/scene/rl300/AirRibbons.tsx` — `airPaths` + `StripPath` exported, no behavior change.
- Gates: tsc clean, **89/89** vitest, build clean. Mutation-tested (old geometry fails the new test).

**Two builds in play:** the owner approved the ENTRY by looking at the *fix0* build (waypoints
1.50/1.50/1.66/1.77/1.77). The tree holds *fix1* (1.44/1.45/1.60/1.75/1.76 — same shape, entry
strand ~60 mm lower, riding the owner's middle blue line; fix0 FAILS fix1's middle-strand pin
50.6 mm > 30 mm). **fix1 was never built/captured.** Recommendation: rebuild fix1 with the mid-path
work and show the owner the combined before/after; if he prefers the higher fix0 entry, relax the
middle-strand threshold — never silently move pinned waypoints back.

Pair-dispatch record: GLM (glm-5.3-flash via ocx) implemented fix0; DeepSeek (deepseek-flash)
adversarial review → verdict fix-first (centerline-only test + entry too high — reproduced by
architect); DeepSeek implemented fix1. Served-model proof: ocx proxy logs (20 glm / 36 deepseek
rows since dispatch). seatwrap ledger: seats `entry-impl`, `entry-fix1`
(C:/Projects/Misc/seatwrap/ledger/returns.jsonl). GLM review of fix1 was still pending when the
owner's mid-path ruling arrived — fold it into the mid-path deliverable review.

**Orchestration gotchas learned this session (reuse):**
- `seatwrap run -- … timeout 1500 codex …` resolves `timeout` to Windows TIMEOUT.EXE → instant
  fail. Use the full path `"C:/Program Files/Git/usr/bin/timeout.exe" 1500`.
- codex `--sandbox workspace-write` breaks vitest/esbuild (`Cannot read directory "../../.."`).
  Seats verify via `npx vite --configLoader native test run` (fix1 seat proved this) — or the
  architect re-runs verification outside the sandbox. `--sandbox read-only` cannot run vitest at all.
- First GLM seat hung ~30 min fighting the sandbox; don't wait twice — check
  `ocx logs`/process list, kill, verify the diff yourself.

## 2. THE TASK: owner mid-path ruling 2026-09-23 (second ruling, ~17:30)

> "change the path you made at the black line i marked on this image, and then continue the path
> along the red curved path i show. It should be a smooth travel for the air streams; they curve
> but they don't make hard linear changes in direction."

Spec image (SAVED, untracked — commit with the work):
[`entry-fix/owner-mid-path-ruling-2026-09-23.png`](entry-fix/owner-mid-path-ruling-2026-09-23.png)
(893×582). Black vertical stroke = CUT the current path there. Red curve = the new route:
hairpin under the canopy, then a long gentle aft descent. Smoothness is an explicit requirement.

### Camera lock + mapping (decoded — do not re-derive)

- Owner's view = study **u ≈ 0.425** (NCC grayscale fit 0.7144; flat 0.71 across u .42–.425;
  scale k=0.57). Rebuilt camera at u=.425: pos [3.9348, 1.6607, 3.1196], tgt [0, 1.2075, 0.9409],
  fov 32.06. Formula replicates `evaluateShot`'s smoothstep exactly —
  `.scratch/entry-fix/unproject2.mjs` (re-run it; it prints spine→px validation too).
- Owner-px → capture-px: `x*0.57+585, y*0.57+202`. Canvas rect (1440×900 page): x 331.1875,
  y 81, w 1108.8125, h 702.
- Fresh-session frames: `.scratch/entry-fix/grab.mjs` (US=… env), gridded zoom `crop.mjs`,
  contact sheets `sweep.mjs`, before/after+pixel-diff `compare.mjs`, clearance sampler
  `feasibility.mjs` (pattern for the envelope sweep — extend it to the mid-path).

### The black line (world coords, x −.36…−.40 invariant ±11 mm)

Vertical stroke between current wp4 and wp5: **cut the ceiling run at z ≈ 0.82** (spine px 855→890).
KEEP wp4 `[-.40,1.76,.86]`. Everything from wp5 `[-.40,1.79,.60]` (the peak + turn-down + hairpin)
is replaced.

### The red curve (decimated polyline, x = −.40 plane, (y, z), web frame)

    apex        (1.767,  .757)   ← starts ~50mm below ceiling, just aft of the black line
    forward     (1.712,  .580)   ← descends toward canopy leading edge (z .564)
    leftmost    (1.647,  .543)
    back        (1.516,  .659)   ← hairpin bottom region
                (1.443,  .621)
                (1.393,  .539)   ← turns aft for good
    aft run     (1.358,  .446) (1.328,.349) (1.297,.250) (1.266,.150) (1.233,.046)
                (1.200, −.059) (1.166,−.167)
    tail        (1.131, −.277)   ← exits his frame edge here; beyond is unspecified

Shape: an S/hairpin — descend forward to z .543, back to z .659 while dropping to y~1.50, then a
LONG gentle aft descent (~17° in y-z) to y 1.13 at z −.28. Full 122-pt chain:
`.scratch/entry-fix/red-chain.json`. Geometry sanity: hairpin bottom [~1.50, ~.64] sits ~200 mm
above canopy lip D (1.479, .434) and behind fore face C (1.776, .496) — clear. The aft run y
1.30–1.36 at z .35–−.28 is BELOW the airway section (outside the corridor, in the equipment bay) —
like the current tail, so the containment gate needs re-mapped exemptions again, not panic.

### Design decisions the fresh session must make (architect judgment, then verify)

1. **Waypoint plan.** Replace wp5–wp9 with red-following waypoints (likely 4–5 pts: apex, forward
   point, hairpin bottom, aft-run point(s)), keep the ~17° descent to a tail at ≈ (1.13, −.28),
   then handle the handoff (decision 2). Sweep candidates exactly like the entry: centerline dev
   to red polyline ≤ ~.04, fan+half-width envelope sd ≥ .015 vs AIRWAY_SECTION/canopy faces,
   and now also a SMOOTHNESS check (owner's explicit rule — no hard bends; e.g. max turn angle
   between consecutive samples, or min curvature radius ≫ fan radius).
2. **Handoff to merged.** Current main.at(-1) `[-.32,.88,-.32]` → merged[0] `[-.30,.88,-.35]`.
   Red tail (1.13, −.28) is ~250 mm above. Dropping to .88 in 40 mm of z = hard bend (violates the
   ruling). Recommended: continue the red descent slope (dy/dz ≈ −.29) or re-snap BOTH main's last
   waypoint and `merged[0]` to the red tail so the handoff stays smooth; check merged's own gates
   (envelope loop; only `merged.at(-1).z < -1.683` is pinned) and the flow.ts handoff timing
   (`smooth(.76,.86,u)` weight dim) still reads. Whatever you choose, the draw-on pacing changes —
   the path is longer; eyeball captures at u .35–.5.
3. **Test re-mapping.** Index pins shift again; entry-run cut in the envelope test is
   `findIndex(z < .60)` — the new path crosses z .60 in the hairpin, so redefine the cut
   (index-based or z < .45). Corridor containment loops (i 2..9) must shrink/exclude the aft run
   with positive exemption pins. Keep the entry rules (waypoints 0–4 + entry band) working
   unchanged — the owner approved that segment.
4. **fix0 vs fix1 entry** (see §1) — resolve when presenting.

## 3. Sequence

1. Design + sweep waypoints (architect), write six-part spec, dispatch GLM (implement) →
   DeepSeek (fresh-context review, spec+diff only, attack list + executed file:line evidence +
   attacks-that-failed), reproduce any claimed defect before fixing. seatwrap + coreutils timeout
   path + `vite --configLoader native test run` trick (§1).
2. tsc, 89+/… vitest, build, RESTART :4173, capture six stops + u .425 crop, before/after pair,
   pixel-diff (expect changes beyond ribbons ≈ 0).
3. Owner rules by looking (before/after at u .425 + the ruling image side by side).
4. Then commit code+docs together; route the Astra packet (handoff 18 §AFTER still stands).

## 4. State of everything else

Unchanged from handoff 18: JG-034 (blocks `verify-jg032-station2-thermal.mjs`), JG-033 main-page
integration, radiator-fan treatment, v4 node-rename pass. Four gates hardcode airway geometry but
this task is spine-only (no GLB change) — triangle-census/AABB/sha256 gates unaffected.
