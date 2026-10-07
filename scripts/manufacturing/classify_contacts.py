"""Independent G0 contact classifier (reviewer-owned, read-only on all producer inputs).

Classifies shaft/neighbour contacts by actual penetration depth and location, comparing the
legacy shaft with the approved shaft in the same neighbour pose, rather than by triangle-pair count.
Ring/bearing/housing are compared as matched pairs: LEGACY support + LEGACY shaft vs APPROVED support + APPROVED shaft.

Run (from repo root):
  blender -b --factory-startup --python-exit-code 1 --python scripts/manufacturing/classify_contacts.py
Writes only mechanical-review/contact-classification.json.
"""
import argparse
import json
import math
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import numpy as np
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/manufacturing'))
import measure_g0 as g0  # import only; its main() is not executed

EV = ROOT / 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05'
REVIEW = EV / 'mechanical-review'
CAD = Path('C:/Projects/CAD/jgun-input-shaft-hobbed')
SHIFTED = CAD / 'shifted'
BIN_MM = 0.05
EXPORT_UNC_MM = 0.002
CONTACT_SCREEN_MM = 0.02
FACE_END_MM = 9.5248584
DIRS = [Vector(v).normalized() for v in ((0.5773, 0.3211, 0.7512), (-0.2711, 0.8530, 0.4421), (0.1230, -0.4411, 0.8896))]


class Mesh:
    def __init__(self, name, obj, transform=None):
        self.name = name
        self.pts = g0.coords(obj, transform)
        me = obj.data
        me.calc_loop_triangles()
        tri = np.empty(len(me.loop_triangles) * 3, dtype=np.int32)
        me.loop_triangles.foreach_get('vertices', tri)
        self.tri = tri.reshape(-1, 3)
        edges = np.empty(len(me.edges) * 2, dtype=np.int32)
        me.edges.foreach_get('vertices', edges)
        self.edges = edges.reshape(-1, 2)
        self.tree = BVHTree.FromPolygons([Vector(v) for v in self.pts], [tuple(int(i) for i in t) for t in self.tri])

    def samples(self):
        return np.vstack([self.pts, self.pts[self.tri].mean(1), self.pts[self.edges].mean(1)])


def hits(tree, p, d):
    n, o = 0, Vector(p)
    for _ in range(64):
        loc = tree.ray_cast(o, d)[0]
        if loc is None:
            break
        n += 1
        o = loc + d * 1e-7
    return None if n == 64 else n


def votes_inside(tree, p):
    counts = [hits(tree, p, d) for d in DIRS]
    if any(n is None for n in counts):
        raise RuntimeError('Ray intersection limit reached; sign cannot be assigned')
    return sum(n % 2 for n in counts)


def penetration(a, b):
    """Samples of mesh a (vertices, triangle centroids, edge midpoints) against closed-ish mesh b."""
    s = a.samples()
    lo, hi = b.pts.min(0) - EXPORT_UNC_MM / 1000, b.pts.max(0) + EXPORT_UNC_MM / 1000
    rows = []
    for p in s[np.all((s >= lo) & (s <= hi), axis=1)]:
        loc, nor, _, dist = b.tree.find_nearest(Vector(p))
        if loc is None:
            continue
        rows.append((p[1] * 1000, dist * 1000, votes_inside(b.tree, p),
                     (Vector(p) - loc).dot(nor) < 0, p[0] * 1000, p[2] * 1000,
                     loc.x * 1000, loc.y * 1000, loc.z * 1000))
    return np.array(rows) if rows else np.empty((0, 9))


def binned(y, depth):
    out = {}
    for yy, dd in zip(y, depth):
        k = round(float(np.floor(yy / BIN_MM) * BIN_MM), 4)
        out[k] = max(out.get(k, 0.0), float(dd))
    return dict(sorted(out.items()))


def contact(shaft, other):
    r1 = penetration(shaft, other)       # shaft samples inside neighbour
    r2 = penetration(other, shaft)       # neighbour samples inside shaft
    ins1 = r1[r1[:, 2] >= 2] if len(r1) else r1
    ins2 = r2[r2[:, 2] >= 2] if len(r2) else r2
    out = np.vstack([r1[r1[:, 2] < 2], r2[r2[:, 2] < 2]]) if len(r1) + len(r2) else np.empty((0, 9))
    allins = np.vstack([ins1, ins2]) if len(ins1) + len(ins2) else np.empty((0, 9))
    ambiguous = int(sum(((r[:, 2] == 1) | (r[:, 2] == 2)).sum() for r in (r1, r2) if len(r)))
    nsign_disagree = int(sum(((r[:, 2] >= 2) != (r[:, 3] > 0.5)).sum() for r in (r1, r2) if len(r)))
    pairs = shaft.tree.overlap(other.tree)
    sh_t = np.unique([p[0] for p in pairs]).astype(int) if pairs else np.array([], int)
    ot_t = np.unique([p[1] for p in pairs]).astype(int) if pairs else np.array([], int)

    def edge_stats(m, idx):
        if not len(idx):
            return None
        tr = m.pts[m.tri[idx]]
        e = np.concatenate([np.linalg.norm(tr[:, i] - tr[:, (i + 1) % 3], axis=1) for i in range(3)]) * 1000
        return {'p50': float(np.median(e)), 'p95': float(np.percentile(e, 95)), 'max': float(e.max())}

    res = {'overlap_triangle_pairs': len(pairs), 'unique_shaft_triangles': len(sh_t), 'unique_neighbour_triangles': len(ot_t),
           'overlap_centroid_y_mm': None, 'contact_edge_len_mm': {'shaft': edge_stats(shaft, sh_t), 'neighbour': edge_stats(other, ot_t)},
           'evaluated_samples': int(len(r1) + len(r2)), 'ambiguous_vote_samples': ambiguous, 'normal_vs_parity_disagreements': nsign_disagree}
    if len(sh_t):
        cy = np.concatenate([shaft.pts[shaft.tri[sh_t]].mean(1)[:, 1], other.pts[other.tri[ot_t]].mean(1)[:, 1]]) * 1000
        res['overlap_centroid_y_mm'] = [float(cy.min()), float(cy.max())]
    res['inside_sample_count'] = {'shaft_in_neighbour': int(len(ins1)), 'neighbour_in_shaft': int(len(ins2))}
    if len(allins):
        d = allins[:, 1]
        res['penetration_depth_mm'] = {'max': float(d.max()), 'p95': float(np.percentile(d, 95)), 'p50': float(np.median(d)),
                                      'shaft_in_neighbour_max': float(ins1[:, 1].max()) if len(ins1) else 0.0,
                                      'neighbour_in_shaft_max': float(ins2[:, 1].max()) if len(ins2) else 0.0}
        res['inside_y_range_mm'] = [float(allins[:, 0].min()), float(allins[:, 0].max())]
        res['depth_envelope_by_y_mm'] = binned(allins[:, 0], d)
    else:
        res['penetration_depth_mm'] = {'max': 0.0}
        res['inside_y_range_mm'] = None
        res['depth_envelope_by_y_mm'] = {}
    res['sampled_min_gap_mm_outside_only'] = float(out[:, 1].min()) if len(out) else None
    res['regions'] = {}
    for region, low, high in (('functional_face', 3.1748584, FACE_END_MM),
                              ('face_exit_and_leadout', FACE_END_MM, 14.176),
                              ('support_seats', 14.176, 22), ('remote_driveline', 22, 72)):
        rr = allins[(allins[:, 0] > low) & (allins[:, 0] <= high)]
        res['regions'][region] = {'inside_samples': len(rr),
                                 'max_sampled_depth_mm': float(rr[:, 1].max()) if len(rr) else 0.0,
                                 'y_range_mm': [float(rr[:, 0].min()), float(rr[:, 0].max())] if len(rr) else None}
    res['deepest_witnesses'] = []
    for direction, rows in (('shaft_in_neighbour', r1), ('neighbour_in_shaft', r2)):
        for votes in (3, 2):
            chosen = rows[rows[:, 2] == votes]
            for r in chosen[np.argsort(chosen[:, 1])[-3:][::-1]]:
                res['deepest_witnesses'].append({'direction': direction, 'inside_votes': votes,
                    'normal_inside': bool(r[3]), 'signed_distance_mm': -float(r[1]),
                    'point_shaft_local_mm': [float(r[4]), float(r[0]), float(r[5])],
                    'nearest_opposing_surface_mm': r[6:9].tolist(),
                    'azimuth_deg': math.degrees(math.atan2(r[5], r[4]))})
    unanimous = allins[allins[:, 2] == 3]
    res['unanimous_inside_max_depth_mm'] = float(unanimous[:, 1].max()) if len(unanimous) else 0.0
    corroborated = unanimous[unanimous[:, 3] > 0.5]
    res['corroborated_inside_max_depth_mm'] = float(corroborated[:, 1].max()) if len(corroborated) else 0.0
    return res


def compare(old, new, old_shift_mm=0.0):
    eo = {round(y + old_shift_mm, 4): d for y, d in old['depth_envelope_by_y_mm'].items()}
    en = new['depth_envelope_by_y_mm']
    bins = sorted(set(eo) | set(en))
    rows = [(b, eo.get(b, 0.0), en.get(b, 0.0)) for b in bins]
    excess = max([n - o for _, o, n in rows], default=0.0)
    worst = max(rows, key=lambda r: r[2] - r[1], default=None)
    spacing_indicator = EXPORT_UNC_MM + 0.5 * max(
        [s['p50'] for r in (old, new) for s in r['contact_edge_len_mm'].values() if s] or [0.0])
    new_only = [b for b, o, n in rows if n > CONTACT_SCREEN_MM and o <= 0.0]
    old_max, new_max = old['penetration_depth_mm']['max'], new['penetration_depth_mm']['max']
    return {'legacy_axial_alignment_shift_mm': old_shift_mm,
            'old_max_depth_mm': old_max, 'new_max_depth_mm': new_max, 'max_depth_delta_mm': new_max - old_max,
            'worst_bin_excess_mm': excess, 'worst_bin_y_mm': None if worst is None else worst[0],
            'numeric_contact_screen_mm': CONTACT_SCREEN_MM,
            'contact_half_median_edge_indicator_mm_not_error_bound': spacing_indicator,
            'unpaired_bins_new_only_above_numeric_screen_y_mm': new_only,
            'bin_limitation': 'Old/new tessellation and sample sites differ. Empty legacy bins are not evidence of a newly introduced contact; use common-angle gear sections and matched witnesses.',
            'old_y_range_mm': old['inside_y_range_mm'], 'new_y_range_mm': new['inside_y_range_mm']}


def refined_min_distance(a, b, subdiv=8):
    """Edge samples upper-bound the minimum; triangle interiors remain unsampled."""
    best, spacing = float('inf'), 0.0
    for m, o in ((a, b), (b, a)):
        d = np.array([o.tree.find_nearest(Vector(v))[3] for v in m.pts])
        e = m.edges
        length = np.linalg.norm(m.pts[e[:, 0]] - m.pts[e[:, 1]], axis=1)
        end = np.minimum(d[e[:, 0]], d[e[:, 1]])
        keep = np.where(end - length / 2 <= d.min())[0]
        best = min(best, float(d.min()))
        for i in keep:
            p, q = m.pts[e[i, 0]], m.pts[e[i, 1]]
            for t in np.linspace(0, 1, subdiv + 1):
                best = min(best, o.tree.find_nearest(Vector(p + (q - p) * t))[3])
            spacing = max(spacing, float(length[i]) / subdiv)
    return {'sampled_min_mm': best * 1000, 'certified_lower_bound_mm': None,
            'edge_spacing_mm': spacing * 1000, 'limitation': 'Edge samples do not cover triangle interiors.'}


def section_radii(mesh, y_mm):
    """Intersect triangles with the axial plane, including segment interior minima."""
    tr = mesh.pts[mesh.tri] * 1000
    selected = tr[(tr[:, :, 1].min(1) < y_mm) & (tr[:, :, 1].max(1) > y_mm)]
    segments = []
    for t in selected:
        pts = []
        for i in range(3):
            p, q = t[i], t[(i + 1) % 3]
            if (p[1] - y_mm) * (q[1] - y_mm) <= 0 and abs(q[1] - p[1]) > 1e-10:
                pts.append((p + (q - p) * ((y_mm - p[1]) / (q[1] - p[1])))[[0, 2]])
        if len(pts) == 2:
            segments.append(pts)
    if not segments:
        return None
    ss = np.array(segments)
    p, d = ss[:, 0], ss[:, 1] - ss[:, 0]
    den = np.sum(d * d, axis=1)
    f = np.clip(-np.sum(p * d, axis=1) / np.maximum(den, 1e-30), 0, 1)
    return {'min_r_mm': float(np.linalg.norm(p + d * f[:, None], axis=1).min()),
            'max_r_mm': float(np.linalg.norm(ss, axis=2).max()), 'segments': len(ss)}


def section_segments(mesh, y_mm):
    tr = mesh.pts[mesh.tri] * 1000
    selected = tr[(tr[:, :, 1].min(1) < y_mm) & (tr[:, :, 1].max(1) > y_mm)]
    segments = []
    for t in selected:
        pts = []
        for i in range(3):
            p, q = t[i], t[(i + 1) % 3]
            if (p[1] - y_mm) * (q[1] - y_mm) <= 0 and abs(q[1] - p[1]) > 1e-10:
                pts.append((p + (q - p) * ((y_mm - p[1]) / (q[1] - p[1])))[[0, 2]].tolist())
        if len(pts) == 2:
            segments.append(pts)
    return segments


def ray_trace(tree, point, direction, epsilon):
    origin, d = Vector(point), Vector(direction).normalized()
    start, rows = origin.copy(), []
    for _ in range(64):
        loc, normal, idx, distance = tree.ray_cast(origin, d)
        if loc is None:
            break
        rows.append({'location_mm': (loc * 1000)[:], 'triangle': idx,
                     'from_witness_mm': (loc - start).length * 1000,
                     'normal_dot_ray': normal.dot(d)})
        origin = loc + d * epsilon
    return {'hits': rows, 'count': len(rows), 'parity': len(rows) % 2,
            'limit_reached': len(rows) == 64}


def render_section(sections, witness, output):
    """Render exact plane/triangle intersections, not a convex hull or filled void."""
    scene = bpy.context.scene
    for o in scene.objects:
        o.hide_render = True
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x, scene.render.resolution_y = 1200, 1000
    scene.render.resolution_percentage = 100
    if scene.world is None:
        scene.world = bpy.data.worlds.new('SECTION_WORLD')
    scene.world.color = (0.012, 0.012, 0.012)
    scene.view_settings.view_transform = 'Standard'
    colors = {'legacy_shaft': (0.02, 0.75, 0.2, 1), 'approved_shaft': (0.0, 0.65, 1.0, 1),
              'legacy_housing': (0.65, 0.65, 0.65, 1), 'approved_housing': (1, 0.65, 0.05, 1)}
    for key, segments in sections.items():
        curve = bpy.data.curves.new(key, 'CURVE')
        curve.dimensions, curve.bevel_depth, curve.bevel_resolution = '3D', 0.025, 2
        for p, q in segments:
            spline = curve.splines.new('POLY')
            spline.points.add(1)
            for v, point in zip(spline.points, (p, q)):
                v.co = (point[0], point[1], 0.0 if key.startswith('legacy') else 0.1, 1)
        material = bpy.data.materials.new(key)
        material.diffuse_color = colors[key]
        material.use_nodes = True
        material.node_tree.nodes.clear()
        emit = material.node_tree.nodes.new('ShaderNodeEmission')
        emit.inputs['Color'].default_value = colors[key]
        surface = material.node_tree.nodes.new('ShaderNodeOutputMaterial')
        material.node_tree.links.new(emit.outputs[0], surface.inputs['Surface'])
        curve.materials.append(material)
        obj = bpy.data.objects.new(key + '_SECTION', curve)
        scene.collection.objects.link(obj)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.15,
                                       location=(witness[0], witness[2], 0.3))
    dot = bpy.context.object
    dot.data.materials.append(material.copy())
    dot.data.materials[0].node_tree.nodes.get('Emission').inputs['Color'].default_value = (1, 0.05, 0.05, 1)
    cam_data = bpy.data.cameras.new('SECTION_CAMERA')
    cam = bpy.data.objects.new('SECTION_CAMERA', cam_data)
    scene.collection.objects.link(cam)
    cam.location, cam_data.type, cam_data.ortho_scale = (0, 0, 100), 'ORTHO', 42
    scene.camera = cam
    scene.render.filepath = str(output)
    scene.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)


def housing_diagnostics(legacy, approved, old_housing, new_housing, old_obj, new_obj, out):
    witness = [3.1370711512863636, 9.989166632294655, -5.127716964731614]
    p = np.array(witness) / 1000
    result = {'witness_shaft_local_mm': witness, 'source': 'Prior majority-parity candidate; not a confirmed penetration',
              'pairs': {}, 'sections': {}, 'rays': {}}
    for label, shaft, housing, obj in (('legacy', legacy, old_housing, old_obj),
                                        ('approved', approved, new_housing, new_obj)):
        loc, normal, idx, dist = housing.tree.find_nearest(Vector(p))
        result['pairs'][label] = {'triangle_crossings': len(shaft.tree.overlap(housing.tree)),
            'nearest_surface_distance_mm': dist * 1000, 'nearest_surface_mm': (loc * 1000)[:],
            'nearest_triangle': idx, 'normal_dot_point_minus_surface_mm': (Vector(p) - loc).dot(normal) * 1000,
            'topology_weld_1um': g0.topology(obj, 1e-6),
            'housing_section': section_radii(housing, witness[1]), 'shaft_section': section_radii(shaft, witness[1])}
        result['sections'][label + '_shaft'] = section_segments(shaft, witness[1])
        result['sections'][label + '_housing'] = section_segments(housing, witness[1])
        dirs = DIRS + [Vector(v) for v in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))]
        result['rays'][label] = [{'direction': d[:], 'epsilon_mm': epsilon * 1000,
                                 **ray_trace(housing.tree, p, d, epsilon)}
                                for epsilon in (1e-8, 1e-7, 1e-6) for d in dirs]
    out.write_text(json.dumps(result, indent=1, allow_nan=False) + '\n', encoding='utf-8')
    render_section(result['sections'], witness, out.parent / 'housing-section.png')
    return result


def radial_profile(shaft, ring, y0, y1, step=0.1):
    rows = []
    for y in np.arange(y0, y1 + 1e-9, step):
        rows.append({'y_mm': round(float(y), 3), 'shaft': section_radii(shaft, y),
                     'ring': section_radii(ring, y)})
    return rows


def gear_sections(old, new, planets):
    """Same angular samples on old/new shaft surfaces, in the unchanged planet rest pose."""
    result = []
    for y in (4, 6, 8.9, 9.15, 9.2, 9.25, 9.3, 9.35, 9.4, 9.45, 9.5, 9.52, 9.55, 9.6, 9.75, 9.9, 10, 10.15):
        pts = []
        for mesh in (old, new):
            pp = []
            for i in range(3600):
                theta = i * math.pi / 1800
                loc = mesh.tree.ray_cast(Vector((0, y / 1000, 0)),
                                         Vector((math.cos(theta), 0, math.sin(theta))), 0.02)[0]
                if loc is None:
                    raise RuntimeError('Incomplete shaft section')
                pp.append(tuple(loc))
            pts.append(np.array(pp))
        r0, r1 = [np.hypot(p[:, 0], p[:, 2]) * 1000 for p in pts]
        row = {'y_mm': y, 'angular_step_deg': 0.1, 'same_clock_radial_max_delta_mm': float(np.abs(r1 - r0).max()),
               'radial_delta_new_minus_old_mm': {'min': float((r1 - r0).min()), 'max': float((r1 - r0).max()),
                   'max_abs_at_azimuth_deg': float(np.argmax(np.abs(r1 - r0))) / 10},
               'planets': {}}
        for name, planet in planets.items():
            measurements = []
            for pp in pts:
                inside = []
                closest = None
                lo, hi = planet.pts.min(0), planet.pts.max(0)
                for i in range(len(pp)):
                    p = pp[i]
                    loc, normal, _, dist = planet.tree.find_nearest(Vector(p))
                    if closest is None or dist * 1000 < closest['unsigned_distance_mm']:
                        closest = {'unsigned_distance_mm': dist * 1000, 'point_shaft_local_mm': (p * 1000).tolist(),
                                   'nearest_planet_surface_mm': (loc * 1000)[:], 'azimuth_deg': i / 10}
                    votes = votes_inside(planet.tree, p) if np.all((p >= lo) & (p <= hi)) else 0
                    if votes >= 2:
                        inside.append({'signed_distance_mm': -dist * 1000, 'inside_votes': votes,
                                       'normal_inside': (Vector(p) - loc).dot(normal) < 0,
                                       'point_shaft_local_mm': (p * 1000).tolist(), 'azimuth_deg': i / 10})
                measurements.append({'inside_angular_samples': len(inside),
                    'max_depth_mm': max((-v['signed_distance_mm'] for v in inside), default=0.0),
                    'sampled_nearest_surface': closest,
                    'deepest_witness': min(inside, key=lambda v: v['signed_distance_mm'], default=None)})
            row['planets'][name] = {'legacy': measurements[0], 'approved': measurements[1],
                'depth_delta_mm': measurements[1]['max_depth_mm'] - measurements[0]['max_depth_mm']}
        result.append(row)
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', type=Path, default=REVIEW / 'contact-classification.json')
    ap.add_argument('--housing-only', action='store_true')
    args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    out = args.out.resolve()
    if REVIEW.resolve() not in out.parents:
        raise ValueError('Output must stay inside mechanical-review')
    out.parent.mkdir(parents=True, exist_ok=True)
    registry_path = EV / 'geometry/reviewer-rerun/source-registry.json'
    registry = json.loads(registry_path.read_text(encoding='utf-8'))
    if not registry['source_hashes_unchanged_after_run']:
        raise RuntimeError('Independent measure_g0 rerun did not verify immutability')
    inputs = [Path(s['path']) for s in registry['sources'] if s.get('baseline_match') or s['path'].endswith('Default.glb')]
    inputs += [Path(__file__), ROOT / 'scripts/manufacturing/measure_g0.py', registry_path,
               EV / 'geometry/source-registry.json', EV / 'geometry/FINDINGS.md',
               EV / 'geometry/measurement-summary.json', ROOT / 'docs/jgun-manufacturing-inspection-plan.md',
               EV / 'camera/clearance.json', EV / 'camera/blockout.json']
    before = {str(p): g0.sha(p) for p in inputs}
    for s in registry['sources']:
        if str(Path(s['path'])) in before and before[str(Path(s['path']))] != s['sha256']:
            raise RuntimeError('Input no longer matches independent rerun: ' + s['path'])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    live = g0.import_meshes(ROOT / 'public/models/Default.glb')
    shaft_obj = bpy.data.objects['P001835-2']
    inv = shaft_obj.matrix_world.inverted()
    legacy = Mesh('legacy_shaft', shaft_obj)
    names = {'P000247-1', 'P000247-1.001', 'P000247-1.002', 'P000247-1.003',
             'K000131-1', 'K000131-1.001', 'ROTOR-1', 'K000211-1', 'K000210-1', 'P000725-1', 'K000180-1'}
    nb = {o.name: Mesh(o.name, o, inv @ o.matrix_world) for o in live if o.name in names}
    if set(nb) != names:
        raise RuntimeError('Required occurrences missing: ' + str(names - set(nb)))
    revised_obj = g0.import_meshes(SHIFTED / 'p001835-hobbed.glb')[0]
    approved = Mesh('approved_shaft', revised_obj, revised_obj.matrix_world)
    new = {}
    imported_new = g0.import_meshes(SHIFTED / 'k000210-k000211-moved.glb') + g0.import_meshes(SHIFTED / 'p000725-modified.glb')
    for o in imported_new:
        new[o.name] = Mesh(o.name, o, o.matrix_world)
    if args.housing_only:
        result = housing_diagnostics(legacy, approved, nb['P000725-1'], new['housing_NEW'],
            next(o for o in live if o.name == 'P000725-1'), next(o for o in imported_new if o.name == 'housing_NEW'), out)
        for p, digest in before.items():
            if g0.sha(Path(p)) != digest:
                raise RuntimeError('Source changed during housing diagnosis: ' + p)
        result['source_sha256_before'], result['source_hashes_unchanged_after_run'] = before, True
        out.write_text(json.dumps(result, indent=1, allow_nan=False) + '\n', encoding='utf-8')
        print('HOUSING_DIAGNOSTICS_DONE ' + str(out), flush=True)
        return
    result = {'schema': 'jgun-contact-classification/v2', 'blender': bpy.app.version_string, 'units': 'mm unless noted',
              'status': 'incomplete', 'source_sha256_before': before,
              'method': {'sampling': 'vertices+triangle centroids+edge midpoints of each mesh vs the other mesh; inside by 3-direction ray-parity majority; depth = distance to nearest opposing surface',
                         'distance_window_mm': None, 'y_bin_mm': BIN_MM, 'export_uncertainty_mm': EXPORT_UNC_MM,
                         'numeric_contact_screen_mm': CONTACT_SCREEN_MM,
                         'depth_note': 'Signed depths are negative inside, conditional on ray-parity sign; sample maxima do not upper-bound unsampled penetration. No CAD chord error, tolerance or continuous moving-gear fit certification. Split/non-manifold geometry and ray disagreements limit solid interpretation.'},
              'pairs': {}}
    jobs = []
    for n in ('P000247-1', 'P000247-1.001', 'P000247-1.002', 'P000247-1.003', 'K000131-1', 'K000131-1.001', 'ROTOR-1'):
        jobs.append((n, 'same_neighbour_pose', legacy, nb[n], approved, nb[n]))
    jobs.append(('ring K000211', 'matched_pair', legacy, nb['K000211-1'], approved, new['ring_NEW']))
    jobs.append(('bearing K000210', 'matched_pair', legacy, nb['K000210-1'], approved, new['bearing_NEW']))
    jobs.append(('housing P000725', 'matched_pair', legacy, nb['P000725-1'], approved, new['housing_NEW']))
    for label, kind, s0, n0, s1, n1 in jobs:
        old, nw = contact(s0, n0), contact(s1, n1)
        shift = 2.75 if label in ('ring K000211', 'bearing K000210') else 0.0
        result['pairs'][label] = {'kind': kind, 'legacy': old, 'approved': nw, 'comparison': compare(old, nw, shift)}
        print('PAIR', label, json.dumps(result['pairs'][label]['comparison']), flush=True)
        out.write_text(json.dumps(result, indent=1, allow_nan=False) + '\n', encoding='utf-8')
    # Wrong-pair controls (what the producer's ring_NEW-vs-legacy-shaft count measured).
    result['controls_wrong_pair'] = {'new_ring_vs_legacy_shaft': contact(legacy, new['ring_NEW']),
                                     'legacy_ring_vs_approved_shaft': contact(approved, nb['K000211-1'])}
    result['ring_radial_profile'] = {'legacy': radial_profile(legacy, nb['K000211-1'], 11.7, 16.6),
                                     'approved': radial_profile(approved, new['ring_NEW'], 14.45, 19.35)}
    result['gear_sections'] = gear_sections(legacy, approved, {n: nb[n] for n in sorted(nb) if n.startswith('P000247')})
    result['spring_K000180-1'] = {'legacy_shaft': refined_min_distance(legacy, nb['K000180-1']),
                                  'approved_shaft': refined_min_distance(approved, nb['K000180-1'])}
    print('SPRING', json.dumps(result['spring_K000180-1']), flush=True)
    for p, digest in before.items():
        if g0.sha(Path(p)) != digest:
            raise RuntimeError('Source changed during classification: ' + p)
    result['source_hashes_unchanged_after_run'] = True
    result['status'] = 'measured_classification_requires_review'
    out.write_text(json.dumps(result, indent=1, allow_nan=False) + '\n', encoding='utf-8')
    print('CLASSIFY_CONTACTS_DONE ' + str(out), flush=True)


if __name__ == '__main__':
    main()
