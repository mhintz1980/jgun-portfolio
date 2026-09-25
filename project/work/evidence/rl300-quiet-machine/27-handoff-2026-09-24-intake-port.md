# Handoff — 2026-09-24 (night): intake port next; the measured shift cycle

Written for a FRESH session executing cold. Supersedes handoff 22 (fully executed:
lower bundle ✓ evidence 23, acoustic beat ✓ 24+25, material rulings ✓ 26, pump
integration ✓ 26). Read-first companions: evidence 26 (rulings + pump + the port plan)
and evidence 23 §2 (the spine-design workflow this cycle reuses).

    branch   codex/jg033-signature-shot @ 15fd488 == origin (pushed)
    tree     CLEAN except untracked `.codex/`, `.zcodeignore` — never commit those
    server   vite preview :4173 serving dist(15fd488) — binds IPv6 only: Chromium needs
             `http://[::1]:4173`; curl `localhost` works. RESTART after every rebuild
             (kill the PID on :4173, relaunch `npx vite preview --port 4173 --strictPort`).

## 1. THE TASK: port the owner's Blender intake move into the study

The owner shifted the lower intake in Blender (skid bay, resting on V2FTA-FP-46-RL-1000-1
/ V2RL300-SAF-1047-4, per his green-X/orange-rect sketch). His export carries it as GLB
root `PROPOSED_LOWER_INTAKE` (dropped at load — the authored code copy is the renderer).
**The move measured (2026-09-24, both GLBs decoded) as a PURE TRANSLATION
(0, +.205, +.150) — no rotation, no scale.**

### Exact port

1. `src/scene/rl300/LowerIntake.tsx` — in `createLowerIntake()`, after building the
   group: `group.position.set(0, .205, .15)` (matches his Blender transform exactly;
   internal geometry unchanged).
2. `src/scene/rl300/flow.ts` — `SPINES.lower` waypoints 0–5 shift by (0,+.205,+.150);
   waypoints 6–8 (the climb + merged pin) UNCHANGED:
   current 0–5: [-.18,-.10,.774] [-.18,.05,.772] [-.18,.105,.640] [-.18,.092,.300]
                 [-.18,.098,-.100] [-.17,.30,-.300]
   shifted   : [-.18,.105,.924] [-.18,.255,.922] [-.18,.31,.790] [-.18,.297,.450]
               [-.18,.303,.050] [-.17,.505,.005]
   NOTE wp4 z becomes +.050 (was -.100): still inside the duct's aft run (duct z-range
   shifts to -.18...+.74). VERIFY with the scorer before speccing — do not trust these
   numbers blind; re-run the sweep-style checks below.
3. `preview.test.ts` — the lower-bundle ruling test constants shift: louver band
   z .599–1.202 at panel plane y .172; crossing footprint bounds z .599–1.202; collector
   box y .185–.345 z .625–1.175; duct top-panel band z .114–.734 (panel bottom y .334,
   floor y .196); riser z -.305...-.035, left wall x -.204 unchanged, wall top y .500;
   start-height band y [.075,.143] (crawl space is now the skid bay, ground y -.22
   unchanged). The GLB re-probes (measure.mjs pattern) should re-run for the shifted
   climb wp5→wp6 leg (longer now: .505→.62) — EMG panel band clearance may need a lane
   re-check.
4. **Astra's numbers are again potentially stale**: the pump root (PUMP_HOUSING.001,
   world (0,.829,.796)) now occupies the machine's upper-interior — re-probe the climb
   corridor AND the merged landing zone against the NEW GLB before pinning waypoints.
5. Workflow: reuse evidence 23 §2–§3 exactly (scorer `.scratch/lower-fix/score.mjs`
   pattern with shifted constants; spec → producer via seatwrap → adversarial review →
   architect gates → captures six stops + u .45–.65 → before/after pixel-diff → owner
   contact sheet → commit code+tests+evidence together).

### Timing note

Lower draw window `smooth(.41,.60,u)` unchanged; shifted arc ≈ same length (verify in
the scorer); eyeball captures at u .45–.65.

## 2. State of everything else

- **Shipped today (all owner-approved or validated)**: lower bundle (23), acoustic beat
  (24/25 — measured baffle contacts, junction collisions, stubs, chevron rise-settle),
  RES yellow + SIF blue rulings (26), the owner's v5 GLB with the real pump live
  (PUMP_HOUSING.001, 24.8k tris; telemetry 1,201k tris total, draws 105–106).
- **2a control panel blacks**: BLOCKED on the owner splitting `V2CONTROL PANEL, URFS-2`
  into named-material sub-meshes in Blender (single mesh/material today). Key switch can
  reuse the CHROME treatment. Interim option offered: one dark tone in code.
- **RES follow-up option**: `V2RL300-SAF-RES-1019-SAFE-1` still sectioned while 1020 is
  'keep'/whole — one PART_POLICY line makes the pair identical; owner hasn't ruled.
- **Astra re-clear packet** (the last fix-first item): one call, medium effort ONLY
  (owner cap), her missing-evidence list verbatim (evidence 21): louver close-up,
  acoustic evidence, fwd/rev capture through hairpin+merge (video or frame strip, not
  stills), terminal closure. Prompt pattern `.scratch/astra-packet/prompt.md`; with `-i`
  the prompt MUST come via stdin; proof = ocx logs `openai/gpt-6-astra` 200. Run AFTER
  the intake port so the packet shows final geometry.
- JG-034 (blocks verify-jg032-station2-thermal on ANY build) · main-page integration
  (study lives at `?study=rl300`) · v4 node-rename pass (may re-commit the GLB; real
  lineage blend = `RL300-SAFE-webexport-v5-duct.blend`).

## 3. Orchestration facts (proven today — do not relearn)

- **Producer pool**: GLM (`zai/glm-5.3-flash`) — alternation says DeepSeek produces
  next, but DeepSeek flaked all day (402 → top-up → recurring 429 mid-review);
  gpt-5.6-luna deterministically stalls on long agentic reviews (single preamble turn,
  ~16.5k tokens, Stop). Working reviewers: DeepSeek when a cheap probe answers, else
  **gpt-6-astra at MEDIUM** (owner cap: astra medium/low only). The next producer choice
  is the fresh session's call — probe both, say what you chose.
- **A cancelled blocking TaskOutput KILLS the background dispatch** (exit 137, twice
  today). Poll with sleep + file mtimes + ocx logs instead. A live orphan codex can
  still be working (the RES review delivered after its parent died); wedged = no writes
  in ~75 s + an error row in ocx logs → kill PID, audit partial diff, dispatch a RESUME
  spec naming exactly what already landed.
- GLM seats reliably introduce bare-LF lines — every spec mandates CRLF re-normalization
  (both seats self-fixed today when told).
- seatwrap + bare `timeout` → always `"C:/Program Files/Git/usr/bin/timeout.exe" 1500
  codex …`. Seats verify with `npx vitest run --configLoader runner`. Ignore seatwrap's
  `verify_rerun_exit` on compound commands.
- Every owner-facing change gets adversarial review with mutation teeth (the pipeline
  test pattern in preview.test.ts is the standard; three reviewer instruments live in
  `.scratch/lower-fix/review{,2,3}/`).
- Blender notes: owner on 5.x; his Compression path DOES produce Draco (the checkbox is
  just hidden — "no encoder" was wrong). Blender 5.2+ Draco reports exist; his export
  validated fine. Intake reference export: `WEB-lower-intake-REFERENCE-20260924.glb`
  (node GLTFExporter needs a FileReader shim).
- ICM importance takes WORDS. Auto-memory carries this handoff's summary; this file is
  the canonical cross-harness carrier.

## 4. Exact next action

Read evidence 26 §"NEXT cycle", re-run the clearance probes against the new GLB
(`.scratch/lower-fix/measure.mjs` pattern — update PROBES to the shifted waypoints),
score the shifted spine (`.scratch/lower-fix/score.mjs` with shifted constants), then
spec → seatwrap dispatch → review → gates → captures → contact sheet → commit/push →
owner ruling.
