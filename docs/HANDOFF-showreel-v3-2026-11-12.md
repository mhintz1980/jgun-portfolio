# HANDOFF: Showreel v3 "The Line", JG-041: slice 2 shipped, armament + pump CAD inspected (2026-11-12)

Previous handoff: `docs/HANDOFF-showreel-v3-2026-11-09c.md`, on branch `claude/jg-041-line-slice-2` in worktree `jg-041-showreel-line-slice-2-11acd7`.

**Where this file lives:** worktree `jg-041-line-slice-2-9026ef`, branch `claude/jg-041-line-slice-2-9026ef` (main-based).
- A hook blocked writing it into the film worktree.
- The film code is NOT on this branch.

## Current state

- **Slice 2 is committed and pushed.**
  - The commit is `f2b5ae44` on `claude/jg-041-line-slice-2`, in worktree `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7`.
  - It was pushed to origin `torque-wrench/rebuild` as a fast-forward from `e3c05882`, carrying `726b9476`, `555e07a0` and `f2b5ae44`.
  - The `jgun-torque-wrench` checkout is still at `726b9476`. It needs `git pull --ff-only`, but only once the other sessions' dirty files there are safe.
- **The film is unchanged since slice 2:** 2373 frames, about 79.1 s.
  - `public/video/showreel-v3.mp4` is still the old 69 s cut.
  - Nothing was re-rendered.
- **Rendering-tool act (act 04): paused by Mark** ("hold off on that").
  - Two mock stills were built from real pipeline files and shown to him. He did not pick one.
  - A, "manifest in, frame out": DD4SE r19 request.json, then the mask, beauty and composite passes.
  - B, "every version gated, then filmed": RL300 look-gate frames v13v, v13w and post, then `motion/out/hero-master-16x9.mp4`.
- **Armament and pump CAD: inspected, no video work yet.** Mark is collecting data "to pull from later". Details are in the next two sections.
- **Astra's ruling** on the slice 1 and slice 2 line visuals is still pending.

## Armament CAD (the real folder is `C:\Users\Markimus\Downloads\CAD\Armament\armament\`)

Mark typed `...\Armament\glb\...` for three of the files. That folder does not exist, and the files are in `armament\`.

| File | Size / triangles | Findings | Output |
|---|---|---|---|
| `AR-15_556.glb` | 416 MB, 13.7M tris, 86 parts, 1 material | No logos found. Long axis is Z, so it imports standing on end. Far too heavy for Remotion. | None. Needs rotation and decimation. |
| `MK-18 Final Assy.STEP` | 50 MB STEP, converted to 18 MB GLB with 605k tris and 152 nodes | No colours in the STEP. Part names kept. Carries an **Aimpoint** and an **L3 EOTech XPS3** (brand shapes, no text). | `<scratch>/armament/converted/MK-18 Final Assy.glb` |
| `ACR/ACR-ASSY.glb` | 79 MB, 2.3M tris | No logos. CAD placeholder colours (lime/red/blue), so it needs real materials. | None |
| `Assembled Precision.glb` | 118 MB, 3.6M tris | **"PRECISION" lettering** is 3816 white faces on object `cheekrest__Enlèv. mat.-Extru.1`: a flush colour, not geometry. Small white/red patches on `gardemain`, `lower` and `corps haut v2` look like selector/safety markings and were left alone. | `<scratch>/armament/clean/Assembled Precision - no logo.glb` (white faces reassigned to black; re-exported by Blender, 99.7 MB) |
| `M249/M249 Receiver Plus.glb` | 1.5 MB, 439k tris | Clean. Its 2 embedded JPEGs are normal maps on `texturedrubber`. It is a receiver plus stock, not a full gun. | None |

`<scratch>` = `C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad`. **It is temp storage.** Copy the two output GLBs somewhere durable before relying on them. Mark has not said where they should go.

Other armament files in that folder were not asked about and not inspected: DPMS bolt carrier, FCM 12, Raven, Glock slide, Topcover parts, FUMA, and the zips.

## Pumps (`C:\Users\Markimus\Downloads\CAD\Pumps\`)

| File | Triangles | Note |
|---|---|---|
| `DD4SE.glb` | 865k, 294 meshes | Imports lying on its side, so it needs rotation. Has "SETH PUMPS" casting text (noted on 2026-11-10). |
| `V2RL300-SAFE.glb` | 3.26M, 92 materials | Enclosure. Doors in place. |
| `RL300-SAFE-photoreal.glb` | 920k, 11 materials | Enclosure, lighter. |
| `DP150-SKID.glb` | 2.54M | Open-frame skid. |
| `G2RL200-SAF-2000.gltf` | 4.17M, 276 MB | Enclosure. |
| `engine-and-pump-v8.blend`, `V2RL300-SAFE-working.blend` | Not opened | |

These were not checked for logos, because Mark only asked for logo removal on the armament.

## Decisions (owner, in chat)

1. 2026-11-09: "Yes, push". Slice 2 was pushed to `torque-wrench/rebuild`.
2. 2026-11-10: rendering-tool act chosen as the next act, then paused on 2026-11-12 ("hold off on that"). There was no A/B pick.
3. 2026-11-12: gather armament and pump CAD for later. Remove logos where needed. Do not overwrite the originals (none were touched).

## Done / not done

| Item | Status |
|---|---|
| Slice 2 commit `f2b5ae44`, src/ diff empty, no PNGs staged | Done |
| Push to origin `torque-wrench/rebuild` | Done (`ls-remote` showed `f2b5ae44`) |
| Rendering-tool act research: vault graph scout, cbm code scout, media inventory | Done |
| Mock stills A and B (`<scratch>/rt/mock-A-manifest-to-frame.png`, `mock-B-gate-to-film.png`) | Done, shown. No pick. |
| Armament: 4 GLBs inspected, close-ups both sides, logo hunt | Done (visual check, about 0.15 mm/px) |
| MK-18 STEP converted to GLB | Done (scratch) |
| Precision logo removed | Done (scratch copy, before/after verified by render) |
| Pumps: 5 models inspected, contact sheet | Done |
| **MK-18 branded optics: remove or keep?** | **Asked, not answered** |
| Where to store the cleaned/converted GLBs durably | Not decided |
| AR-15 rotation and decimation; ACR materials; DD4SE rotation | Not started |
| Real armament 3D in the film | Not started (needs an act design and owner go) |
| Astra ruling (slices 1+2) | Not requested |
| Re-render of `showreel-v3.mp4` | Not done; needs the owner's explicit go |

## Exact next steps

1. **Ask Mark the open question:** remove the Aimpoint and EOTech optics from the MK-18 copy, or keep them? Also ask where the clean and converted GLBs should live. Suggest `Downloads\CAD\Armament\armament\_clean\` or a repo asset folder.
2. **Copy the two scratch GLBs** to that location. They are temp files.
3. If the optics go: hide or delete the nodes whose names start with `Aimpoint`, `AimPoint Model` or `L3-XPS3-` in a new copy. Render before/after and show the PNG.
4. Then ask which is next: the paused rendering-tool act (A or B), the armament 3D act, Astra's ruling, or the identity act.

## Files and commands

- Film worktree: `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7`, branch `claude/jg-041-line-slice-2`.
- Blender: `"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup --python-exit-code 3 --python <script> -- <args>`.
- Scratch scripts (all read-only on sources):
  - `<scratch>/armament/inspect_glb.py <glb> <out_dir> <tag>`: writes the stats JSON plus three Workbench previews.
  - `closeups.py <glb> <out_dir> <tag>`: both sides, 3 tiles each.
  - `matmap.py <glb> <out.json> [name_filter]`: per-object material faces and areas.
  - `recolor_faces.py <src> <dst> <obj_filter> <from_mat> <to_mat> <png_prefix>`: reassigns faces from one material to another, then exports.
- STEP to GLB:
  - Run with `<scratch>/occ-venv/Scripts/python.exe <scratch>/armament/step2glb.py <in.step> <out.glb> 0.05`.
  - Uses `cadquery-ocp` 8.0.1.1.
- Contact sheets:
  - Armament: `<scratch>/armament/armament-sheet.jpg`
  - Precision logo: `<scratch>/armament/precision-logo-before-after.jpg`
  - Pumps: `<scratch>/pumps/pumps-sheet.jpg`
- Act 04 sources (all untracked in scene-prep):
  - `C:/Projects/msp-render-pipeline-scene-prep/output/dd4se_r19_judge/`
  - `output/look-gate-compare-20260929/`
  - `motion/out/hero-master-16x9.mp4` (20.71 s)
- Remotion `publicDir` is `../public`, which the site serves. Proposed home for act-04 assets: `remotion/src/assets/`.

## Handoff Numbers

- Context at handoff: 303231 tokens (303.2k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 1

## Files Modified

- C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad\slice2-msg.txt
- C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad\rt\mocks.py
- C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad\armament\inspect_glb.py
- C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad\armament\step2glb.py
- C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad\armament\closeups.py
- C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad\armament\matmap.py
- C:\Users\Markimus\AppData\Local\Temp\claude\d06c9d485ba412f3\40c877bc-e1d7-4aa8-8239-68bf2961c435\scratchpad\armament\recolor_faces.py

## Commits

- feat(jg-041): The Line slice 2 - Machine linework, Armament x-ray outline (f2b5ae44)

## Key Assumptions to Verify

- Origin `torque-wrench/rebuild` is at `f2b5ae44` — verify with: `git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-showreel-line-slice-2-11acd7 ls-remote origin refs/heads/torque-wrench/rebuild`
- The scratch GLB outputs still exist (temp storage) — verify with: `ls -la "C:/Users/Markimus/AppData/Local/Temp/claude/d06c9d485ba412f3/40c877bc-e1d7-4aa8-8239-68bf2961c435/scratchpad/armament/clean" "C:/Users/Markimus/AppData/Local/Temp/claude/d06c9d485ba412f3/40c877bc-e1d7-4aa8-8239-68bf2961c435/scratchpad/armament/converted"`
- The armament originals are unmodified (mtimes 2026-11-11/12, before this session's work) — verify with: `ls -la --time-style=full-iso "C:/Users/Markimus/Downloads/CAD/Armament/armament/"*.glb "C:/Users/Markimus/Downloads/CAD/Armament/armament/MK-18 Final Assy.STEP"`
- The `jgun-torque-wrench` checkout is still behind origin — verify with: `git -C C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench log --oneline -1`
- The MK-18 optics are separate nodes that can be hidden — verify with: `py -I -c "import json,struct;f=open(r'C:/Users/Markimus/AppData/Local/Temp/claude/d06c9d485ba412f3/40c877bc-e1d7-4aa8-8239-68bf2961c435/scratchpad/armament/converted/MK-18 Final Assy.glb','rb');f.read(12);n,_=struct.unpack('<II',f.read(8));j=json.loads(f.read(n));print([x['name'] for x in j['nodes'] if x.get('name','').startswith(('Aimpoint','AimPoint','L3-XPS3'))])"`

## Dead Ends

- **`C:\Users\Markimus\Documents\Obsidian Vault`** holds only `Welcome.md`. The real Second Brain vault is `C:\vaults\markimus-SecondBrain`. Its graph is at `graphify-out/graph.json`, and the CLI is `graphify query "<q>" --graph <path>`.
- **graphify query "msp render pipeline"** returned no useful hits. "StudioMark pipeline stages" worked. `explain "msp-render-pipeline"` exits 3 because the name is ambiguous.
- **OCP 8 (cadquery-ocp 8.0.1.1) moved its collection classes:**
  - `OCP.TDF.TDF_LabelSequence` and `OCP.TColStd.TColStd_IndexedDataMapOfStringString` no longer exist.
  - Use `st.GetOneShape()` for meshing.
  - Use `OCP.OCP.collections.IndexedDataMap_TCollection_AsciiString_TCollection_AsciiString` for the file-info map.
- **The default glTF node names were NAUO ids.** Fix: `SetNodeNameFormat(RWMesh_NameFormat_ProductOrInstance)`.
- **The first logo before/after framed the cheekrest object alone** and missed the lettering. Full-rifle side renders cropped to the cover work.
- **ffmpeg `drawtext` with a Windows font path** failed on colon escaping inside a bash-built filtergraph. PIL was used for labels instead.
- **`inspect_glb.py` framing for Z-long models** (the AR-15) renders them on end, clipped. `closeups.py`, with an explicit right/up basis, works.
- **No STEP tool is installed on the machine** (no FreeCAD, cadquery, gmsh). That is why there is a scratch venv.
- **This session cannot write files in the film worktree** (`11acd7`): a PreToolUse hook blocks writes to other worktrees. Git commands there via Bash still work.

## Last Request from the User

> hold off on that. lets get you some more data to pull from later. right now i want you to go look at the glb files for armamnet i have for you to use in the video. You may need to edit the glb files in blender to remove the logos on certain models:
> "C:\Users\Markimus\Downloads\CAD\Armament\glb\AR-15_556.glb"
> "C:\Users\Markimus\Downloads\CAD\Armament\glb\M249\M249 Receiver Plus.glb"
> "C:\Users\Markimus\Downloads\CAD\Armament\glb\Assembled Precision.glb"
> "C:\Users\Markimus\Downloads\CAD\Armament\armament\MK-18 Final Assy.STEP"
> "C:\Users\Markimus\Downloads\CAD\Armament\armament\ACR\ACR-ASSY.glb"
>
> And these for the pumps section:
> "C:\Users\Markimus\Downloads\CAD\Pumps"

Status: Partially answered.

- All files were inspected, and the only visible logo ("PRECISION") was removed in a scratch copy.
- Still open: whether the MK-18's branded optics count as logos to remove.
- Still open: where the clean files should be stored durably.

Context needed: Mark's answer on the MK-18 optics. Check the outputs with `ls "<scratch>/armament/clean" "<scratch>/armament/converted"`.
