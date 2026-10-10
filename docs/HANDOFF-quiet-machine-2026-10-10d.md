# HANDOFF (d): QM4-fix, QM5, QM6a, QM6 landed; GPU-2 + GPU-3 ask next, 2026-10-10

Cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`, nothing pushed. Read this, then `docs/HANDOFF-quiet-machine-2026-10-10c.md` "Method that worked" and "Traps", then plan sections E (GPU protocol) and QM7.

## Line one (owner skim)
| Item | Value |
|---|---|
| Landed this session | `f669fd57` QM4-fix, `f68db769` QM5, `79b6be87` QM6a (plan amendment, one extra commit row), `e709e672` QM6. GPU-1 **PASS** after QM4-fix |
| Metered spend | **1,833,617 tokens** all-time (this session 888,122: 8 spawns, Sonnet 5.5 high x6, Opus 5.5 medium x2). Advisor x2 and orchestration unmetered |
| Next | One batched ask: **GPU-2 + GPU-3** (needs a JG-035 GPU release and ports 4173/5199 re-confirmed). Nothing visual is "done" before the owner looks |
| Owner decisions pending | (1) stale `rl300-lite.glb`: needs an asset decision and a plan amendment (QM9b is the plan's only asset commit and is conditional); (2) the intake camera box projects to ndc 21-26 (look at GPU-2); (3) end-card copy and `.shell-nav*` look (unruled); (4) Q2/Q3/Q4/Q5-Q6/Q8 stand at plan defaults |

## What happened
- **GPU-1 first FAILED, not a QM regression:** `verify-jg033-preview.mjs` was stale against the 2026-09-24/25 scene and failed identically on the base build (airway helper 28 full / 24 lite; intake ndc 21.6 desktop, 26.4 tablet; lite cap tris 165216 vs full 154554). Its first real run also exposed a **QM3 defect**: the `webglcontextlost` listener attached to the canvas only after React `ready`, so a loss at ready was missed. Fixed in QM4-fix by a capture-phase listener on `.qm-stage`. Verifier now pins intake ndc per viewport (tol 0.5) and tolerates the stale lite asset only at its exact measured counts, with a stderr WARN every run. Evidence: `project/work/evidence/rl300-quiet-machine/31-gpu-1-qm-entry-smoke.md`, `31-gpu-1/`.
- **JGUN runtime arm of GPU-1 is UNVERIFIED:** `verify-jgun-opening --quick` resolved the lite tier on desktop in both arms, no same-build control pair, deltas unexplained (camera y up to 0.108, planetRot 0.73 rad). Only U.4 (JGUN source set + fetched CSS identical) speaks for the torque page. Cheapest fix: `--quick` twice on one build and diff; find why desktop picks lite.
- **QM5:** one length constant (900vh) drives `--qm-length`, progress bar, end card at u >= .97, one-shot prefetch. `.shell-nav*` and end-card styles are **unruled visual work**. Seat flagged: no "01"/"03" numbers render (plan line 398), end card links the current page to itself with `data-fade`, two `nav` landmarks both labelled "Pages", header/editorial overlap at 390x667 (add that capture to GPU-2).
- **QM6a:** `animationend` (filtered by root target and `shell-fade-out`), reduced-motion flag consumed with no cover (changes `FADE_BLOCK_SHA256` to `e30f6045...`, deliberate), `appType` test imports the Vite config.
- **QM6:** `scripts/verify-page-transition.mjs`, 7 cases, **never run in a browser**. Two Opus review rounds; round 2 findings (fade-out could not tell the fallback from the event; click-before-ready) were applied by the orchestrator without a third review, per the cap, and disclosed in `## QM6`. First execution is GPU-3.

## GPU-2 + GPU-3 notes (read before the ask)
- Re-confirm with the owner: JG-035 session released the GPU; 4173 and 5199 free. The GPU release was **not** re-confirmed this session beyond "no listener on those ports".
- **Never kill processes by command-line pattern** (a `vite`+`preview` match kills every preview on the machine, including JG-035's production preview on 4173). Capture the PID at launch or match this worktree's path.
- Before each verifier run, fetch `/quiet-machine/` and compare with `sha256sum dist/quiet-machine/index.html`: a foreign server on the port makes `--strictPort` fail quietly.
- GPU-3: run `verify-page-transition.mjs` against `vite preview`/`dist`, not `vite dev`. Read `darkFraction` next to `brightFraction` on the no-white-frame mutant. An UNVERIFIED case other than `back` is a failed gate (`GATE-INCOMPLETE` line). Run case 7 once against a pre-QM6a build for its red proof (`git worktree` at `f68db769`). Mutations: plan lines 434-439, recorded in the commit after GPU-3.
- GPU-2: plan section E row + section A list; add the 390x667 header capture and the lite-vs-full geometry comparison so group A is not ruled on stale lite geometry.

## Carried follow-ups
| When | Item |
|---|---|
| Owner | Lite asset decision (regenerate `rl300-lite.glb`?), see line one |
| QM7 onward | Re-derive `RULING`/count asserts in `verify-jg033-preview.mjs` when QM7b changes parts (plan I.14); `capTarget` assert at open anchors only (QM9) |
| QM9 | Lite policy: the `KNOWN_STALE_LITE` tolerance in the verifier must be removed or re-pinned when the lite asset changes |
| QM10 | `.qm-poster img` `src.includes('intake')` assertion breaks on poster rename |
| QM11 | no-slash `/quiet-machine` 404 vs Cloudflare redirect; U.4 caveat (QM preview is a dynamic chunk); fold the spawn ledger into the evidence README; `jgun-qm-base` removal (keep until QM10; U.4 uses `--base-root`) |
| Next touch of `check-qm-jgun-assets.mjs` | `dynamicEntries[].srcEqual` tautological; report an unmatched `baseKey` |
| Hygiene | Seats keep leaving 0-byte files in the repo root (`c.status`, `0`, `{})`, `setTimeout(r`): unquoted `=>`/`>` in shell one-liners. Delete 0-byte ones created in-session; never the three old strays (`2`, `key`, `document.querySelector('.qm-poster`) |

## Spawn ledger (this session, metered)
| # | Work | Seat | Effort | Tokens |
|---|---|---|---|---|
| 9 | GPU-1 run | Sonnet 5.5 | high | 131,005 |
| 10 | QM6 verifier author | Sonnet 5.5 | high | 131,604 |
| 11 | QM5 build | Sonnet 5.5 | high | 88,220 |
| 12 | QM6a build | Sonnet 5.5 | high | 91,458 |
| 13 | QM6 verifier amend | Sonnet 5.5 | high | 117,412 |
| 14 | QM6a + QM6 review R1 | Opus 5.5 | medium | 92,529 |
| 15 | QM6 rework | Sonnet 5.5 | high | 129,850 |
| 16 | QM6 review R2 | Opus 5.5 | medium | 106,044 |
| | **This session** | | | **888,122** |
| | **All-time (945,495 + this)** | | | **1,833,617** |

QM4-fix itself was authored inline by the orchestrator (advisor-reviewed), not by a builder seat.
