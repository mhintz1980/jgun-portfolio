"""Probe: how far does planar dissolve alone get each dial sub-object? Prints tris / islands per angle limit."""
import bpy, bmesh, math, os, json
from mathutils import Vector

NAMES = ['BREP1.001', 'BREP1.002', 'BREP1.003', 'BREP1']


def islands_bm(bm):
    seen = set(); n = 0
    for v in bm.verts:
        if v.index in seen:
            continue
        n += 1; st = [v]; seen.add(v.index)
        while st:
            c = st.pop()
            for e in c.link_edges:
                w = e.other_vert(c)
                if w.index not in seen:
                    seen.add(w.index); st.append(w)
    return n


out = {}
for nm in NAMES:
    o = bpy.data.objects[nm]
    row = {}
    for ang in (0.0, 0.5, 1.0, 2.0, 5.0, 10.0):
        bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        if ang > 0:
            bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(ang), verts=bm.verts, edges=bm.edges)
        tri = bmesh.ops.triangulate(bm, faces=bm.faces[:])
        bm.verts.index_update()
        row[str(ang)] = {'tris': len(bm.faces), 'verts': len(bm.verts), 'islands': islands_bm(bm)}
        bm.free()
    out[nm] = row
print('PROBE', json.dumps(out))
