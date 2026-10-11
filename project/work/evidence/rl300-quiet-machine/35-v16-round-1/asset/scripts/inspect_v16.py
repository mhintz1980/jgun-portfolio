"""Asset seat: read-only inspection of the V16 scratch copy. Run under Blender background.
Env: OUT_JSON = output path. Writes: every mesh object (name, root, slots, tris, hide), target-object details,
material node trees for non-Principled / linked sockets, mark islands."""
import bpy, json, os, bmesh
from mathutils import Vector

TARGETS = ['EXHAUST_CONNECTOR_PIPE', 'BREP1.001', 'BREP1.002', 'BREP1.003', 'BREP1', 'DIAL_LENS_1',
           'BREP1.007', 'BREP1.006', 'BREP1.005', 'BREP1.008', 'DIAL_LENS_2', 'RL300-P-FFM-1001-1']


def root_of(o):
    p = o
    while p.parent is not None:
        p = p.parent
    return p.name


def bbox(o):
    cs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return [[min(c[i] for c in cs) for i in range(3)], [max(c[i] for c in cs) for i in range(3)]]


def islands(me, merge_dist=None):
    bm = bmesh.new()
    bm.from_mesh(me)
    if merge_dist:
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=merge_dist)
    seen = set()
    n = 0
    for v in bm.verts:
        if v.index in seen:
            continue
        n += 1
        stack = [v]
        seen.add(v.index)
        while stack:
            c = stack.pop()
            for e in c.link_edges:
                w = e.other_vert(c)
                if w.index not in seen:
                    seen.add(w.index)
                    stack.append(w)
    bm.free()
    return n


def sock(s):
    if s is None:
        return None
    d = {'linked': s.is_linked}
    try:
        v = s.default_value
        d['v'] = [float(x) for x in v] if hasattr(v, '__len__') else float(v)
    except Exception:
        d['v'] = None
    if s.is_linked:
        d['from'] = [[l.from_node.name, l.from_node.type, l.from_socket.name] for l in s.links]
    return d


def tree(m):
    out = {'use_nodes': m.use_nodes, 'nodes': [], 'links': []}
    if not (m.use_nodes and m.node_tree):
        out['diffuse_color'] = list(m.diffuse_color)
        return out
    for n in m.node_tree.nodes:
        row = {'name': n.name, 'type': n.type, 'inputs': {}}
        for i in n.inputs:
            if i.hide and not i.is_linked:
                continue
            row['inputs'][i.name] = sock(i)
        for attr in ('data_type', 'interpolation_type', 'clamp', 'blend_type', 'distribution', 'subsurface_method'):
            if hasattr(n, attr):
                row[attr] = str(getattr(n, attr))
        out['nodes'].append(row)
    for l in m.node_tree.links:
        out['links'].append([l.from_node.name, l.from_socket.name, l.to_node.name, l.to_socket.name])
    out['blend_method'] = getattr(m, 'blend_method', None)
    out['surface_render_method'] = getattr(m, 'surface_render_method', None)
    return out


res = {'objects': [], 'targets': {}, 'materials': {}}
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    res['objects'].append({
        'n': o.name, 'root': root_of(o), 'parent': o.parent.name if o.parent else None,
        'tris': sum(len(p.vertices) - 2 for p in o.data.polygons),
        'slots': [s.material.name if s.material else None for s in o.material_slots],
        'hide_render': o.hide_render, 'hide_viewport': o.hide_viewport, 'hide_get': o.hide_get() if bpy.context.view_layer.objects.get(o.name) else None,
    })
res['n_mesh'] = len(res['objects'])
res['n_all'] = len(bpy.data.objects)
res['types'] = {}
for o in bpy.data.objects:
    res['types'][o.type] = res['types'].get(o.type, 0) + 1

for n in TARGETS:
    o = bpy.data.objects.get(n)
    if o is None:
        res['targets'][n] = None
        continue
    me = o.data
    t = {
        'parent': o.parent.name if o.parent else None,
        'matrix_world': [list(r) for r in o.matrix_world],
        'matrix_parent_inverse': [list(r) for r in o.matrix_parent_inverse],
        'det': o.matrix_world.determinant(),
        'verts': len(me.vertices), 'polys': len(me.polygons),
        'tris': sum(len(p.vertices) - 2 for p in me.polygons),
        'ngons': sum(1 for p in me.polygons if len(p.vertices) > 4),
        'quads': sum(1 for p in me.polygons if len(p.vertices) == 4),
        'smooth_polys': sum(1 for p in me.polygons if p.use_smooth),
        'uv': [u.name for u in me.uv_layers], 'attrs': [a.name for a in me.attributes],
        'slots': [(s.material.name if s.material else None, s.link) for s in o.material_slots],
        'mods': [m.type for m in o.modifiers], 'has_shape_keys': bool(me.shape_keys),
        'bbox': bbox(o),
        'islands_raw': islands(me), 'islands_merged_1um': islands(me, 1e-6),
        'islands_merged_10um': islands(me, 1e-5),
        'data_name': me.name, 'data_users': me.users,
    }
    res['targets'][n] = t

dup = bpy.data.objects.get('DUCT_EXHAUST')
if dup:
    res['DUCT_EXHAUST'] = {'type': dup.type, 'matrix_world': [list(r) for r in dup.matrix_world], 'children': [c.name for c in dup.children][:8]}

for m in bpy.data.materials:
    pr = next((n for n in (m.node_tree.nodes if m.use_nodes and m.node_tree else []) if n.type == 'BSDF_PRINCIPLED'), None)
    row = {'principled': pr is not None, 'users': m.users}
    if pr is None or m.name in ('DIAL_LENS', 'MSP_STAINLESS_FASTENER'):
        row['tree'] = tree(m)
    elif pr is not None:
        row['p'] = {k: sock(pr.inputs.get(k)) for k in ('Base Color', 'Metallic', 'Roughness', 'Coat Weight', 'Coat Roughness', 'Alpha', 'Transmission Weight', 'IOR', 'Emission Strength')}
    res['materials'][m.name] = row

with open(os.environ['OUT_JSON'], 'w') as f:
    json.dump(res, f, indent=1)
print('WROTE', res['n_mesh'], res['n_all'])
