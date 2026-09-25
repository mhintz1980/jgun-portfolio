# JG-035 (proposed) — Tolerance Stations Fact Sheet — v2 FACTS LOCKED

Status: **FACTS LOCKED 2026-09-25** (all owner corrections applied; zero open content questions).
Ready for triage → plan → build. Visual questions for Astra remain (§4) — they gate the look, not the facts.

Corrections applied by Mark, 2026-09-24/25: units inches; runout < .001" geared; ISO 1328 Grade A6
(class-10 dropped); S3 rewritten (no pinion wire — all gears cut in house); S4 zone .004 total
(±.002/side) with new datum E; S5 ⌀2.525" H7/k6; P000420 on-screen label "Clutch Housing";
S1 anchor = P003069 journals in P000245 ID.

---

## 0. Global rulings — LOCKED

| # | Ruling |
|---|---|
| G1 | **Inches** everywhere. GD&T, callouts, intro-sheet notes (`UNITS: INCHES`). The 2026-09-24 sheet's mm note + mm-style illustrative frames (0.04, Ø0.08…) flip to inches in this build. |
| G2 | One value: **< .001" TIR on all geared parts**. Every `.0015"` string in the site copy (CH.01/CH.02/CH.04, caseStudies.ts) is replaced. |
| G3 | **ISO 1328 / AGMA 2015, Grade A6 — high precision** (lower = better under this standard; the earlier "class 10 / Q10" is dropped). |
| G4 | Datum scheme: **A** = drivetrain axis (bearing journals), **B** = mounting face, **C** = output face. Supersedes the old air-motor-bore-A / flange-B scheme. Extended below: **D** = planet bore/pin, **E** = shifter-fork end face. |
| G5 | Stations live in **CH.01 (assembly)**. CH.02 acoustic + CH.03 electronics hotspots untouched. |

## 1. Part-number map — LOCKED (owner: "Confirmed all part numbers")

| Role | Part(s) | Notes |
|---|---|---|
| Input shaft | `P001836` stage-1 sun/motor pinion | turned + hobbed in one chucking |
| Drive/output shaft | `P000095` | output spindle |
| Bearing journals | `P003069` | ⌀66 ring at z −0.119 (role-map verified); journals run in the ID of big housing `P000245`; output shaft + `K000001` ride inside |
| Gearbox housing | `P000245` | big housing; S5 mating bore is its ID |
| Output spindle cluster | `P000095`, `P000207`, `K000001`, `K000074` | — |
| Planetary cages, driveline order | `P001836` → `P001837` → `P001849`/`A000606` → `P003045` → `P003047` | stage names unreliable — key on numbers |
| Shifter fork | `P000724` | carries the live-tooled profile (S4 anchor) |
| Shifter cam | `P000297` | on-screen name: **Shifter Cam** (owner renamed from "ball cam") |
| Clutch housing | `P000420` | lower OD with 4 tapped holes; on-screen label **Clutch Housing** |
| Ring switch | `P003068` | + 3× `P000464` pins, 3× `K000156` balls |
| Thrust bearing | `K000004` | — |
| Air motor | `ROTOR-1`, `AIR MOTOR HOUSING-MACHINED-1`, `FLANGE-1` | keep rotor "BALANCED VANE ASSEMBLY" note |

## 2. The stations — LOCKED

### S1 — DATUM A: the axis everything is measured from ✅
- **Anchor:** drivetrain centerline through the `P003069` bearing journals, riding in the ID of big housing `P000245` (output shaft + `K000001` inside).
- **FCF:** datum flag only — `Ⓐ DRIVETRAIN AXIS`. Secondary small frame: flange mount-face flatness `.0008` retained (real, locates the stack).
- **Visual:** navy phantom centerline through the whole stack; parts glint as it passes.
- **Background text:** "EVERY RUNOUT ON THIS TOOL IS MEASURED FROM ONE AXIS".

### S2 — Shafts: hobbed in one chucking ✅
- **Parts:** input `P001836` sun pinion; drive `P000095` output spindle.
- **Anchor:** gear teeth OD at the pitch cylinder.
- **FCF:** `⌰ .001 Ⓐ-Ⓑ` (total runout, datums A-B journals).
- **Visual:** shaft spins in place; dial-indicator needle under .001; FCF builds cell-by-cell.
- **Background text:** "SINGLE CHUCKING — TURNED AND HOBBED IN ONE SETUP / CONCENTRIC TO THE OD BY CONSTRUCTION".
- **Held:** < .001" TIR.

### S3 — Gears: cut in house ✅ (rewritten — pinion wire dropped per owner)
- **Parts:** planets on the five cages (`P001836`…`P003047`).
- **Anchor:** one planet pinion spinning on its pin.
- **FCF:** `↗ .001 Ⓓ` (circular runout to the planet's own bore/pin = datum D).
- **Pair callout:** **ISO 1328 GRADE A6 — HIGH PRECISION**.
- **Visual:** planet rotates on its pin; small involute-check trace chart beside it (gear-tester printout).
- **Background text:** "ALL GEARS CUT IN HOUSE — ISO 1328 GRADE A6".

### S4 — Clutch end: live-tool profile milling ✅
- **Parts:** shifter fork `P000724` (anchor part), shifter cam `P000297`.
- **Anchor:** the live-tooled milled profile on `P000724`.
- **FCF:** `⌓ .004 Ⓐ Ⓔ` — profile of a surface, **.004 total zone (±.002 per side)**; datums A (part/gearbox axis) + **E** = flat end face of the part where the milled profile ends.
- **Visual:** translucent tolerance band hugs the profile; toolpath glow traces the milled path; FCF builds.
- **Background text:** "PROFILE MILLED WITH LIVE TOOLING — TRUE PROFILE WITHIN .004".

### S5 — Clutch housing → lower housing fit: finished after heat treat ✅
- **Parts:** `P000420` clutch-housing lower OD (4 tapped holes) into the mating bore (ID) of `P000245`.
- **Anchor:** the OD/ID cylindrical interface.
- **Callouts:** `⌀2.525" H7/k6` + `⌰ .001 Ⓐ`.
- **Visual:** parts slide together; fit callout stamps as they seat; then "TURNED AFTER HEAT TREAT".
- **Background text:** "OD AND ID BOTH FINISHED AFTER HEAT TREAT — DISTORTION NEVER REACHES THE FIT".

### S6 — Close: tolerance summary card ✅ (kept as a card)
Set in the intro sheet's navy-ink drawing style:
**"ALL GEARED PARTS < .001" TIR · ISO 1328 GRADE A6 · PROFILE .004 · ⌀2.525 H7/k6 FINISHED AFTER HEAT TREAT"**

## 3. Scope of deletion — LOCKED

Remove the current decorative CH.01 hotspot annotations (rotor / motor-housing / flange /
gearbox-housing frames: `RUNOUT < .0015"`, `POSITION .002" @ MMC`) — replaced by S1–S6.
**Keep:** rotor "BALANCED VANE ASSEMBLY" note; flange flatness `.0008` (moves into S1);
CH.02 acoustic hotspots; CH.03 electronics hotspots.

## 4. Open — visual only, for Astra (gates the look, not the facts)

1. Dial-indicator gauge (S2) + involute trace (S3): props, or too much?
2. FCF cell-by-cell build speed vs scroll pace.
3. Navy-ink callouts over the dark scene background (contrast carry-over from the new sheet).

## 5. Build-time consequences (already accounted)

- G1 flips the 2026-09-24 intro sheet to inches (notes + illustrative GD&T frames).
- G2 touches `caseStudies.ts` CH.01/CH.02/CH.04 callout strings.
- Datum letters D/E extend the G4 scheme; no old letter is reused with a new meaning except
  A/B themselves (owner adopted the draft scheme).
- `P000420` display name changes to "Clutch Housing" — part numbers stay the logic key, display
  strings only.
