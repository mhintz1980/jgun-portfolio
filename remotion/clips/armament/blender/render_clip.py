"""Armament clip renderer: line pass (Freestyle ink on white) and shaded pass (matte clay on transparent).

Usage (Blender 5.2.x):
  blender -b --factory-startup --python render_clip.py -- \
      --glb <model.glb> --out <prefix> --angles 0,2,4 [--pass line|shade|both] \
      [--engine workbench|cycles] [--width 1920] [--contour-only] [--max-elev 10]

Output files: <prefix>-<pass>-<angle:03d>.png
- line pass : opaque white fill, ink lines. Composite with mix-blend-mode: multiply.
- shade pass: transparent background, matte shaded model (no lines).
Camera: muzzle-right profile at angle 0 (elevation 0), rising to --max-elev deg at 180 and back to 0 at 360.
"""
import argparse
import math
import sys

import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
ap = argparse.ArgumentParser()
ap.add_argument("--glb", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--angles", required=True)
ap.add_argument("--pass", dest="which", default="both", choices=["line", "shade", "both"])
ap.add_argument("--engine", default="workbench", choices=["workbench", "cycles"])
ap.add_argument("--width", type=int, default=1920)
ap.add_argument("--contour-only", action="store_true")
ap.add_argument("--max-elev", type=float, default=10.0)
ap.add_argument("--samples", type=int, default=24)
args = ap.parse_args(argv)
angles = [float(a) for a in args.angles.split(",") if a != ""]

INK = (0.07, 0.08, 0.09)
CLAY = (0.80, 0.78, 0.74, 1.0)

bpy.ops.wm.read_factory_settings(use_empty=True)
assert bpy.ops.import_scene.gltf(filepath=args.glb) == {"FINISHED"}
sc = bpy.context.scene
vl = bpy.context.view_layer

meshes = [o for o in sc.objects if o.type == "MESH"]
lo = Vector((1e9,) * 3)
hi = Vector((-1e9,) * 3)
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        lo = Vector(map(min, lo, w))
        hi = Vector(map(max, hi, w))
dims = hi - lo
centre = (lo + hi) / 2
thin, mid, long_ = sorted(range(3), key=lambda i: dims[i])
ax = lambda i, s=1: Vector([s if k == i else 0 for k in range(3)])

pivot = bpy.data.objects.new("pivot", None)
sc.collection.objects.link(pivot)
pivot.location = centre
for o in [o for o in sc.objects if o.parent is None and o is not pivot]:
    mw = o.matrix_world.copy()
    o.parent = pivot
    o.matrix_world = mw
bpy.context.view_layer.update()

sc.render.resolution_x = args.width
sc.render.resolution_y = round(args.width * 9 / 16)
sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "Standard"
sc.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("c")
cd.lens = 70
cd.clip_start = 1e-3
cd.clip_end = 1e5
cam = bpy.data.objects.new("c", cd)
sc.collection.objects.link(cam)
sc.camera = cam
hfov = 2 * math.atan(18 / cd.lens)
dist = (dims[long_] * 1.22 / 2) / math.tan(hfov / 2)
view = ax(thin, 1)
up = ax(mid)


def place_camera(elev_deg):
    e = math.radians(elev_deg)
    pos = centre + view * dist * math.cos(e) + up * dist * math.sin(e)
    z = (pos - centre).normalized()
    x = up.cross(z).normalized()
    y = z.cross(x)
    cam.matrix_world = Matrix.Translation(pos) @ Matrix((x, y, z)).transposed().to_4x4()


def white_world():
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 1.0
    sc.world = w
    return w


def emission_override(color, strength=1.0):
    m = bpy.data.materials.new("flat")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = color
    em.inputs[1].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs[0], out.inputs[0])
    return m


def clay_override():
    m = bpy.data.materials.new("clay")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = CLAY
    b.inputs["Roughness"].default_value = 0.6
    b.inputs["Metallic"].default_value = 0.0
    return m


def setup_cycles(samples):
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = samples > 4
    sc.cycles.filter_width = 1.5


def setup_line_pass():
    sc.render.film_transparent = False
    white_world()
    vl.material_override = emission_override((1, 1, 1, 1))
    if args.engine == "cycles":
        setup_cycles(8)
        sc.cycles.use_denoising = False
    else:
        sc.render.engine = "BLENDER_WORKBENCH"
        sh = sc.display.shading
        sh.light = "FLAT"
        sh.color_type = "SINGLE"
        sh.single_color = (1, 1, 1)
        sc.world.color = (1, 1, 1)
    sc.render.use_freestyle = True
    vl.use_freestyle = True
    sc.render.line_thickness_mode = "ABSOLUTE"
    fs = vl.freestyle_settings
    fs.crease_angle = math.radians(120)  # dihedral threshold: 90 deg edges kept
    for ls in list(fs.linesets):
        fs.linesets.remove(ls)
    scale = args.width / 1920

    def lineset(name, thickness, silhouette, border, crease, ext):
        ls = fs.linesets.new(name)
        ls.select_silhouette = silhouette
        ls.select_border = border
        ls.select_crease = crease
        ls.select_external_contour = ext
        ls.select_material_boundary = False
        ls.linestyle = bpy.data.linestyles.new(name)
        ls.linestyle.color = INK
        ls.linestyle.thickness = thickness * scale
        return ls

    lineset("contour", 2.6, True, True, False, True)
    if not args.contour_only:
        lineset("detail", 1.3, False, False, True, False)


def setup_shade_pass():
    sc.render.use_freestyle = False
    vl.use_freestyle = False
    sc.render.film_transparent = True
    vl.material_override = None
    if args.engine == "cycles":
        setup_cycles(args.samples)
        w = bpy.data.worlds.new("w")
        w.use_nodes = True
        bg = w.node_tree.nodes["Background"]
        bg.inputs[0].default_value = (0.95, 0.95, 0.97, 1)
        bg.inputs[1].default_value = 0.55
        sc.world = w
        vl.material_override = clay_override()
        for o in [o for o in sc.objects if o.type == "LIGHT"]:
            bpy.data.objects.remove(o)
        sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
        sun.data.energy = 3.2
        sun.data.angle = math.radians(12)
        sc.collection.objects.link(sun)
        sun.rotation_euler = (math.radians(50), math.radians(12), math.radians(-35))
    else:
        sc.render.engine = "BLENDER_WORKBENCH"
        sc.world = bpy.data.worlds.new("w")
        sh = sc.display.shading
        sh.light = "STUDIO"
        sh.color_type = "SINGLE"
        sh.single_color = CLAY[:3]
        sh.show_cavity = True
        sh.cavity_type = "BOTH"
        sh.show_shadows = False
        sh.studiolight_intensity = 1.0
        sc.render.film_transparent = True


def render_pass(name, setup):
    setup()
    for a in angles:
        pivot.rotation_euler = [math.radians(a) if k == mid else 0 for k in range(3)]
        place_camera(args.max_elev * (1 - math.cos(math.radians(a))) / 2)
        bpy.context.view_layer.update()
        sc.render.filepath = f"{args.out}-{name}-{int(round(a)):03d}.png"
        bpy.ops.render.render(write_still=True)


if args.which in ("line", "both"):
    render_pass("line", setup_line_pass)
if args.which in ("shade", "both"):
    render_pass("shade", setup_shade_pass)
print("AGENT_OK", [round(d, 3) for d in dims], "thin/mid/long", thin, mid, long_, "engine", args.engine, "bpy", bpy.app.version_string)
