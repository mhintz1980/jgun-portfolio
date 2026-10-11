"""Probe: do the dial-face hole loops coincide with the marks footprints?"""
import bpy, bmesh, math, json
from mathutils import Vector
from mathutils.kdtree import KDTree


def welded(nm):
    o = bpy.data.objects[nm]
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.verts.ensure_lookup_table(); bm.verts.index_update()
    return bm


def loops_of(bm):
    be = [e for e in bm.edges if len(e.link_faces) == 1]
    bverts = {v for e in be for v in e.verts}
    seen = set(); out = []
    for v in bverts:
        if v in seen:
            continue
        comp = []; st = [v]; seen.add(v)
        while st:
            c = st.pop(); comp.append(c)
            for e in c.link_edges:
                if len(e.link_faces) == 1:
                    w = e.other_vert(c)
                    if w not in seen:
                        seen.add(w); st.append(w)
        out.append(comp)
    return out


for face_nm, marks_nm in (('BREP1.002', 'BREP1.003'), ('BREP1.006', 'BREP1.005')):
    f = welded(face_nm); m = welded(marks_nm)
    kd = KDTree(len(m.verts))
    for i, v in enumerate(m.verts):
        kd.insert(v.co, i)
    kd.balance()
    # marks bottom plane: min x of marks
    mx = min(v.co.x for v in m.verts)
    rows = []
    for comp in loops_of(f):
        d = [kd.find(v.co)[2] for v in comp]
        ys = [v.co.y for v in comp]; zs = [v.co.z for v in comp]
        rows.append({'n': len(comp), 'size_mm': [round((max(ys) - min(ys)) * 1000, 2), round((max(zs) - min(zs)) * 1000, 2)],
                     'max_d_mm': round(max(d) * 1000, 4), 'mean_d_mm': round(sum(d) / len(d) * 1000, 4)})
    rows.sort(key=lambda r: -r['size_mm'][0])
    print('HOLES', face_nm, 'marks_min_x', round(mx, 5), 'face_x', round(f.verts[0].co.x, 5), json.dumps(rows))
