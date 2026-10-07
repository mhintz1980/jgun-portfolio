# Footer clearance camera repair — 2026-10-06

CPU-only follow-up after the completed narrow materials fix. No builds, servers, browser,
GPU, CSS, CAD, runtime or narrative changes were made by this worker. Only camera.ts,
camera.test.ts and this evidence folder were written. Runtime proof remains for the parent.

## Verified defects and scope

`pre-fix-projection-report.json` preserves the current-after-mobile-fix source projection
before these edits. The historical blockout `report.json` cameras were captured against
`dda159414f4c6d4c6af66dc541b91bfc2f4cc7d4a908e0a7691d1c7be7ccdb25`,
before the mobile fix. They are controls, not evidence of the current camera.

Independent Draco decode + saved live matrices reproduce the old bounds within 1.5e-12 px;
independent composition-law reconstruction reproduces those matrices within 1.5e-12 px.
Full X/Y rectangle separation confirms the reported footer overlaps:

- Desktop materials critical y3.2..14.2 mm: x134.17..499.75, y223.00..675.38;
  footer x57.59375..537.59375, y596.5..876; overlap depth 78.88 px.
- Narrow revised broad y3.2..20 mm: x109.39..346.47, y313.04..540.66;
  footer x20..370, y529.5..820; overlap depth 11.16 px.
- Additional overlap found at the same final-card anchor: desktop revised broad action
  x183.62..781.72, y171.11..731.60 overlaps the footer by 135.10 px. The decoded approved
  front geometry reaches radial 8.27 mm at y19.73; the old r6.325 journal proxy missed it.
  This required the desktop final anchor adjustment as well.

## Exact source changes

| Anchors | Desktop | Narrow |
|---|---|---|
| t15 / 22.6 | FOV 7.2 → 7.6; target [0,19.2,0] → [0,19.2,-2.6] mm | Preserved FOV18.5 / target [0,8.5,1] mm |
| t33.2 / 35 | FOV 7.6 → 10; target [0,18.5,0] → [0,18.5,-3.5] mm | FOV17.5 preserved; target [0,9,0] → [0,9,-2] mm |

Azimuth, elevation, distance, every other anchor, the exact FOLLOW law and machining /
hobbing kinematics remain unchanged. The desktop final broad-action height was 560.49 px;
the measured copy/footer opening with 8 px margins is only 451.11 px tall, requiring the
wider FOV to retain that actual CAD action. Candidate variants and controls are recorded.

## Clearance after repair

Every value is a conservative separating-axis clearance of the complete projected CAD
rectangle to the measured DOM rectangle (at least one full X or Y axis separates them).
All projected vertices are outside all protected rectangles. Both failed 4140/C300 rows
use the taller cards; failed 4340 clears even farther. The holds make these bounds apply
through t15..22.6 and t33.2..35, not just the saved capture times.

| Layout / action | Bounds X / Y px | Header | Copy | Card | Footer | Max abs NDC |
|---|---|---:|---:|---:|---:|---:|
| Desktop materials | 162.56..510.47 / 150.91..581.33 | 75.11 | 21.52 | 394.34 | 15.17 | .77423 |
| Narrow materials | 124.48..251.58 / 352.46..516.14 | 258.46 | 208.09 | 12.49 | 13.36 | .36166 |
| Desktop revised | 309.81..767.18 / 153.75..582.40 | 77.95 | 24.36 | 137.63 | 14.10 | .65834 |
| Narrow revised | 109.04..347.08 / 287.30..515.87 | 193.30 | 142.93 | 37.52 | 13.63 | .77990 |

Critical materials: 3267 decoded vertices per reported row. Revised broad witness: 9474.
`projection-report.json` retains full measured DOM X/Y extents, input hashes, candidate
results, decoded extremal witnesses and zero-overlap-vertex counts. `hashes.json` pins
the outputs as well. The original blockout files were read only.

## Verification and parent handoff

- `npm test -- --run src/scene/inspection/shaft/camera.test.ts --maxWorkers=2`: 12/12 pass,
  1/1 file. Original 10 checks retained; new measured decoded-CAD DOM clearance and final
  hold / C1 endpoint checks added. Existing -0.3 narrow floor and .84 safe-frame unchanged.
- `npm run typecheck`: exit 0.
- `node project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/footer-fix-2026-10-06/check-footer.mjs`:
  pass=true across all 8 measured control/action rows; `projection-run.log` holds stdout.

Current camera source SHA256:
`0b5952f3f31bffbdf626965204e3a2b0a0c2c7443b593de728616e0b5af6203a`.

CPU projections verify placement against the recorded DOM, not raster visibility or a new
live browser session. Parent must rebuild, restart preview :4173, obtain same-session
new camera/DOM proof and rendered visibility evidence. C2 and owner acceptance remain open.
