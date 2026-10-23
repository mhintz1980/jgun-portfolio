# S2a literal inventory (before edit, HEAD 0c345b70)

Absolute-u literals and `control.u` consumers under `src/scene/rl300/`. "Beat" is the beat that owns the
literal in `beats.ts` (by where the window starts). Relative offsets (du added to a window end) are listed
separately.

## shot.ts
| file:line | literal | window / meaning | beat |
|---|---|---|---|
| shot.ts:24-37 | from/to 0,.12,.27,.41,.61,.76,.89,1 + title/note/caption | SHOTS | each |
| shot.ts:46-62 | key `at` 0,.12,.27,.41,.51,.61,.76,.89,1 (+ position/target/fov) | KEYS (01 owns 0,.12; 04 owns .51,.61) | 01..07 |
| shot.ts:67 | .13, .3 | cutAt open | 02 |
| shot.ts:67 | .9, .99 | cutAt close | 07 |
| shot.ts:71 | .43, .51 | undersideAt in | 04 |
| shot.ts:71 | .51, .62 | undersideAt out | 04 |
| shot.ts:73-76 | uses SHOTS[i].from | shotIndexAt | derived |

## flow.ts
| file:line | literal | window / meaning | beat |
|---|---|---|---|
| flow.ts:120-122 | .760/.820, .772/.832, .784/.844, .796/.856 | SOUND_WINDOWS (4 fronts) | 06 |
| flow.ts:143 | .26 | closed-shell exact zero, `u <=` | 02 |
| flow.ts:143 | .90 | closed-shell exact zero, `u >=` | 07 |
| flow.ts:146 | .27, .40 | main extent | 03 |
| flow.ts:147 | .41, .60 | lower extent | 04 |
| flow.ts:148 | .61, .68 | merged extent | 05 |
| flow.ts:149 | .76, .86 | sound extent | 06 |
| flow.ts:152 | .76, .86 | handoff | 06 |
| flow.ts:153 | .86, .90 | fade | 06 |
| flow.ts:155 | .41, .47 | main introduction dim | 04 |
| flow.ts:155 | .58, .64 | main introduction restore | 04 |
| flow.ts:165 | .55, .66 | heat rise | 04 |
| flow.ts:165 | .82, .89 | heat fall | 06 |
| flow.ts:132, 166 | `* 12` | phase, u-scaled (stays; S2b) | n/a |

## AirRibbons.tsx
| file:line | literal | window / meaning | beat |
|---|---|---|---|
| AirRibbons.tsx:127 | 0.87, 0.895 (GLSL smoothstep) | stub extinguish (draw gate) | 06 |
| AirRibbons.tsx:170 | 0.87, 0.895 (GLSL smoothstep) | stub extinguish (alpha) | 06 |
| AirRibbons.tsx:177 | 0.856, 0.872 (GLSL smoothstep) | chevron response rise | 06 |
| AirRibbons.tsx:178 | 0.874, 0.894 (GLSL smoothstep) | chevron response settle | 06 |
| AirRibbons.tsx:464 | [.76, .86] | chevron draw window | 06 |
| AirRibbons.tsx:442 | + .006 | stub ignition span after front window end (JS) | 06 |
| AirRibbons.tsx:161 | + 0.006 | contact collapse span after window end (GLSL) | 06 |
| AirRibbons.tsx:162 | + 0.001 | contact flash in (GLSL) | 06 |
| AirRibbons.tsx:163 | + 0.002, + 0.004 | contact flash out (GLSL) | 06 |
| AirRibbons.tsx:631, 640 | `control.u` | consumer only (evaluateFlow, uProgress) | n/a |

Not u-window literals: GLSL tapers (0.055, 0.04, 0.70, 0.24/0.27, 0.25/0.75) are along-strip `vT`, not u.

## QuietMachinePreview.tsx
| file:line | literal | meaning | beat |
|---|---|---|---|
| QuietMachinePreview.tsx:12 | END_CARD_AT .97 | unchanged | n/a |
| QuietMachinePreview.tsx:17 | POSTERS exterior,section,section,intake,section,section,exterior | per-beat poster | each |
| QuietMachinePreview.tsx:19 | VIEWS 0, .2, .51 | scrubber anchors, unchanged | n/a |
| QuietMachinePreview.tsx:102 | `0{beat + 1} / 0{SHOTS.length}` | label | n/a |

## QuietMachineScene.tsx
No absolute-u literal. `control.u` consumers only: line 123 (`evaluateShot(control.u, ...)`), line 144 (telemetry `u`). Not edited.

## Other
LowerIntake.tsx, SectionCaps.tsx, prepareModel.ts, v16Materials.ts: no u literal, no `control.u` read (LowerIntake reads `control.caps` only).
