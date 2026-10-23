"""Read-only: shading state of the inlet-face skin and neighbours."""
import bpy

assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
for n in ['G2RL300-SAF-1003-2', 'GRRL200-SAF-1172-1', 'MirrorRL300-SIF-1004-2', 'RL200-SIF-1020-1']:
    o = bpy.data.objects[n]
    m = o.data
    smooth = sum(1 for p in m.polygons if p.use_smooth)
    ngon = sum(1 for p in m.polygons if len(p.vertices) > 4)
    print('SHADE', n, 'polys', len(m.polygons), 'smooth', smooth, 'ngons', ngon, 'custom_normals', m.has_custom_normals,
          'mods', [x.type for x in o.modifiers], 'users', m.users, 'mats', [s.material.name if s.material else None for s in o.material_slots],
          'auto_smooth_attr', [a.name for a in m.attributes if 'smooth' in a.name.lower() or 'sharp' in a.name.lower()])
mat = bpy.data.materials['MSP_YELLOW_PAINT__SECTION']
print('MAT', mat.name, 'users', mat.users)
for nd in mat.node_tree.nodes:
    if nd.type in ('BSDF_PRINCIPLED',):
        print('  principled', {k: (round(nd.inputs[k].default_value, 3) if hasattr(nd.inputs[k].default_value, '__float__') else tuple(round(v, 3) for v in nd.inputs[k].default_value)) for k in ('Roughness', 'Metallic', 'Coat Weight', 'Coat Roughness', 'Emission Strength') if k in nd.inputs})
    else:
        print('  node', nd.type, nd.name)
