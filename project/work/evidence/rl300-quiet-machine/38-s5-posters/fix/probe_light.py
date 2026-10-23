"""Read-only: REVEAL_FILL extents vs the enclosure skin."""
import bpy
from mathutils import Vector

assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
sc = bpy.context.scene
for f in (581, 582, 583, 587):
    sc.frame_set(f)
    L = bpy.data.objects['REVEAL_FILL']
    d = L.data
    mw = L.matrix_world
    corners = []
    sx = d.size / 2
    sy = (d.size_y if d.shape in ('RECTANGLE', 'ELLIPSE') else d.size) / 2
    for a in (-1, 1):
        for b in (-1, 1):
            corners.append(mw @ Vector((a * sx, b * sy, 0)))
    print('FILL f', f, 'shape', d.shape, 'size', round(d.size, 3), round(d.size_y, 3), 'energy', round(d.energy, 1),
          'loc', [round(v, 3) for v in mw.translation], 'euler', [round(v, 3) for v in mw.to_euler()],
          'scale', [round(v, 3) for v in mw.to_scale()], 'spread', round(d.spread, 3),
          'normal', [round(v, 3) for v in (mw.to_3x3() @ Vector((0, 0, -1)))])
    print('   corners', [[round(v, 2) for v in c] for c in corners])
    print('   anim', bool(L.animation_data and L.animation_data.action), 'parent', L.parent.name if L.parent else None,
          'visible_camera', L.visible_camera, 'cast_shadow', d.use_shadow, 'cycles', getattr(d, 'cycles', None) and getattr(d.cycles, 'cast_shadow', None))
