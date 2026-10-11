"""Probe the dial face meshes: planarity, boundary loops, topology."""
import bpy, bmesh, math, json

for nm in ('BREP1.002', 'BREP1.006'):
    o = bpy.data.objects[nm]
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    xs = [v.co.x for v in bm.verts]
    be = [e for e in bm.edges if len(e.link_faces) == 1]
    nm_e = [e for e in bm.edges if len(e.link_faces) > 2]
    # boundary loops
    bverts = {v for e in be for v in e.verts}
    seen = set(); loops = 0
    for v in bverts:
        if v in seen:
            continue
        loops += 1; st = [v]; seen.add(v)
        while st:
            c = st.pop()
            for e in c.link_edges:
                if len(e.link_faces) == 1:
                    w = e.other_vert(c)
                    if w not in seen:
                        seen.add(w); st.append(w)
    ys = [v.co.y for v in bm.verts]; zs = [v.co.z for v in bm.verts]
    nrm = {}
    for f in bm.faces:
        k = tuple(round(c, 2) for c in f.normal)
        nrm[k] = nrm.get(k, 0) + 1
    print('FACE', nm, json.dumps({'verts': len(bm.verts), 'faces': len(bm.faces), 'x_range_mm': (max(xs) - min(xs)) * 1000,
                                   'boundary_edges': len(be), 'nonmanifold': len(nm_e), 'boundary_loops': loops,
                                   'ylen_mm': (max(ys) - min(ys)) * 1000, 'zlen_mm': (max(zs) - min(zs)) * 1000,
                                   'normals_top': sorted(nrm.items(), key=lambda kv: -kv[1])[:5]}))
