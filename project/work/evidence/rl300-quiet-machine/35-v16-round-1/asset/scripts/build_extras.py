"""Asset seat: build rl300-extra-parts.glb from the (scratch copy of the) V16 blend.
Run under Blender 5.1 background on the scratch copy; this script never saves the blend.
Env: OUT_GLB (glb path), OUT_JSON (stats path), CFG (optional json override of CONFIG).
Frame: Blender Z-up world, metres, world transforms baked into vertices; export_yup=True gives (x,y,z)->(x,z,-y).

Method per dial sub-object (bezel / marks / ring): weld at 1 um, planar dissolve (1 deg), triangulate, split into
welded islands, collapse-decimate every island separately (so small glyphs are not starved by the big body) with a
vertex-group pin on each island's per-axis extreme vertices, then re-join. Face plate: the holes that the marks
cover are filled, remaining outlines are Douglas-Peucker simplified and re-triangulated (a collapse shrinks the
54 mm rim by 2-3 mm). Pipe and lenses are unchanged. Dial 2 is dial 1 translated (verified vertex by vertex).
"""
import bpy, bmesh, math, os, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree

CONFIG = {
    'weld': 1e-6,
    'dissolve_deg': 1.0,
    'budget': {'bezel': 1000, 'face': 150, 'marks': 900, 'ring': 150},
    'smooth_deg': 30.0,
    'min_island_tris': 8,
    'pin_weight': 1.0,
    'pin_factor': 1.0,
    'face_eps_mm': 0.05,
    'alloc_exponent': 0.5,
    'size_weight_mm': 12.0,
}
if os.environ.get('CFG'):
    CONFIG.update(json.loads(os.environ['CFG']))

DIAL1 = [('BREP1.001', 'bezel'), ('BREP1.002', 'face'), ('BREP1.003', 'marks'), ('BREP1', 'ring')]
DIAL2 = [('BREP1.007', 'bezel', 'BREP1.001'), ('BREP1.006', 'face', 'BREP1.002'), ('BREP1.005', 'marks', 'BREP1.003'), ('BREP1.008', 'ring', 'BREP1')]
FACE_MARKS = {'BREP1.002': 'BREP1.003', 'BREP1.006': 'BREP1.005'}
HIER = [  # (object, kind, parent)
    ('EXHAUST_CONNECTOR_PIPE', 'pipe', 'DUCT_EXHAUST'),
    ('BREP1.001', 'bezel', 'GAUGE_DIALS'), ('BREP1.002', 'face', 'BREP1.001'), ('BREP1.003', 'marks', 'BREP1.001'),
    ('BREP1', 'ring', 'BREP1.001'), ('DIAL_LENS_1', 'lens', 'BREP1.001'),
    ('BREP1.007', 'bezel', 'GAUGE_DIALS'), ('BREP1.006', 'face', 'BREP1.007'), ('BREP1.005', 'marks', 'BREP1.007'),
    ('BREP1.008', 'ring', 'BREP1.007'), ('DIAL_LENS_2', 'lens', 'BREP1.007'),
]


# ---------------------------------------------------------------- generic bmesh helpers
def components(bm):
    """Return list of lists of faces, grouped by vertex-connected island."""
    bm.verts.ensure_lookup_table(); bm.verts.index_update()
    comp = [-1] * len(bm.verts)
    n = 0
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


def islands_bm(bm):
    return len(components(bm))


def bbox_bm(bm):
    return [[min(v.co[i] for v in bm.verts) for i in range(3)], [max(v.co[i] for v in bm.verts) for i in range(3)]]


def tri_count_mesh(me):
    return sum(len(p.vertices) - 2 for p in me.polygons)


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
    """Decimate-collapse a triangulated island bmesh to <= target tris, extremes pinned via a vertex group."""
    n0 = len(bm.faces)
    if n0 <= target:
        return bm.copy(), None
    me = bpy.data.meshes.new('tmp_collapse')
    bm.verts.index_update()
    bm.to_mesh(me)
    ob = bpy.data.objects.new('tmp_collapse', me)
    scene.collection.objects.link(ob)
    vg = ob.vertex_groups.new(name='pin')
    pins = set()
    for axis in range(3):   # one vertex per axis extreme keeps the island bbox without freezing a whole flat face
        pins.add(min(bm.verts, key=lambda v: v.co[axis]).index)
        pins.add(max(bm.verts, key=lambda v: v.co[axis]).index)
    if pins:
        vg.add(sorted(pins), CONFIG['pin_weight'], 'REPLACE')
    md = ob.modifiers.new('dec', 'DECIMATE')
    md.decimate_type = 'COLLAPSE'
    md.use_collapse_triangulate = True
    md.use_symmetry = False
    md.vertex_group = 'pin'
    md.invert_vertex_group = True   # weight 1 (pinned extremes) = protected from collapse
    md.vertex_group_factor = CONFIG['pin_factor']
    ratio = target / n0 * 0.995
    result = None; prev = -1
    for _ in range(10):
        md.ratio = max(1e-4, min(1.0, ratio))
        bpy.context.view_layer.update()
        ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
        m2 = bpy.data.meshes.new_from_object(ev)
        n2 = len(m2.polygons)
        if result is None or n2 < len(result.polygons):
            if result is not None:
                bpy.data.meshes.remove(result)
            result = m2     # keep the smallest result seen (best effort when the target is below the stall floor)
        else:
            bpy.data.meshes.remove(m2)
        if n2 <= target or n2 == prev:
            break
        prev = n2
        ratio *= target / n2 * 0.99
    scene.collection.objects.unlink(ob)
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(me)
    if result is None:
        return None, ratio
    out = bmesh.new(); out.from_mesh(result)
    bpy.data.meshes.remove(result)
    return out, ratio


def allocate(counts, budget, exponent, floor, mult):
    """Water-fill: t_i = clamp(round(k * m_i * n_i**e), min(n_i, floor), n_i), largest k with sum <= budget."""
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
    return [max(l, min(n, int(round(a * m * n ** exponent)))) for n, l, m in zip(counts, lo, mult)], a


def deviation(src_bm, dst_bm):
    def tree(bm):
        bm.verts.index_update()
        return BVHTree.FromPolygons([v.co.copy() for v in bm.verts], [[l.vert.index for l in f.loops] for f in bm.faces])
    ts, td = tree(src_bm), tree(dst_bm)
    d1 = [ts.find_nearest(v.co)[3] for v in dst_bm.verts]
    d2 = [td.find_nearest(v.co)[3] for v in src_bm.verts]
    return {'dst_to_src_max_mm': max(d1) * 1000, 'dst_to_src_mean_mm': sum(d1) / len(d1) * 1000,
            'src_to_dst_max_mm': max(d2) * 1000, 'src_to_dst_mean_mm': sum(d2) / len(d2) * 1000}


def shade(bm, kind):
    if kind == 'bezel':
        lim = math.radians(CONFIG['smooth_deg'])
        for f in bm.faces:
            f.smooth = True
        for e in bm.edges:
            e.smooth = (len(e.link_faces) == 2 and e.calc_face_angle(0.0) <= lim)
    elif kind in ('face', 'marks', 'ring'):
        for f in bm.faces:
            f.smooth = False


# ---------------------------------------------------------------- face plate: fill covered holes, DP-simplify loops
def boundary_loops(bm):
    be = [e for e in bm.edges if len(e.link_faces) == 1]
    seen = set(); out = []
    for v in {v for e in be for v in e.verts}:
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


def ordered_loop(comp):
    start = comp[0]; order = [start]; visited = {start}; cur = start
    while True:
        nxt = None
        for e in cur.link_edges:
            if len(e.link_faces) == 1:
                w = e.other_vert(cur)
                if w not in visited:
                    nxt = w
                    break
        if nxt is None:
            return order
        order.append(nxt); visited.add(nxt); cur = nxt


def point_in_poly(py, pz, poly):
    inside = False; n = len(poly); j = n - 1
    for i in range(n):
        yi, zi = poly[i]; yj, zj = poly[j]
        if (zi > pz) != (zj > pz) and py < (yj - yi) * (pz - zi) / (zj - zi) + yi:
            inside = not inside
        j = i
    return inside


def poly_area(poly):
    a = 0.0
    for i in range(len(poly)):
        y0, z0 = poly[i]; y1, z1 = poly[(i + 1) % len(poly)]
        a += y0 * z1 - y1 * z0
    return abs(a) / 2


def fill_covered_holes(face_bm, marks_bm, info):
    """Fill every inner hole of the planar face plate that the marks' +x faces cover (ratio in [0.95, 1.10])."""
    marks_bm.normal_update()
    tris = []
    for f in marks_bm.faces:
        if f.normal.x > 0.99:
            tris.append(((sum(v.co.y for v in f.verts) / len(f.verts), sum(v.co.z for v in f.verts) / len(f.verts)),
                         poly_area([(v.co.y, v.co.z) for v in f.verts])))
    loops = [ordered_loop(c) for c in boundary_loops(face_bm)]
    ext = lambda l: max(max(v.co.y for v in l) - min(v.co.y for v in l), max(v.co.z for v in l) - min(v.co.z for v in l))
    loops.sort(key=ext, reverse=True)
    inner = loops[1:]
    kept = []; rows = []
    for l in inner:
        poly = [(v.co.y, v.co.z) for v in l]
        ys = [p[0] for p in poly]; zs = [p[1] for p in poly]
        y0, y1, z0, z1 = min(ys), max(ys), min(zs), max(zs)
        area = poly_area(poly)
        cov = sum(a for (cy, cz), a in tris if y0 <= cy <= y1 and z0 <= cz <= z1 and point_in_poly(cy, cz, poly))
        ratio = cov / area if area > 0 else 0
        filled = 0.95 <= ratio <= 1.10
        rows.append({'verts': len(l), 'size_mm': [round((y1 - y0) * 1000, 2), round((z1 - z0) * 1000, 2)],
                     'area_mm2': round(area * 1e6, 3), 'marks_cover_ratio': round(ratio, 3), 'filled': filled})
        if not filled:
            kept.append(l)
    info['holes_total'] = len(inner)
    info['holes_filled'] = sum(1 for r in rows if r['filled'])
    info['holes_kept'] = [r for r in rows if not r['filled']]
    info['holes_all'] = rows
    return [loops[0]] + kept


def dp_open(pts, eps):
    """Douglas-Peucker on an open chain; returns kept indices (incl. both ends)."""
    n = len(pts)
    if n <= 2:
        return list(range(n))
    keep = {0, n - 1}
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        (y0, z0), (y1, z1) = pts[i], pts[j]
        dy, dz = y1 - y0, z1 - z0
        L = math.hypot(dy, dz)
        best, bd = -1, eps
        for k in range(i + 1, j):
            y, z = pts[k]
            d = abs(dy * (z0 - z) - (y0 - y) * dz) / L if L > 0 else math.hypot(y - y0, z - z0)
            if d > bd:
                best, bd = k, d
        if best >= 0:
            keep.add(best); stack += [(i, best), (best, j)]
    return sorted(keep)


def dp_closed(pts, eps, anchors=None):
    n = len(pts)
    if n <= 3:
        return list(range(n))
    if not anchors or len(anchors) < 2:
        far = max(range(n), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
        anchors = sorted({0, far})
    anchors = sorted(set(anchors))
    keep = set()
    for a, b in zip(anchors, anchors[1:] + [anchors[0] + n]):
        chain = [pts[i % n] for i in range(a, b + 1)]
        for k in dp_open(chain, eps):
            keep.add((a + k) % n)
    return sorted(keep)


def build_face(filled_bm, loops, budget, info):
    x0 = sum(v.co.x for v in filled_bm.verts) / len(filled_bm.verts)
    P = [[(v.co.y, v.co.z) for v in l] for l in loops]
    outer_pts = P[0]
    ext_idx = sorted({min(range(len(outer_pts)), key=lambda i: outer_pts[i][a]) for a in (0, 1)} |
                     {max(range(len(outer_pts)), key=lambda i: outer_pts[i][a]) for a in (0, 1)})
    eps_o = CONFIG['face_eps_mm'] * 1e-3
    eps_h = eps_o
    for _ in range(80):
        o = dp_closed(outer_pts, eps_o, ext_idx)
        hs = [dp_closed(p, eps_h) for p in P[1:]]
        n = len(o) + sum(max(3, len(h)) for h in hs)
        tris = n - 2 + 2 * len(hs)
        if tris <= budget - 2:
            break
        eps_h *= 1.2
        if eps_h > 0.5e-3:
            eps_o *= 1.1
    out = bmesh.new()
    all_edges = []
    for pts, idxs in [(outer_pts, o)] + [(p, h) for p, h in zip(P[1:], hs)]:
        if len(idxs) < 3:   # degenerate after simplification: keep three evenly spaced original vertices
            n_ = len(pts)
            idxs = sorted({0, n_ // 3, (2 * n_) // 3})
        vs = [out.verts.new(Vector((x0, pts[i][0], pts[i][1]))) for i in idxs]
        for a, b in zip(vs, vs[1:] + vs[:1]):
            all_edges.append(out.edges.new((a, b)))
    bmesh.ops.triangle_fill(out, use_beauty=True, use_dissolve=False, edges=all_edges, normal=Vector((1, 0, 0)))
    out.normal_update()
    faces = [f for f in out.faces]
    if faces and sum(f.normal.x for f in faces) < 0:
        bmesh.ops.reverse_faces(out, faces=faces)
    info['rim_verts'] = len(o)
    info['hole_verts_total'] = sum(len(h) for h in hs)
    info['eps_outer_mm'] = eps_o * 1000
    info['eps_holes_mm'] = eps_h * 1000
    return out


# ---------------------------------------------------------------- materials
def principled_values(m):
    pr = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    g = lambda k: pr.inputs[k].default_value
    return {'base': [float(x) for x in g('Base Color')], 'metal': float(g('Metallic')), 'rough': float(g('Roughness')),
            'rough_linked': pr.inputs['Roughness'].is_linked, 'coat': float(g('Coat Weight')), 'coat_rough': float(g('Coat Roughness'))}


def make_mat(name, v, alpha=1.0, blend=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = (v['base'][0], v['base'][1], v['base'][2], 1.0)
    p.inputs['Metallic'].default_value = v['metal']
    p.inputs['Roughness'].default_value = v['rough']
    p.inputs['IOR'].default_value = 1.5
    p.inputs['Alpha'].default_value = alpha
    if v.get('coat', 0) > 0:
        p.inputs['Coat Weight'].default_value = v['coat']
        p.inputs['Coat Roughness'].default_value = v['coat_rough']
    nt.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    if blend:
        for attr, val in (('surface_render_method', 'BLENDED'), ('blend_method', 'BLEND')):
            try:
                setattr(m, attr, val)
            except Exception:
                pass
    return m


# ---------------------------------------------------------------- main
def main():
    scene = bpy.context.scene
    stats = {'config': CONFIG, 'objects': {}, 'materials': {}, 'twin_check': {}}
    src = {}
    for name, kind, parent in HIER:
        o = bpy.data.objects[name]
        bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
        src[name] = {'bm': bm, 'kind': kind, 'mat': o.material_slots[0].material.name, 'src_tris': tri_count_mesh(o.data),
                     'world_verts': [tuple(o.matrix_world @ v.co) for v in o.data.vertices]}
    mats_v16 = {}
    for name, kind, parent in HIER:
        mn = src[name]['mat']
        if mn not in mats_v16:
            m = bpy.data.materials[mn]
            mats_v16[mn] = principled_values(m) if any(n.type == 'BSDF_PRINCIPLED' for n in m.node_tree.nodes) else None
    lens = bpy.data.materials['DIAL_LENS']
    nodes = lens.node_tree.nodes
    fres = next(n for n in nodes if n.type == 'FRESNEL'); glossy = next(n for n in nodes if n.type == 'BSDF_GLOSSY')
    mixn = next(n for n in nodes if n.type == 'MIX_SHADER')
    slots = {}
    for l in lens.node_tree.links:
        if l.to_node == mixn:
            slots[l.to_socket.identifier] = l.from_node.type
    ior = float(fres.inputs['IOR'].default_value)
    f0 = ((ior - 1.0) / (ior + 1.0)) ** 2
    lens_v = {'base': [float(x) for x in glossy.inputs['Color'].default_value[:3]], 'metal': 0.0,
              'rough': float(glossy.inputs['Roughness'].default_value), 'coat': 0.0, 'coat_rough': 0.0}
    stats['lens'] = {'fresnel_ior': ior, 'f0_normal_incidence': f0, 'mix_inputs_by_identifier': slots,
                     'mix_factor_socket_default': float(mixn.inputs[0].default_value), 'factor_linked': mixn.inputs[0].is_linked,
                     'glossy_color': lens_v['base'], 'glossy_roughness': lens_v['rough'],
                     'note': 'Mix Shader fac=Fresnel(IOR); slot Shader (A, fac=0) and Shader_001 (B, fac=1) hold the types listed'}
    st = bpy.data.materials['MSP_STAINLESS_FASTENER']
    mr = next(n for n in st.node_tree.nodes if n.type == 'MAP_RANGE')
    tmin = float(mr.inputs['To Min'].default_value); tmax = float(mr.inputs['To Max'].default_value)
    mid = (tmin + tmax) / 2
    stats['stainless'] = {'from': [float(mr.inputs['From Min'].default_value), float(mr.inputs['From Max'].default_value)],
                          'to': [tmin, tmax], 'midpoint': mid, 'socket_default': mats_v16['MSP_STAINLESS_FASTENER']['rough'],
                          'value_source': 'Object Info Random (per object, 0..1), interpolation ' + mr.interpolation_type}

    def process(name, kind):
        s = src[name]
        rec = {'kind': kind, 'tris_before': s['src_tris'], 'material': s['mat']}
        bm_w = s['bm'].copy()
        bmesh.ops.remove_doubles(bm_w, verts=bm_w.verts, dist=CONFIG['weld'])
        rec['tris_after_weld'] = sum(len(f.verts) - 2 for f in bm_w.faces)
        rec['islands_before'] = islands_bm(bm_w)
        rec['bbox_before'] = bbox_bm(bm_w)
        base = bm_w
        if kind == 'face':
            mk = src[FACE_MARKS[name]]['bm'].copy()
            bmesh.ops.remove_doubles(mk, verts=mk.verts, dist=CONFIG['weld'])
            info = {}
            keep_loops = fill_covered_holes(bm_w, mk, info)
            mk.free()
            rec['fill'] = info
            base = bm_w.copy()
            bmesh.ops.dissolve_limit(base, angle_limit=math.radians(0.5), verts=base.verts[:], edges=base.edges[:])
            bmesh.ops.triangulate(base, faces=base.faces[:])
            work = build_face(bm_w, keep_loops, CONFIG['budget']['face'], rec['fill'])
            rec['method'] = 'fill covered holes + Douglas-Peucker loops + triangle_fill'
        else:
            w0 = bm_w.copy()
            # the six per-axis extreme vertices are kept out of the dissolve so the bbox survives it
            keep_v = set()
            for ax in range(3):
                keep_v.add(min(w0.verts, key=lambda v: v.co[ax])); keep_v.add(max(w0.verts, key=lambda v: v.co[ax]))
            bmesh.ops.dissolve_limit(w0, angle_limit=math.radians(CONFIG['dissolve_deg']),
                                     verts=[v for v in w0.verts if v not in keep_v],
                                     edges=[e for e in w0.edges if e.verts[0] not in keep_v and e.verts[1] not in keep_v])
            bmesh.ops.triangulate(w0, faces=w0.faces[:])
            rec['tris_after_dissolve'] = len(w0.faces)
            groups = components(w0)
            subs = [sub_bm(g) for g in groups]
            counts = [len(b.faces) for b in subs]
            dims = []
            for b in subs:
                bb_ = bbox_bm(b)
                dims.append(max(bb_[1][i] - bb_[0][i] for i in range(3)) * 1000)
            mult = [1.0 + d / CONFIG['size_weight_mm'] for d in dims]
            budget_eff = CONFIG['budget'][kind]
            for attempt in range(4):
                targets, k = allocate(counts, budget_eff, CONFIG['alloc_exponent'], CONFIG['min_island_tris'], mult)
                work = bmesh.new()
                irows = []
                for b, n0, t in zip(subs, counts, targets):
                    r, ratio = collapse_island(b, t, scene)
                    if r is None:
                        r = b.copy()
                    bb = bbox_bm(b)
                    d_ = deviation(b, r) if len(r.faces) != n0 else None
                    irows.append({'tris_in': n0, 'target': t, 'tris_out': len(r.faces),
                                  'size_mm': [round((bb[1][i] - bb[0][i]) * 1000, 2) for i in range(3)],
                                  'dev_max_mm': round(max(d_['dst_to_src_max_mm'], d_['src_to_dst_max_mm']), 3) if d_ else 0.0})
                    append_bm(work, r)
                    r.free()
                total = len(work.faces)
                if total <= CONFIG['budget'][kind]:
                    break
                budget_eff -= (total - CONFIG['budget'][kind]) + 2
                if attempt < 3:
                    work.free()
            for b in subs:
                b.free()
            rec['alloc'] = {'k': k, 'exponent': CONFIG['alloc_exponent'], 'budget_effective': budget_eff, 'attempts': attempt + 1, 'islands': irows}
            rec['method'] = 'planar dissolve %.1f deg + per-island collapse with pinned extremes' % CONFIG['dissolve_deg']
            w0.free()
        shade(work, kind)
        rec['tris_after'] = len(work.faces)
        rec['islands_after'] = islands_bm(work)
        rec['bbox_after'] = bbox_bm(work)
        bb0, bb1 = rec['bbox_before'], rec['bbox_after']
        rec['bbox_change_mm'] = max(abs(bb0[a][i] - bb1[a][i]) for a in range(2) for i in range(3)) * 1000
        rec['bbox_change_per_axis_mm'] = [max(abs(bb0[a][i] - bb1[a][i]) for a in range(2)) * 1000 for i in range(3)]
        rec['dev'] = deviation(base, work)
        if base is not bm_w:
            base.free()
        bm_w.free()
        return work, rec

    result_bm = {}
    for name, kind in DIAL1:
        result_bm[name], stats['objects'][name] = process(name, kind)
    for name, kind, twin in DIAL2:
        a = src[twin]['world_verts']; b = src[name]['world_verts']
        ok = len(a) == len(b)
        shift = None; maxdev = None
        if ok:
            shift = [b[0][i] - a[0][i] for i in range(3)]
            maxdev = max(abs((b[j][i] - a[j][i]) - shift[i]) for j in range(len(a)) for i in range(3))
            ok = maxdev < 1e-6
        stats['twin_check'][name] = {'twin_of': twin, 'same_vertex_count': len(a) == len(b), 'shift_m': shift,
                                     'max_dev_after_shift_m': maxdev, 'is_translated_twin': ok}
        if ok:
            bm = result_bm[twin].copy()
            bmesh.ops.translate(bm, vec=Vector(shift), verts=bm.verts)
            result_bm[name] = bm
            rec = json.loads(json.dumps(stats['objects'][twin]))
            rec['reused_from'] = twin; rec['material'] = src[name]['mat']
            for key in ('bbox_before', 'bbox_after'):
                rec[key] = [[rec[key][a_][i] + shift[i] for i in range(3)] for a_ in range(2)]
            stats['objects'][name] = rec
        else:
            result_bm[name], stats['objects'][name] = process(name, kind)
    for name, kind, parent in HIER:
        if kind in ('pipe', 'lens'):
            bm = src[name]['bm'].copy()
            rec = {'kind': kind, 'tris_before': src[name]['src_tris'], 'material': src[name]['mat'], 'islands_before': islands_bm(bm)}
            rec['bbox_before'] = bbox_bm(bm)
            big = [f for f in bm.faces if len(f.verts) > 3]
            if big:
                bmesh.ops.triangulate(bm, faces=big)
            rec['tris_after'] = len(bm.faces); rec['islands_after'] = islands_bm(bm)
            rec['bbox_after'] = bbox_bm(bm); rec['bbox_change_mm'] = 0.0; rec['dev'] = None
            result_bm[name] = bm; stats['objects'][name] = rec

    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    new_mats = {}
    for mn, v in mats_v16.items():
        if mn == 'DIAL_LENS':
            continue
        vv = dict(v)
        if mn == 'MSP_STAINLESS_FASTENER':
            vv['rough'] = mid
        new_mats[mn] = make_mat(mn, vv)
        stats['materials'][mn] = {k: vv[k] for k in ('base', 'metal', 'rough', 'coat', 'coat_rough')}
    new_mats['DIAL_LENS'] = make_mat('DIAL_LENS', lens_v, alpha=f0, blend=True)
    stats['materials']['DIAL_LENS'] = {**{k: lens_v[k] for k in ('base', 'metal', 'rough', 'coat', 'coat_rough')}, 'alpha': f0}
    objs = {}
    for root in ('DUCT_EXHAUST', 'GAUGE_DIALS'):
        e = bpy.data.objects.new(root, None)
        scene.collection.objects.link(e)
        objs[root] = e
    for name, kind, parent in HIER:
        me = bpy.data.meshes.new(name)
        result_bm[name].to_mesh(me)
        me.materials.append(new_mats[src[name]['mat']])
        me.update()
        o = bpy.data.objects.new(name, me)
        scene.collection.objects.link(o)
        objs[name] = o
    for name, kind, parent in HIER:
        objs[name].parent = objs[parent]
    bpy.context.view_layer.update()
    for o in objs.values():
        assert max(abs(o.matrix_world[i][j] - (1.0 if i == j else 0.0)) for i in range(4) for j in range(4)) < 1e-9, o.name

    bpy.ops.export_scene.gltf(
        filepath=os.environ['OUT_GLB'], export_format='GLB', use_selection=False, export_yup=True,
        export_apply=False, export_texcoords=False, export_normals=True, export_tangents=False,
        export_materials='EXPORT', export_vertex_color='NONE', export_cameras=False, export_lights=False,
        export_animations=False, export_draco_mesh_compression_enable=False, export_extras=False,
        export_attributes=False, export_image_format='NONE', export_skins=False, export_morph=False,
    )
    with open(os.environ['OUT_JSON'], 'w') as f:
        json.dump(stats, f, indent=1)
    print('BUILD_OK')
    print('TWIN', json.dumps(stats['twin_check']))
    print('LENS', json.dumps(stats['lens']))
    for n, r in stats['objects'].items():
        print('ROW', n, r['kind'], r['tris_before'], '->', r['tris_after'], 'isl', r['islands_before'], '->', r['islands_after'],
              'bboxmm %.3f' % r['bbox_change_mm'], ('dev %.3f/%.3f' % (r['dev']['dst_to_src_max_mm'], r['dev']['src_to_dst_max_mm'])) if r['dev'] else '')


main()
