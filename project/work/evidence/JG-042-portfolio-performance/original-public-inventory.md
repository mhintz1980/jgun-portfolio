# P03 original-workspace inventory

Original root: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, HEAD `6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`. Inventory read before exclusions; the isolated checkout does not contain the four untracked files below.

| public-relative path | Bytes | Git / decision |
|---|---:|---|
| video/studiomark-showcase-precision-revealed-poster.jpg | 63,292 | Untracked; no built-page reference; exclude |
| video/studiomark-showcase-precision-revealed.mp4 | 26,963,016 | Untracked; no built-page reference; exclude |
| video/studiomark-showcase-precision-revealed.webm | 27,002,025 | Untracked; no built-page reference; exclude |
| fonts/gentilis_bold.typeface.json | 649,318 | Untracked; no built-page reference; exclude |
| video/showreel-v3.mp4 | 18,873,120 | Tracked showreel lane; defer exclusion pending coordination |
| video/showreel-v3-poster.jpg | 92,666 | Tracked showreel lane; preserve |
| video/studiomark-bumper-puddle-crane.webm | 9,413,379 | Tracked logo lane; preserve |
| video/studiomark-bumper-puddle-crane.mp4 | 10,790,559 | Tracked logo lane; preserve |
| video/studiomark-bumper-storm-ignition.webm | 11,413,469 | Tracked logo lane; preserve |
| video/studiomark-bumper-storm-ignition.mp4 | 10,784,649 | Tracked logo lane; preserve |
| textures/studiomark-road/shanghai_bund_2k.hdr | 6,467,753 | Tracked, referenced by StudioLighting.tsx; preserve |
| textures/studiomark-road/aerial_asphalt_01_rough_2k.jpg | 1,392,536 | Tracked logo lane; preserve |
| textures/studiomark-road/aerial_asphalt_01_nor_gl_2k.jpg | 2,751,902 | Tracked, referenced by RainFloor.tsx; preserve |
| textures/studiomark-road/aerial_asphalt_01_diff_2k.jpg | 2,802,005 | Tracked, referenced by RainFloor.tsx; preserve |
| textures/studiomark-road/aerial_asphalt_01_ao_2k.jpg | 1,929,805 | Tracked, referenced by RainFloor.tsx; preserve |

Source reference scan: `rg -n 'showreel-v3|studiomark-showcase-precision|gentilis_bold' src remotion scripts project/work/plans` and `rg -n 'studiomark-road' src`. Showcase scripts outside Vite entries refer to their original public outputs for local review; excluding build copies preserves those workflows. No media is removed from public or Git. Tracked showreel/bumper exclusions remain deferred because no lane-owner coordination authorizes them. Four targeted exclusions prevent 54,677,651 bytes of local-only material entering a build made from the original workspace; this is a contamination-prevention count, not a reduction relative to the clean baseline or a loading-speed gain.
