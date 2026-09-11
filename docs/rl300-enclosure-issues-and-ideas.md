# RL300 Enclosure — Owner Issues & Ideas (CH.03 animation)

> **Recorded:** 2026-09-09, from Mark's review of Kimi-K3's JG-032 work (commits `477c9c3..57e2e2d`, 2026-09-08).
> **Status:** Owner FAIL. This file is the owner's issue list and idea list for the repair.
> It supersedes any brief constraint that conflicts with it (notably
> `docs/kimi-visual-enhancement-brief.md` — see §4).

## 1. The issues

### 1.1 The enclosure is still yellow — the "dark-blue recolor" is invisible

The enclosure reads as a bright yellow box. The JG-032 recolor commit
(`7f7a0c2`) repainted only meshes whose material is `MSP_BLACK_CHASSIS` — parts
that were **already black** — to `#0a1a3a` (a near-black navy). That is a visual
no-op. Every yellow member is *deliberately excluded* from the recolor
(`src/scene/stages/recolorAllowList.ts`: "every yellow SIF/PEM/EMG member are
deliberately excluded"; "the large yellow G2C07-0085 / G2RL300-SAF-1xxx wall
sheets... deliberately excluded").

That exclusion was mandated by the audited brief (JG-021 failure-band-2
protection: "Never touch MSP_YELLOW_PAINT meshes"), and the verification probe
asserted "yellow unchanged" as a **pass gate**. Result: machine gates ALL PASS
while the one thing the owner asked for — a dark-blue enclosure — never happens.

**Requirement:** the yellow shell itself (wall sheets, SIF/PEM/EMG members) must
go dark blue. Hardware identity can be preserved (pump stays orange/steel so it
reads as the heat source), but the dominant shell color must not be yellow.

### 1.2 You can't see inside — shell walls and insulation are opaque

At the cutaway hold only the `COMPOSITE_PANELS` root lifts (0.55 m, opacity
fades 0.35 → 0.18, `Station2_AcousticEnclosure.tsx` choreography
p 0.585–0.715). The yellow walls that dominate the view are chassis-side skins
that never move and never fade, and the acoustic insulation (baffles) inside is
opaque geometry. The interior (pump, ducts, baffles) stays hidden — Kimi's own
evidence capture at the hold
(`project/work/evidence/jg032-station2-thermal/shot-p0_65.png`) shows a box that
still reads as closed.

**Requirement:** at the reveal beat the inside of the enclosure must be clearly
readable.

### 1.3 The panel-lift cutaway animation is rejected — replace it

The existing panel-lift choreography (panels rise 0.55 m and float during the
hold) is **rejected as the reveal mechanic**. The owner asked for it to be
trashed and replaced with a **cross-section** (clipping-plane sweep through the
enclosure) instead. The audited brief explicitly forbade this
("Do not replace it with a clipping-plane sweep — the lift is owner-approved");
that ban is superseded by the owner's ruling here.

### 1.4 The particle effects are not good enough

The JG-032 airflow rework (`3edecce`: airway-box route, cool→hot color ramp,
6 acoustic / 5 thermal shell split) is implemented and machine-verified, but it
is barely visible from the chapter camera and drowned by the yellow shell. The
read is "decorative dots," not an engineering airflow visualization.

**Requirement:** the airflow must be clearly legible from the chapter camera —
readable streamlines through the enclosure, not faint dots.

## 2. Visibility context for "I can't tell the difference"

- All 7 JG-032 commits were **local-only** (main ahead of origin by 7 at review
  time); the public site was deployed from `ff84a56` (JG-031, 09-07) and showed
  none of this work.
- The `:4173` preview must be restarted after every rebuild (repo hard rule) —
  a stale server shows the old build.

Any repair review must therefore confirm *which build* is being looked at
before judging the visuals.

## 3. Ideas the owner wants to try

1. **Dark-blue enclosure shell** — the whole visual identity of the enclosure
   goes dark blue (supersedes the JG-021 "retain baked CAD palette" ruling and
   the brief's yellow-paint protection).
2. **Cross-section reveal** — replace the panel lift with a clipping-plane
   cross-section sweep that cuts through the enclosure so the interior is
   exposed.
3. **Better air particle effects** — a clearly visible, CFD-style airflow story:
   cool air in at the +Z intake, flow through the plenum, bend around the
   baffles, heat pickup at the pump, hot exhaust out at −Z.
4. **Heat-transfer visualization** — the airflow should visibly carry the heat
   story (cool→hot color ramp, heat concentration at the pump/exhaust) so the
   thermal management reads at a glance.

## 4. Brief constraints the repair must reconcile

`docs/kimi-visual-enhancement-brief.md` contains three constraints that
directly caused the failures above and are now superseded by owner ruling:

| Brief constraint | Where | Replacement |
|---|---|---|
| "Never touch MSP_YELLOW_PAINT meshes" (incl. intake grille protection) | Recolor section | Yellow shell members are the primary recolor target; keep identity finishes (pump orange/steel, hardware) where they serve the story |
| "Use the existing panel lift choreography... do not replace with a clipping-plane sweep" | RL300 target experience | Panel lift is rejected; build a clipping-plane cross-section |
| A/B census gate "yellow unchanged" | Required workflow / probe | The probe must assert the shell **did** change to dark blue; "unchanged" is no longer a pass condition for yellow surfaces |

## 5. Reference pointers

- JG-032 plan: `project/work/plans/JG-032-station2-thermal-visualization.md`
- JG-032 evidence: `project/work/evidence/JG-032-station2-thermal-verification.md`
  (+ `jg032-station2-thermal/shot-p0_65.png` — the yellow-at-hold capture)
- Recolor allow-list: `src/scene/stages/recolorAllowList.ts`
- Panel choreography: `src/scene/stages/Station2_AcousticEnclosure.tsx`
- Airflow field: `src/scene/stages/AirflowField.tsx`,
  `src/scene/stages/airflowRoute.ts`
- Acoustic/thermal shells: `src/scene/stages/AcousticBaffleField.tsx`
- Station-2 anchors/windows: `src/scene/stages/stageWindows.ts`
- Owner brief (partially superseded, see §4): `docs/kimi-visual-enhancement-brief.md`
