"""Derived finished core assets only. Run with Blender --background --python.

v2 (lite completion): the v1 hard protection that froze every feature-band
triangle (and alone exceeded the lite target) is replaced by priority-ordered,
whole-mesh, seam-free reduction. Fidelity is measured directly against the
assembled source: exact plane-section polylines with symmetric Hausdorff
distance, tooth count/clock at y=6 mm, +X floor radius every 0.1 mm along the
runout ramp, and silhouette bounds. Blender 5.1 Decimate vertex-group semantics
were measured empirically first: group members are collapse candidates (higher
weight collapses earlier) and ungrouped vertices survive until the group's
collapse potential is exhausted; v1's group=protection assumption was inverted
and its group path never executed.

V3 (legacy housing witness): the approved housing node is renamed
'approvedhousing' and the legacy P000725 housing (HOUSING_P000725_ORIG) ships
as 'legacyhousing' in the same shaft-local frame. The welded approved housing
is reduced with seat vertices excluded from every collapse pool and the legacy
export is derived from that same reduction by moving each surviving seat vertex
by its exact per-vertex source delta, because the measured source fact
(geometry/FINDINGS.md) is that the two housings differ only at the bore-shoulder
seat (+2.75 mm shaft-local +Y). Both tiers therefore differ only at the seat
and the decoded registration proof is exact. Shaft processing is untouched;
decoded shaft geometry hashes must equal the -v2 report.

No source save, stock reconstruction, cutter states, or G2 acceptance.
All evidence outputs are new files with a -v2/-v3 suffix; existing evidence
stays.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
import time

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05'
OUT = EVIDENCE / 'assets'
SOURCE = Path('C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/input-shaft-assembly-parts-v1.blend')
SOURCE_HASH = '88d1ce4ac7ca112adcd370e77852cfb9977dfec81b4bfcb61ee1872895574a89'
TOPOLOGY_SOURCE = SOURCE.parent / 'input-shaft-hobbed-v1.blend'
PARTS = {
    'legacyshaft': ('SHAFT_P001835_ORIG', 'P001835', 'legacy'),
    'approvedshaft': ('SHAFT_P001835_HOBBED_NEW', 'P001835', 'approved'),
    'approvedhousing': ('housing_NEW', 'P000725', 'approved'),
    'legacyhousing': ('HOUSING_P000725_ORIG', 'P000725', 'legacy'),
    'legacybearing': ('BEARING_K000210_ORIG', 'K000210', 'legacy'),
    'legacyring': ('RING_K000211_ORIG', 'K000211', 'legacy'),
    'approvedbearing': ('bearing_NEW', 'K000210', 'approved'),
    'approvedring': ('ring_NEW', 'K000211', 'approved'),
}
SUFFIX = '-v3'
# Housing seat sections: the base planes cut the legacy bearing seat and the
# legacy bore shoulder (moved-vertex band 16.48-16.87 mm); the same planes
# +2.75 mm cut the approved shoulder. Measured 2026-10-05 from
# HOUSING_P000725_ORIG vs housing_NEW and BEARING_K000210_ORIG bounds.
HOUSING_SEAT_BASE_YS = (13.0, 14.5, 16.0, 16.7327)
HOUSING_SHIFT_MM = 2.75
HOUSING_SECTION_YS = tuple(sorted(HOUSING_SEAT_BASE_YS
                                  + tuple(round(y + HOUSING_SHIFT_MM, 4) for y in HOUSING_SEAT_BASE_YS)))
HOUSING_PROFILES = {
    'full': (dict(name='full-housing-dissolve1', dissolve_rad=0.001),),
    'lite': (dict(name='lite-housing-dissolve5', dissolve_rad=0.005),
             dict(name='lite-housing-dissolve10', dissolve_rad=0.01)),
}
HOUSING_TRIANGLE_CAPS = {'full': 15000, 'lite': 9000}
HOUSING_SEAT_LIMIT_MM = {'full': 0.025, 'lite': 0.05}
SECTION_YS = (3.5, 6.0, 9.0, 9.72, 10.92, 12.0, 13.78, 14.18, 15.0, 19.75)
RAMP_YS = tuple(sorted({round(float(y), 3) for y in np.arange(9.55, 13.7501, 0.1)} | {13.78}))
ALL_SECTION_YS = tuple(sorted({round(float(y), 4) for y in SECTION_YS} | {round(float(y), 4) for y in RAMP_YS}))
TOOTH_Y_MM = 6.0
TOOTH_THRESHOLD_MM = 5.95
TOOTH_PITCH_DEG = 36
ANGULAR_SAMPLES = 3600
SAMPLING_DEG = 360.0 / ANGULAR_SAMPLES
POLYLINE_SPACING_MM = 0.01
# Measured region split of the approved shaft (139,886 triangles): the ramp
# 9.6-14.1 mm holds 113,937 (hob runout scallops), the tooth band 13,538, the
# journal/groove 918, the turned body 7,945. Planar dissolve is position
# preserving and scales with angle: at 0.01 rad the tooth band keeps 5,291
# triangles, the ramp 70,872, the body 6,882. Collapse must never touch the
# tooth band: quadric ring/corner merges measured 0.12 mm section error at the
# lite budget. Reduction is therefore regional: dissolve first, then collapse
# passes whose vertex group contains only the named region (group members are
# the collapse pool; ungrouped vertices survive while the pool absorbs the
# budget), with the silhouette guard applied to every pass.
REGION_BANDS = (('below3', None, 3.0), ('tooth', 3.0, 9.6), ('ramp', 9.6, 14.1),
                ('journal', 14.1, 20.0), ('above20', 20.0, None))
TIER_PROFILES = {
    'full': (
        dict(name='full-dissolve2-ramp', dissolve_rad=0.002, above20_target=None),
        dict(name='full-dissolve5-ramp', dissolve_rad=0.005, above20_target=None),
        dict(name='full-dissolve1-body', dissolve_rad=0.001, above20_target=5000),
    ),
    'lite': (
        dict(name='lite-dissolve10-regional', dissolve_rad=0.01, above20_target=3500),
        dict(name='lite-dissolve20-regional', dissolve_rad=0.02, above20_target=3000),
        dict(name='lite-dissolve50-regional', dissolve_rad=0.05, above20_target=3000),
        dict(name='lite-dissolve5-regional', dissolve_rad=0.005, above20_target=3000),
        dict(name='lite-dissolve10-bodyrich', dissolve_rad=0.01, above20_target=4500),
    ),
}


def write_json(name, data):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(data, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def coordinates(mesh):
    values = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get('co', values)
    return values.reshape(-1, 3)


def census(mesh):
    mesh.calc_loop_triangles()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    result = dict(vertices=len(bm.verts), faces=len(bm.faces), triangles=len(mesh.loop_triangles),
                  boundary_edges=sum(e.is_boundary for e in bm.edges),
                  overfull_edges=sum(len(e.link_faces) > 2 for e in bm.edges),
                  wire_edges=sum(e.is_wire for e in bm.edges),
                  volume_mm3=bm.calc_volume(signed=False) * 1e9,
                  bounds_mm=[coordinates(mesh).min(axis=0).tolist(), coordinates(mesh).max(axis=0).tolist()])
    result['bounds_mm'] = [[v * 1000 for v in row] for row in result['bounds_mm']]
    bm.free()
    return result


def clean_mesh(source, distance):
    bm = bmesh.new()
    bm.from_mesh(source)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=distance)
    seen, duplicate = set(), []
    bm.verts.index_update()
    for face in bm.faces:
        key = tuple(sorted(v.index for v in face.verts))
        if key in seen:
            duplicate.append(face)
        seen.add(key)
    bmesh.ops.delete(bm, geom=duplicate, context='FACES_ONLY')
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    details = []
    for edge in bm.edges:
        if len(edge.link_faces) > 2:
            details.append(dict(endpoints_mm=[[c * 1000 for c in v.co] for v in edge.verts],
                                faces=[dict(area_mm2=f.calc_area() * 1e6,
                                            coordinates_mm=[[c * 1000 for c in v.co] for v in f.verts])
                                       for f in edge.link_faces]))
    mesh = bpy.data.meshes.new('derived_clean')
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return mesh, dict(weld_mm=distance * 1000, duplicate_faces_removed=len(duplicate), overfull=details,
                      census=census(mesh))


def approved_topology(source):
    with bpy.data.libraries.load(str(TOPOLOGY_SOURCE), link=False) as (available, loaded):
        loaded.meshes = available.meshes
    native = next(mesh for mesh in loaded.meshes if len(mesh.vertices) == 69973)
    kd = KDTree(len(source.vertices))
    for v in source.vertices:
        kd.insert(v.co, v.index)
    kd.balance()
    result = native.copy()
    distances = []
    # Keep authored vertex identity/connectivity. Coincident CAD vertices may belong to different sheets.
    for v in result.vertices:
        point, _, distance = kd.find(v.co)
        distances.append(distance * 1000)
        v.co = point
    if max(distances) > .002:
        raise RuntimeError('Native topology does not correspond to assembled authoritative coordinates')
    bm = bmesh.new()
    bm.from_mesh(result)
    bad = [e for e in bm.edges if len(e.link_faces) > 2]
    if len(bad) != 1 or bad[0].calc_length() * 1000 > .005:
        raise RuntimeError('Unexpected native topology defect; no generic repair allowed')
    repair = dict(endpoints_mm=[[c*1000 for c in v.co] for v in bad[0].verts],
                  edge_length_mm=bad[0].calc_length()*1000, linked_faces=len(bad[0].link_faces))
    bmesh.ops.collapse(bm, edges=bad, uvs=False)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(result)
    bm.free()
    return result, dict(method='native connectivity mapped onto nearest assembled source coordinates; single <5 micron overfull edge collapsed',
                        topology_source=str(TOPOLOGY_SOURCE), topology_sha256=digest(TOPOLOGY_SOURCE),
                        max_coordinate_mapping_mm=max(distances), repair=repair, census=census(result))


def shade(mesh):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    for f in bm.faces:
        f.smooth = True
        f.material_index = 0
    for e in bm.edges:
        e.smooth = e.is_manifold and e.calc_face_angle(0) < math.radians(30)
    # Fresh data removes stale imported custom normals; sharp CAD features remain discontinuous.
    fresh = bpy.data.meshes.new('derived_shaded')
    bm.to_mesh(fresh)
    bm.free()
    return fresh


def glb_census(path):
    raw = path.read_bytes()
    length = struct.unpack_from('<I', raw, 12)[0]
    data = json.loads(raw[20:20+length])
    names, triangles, primitives = [], {}, 0
    for node in data['nodes']:
        if 'mesh' in node:
            mesh = data['meshes'][node['mesh']]
            names.append(node['name'])
            triangles[node['name']] = sum(data['accessors'][p['indices']]['count']//3 for p in mesh['primitives'])
            primitives += len(mesh['primitives'])
            if any('KHR_draco_mesh_compression' not in p.get('extensions', {}) for p in mesh['primitives']):
                raise RuntimeError('Missing compressed primitive')
    if set(names) != set(PARTS):
        raise RuntimeError('Export names differ from explicit registry')
    return dict(bytes=len(raw), sha256=digest(path), names=names, triangles=triangles,
                total_triangles=sum(triangles.values()), primitive_calls=primitives,
                draw_calls=primitives,
                extensions_required=data.get('extensionsRequired', []), root_extras=data['scenes'][0].get('extras', {}))


def tree(mesh):
    mesh.calc_loop_triangles()
    return BVHTree.FromPolygons([v.co for v in mesh.vertices],
                               [tuple(t.vertices) for t in mesh.loop_triangles], all_triangles=True)


def surface_samples(mesh):
    # Exhaustive vertices and triangle centroid/edge-midpoint samples, not a Hausdorff proof.
    verts = coordinates(mesh)
    mesh.calc_loop_triangles()
    indices = np.array([t.vertices[:] for t in mesh.loop_triangles], dtype=np.int32)
    yield 'vertices', verts
    points = verts[indices]
    yield 'triangle_centroids', points.mean(axis=1)
    for a, b in ((0, 1), (1, 2), (2, 0)):
        yield 'edge_midpoints', (points[:, a] + points[:, b]) * 0.5


def directed_error(mesh, other):
    bvh = tree(other)
    maximum, squared, count = 0.0, 0.0, 0
    regions = {'tooth': 0.0, 'runout': 0.0, 'journal_groove': 0.0, 'remainder': 0.0}
    for _, points in surface_samples(mesh):
        for p in points:
            distance = bvh.find_nearest(Vector(p))[3] * 1000
            y = p[1] * 1000
            region = 'tooth' if y < 9.525 else 'runout' if y < 14.18 else 'journal_groove' if y < 20 else 'remainder'
            regions[region] = max(regions[region], distance)
            maximum = max(maximum, distance)
            squared += distance * distance
            count += 1
    return dict(max_mm=maximum, rms_mm=math.sqrt(squared / count), count=count, regions_max_mm=regions)


def compare(source, candidate):
    a, b = directed_error(source, candidate), directed_error(candidate, source)
    return dict(source_to_candidate=a, candidate_to_source=b, symmetric_max_mm=max(a['max_mm'], b['max_mm']),
                method='all vertices, all triangle centroids and all triangle edge midpoints; nearest triangle surface; sampled, not certified Hausdorff')


def geometry_hash(mesh):
    """Order-insensitive topology+position hash for rerun determinism."""
    verts = np.round(coordinates(mesh).astype(np.float64) * 1e9).astype(np.int64)
    mesh.calc_loop_triangles()
    tris = np.unique(np.sort(np.array([t.vertices[:] for t in mesh.loop_triangles], dtype=np.int64), axis=1), axis=0)
    h = hashlib.sha256()
    h.update(verts.tobytes())
    h.update(tris.tobytes())
    return h.hexdigest()


def mesh_arrays(mesh):
    """Vertex coordinates (mm) and triangle index array, built once per mesh."""
    verts = coordinates(mesh).astype(np.float64) * 1000.0
    mesh.calc_loop_triangles()
    tris = np.array([t.vertices[:] for t in mesh.loop_triangles], dtype=np.int64)
    return verts, tris


def segments_from_arrays(verts, tris, y_mm):
    """Exact plane-triangle intersection at shaft-local y, returned as (n, 2, 3) mm segments."""
    p = verts[tris]
    d = p[:, :, 1] - y_mm
    crossing = np.flatnonzero((d.min(axis=1) < -1e-12) & (d.max(axis=1) > 1e-12))
    segs = np.zeros((len(crossing), 2, 3), dtype=np.float64)
    for row, ti in enumerate(crossing):
        pts = []
        pd, dd = p[ti], d[ti]
        for a, b in ((0, 1), (1, 2), (2, 0)):
            da, db = dd[a], dd[b]
            if (da < 0.0 < db) or (db < 0.0 < da):
                t = da / (da - db)
                pts.append(pd[a] + (pd[b] - pd[a]) * t)
        if len(pts) == 2:
            segs[row] = (pts[0], pts[1])
        elif pts:
            segs[row] = (pts[0], pts[0])
    keep = np.linalg.norm(segs[:, 0] - segs[:, 1], axis=1) > 1e-9
    return segs[keep]


def section_segments(mesh, y_mm):
    verts, tris = mesh_arrays(mesh)
    return segments_from_arrays(verts, tris, y_mm)


def polyline_points(segs, spacing_mm=POLYLINE_SPACING_MM):
    a, b = segs[:, 0], segs[:, 1]
    lengths = np.linalg.norm(b - a, axis=1)
    counts = np.maximum(1, np.ceil(lengths / spacing_mm).astype(np.int64))
    parts = [a, b]
    for k in np.unique(counts):
        idx = counts == k
        t = (np.arange(k + 1, dtype=np.float64) / k)[None, :, None]
        parts.append((a[idx][:, None, :] + (b[idx] - a[idx])[:, None, :] * t).reshape(-1, 3))
    return np.concatenate(parts, axis=0)


def directed_polyline_max(points, segs, chunk=256):
    """Exact max over sample points of min distance to the polyline segments."""
    a = segs[:, 0]
    ab = segs[:, 1] - segs[:, 0]
    denom = np.einsum('ij,ij->i', ab, ab)
    denom[denom == 0.0] = 1.0
    best = 0.0
    for start in range(0, len(points), chunk):
        q = points[start:start + chunk]
        e = q[:, None, :] - a[None, :, :]
        t = np.clip(np.einsum('qsi,si->qs', e, ab) / denom[None, :], 0.0, 1.0)
        dist = np.sqrt(((e - t[:, :, None] * ab[None, :, :]) ** 2).sum(axis=2)).min(axis=1)
        best = max(best, float(dist.max()))
    return best


def symmetric_hausdorff_mm(seg_a, seg_b):
    if len(seg_a) == 0 or len(seg_b) == 0:
        return None
    forward = directed_polyline_max(polyline_points(seg_a), seg_b)
    backward = directed_polyline_max(polyline_points(seg_b), seg_a)
    return max(forward, backward)


def radial_first_hit_mm(segs, angles, chunk=512):
    """First-hit radius from the axis for each angle, exact 2D ray vs section polyline."""
    a = segs[:, 0][:, [0, 2]]
    d = segs[:, 1][:, [0, 2]] - a
    radii = []
    for start in range(0, len(angles), chunk):
        ang = np.array(angles[start:start + chunk])
        u = np.stack([np.cos(ang), np.sin(ang)], axis=1)
        ua = u[:, None, 0] * a[None, :, 1] - u[:, None, 1] * a[None, :, 0]
        ud = u[:, None, 0] * d[None, :, 1] - u[:, None, 1] * d[None, :, 0]
        cross_ad = a[None, :, 0] * d[None, :, 1] - a[None, :, 1] * d[None, :, 0]
        with np.errstate(divide='ignore', invalid='ignore'):
            t = cross_ad / ud
            s = -ua / ud
        valid = (np.abs(ud) > 1e-15) & (s >= 0.0) & (s <= 1.0) & (t > 0.0)
        t = np.where(valid, t, np.inf)
        radii.extend(np.where(np.isfinite(t.min(axis=1)), t.min(axis=1), np.nan).tolist())
    return radii


def tooth_clock(reference, candidate):
    a = np.asarray(reference, dtype=np.float64)
    b = np.asarray(candidate, dtype=np.float64)

    def count(values):
        high = values > TOOTH_THRESHOLD_MM
        return int(np.count_nonzero(high & ~np.roll(high, 1)))

    n = len(a)
    best_shift, best_score = 0, None
    for shift in range(n):
        score = float(np.mean((a - np.roll(b, shift)) ** 2))
        if best_score is None or score < best_score:
            best_shift, best_score = shift, score
    delta = best_shift * SAMPLING_DEG
    modulo = ((delta + TOOTH_PITCH_DEG / 2) % TOOTH_PITCH_DEG) - TOOTH_PITCH_DEG / 2
    return dict(count_source=count(a), count_candidate=count(b),
                clock_delta_degrees=round(float(modulo), 6),
                misses=int(np.isnan(a).sum() + np.isnan(b).sum()),
                sampling_degrees=SAMPLING_DEG, pitch_degrees=TOOTH_PITCH_DEG)


def reference_data(mesh):
    verts, tris = mesh_arrays(mesh)
    sections = {y: segments_from_arrays(verts, tris, y) for y in ALL_SECTION_YS}
    bounds = coordinates(mesh).astype(np.float64) * 1000.0
    return dict(sections=sections,
                tooth_radii=radial_first_hit_mm(sections[round(TOOTH_Y_MM, 4)],
                                                np.linspace(0, math.tau, ANGULAR_SAMPLES, endpoint=False)),
                bounds_mm=[bounds.min(axis=0).tolist(), bounds.max(axis=0).tolist()])


def shaft_fidelity(reference, candidate):
    sections, values = [], []
    verts, tris = mesh_arrays(candidate)
    for y in SECTION_YS:
        segs = segments_from_arrays(verts, tris, y)
        haus = symmetric_hausdorff_mm(reference['sections'][round(float(y), 4)], segs)
        sections.append(dict(y_mm=y, hausdorff_mm=haus,
                             reference_segments=len(reference['sections'][round(float(y), 4)]),
                             candidate_segments=int(len(segs))))
        if haus is not None:
            values.append(haus)
    tooth = tooth_clock(reference['tooth_radii'],
                        radial_first_hit_mm(segments_from_arrays(verts, tris, TOOTH_Y_MM),
                                            np.linspace(0, math.tau, ANGULAR_SAMPLES, endpoint=False)))
    runout_rows, runout_max = [], 0.0
    for y in RAMP_YS:
        ref_r = radial_first_hit_mm(reference['sections'][round(float(y), 4)], [0.0])[0]
        cand_r = radial_first_hit_mm(segments_from_arrays(verts, tris, y), [0.0])[0]
        delta = None if (ref_r is None or cand_r is None or math.isnan(ref_r) or math.isnan(cand_r)) else abs(cand_r - ref_r)
        if delta is not None:
            runout_max = max(runout_max, delta)
        runout_rows.append(dict(y_mm=y, reference_floor_mm=ref_r, candidate_floor_mm=cand_r, abs_delta_mm=delta))
    bounds = coordinates(candidate).astype(np.float64) * 1000.0
    candidate_bounds = [bounds.min(axis=0).tolist(), bounds.max(axis=0).tolist()]
    deltas = [abs(candidate_bounds[i][k] - reference['bounds_mm'][i][k]) for i in (0, 1) for k in range(3)]
    silhouette = dict(reference_bounds_mm=reference['bounds_mm'], candidate_bounds_mm=candidate_bounds,
                      axis_side_deltas_mm=deltas, max_abs_mm=max(deltas))
    sections_max = max(values) if values else None
    return dict(triangles=census(candidate)['triangles'],
                sections=sections, sections_max_mm=sections_max,
                tooth=tooth, runout=dict(step_mm=0.1, samples=len(runout_rows),
                                         max_abs_delta_mm=runout_max, rows=runout_rows),
                silhouette=silhouette,
                max_error_mm=max(v for v in (sections_max, runout_max, silhouette['max_abs_mm']) if v is not None))


def fidelity_ok(fid, limit, cap):
    tooth = fid['tooth']
    return bool(fid['triangles'] <= cap
                and fid['sections_max_mm'] is not None and fid['sections_max_mm'] <= limit
                and tooth['count_candidate'] == 10 and tooth['count_source'] == 10
                and tooth['clock_delta_degrees'] == 0.0 and tooth['misses'] == 0
                and fid['runout']['max_abs_delta_mm'] <= limit
                and all(row['abs_delta_mm'] is not None for row in fid['runout']['rows'])
                and fid['silhouette']['max_abs_mm'] <= limit)


def decimate(mesh, target, name):
    obj = bpy.data.objects.new(name, mesh.copy())
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    triangles = census(obj.data)['triangles']
    if triangles > target:
        planar = obj.modifiers.new('coplanar_redundancy', 'DECIMATE')
        planar.decimate_type = 'DISSOLVE'
        planar.angle_limit = .001 if target > 15000 else .005
        planar.use_dissolve_boundaries = False
        bpy.ops.object.modifier_apply(modifier=planar.name)
        triangles = census(obj.data)['triangles']
        print('PLANAR '+str(target)+' triangles='+str(triangles), flush=True)
    if triangles > target:
        group = obj.vertex_groups.new(name='decimate_pool')
        group.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
        mod = obj.modifiers.new('measured_reduction', 'DECIMATE')
        mod.decimate_type = 'COLLAPSE'
        mod.ratio = target / triangles
        mod.vertex_group = group.name
        mod.vertex_group_factor = 1.0
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.vertex_groups.clear()
    mesh_out = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    return mesh_out


def region_name(y_mm):
    for name, lo, hi in REGION_BANDS:
        if (lo is None or y_mm >= lo) and (hi is None or y_mm < hi):
            return name
    return 'above20'


def region_triangle_counts(mesh):
    mesh.calc_loop_triangles()
    verts = coordinates(mesh).astype(np.float64) * 1000.0
    tri = np.array([t.vertices[:] for t in mesh.loop_triangles], dtype=np.int64)
    ys = verts[tri][:, :, 1]
    counts = {name: 0 for name, _, _ in REGION_BANDS}
    counts['spanning'] = 0
    for row in ys:
        regions = {region_name(float(y)) for y in row}
        if len(regions) == 1:
            counts[next(iter(regions))] += 1
        else:
            counts['spanning'] += 1
    counts['total'] = int(len(tri))
    return counts


def silhouette_guard(obj):
    """Vertices defining the six bounds extremes never enter a collapse pool."""
    co = coordinates(obj.data).astype(np.float64) * 1000.0
    bounds = [co.min(axis=0), co.max(axis=0)]
    guarded = np.zeros(len(co), dtype=bool)
    for i in range(3):
        for side in (0, 1):
            guarded |= np.abs(co[:, i] - bounds[side][i]) <= 1e-3
    return guarded


def collapse_pass(obj, region, remove_triangles, label):
    """One group-targeted COLLAPSE pass sized to remove ~remove_triangles.

    Only region vertices (minus the silhouette guard) are collapse candidates;
    ungrouped vertices survive while the pool absorbs the budget.
    """
    counts = region_triangle_counts(obj.data)
    total = counts['total']
    remove = min(int(remove_triangles), total - 4)
    if remove <= 0:
        return 0
    guarded = silhouette_guard(obj)
    pool = [v.index for v in obj.data.vertices
            if not guarded[v.index] and region_name(v.co.y * 1000) == region]
    if not pool:
        return 0
    group = obj.vertex_groups.new(name='victim_' + region)
    group.add(pool, 1.0, 'REPLACE')
    mod = obj.modifiers.new(label, 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = max(0.02, (total - remove) / total)
    mod.vertex_group = group.name
    mod.vertex_group_factor = 1.0
    mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.vertex_groups.clear()
    return total - region_triangle_counts(obj.data)['total']


def reduce_shaft(mesh, target, profile):
    """Whole-mesh, seam-free regional reduction, measured externally.

    The mesh is never split, so no recombination seam can open. Planar
    redundancy dissolves first (position preserving). Collapse then runs as
    region-targeted passes over the ramp and turned body only; the tooth band,
    journal/groove and silhouette-defining vertices are never in a collapse
    pool. The ramp pass budget is derived from live region counts so the shaft
    lands on the tier target. Callers measure the result against the assembled
    source and gate publication on the error bound.
    """
    obj = bpy.data.objects.new('shaft_reduction', mesh.copy())
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    triangles = census(obj.data)['triangles']
    if triangles > target:
        planar = obj.modifiers.new('planar_redundancy', 'DECIMATE')
        planar.decimate_type = 'DISSOLVE'
        planar.angle_limit = profile['dissolve_rad']
        planar.use_dissolve_boundaries = False
        bpy.ops.object.modifier_apply(modifier=planar.name)
        triangles = census(obj.data)['triangles']
        print('DISSOLVE '+profile['name']+' '+json.dumps(region_triangle_counts(obj.data)), flush=True)
    if triangles > target:
        if profile.get('above20_target'):
            for _ in range(6):
                counts = region_triangle_counts(obj.data)
                if counts['above20'] <= profile['above20_target']:
                    break
                removed = collapse_pass(obj, 'above20',
                                        counts['above20'] - profile['above20_target'],
                                        'body_reduction')
                if removed <= 0:
                    break
        for _ in range(6):
            counts = region_triangle_counts(obj.data)
            if counts['total'] <= target or counts['ramp'] <= 500:
                break
            wanted = counts['total'] - target
            allowed = counts['ramp'] - 500
            removed = collapse_pass(obj, 'ramp', min(wanted, allowed), 'ramp_reduction')
            if removed <= 0:
                break
    mesh_out = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    return mesh_out


def housing_seat_delta(mesh_a, mesh_l):
    """Per-vertex approved-minus-legacy delta (mm), seat mask and classification."""
    a = coordinates(mesh_a).astype(np.float64) * 1000.0
    l = coordinates(mesh_l).astype(np.float64) * 1000.0
    if len(a) != len(l):
        raise RuntimeError('Welded housing pair vertex counts differ; source correspondence broken')
    delta = a - l
    distance = np.linalg.norm(delta, axis=1)
    seat = np.abs(distance - HOUSING_SHIFT_MM) <= 0.001
    coincident = distance <= 0.001
    other = len(a) - int(seat.sum()) - int(coincident.sum())
    if other or not seat.any():
        raise RuntimeError('Housing pair vertices neither coincident nor seat-shifted: ' + str(other))
    stats = dict(vertices=len(a), seat=int(seat.sum()), coincident=int(coincident.sum()), other=other,
                 source_seat_vertices=332,
                 seat_delta_mean_mm=float(delta[seat].mean(axis=0)[1]))
    return delta, seat, stats


def housing_sections(mesh):
    verts, tris = mesh_arrays(mesh)
    return {y: segments_from_arrays(verts, tris, y) for y in HOUSING_SECTION_YS}


def housing_seat_fidelity(reference_sections, candidate):
    rows, worst = [], 0.0
    cand = housing_sections(candidate)
    for y in HOUSING_SECTION_YS:
        haus = symmetric_hausdorff_mm(reference_sections[y], cand[y])
        rows.append(dict(y_mm=y, hausdorff_mm=haus,
                         reference_segments=len(reference_sections[y]),
                         candidate_segments=int(len(cand[y]))))
        if haus is not None:
            worst = max(worst, haus)
    return dict(triangles=census(candidate)['triangles'], sections=rows, sections_max_mm=worst)


def reduce_housing_pair(mesh_a, mesh_l, target, profile, delta, seat):
    """Reduce the welded approved housing with the seat protected; derive legacy.

    Dissolve is position preserving; collapse pools exclude both the silhouette
    guard and every seat vertex, so surviving seat vertices keep their exact
    source positions. The legacy export copies the reduced approved mesh and
    moves each surviving seat vertex by its per-vertex measured source delta,
    which the measured source fact makes exact: the two housings differ only at
    the bore-shoulder seat (+2.75 mm shaft-local +Y, approved above legacy).
    """
    obj = bpy.data.objects.new('housing_reduction', mesh_a.copy())
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    triangles = census(obj.data)['triangles']
    dissolved = triangles
    if triangles > target:
        planar = obj.modifiers.new('planar_redundancy', 'DECIMATE')
        planar.decimate_type = 'DISSOLVE'
        planar.angle_limit = profile['dissolve_rad']
        planar.use_dissolve_boundaries = False
        bpy.ops.object.modifier_apply(modifier=planar.name)
        dissolved = census(obj.data)['triangles']
    seat_indices = np.flatnonzero(seat)
    seat_positions = coordinates(mesh_a).astype(np.float64)[seat_indices]
    kd = KDTree(len(seat_positions))
    for index, point in enumerate(seat_positions):
        kd.insert(Vector(point), index)
    kd.balance()

    def seat_map(mesh):
        values = coordinates(mesh).astype(np.float64)
        alive = np.zeros(len(values), dtype=bool)
        source = np.full(len(values), -1, dtype=np.int64)
        for index, point in enumerate(values):
            hit = kd.find(Vector(point))
            if hit[2] <= 1e-9:
                alive[index] = True
                source[index] = hit[1]
        return alive, source

    collapse_used = False
    if dissolved > target:
        alive, _ = seat_map(obj.data)
        guarded = silhouette_guard(obj)
        pool = [v.index for v in obj.data.vertices
                if not guarded[v.index] and not alive[v.index]]
        group = obj.vertex_groups.new(name='housing_collapse_pool')
        group.add(pool, 1.0, 'REPLACE')
        modifier = obj.modifiers.new('measured_reduction', 'DECIMATE')
        modifier.decimate_type = 'COLLAPSE'
        modifier.ratio = target / dissolved
        modifier.vertex_group = group.name
        modifier.vertex_group_factor = 1.0
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.vertex_groups.clear()
        collapse_used = True
    reduced = obj.data.copy()
    alive, source = seat_map(reduced)
    bpy.data.objects.remove(obj, do_unlink=True)
    legacy = reduced.copy()
    edit = bmesh.new()
    edit.from_mesh(legacy)
    edit.verts.ensure_lookup_table()
    for vertex in edit.verts:
        index = vertex.index
        if alive[index]:
            offset = delta[seat_indices[source[index]]] / 1000.0
            vertex.co = Vector(vertex.co) - Vector(offset)
    edit.to_mesh(legacy)
    edit.free()
    legacy.update()
    record = dict(profile=profile['name'], target_triangles=target,
                  triangles_before=census(mesh_a)['triangles'],
                  triangles_after_dissolve=dissolved,
                  triangles=census(reduced)['triangles'],
                  collapse_used=collapse_used,
                  seat_vertices_source=int(seat.sum()),
                  seat_vertices_surviving=int(alive.sum()))
    return reduced, legacy, record


def housing_registration(mesh_a, mesh_l):
    """Decoded registration proof for the exported housing pair.

    Every legacyhousing vertex must coincide with an approvedhousing vertex
    within 0.005 mm or sit HOUSING_SHIFT_MM below one along shaft-local +Y
    (raw glTF -Z), and the reverse must hold for approvedhousing vertices.
    """
    a = coordinates(mesh_a).astype(np.float64) * 1000.0
    l = coordinates(mesh_l).astype(np.float64) * 1000.0
    kd_a = KDTree(len(a))
    for index, point in enumerate(a):
        kd_a.insert(Vector(point), index)
    kd_a.balance()
    kd_l = KDTree(len(l))
    for index, point in enumerate(l):
        kd_l.insert(Vector(point), index)
    kd_l.balance()
    up = Vector((0.0, HOUSING_SHIFT_MM, 0.0))
    down = Vector((0.0, -HOUSING_SHIFT_MM, 0.0))

    def classify(points, tree, shift):
        counts = dict(coincident=0, seat=0, unmatched=0)
        for point in points:
            if tree.find(Vector(point))[2] <= 0.005:
                counts['coincident'] += 1
            elif tree.find(Vector(point) + shift)[2] <= 0.005:
                counts['seat'] += 1
            else:
                counts['unmatched'] += 1
        return counts

    legacy_side = classify(l, kd_a, up)
    approved_side = classify(a, kd_l, down)
    ok = (legacy_side['unmatched'] == 0 and approved_side['unmatched'] == 0
          and legacy_side['seat'] == approved_side['seat'] and legacy_side['seat'] > 0
          and legacy_side['coincident'] == approved_side['coincident'])
    return dict(ok=bool(ok), legacyhousing_vs_approvedhousing=legacy_side,
                approvedhousing_vs_legacyhousing=approved_side,
                vertices=dict(approvedhousing=len(a), legacyhousing=len(l)),
                tolerance_mm=0.005, seat_shift_mm=HOUSING_SHIFT_MM,
                axis='shaft-local +Y in importer space; the raw glTF axis is -Z',
                expectation='non-seat vertices coincide; seat vertices differ by +2.75 mm along shaft-local +Y')


def summarize_reference(name, data):
    rows = {}
    for y, segs in data['sections'].items():
        if len(segs) == 0:
            rows[str(y)] = dict(segments=0)
            continue
        radii = np.hypot(segs[:, :, 0], segs[:, :, 1])
        rows[str(y)] = dict(segments=int(len(segs)), min_radius_mm=float(radii.min()),
                            max_radius_mm=float(radii.max()),
                            plus_x_floor_mm=radial_first_hit_mm(segs, [0.0])[0])
    return dict(name=name, sections=rows,
                tooth_count=tooth_clock(data['tooth_radii'], data['tooth_radii'])['count_source'],
                bounds_mm=data['bounds_mm'])


def budget_curve(reference, mesh, limit, sizes):
    """Triangle/error curve for a parent budget-amendment decision (lite failure path)."""
    rows = []
    for size in sizes:
        best = None
        for index, profile in enumerate(TIER_PROFILES['lite']):
            reduced = reduce_shaft(mesh, size, profile)
            fid = shaft_fidelity(reference, reduced)
            rank = (0 if fid['tooth']['count_candidate'] == 10 and fid['tooth']['clock_delta_degrees'] == 0.0 else 1,
                    fid['max_error_mm'], index)
            if best is None or rank < best['rank']:
                if best is not None:
                    bpy.data.meshes.remove(best['mesh'])
                best = dict(rank=rank, mesh=reduced, profile=profile['name'], fid=fid)
            else:
                bpy.data.meshes.remove(reduced)
        fid = best['fid']
        rows.append(dict(target_triangles=size, profile=best['profile'], triangles=fid['triangles'],
                         sections_max_mm=fid['sections_max_mm'], runout_max_mm=fid['runout']['max_abs_delta_mm'],
                         silhouette_max_mm=fid['silhouette']['max_abs_mm'], max_error_mm=fid['max_error_mm'],
                         tooth_count=fid['tooth']['count_candidate'],
                         clock_delta_degrees=fid['tooth']['clock_delta_degrees'],
                         within_limit=fidelity_ok(fid, limit, size)))
        bpy.data.meshes.remove(best['mesh'])
        print('CURVE '+json.dumps(rows[-1]), flush=True)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--probe', action='store_true')
    args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    started = time.time()
    before = digest(SOURCE)
    if before != SOURCE_HASH:
        raise RuntimeError('Immutable source baseline mismatch')
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    originals = {key: bpy.data.objects[record[0]].data.copy() for key, record in PARTS.items()}
    source_census = {k: census(me) for k, me in originals.items()}
    for record in PARTS.values():
        obj = bpy.data.objects[record[0]]
        if max(abs(obj.matrix_world[r][c] - Matrix.Identity(4)[r][c]) for r in range(4) for c in range(4)) > 1e-7:
            raise RuntimeError('Expected explicit shaft-local identity source object: ' + obj.name)
    if args.probe:
        probes = {}
        for key, mesh in originals.items():
            probes[key] = []
            for distance in (0.0, 1e-9, 1e-7, 1e-6, 2e-6, 5e-6):
                cleaned, record = clean_mesh(mesh, distance)
                probes[key].append(record)
                bpy.data.meshes.remove(cleaned)
        write_json('cleanup-probe'+SUFFIX+'.json', dict(source_sha256=before, source_census=source_census, probes=probes))
        print('CLEANUP_PROBE ' + json.dumps({k:[(r['weld_mm'],r['census']['vertices'],r['census']['triangles'],r['census']['boundary_edges'],r['census']['overfull_edges']) for r in rows] for k,rows in probes.items()}), flush=True)
        if digest(SOURCE) != before:
            raise RuntimeError('Source changed during probe')
        return
    topology_hash = digest(TOPOLOGY_SOURCE)
    v2_report = json.loads((OUT / 'core-assets-report-v2.json').read_text(encoding='utf-8'))
    prior_path = OUT / ('core-assets-report' + SUFFIX + '.json')
    prior_export_sha256 = None
    if prior_path.exists():
        prior = json.loads(prior_path.read_text(encoding='utf-8'))
        prior_export_sha256 = {tier: prior['bundles'][tier]['sha256']
                               for tier in prior.get('bundles', {}) if tier in ('full', 'lite')}
    cleaned, cleanup = {}, {}
    for key, mesh in originals.items():
        if key == 'approvedshaft':
            cleaned[key], cleanup[key] = approved_topology(mesh)
        else:
            distance = 2e-6 if 'bearing' in key else 1e-6 if 'ring' in key else 5e-6
            cleaned[key], cleanup[key] = clean_mesh(mesh, distance)
        print('CLEANED '+key+' '+json.dumps(cleanup[key]['census']), flush=True)
    write_json('selected-cleanup'+SUFFIX+'.json', cleanup)
    cleanup['approvedshaft']['surface_error'] = compare(originals['approvedshaft'], cleaned['approvedshaft'])
    write_json('selected-cleanup'+SUFFIX+'.json', cleanup)
    references = {k: reference_data(originals[k]) for k in ('legacyshaft', 'approvedshaft')}
    write_json('source-sections'+SUFFIX+'.json',
               {k: summarize_reference(k, references[k]) for k in references})
    housing_delta, housing_seat, housing_stats = housing_seat_delta(cleaned['approvedhousing'],
                                                                    cleaned['legacyhousing'])
    print('HOUSING_PAIR '+json.dumps(housing_stats), flush=True)
    housing_references = {key: {y: section_segments(originals[key], y) for y in HOUSING_SECTION_YS}
                          for key in ('approvedhousing', 'legacyhousing')}
    rna = bpy.ops.export_scene.gltf.get_rna_type().properties
    from io_scene_gltf2.io.com.draco import dll_exists
    if not dll_exists():
        raise RuntimeError('Installed exporter has no Draco library')
    write_json('exporter-rna'+SUFFIX+'.json', dict(blender=bpy.app.version_string,
               properties={p.identifier: dict(description=p.description, default=str(p.default)) for p in rna
                           if 'draco' in p.identifier or p.identifier in ('export_yup', 'export_extras')},
               docs='https://github.com/KhronosGroup/glTF-Blender-IO/blob/main/docs/blender_docs/scene_gltf2.rst'))
    material = bpy.data.materials.new('core_tool_steel')
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (.48, .52, .57, 1)
    shader.inputs['Metallic'].default_value = .95
    shader.inputs['Roughness'].default_value = .28
    report = dict(schema='jgun-core-assets/v3',
                  scope='finished core preparation only; G2 OPEN; G0 tool fit OPEN; v3 adds the legacy P000725 housing witness pair and renames the approved node to approvedhousing',
                  source_census=source_census, cleanup=cleanup, bundles={},
                  source_hash_before=before, topology_hash_before=topology_hash,
                  error_criterion_mm=dict(full=.025, lite=.05),
                  triangle_budget_mm=dict(full_shaft_max=50000, lite_shaft_max=15000,
                                          housing_full_max=15000, housing_lite_max=9000,
                                          bundle_max_bytes=2*1024*1024, max_draw_calls=25),
                  seat_section_criterion_mm=dict(full=0.025, lite=0.05,
                                                 planes='four planes through the bearing seat and shoulder, plus the same planes +2.75 mm through the approved shoulder'),
                  housing_pair=dict(
                      objective='support-relocation beat compares the legacy P000725 housing seat with the approved one',
                      source_fact='geometry/FINDINGS.md: the housings differ only at the bore-shoulder seat, +2.75 mm shaft-local +Y (332 source vertices)',
                      method='weld both housings (5 um, symmetric, correspondence asserted), reduce the approved housing with seat vertices excluded from every collapse pool, derive legacyhousing from the same reduction via per-vertex source deltas; both tiers differ only at the seat',
                      welded_classification=housing_stats,
                      node_names=dict(approved='approvedhousing', legacy='legacyhousing')),
                  fidelity_method=dict(
                      sections='exact plane-triangle intersection polylines at y=' + str(list(SECTION_YS)) +
                               ' mm; symmetric Hausdorff in mm; polyline sample spacing ' + str(POLYLINE_SPACING_MM) + ' mm',
                      tooth='first-hit radial profile at y=6 mm, ' + str(ANGULAR_SAMPLES) + ' angular samples (' + str(SAMPLING_DEG) + ' deg); count of threshold crossings at ' + str(TOOTH_THRESHOLD_MM) + ' mm; clock delta modulo ' + str(TOOTH_PITCH_DEG) + ' deg',
                      runout='+X first-hit floor radius vs y every 0.1 mm over the ramp 9.55..13.78 mm (G0 ray convention)',
                      silhouette='axis-aligned shaft-local bounds, per-side absolute deltas',
                      gate='shaft publication gates on the enumerated suite above plus the tier triangle cap; the dense sampled surface symmetric error is reported for every part and additionally gates non-shaft parts',
                      note='sampled measurements against the assembled source meshes, not a certified Hausdorff bound'),
                  reduction=dict(
                      replaces='v1 hard protection that froze every feature-band triangle and alone exceeded the lite target',
                      semantics='Blender 5.1 Decimate COLLAPSE measured empirically: vertex-group members are collapse candidates; ungrouped vertices survive while the pool absorbs the budget; v1 group=protection assumption was inverted and its group path never executed. Regional passes put only ramp/turned-body vertices in the pool; a silhouette guard keeps every vertex within 1 micron of the six bounds extremes out of every pool. Quadric collapse inside the tooth band measured 0.12 mm section error at the lite budget, so the tooth band is reduced by position-preserving dissolve only',
                      bands=dict(below3='y<3.0', tooth='3.0<=y<9.6', ramp='9.6<=y<14.1', journal='14.1<=y<=20.0', above20='y>=20.0'),
                      profiles={tier: list(profiles) for tier, profiles in TIER_PROFILES.items()}),
                  progression='omitted; cutter unverified', blanks='omitted; no partial placeholder stock',
                  frame=dict(units='metres', source_axis='+Y shaft-local', exported_axis='-Z glTF',
                             conversion='Blender export_yup=True is the sole coordinate conversion',
                             study_pose='assembled, independent of narrative entry mode',
                             support_shift='already baked into approved source vertices (bearing, ring, shaft, and the housing bore-shoulder seat); no added offset'))
    for tier, target, cap, limit in (('full', 48000, 50000, .025), ('lite', 14500, 15000, .05)):
        # Remove loaded source objects only from this process, never save a Blend.
        for obj in list(bpy.data.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        ladder, chosen = [], None
        for index, profile in enumerate(TIER_PROFILES[tier]):
            reduced = reduce_shaft(cleaned['approvedshaft'], target, profile)
            fid = shaft_fidelity(references['approvedshaft'], reduced)
            attempt = dict(profile=profile['name'], index=index,
                           triangles=fid['triangles'], sections_max_mm=fid['sections_max_mm'],
                           runout_max_mm=fid['runout']['max_abs_delta_mm'],
                           silhouette_max_mm=fid['silhouette']['max_abs_mm'],
                           tooth_count=fid['tooth']['count_candidate'],
                           clock_delta_degrees=fid['tooth']['clock_delta_degrees'],
                           within_limit=fidelity_ok(fid, limit, cap))
            ladder.append(attempt)
            print('LADDER '+tier+' '+json.dumps(attempt), flush=True)
            if attempt['within_limit']:
                chosen = dict(profile=profile['name'], mesh=reduced, fid=fid)
                break
            bpy.data.meshes.remove(reduced)
        if chosen is None:
            fallback = min(ladder, key=lambda a: (0 if a['tooth_count'] == 10 and a['clock_delta_degrees'] == 0.0 else 1,
                                                  a['sections_max_mm'] if a['sections_max_mm'] is not None else 1e9,
                                                  a['index']))
            reduced = reduce_shaft(cleaned['approvedshaft'], target, TIER_PROFILES[tier][fallback['index']])
            chosen = dict(profile=fallback['profile'] + ':fallback', mesh=reduced,
                          fid=shaft_fidelity(references['approvedshaft'], reduced))
        housing_ladder, housing_choice = [], None
        for index, housing_profile in enumerate(HOUSING_PROFILES[tier]):
            reduced_a, reduced_l, record = reduce_housing_pair(
                cleaned['approvedhousing'], cleaned['legacyhousing'],
                HOUSING_TRIANGLE_CAPS[tier], housing_profile, housing_delta, housing_seat)
            fid_a = housing_seat_fidelity(housing_references['approvedhousing'], reduced_a)
            fid_l = housing_seat_fidelity(housing_references['legacyhousing'], reduced_l)
            attempt = dict(profile=housing_profile['name'], index=index,
                           triangles=fid_a['triangles'],
                           approvedhousing_sections_max_mm=fid_a['sections_max_mm'],
                           legacyhousing_sections_max_mm=fid_l['sections_max_mm'],
                           within_limit=bool(fid_a['triangles'] <= HOUSING_TRIANGLE_CAPS[tier]
                                             and max(fid_a['sections_max_mm'], fid_l['sections_max_mm'])
                                             <= HOUSING_SEAT_LIMIT_MM[tier]))
            attempt.update(record)
            housing_ladder.append(attempt)
            print('HOUSING_LADDER '+tier+' '+json.dumps(attempt), flush=True)
            if attempt['within_limit']:
                housing_choice = dict(profile=housing_profile['name'], approved=reduced_a, legacy=reduced_l,
                                      fid_approved=fid_a, fid_legacy=fid_l, record=record)
                break
            bpy.data.meshes.remove(reduced_a)
            bpy.data.meshes.remove(reduced_l)
        if housing_choice is None:
            fallback = min(housing_ladder,
                           key=lambda row: (row['approvedhousing_sections_max_mm']
                                            + row['legacyhousing_sections_max_mm'], row['index']))
            reduced_a, reduced_l, record = reduce_housing_pair(
                cleaned['approvedhousing'], cleaned['legacyhousing'],
                HOUSING_TRIANGLE_CAPS[tier], HOUSING_PROFILES[tier][fallback['index']],
                housing_delta, housing_seat)
            housing_choice = dict(profile=fallback['profile'] + ':fallback', approved=reduced_a, legacy=reduced_l,
                                  fid_approved=housing_seat_fidelity(housing_references['approvedhousing'], reduced_a),
                                  fid_legacy=housing_seat_fidelity(housing_references['legacyhousing'], reduced_l),
                                  record=record)
        objects = {}
        for key, mesh in cleaned.items():
            if key == 'approvedshaft':
                reduced = chosen['mesh']
            elif key in ('approvedhousing', 'legacyhousing'):
                reduced = housing_choice['approved' if key == 'approvedhousing' else 'legacy']
            else:
                reduced = decimate(mesh, 15000, 'candidate')
            shaded = shade(reduced)
            shaded.materials.clear()
            shaded.materials.append(material)
            obj = bpy.data.objects.new(key, shaded)
            bpy.context.scene.collection.objects.link(obj)
            obj['part_number'] = PARTS[key][1]
            obj['design_state'] = PARTS[key][2]
            obj['source_object'] = PARTS[key][0]
            obj['coordinate_frame'] = 'shaft-local metres; +Y axis becomes glTF -Z via exporter only'
            obj['support_shift_baked'] = key in ('approvedbearing', 'approvedring', 'approvedshaft', 'approvedhousing')
            objects[key] = obj
        bpy.context.scene['frame_intent'] = 'assembled study independent of narrative entry; not a replacement for Default.glb'
        path = OUT / ('manufacturing-core-'+tier+SUFFIX+'.glb')
        bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', export_yup=True,
                                 export_extras=True, export_animations=False, export_cameras=False,
                                 export_lights=False, export_texcoords=False,
                                 export_draco_mesh_compression_enable=True,
                                 export_draco_mesh_compression_level=6,
                                 export_draco_position_quantization=20,
                                 export_draco_normal_quantization=16)
        bundle = glb_census(path)
        bundle['reduction'] = dict(chosen_profile=chosen['profile'], ladder=ladder,
                                   pre_export_fidelity=chosen['fid'])
        bundle['reduction']['housing'] = dict(chosen_profile=housing_choice['profile'],
                                              ladder=housing_ladder, record=housing_choice['record'],
                                              pre_export_fidelity=dict(approvedhousing=housing_choice['fid_approved'],
                                                                       legacyhousing=housing_choice['fid_legacy']))
        # Decode the actual compressed artifact with the installed importer before measurements.
        for obj in list(bpy.data.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.ops.import_scene.gltf(filepath=str(path))
        decoded = {k: bpy.data.objects[k] for k in PARTS}
        bundle['decoded'] = {}
        bundle['geometry_ok'] = True
        for key, obj in decoded.items():
            mesh = obj.data.copy()
            mesh.transform(obj.matrix_world)
            stats = census(mesh)
            error = compare(originals[key], mesh)
            item = dict(census=stats, surface_error=error, geometry_sha256=geometry_hash(mesh))
            # Spec gate: shafts publish on the enumerated fidelity suite (sections,
            # tooth count/clock, runout ramp, silhouette); the dense surface
            # compare stays reported as supporting evidence, not a publication
            # gate for shafts. Non-shaft parts keep the v1 surface gate.
            ok = True if 'shaft' in key else error['symmetric_max_mm'] <= limit
            item['surface_error_within_limit'] = bool(error['symmetric_max_mm'] <= limit)
            if 'shaft' in key:
                fid = shaft_fidelity(references[key], mesh)
                item['fidelity'] = fid
                ok = ok and fidelity_ok(fid, limit, cap) and bundle['triangles'][key] <= cap
                print('MEASURED '+tier+' '+key+' surface='+str(error['symmetric_max_mm'])+
                      ' sections='+str(fid['sections_max_mm'])+' runout='+str(fid['runout']['max_abs_delta_mm'])+
                      ' silhouette='+str(fid['silhouette']['max_abs_mm'])+' ok='+str(ok), flush=True)
            elif 'housing' in key:
                fid = housing_seat_fidelity(housing_references[key], mesh)
                item['seat_fidelity'] = fid
                ok = ok and fid['sections_max_mm'] <= HOUSING_SEAT_LIMIT_MM[tier] \
                    and bundle['triangles'][key] <= HOUSING_TRIANGLE_CAPS[tier]
                print('MEASURED '+tier+' '+key+' surface='+str(error['symmetric_max_mm'])+
                      ' seat_sections='+str(fid['sections_max_mm'])+
                      ' triangles='+str(bundle['triangles'][key])+' ok='+str(ok), flush=True)
            else:
                print('MEASURED '+tier+' '+key+' max_mm='+str(error['symmetric_max_mm'])+' ok='+str(ok), flush=True)
            item['within_proposed_error'] = bool(ok)
            bundle['geometry_ok'] = bundle['geometry_ok'] and bool(ok)
            bundle['decoded'][key] = item
        shifts = {}
        for approved, legacy in (('approvedbearing', 'legacybearing'), ('approvedring', 'legacyring')):
            mesh_a, mesh_l = decoded[approved].data.copy(), decoded[legacy].data.copy()
            mesh_a.transform(decoded[approved].matrix_world)
            mesh_l.transform(decoded[legacy].matrix_world)
            ca = coordinates(mesh_a).mean(axis=0) * 1000
            cl = coordinates(mesh_l).mean(axis=0) * 1000
            shifts[approved] = dict(delta_center_mm=(ca - cl).tolist(),
                                    expected_plus_y_mm=2.75,
                                    ok=bool(abs((ca - cl)[1] - 2.75) <= 0.005))
        bundle['support_shift_check'] = dict(pairs=shifts, second_shift_added=False)
        mesh_ha = decoded['approvedhousing'].data.copy()
        mesh_ha.transform(decoded['approvedhousing'].matrix_world)
        mesh_hl = decoded['legacyhousing'].data.copy()
        mesh_hl.transform(decoded['legacyhousing'].matrix_world)
        bundle['housing_registration'] = housing_registration(mesh_ha, mesh_hl)
        bundle['geometry_ok'] = bundle['geometry_ok'] and bundle['housing_registration']['ok']
        shaft_hash_pairs = {}
        for key in ('legacyshaft', 'approvedshaft'):
            v2_digest = v2_report['bundles'][tier]['decoded'][key]['geometry_sha256']
            v3_digest = bundle['decoded'][key]['geometry_sha256']
            shaft_hash_pairs[key] = dict(v2=v2_digest, v3=v3_digest, equal=v2_digest == v3_digest)
        bundle['v2_shaft_geometry_hash_match'] = dict(
            pairs=shaft_hash_pairs,
            all_equal=all(pair['equal'] for pair in shaft_hash_pairs.values()))
        bundle['geometry_ok'] = bundle['geometry_ok'] and bundle['v2_shaft_geometry_hash_match']['all_equal']
        over_limit = sorted(k for k, v in bundle['decoded'].items()
                            if not v['surface_error_within_limit'])
        if over_limit:
            bundle['surface_error_disclosure'] = dict(
                parts=over_limit,
                note='dense sampled surface symmetric error exceeds the tier limit while every spec-enumerated '
                     'fidelity measurement (section polylines, tooth count/clock, runout ramp, silhouette) passes; '
                     'reported for parent/D4 review, not a publication gate for shafts')
        bundle['bytes_ok'] = bundle['bytes'] <= 2*1024*1024
        bundle['core_primitive_budget_ok'] = bundle['primitive_calls'] <= 25
        bundle['published'] = bool(bundle['geometry_ok'] and bundle['bytes_ok'] and bundle['core_primitive_budget_ok'])
        if bundle['published']:
            destination = ROOT / 'public/models' / ('manufacturing-core-'+tier+'.glb')
            destination.write_bytes(path.read_bytes())
            bundle['runtime_path'] = str(destination)
        report['bundles'][tier] = bundle
        write_json('core-assets-report'+SUFFIX+'.json', report)
        if tier == 'lite' and not bundle['published']:
            report['lite_budget_curve'] = dict(
                reason='lite did not meet the 0.05 mm criterion at <=15000 triangles; criterion not loosened',
                method='measured on reduced meshes before Draco export; curve for parent budget-amendment decision',
                rows=budget_curve(references['approvedshaft'], cleaned['approvedshaft'], .05,
                                  (15000, 20000, 25000, 30000)))
            write_json('core-assets-report'+SUFFIX+'.json', report)
    report['source_hash_after'] = digest(SOURCE)
    report['topology_hash_after'] = digest(TOPOLOGY_SOURCE)
    report['source_unchanged'] = before == report['source_hash_after'] and topology_hash == report['topology_hash_after']
    current_export_sha256 = {tier: report['bundles'][tier]['sha256'] for tier in report['bundles']}
    report['rerun_determinism'] = dict(
        prior_export_sha256=prior_export_sha256, current_export_sha256=current_export_sha256,
        identical=bool(prior_export_sha256 is not None
                       and all(current_export_sha256.get(tier) == prior_export_sha256.get(tier)
                               for tier in ('full', 'lite'))),
        note='run the export command twice; the second run reports identical=true with both hashes')
    report['elapsed_seconds'] = time.time() - started
    write_json('core-assets-report'+SUFFIX+'.json', report)
    if not report['source_unchanged']:
        raise RuntimeError('Source changed during export')
    print('CORE_ASSETS '+json.dumps({k:dict(bytes=b['bytes'],triangles=b['total_triangles'],published=b['published']) for k,b in report['bundles'].items()}), flush=True)


if __name__ == '__main__':
    main()
