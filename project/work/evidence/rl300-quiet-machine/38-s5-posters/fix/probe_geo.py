"""Read-only: geometry of the skin above the hex mesh (world coords)."""
import bpy, math
from mathutils import Vector
from collections import Counter

assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
o = bpy.data.objects['G2RL300-SAF-1003-2']
mw = o.matrix_world
m = o.data
vs = [mw @ v.co for v in m.vertices]
# outer-face vertices (y close to the min) vs everything else, by z band
for z0 in (1.30, 1.40, 1.50, 1.58, 1.62, 1.66, 1.70, 1.75, 1.80):
    sel = [v for v in vs if z0 <= v.z < z0 + 0.05 and abs(v.x) < 0.66]
    if sel:
        c = Counter(round(v.y, 3) for v in sel)
        print('Z', z0, 'n', len(sel), 'y-hist', sorted(c.items())[:8])
# polygons whose centre lies in the band and whose world normal is not -y
cnt = Counter()
for p in m.polygons:
    c = mw @ p.center
    if 1.58 <= c.z <= 1.86 and abs(c.x) < 0.66:
        n = (mw.to_3x3() @ p.normal).normalized()
        cnt[(round(n.x, 2), round(n.y, 2), round(n.z, 2))] += 1
print('NORMALS in band', cnt.most_common(8))
# custom normal vs face normal deviation inside the band
if m.has_custom_normals:
    worst = 0.0; hits = 0
    for p in m.polygons:
        c = mw @ p.center
        if 1.58 <= c.z <= 1.86 and abs(c.x) < 0.66:
            for li in p.loop_indices:
                ln = m.loops[li].normal
                a = math.degrees(ln.angle(p.normal))
                if a > 3:
                    hits += 1
                worst = max(worst, a)
    print('CUSTOM-vs-FACE worst deg', round(worst, 1), 'loops over 3deg', hits)
