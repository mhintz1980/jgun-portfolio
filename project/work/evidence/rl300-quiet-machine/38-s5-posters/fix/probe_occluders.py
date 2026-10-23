"""Read-only: what does POSTER_CAM_4 see first, per pixel cell, and which of those hide the proposed intake?"""
import bpy, sys, math
from mathutils import Vector
from collections import Counter

exec(open(sys.argv[sys.argv.index('--') + 1]).read().split('# --- 3. beat 4 floor')[0])   # intake + fill + liner as in fix_posters.py
sc.frame_set(584)
cam = bpy.data.objects['POSTER_CAM_4']
W, H = 960, 540
t = math.tan(cam.data.angle_y / 2); mw = cam.matrix_world; o0 = mw.translation
dg = bpy.context.evaluated_depsgraph_get()
first = Counter(); behind = Counter(); par = {}
intake = {'V2RL300-SAF-1047-5_PROPOSED_LOUVERS', 'PROPOSED_COLLECTOR_DUCT_OUTLET'}
for gy in range(0, H, 12):
    for gx in range(0, W, 12):
        d = Vector(((2 * (gx + .5) / W - 1) * t * (W / H), (1 - 2 * (gy + .5) / H) * t, -1.0))
        d = (mw.to_3x3() @ d).normalized()
        o = o0.copy(); names = []
        for _ in range(8):
            hit, loc, nor, idx, ob, _m = sc.ray_cast(dg, o, d)
            if not hit:
                break
            names.append(ob.name); par[ob.name] = ob.parent.name if ob.parent else None
            o = loc + d * 1e-4
        if names:
            first[names[0]] += 1
            if any(n in intake for n in names) and names[0] not in intake:
                for n in names[:names.index(next(n for n in names if n in intake))]:
                    behind[n] += 1
print('FIRST', len(first))
for n, c in first.most_common(14):
    print('  first', n, c, 'parent', par.get(n))
print('OCCLUDES INTAKE (hit before an intake mesh):')
for n, c in behind.most_common(30):
    print('  occ', n, c, 'parent', par.get(n))
