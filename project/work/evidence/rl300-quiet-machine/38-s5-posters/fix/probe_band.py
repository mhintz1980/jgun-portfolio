"""Read-only probe (never saves): which object/material does the band above the hex grille hit at beat 1?
blender -b <scratch blend> --python probe_band.py -- <out.json>
"""
import bpy, sys, json, math
from mathutils import Vector

out_f = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
sc.frame_set(581)
cam = bpy.data.objects['POSTER_CAM_1']
sc.camera = cam
W, H = 960, 540
t = math.tan(cam.data.angle_y / 2)
aspect = W / H
mw = cam.matrix_world
origin = mw.translation
dg = bpy.context.evaluated_depsgraph_get()
rows = []
# the band sits at x 225..375, y 115..175 of the 960x540 preview (f581)
for py in range(110, 186, 5):
    for px in (240, 300, 360):
        d = Vector(((2 * (px + .5) / W - 1) * t * aspect, (1 - 2 * (py + .5) / H) * t, -1.0))
        d = (mw.to_3x3() @ d).normalized()
        hit, loc, nor, idx, ob, _m = sc.ray_cast(dg, origin, d)
        mat = None
        if hit and ob.type == 'MESH':
            poly = ob.data.polygons[idx]
            slot = ob.material_slots[poly.material_index] if ob.material_slots else None
            mat = slot.material.name if slot and slot.material else None
        rows.append({'px': px, 'py': py, 'hit': bool(hit), 'obj': ob.name if hit else None,
                     'parent': ob.parent.name if hit and ob.parent else None, 'mat': mat,
                     'loc': [round(v, 3) for v in loc] if hit else None, 'nor': [round(v, 3) for v in nor] if hit else None})
json.dump(rows, open(out_f, 'w'), indent=1)
seen = {}
for r in rows:
    k = (r['obj'], r['mat'])
    seen.setdefault(k, []).append((r['px'], r['py']))
for k, v in seen.items():
    print('HIT', k, len(v), v[:4])
