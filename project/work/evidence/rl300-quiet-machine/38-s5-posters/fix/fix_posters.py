"""S5 follow-up on the SCRATCH V16 blend (never the master).

  1. REVEAL_FILL (interior 1.1 x 2.6 m area light at z=1.72) poked 45 mm out of the -y inlet face (y=-1.355)
     and lit a glow band above the hex mesh on every beat that sees that face. Pull its -y end in to y=-1.2.
  2. PROPOSED_LOWER_INTAKE is absent from the V16 blend (the page skips the GLB node and builds the group
     procedurally in LowerIntake.tsx). Rebuild that group here from the same boxes, sectioned by SECTION_PLANE
     with a boolean cutter parented to it (keeps x <= plane, like the page).
  3. Beat 4 (frame 584): the page eye sits below the V16 floor; drop the floor under it instead of hiding it.

blender -b <scratch blend> --python fix_posters.py -- [--save] [--render <outdir> <w> <h> <spp> <f,f,...>] [--camB <out.png>]
"""
import bpy, bmesh, sys, math, os, time
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend'), bpy.data.filepath
sc = bpy.context.scene
FRAMES = list(range(581, 588))


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


def srgb_to_linear(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c] + [1.0]


# --- 1. fill light ------------------------------------------------------------------------------------
fill = bpy.data.objects['REVEAL_FILL']
if abs(fill.data.size_y - 2.6) < 1e-6:           # idempotent: only the original 2.6 m strip is changed
    top = fill.location.y + fill.data.size_y / 2
    fill.data.size_y = top - (-1.2)
    fill.location.y = (top + (-1.2)) / 2
    print('FIX fill size_y', fill.data.size_y, 'loc.y', fill.location.y)

# --- 2. proposed lower intake -------------------------------------------------------------------------
GROUP = (0.0, 0.205, 0.03)      # glTF Y-up, LowerIntake.tsx group.position
to_blend = lambda v: Vector((v[0], -v[2], v[1]))


def build(pieces, name, mat):
    bm = bmesh.new()
    for size, pos, ang in pieces:
        pg = (pos[0] + GROUP[0], pos[1] + GROUP[1], pos[2] + GROUP[2])
        r = bmesh.ops.create_cube(bm, size=1.0)
        m = Matrix.Translation(to_blend(pg)) @ Matrix.Rotation(ang, 4, 'X') @ Matrix.Diagonal((size[0], size[2], size[1], 1.0))
        bmesh.ops.transform(bm, matrix=m, verts=r['verts'])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def principled(name, hexcol, metallic, rough, emis_hex=None, emis=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb_to_linear(hexcol)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if emis_hex:
        b.inputs['Emission Color'].default_value = srgb_to_linear(emis_hex)
        b.inputs['Emission Strength'].default_value = emis
    return m


if 'V2RL300-SAF-1047-5_PROPOSED_LOUVERS' not in bpy.data.objects:
    metal = principled('PROPOSED_INTAKE_METAL', '#6e97ad', 0.65, 0.32)
    dark = principled('PROPOSED_INTAKE_DUCT', '#376279', 0.4, 0.44, '#163d4e', 0.35)
    LY = -0.033
    louv = [([.756, .018, .028], [0, LY, .462], 0), ([.756, .018, .028], [0, LY, .733], 0),
            ([.028, .018, .271], [-.364, LY, .5975], 0), ([.028, .018, .271], [.364, LY, .5975], 0)]
    louv += [([.70, .008, .042], [0, LY, .505 + i * .061], -math.pi / 7) for i in range(4)]
    duct = [([.012, .16, .245], [-.32, .06, .5975], 0), ([.012, .16, .245], [.32, .06, .5975], 0),
            ([.65, .16, .012], [0, .06, .714], 0), ([.42, .012, .92], [0, -.015, .13], 0),
            ([.012, .15, .92], [-.21, .06, .13], 0), ([.42, .012, .62], [0, .135, .28], 0),
            ([.012, .31, .27], [-.21, .14, -.32], 0), ([.42, .31, .012], [0, .14, -.45], 0)]
    objs = [build(louv, 'V2RL300-SAF-1047-5_PROPOSED_LOUVERS', metal), build(duct, 'PROPOSED_COLLECTOR_DUCT_OUTLET', dark)]
    plane = bpy.data.objects['SECTION_PLANE']
    cm = bpy.data.meshes.new('PROPOSED_CUTTER')
    bm = bmesh.new()
    r = bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Diagonal((6.0, 6.0, 6.0, 1.0)), verts=r['verts'])
    bm.to_mesh(cm); bm.free()
    cutter = bpy.data.objects.new('PROPOSED_CUTTER', cm)
    sc.collection.objects.link(cutter)
    cutter.parent = plane                      # SECTION_PLANE is keyed per frame (x = plane, no yaw)
    cutter.location = (3.0, 0.0, 0.0)          # world x spans plane .. plane + 6: removes everything past the plane
    cutter.hide_render = True
    cutter.hide_viewport = True
    for ob in objs:
        mod = ob.modifiers.new('SECTION_CUT', 'BOOLEAN')
        mod.operation = 'DIFFERENCE'
        mod.operand_type = 'OBJECT'
        mod.object = cutter
        mod.solver = 'EXACT'
        mod.use_self = True
    print('FIX proposed intake built', [o.name for o in objs])

# --- 2b. the registered liner the proposed louvers replace (prepareModel.ts LINER_PART) is not built on the page
liner = bpy.data.objects.get('V2RL300-SAF-1047-5')
if liner is not None:
    for m in [liner] + [c for c in liner.children_recursive]:
        if m.type == 'MESH':
            m.animation_data_clear()
            m.hide_render = True
    print('FIX liner hidden', liner.name)

# --- 2c. beat 4 cutaway (owner ruling 2026-10-12, option b): the skid members that sit between the page's
#         under-floor eye and the proposed intake are hidden on frame 584 only.
CUTAWAY = ['V2RLP-SK-4000-A-2', 'V2FTA-FP-46-RL-1000-1', 'V2RL300-SAF-1047-3', 'V2RL200-SAF-1051-9', 'V2RL300-FTS-2003-SAFE-1']
for n in CUTAWAY:
    ob = bpy.data.objects.get(n)
    if ob is None:
        print('WARN cutaway part missing', n)
        continue
    for m in [ob] + list(ob.children_recursive):
        if m.type != 'MESH':
            continue
        m.animation_data_clear()
        for fr in FRAMES:
            m.hide_render = (fr == 584)
            m.keyframe_insert('hide_render', frame=fr)
        constant(m)
print('FIX cutaway', len(CUTAWAY), 'parts hidden on frame 584')

# --- 2d. beat 4 brightness (owner: 'brighter'): a fill light under the chassis hazed the frame (lifted blacks, and the
#         saved blend lit about 19x stronger than the same light previewed in memory), so it is removed. Instead the
#         scene exposure is keyed up on frame 584 only: -1.5 EV elsewhere, B4_EXPOSURE (default -0.8) on 584.
lo = bpy.data.objects.get('POSTER_B4_FILL')
if lo is not None:
    ld = lo.data
    bpy.data.objects.remove(lo, do_unlink=True)
    bpy.data.lights.remove(ld)
    print('FIX b4 fill light removed')
base_ev = -1.5
sc.view_settings.exposure = base_ev
if sc.animation_data:
    sc.animation_data_clear()
b4_ev = float(os.environ.get('B4_EXPOSURE', '-0.8'))
for fr in FRAMES:
    sc.view_settings.exposure = b4_ev if fr == 584 else base_ev
    sc.keyframe_insert('view_settings.exposure', frame=fr)
constant(sc)
print('FIX b4 exposure', b4_ev, 'on 584; others', base_ev)

# --- 3. beat 4 floor ----------------------------------------------------------------------------------
floor = bpy.data.objects['REVEAL_FLOOR']
for f in FRAMES:
    floor.hide_render = False
    floor.keyframe_insert('hide_render', frame=f)
    floor.location.z = -0.30 if f == 584 else -0.002
    floor.keyframe_insert('location', index=2, frame=f)
constant(floor)

# --- outputs ------------------------------------------------------------------------------------------
def render_setup(w, h, spp):
    cy = sc.cycles
    sc.render.engine = 'CYCLES'
    cy.device = 'CPU'
    cy.samples = spp
    cy.use_adaptive_sampling = True
    cy.use_denoising = True
    cy.denoiser = 'OPENIMAGEDENOISE'
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.use_border = False
    sc.render.image_settings.file_format = 'PNG'
    sc.render.use_motion_blur = False


if '--render' in args:
    i = args.index('--render')
    outdir, w, h, spp, frames = args[i + 1], int(args[i + 2]), int(args[i + 3]), int(args[i + 4]), [int(x) for x in args[i + 5].split(',')]
    render_setup(w, h, spp)
    os.makedirs(outdir, exist_ok=True)
    for f in frames:
        t0 = time.time()
        sc.frame_set(f)
        sc.render.filepath = os.path.join(outdir, f'poster-f{f}.png')
        bpy.ops.render.render(write_still=True)
        print('RENDER', f, sc.camera.name, round(time.time() - t0, 1), 's', flush=True)

if '--camB' in args:
    outp = args[args.index('--camB') + 1]
    render_setup(960, 540, 24)
    # C: eye 2 cm above the floor, inside the skid bay line (x .62), wide lens, looking at the louvers
    cd = bpy.data.cameras.new('POSTER_CAM_4B')
    cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(55); cd.clip_start = 0.02
    cam = bpy.data.objects.new('POSTER_CAM_4B', cd)
    sc.collection.objects.link(cam)
    loc = Vector((0.62, -1.15, 0.02)); tgt = Vector((-0.1, -0.62, 0.17))
    cam.location = loc
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (tgt - loc).to_track_quat('-Z', 'Y')
    floor.animation_data_clear()
    floor.hide_render = False
    floor.location.z = -0.002
    sc.frame_set(584)
    sc.camera = cam
    sc.render.filepath = outp
    bpy.ops.render.render(write_still=True)
    print('RENDER camB done', flush=True)

if '--save' in args:
    # the scratch blend carries the page's cameras; nothing else changes
    sc.frame_set(581)
    sc.camera = bpy.data.objects['POSTER_CAM_1']
    bpy.ops.wm.save_mainfile()
    print('SAVED', bpy.data.filepath, flush=True)
