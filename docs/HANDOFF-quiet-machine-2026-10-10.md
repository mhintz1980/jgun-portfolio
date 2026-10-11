# HANDOFF — Quiet Machine integration + torque wrench rebuild (2026-10-10)

> **SUPERSEDED STATUS 2026-10-10 (evening):** the structure is approved (`d826cd38`) and the plan is approved (`520b6982`). Q1 is ruled (a). Next action is QM0. Start from [`HANDOFF-quiet-machine-2026-10-10b.md`](HANDOFF-quiet-machine-2026-10-10b.md). §4 and §5 below describe the earlier state.

Written for a fresh session. Read this, then the files it points to. Do not resume from chat memory.
Owner works with several agents and has lost feedback before: **write every owner ruling into the repo the moment it is given.**

## 1. Where things live
| Thing | Location |
|---|---|
| Quiet Machine track (this branch) | worktree `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration` (cut from `eb550958`) |
| Torque wrench rebuild track | worktree `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`, branch `torque-wrench/rebuild` (cut from the commit that added this file) |
| Main checkout `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio` | branch `codex/jg033-signature-shot`. **Owned by the JG-035 acceptance session** (TODO.md, INDEX, source, verifiers, GPU, preview ports). Do not edit or switch it. |
| Shared planning docs | `docs/quiet-machine-integration-design-2026-10-09.md` (§9 owner answers, §10 amendment), `docs/quiet-machine-integration-structure-2026-10-10.md` (**partly stale, see §3**), `docs/owner-notes-marksList-2026-10-10.md`, evidence `project/work/evidence/rl300-quiet-machine/29-*` and `30-*` |
| Torque wrench notes | `docs/torque-wrench-rebuild/` (docs) and `project/work/evidence/torque-wrench-rebuild/` (captures) in the torque worktree |

Run two sessions concurrently: one in each worktree. Never two sessions in one folder.

## 2. Decisions — FINAL, do not relitigate
Owner answers in this program (2026-10-09/10):
1. The torque wrench (JGUN), the Quiet Machine (QM) and M249 each get their **own page and own scroll length**.
2. Between pages: **hard page navigation with a fade through dark** (no soft route, no persistent canvas). The fade needs Astra approval.
3. QM page is a **second HTML entry at `/quiet-machine/`**. Old `?study=rl300` links redirect to it.
4. **M249:** reserve the slot only (URL, nav entry, redirect). M249 and its JG-036 `m249-trunnion` hotspot are offline until JG-037 ships; **the split is not published before then.**
5. QM triangle budget: target ~500k; accept the measured number only if device-named p95 holds 60 fps desktop / 30 fps phone. QM launch hotspot: **one intake hotspot** (seek plus detail card).
6. Radiator-fan treatment and the v4 node-rename pass: **out of scope**, after launch.
7. **Torque wrench scroll length is NOT final** and nothing is tied to it (design §10). "JGUN timings unchanged" is **withdrawn**. Owner wants a much longer scroll-to-storyline ratio and a smoother flow; users currently fly past beats and must "tiny scroll" back.
8. **Extensibility is a first-class requirement:** beats authored as data on a scroll-length-independent timeline; adding a sequence must not mean editing the scroll spine.
9. Owner is open to a **fresh torque wrench page** that takes parts from the current one. The current page stays live and untouched until the replacement is accepted, then is archived (strangler). *Proposed default; confirm in the torque track's questions phase.*
10. **Bullet time (owner definition):** subjects stopped or extremely slowed while the camera moves at normal speed and freely orbits or arcs around the frozen assets. The Input Shaft cutter slow-mo inside a scroll-driven timeline is good but **NOT complete** (needs camera swings and slow-motion timing tweaks). It becomes the reference template **only once completed**. "Planet gear inspection" and "machined after heat treat for class H7/g6 fit" are not yet in the camera sequence.
11. **Opening scene look:** crack rhythm is fast-pause-farther-fewer-pauses (already in `src/scene/drawing/electricalScore.ts` `BURST_KEYS`); colour is **light blue electricity**; the tunnel under the paper must be **rocky and cavernous**, walls near-vertical, **no visible floor or bottom** ("could be miles deep"), circular hole and splined collar removed. Target: `project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png`. Current look (flat pale walls, no rock): `.../owner-revisions-2026-10-07/after-o1b/opening-desktop-t0p9.png`.
12. **First task of the torque track:** a diagnostic capture at t≈.84–.98 on real hardware GL, full tier, set against the target image, to decide whether the lost rock look is a tier/render problem or a geometry/shader problem. Do not change tunnel code before this.
13. Three expansion ideas from `marksList.md` are **candidates, not commitments** (AI HDRI environment, depth-map shard debris, GLSL mask scan). Review notes are in the owner-notes doc.

Standing rules (repo and memory): visual effects need **Astra** (`gpt-6-astra`, codex surface) approval before "done"; the owner rules by looking (send PNGs, not prose); no push, PR or deploy; passing tests cannot override a visual rejection; lane/agent reports are claims, verify with git, mtimes and greps.

## 3. What is stale
- `docs/quiet-machine-integration-structure-2026-10-10.md`: the **scroll-axis pin work is withdrawn** (commits C1, C2, C4's timing comparison, gates G4.1–G4.4, the 3120vh baseline). Commit order C0–C14 must be rebuilt. Its design-correction findings (SceneCanvas `warmReady` group lookup, M249 import preload, CHAPTERS coupling, `index.css` import, grep-gate comment stripping, `appType: 'mpa'`) remain valid and useful.
- Design doc §4 (scroll pin) and constraint D4 are superseded by §10.
- `TODO.md` on the main checkout still lists JG-033's entry-path fix as NEXT and a stale JG-032 panel assertion. Fixes landed in `a4f1fdd` and `1d04d35` (see evidence 29). The JG-037 row exists only in this worktree's TODO.md.

## 4. Phase status (questions > research > design > structure > plan > implement; stop for owner approval after each phase)
| Track | Questions | Research | Design | Structure | Plan | Implement |
|---|---|---|---|---|---|---|
| Quiet Machine + shell | done | done (29, 30) | **approved** | **approved** (rev 2, `d826cd38`) | **approved** (`520b6982`) | next: QM0 |
| Torque wrench rebuild | not started | not started | not started | not started | not started | not started |

## 5. Next actions
**Quiet Machine session (cwd: `jgun-quiet-machine`)**
1. Read this file, design doc §1–3, §5–10, structure doc corrections section.
2. Revise the structure for the new reality: the QM-first track must **not touch the current torque wrench page** (no shrink, no Station 2 archive until cutover). Keep W1/W2 shell as **generic page-shell primitives** (HTML entry, fade overlay, nav, poster path) because the torque rebuild and M249 will reuse them; keep W5 (QM page work), W6 (verifier repoints that don't depend on the old page), W7. Opus `tier-worker`, high effort, docs only. Stop for owner approval, then the plan phase.
3. Before any code: owner decides branch hygiene (this worktree is clean apart from docs).

**Torque wrench session (cwd: `jgun-torque-wrench`)** — kickoff prompt is `docs/torque-wrench-rebuild/00-kickoff-prompt.md`.

## 6. Hazards
- **One GPU, one seat, across all sessions.** The JG-035 session reserves hardware GL, builds, preview and ports (4173/4174/5203/5205). The torque track's tunnel capture needs that session to release the GPU first. Ask the owner; do not assume.
- Both new branches edit shared files (`index.html`, `vite.config.ts`, `App.tsx`, `StationNav`, `TODO.md`). QM owns the shell primitives; the torque track consumes them and designs only until they land. Put torque notes under `docs/torque-wrench-rebuild/` to avoid `TODO.md` conflicts; add a TODO row at the end.
- Stray empty files `sum`, `that`, `1.43`) and `nul` sit in the main checkout. Not ours; leave them.
- Hooks/tools truncate long outputs; trust file mtimes and git over reports.
