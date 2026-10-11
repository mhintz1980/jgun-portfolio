import bpy, json, os, re
from mathutils import Vector

PAT = re.compile(r'EXHAUST_CONNECTOR|FFM-1001|^BREP1\.00[17]|DIAL|dial|Dial|lens', re.I)

def bbox(o):
    cs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return [[round(min(c[i] for c in cs), 4) for i in range(3)], [round(max(c[i] for c in cs), 4) for i in range(3)]]

def chain(o):
    out = []
    p = o.parent
    while p is not None:
        out.append(p.name)
        p = p.parent
    return out

def tris(o):
    return sum(max(0, len(p.vertices) - 2) for p in o.data.polygons) if o.type == 'MESH' and o.data else 0

rows = []
for o in bpy.data.objects:
    if PAT.search(o.name) or any(PAT.search(a) for a in chain(o)):
        rows.append({
            'name': o.name, 'type': o.type, 'parent': o.parent.name if o.parent else None, 'chain': chain(o)[:4],
            'collections': [c.name for c in o.users_collection], 'hide_render': o.hide_render, 'hide_viewport': o.hide_viewport,
            'tris': tris(o), 'bbox': bbox(o) if o.type in ('MESH', 'CURVE') else None,
            'loc': [round(v, 4) for v in o.matrix_world.translation],
            'mats': [s.material.name for s in o.material_slots if s.material][:4],
            'mods': [m.type for m in o.modifiers], 'uv': len(o.data.uv_layers) if o.type == 'MESH' and o.data else None,
            'data': o.data.name if o.data else None,
        })

# reference common objects to compare frames with the shipped glb
refs = ['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'PUMP_HOUSING', 'DUCT_INTAKE', 'DUCT_EXHAUST', 'V2RL300-SAF-RES-1020-SAFE-1']
ref_rows = {}
for n in refs:
    o = bpy.data.objects.get(n)
    if not o:
        continue
    # subtree bbox
    meshes = [c for c in bpy.data.objects if c.type == 'MESH' and (c == o or n in chain(c))]
    pts = []
    for m in meshes:
        pts += [m.matrix_world @ Vector(c) for c in m.bound_box]
    if pts:
        ref_rows[n] = [[round(min(p[i] for p in pts), 4) for i in range(3)], [round(max(p[i] for p in pts), 4) for i in range(3)], len(meshes)]

# units / scale
out = {'unit_scale': bpy.context.scene.unit_settings.scale_length, 'unit_system': bpy.context.scene.unit_settings.system, 'rows': rows, 'refs': ref_rows}
with open(os.environ['OUT_JSON'], 'w') as f:
    json.dump(out, f, indent=1)
print('WROTE', len(rows))
