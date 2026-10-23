import bpy, sys, json, math
from mathutils import Vector
out_f = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
sc.frame_set(581)
cam = bpy.data.objects['POSTER_CAM_1']
W, H = 960, 540
t = math.tan(cam.data.angle_y / 2); mw = cam.matrix_world; origin = mw.translation
dg = bpy.context.evaluated_depsgraph_get()


def chain(px, py, n=4):
    d = Vector(((2 * (px + .5) / W - 1) * t * (W / H), (1 - 2 * (py + .5) / H) * t, -1.0))
    d = (mw.to_3x3() @ d).normalized()
    o = origin.copy(); res = []
    for _ in range(n):
        hit, loc, nor, idx, ob, _m = sc.ray_cast(dg, o, d)
        if not hit:
            break
        poly = ob.data.polygons[idx]
        slot = ob.material_slots[poly.material_index] if ob.material_slots else None
        res.append({'obj': ob.name, 'mat': slot.material.name if slot and slot.material else None,
                    'dist': round((loc - origin).length, 4), 'loc': [round(v, 4) for v in loc], 'dot': round(nor.dot(d), 3)})
        o = loc + d * 1e-4
    return res


rows = {}
for name, (px, py) in {'band_a': (300, 145), 'band_b': (240, 162), 'band_c': (360, 150), 'above_skin': (300, 110), 'hex_mesh': (300, 175), 'below_hex': (300, 215)}.items():
    rows[name] = chain(px, py)


def bb(name):
    o = bpy.data.objects.get(name)
    if not o:
        return None
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return {'min': [round(min(p[i] for p in pts), 4) for i in range(3)], 'max': [round(max(p[i] for p in pts), 4) for i in range(3)],
            'parent': o.parent.name if o.parent else None, 'hide_render': o.hide_render, 'verts': len(o.data.vertices) if o.type == 'MESH' else None}


rows['bbox'] = {n: bb(n) for n in ['G2RL300-SAF-1003-2', 'RL200-SIF-1020-1', 'GRRL200-SAF-1172-1', 'MirrorRL300-SIF-1004-2']}
json.dump(rows, open(out_f, 'w'), indent=1)
for k, v in rows.items():
    if k == 'bbox':
        for n, b in v.items():
            print('BB', n, json.dumps(b))
    else:
        print('CHAIN', k, ' > '.join(f"{h['obj']}[{h['mat']}]@{h['dist']} dot{h['dot']}" for h in v))
