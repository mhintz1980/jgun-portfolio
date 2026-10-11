"""Probe: list welded islands of bezel / ring / marks with tris and bbox size (mm)."""
import bpy, bmesh, json


def isl(nm):
    o = bpy.data.objects[nm]
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.verts.ensure_lookup_table(); bm.verts.index_update(); bm.faces.ensure_lookup_table()
    comp = {}
    n = 0
    for v in bm.verts:
        if v.index in comp:
            continue
        st = [v]; comp[v.index] = n
        while st:
            c = st.pop()
            for e in c.link_edges:
                w = e.other_vert(c)
                if w.index not in comp:
                    comp[w.index] = n; st.append(w)
        n += 1
    rows = [{'v': 0, 'f': 0, 'lo': [9e9] * 3, 'hi': [-9e9] * 3, 'bnd': 0} for _ in range(n)]
    for v in bm.verts:
        r = rows[comp[v.index]]
        r['v'] += 1
        for i in range(3):
            r['lo'][i] = min(r['lo'][i], v.co[i]); r['hi'][i] = max(r['hi'][i], v.co[i])
    for f in bm.faces:
        rows[comp[f.verts[0].index]]['f'] += len(f.verts) - 2
    for e in bm.edges:
        if len(e.link_faces) == 1:
            rows[comp[e.verts[0].index]]['bnd'] += 1
    out = [{'f': r['f'], 'v': r['v'], 'bnd': r['bnd'], 'size_mm': [round((r['hi'][i] - r['lo'][i]) * 1000, 2) for i in range(3)],
            'lo_mm': [round(r['lo'][i] * 1000, 1) for i in range(3)]} for r in rows]
    out.sort(key=lambda r: -r['f'])
    return out


for nm in ('BREP1.001', 'BREP1.003', 'BREP1'):
    rows = isl(nm)
    print('ISL', nm, len(rows))
    for r in rows:
        print('   ', json.dumps(r))
