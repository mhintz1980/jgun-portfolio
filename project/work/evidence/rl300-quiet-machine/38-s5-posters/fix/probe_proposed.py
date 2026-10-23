"""Read-only: PROPOSED_* objects in the scratch blend, and the floor/eye relation at beat 4."""
import bpy
from mathutils import Vector

assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
sc = bpy.context.scene
sc.frame_set(584)
for o in bpy.data.objects:
    if 'PROPOSED' in o.name.upper() or 'LOWER' in o.name.upper() and 'INTAKE' in o.name.upper():
        kids = [c.name for c in o.children_recursive]
        pts = [o.matrix_world @ Vector(c) for c in o.bound_box] if o.type == 'MESH' else []
        print('OBJ', o.name, o.type, 'parent', o.parent.name if o.parent else None, 'hide_render', o.hide_render, 'hide_vp', o.hide_viewport,
              'kids', len(kids), kids[:6], 'verts', len(o.data.vertices) if o.type == 'MESH' else None,
              'z' if pts else '', (round(min(p.z for p in pts), 3), round(max(p.z for p in pts), 3)) if pts else '')
print('FLOOR', [(o.name, round(o.matrix_world.translation.z, 4), o.hide_render) for o in bpy.data.objects if 'FLOOR' in o.name.upper()])
base = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith(('BASE', 'SKID', 'ENCLOSURE_CHASSIS'))]
for o in base[:4]:
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    print('CHASSIS', o.name, 'z', round(min(p.z for p in pts), 3), round(max(p.z for p in pts), 3))
allz = []
for o in bpy.data.objects:
    if o.type == 'MESH' and not o.hide_render and 'FLOOR' not in o.name.upper():
        pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
        allz.append(min(p.z for p in pts))
print('MODEL minZ', round(min(allz), 3))
