# Main and failed-attempt boundaries

Read directly from git `main` (4158a6c8045b1b39c898188cd42d65ea7c6c066c) and `5dfd0aa`. This is baseline evidence, not approval.

| Boundary | main | 5dfd0aa |
|---|---:|---:|
| Camera K0 → K1 | 0.000–0.525 | 0.000–0.545 |
| Camera K1 → K2 | 0.525–0.600 | 0.545–0.620 |
| Camera K2 hold/arc | 0.600–0.720 | 0.620–0.740 |
| Camera K2 → K3 | 0.720–0.760 | 0.740–0.780 |
| M249 camera override | starts 0.760 | starts 0.780 |
| LCD start | 0.420 | 0.460 |
| LCD dwell start | 0.458 | 0.490 |
| LCD dwell end | 0.488 | 0.515 |
| LCD end | 0.525 | 0.545 |
| Wrench out / enclosure in | 0.525–0.565 | 0.545–0.585 |
| Enclosure out / point cloud in | 0.720–0.760 | 0.740–0.780 |
| Hero shift in | 0.050–0.100 | 0.1438235294–0.1676470588 |
| Hero shift hold | 0.100–0.120 | 0.1676470588–0.1771764706 |
| Hero shift out | 0.120–0.170 | 0.1771764706–0.2010000000 |
| Hero CAD/lite gate | 0.755 | 0.775 |

The GSAP hero timeline uses its own local time (not global page progress):

| Hero timeline channel | main start/duration | 5dfd0aa start/duration |
|---|---:|---:|
| spin | 0.00 / 0.35 | 0.12 / 0.35 |
| gearRotation | 0.00 / 0.90 | 0.12 / 0.90 |
| ghost in | 0.15 / 0.20 | 0.27 / 0.20 |
| explode | 0.35 / 0.50 | 0.47 / 0.50 |
| ghost out | 0.42 / 0.25 | 0.54 / 0.25 |

The failed remap is `0.12 + clamp01(old / 0.85) * 0.405`. Main's source has no drawing intro. The full boundary diff and frozen source snapshots accompany this table.

## Camera release discontinuity

At p=0.12, the failed intro holds position `[0.2,0.1,0.3]`, target `[0,0,0]`, FOV 27°. The right-hand `baseAt(0.12)` limit is position `[0.3547460327143253,0.15007256208162134,0.37408559962749866]`, target `[0,0.0018613946096959987,-0.008686508178581328]`, FOV 41.2554421561216°.

Computed goal discontinuity: **0.178724011219553 m position; 0.008883704983258 m target; 14.255442156122° FOV**. Browser frames are damped toward these goals, so their per-frame camera delta differs from this source-exact goal discontinuity.

Fresh desktop runtime at actual progress 0.11988811728395062 versus 0.12008101851851852 reported FOV 27.00000000000026° versus 41.25452089867244° after settling. Mobile's requested p=0.12 rounds to 0.12002468373958655 and is already across the snap; desktop rounds to 0.11998456790123457 and remains before it. This viewport-dependent boundary capture is itself baseline evidence.
