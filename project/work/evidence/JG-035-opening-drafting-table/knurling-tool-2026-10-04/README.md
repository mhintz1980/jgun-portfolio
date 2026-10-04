# Knurling tool — editable animation asset

Owner-requested Blender model based on the supplied two-holder illustration. This uses opposed sliding holders, matching the latest reference. Body dimensions follow its proportions; the missing lettered dimension table prevents a manufacturer-accurate reconstruction.

## Files

- [Editable Blender model](C:/Projects/CAD/jgun-knurling-tool/knurling-tool-v1.blend)
- [Repository copy of the model](source/knurling-tool-v1.blend) and [builder](source/build_knurling_tool.py), [exporter](source/export_knurling_tool.py), [verification](source/verify_knurling_tool.py), [saved-file check](source/check_saved_asset.py). These copies preserve the deliverable with the Git commit.
- [Animation-ready GLB](knurling-tool.glb): 1.80 MB, 12 rigid mesh groups, 94,040 triangles, five materials, zero image textures, one sampled animation clip and one scene. The detailed geometry suits the proposed close-up; browser frame rate has not been measured.
- [Hero view](tool-hero.png), [front](tool-front.png), [rear](tool-rear.png), [fit/contact with the real ring](tool-ring-contact.png).
- [Owner reference](owner-tool-reference.png), [provenance and fit checks](asset-manifest.json), [export checks](web-export-verification.json), [reimport pose comparisons](reimport-verification.json).

## Model and fit

Steel backbone and forked holders, dark rectangular shank and locking shims, pins, recessed socket screws, and two physical helical knurl wheels with opposite tooth hands. The original startup scene is preserved separately. `JGUN_KNURLING_TOOL` is the working scene.

The CAD P003068 ring is included solely as an inspectable fit reference. Its decoded vertices measure approximately 75.4437 mm OD and 27.2042 mm axial width. Each wheel is 23 mm diameter and 7.5 mm wide. Nominal radial envelopes meet the ring OD with zero gap; fork-to-wheel axial clearance is 1.25 mm per side, and the rail begins approximately 11.28 mm beyond the ring envelope. The 19.7042 mm axial stroke plus wheel width covers the ring's full axial extent.

These are animation-fit checks. They do not establish a real knurl pitch, forming load, finished diameter, or a production machining setup. The actual surface band to knurl should be chosen from the ring's smooth edge lands when integrating the manufacturing sequence.

## Animation controls

Select `KT_CONTROL` and inspect its Custom Properties. They are already keyed; edit the corresponding keys to retime the demonstration or clear its action to control them manually:

| Property | Meaning |
|---|---|
| `jaw_open_mm` | Additional outward clearance per holder; 0 is nominal ring contact. |
| `traverse_mm` | Whole-tool axial position relative to the ring centre. |
| `approach_mm` | Withdrawal along the shank direction. |
| `ring_angle_rad` | Demo ring rotation; both wheels counter-rotate at the nominal external-contact radius ratio. |

Frames 1–150 at 30 fps demonstrate approach, holder closure, rotation, a two-second traverse (55–115), opening, and withdrawal. Spacebar plays the sequence in Blender. The saved file is parked at frame 85 with the actual ring visible.

Blender axes: Z is the ring/wheel spin axis and traverse; Y opens the holders; X follows the shank. The GLB uses glTF Y-up. Its named moving units are `KT_TOOL_ROOT`, `KT_UPPER_HOLDER`, `KT_LOWER_HOLDER`, `KT_UPPER_KNURL_WHEEL_RH`, and `KT_LOWER_KNURL_WHEEL_LH`. The clip is `KnurlTool_Approach_Contact_Traverse_Retract`.

Rigid geometry was merged by moving unit and material for export. The editable Blender scene retains individual components. Drivers and custom-property motion are sampled into standard translation/rotation channels in the GLB; it has no runtime dependency on Blender drivers. The reference ring, cameras, lights, and startup scene are excluded.

## Verification and reproduction

The final export is reimported and compared at nine frames across all five moving units. The report binds those comparisons to the GLB SHA-256. Front, rear, hero, and contact views are rendered from the same Blender scene and visually reviewed. No website runtime acceptance is implied.

The saved .blend was also reopened in a separate background Blender process: control action, all five moving units, reference scene, and the three preserved startup objects passed checks. See [saved-file verification](saved-blend-verification.json).

An independent read-only reviewer rechecked the export and exposure corrections and returned usable, with no blocking findings. See [independent review](independent-review.md).

Reproduce in a fresh Blender file, using its Python console or scripting editor:

```python
exec(compile(open(r'C:\Projects\CAD\jgun-knurling-tool\build_knurling_tool.py', encoding='utf-8').read(), 'build_knurling_tool.py', 'exec'))
exec(compile(open(r'C:\Projects\CAD\jgun-knurling-tool\export_knurling_tool.py', encoding='utf-8').read(), 'export_knurling_tool.py', 'exec'))
exec(compile(open(r'C:\Projects\CAD\jgun-knurling-tool\verify_knurling_tool.py', encoding='utf-8').read(), 'verify_knurling_tool.py', 'exec'))
```

The builder reads the real Default.glb from this checkout and imports only the ring. It refuses to overwrite an existing modeled tool. No original CAD or application files are changed. The ring's evolving knurl, black/aluminium finish transitions, assembly fade, and website integration remain the next animation work.
