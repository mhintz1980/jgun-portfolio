# JG-025 — Handle-rear realism pass: red button/LCD cluster, rendered screen, reveal-beat framing

**Status:** verified (implemented 2026-09-05, merged with JG-026 + pushed, owner visual PASS — [evidence](../evidence/JG-025-handle-rear-verification.md); triaged 2026-09-02 from [inbox/jgun-handle-rear-redesign.md](../inbox/jgun-handle-rear-redesign.md))
**Owner dictation:** 2026-09-02 (chat, with reference render) + 2026-08-30 intake (JG-021 re-review)
**Type:** visual fidelity + feature pass on the Station 1 handle rear (LCD endcap cluster)
**Owner reference:** [`project/context/references/media/handle-rear/handle-rear-owner-reference.png`](../../context/references/media/handle-rear/handle-rear-owner-reference.png) (CAD render of the back face — glossy black cap, red LCD bezel, three red buttons with dark arrow/enter symbols, blank white LCD)

## What the owner wants (2026-09-02 dictation)

1. The reveal moment shows the handle's **back face like the reference picture**, not the current look.
2. He likes the **button shapes** (▲ / ⏎ / ▼) and the **red** on the buttons and **around the LCD screen**.
3. This beat should become **the most realistic portion of the entire assembly**: rendered LCD light, believable materials on buttons and bezel.
4. **Data on the LCD** — "maybe even some data displayed on that LCD screen" (content TBD by owner; see Open items).

Carried from the 2026-08-30 intake (still wanted, now folded into the realism goal):
screen-light tuning (was "too bright" then — superseded in emphasis by "rendered LCD lights
… make it look amazing"; final level is an owner stop-point ruling), symbols/text on buttons,
digital numbers on the display.

## Current measured state (recon 2026-09-02)

The rig already tags the cluster as rig units — this is code-side material work, **no GLB
re-export needed** (the JGUN-1.glb geometry already carries the button/bezel shapes per the
CAD source; verify symbol geometry with a node dump at build time):

| Unit | Source parts | Current look | Reference wants |
|---|---|---|---|
| `lcd-screen` | P002115 | warm-white emissive `#fffde0` @ 5 (`materials.ts:331`) | realistic lit screen + data |
| `lcd-buttons` | P002123/24/25 | **cool-blue** backlit `#c8e6ff` @ 1.5 (`materials.ts:341`) | **red**, dark symbols |
| `lcd-housing` | P001924 | `anodizedAluminum` (`materials.ts:101`) | **red bezel** + glossy black cap |
| fill light | — | `LcdFillLight` warm, 2.8 peak, gated on `LCD_REVEAL_WINDOW` (`SceneCanvas.tsx:66`) | tune to reference mood |

Reveal beat exists (JG-014): `LCD_REVEAL_WINDOW` + `LCD_ORBIT_KEYFRAMES` drive the post-explode
rear reveal. Related finding: [inbox/dead-role-overrides.md](../inbox/dead-role-overrides.md) —
name-keyed `ROLE_OVERRIDES` never match at runtime; **unit-default roles are the live path**
(all changes go through `roleForUnit` + role cases, never `ROLE_OVERRIDES`).

## Build approach

- **A — Color/material swap** (`materials.ts` only): red button-backlit role (sample the red
  from the reference render), red bezel role for the LCD surround, glossy black cap. Screen
  emissive re-tuned for realism (white readout on dark field per reference).
- **B — LCD data readout**: `CanvasTexture` on the screen face (torque Nm readout, battery,
  mode glyphs — content per owner); if P002115 UVs are unusable, fall back to a measured decal
  plane on the screen face. Static or progress-gated content; zero per-frame allocation
  (r3f-scroll-performance-guard rules).
- **C — Button symbols**: dump the GLB subtree for symbol geometry on P002123/24/25; if the CAD
  carried them, they render via the material swap; else add decal planes matching the reference.
- **D — Reveal-beat framing**: same-frame capture of the current reveal dwell vs. the reference
  view; only touch `LCD_ORBIT_KEYFRAMES` if framing disagrees — a ladder-touching change
  triggers the animation-spec §5 same-commit sync rule.
- **E — Fill light**: retune `LcdFillLight` to the reference mood; keep the 08-30 "too bright"
  note as a lower bound consideration — owner rules at the stop point.

## Constraints

- Unit-default material path only (dead `ROLE_OVERRIDES` — see finding above).
- GLTFLoader expands multi-prim defs into Groups; tag the GROUP, skip `occurrence_of_*`
  wrappers (JG-024 trap).
- No GLB re-export; part-number identity untouched; no ladder reorder.
- Station 2 contract script expected green (untouched, but run it).

## Verification bar

Runtime telemetry (material identity via `__threeScene` at the reveal dwell), same-frame
before/after pairs, reduced-motion + poster tiers read correctly, `npm run typecheck`,
`npm run build`, `scripts/check-station2-contract.mjs`, committed capture artifacts, and the
**owner visual ruling at the preview stop point** before close.

## Owner rulings (2026-09-02, recorded in chat)

1. **LCD data content** — proposal accepted for now: torque Nm readout + battery bar +
   units/mode glyphs, matching a real torque-wrench LCD.
2. **Red** — sample from the reference render (no brand red specified).
3. **Fill light / bloom** — soft, never squint-inducing; "not too much bloom and brightness",
   but **still very sharp and legible**. This is the realism light-canon for the pass.
