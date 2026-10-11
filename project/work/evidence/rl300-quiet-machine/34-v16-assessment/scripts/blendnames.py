import bpy, json, os

rows = []
for o in bpy.data.objects:
    if o.type != 'MESH' or o.data is None:
        continue
    t = sum(max(0, len(p.vertices) - 2) for p in o.data.polygons)
    p = o
    chain = []
    while p.parent is not None:
        p = p.parent
    dec = [m.ratio for m in o.modifiers if m.type == 'DECIMATE']
    rows.append({
        'n': o.name, 'root': p.name, 'tris': t, 'hide': bool(o.hide_render or o.hide_viewport),
        'mats': [s.material.name for s in o.material_slots if s.material][:3],
        'dec': dec[:1],
    })
with open(os.environ['OUT_JSON'], 'w') as f:
    json.dump(rows, f)
print('WROTE', len(rows))
