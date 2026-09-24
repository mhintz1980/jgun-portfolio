# Handoff — 2026-09-24 (~02:00): Astra fix-first narrowed; next cycle = lower bundle, then acoustics

Supersedes nothing — continues [21-astra-rereview-verdict.md](21-astra-rereview-verdict.md)
(disposition §). Written for a FRESH session executing cold. Read-first companions:
[20-mid-path-execution.md](20-mid-path-execution.md) (the workflow this cycle reuses),
[16-astra-rereview-packet.md](16-astra-rereview-packet.md) §ROUTED (the quota doctrine).

    branch   codex/jg033-signature-shot @ 7840142 == origin (pushed)
    tree     CLEAN except untracked `.codex/`, `.zcodeignore`, `.scratch/` — never commit those
    server   vite preview :4173 serving dist(a4f1fdd) — binds IPv6 only: Chromium needs
             `http://[::1]:4173`; curl `localhost` works. RESTART after every rebuild.
             (It died overnight once via console-kill from orphaned seat processes.)

## 1. Where things stand

- `a4f1fdd`: both owner route rulings executed, owner-approved, pushed. Astra re-review
  (2026-09-24, evidence 21): **main route PASSES end-to-end** — smooth travel confirmed,
  parallel transport "strong evidence", owner segments executed successfully.
- **fix-first still blocks visual-effects work**, now on exactly two items:
  1. **Lower intake handoff** — lower bundle ends ~60 mm short of `merged[0]`.
  2. **Acoustic interaction** — unreadable since evidence 11 §5 (unchanged).
- Her smaller items (verification-sized, fold into the cycle's verification): heat colour
  continuity through both joins; the closing beat's terminal state vs "Resolve".

## 2. THE TASK (Astra's rank 1+2, highest payoff-per-cost): lower-bundle completion

Make the lower supply read as a functioning passage: **in through the actual louver
opening, then aft, joining the merged discharge** — "Two feeds, one exit" physically
readable.

### Current facts (verified in flow.ts @ 7840142 — do not re-derive)

    lower: [[-.18,-.14,.80],[-.18,.06,.78],[-.18,.14,.62],[-.18,.10,.30],
            [-.18,.10,-.10],[-.20,.30,-.30],[-.22,.62,-.34],[-.25,.87,-.32]]
    merged[0]: [-.30,.88,-.35]   gap lower.at(-1)→merged[0] ≈ 60 mm  ← item 1
    louvers: authored in LowerIntake.tsx; the louver-gap test raycasts downward from
    (x .1, y .3) across z .48–1.02 → the opening band lives around there.

⚠️ **Astra's louver numbers are STALE**: her "highest sampled Y ≈ .083 vs liner .153"
was measured 2026-09-16, BEFORE the duct reconstruction (`fe8ca64`) and the v4 mesh
changes. Re-measure the actual opening (LowerIntake geometry + any GLB liner) before
designing the route — same lesson as the airway: measured geometry beats prose.

### Design decisions the fresh session makes (architect judgment, then verify)

1. **Louver traversal**: route the lower spine through the measured opening band
   (z ≈ .48–1.02 at the liner), emerging into the shallow duct — not appearing beneath
   the machine. Likely: retune early waypoints (index 0–3 region) to approach/enter the
   opening; keep x ≈ −.18 lane unless the opening dictates otherwise.
2. **Handoff to merged**: same pattern as main — extend/retune so lower's tail ends ON
   the merged spine curve (CatmullRom over merged, centripetal .5), pin ≤ 5 mm in a test.
   Do NOT move `merged` itself (main's tail is already pinned onto it, ≤ 5 mm — moving
   merged breaks a4f1fdd's owner-approved pin).
3. **Tests**: add a lower-bundle ruling test in the mid-path style (traversal band,
   handoff ≤ 5 mm, smoothness — parallel transport already covers continuity ≤ 15 mm
   across all three bundles; the spine-envelope test covers bounds). Keep every
   existing pin green — a4f1fdd's tests are the owner-approved contract.
4. **Timing**: lower's draw window is `smooth(.41,.60,u)` (evaluateFlow) — a longer path
   may want pacing attention; eyeball captures at u .45–.65.

## 3. Workflow (proven twice — reuse exactly)

1. Architect: re-measure louver opening + design waypoints (sweep candidates like
   `.scratch/entry-fix/midpath/{sweep,opt,gen,final}.*` pattern); write six-part spec;
   snapshot pre-state; dispatch producer via seatwrap — **alternate vendors; last
   producer was DeepSeek (guards), so GLM implements, DeepSeek reviews** (fresh context,
   spec + diff only, attack list + executed file:line evidence + attacks-that-failed).
2. Gates: `npx tsc --noEmit` + `npx vitest run --configLoader runner` (10 files/97 tests
   today; +N for new tests; .scratch harnesses add 6 — local-only). Rebuild + RESTART
   :4173, captures six stops + ruling-region crops, before/after pixel-diff (expect 0%
   where no ribbons, localized changes elsewhere).
3. Owner rules by looking (before/after contact sheet in the compare.mjs pattern).
4. Commit code+tests+evidence together; push. NEVER commit `.scratch/`, `.codex/`,
   `.zcodeignore`.
5. **Astra re-clear packet (one call)**: include her missing-evidence list verbatim —
   close view of louver traversal + repaired join; acoustic-interaction evidence (after
   §4 below); a short forward/reverse capture through hairpin + merge (temporal
   continuity — needs a video or frame-sequence strip, NOT stills); the terminal closure
   state. Prompt pattern: `.scratch/astra-packet/prompt.md` (fixed facts / open judgment
   partition, verdict-first output format). Mechanics: `codex exec -m gpt-6-astra -c
   model_reasoning_effort=high --sandbox read-only -i img… < prompt.md` — **prompt MUST
   come via stdin when `-i` is used** (positional arg silently drops). Proof: `ocx logs`
   row `openai/gpt-6-astra` 200.

## 4. After the lower bundle: the acoustic beat (Astra rank 3, needs design)

Her standing constraints (evidence 11 §5, still binding): preserve the six grounded
orange chevrons' semantic distinction from airborne sound; make an authored encounter
with the absorptive structure visible (contact/deflection/contact-local attenuation);
four longitudinal source-to-target curves are not wave fronts — don't regress to bubbles
or generic pulses. `SOUND_ORIGIN [-.20,.95,.10]`, `SOUND_FRONTS 4`, sound window
`smooth(.76,.86,u)`. Design first, owner rules on the concept, then implement.

## 5. Orchestration gotchas (all proven, don't relearn)

- seatwrap + bare `timeout` resolves Windows TIMEOUT.EXE → always
  `"C:/Program Files/Git/usr/bin/timeout.exe" 1500 codex …`.
- codex `--sandbox workspace-write` breaks vitest/esbuild config loading → seats verify
  with `npx vitest run --configLoader runner`; architect re-runs gates outside anyway.
- seatwrap's re-run of a compound `a && b` verify dies on cmd.exe quoting — ignore its
  `verify_rerun_exit`, trust your own gate run.
- EVERY spec must restate line endings (CRLF) — seats write bare LF otherwise.
- Orphaned codex seats whose parent session died still finish and write reports — check
  file mtimes + `ocx logs` before re-dispatching anything.
- Scratch `*.test.ts` files get collected by vitest's default include; rename evidence
  copies to `.pre`/`.txt` or expect extra files in the count.
- ICM importance takes WORDS (`-i high`), not numbers.

## 6. State of everything else (unchanged)

JG-034 (blocks `verify-jg032-station2-thermal.mjs` on ANY build — pre-existing opening-
scene bug, `__drawingProof.ready` timeout) · JG-033 main-page integration (the recurring
"work was lost" confusion — the study lives at `?study=rl300`, not the main page) ·
radiator-fan treatment · v4 node-rename pass (7 roots, may re-commit msp-enclosure.glb).
