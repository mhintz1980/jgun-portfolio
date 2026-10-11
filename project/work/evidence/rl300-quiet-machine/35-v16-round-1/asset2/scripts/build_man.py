"""Round 2 asset seat: build the MAN (PUMP_HOUSING) assembly as a standalone GLB (merged into the extras GLB by merge-man.mjs).
Run under Blender 5.1 background on the scratch V16 copy; never saves the blend.
Env: OUT_GLB, OUT_JSON. Method as build_extras.py: weld 1 um, planar dissolve 1 deg (axis extremes kept), triangulate,
per-island collapse with extreme vertices pinned, rejoin. Pieces with target None are only triangulated.
"""
import bpy, bmesh, math, os, json

CFG = {'weld': 1e-6, 'dissolve_deg': 1.0, 'smooth_deg': 30.0, 'min_island_tris': 8, 'pin_weight': 1.0,
       'pin_factor': 1.0, 'alloc_exponent': 0.5, 'size_weight_mm': 12.0}
# (V16 object, exported name, target tris or None)
PIECES = [
    ('MAN-6650459107-1', 'MAN-6650459107-1.000', 300),
    ('MAN-6650459107-1.001', 'MAN-6650459107-1.001', 400),
    ('MAN-6650459107-1.002', 'MAN-6650459107-1.002', 600),
    ('MAN-6650459107-1.003', 'MAN-6650459107-1.003', None),
    ('MAN-6650459107-1.004', 'MAN-6650459107-1.004', 3500),
    ('MAN-6650459107-1.005', 'MAN-6650459107-1.005', None),
    ('MAN-6650459107-1.006', 'MAN-6650459107-1.006', 600),
    ('MAN-6650459107-1.007', 'MAN-6650459107-1.007', 300),
]


def components(bm):
    bm.verts.ensure_lookup_table(); bm.verts.index_update()
    comp = [-1] * len(bm.verts); n = 0
    for v in bm.verts:
        if comp[v.index] >= 0:
            continue
        st = [v]; comp[v.index] = n
        while st:
            c = st.pop()
            for e in c.link_edges:
                w = e.other_vert(c)
                if comp[w.index] < 0:
                    comp[w.index] = n; st.append(w)
        n += 1
    groups = [[] for _ in range(n)]
    for f in bm.faces:
        groups[comp[f.verts[0].index]].append(f)
    return [g for g in groups if g]


def bbox_bm(bm):
    return [[min(v.co[i] for v in bm.verts) for i in range(3)], [max(v.co[i] for v in bm.verts) for i in range(3)]]


def sub_bm(faces):
    out = bmesh.new(); vmap = {}
    for f in faces:
        vs = []
        for v in f.verts:
            if v not in vmap:
                vmap[v] = out.verts.new(v.co)
            vs.append(vmap[v])
        out.faces.new(vs)
    return out


def append_bm(dst, src):
    vmap = {}
    for f in src.faces:
        vs = []
        for v in f.verts:
            if v not in vmap:
                vmap[v] = dst.verts.new(v.co)
            vs.append(vmap[v])
        dst.faces.new(vs)


def collapse_island(bm, target, scene):
    n0 = len(bm.faces)
    if n0 <= target:
        return bm.copy()
    me = bpy.data.meshes.new('tmp_collapse'); bm.verts.index_update(); bm.to_mesh(me)
    ob = bpy.data.objects.new('tmp_collapse', me); scene.collection.objects.link(ob)
    vg = ob.vertex_groups.new(name='pin'); pins = set()
    for axis in range(3):
        pins.add(min(bm.verts, key=lambda v: v.co[axis]).index); pins.add(max(bm.verts, key=lambda v: v.co[axis]).index)
    vg.add(sorted(pins), CFG['pin_weight'], 'REPLACE')
    md = ob.modifiers.new('dec', 'DECIMATE')
    md.decimate_type = 'COLLAPSE'; md.use_collapse_triangulate = True; md.use_symmetry = False
    md.vertex_group = 'pin'; md.invert_vertex_group = True; md.vertex_group_factor = CFG['pin_factor']
    ratio = target / n0 * 0.995; result = None; prev = -1
    for _ in range(10):
        md.ratio = max(1e-4, min(1.0, ratio))
        bpy.context.view_layer.update()
        ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
        m2 = bpy.data.meshes.new_from_object(ev); n2 = len(m2.polygons)
        if result is None or n2 < len(result.polygons):
            if result is not None:
                bpy.data.meshes.remove(result)
            result = m2
        else:
            bpy.data.meshes.remove(m2)
        if n2 <= target or n2 == prev:
            break
        prev = n2; ratio *= target / n2 * 0.99
    scene.collection.objects.unlink(ob); bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    out = bmesh.new(); out.from_mesh(result); bpy.data.meshes.remove(result)
    return out


def allocate(counts, budget, exponent, floor, mult):
    lo = [min(n, floor) for n in counts]
    def total(k):
        return sum(max(l, min(n, int(round(k * m * n ** exponent)))) for n, l, m in zip(counts, lo, mult))
    a, b = 0.0, 1000.0
    for _ in range(60):
        mid_ = (a + b) / 2
        if total(mid_) <= budget:
            a = mid_
        else:
            b = mid_
    return [max(l, min(n, int(round(a * m * n ** exponent)))) for n, l, m in zip(counts, lo, mult)]


def principled_values(m):
    pr = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    g = lambda k: pr.inputs[k].default_value
    return {'base': [float(x) for x in g('Base Color')], 'metal': float(g('Metallic')), 'rough': float(g('Roughness')),
            'coat': float(g('Coat Weight')), 'coat_rough': float(g('Coat Roughness'))}


def make_mat(name, v):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = (v['base'][0], v['base'][1], v['base'][2], 1.0)
    p.inputs['Metallic'].default_value = v['metal']; p.inputs['Roughness'].default_value = v['rough']
    p.inputs['IOR'].default_value = 1.5
    if v['coat'] > 0:
        p.inputs['Coat Weight'].default_value = v['coat']; p.inputs['Coat Roughness'].default_value = v['coat_rough']
    nt.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    return m


def shade(bm):
    lim = math.radians(CFG['smooth_deg'])
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        e.smooth = (len(e.link_faces) == 2 and e.calc_face_angle(0.0) <= lim)


def main():
    scene = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    stats = {'pieces': {}, 'materials': {}}
    built = {}
    mats_v = {}
    for src_name, out_name, target in PIECES:
        o = bpy.data.objects[src_name]
        assert len(o.material_slots) == 1, (src_name, len(o.material_slots))
        mn = o.material_slots[0].material.name
        if mn not in mats_v:
            mats_v[mn] = principled_values(o.material_slots[0].material)
        me_ev = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        bm = bmesh.new(); bm.from_mesh(me_ev); bpy.data.meshes.remove(me_ev)
        bm.transform(o.matrix_world)
        neg = o.matrix_world.determinant() < 0
        if neg:
            bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        rec = {'src': src_name, 'material': mn, 'tris_before': len(bm.faces), 'mods': [m.type for m in o.modifiers],
               'neg_det_flipped': neg, 'target': target, 'bbox_before': bbox_bm(bm)}
        if target is None:
            work = bm
        else:
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=CFG['weld'])
            keep_v = set()
            for ax in range(3):
                keep_v.add(min(bm.verts, key=lambda v: v.co[ax])); keep_v.add(max(bm.verts, key=lambda v: v.co[ax]))
            bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(CFG['dissolve_deg']),
                                     verts=[v for v in bm.verts if v not in keep_v],
                                     edges=[e for e in bm.edges if e.verts[0] not in keep_v and e.verts[1] not in keep_v])
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
            rec['tris_after_dissolve'] = len(bm.faces)
            subs = [sub_bm(g) for g in components(bm)]
            counts = [len(b.faces) for b in subs]
            mult = []
            for b in subs:
                bb = bbox_bm(b)
                mult.append(1.0 + max(bb[1][i] - bb[0][i] for i in range(3)) * 1000 / CFG['size_weight_mm'])
            budget_eff = target
            for attempt in range(5):
                tg = allocate(counts, budget_eff, CFG['alloc_exponent'], CFG['min_island_tris'], mult)
                work = bmesh.new()
                for b, t in zip(subs, tg):
                    r = collapse_island(b, t, scene); append_bm(work, r); r.free()
                total = len(work.faces)
                if total <= target:
                    break
                budget_eff -= (total - target) + 2
                if attempt < 4:
                    work.free()
            rec['islands'] = len(subs); rec['attempts'] = attempt + 1
            for b in subs:
                b.free()
            bm.free()
        shade(work)
        rec['tris_after'] = len(work.faces)
        rec['bbox_after'] = bbox_bm(work)
        rec['bbox_change_mm'] = max(abs(rec['bbox_before'][a][i] - rec['bbox_after'][a][i]) for a in range(2) for i in range(3)) * 1000
        built[out_name] = (work, mn)
        stats['pieces'][out_name] = rec
    # fresh scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    new_mats = {mn: make_mat(mn, v) for mn, v in mats_v.items()}
    stats['materials'] = mats_v
    root = bpy.data.objects.new('PUMP_HOUSING', None); scene.collection.objects.link(root)
    for out_name, (bm, mn) in built.items():
        me = bpy.data.meshes.new(out_name); bm.to_mesh(me); me.materials.append(new_mats[mn]); me.update()
        o = bpy.data.objects.new(out_name, me); scene.collection.objects.link(o); o.parent = root
    bpy.context.view_layer.update()
    bpy.ops.export_scene.gltf(
        filepath=os.environ['OUT_GLB'], export_format='GLB', use_selection=False, export_yup=True,
        export_apply=False, export_texcoords=False, export_normals=True, export_tangents=False,
        export_materials='EXPORT', export_vertex_color='NONE', export_cameras=False, export_lights=False,
        export_animations=False, export_draco_mesh_compression_enable=False, export_extras=False,
        export_attributes=False, export_image_format='NONE', export_skins=False, export_morph=False)
    with open(os.environ['OUT_JSON'], 'w') as f:
        json.dump(stats, f, indent=1)
    print('BUILD_OK')
    for n, r in stats['pieces'].items():
        print('ROW', n, r['material'], r['tris_before'], '->', r['tris_after'], 'tgt', r['target'], 'mods', r['mods'], 'bboxmm %.3f' % r['bbox_change_mm'])


main()
