# P000725 housing: void/parity artifact, not a measured new collision

Decision for the reported 3.687295 mm candidate: **classification artifact**. G0 as a whole is not closed by this diagnosis. OpenAI producer and this OpenAI measurement continuation do not supply the required fresh different-provider review; parent will route GLM after this deliverable.

Actual paired comparisons use legacy shaft + legacy housing and approved shaft + approved housing in the same shaft-local datum. Both have **zero BVH triangle crossings**. The disputed revised-shaft witness is `[3.137071, 9.989167, -5.127717] mm`, radius about 6.012 mm. At that Y plane:

| Exact triangle/plane section | Legacy | Approved |
|---|---:|---:|
| Housing minimum section radius, mm | 19.27455023 | 19.27455017 |
| Housing maximum section radius, mm | 21.69212266 | 21.69212263 |
| Shaft maximum section radius, mm | 4.13111455 | 6.07400049 |
| Housing boundary edges after 1 um weld | 12,242 | 12,260 |

The witness is in the hollow void, not on the changed bore shoulder. The nearest approved housing surface is `[5.071961, 11.119312, -8.056046] mm`, 3.68729467 mm away. The outward-normal signed projection is **+3.50983080 mm** (outside). The legacy housing gives effectively the identical surface distance and normal sign at the same point. This is not a reversed-normal-only diagnosis: the hollow section, open topology and explicit ray traces independently contradict majority parity.

All three ray steps (0.00001, 0.0001 and 0.001 mm) produce the same answer. The three original oblique directions have hit counts **2, 1, 1**, so majority parity falsely calls the void inside. Expanded directions +/-X, +/-Y and +/-Z have counts **2, 2, 0, 0, 2, 2**, all outside. No ray reaches the 64-hit cap. Two oblique single hits through an open shell do not establish a solid interior. The original classifier recorded 820 non-unanimous approved-housing samples, 25 normal/parity disagreements, and no unanimous inside witness. Keep the raw 3.687 mm candidate in evidence as a rejected sign result; do not report it as interference depth.

`housing-diagnostics.json` contains exact segment endpoints, nearest-triangle index, each hit's location/normal and topology. `housing-section.png` is a Blender render of these exact triangle/plane intersections at Y=9.989167 mm: orange approved housing (legacy gray is coincident), cyan approved shaft, green legacy shaft, red disputed witness. It is an unfilled section; the hollow void is never converted to a filled convex hull. No source mesh, winding, topology, placement or CAD file was edited/saved.

Rerun from the repo root:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b --factory-startup --python-exit-code 1 --python scripts/manufacturing/classify_contacts.py -- --housing-only --out project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/mechanical-review/housing-diagnostics.json
```

Completed exit 0, source hashes unchanged. This rejects the specific reported collision. It does not certify every surface/continuous assembly/tool clearance: the housing is open, the original surface sampling is finite, and camera/tool evidence remains a separate leaf.
