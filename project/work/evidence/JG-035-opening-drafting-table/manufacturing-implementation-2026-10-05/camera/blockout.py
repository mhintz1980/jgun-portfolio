"""Read-only CAD camera study. Run with Blender -b --python blockout.py.

All file output stays beside this script. No production geometry is exported.
"""
import hashlib
import json
import math
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = Path(__file__).resolve().parent
SOURCE = Path(r'C:\Projects\CAD\jgun-input-shaft-hobbed\shifted')
REPORT = json.loads((SOURCE / 'build-report.json').read_text())
DATUM = json.loads((SOURCE / 'shaft_world_matrix.json').read_text())
EXPECTED = {
    'input-shaft-assembly-parts-v1.blend': '88d1ce4ac7ca112adcd370e77852cfb9977dfec81b4bfcb61ee1872895574a89',
    'p001835-hobbed.glb': '043c9628336589c9ba0fdaa9bac1c7b240598a99dd449eb8df3da1a64ee9a428',
    'k000210-k000211-moved.glb': '17569c9a52bf662b599774ba81e2f7dc0d84e2b805707aa8ad09fff6ed454dc9',
    'p000725-modified.glb': 'cc6edfefbe83e4a1ab0c55d98b80a93d588ef46debf4ec774d6881fc1660abc4',
    'build-report.json': '76fa39ccefcb67dce44a4b78a12ce2b051c84a2169422adfc55c3e1307b9c265',
    'shaft_world_matrix.json': 'c89849870eb656b6930276bfb0611ee09f7133088f0e5630acc932c2ea813195',
}
sources = []
for name, expected in EXPECTED.items():
    p = SOURCE / name
    digest = hashlib.sha256(p.read_bytes()).hexdigest()
    assert digest == expected, f'Approved source changed: {name}'
    sources.append({'path': str(p), 'bytes': p.stat().st_size, 'sha256': digest})

bpy.ops.wm.open_mainfile(filepath=str(SOURCE / 'input-shaft-assembly-parts-v1.blend'))
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.image_settings.file_format = 'PNG'
sc.render.resolution_percentage = 100
sc.render.film_transparent = False
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'OBJECT'
sc.display.shading.show_shadows = True
sc.display.shading.show_cavity = True
sc.display.shading.cavity_type = 'BOTH'
sc.display.shading.background_type = 'WORLD'
sc.world = bpy.data.worlds.new('G0 camera background')
sc.world.color = (0.018, 0.022, 0.026)
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.view_settings.exposure = 0
sc.view_settings.gamma = 1
for ob in bpy.data.objects:
    ob.hide_render = True

names = {
    'legacy_shaft': 'SHAFT_P001835_ORIG', 'shaft': 'SHAFT_P001835_HOBBED_NEW',
    'legacy_housing': 'HOUSING_P000725_ORIG', 'housing': 'housing_NEW',
    'legacy_bearing': 'BEARING_K000210_ORIG', 'bearing': 'bearing_NEW',
    'legacy_ring': 'RING_K000211_ORIG', 'ring': 'ring_NEW',
}
parts = {key: bpy.data.objects[name] for key, name in names.items()}
colors = {'shaft': (.60, .66, .72, 1), 'housing': (.22, .35, .43, 1),
          'bearing': (.65, .73, .79, 1), 'ring': (.74, .49, .18, 1)}
for key, ob in parts.items():
    ob.color = colors[key.removeprefix('legacy_')]

def points(ob):
    return np.array([tuple(ob.matrix_world @ v.co) for v in ob.data.vertices])

def census(ob):
    ob.data.calc_loop_triangles()
    p = points(ob)
    return {'name': ob.name, 'vertices': len(p), 'triangles': len(ob.data.loop_triangles),
            'materials': len(ob.data.materials), 'bounds_shaft_local_m': [p.min(0).tolist(), p.max(0).tolist()],
            'matrix_world': [list(r) for r in ob.matrix_world]}

source_census = {k: census(v) for k, v in parts.items()}
support_deltas = {}
for key in ('bearing', 'ring'):
    a, b = points(parts['legacy_' + key]), points(parts[key])
    assert a.shape == b.shape
    delta = b - a
    error = np.max(np.abs(delta - np.array([0, .00275, 0])), axis=0)
    assert error.max() < 2e-8, (key, error)
    support_deltas[key] = {'vertex_delta_mean_mm': (delta.mean(0) * 1000).tolist(),
                           'vertex_delta_max_residual_mm': (error * 1000).tolist(),
                           'extra_shift_applied': False}

def mesh(name, verts, faces, color):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    ob = bpy.data.objects.new(name, data)
    sc.collection.objects.link(ob)
    ob.color = color
    return ob

def section(ob):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.transform(ob.matrix_world)
    cut = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                               plane_co=(0, 0, 0), plane_no=(1, 0, 0), clear_outer=True)
    edges = [e for e in cut['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
    bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    data = bpy.data.meshes.new(ob.name + '_camera_section')
    bm.to_mesh(data)
    bm.free()
    result = bpy.data.objects.new(data.name, data)
    sc.collection.objects.link(result)
    result.color = ob.color
    return result

sections = {key: section(ob) for key, ob in parts.items()}

# A bounded pinion silhouette, not an authenticated involute cutter.
verts, faces = [], []
N = 20 * 8
for y in (-.0006, .0006):
    for i in range(N):
        r = .011 if i % 8 in (2, 3, 4, 5) else .00875
        phi = 2 * math.pi * i / N
        verts.append((r * math.cos(phi), y, r * math.sin(phi)))
for i in range(N):
    j = (i + 1) % N
    faces.append((i, j, j + N, i + N))
faces += [tuple(reversed(range(N))), tuple(range(N, 2 * N))]
shaper = mesh('ILLUSTRATIVE_SHAPER_20T', verts, faces, (.76, .51, .20, 1))
shaper.location = (0, .0103248584, .015)

# RH one-start worm silhouette with ten flute interruptions. Normal module 1
# is an illustrative choice, not inferred from measured tip diameter.
hob_axis = Vector((math.cos(math.asin(1 / 7)), math.sin(math.asin(1 / 7)), 0))
hob_cross = Vector((-hob_axis.y, hob_axis.x, 0))
hob_lead = math.pi * .007 * math.tan(math.asin(1 / 7))
verts, faces = [], []
ROWS, COLS = 129, 160
for i in range(ROWS):
    axial = -.008 + .016 * i / (ROWS - 1)
    for j in range(COLS):
        phi = 2 * math.pi * j / COLS
        phase = (axial / hob_lead - phi / (2 * math.pi)) % 1
        ridge = max(0, 1 - abs(phase - .5) / .18)
        r = .003 + .001 * ridge
        if j % 16 < 3:
            r = .0029
        p = hob_axis * axial + hob_cross * (r * math.cos(phi)) + Vector((0, 0, r * math.sin(phi)))
        verts.append(tuple(p))
for i in range(ROWS - 1):
    for j in range(COLS):
        k = (j + 1) % COLS
        faces.append((i * COLS + j, i * COLS + k, (i + 1) * COLS + k, (i + 1) * COLS + j))
faces += [tuple(reversed(range(COLS))), tuple(range((ROWS - 1) * COLS, ROWS * COLS))]
hob = mesh('ILLUSTRATIVE_RH_HOB_1START', verts, faces, (.76, .51, .20, 1))
hob.location = (0, .00635, .0083)

cam = bpy.data.objects.new('G0_CAMERA', bpy.data.cameras.new('G0_CAMERA'))
sc.collection.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.clip_start = .001
cam.data.clip_end = 1
sc.camera = cam

def camera_basis(direction):
    back = Vector(direction).normalized()
    right = (Vector((0, 1, 0)) - back * back.y).normalized()
    up = back.cross(right).normalized()
    return Matrix((right, up, back)).transposed()

def frame(obs, target, w, h, direction, fit_points=None):
    basis = camera_basis(direction)
    target = Vector(target)
    allp = np.vstack([points(ob) for ob in obs]) if fit_points is None else np.array(fit_points)
    local = np.array([tuple(basis.transposed() @ (Vector(p) - target)) for p in allp])
    # Center the represented action; overview fits all geometry, macros fit ROI.
    centre = (local.min(0) + local.max(0)) / 2
    target += basis @ Vector((centre[0], centre[1], 0))
    width = max(np.ptp(local[:, 0]) / .80, np.ptp(local[:, 1]) / .75 * w / h)
    cam.matrix_world = basis.to_4x4()
    cam.location = target + basis.col[2] * .20
    cam.data.ortho_scale = float(width)
    cam.data.sensor_fit = 'HORIZONTAL'
    sc.render.resolution_x, sc.render.resolution_y = w, h
    bpy.context.view_layer.update()
    return {'position_shaft_local_m': list(cam.location), 'target_shaft_local_m': list(target),
            'quaternion_wxyz': list(cam.matrix_world.to_quaternion()), 'matrix_world': [list(r) for r in cam.matrix_world],
            'projection': 'orthographic', 'horizontal_span_m': width,
            'vertical_span_m': width * h / w, 'near_m': .001, 'far_m': 1}

def rect(p, offset, w, h):
    xyz = np.array([tuple(world_to_camera_view(sc, cam, Vector(v))) for v in p])
    pixels = np.column_stack((xyz[:, 0] * w + offset[0], (1 - xyz[:, 1]) * h + offset[1]))
    return {'bounds_css_px': [pixels.min(0).tolist(), pixels.max(0).tolist()],
            'camera_depth_m': [float(xyz[:, 2].min()), float(xyz[:, 2].max())]}

def box(x0, x1, y0, y1, z0, z1):
    return [(x, y, z) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]

# Source-report face/runout anchors; these are not a mesh-measured clearance.
face_end = REPORT['y_functional_end_mm'] / 1000
exit_roi = box(-.0015, .0015, face_end - .0012, face_end + .0020, .0038, .0072)
runout_roi = box(-.0062, .0062, .0088, .0168, -.0062, .0062)
shots = [
    ('shaft-overview', [parts['legacy_shaft']], (0, .036, 0), (1, .12, .45), None),
    ('cutter-exit', [parts['legacy_shaft'], shaper], (0, face_end, .006), (1, .05, .40),
     box(-.003, .003, .006, .013, .0025, .009)),
    ('hobbing', [parts['shaft'], hob], (0, .007, .003), (1, .12, .65),
     box(-.008, .008, .001, .021, -.007, .013)),
    ('runout-withdrawn', [parts['shaft']], (0, .012, 0), (1, .08, .45), runout_roi),
    ('support-before', [sections['legacy_' + k] for k in ('shaft', 'housing', 'bearing', 'ring')],
     (0, .0185, 0), (1, 0, 0), box(-.001, .001, .008, .027, -.020, .020)),
    ('support-after', [sections[k] for k in ('shaft', 'housing', 'bearing', 'ring')],
     (0, .0185, 0), (1, 0, 0), box(-.001, .001, .008, .027, -.020, .020)),
]
layouts = {
    'desktop': {'viewport': [1440, 900], 'action_rect': [70, 150, 920, 550],
                'card_rect': [1050, 200, 330, 440], 'controls_rect': [70, 772, 1310, 64]},
    'mobile': {'viewport': [390, 844], 'action_rect': [32, 155, 326, 345],
               'card_rect': [32, 548, 326, 172], 'controls_rect': [32, 750, 326, 62]},
}
renders = []
for layout, geometry in layouts.items():
    x, y, w, h = geometry['action_rect']
    for title, visible, target, direction, fit in shots:
        for ob in bpy.data.objects:
            ob.hide_render = ob not in visible and ob != cam
        camera = frame(visible, target, w, h, direction, fit)
        path = OUT / (layout + '-' + title + '-cad.png')
        sc.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        projected = {ob.name: rect(points(ob), (x, y), w, h) for ob in visible}
        axis = rect([(0, .003175, 0), (0, .071524, 0)], (x, y), w, h)
        critical = exit_roi if title == 'cutter-exit' else runout_roi if title in ('hobbing', 'runout-withdrawn') else None
        roi = rect(critical, (x, y), w, h) if critical else None
        renders.append({'layout': layout, 'shot': title, 'camera': camera, 'cad_png': path.name,
                        'layout_css_px': geometry, 'projected_parts': projected,
                        'projected_axis': axis,
                        'critical_roi': roi, 'roi_status': 'source-report anchor, not contact/visibility proof' if roi else None,
                        'macro_crops_noncritical_geometry': fit is not None,
                        'visible_mesh_count': len(visible),
                        'visible_triangles': sum(census(ob)['triangles'] for ob in visible)})
        print('G0_RENDER', layout, title, flush=True)

registry = {
    'schema': 'jgun-g0-camera-v1', 'blender_version': bpy.app.version_string,
    'source_hashes': sources, 'source_census': source_census,
    'shaft_world_matrix_blender_m': DATUM,
    'frame': 'shaft-local Blender metres; +Y shaft axis. No GLB reimport, no exporter rotation, no displacement added.',
    'support_deltas': support_deltas, 'source_report': REPORT,
    'tool_candidates': {'shaper': {'status': 'illustrative, compatibility unresolved', 'tooth_count': 20,
        'normal_module_mm': 1, 'pitch_diameter_mm': 20, 'tip_diameter_mm': 22,
        'root_diameter_mm': 17.5, 'axial_body_thickness_mm': 1.2,
        'axis': [0, 1, 0], 'origin_m': list(shaper.location), 'mesh': census(shaper),
        'cutting_direction': '+Y toward legacy relief', 'return_direction': '-Y after +0.8mm radial relief',
        'stroke_leading_edge_y_range_mm': [2.6748584, 10.9248584],
        'signed_ratio_work_per_cutter': -2, 'work_pitch_radius_mm_illustrative': 5,
        'production_pressure_angle_profile_shift_relief_rake': 'unresolved'},
      'hob': {'status': 'illustrative, compatibility unresolved', 'starts': 1, 'hand': 'right', 'gashes': 10,
        'normal_module_mm': 1, 'pitch_diameter_mm': 7, 'tip_diameter_mm': 8,
        'body_axial_length_mm': 16, 'lead_mm': hob_lead * 1000,
        'setting_angle_deg': math.degrees(math.asin(1 / 7)), 'axis': list(hob_axis),
        'origin_m': list(hob.location), 'mesh': census(hob),
        'signed_ratio_work_per_hob': -.1,
        'axial_feed_direction': '+Y', 'withdrawal_direction': '+Z',
        'production_pressure_angle_rake_profile_toolholder': 'unresolved'}},
    'clearance': {'status': 'UNRESOLVED: blocks machining choreography acceptance',
        'complete_represented_swept_minimum_separation_mm': None,
        'combined_measurement_export_uncertainty_mm': None,
        'reason': 'No validated cutter profile/engagement/path or continuous sweep/neighbour test; source report construction sweep is not a physical rotary hob.',
        'cropping_is_clearance_evidence': False},
    'candidate_sweep_bounds': {
        'status': 'conservative analytic outer hull of the complete represented props; not a separation test',
        'shaper': {'centre_z_range_mm': [15, 18], 'centre_y_range_mm': [2.0748584, 10.3248584],
                   'full_rotation_hull_bounds_mm': [[-11, 1.4748584, 4], [11, 10.9248584, 29]],
                   'represented_components': 'pinion body only; holder/spindle unresolved'},
        'hob': {'centre_y_range_mm': [3.1748584, 9.5248584], 'centre_z_range_mm': [8.3, 20],
                'radial_extent_mm': 4, 'half_body_length_mm': 8,
                'full_rotation_hull_bounds_mm': [
                    [-8 * hob_axis.x - 4 * abs(hob_axis.y), 3.1748584 - 8 * hob_axis.y - 4 * abs(hob_axis.x), 4.3],
                    [8 * hob_axis.x + 4 * abs(hob_axis.y), 9.5248584 + 8 * hob_axis.y + 4 * abs(hob_axis.x), 24]],
                'represented_components': 'fluted threaded body only; arbor/holder unresolved',
                'feed_end_datum': 'illustrative tool-centre position; NOT source arc endpoint or approved production feed'}},
    'budgets': {'shaft_bundle_target_bytes': 2097152, 'shaft_full_target_triangles': 50000,
                'shaft_lite_target_triangles': 15000, 'added_runtime_calls_target': 25,
                'runtime_draw_calls': None, 'gpu_frame_timing': None, 'compressed_bundle_bytes': None,
                'status': 'source census only; no runtime bundle or performance claim'},
    'renders': renders,
    'geometry_worker_files_at_capture': [str(p.relative_to(OUT.parent)) for p in (OUT.parent / 'geometry').glob('*.json')],
}
(OUT / 'blockout.json').write_text(json.dumps(registry, indent=2) + '\n', encoding='utf-8')
print('G0_CAMERA_JSON', str(OUT / 'blockout.json'), flush=True)
