"""Debug: does the rebuilt intake survive the boolean cut at frame 584, and where is it?  (in-memory only)"""
import bpy, sys
from mathutils import Vector

exec(open(sys.argv[sys.argv.index('--') + 1]).read().split('# --- 3. beat 4 floor')[0])   # run sections 1-2 of fix_posters.py
sc.frame_set(584)
dg = bpy.context.evaluated_depsgraph_get()
for n in ('V2RL300-SAF-1047-5_PROPOSED_LOUVERS', 'PROPOSED_COLLECTOR_DUCT_OUTLET'):
    o = bpy.data.objects[n]
    e = o.evaluated_get(dg)
    me = e.to_mesh()
    pts = [e.matrix_world @ v.co for v in me.vertices]
    print('EVAL', n, 'src verts', len(o.data.vertices), 'eval verts', len(me.vertices), 'polys', len(me.polygons),
          'bbox', [round(min(p[i] for p in pts), 3) for i in range(3)] if pts else None, [round(max(p[i] for p in pts), 3) for i in range(3)] if pts else None,
          'hide_render', o.hide_render)
    e.to_mesh_clear()
p = bpy.data.objects['SECTION_PLANE']
print('PLANE x', round(p.matrix_world.translation.x, 3), 'cutter world x', round(bpy.data.objects['PROPOSED_CUTTER'].matrix_world.translation.x, 3))
# what is around the intake volume?
lo = Vector((-0.45, -0.95, 0.0)); hi = Vector((0.45, 0.5, 0.6))
for o in bpy.data.objects:
    if o.type != 'MESH' or o.hide_render or o.name.startswith(('PROPOSED', 'V2RL300-SAF-1047-5_PROPOSED')):
        continue
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = [min(p[i] for p in pts) for i in range(3)]; mx = [max(p[i] for p in pts) for i in range(3)]
    if all(mn[i] <= hi[i] and mx[i] >= lo[i] for i in range(3)):
        print('AROUND', o.name, [round(v, 2) for v in mn], [round(v, 2) for v in mx])
