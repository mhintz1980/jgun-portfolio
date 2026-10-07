"""Read-only G0 metrology. Run in Blender; writes evidence only to --out."""
import argparse
import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/geometry'
C = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()


def glb(path):
    data = path.read_bytes()
    magic, version, size = struct.unpack_from('<III', data)
    assert magic == 0x46546C67 and version == 2 and size == len(data)
    offset, doc, binary = 12, None, None
    while offset < size:
        length, kind = struct.unpack_from('<II', data, offset)
        chunk = data[offset + 8:offset + 8 + length]
        if kind == 0x4E4F534A:
            doc = json.loads(chunk)
        elif kind == 0x004E4942:
            binary = chunk
        offset += 8 + length
    return doc, binary


def coords(obj, transform=None):
    values = np.empty(len(obj.data.vertices) * 3, dtype=np.float64)
    obj.data.vertices.foreach_get('co', values)
    values = values.reshape(-1, 3)
    if transform is not None:
        mat = np.array(transform)
        values = values @ mat[:3, :3].T + mat[:3, 3]
    return values


def bounds(points):
    return {'min_mm': (points.min(0) * 1000).tolist(), 'max_mm': (points.max(0) * 1000).tolist()}


def matrix(value):
    return [list(row) for row in value]


def point_error(a, b):
    tree = KDTree(len(b))
    for i, v in enumerate(b):
        tree.insert(Vector(v), i)
    tree.balance()
    return max(tree.find(Vector(v))[2] for v in a) * 1000


def bvh(obj, transform=None):
    return BVHTree.FromPolygons([Vector(v) for v in coords(obj, transform)],
                               [list(p.vertices) for p in obj.data.polygons], all_triangles=False)


def topology(obj, weld=0):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    if weld:
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=weld)
    bm.verts.ensure_lookup_table()
    bad = [e for e in bm.edges if not e.is_manifold]
    unseen = set(bm.verts)
    components = []
    while unseen:
        stack = [unseen.pop()]
        group = []
        while stack:
            v = stack.pop()
            group.append(v)
            for edge in v.link_edges:
                other = edge.other_vert(v)
                if other in unseen:
                    unseen.remove(other)
                    stack.append(other)
        points = np.array([tuple(v.co) for v in group])
        components.append({'vertices': len(group), **bounds(points)})
    result = {'weld_tolerance_mm': weld * 1000, 'vertices': len(bm.verts), 'faces': len(bm.faces),
              'non_manifold_edges': len(bad), 'boundary_edges': sum(e.is_boundary for e in bad),
              'wire_edges': sum(e.is_wire for e in bad),
              'non_contiguous_manifold_edges': sum(e.is_manifold and not e.is_contiguous for e in bm.edges),
              'degenerate_faces_area_le_1e-18_m2': sum(f.calc_area() <= 1e-18 for f in bm.faces),
              'signed_volume_mm3': bm.calc_volume(signed=True) * 1e9,
              'component_count': len(components),
              'largest_components': sorted(components, key=lambda x: -x['vertices'])[:8],
              'defect_edges': [{'endpoints_mm': [(v.co * 1000)[:] for v in e.verts],
                                'linked_faces': len(e.link_faces)} for e in bad[:32]],
              'defect_edges_truncated': len(bad) > 32}
    bm.free()
    return result


def section(obj, y_mm):
    p = coords(obj)
    edges = np.empty(len(obj.data.edges) * 2, dtype=np.int32)
    obj.data.edges.foreach_get('vertices', edges)
    a, z = p[edges.reshape(-1, 2)[:, 0]], p[edges.reshape(-1, 2)[:, 1]]
    y = y_mm / 1000
    valid = ((a[:, 1] - y) * (z[:, 1] - y) <= 0) & (np.abs(z[:, 1] - a[:, 1]) > 1e-12)
    a, z = a[valid], z[valid]
    if not len(a):
        return {'y_mm': y_mm, 'empty': True}
    t = (y - a[:, 1]) / (z[:, 1] - a[:, 1])
    cut = a + (z - a) * t[:, None]
    r = np.hypot(cut[:, 0], cut[:, 2]) * 1000
    return {'y_mm': y_mm, 'min_r_mm': float(r.min()), 'max_r_mm': float(r.max()), 'edge_intersections': len(r)}


def radial(tree, y_mm, count=3600):
    values = []
    for i in range(count):
        angle = i * 2 * math.pi / count
        hit = tree.ray_cast(Vector((0, y_mm / 1000, 0)), Vector((math.cos(angle), 0, math.sin(angle))), 0.03)
        values.append(None if hit[0] is None else math.hypot(hit[0].x, hit[0].z) * 1000)
    assert all(v is not None for v in values), 'Incomplete gear ray profile'
    return np.array(values)


def occurrence(doc, index):
    parents = {child: i for i, n in enumerate(doc['nodes']) for child in n.get('children', [])}
    chain = [index]
    while chain[-1] in parents:
        chain.append(parents[chain[-1]])
    return [{'index': i, 'name': doc['nodes'][i].get('name'),
             'transform': {k: doc['nodes'][i][k] for k in ('matrix', 'translation', 'rotation', 'scale') if k in doc['nodes'][i]}}
            for i in reversed(chain)]


def import_meshes(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    return [o for o in bpy.data.objects if o not in before and o.type == 'MESH']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cad', type=Path, default=Path('C:/Projects/CAD/jgun-input-shaft-hobbed'))
    parser.add_argument('--out', type=Path, default=DEFAULT_OUT)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    out = args.out.resolve()
    assert out == DEFAULT_OUT.resolve() or DEFAULT_OUT.resolve() in out.parents, 'Evidence output must stay in owned geometry subtree'
    out.mkdir(parents=True, exist_ok=True)
    cad = args.cad.resolve()
    shifted = cad / 'shifted'
    baseline = ROOT / 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/approved-asset-baseline.md'
    pins = {}
    for line in baseline.read_text(encoding='utf-8').splitlines():
        cells = [v.strip() for v in line.split('|')]
        if len(cells) == 5 and len(cells[3]) == 64:
            pins[cells[1]] = (int(cells[2].replace(',', '')), cells[3])
    assert len(pins) == 6
    sources = []
    for name, (size, digest) in pins.items():
        path = shifted / name
        sources.append({'path': str(path), 'bytes': path.stat().st_size, 'sha256': sha(path),
                        'baseline_sha256': digest, 'baseline_match': path.stat().st_size == size and sha(path) == digest})
    extra = [ROOT / 'public/models/Default.glb', cad / 'p001835-source-extract.glb', shifted / 'p001835-source-extract.glb',
             shifted / 'input-shaft-hobbed-v1.blend',
             cad / 'build_hobbed_input_shaft.py', cad / 'extract_p001835.py', shifted / 'assembly_shift.py',
             ROOT / 'src/scene/rig/nodeRoles.ts', ROOT / 'src/scene/TorqueWrenchHero.tsx', Path(__file__), baseline]
    sources.extend({'path': str(p), 'bytes': p.stat().st_size, 'sha256': sha(p)} for p in extra)
    assert all(s.get('baseline_match', True) for s in sources), 'Approved baseline drift'
    assert sha(cad / 'p001835-source-extract.glb') == sha(shifted / 'p001835-source-extract.glb') == '3903bcae3570e3cc9b225989a6fb2ebd8ec80e1298ac77c0250f50103a13fb47'
    report = json.loads((shifted / 'build-report.json').read_text())
    doc, binary = glb(extra[0])
    extracted_doc, extracted_binary = glb(extra[1])
    indices = [i for i, n in enumerate(doc['nodes']) if n.get('name') == 'P001835-2']
    assert len(indices) == 1
    idx = indices[0]
    mesh = doc['meshes'][doc['nodes'][idx]['mesh']]
    correspondence = {'occurrence_path': occurrence(doc, idx),
                      'mesh_descriptor_identical': mesh == extracted_doc['meshes'][0],
                      'binary_payload_identical': binary == extracted_binary,
                      'accessor_table_identical': doc['accessors'] == extracted_doc['accessors'],
                      'buffer_view_table_identical': doc['bufferViews'] == extracted_doc['bufferViews'],
                      'historical_failure_revision_authenticated': False}
    assert all(correspondence[k] for k in ('mesh_descriptor_identical', 'binary_payload_identical', 'accessor_table_identical', 'buffer_view_table_identical'))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    live = import_meshes(extra[0])
    shaft = bpy.data.objects['P001835-2']
    shaft_world = shaft.matrix_world.copy()
    inverse = shaft_world.inverted()
    saved = Matrix(json.loads((shifted / 'shaft_world_matrix.json').read_text()))
    datum_error = float(np.max(np.abs(np.array(saved) - np.array(shaft_world))))
    assert datum_error < 1e-6
    # All imported mesh objects are measured; exclude only substituted part identities.
    neighbours = []
    originals = {}
    for obj in live:
        if obj == shaft:
            continue
        transform = inverse @ obj.matrix_world
        p = coords(obj, transform)
        neighbours.append((obj, transform, p))
        if obj.name in ('K000210-1', 'K000211-1', 'P000725-1'):
            originals[obj.name] = p.copy()
    # Blender import has converted glTF Y-up to Blender Z-up; undo with C.
    runtime_min = np.full(3, np.inf)
    runtime_max = np.full(3, -np.inf)
    for obj in live:
        # Mirrors THREE.Box3.setFromObject's transformed local geometry AABB corners.
        local = coords(obj)
        lo, hi = local.min(0), local.max(0)
        corners = np.array([(x, y, z) for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])])
        transform = np.array(C @ obj.matrix_world)
        points = corners @ transform[:3, :3].T + transform[:3, 3]
        runtime_min = np.minimum(runtime_min, points.min(0))
        runtime_max = np.maximum(runtime_max, points.max(0))
    center = (runtime_min + runtime_max) / 2
    recenter = Matrix.Translation(Vector(-center))
    registration = {'status': 'measured', 'units': 'metres in GLB/Blend; mm only in reporting',
                    'blender_to_gltf_matrix': matrix(C), 'shaft_local_to_blender_world': matrix(shaft_world),
                    'saved_matrix_max_abs_error': datum_error, 'shaft_local_to_gltf_world': matrix(C @ shaft_world),
                    'hero_rest_center_m': center.tolist(),
                    'shaft_local_to_recentered_hero_rest': matrix(recenter @ C @ shaft_world),
                    'approved_export_gltf_to_hero_rest': matrix(recenter @ C @ shaft_world @ C.inverted()),
                    'local_positive_y_to_gltf_direction': list((C @ shaft_world).to_3x3() @ Vector((0, 1, 0))),
                    'dynamic_hero_parent_pose': 'Apply live registered-model parent transform after this rest transform; no fixed world-camera registration claimed',
                    'shift_rule': 'Approved coordinates are endpoint. Start = endpoint minus measured legacy-to-approved delta; do not add endpoint shift.'}
    legacy_points = coords(shaft)
    source_meshes = import_meshes(cad / 'p001835-source-extract.glb')
    assert len(source_meshes) == 1
    source = source_meshes[0]
    source.data.transform(source.matrix_world)
    source.matrix_world = Matrix.Identity(4)
    extracted_points = coords(source)
    correspondence['decoded_vertex_count'] = len(legacy_points)
    correspondence['decoded_local_vertex_max_abs_error_mm'] = float(np.max(np.abs(legacy_points - extracted_points)) * 1000)
    assert correspondence['decoded_local_vertex_max_abs_error_mm'] < 0.001
    print('G0_CORRESPONDENCE ' + json.dumps({'approved_hashes': 6, 'node_index': idx, 'local_vertex_error_mm': correspondence['decoded_local_vertex_max_abs_error_mm'], 'positive_y_gltf': registration['local_positive_y_to_gltf_direction']}), flush=True)
    approved_meshes = import_meshes(shifted / 'p001835-hobbed.glb')
    assert len(approved_meshes) == 1
    revised = approved_meshes[0]
    revised.data.transform(revised.matrix_world)
    revised.matrix_world = Matrix.Identity(4)
    revised_tree = bvh(revised)
    legacy_tree = bvh(source)
    revised_points = coords(revised)
    early = {'sources': sources, 'correspondence': correspondence, 'registration': registration,
             'shaft_bounds': {'legacy': bounds(legacy_points), 'approved': bounds(revised_points)},
             'status': 'early measurement; supports, topology, neighbour checks still running'}
    (out / 'early-datum.json').write_text(json.dumps(early, indent=2) + '\n', encoding='utf-8')
    print('G0_DATUM_READY ' + str(out / 'early-datum.json'), flush=True)
    imported_supports = import_meshes(shifted / 'k000210-k000211-moved.glb')
    imported_housing = import_meshes(shifted / 'p000725-modified.glb')
    support_results = []
    replacements = []
    for obj in imported_supports + imported_housing:
        p = coords(obj, obj.matrix_world)
        old_name = {'bearing_NEW': 'K000210-1', 'ring_NEW': 'K000211-1', 'housing_NEW': 'P000725-1'}[obj.name]
        old = originals[old_name]
        delta = ((p.min(0) + p.max(0)) - (old.min(0) + old.max(0))) * 500
        row = {'identity': old_name, 'export_object': obj.name, 'old_bounds': bounds(old), 'new_bounds': bounds(p),
               'bounds_center_delta_mm': delta.tolist(), 'old_vertex_count': len(old), 'export_vertex_count': len(p),
               'old_to_shaft_local_matrix': matrix(inverse @ bpy.data.objects[old_name].matrix_world),
               'export_node_matrix': matrix(obj.matrix_world)}
        if old_name != 'P000725-1':
            translated = old + (0, 0.00275, 0)
            row['rigid_delta_residual_mm'] = max(point_error(p, translated), point_error(translated, p))
            assert row['rigid_delta_residual_mm'] < 0.002
        else:
            row['status'] = 'changed bore shoulder; native indexed before/after comparison follows'
        support_results.append(row)
        replacements.append((obj, obj.matrix_world.copy(), p))
    # Exhaustive assembly broad phase, followed by triangle crossing and symmetric vertex-to-surface samples.
    lo, hi = revised_points.min(0), revised_points.max(0)
    contacts = []
    skipped = []
    margin = 0.00002
    for obj, transform, points in neighbours + replacements:
        if obj.name in originals:
            continue
        nlo, nhi = points.min(0), points.max(0)
        gap = np.maximum(np.maximum(nlo - hi, lo - nhi), 0)
        lower = float(np.linalg.norm(gap) * 1000)
        if lower > margin * 1000:
            skipped.append({'identity': obj.name, 'aabb_distance_lower_bound_mm': lower, **bounds(points)})
            continue
        tree = bvh(obj, transform)
        crossings = revised_tree.overlap(tree)
        old_crossings = legacy_tree.overlap(tree)
        crossing_points = np.array([revised_points[v] for face, _ in crossings for v in revised.data.polygons[face].vertices]).reshape(-1, 3)
        best = (float('inf'), None, None)
        for values, other in ((points, revised_tree), (revised_points, tree)):
            for v in values:
                nearest = other.find_nearest(Vector(v))
                if nearest and nearest[0] is not None and nearest[3] < best[0]:
                    best = (nearest[3], v.tolist(), list(nearest[0]))
        contacts.append({'identity': obj.name, **bounds(points), 'triangle_intersection_pairs': len(crossings),
                         'legacy_shaft_triangle_intersection_pairs_same_neighbour_pose': len(old_crossings),
                         'crossing_triangle_bounds': bounds(crossing_points) if len(crossing_points) else None,
                         'sampled_min_surface_distance_mm': best[0] * 1000,
                         'separation_bound_mm': [0, best[0] * 1000],
                         'nearest_witness_shaft_local_m': [best[1], best[2]],
                         'status': 'unresolved' if crossings or best[0] <= margin else 'measured_sample_only',
                         'limitation': 'Triangle crossings are surface intersections, not volumetric penetration or fit proof. Vertex distances upper-bound mesh separation. No dynamic rotation/tolerance clearance certification.'})
    profile_ys = [3.175, 4, 6, 9, 9.2, 9.5248584, 9.6, 10, 11, 11.176, 12, 13, 13.5, 13.79, 13.9, 13.926, 14.063948, 14.176, 14.426, 14.7, 15, 15.5, 16, 17, 18, 19, 19.75, 20, 21, 22, 25]
    profiles = {'legacy': [section(source, y) for y in profile_ys], 'approved': [section(revised, y) for y in profile_ys]}
    legacy_radial = radial(bvh(source), 6)
    revised_radial = radial(revised_tree, 6)
    spectrum = np.abs(np.fft.rfft(legacy_radial - legacy_radial.mean()))
    harmonic = int(np.argmax(spectrum[1:100]) + 1)
    assert harmonic == 10
    scores = [float(np.mean((legacy_radial - np.roll(revised_radial, i)) ** 2)) for i in range(360)]
    best_shift = int(np.argmin(scores))
    tooth = {'status': 'measured', 'section_y_mm': 6, 'samples': 3600, 'dominant_circumferential_harmonic': harmonic,
             'tooth_pitch_deg': 36, 'legacy_tip_radius_mm': float(legacy_radial.max()), 'legacy_root_radius_mm': float(legacy_radial.min()),
             'approved_tip_radius_mm': float(revised_radial.max()), 'approved_root_radius_mm': float(revised_radial.min()),
             'clocking_delta_modulo_36_deg': best_shift / 10, 'angular_sample_uncertainty_deg': 0.1,
             'same_clock_profile_rms_difference_mm': float(np.sqrt(np.mean((legacy_radial - revised_radial) ** 2))),
             'same_clock_profile_max_difference_mm': float(np.max(np.abs(legacy_radial - revised_radial))),
             'production_module_pressure_angle_pitch_diameter': {'status': 'unresolved', 'reason': 'Tip/root and count do not establish involute parameters or production cutter.'}}
    runout = []
    for y in np.arange(9.5, 14.301, 0.02):
        hit = revised_tree.ray_cast(Vector((0, float(y) / 1000, 0)), Vector((1, 0, 0)), 0.03)
        runout.append({'y_mm': float(y), 'plus_x_floor_r_mm': None if hit[0] is None else float(hit[0].x * 1000)})
    export_topology = topology(revised)
    welded_export_topology = topology(revised, 1e-6)
    exported_points = {obj.name: p for obj, _, p in replacements}
    assembly_mesh_count = len(live)
    legacy_neighbour_count = len(neighbours) - 3
    replacement_count = len(replacements)
    spring_found = any(o.name == 'K000180-1' for o, _, _ in neighbours)
    # Read the approved native mesh independently; never save or export this file.
    bpy.ops.wm.open_mainfile(filepath=str(shifted / 'input-shaft-assembly-parts-v1.blend'))
    native = bpy.data.objects['SHAFT_P001835_HOBBED_NEW']
    native_topology = topology(native)
    native_weld_topology = topology(native, 1e-6)
    bearing = bpy.data.objects['bearing_NEW']
    bearing_topology = topology(bearing, 1e-6)
    blend_export_checks = []
    for export_name, native_name, original_name in [('bearing_NEW', 'bearing_NEW', 'BEARING_K000210_ORIG'), ('ring_NEW', 'ring_NEW', 'RING_K000211_ORIG'), ('housing_NEW', 'housing_NEW', 'HOUSING_P000725_ORIG')]:
        p = coords(bpy.data.objects[native_name], bpy.data.objects[native_name].matrix_world)
        imported = exported_points[export_name]
        original_p = coords(bpy.data.objects[original_name], bpy.data.objects[original_name].matrix_world)
        assert p.shape == original_p.shape
        native_delta = (p - original_p) * 1000
        moved = np.linalg.norm(native_delta, axis=1) > 0.01
        row = next(r for r in support_results if r['export_object'] == export_name)
        row['native_vertex_delta_min_mm'] = native_delta.min(0).tolist()
        row['native_vertex_delta_max_mm'] = native_delta.max(0).tolist()
        row['native_moved_vertex_count'] = int(moved.sum())
        row['native_moved_delta_mean_mm'] = native_delta[moved].mean(0).tolist()
        blend_export_checks.append({'identity': export_name, 'symmetric_vertex_set_error_mm': max(point_error(p, imported), point_error(imported, p))})
    native_p = coords(native, native.matrix_world)
    # Native topology differs from export due to normals splits; nearest surface gives export registration evidence.
    native_tree = bvh(native, native.matrix_world)
    export_native_error = max(native_tree.find_nearest(Vector(v))[3] for v in revised_points) * 1000
    feature_rings = {}
    for label, p in [('legacy', legacy_points), ('approved_native', native_p)]:
        y, r = p[:, 1] * 1000, np.hypot(p[:, 0], p[:, 2]) * 1000
        rows = []
        for station in np.unique(np.round(y[(y >= 9) & (y <= 22)], 3)):
            mask = np.abs(y - station) < 0.0011
            rows.append({'y_mm': float(station), 'r_min_mm': float(r[mask].min()), 'r_max_mm': float(r[mask].max()), 'vertices': int(mask.sum())})
        feature_rings[label] = rows
    # This pre-export native build is the report's topology basis; the assembly Blend re-imports the GLB.
    bpy.ops.wm.open_mainfile(filepath=str(shifted / 'input-shaft-hobbed-v1.blend'))
    built = [o for o in bpy.data.objects if o.type == 'MESH' and 'HOBBED' in o.name][0]
    build_topology = topology(built)
    runout_rows = [r for r in runout if r['plus_x_floor_r_mm'] is not None]
    close = [r for r in runout_rows if r['plus_x_floor_r_mm'] >= 6.064]
    floor_exit = next((r['y_mm'] for r in close), None)
    result = {'schema': 'jgun-manufacturing-g0/v1', 'blender_version': bpy.app.version_string,
              'sources': sources, 'source_immutability': 'All input paths opened read-only; hash recheck below',
              'correspondence': correspondence, 'registration': registration, 'supports': support_results,
              'blend_export_registration': {'support_checks': blend_export_checks, 'shaft_export_vertex_to_native_surface_max_mm': export_native_error},
              'shaft_bounds': {'legacy': bounds(legacy_points), 'approved': bounds(revised_points)},
              'tooth_profile': tooth, 'axial_sections': profiles, 'feature_rings': feature_rings,
              'leadout': {'status': 'measured_geometry_and_authored_construction', 'authored_construction_radius_mm': report['R_hob_mm'],
                          'dimension_type': 'Radius of radial/axial tooth-space translation arc; NOT axial clearance or verified production hob OD',
                          'functional_face_start_y_mm': report['y_face_mm'], 'authored_functional_face_width_mm': report['func_len_mm'],
                          'functional_face_end_y_mm': report['y_functional_end_mm'],
                          'authored_sweep_end_y_mm': report['leadout_end_y_mm'], 'authored_sweep_run_mm': report['leadout_run_mm'],
                          'plus_x_mesh_floor_samples': runout,
                          'tool_swept_clearance': {'status': 'unresolved', 'reason': 'No approved represented shaper/hob geometry, starts, setting or motion envelope exists in this leaf. 6 mm construction cannot certify full tilted tool clearance.'}},
              'neighbours': {'assembly_meshes_scanned': assembly_mesh_count, 'legacy_meshes_checked_except_shaft_and_replaced_supports': legacy_neighbour_count,
                             'replacement_meshes_checked': replacement_count, 'broadphase_margin_mm': margin * 1000,
                             'aabb_disjoint': skipped, 'surface_checks': contacts,
                             'spring_found': spring_found},
              'topology': {'approved_native': native_topology, 'approved_native_weld_1um': native_weld_topology,
                           'reported_build_native': build_topology, 'approved_export_raw': export_topology,
                           'approved_export_weld_1um': welded_export_topology, 'bearing_weld_1um': bearing_topology,
                           'bearing_separability': {'status': 'measured_components_unresolved_semantics',
                                                   'reason': 'Connected component bounds do not identify independent inner/outer races or rolling elements. No race animation authorized by topology alone.'},
                           'cosmetic_normals': {'status': 'unresolved', 'reason': 'Winding/degenerate-face checks are recorded; rendered grazing-light normals approval requires a derived asset/render in G2.'}},
              'uncertainty': {'status': 'bounded_numeric_only', 'float_export_and_decode_allowance_mm': 0.002,
                              'comparison_total_allowance_mm': 0.02, 'floor_axial_sampling_step_mm': 0.02,
                              'mesh_tessellation_manufacturing_tolerance_mm': None,
                              'limitation': '0.02 mm is a conservative numeric/contact screen, not a proven CAD chord-error or manufacturing tolerance. Positive physical clearance remains unresolved without source tolerance and full swept tooling.'},
              'illustrative': {'historical_grooved_failure_reconstruction': True, 'stress_field': 'Illustrative stress concentration; no FEA solved', 'production_tooling': 'unresolved'}}
    for source_row in sources:
        assert sha(Path(source_row['path'])) == source_row['sha256'], 'Source mutated during measurement'
    result['source_hashes_unchanged_after_run'] = True
    (out / 'source-registry.json').write_text(json.dumps(result, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    summary = {'schema': result['schema'], 'baseline_matches': sum(s.get('baseline_match', False) for s in sources),
               'correspondence': correspondence, 'support_delta_mm': [{'identity': r['identity'], 'bounds_center_delta': r['bounds_center_delta_mm'], 'native_moved_delta': r['native_moved_delta_mean_mm'], 'residual': r.get('rigid_delta_residual_mm')} for r in support_results],
               'registration': registration, 'tooth_profile': tooth, 'reported_build_non_manifold_edges': build_topology['non_manifold_edges'],
               'native_non_manifold_edges': native_topology['non_manifold_edges'], 'native_weld_1um_non_manifold_edges': native_weld_topology['non_manifold_edges'],
               'reported_build_defect_edges': build_topology['defect_edges'], 'bearing_connected_components': bearing_topology['component_count'],
               'plus_x_floor_first_y_within_0_01mm_of_filler_radius': floor_exit,
               'assembly_meshes_scanned': assembly_mesh_count, 'surface_checks': len(contacts), 'spring_found': result['neighbours']['spring_found'],
               'spring_checks': [r for r in contacts + skipped if r['identity'] == 'K000180-1'],
               'source_hashes_unchanged_after_run': True}
    (out / 'measurement-summary.json').write_text(json.dumps(summary, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print('G0_MEASUREMENT ' + json.dumps({'baseline_matches': summary['baseline_matches'], 'shaft_correspondence': True,
          'native_non_manifold_edges': summary['native_non_manifold_edges'], 'spring_found': summary['spring_found'], 'out': str(out)}), flush=True)


if __name__ == '__main__':
    main()
