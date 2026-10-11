"""Probe: why do some marks islands refuse to collapse? Try variants per island at ratio 0.05."""
import bpy, bmesh, math

o = bpy.data.objects['BREP1.003']
bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1.0), verts=bm.verts[:], edges=bm.edges[:])
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bm.verts.ensure_lookup_table(); bm.verts.index_update()
comp = {}; n = 0
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
groups = {}
for f in bm.faces:
    groups.setdefault(comp[f.verts[0].index], []).append(f)
sc = bpy.context.scene


def run(sb, mode, ratio=0.05):
    me = bpy.data.meshes.new('t'); sb.verts.index_update(); sb.to_mesh(me)
    ob = bpy.data.objects.new('t', me); sc.collection.objects.link(ob)
    md = ob.modifiers.new('dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = ratio
    md.use_collapse_triangulate = True
    if mode in ('pin6', 'pin6_notri'):
        vg = ob.vertex_groups.new(name='pin'); pins = set()
        for a in range(3):
            pins.add(min(sb.verts, key=lambda v: v.co[a]).index); pins.add(max(sb.verts, key=lambda v: v.co[a]).index)
        vg.add(sorted(pins), 1.0, 'REPLACE')
        md.vertex_group = 'pin'; md.invert_vertex_group = True
        md.use_collapse_triangulate = (mode == 'pin6')
    bpy.context.view_layer.update()
    ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
    m2 = bpy.data.meshes.new_from_object(ev)
    c = len(m2.polygons)
    bpy.data.meshes.remove(m2); sc.collection.objects.unlink(ob); bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    return c


rows = []
for gi, faces in sorted(groups.items(), key=lambda kv: -len(kv[1])):
    sb = bmesh.new(); vm = {}
    for f in faces:
        vs = []
        for v in f.verts:
            if v not in vm:
                vm[v] = sb.verts.new(v.co)
            vs.append(vm[v])
        sb.faces.new(vs)
    # manifold stats
    be = sum(1 for e in sb.edges if len(e.link_faces) == 1)
    nm = sum(1 for e in sb.edges if len(e.link_faces) > 2)
    rows.append((len(faces), be, nm, run(sb, 'none'), run(sb, 'pin6'), run(sb, 'pin6_notri')))
    sb.free()
for r in rows:
    print('MC tris', r[0], 'boundary', r[1], 'nonmanifold', r[2], 'none->', r[3], 'pin6->', r[4], 'pin6_notri->', r[5])
