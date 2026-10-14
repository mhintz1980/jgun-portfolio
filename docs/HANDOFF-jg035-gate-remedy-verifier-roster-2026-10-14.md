# HANDOFF — JG-035 shared gate remedy + verifier roster correction (2026-10-13/14)

**Workspace:** `C:\Projects\jgun-portfolio` (junction to `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`) — branch `codex/jg033-signature-shot`.
**Session scope:** owner authorized the shared G6/load-flash remedy → implemented + verified (`e1b47188`); owner directed the verifier-roster O1 correction → implemented + verified (`ab5167cd`); documents updated; this handoff. The torque-wrench rebuild worktree was left to its own session throughout.

## What landed (both local only; branch now 4 commits ahead of origin)

1. `e1b47188` — **shared gate remedy** (`src/scene/SceneCanvas.tsx`, `src/scene/TorqueWrenchHero.tsx`): the PerformanceMonitor mounts only at station `warmfinish` (children-less sibling; `WarmStationPrograms` gained `onWarmReady`), and the hero's extraction-end fall-through writes `modelRoot.visible = drawingRuntime.ready`. DPR staircase, tier meanings and monitor handlers unchanged. Evidence: `project/work/evidence/JG-035-opening-drafting-table/shared-gate-remedy-2026-10-13/` (G6 probe full/0 declines; model-invisible-until-ready timeline; quick A/B 90→1 per viewport).
2. `ab5167cd` — **verifier roster O1 oracle correction** (`scripts/verify-jgun-opening.mjs`): the lightning pixel proof moved from intro t .67 (authored sub-visual spark, `smooth01(0.0952) ≈ 0.025` — could never pass honestly) to the existing t .78 burst/hold checkpoint; .67 keeps armed-window telemetry assertions. Evidence: `project/work/evidence/JG-035-opening-drafting-table/verifier-o1-lightning-contract-2026-10-14/` (narrow PASS 0/0 with 629 changed bright pixels at phase .780; zero lightning failures anywhere).

## Verification state (read this before citing green/red)

- Calm machine, page code `e1b47188`: `--quick` = 1 failure/viewpoint → 0 after `ab5167cd`'s correction was proven by the overnight narrow case; the calm-machine natural-full quick green + the A/B (90→1) are in the shared-gate packet's `quick-ab-summary.json`.
- Overnight runs during the owner's active machine use (CPU 40–93 %): tier demotions to lite/poster occur during the scroll pass with `declines: 1, warmReady: true` — post-warm declines on genuinely slow frames, i.e. the designed behavior, not a regression. An unscrolled clean load under the same conditions held `full` with 0 declines. **Do not chase tier failures recorded on a busy machine.**
- Static: `tsc` clean, 435/435 tests, verifier static contract 92/0. Spec §5 was checked and is already O1-current (no edit needed).

## Owner items outstanding

- **37 hardware-GL ruling stills** await the owner visual pass: `project/work/evidence/JG-035-opening-drafting-table/stills-hardware-gl-2026-10-13/` (start with `opening-desktop-t0p38.png`, `shaft-25p4s.png`, `ring-8s.png`).
- **Load-window brainstorm**: hand `docs/PROMPT-load-window-brainstorm-2026-10-13.md` to a brainstorming agent (the gate is the substrate any preloader concept sits on).
- **Full 6-case roster on a calm machine** = the remaining done-evidence step for the corrected roster.
- Long-pending: ff-merge to main + deploy (origin/main stale; vault repo-sync alert). G6 secondary hardening (sustained-decline requirement, re-promotion, verifier tier-lock option) unapplied by scope decision.

## Boundaries

No push, deploy or publication. `.scratch/` holds the probes (`g6-tier-probe.mjs`, `load-window-analyze.mjs`, `analyze-png.mjs`, night-load JSONs) — never commit. Pre-existing untracked junk (`1.43\``, `nul`, `sum`, `that`, `__pycache__/`, three 10-08/09 docs incl. the refactoring assessment) is not this session's. Dev server protocol: `npm run dev -- --port 5199 --strictPort`; kill by PID (`netstat -ano | grep :5199` → `taskkill //PID <pid> //F`) — TaskStop alone leaves the listener alive.

## Ready-to-paste prompt for the next session

```text
Resume in C:\Projects\jgun-portfolio (junction to .buzz/REPOS/jgun-portfolio), branch codex/jg033-signature-shot, HEAD = ab5167cd (four local commits after eb550958, not pushed).
Read first: docs/HANDOFF-jg035-gate-remedy-verifier-roster-2026-10-14.md, then the two packet READMEs under project/work/evidence/JG-035-opening-drafting-table/{shared-gate-remedy-2026-10-13,verifier-o1-lightning-contract-2026-10-14}/.
State: the shared gate remedy (warmup-gated PerformanceMonitor + drawing-ready model gate, e1b47188) and the verifier lightning-proof O1 correction (.67→.78, ab5167cd) are implemented and verified; the quick pass is fully green on a calm machine (narrow 0/0 recorded overnight; calm-machine natural-full A/B in the shared-gate packet). Tier failures seen on a busy owner-active machine are designed post-warm behavior — do not chase them.
Next actions, owner's pick:
1) Run the full 6-case opening roster on a CALM machine as the done-evidence step (node scripts/verify-jgun-opening.mjs --url=http://localhost:5199, dev server npm run dev -- --port 5199 --strictPort, kill by PID when done).
2) Owner stills visual pass results — 37 captures under stills-hardware-gl-2026-10-13/ (start: opening-desktop-t0p38.png, shaft-25p4s.png, ring-8s.png).
3) Load-window brainstorm: hand docs/PROMPT-load-window-brainstorm-2026-10-13.md to a brainstorming agent.
4) Long-pending ff-merge to main + deploy (owner authorization required before push).
Do not push/deploy/publish without the owner; do not commit .scratch/; leave the torque-wrench rebuild worktree to its own session.
```
