# JG-041 "The Line", slice 2 stills (2026-11-09)

Full-film stills (`Showreel` composition) from a fresh bundle. The PNGs are local only
(`.gitignore` excludes evidence PNGs), so only this README and the contact sheet are tracked.
The film is now 2373 frames, about 79.1 s: the Machine gains 90 frames and the Armament 60.

The contact sheet runs left to right, top to bottom: f0723 … f1442 from the table below.

| File | Frame | What it shows |
|---|---|---|
| f0723 | 723 | Cut line wiping from the wrench into the empty dark studio |
| f0751 | 751 | The cut line carries on as the plotter pen (crosshair on the y=540 axis) |
| f0773 | 773 | Shell feature edges plotted in cream, faint hidden lines; pen near the right edge |
| f0785 | 785 | Fill front mid-sweep: solid enclosure left, orange linework right |
| f0811 | 811 | Section study starts ("01 / 05 The object"), lines gone |
| f1347 | 1347 | Armament: pen starts outlining the x-ray on the unlit (paper) table |
| f1367 | 1367 | Outline mostly drawn |
| f1397 | 1397 | Light on: grey table + ghost x-ray under the outline |
| f1442 | 1442 | Scan line eats the outline as it reveals the render |

## Checks

| Check | Result |
|---|---|
| f0000 and f0225 vs the approved slice-1 stills | Identical (SSIM 1.000000) |
| Close f1897 / f1957 vs approved f1747 / f1807 (+150) | SSIM 0.99990 / 0.99950 |
| Ident f2283 / f2355 vs approved f2133 / f2205 (+150) | SSIM 0.99932 / 0.99971 |
| Loop seam: last frame f2372 vs f0000 | SSIM 0.99988 |
| Section study unchanged: `MachineAct` old f150/260/360/500 vs new f240/350/450/590 (cut, caps, intake, ribbons) | Identical (SSIM 1.000000, all four) |

The +150 frames are not pixel-identical, only because the paper grain re-seeds every two frames
(`Backdrop.tsx`: `floor(f/2) % 24`): a 150-frame shift moves it three seeds. The ×8 diff of f2283
shows grain texture only, with no structural change.

Film typecheck passes, and the rules test passes 33/33.
