"""Build the HOBBED variant of the JGun input shaft (P001835-2) from the shaper-cut source extract.
Original: gear relief (undercut) groove left for a gear-shaper cutter chip break.
Hobbed:   groove filled to the neck diameter; 10 tooth spaces re-cut by a SWEEP: tooth-space profile translated
          straight along the shaft axis for the functional face width, then outward along an arc of the hob radius
          (lead-out), then patterned 10x around the OD.  Run: blender -b --python this.py -- [R_hob_mm] [out_dir]
Source extract is read only. Units: metres in scene.
"""
import bpy, bmesh, numpy as np, math, sys, json
import time
from pathlib import Path
from mathutils import Vector, Matrix
T0 = time.time()
def log(msg): print(f'T+{time.time()-T0:6.1f}s {msg}', flush=True)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
R_HOB = float(argv[0]) * 1e-3 if len(argv) > 0 and argv[0] != 'auto' else None
OUT = Path(argv[1]) if len(argv) > 1 else Path(r'C:\Projects\CAD\jgun-input-shaft-hobbed')
SRC = OUT / 'p001835-source-extract.glb'
FUNC_L = 0.250 * 25.4e-3          # drawing P001812: .250 functional gear length
DELTA = float(argv[3]) * 1e-3 if len(argv) > 3 else 0.0   # axial move of the bearing journal / groove / shoulder away from the gear
NECK_R = 6.074e-3                 # filler radius: the source neck beside the relief is r 6.071 mm and the gear tip r 6.083 mm
FILL_Y0 = 9.0e-3
FILL_Y1 = (11.176e-3 + DELTA + 0.2e-3) if DELTA else 11.40e-3
Y_LIM = (11.176e-3 + DELTA - 0.1e-3) if DELTA else 11.40e-3   # lead-out must finish before the journal chamfer
INFLATE = 1.004                   # cutter profile inflated ~5 um so it never shares a surface with the old flanks
NTEETH = 10
MARGIN = 0.3e-3
YC0 = 8.9e-3                      # cutter starts inside the (empty) old gap
report = {'func_len_mm': FUNC_L * 1e3}
SOLVER = argv[2] if len(argv) > 2 else 'MANIFOLD'

def import_shaft():
    for o in list(bpy.context.scene.objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=str(SRC))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.data.transform(o.matrix_world); o.matrix_world = Matrix.Identity(4)
    return o

def verts_np(o):
    m = o.matrix_world
    return np.array([tuple(m @ v.co) for v in o.data.vertices])

def slice_pts(o, y):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, y, 0), plane_no=(0, 1, 0))
    pts = np.array([(v.co.x, v.co.z) for v in res['geom_cut'] if isinstance(v, bmesh.types.BMVert)]).reshape(-1, 2)
    bm.free(); return pts

def make_obj(name, bm, mat):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    if mat: me.materials.append(mat)
    return ob

def boolean(target, tool, op):
    bpy.context.view_layer.objects.active = target
    md = target.modifiers.new('b', 'BOOLEAN'); md.operation = op; md.object = tool; md.solver = SOLVER
    bpy.ops.object.modifier_apply(modifier=md.name)
    log(f'boolean {op} done')

def stats(o):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    nm = sum(1 for e in bm.edges if not e.is_manifold)
    vol = bm.calc_volume(signed=True); v = len(bm.verts); f = len(bm.faces); bm.free()
    return {'verts': v, 'faces': f, 'non_manifold_edges': nm, 'volume_mm3': vol * 1e9}

shaft = import_shaft(); shaft.name = 'INPUT_SHAFT_P001835_HOBBED'
_bm = bmesh.new(); _bm.from_mesh(shaft.data); _n0 = len(_bm.verts)
bmesh.ops.remove_doubles(_bm, verts=_bm.verts[:], dist=5e-6)   # Draco patches meet within ~1 um; welding makes the solid closed
_open = [e for e in _bm.edges if not e.is_manifold]
if _open:
    bmesh.ops.holes_fill(_bm, edges=_open, sides=8)
bmesh.ops.recalc_face_normals(_bm, faces=_bm.faces[:])
_bm.to_mesh(shaft.data); _bm.free()
log(f'imported; welded {_n0} -> {len(shaft.data.vertices)} verts')
mat0 = shaft.data.materials[0] if shaft.data.materials else None
if DELTA:
    _n = len(shaft.data.vertices); _co = np.empty(_n * 3, dtype=np.float32); shaft.data.vertices.foreach_get('co', _co); _co = _co.reshape(-1, 3)
    _y = _co[:, 1] * 1e3; _r = np.hypot(_co[:, 0], _co[:, 2]) * 1e3
    _mv = ((_y >= 11.425) & (_y <= 16.99)) | ((np.abs(_y - 11.176) < 0.003) & (_r > 6.0))
    _co[_mv, 1] += DELTA
    shaft.data.vertices.foreach_set('co', _co.reshape(-1)); shaft.data.update()
    report['journal_shift_mm'] = DELTA * 1e3; report['journal_vertices_moved'] = int(_mv.sum())
    log(f'journal rings shifted {DELTA*1e3} mm, verts {int(_mv.sum())}')
report['materials'] = len(shaft.data.materials)
P = verts_np(shaft); yv = P[:, 1]; rv = np.hypot(P[:, 0], P[:, 2])
Y_FACE = float(yv[rv > 2.5e-3].min()); Y_B = Y_FACE + FUNC_L
report.update({'y_face_mm': Y_FACE * 1e3, 'y_functional_end_mm': Y_B * 1e3})
orig_stats = stats(shaft); report['source'] = orig_stats

# ---- outline of ONE tooth space (gap centred on +X) from the real gear cross-section --------------------------------
ys = 0.5 * (Y_FACE + Y_B)
pts = slice_pts(shaft, ys)
th = np.arctan2(pts[:, 1], pts[:, 0]); rr = np.hypot(pts[:, 0], pts[:, 1])
sel = (np.abs(th) < math.radians(16)) & (rr > 3e-3)
pts, th, rr = pts[sel], th[sel], rr[sel]
order = np.argsort(th); pts, th, rr = pts[order], th[order], rr[order]
keep = [0]
for i in range(1, len(pts)):
    if np.hypot(*(pts[i] - pts[keep[-1]])) > 1e-8: keep.append(i)
pts, th, rr = pts[keep], th[keep], rr[keep]
TIP, ROOT = float(rr.max()), float(rr.min())
inside = np.where(rr < TIP - 2e-6)[0]
i0, i1 = max(inside[0] - 1, 0), min(inside[-1] + 1, len(pts) - 1)
outline = pts[i0:i1 + 1]
def extend(p_prev, p_end, length=1.6e-3):
    d = p_end - p_prev; d /= np.linalg.norm(d); return p_end + d * length
poly = np.vstack([extend(outline[1], outline[0]), outline, extend(outline[-2], outline[-1])])
poly = np.vstack([poly[0] if False else poly])  # keep order: left_ext(-), outline..., right_ext(+)
c = poly.mean(0); poly = c + (poly - c) * INFLATE
report.update({'tip_r_mm': TIP * 1e3, 'root_r_mm': ROOT * 1e3, 'gap_outline_pts': int(len(outline)),
               'gap_half_angle_deg_at_tip': float(np.degrees(abs(th[i0 + 1])))})
H = NECK_R - ROOT
if R_HOB is None:                 # largest hob radius whose lead-out finishes by Y_LIM
    d_ = H + MARGIN; run_ = Y_LIM - Y_B; R_HOB = (run_ ** 2 + d_ ** 2) / (2 * d_)
report['R_hob_mm'] = R_HOB * 1e3
cosmax = 1 - (H + MARGIN) / R_HOB
phimax = math.acos(cosmax); RUN = R_HOB * math.sin(phimax)
Y_END = Y_B + RUN
report.update({'gap_depth_to_neck_mm': H * 1e3, 'leadout_run_mm': RUN * 1e3, 'leadout_end_y_mm': Y_END * 1e3})
if Y_END > 16.4e-3: raise RuntimeError(f'Lead-out ends at y={Y_END*1e3:.2f} mm; it would reach the bearing-shoulder fillet (16.57 mm). Reduce R_hob.')

# sweep path: straight (functional length) then arc of radius R_hob curving outward
path = [(0.0, YC0), (0.0, Y_B)]
for phi in np.linspace(0, phimax, 61)[1:]:
    path.append((R_HOB * (1 - math.cos(phi)), Y_B + R_HOB * math.sin(phi)))
def sweep_bm(angle):
    bm = bmesh.new(); M = len(poly); ca, sa = math.cos(angle), math.sin(angle); rings = []
    for dx, y in path:
        ring = []
        for (px, pz) in poly:
            x, z = px + dx, pz
            ring.append(bm.verts.new((x * ca - z * sa, y, x * sa + z * ca)))
        rings.append(ring)
    for a, b in zip(rings[:-1], rings[1:]):
        for j in range(M):
            k = (j + 1) % M; bm.faces.new((a[j], a[k], b[k], b[j]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    if bm.calc_volume(signed=True) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    return bm

# ---- 1) fill the relief groove with a plain neck cylinder ----------------------------------------------------------------
bpy.ops.mesh.primitive_cylinder_add(vertices=256, radius=NECK_R, depth=FILL_Y1 - FILL_Y0,
        location=(0, 0.5 * (FILL_Y0 + FILL_Y1), 0), rotation=(math.pi / 2, 0, 0))
filler = bpy.context.active_object; filler.name = 'FILL'
boolean(shaft, filler, 'UNION'); bpy.data.objects.remove(filler, do_unlink=True)
report['after_fill'] = stats(shaft)
# ---- 2) hob-sweep cut, patterned around the OD -----------------------------------------------------------------------------
for k in range(NTEETH):
    cutter = make_obj(f'HOBCUT_{k}', sweep_bm(2 * math.pi * k / NTEETH), mat0)
    if k == 0: report['cutter_stats'] = stats(cutter)
    before = len(shaft.data.polygons)
    boolean(shaft, cutter, 'DIFFERENCE'); bpy.data.objects.remove(cutter, do_unlink=True)
    log(f'tooth space {k}: faces {before} -> {len(shaft.data.polygons)}')
    if len(shaft.data.polygons) == 0: raise RuntimeError('Boolean emptied the shaft')
report['hobbed'] = stats(shaft)

# ---- verification: gap floor against analytic path, tooth-form unchanged on the functional face ---------------------
checks = []
for yy in (6.0e-3, 9.2e-3, 9.6e-3, 10.0e-3, 11.0e-3, 12.0e-3, 13.5e-3, 15.0e-3, 16.0e-3):
    s = slice_pts(shaft, yy)
    if len(s) == 0:
        checks.append({'y_mm': yy * 1e3, 'empty_slice': True}); continue
    t = np.arctan2(s[:, 1], s[:, 0]); r = np.hypot(s[:, 0], s[:, 1])
    near = np.abs(t) < math.radians(1.0)
    floor = float(r[near].min()) if near.any() else None
    dy = yy - Y_B
    exp = ROOT if dy <= 0 else ROOT + (R_HOB - math.sqrt(max(R_HOB ** 2 - dy ** 2, 0)))
    checks.append({'y_mm': yy * 1e3, 'gap_floor_r_mm': None if floor is None else floor * 1e3, 'expected_mm': min(exp, NECK_R) * 1e3,
                   'rmax_mm': float(r.max()) * 1e3})
report['gap_floor_checks'] = checks
src_pts = slice_pts(shaft, 6.0e-3); report['hobbed_y6_pts'] = int(len(src_pts))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'input-shaft-hobbed-v1.blend'))
bpy.ops.object.select_all(action='DESELECT'); shaft.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT / 'p001835-hobbed.glb'), use_selection=True, export_apply=True)
(OUT / 'build-report.json').write_text(json.dumps(report, indent=2))
print('REPORT', json.dumps(report))

