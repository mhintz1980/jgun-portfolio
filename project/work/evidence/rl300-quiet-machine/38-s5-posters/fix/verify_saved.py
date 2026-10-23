"""Read-only: reload check of the saved scratch blend, evaluated per poster frame like the worker does."""
import bpy

sc = bpy.context.scene
d = bpy.data.objects
print('V fill', round(d['REVEAL_FILL'].data.size_y, 3), round(d['REVEAL_FILL'].location.y, 3))
print('V intake', 'V2RL300-SAF-1047-5_PROPOSED_LOUVERS' in d, 'PROPOSED_COLLECTOR_DUCT_OUTLET' in d,
      [m.type for m in d['PROPOSED_COLLECTOR_DUCT_OUTLET'].modifiers])
for f in range(581, 588):
    sc.frame_set(f)
    row = {n: d[n].hide_render for n in ['V2RLP-SK-4000-A-2', 'V2FTA-FP-46-RL-1000-1', 'V2RL300-SAF-1047-3', 'V2RL300-FTS-2003-SAFE-1', 'V2RL300-SAF-1047-5']}
    print('V frame', f, sc.camera.name, 'floor hide', d['REVEAL_FLOOR'].hide_render, 'floor z', round(d['REVEAL_FLOOR'].matrix_world.translation.z, 3),
          'plane x', round(d['SECTION_PLANE'].matrix_world.translation.x, 3), 'cutaway', [int(v) for v in list(row.values())[:4]], 'liner hide', int(row['V2RL300-SAF-1047-5']))
