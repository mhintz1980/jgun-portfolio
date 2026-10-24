"""Build the 7 S5 poster views into the SCRATCH copy of the V16 blend (never the master).

blender -b <scratch blend> --python build_posters.py -- <shots.json> <policy.json> <report.json>

Cut method: the blend's own shader clip (SECTION_PLANE empty + *__SECTION materials, with caps).
The clip removes SECTION_PLANE-local x > 0, i.e. keeps world x <= plane.x, which is the page's
"keep x <= plane.constant". Plane x is keyed per poster frame (constant interpolation, no yaw).
glTF (x, y, z) -> blend (x, -z, y), verified against 30 named parts (see report).
"""
import bpy, json, sys, math
from mathutils import Vector

shots_f, policy_f, report_f = sys.argv[sys.argv.index('--') + 1:][:3]
shots = json.load(open(shots_f))
policy = json.load(open(policy_f))
sc = bpy.context.scene
assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend'), bpy.data.filepath

F0 = 581  # poster k renders at frame F0 + k - 1: after the reveal lights/world have finished, doors closed (== frame 301)


def fcs(action):
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                out.extend(cb.fcurves)
    return out


def constant(obj):
    if obj.animation_data and obj.animation_data.action:
        for fc in fcs(obj.animation_data.action):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT'


def to_blend(v):
    return Vector((v[0], -v[2], v[1]))


frames = [F0 + i for i in range(7)]

# 1. markers: drop the authored ones (they would win the scene camera), add one per poster.
for m in list(sc.timeline_markers):
    sc.timeline_markers.remove(m)
cams = []
col = sc.collection
for i, s in enumerate(shots):
    name = f'POSTER_CAM_{i + 1}'
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    cd = bpy.data.cameras.new(name)
    cd.sensor_fit = 'VERTICAL'
    cd.angle_y = math.radians(s['fov'])
    cd.clip_start, cd.clip_end = 0.02, 100.0
    co = bpy.data.objects.new(name, cd)
    col.objects.link(co)
    loc = to_blend(s['position'])
    tgt = to_blend(s['target'])
    co.location = loc
    co.rotation_mode = 'QUATERNION'
    co.rotation_quaternion = (tgt - loc).to_track_quat('-Z', 'Y')
    co['poster_beat'] = s['beat']
    co['poster_u'] = s['u']
    cams.append(co)
    mk = sc.timeline_markers.new(f'POSTER_{i + 1}', frame=frames[i])
    mk.camera = co

# 2. SECTION_PLANE: replace the authored (yawed, 600-frame) action with one constant key per poster frame.
plane = bpy.data.objects['SECTION_PLANE']
plane.animation_data_clear()
plane.rotation_mode = 'XYZ'
for s, f in zip(shots, frames):
    plane.location = (s['plane'], 0.0, 0.0)
    plane.rotation_euler = (0.0, 0.0, 0.0)
    plane.keyframe_insert('location', frame=f)
    plane.keyframe_insert('rotation_euler', frame=f)
constant(plane)

# 3. Page rulings the shader clip does not carry: PART_POLICY 'hide' / 'delete' parts.
#    Hidden when the part's centre is beyond the plane (the page clips it away), always for 'delete',
#    and always when the page removes it outright (bbox min x <= -0.15, the deepest cut).
def mesh_desc(o):
    r = [o] if o.type == 'MESH' else []
    r += [c for c in o.children_recursive if c.type == 'MESH']
    return r


ruled = []
for p in policy:
    if p['policy'] not in ('hide', 'delete'):
        continue
    o = bpy.data.objects.get(p['name'])
    if o is None:
        ruled.append({'name': p['name'], 'policy': p['policy'], 'present': False})
        continue
    ms = mesh_desc(o)
    xs = [(m.matrix_world @ Vector(c)).x for m in ms for c in m.bound_box]
    lo, hi = min(xs), max(xs)
    centre = (lo + hi) / 2
    hidden_by_frame = []
    for s in shots:
        h = p['policy'] == 'delete' or lo <= -0.15 or centre > s['plane']
        hidden_by_frame.append(h)
    for m in ms:
        for h, f in zip(hidden_by_frame, frames):
            m.hide_render = h
            m.keyframe_insert('hide_render', frame=f)
        constant(m)
    ruled.append({'name': p['name'], 'policy': p['policy'], 'present': True, 'meshes': len(ms), 'xmin': round(lo, 3), 'xmax': round(hi, 3), 'hidden': hidden_by_frame})

# 4. Beat 4's camera sits below z=0, under REVEAL_FLOOR (12 m plane at z=-0.002): hide the floor on that frame only.
floor = bpy.data.objects['REVEAL_FLOOR']
for s, f in zip(shots, frames):
    floor.hide_render = (s['position'][1] < 0.0)  # glTF y < 0 == below the floor
    floor.keyframe_insert('hide_render', frame=f)
constant(floor)

# 5. Scene: render range, engine (the manifest also sets these on the worker).
sc.frame_start, sc.frame_end = frames[0], frames[-1]
sc.render.engine = 'CYCLES'
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.cycles.samples = 96
sc.cycles.use_denoising = True
sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.frame_set(frames[0])
sc.camera = cams[0]
bpy.ops.wm.save_mainfile()

# 6. Sanity table (reloaded state, via frame_set exactly as the worker does).
rep = {'frames': frames, 'rows': [], 'ruled': ruled}
d301 = None
bpy.context.scene.frame_set(301)
doors = [o for o in bpy.data.objects if o.name.startswith('DOOR_PIVOT_')] + [bpy.data.objects['STD-LBAP-4001-1']]
snap = lambda: [[round(v, 4) for r in o.matrix_world for v in r] for o in doors]
d301 = snap()
wn = [n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND']
for s, f in zip(shots, frames):
    sc.frame_set(f)
    cam = sc.camera
    rep['rows'].append({
        'beat': s['beat'], 'frame': f, 'camera': cam.name,
        'cam_loc': [round(v, 3) for v in cam.matrix_world.translation],
        'cam_fov_v': round(math.degrees(cam.data.angle_y), 2),
        'plane_x': round(plane.matrix_world.translation.x, 3), 'plane_yaw': round(plane.matrix_world.to_euler().z, 4),
        'floor_hidden': floor.hide_render,
        'lights': {l.name: round(l.energy, 1) for l in bpy.data.lights if l.name.startswith('REVEAL') or l.name == 'Light'},
        'world_strength': [round(n.inputs['Strength'].default_value, 3) for n in wn],
        'doors_closed_like_301': snap() == d301,
        'lbap_hidden': bpy.data.objects['STD-LBAP-4001-1'].hide_render,
    })
json.dump(rep, open(report_f, 'w'), indent=1)
for r in rep['rows']:
    print('ROW', json.dumps(r))
