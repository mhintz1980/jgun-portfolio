"""Read-only: objects whose world bbox intersects the band volume above the hex mesh on the -y face."""
import bpy
from mathutils import Vector

assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
sc = bpy.context.scene
sc.frame_set(581)
lo = Vector((-0.65, -1.40, 1.50)); hi = Vector((0.65, -1.15, 1.90))
rows = []
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p[i] for p in pts) for i in range(3))); mx = Vector((max(p[i] for p in pts) for i in range(3)))
    if all(mn[i] <= hi[i] and mx[i] >= lo[i] for i in range(3)):
        rows.append((o.name, o.parent.name if o.parent else None, [round(v, 3) for v in mn], [round(v, 3) for v in mx],
                     [s.material.name if s.material else None for s in o.material_slots], o.hide_render, len(o.data.polygons)))
for r in sorted(rows, key=lambda r: r[2][1]):
    print('NEAR', r)
print('COUNT', len(rows))
