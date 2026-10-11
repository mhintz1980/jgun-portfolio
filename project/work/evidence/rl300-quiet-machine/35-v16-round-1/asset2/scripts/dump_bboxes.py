"""Dump every V16 mesh object's world bbox (glTF Y-up frame: x,z,-y) and evaluated tri count. Env: OUT_JSON."""
import bpy, os, json
import numpy as np

dg = bpy.context.evaluated_depsgraph_get()
rows = []
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    ev = o.evaluated_get(dg)
    me = ev.to_mesh()
    n = len(me.vertices)
    if n == 0:
        ev.to_mesh_clear(); continue
    co = np.empty(n * 3, dtype=np.float64); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
    M = np.array(o.matrix_world, dtype=np.float64)
    w = co @ M[:3, :3].T + M[:3, 3]
    lo = w.min(axis=0); hi = w.max(axis=0)
    me.calc_loop_triangles()
    rows.append({'n': o.name, 'tris': len(me.loop_triangles),
                 'min': [float(lo[0]), float(lo[2]), float(-hi[1])], 'max': [float(hi[0]), float(hi[2]), float(-lo[1])]})
    ev.to_mesh_clear()
with open(os.environ['OUT_JSON'], 'w') as f:
    json.dump(rows, f)
print('DUMP_OK', len(rows))
