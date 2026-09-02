# INBOX — Upgrade Roadmap v1 (review draft for Mark + codex / claude / fable)

**Status:** review draft — composed 2026-09-02 by ZCode from the standing plan corpus. Awaiting
Mark's review, cross-agent critique (codex, claude, fable), then Mark's final decision. On
decision it becomes the triage source for the next run of JG-### work IDs. **No implementation
is authorized from this document yet** — plans and per-agent tasking are written after the
final ruling.

**Reviewer context map** (self-contained starting points):
- Current shipped baseline: [TODO.md](../../TODO.md) (all JG-014–024 verified) · [INDEX.md](../INDEX.md)
- Animation redo spec of record: [animation-redo.md](animation-redo.md) (owner-dictated 08-31, filed 09-01)
- Source analysis this roadmap consolidates: [five-plans-synthesis.md](five-plans-synthesis.md) (W1–W8, plan grades, not-taken list)
- Flagship realism task: [../plans/JG-025-handle-rear-realism.md](../plans/JG-025-handle-rear-realism.md) (rulings recorded 09-02)
- Repo rules any build must honor: [AGENTS.md](../../AGENTS.md), `project/context/session-phases.md`

---

## 1. Direction

The visual baseline is locked, verified, and live (jgun-portfolio.pages.dev /
www.studiomark.dev). The next run upgrades the site from **correct CAD showcase** to
**cinematic, realistic product film**: one continuous camera path, a small number of
realism-flagship moments executed to a reference bar, chapter stories carried by procedural
backdrops and engineered copy — all under the repo's existing hard gates (runtime telemetry,
same-frame evidence, tier parity, perf at the 16.8 ms quantum, owner visual rulings).

Three pillars, in dependency order:

1. **Realism flagship** — prove the realism canon on one self-contained beat (handle rear),
   then propagate it through the redo.
2. **Cinematic spine** — build the missing structural pieces (camera rail, inspection orbit)
   that the redo beats choreograph against.
3. **Surround craft + polish** — backdrops, captions, badges, then timing polish last.

Restraint rule (from the synthesis, unchanged): reuse what shipped (JG-020 hotspots,
JG-023 backdrops, CadTransitionShader); build only the missing spine. Anything not on this
list goes through Task Intake.

## 2. Build order

> Sizes: S ≤ 1 session, M ≈ 1–2, L ≈ 2+ with verification. Gates name what must exist or be
> decided before the item starts.

| # | Item | Source | Size | Why this position | Gates |
|---|---|---|---|---|---|
| **P0** | **Asset staging** — defer enclosure + M249 GLB fetches off the boot path (idle/scroll prefetch) | synthesis W1 | M | Invisible perf headroom before adding visual work; zero visual risk; no dependencies | none |
| **P1** | **JG-025 handle-rear realism** — red button/LCD cluster per owner reference, LCD data readout, button symbols, reveal framing, soft-sharp light canon | plans/JG-025 | M | Fully specified (owner rulings recorded 09-02); independent of camera work; **sets the realism canon** the redo inherits; first visible win. Framing is verify-and-adjust only — the later camera rail preserves authored holds, so no wasted work | none — ready to build |
| **P2** | **Camera rail** — one tangent-continuous camera path (Catmull-Rom/Bézier), scroll→arc-length, goal-pure-function + damp preserved, authored holds explicit | synthesis W2 + intake | L | The structural spine: redo beats, orbit, and polish all choreograph against it. Straight-lerp velocity stalls at every segment join are the #1 cinematic defect | none — gate (JG-021 close) cleared 09-01 |
| **P3** | **Inspection-orbit + cutaway** — bounded scroll orbit on a selected subassembly (scroll past bound releases; no exit button, ever); P000245 cutaway via plain clipping plane first | synthesis W6 + intake | M | Redo beat B4 (clickable subassembly inspection) needs the orbit to exist before it can be choreographed | P2 |
| **P4** | **Animation redo — beats B** (CH.01: drawing→3D, glow-rise, explode retained) **then beats C** (CH.03: dark-blue paint, hex intake, S-flow story, particle follow-cam, plume) | animation-redo.md | L (split B/C into separate IDs at triage) | The program itself, built on the spine (P2) + orbit (P3). B before C: C's airflow story reuses the B-established grammar | **24-row elaboration rulings** + **round-table session** (both owner); C4 additionally gates on **Mark's flow overlays** |
| **P5** | **Surround craft** — backdrop-evolution (per-chapter palettes/frequency model) · narrative-layer (CH.03/04 captions to CH.01/02 language) · badge-occlusion (fade badges under geometry) | synthesis W5/W3/W4 | M each, independent | After the beats stabilize so captions and backdrops are authored once, not twice. Badge-occlusion is independent — pull it earlier as filler if capacity allows | backdrop-evolution: round-table layout output |
| **P6** | **Motion polish** — acceleration, dwell, target lag, text entrances | synthesis W8 | S | Only when all content exists — polishing moving targets is waste | P2 + P4 |

**Round-table session (owner, unscheduled):** slots between P3 and P4 — it fixes the
background/layout decisions that beats B1/B2/B5/C3/C6 and backdrop-evolution need. Recommended:
schedule it while P0–P2 are building.

## 3. Owner inputs needed, and when

| Input | Needed by | Status |
|---|---|---|
| This roadmap's final decision (after agent critiques) | before P0 starts | pending |
| 24-row Plan4 elaboration rulings (one yes/no each, `animation-redo.md`) | P4 planning | sheet awaits Mark |
| Round-table session (background/layout) | between P3 and P4 | unscheduled — Mark's call |
| Flow-path overlays (C4 spline control points) | beat C4 only | pending |
| Stop-point visual rulings | every phase, at its preview stop | standing |

## 4. Nice-to-have (post-run backlog — discussed or proposed since, none committed)

1. **M249 chapter redo (CH.04)** — owner-deferred from the redo scope; revisit once B/C prove
   the transition grammar and the rail exists.
2. **Free drag-orbit inspection** — pointer-driven orbit beyond the scroll-bounded P3 orbit
   (orzo-roadmap idea; useful for portfolio viewers who want to inspect).
3. **Cutaway section shader** — only if the P3 clipping-plane cut face fails owner review
   (contingency, fenced).
4. **Mobile LOD geometry variants** — only if mobile telemetry demands it after P0 lands
   (fenced experiment in the synthesis).
5. **Per-station lighting principles doc** — documentation-only (JGun warm key/edge;
   enclosure palette locked; M249 neutral); no code unless the owner reopens the locked look.
6. **Handle open-up — internals reveal** (owner-suggested 2026-09-02) — extend the
   rear-extraction ladder so the handle assembly disassembles (LCD cluster, PCB, battery,
   chrome fittings separate), exposing the electronics that are permanently hidden today.
   Carries the dormant `ROLE_OVERRIDES` table as its material vocabulary: the plumbing fix
   (feed each mesh's nearest real node name into `materialRoleFor`, per
   [inbox/dead-role-overrides.md](dead-role-overrides.md)) rides this work so
   PCB/battery/chrome/rotorSteel finally apply — which is why the table is kept, not deleted.
   Natural companion to the redo beats or JG-025's realism canon if pulled forward.
7. **Parking:** gearbox-material transplant (designed-but-unimplemented glow fallback,
   JG-021 §12) — available on request if the approved look ever regresses.

Explicitly NOT planned (do not resurrect without new owner direction): the synthesis §6 list —
lens-grain pass, DOF rack-focus, clamshell/slow-mo elaborations, station-lighting code, and the
other recorded rejections with reasons.

## 5. Questions for reviewers (Mark + codex / claude / fable)

1. **Flagship-first (P1) vs spine-first (P2)** — is starting with the handle-rear realism beat
   right, or should the camera rail lead? (ZCode's lean: flagship first — it is fully specified,
   independent, and establishes the realism canon; the rail preserves authored holds so nothing
   is wasted.)
2. **Surround craft after beats (P5)** — captions/backdrops authored once vs. earlier visual
   richness. Correct trade?
3. **Cutaway in scope at all?** It rides P3; the plain-clipping-plane-first rule keeps it
   cheap, but it could be deferred entirely to nice-to-have.
4. **Anything missing** from the nice-to-have list that belongs in the main run — or vice versa?
5. **Risk check:** JG-025's reveal-framing adjustment vs. the later camera rail (held safe by
   "authored stays explicit" — any disagreement?).
