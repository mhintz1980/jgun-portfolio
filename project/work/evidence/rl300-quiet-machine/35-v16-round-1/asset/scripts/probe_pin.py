"""Probe how the Decimate modifier's vertex group behaves (which weights are protected)."""
import bpy, bmesh, math, json

o = bpy.data.objects['BREP1.001']
bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1.0), verts=bm.verts[:], edges=bm.edges[:])
bmesh.ops.triangulate(bm, faces=bm.faces[:])
# main island = largest component
bm.verts.ensure_lookup_table(); bm.verts.index_update()
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
sizes = {}
for f in bm.faces:
    sizes[comp[f.verts[0].index]] = sizes.get(comp[f.verts[0].index], 0) + 1
main = max(sizes, key=sizes.get)
faces = [f for f in bm.faces if comp[f.verts[0].index] == main]
sb = bmesh.new(); vm = {}
for f in faces:
    vs = []
    for v in f.verts:
        if v not in vm:
            vm[v] = sb.verts.new(v.co)
        vs.append(vm[v])
    sb.faces.new(vs)
sb.verts.index_update()
me = bpy.data.meshes.new('t'); sb.to_mesh(me)
sc = bpy.context.scene
ob = bpy.data.objects.new('t', me); sc.collection.objects.link(ob)
vg = ob.vertex_groups.new(name='pin')
pins = set()
for axis in range(3):
    lo = min(v.co[axis] for v in sb.verts); hi = max(v.co[axis] for v in sb.verts)
    for v in sb.verts:
        if abs(v.co[axis] - lo) < 1e-6 or abs(v.co[axis] - hi) < 1e-6:
            pins.add(v.index)
vg.add(sorted(pins), 1.0, 'REPLACE')
print('PIN main_tris', len(faces), 'pinned_verts', len(pins))
md = ob.modifiers.new('dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = 0.05
for use_vg, inv, fac in ((False, False, 1.0), (True, False, 1.0), (True, True, 1.0), (True, True, 0.0), (True, False, 0.0), (True, True, 100.0)):
    md.vertex_group = 'pin' if use_vg else ''
    md.invert_vertex_group = inv
    md.vertex_group_factor = fac
    bpy.context.view_layer.update()
    ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
    m2 = bpy.data.meshes.new_from_object(ev)
    xs = [v.co.x for v in m2.vertices]; ys = [v.co.y for v in m2.vertices]; zs = [v.co.z for v in m2.vertices]
    ref = [(min(v.co[a] for v in sb.verts), max(v.co[a] for v in sb.verts)) for a in range(3)]
    d = max(abs(min(xs) - ref[0][0]), abs(max(xs) - ref[0][1]), abs(min(ys) - ref[1][0]), abs(max(ys) - ref[1][1]),
            abs(min(zs) - ref[2][0]), abs(max(zs) - ref[2][1])) * 1000
    print('PIN use_vg', use_vg, 'invert', inv, 'factor', fac, 'tris', len(m2.polygons), 'bbox_change_mm', round(d, 4))
    bpy.data.meshes.remove(m2)
