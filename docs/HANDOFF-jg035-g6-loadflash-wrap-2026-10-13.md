# HANDOFF — JG-035 G6 + load-flash closeout (2026-10-13)

**Workspace:** `C:\Projects\jgun-portfolio` (junction to `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`) — branch `codex/jg033-signature-shot`.
**Session scope:** original-project state review → G6 diagnosis → hardware stills → load-flash diagnosis → wrap. The torque-wrench rebuild worktree had its own concurrent session (landed Stage 3 as `4e620d48`; its 5 modified + 17 untracked files were NOT touched).

## What landed

- `ec796c0f` — G6 diagnosis packet (`g6-diagnosis-2026-10-13/`), 37 hardware-GL owner-ruling stills (`stills-hardware-gl-2026-10-13/`), stale drawing-cache TODO corrections (asset v8 = code v8, closed 2026-10-08).
- Wrap commit (this one) — load-flash packet (`load-flash-diagnosis-2026-10-13/`), brainstorm prompt (`docs/PROMPT-load-window-brainstorm-2026-10-13.md`), TODO note extension, this handoff.
- Both commits are **local only**; the branch otherwise sits pushed through `eb550958`. `origin/main` is stale — the long-pending owner action is the ff-merge to main + deploy (vault repo-sync alert).

## Established findings

1. **G6 (desktop-full tier drop)** — at DPR 1 the DPR staircase is empty, so the first PerformanceMonitor decline during sheet warm-up demotes full→lite permanently (`SceneCanvas.tsx:28,35-37,432-443`; `qualityStore.ts:77-83`). Live-reproduced 2026-10-13 on hardware. The 110 roster-expectation failures are downstream of this.
2. **Opening load flash (owner-reported shadowed wrench)** — `DrawingLinework.tsx:334` returns null until bake while `TorqueWrenchHero.tsx:353-356` falls through to the visible identity pose; window ≈1.5–8 s on the live-bake path.
3. **Shared root cause** — no gate between canvas-alive and opening-ready. oryzo.ai gates its opening via `#preloader-canvas` in initial HTML (verified in markup).

## Owner decisions pending

- Shared remedy: gate the scene (or model visibility) until `drawingRuntime.ready`/warm, and warmup-gate the PerformanceMonitor. One gate closes both symptoms. Alternatives in the packets.
- Load-window brainstorm: run an agent on `docs/PROMPT-load-window-brainstorm-2026-10-13.md` (concepts for the "you're about to see my work" portfolio framing).
- The 37 stills await the owner visual pass (first hardware-GL look at the graphite handwriting + shard walls).

## Boundaries

No product code changed. No push, deploy, or publication. `.scratch/` holds the raw probes (`g6-tier-probe.mjs`, `load-window-probe.mjs`, probe JSONs) — never commit. Pre-existing untracked files (junk `1.43`)`/`nul`/`sum`/`that`, `__pycache__/`, three 10-08/09 docs incl. the refactoring assessment) are not this session's and remain uncommitted.

## Ready-to-paste prompt for the next session

```text
Resume in C:\Projects\jgun-portfolio (junction to .buzz/REPOS/jgun-portfolio), branch codex/jg033-signature-shot, HEAD = the 2026-10-13 wrap commit (two local commits after eb550958, not pushed).
Read first: docs/HANDOFF-jg035-g6-loadflash-wrap-2026-10-13.md, then the two packets under project/work/evidence/JG-035-opening-drafting-table/{g6-diagnosis,load-flash-diagnosis}-2026-10-13/README.md.
State: G6 and the opening load-flash are diagnosed with a shared root cause (no gate between canvas-alive and opening-ready); 37 hardware-GL ruling stills exist under stills-hardware-gl-2026-10-13/ awaiting the owner visual pass.
Next actions, owner's pick:
1) Rule on the shared remedy (drawing-ready visibility gate + warmup-gated PerformanceMonitor) and authorize implementing it.
2) Run the load-window brainstorm: hand docs/PROMPT-load-window-brainstorm-2026-10-13.md to a brainstorming agent.
3) Review the stills (start with opening-desktop-t0p38.png, shaft-25p4s.png, ring-8s.png).
Do not push/deploy/publish; do not commit .scratch/; leave the torque-wrench rebuild worktree to its own session.
```
