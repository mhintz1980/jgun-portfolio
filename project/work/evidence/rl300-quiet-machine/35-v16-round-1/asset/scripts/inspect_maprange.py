"""Dump Map Range inputs by identifier for every material that has one (FLOAT-variant sockets are hidden by name collisions)."""
import bpy, json, os

out = {}
for m in bpy.data.materials:
    if not (m.use_nodes and m.node_tree):
        continue
    for n in m.node_tree.nodes:
        if n.type == 'MAP_RANGE':
            row = {'data_type': n.data_type, 'interp': n.interpolation_type, 'clamp': n.clamp, 'inputs': {}}
            for i in n.inputs:
                v = getattr(i, 'default_value', None)
                row['inputs'][i.identifier] = {'enabled': i.enabled, 'linked': i.is_linked,
                                               'v': ([float(x) for x in v] if hasattr(v, '__len__') else v)}
            out.setdefault(m.name, []).append(row)
with open(os.environ['OUT_JSON'], 'w') as f:
    json.dump(out, f, indent=1)
print('WROTE', list(out))
