"""Read-only: map where the -y inlet face (world y ~ -1.33) lets camera rays through at beat 1."""
import bpy, sys, json, math
from mathutils import Vector

out_f = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
sc.frame_set(581)
cam = bpy.data.objects['POSTER_CAM_1']
W, H = 1920, 1080
t = math.tan(cam.data.angle_y / 2); mw = cam.matrix_world; origin = mw.translation
dg = bpy.context.evaluated_depsgraph_get()
FACE_Y = -1.3294  # outer face of G2RL300-SAF-1003-2 is at its bbox min y -1.3546; measured below
# the face plane: use the skin's own bbox min y
skin = bpy.data.objects['G2RL300-SAF-1003-2']
ys = [(skin.matrix_world @ Vector(c)).y for c in skin.bound_box]
FACE_Y = min(ys)
print('FACE_Y', FACE_Y)
grid = {}
holes = []
for py in range(200, 400, 6):
    row = ''
    for px in range(440, 760, 6):
        d = Vector(((2 * (px + .5) / W - 1) * t * (W / H), (1 - 2 * (py + .5) / H) * t, -1.0))
        d = (mw.to_3x3() @ d).normalized()
        if abs(d.y) < 1e-6:
            row += '?'; continue
        s = (FACE_Y - origin.y) / d.y
        p = origin + d * s            # point on the face plane
        hit, loc, nor, idx, ob, _m = sc.ray_cast(dg, origin, d)
        if not hit:
            row += ' '; continue
        # skin hit = first hit within 2 cm of the face-plane crossing distance
        dist = (loc - origin).length
        on_face = abs(dist - s) < 0.02
        row += 'S' if on_face else ('.' if dist < s else 'o')
        if not on_face and dist > s:
            holes.append({'px': px, 'py': py, 'x': round(p.x, 3), 'z': round(p.z, 3), 'obj': ob.name})
    print('ROW', py, row)
xs = [h['x'] for h in holes]; zs = [h['z'] for h in holes]
print('HOLES', len(holes), 'x', (min(xs), max(xs)) if xs else None, 'z', (min(zs), max(zs)) if zs else None)
from collections import Counter
print('BEHIND', Counter(h['obj'] for h in holes).most_common(6))
json.dump(holes, open(out_f, 'w'))
