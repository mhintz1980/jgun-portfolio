"""Process-correct occupancy witnesses and bounded complete rotational hulls.

Read-only accepted CAD; all dimensions millimetres. No source geometry is saved.
"""
import ast
import hashlib
import json
import math
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

OUT = Path(__file__).resolve().parent
SRC = Path(r'C:\Projects\CAD\jgun-input-shaft-hobbed\shifted')
BLEND = SRC / 'input-shaft-assembly-parts-v1.blend'
SHA = '88d1ce4ac7ca112adcd370e77852cfb9977dfec81b4bfcb61ee1872895574a89'
assert hashlib.sha256(BLEND.read_bytes()).hexdigest() == SHA
STUDY = json.loads((OUT / 'profile-study.json').read_text())
MM, U_NUMERIC = .001, .022
bpy.ops.wm.open_mainfile(filepath=str(BLEND))
deps = bpy.context.evaluated_depsgraph_get()

def geometry(name):
    ob = bpy.data.objects[name]
    me = ob.evaluated_get(deps).to_mesh()
    me.calc_loop_triangles()
    vv = np.array([tuple((ob.matrix_world @ v.co) * 1000) for v in me.vertices])
    tt = np.array([tuple(p.vertices) for p in me.loop_triangles])
    return vv, tt, BVHTree.FromPolygons(vv, tt, all_triangles=True)

GEO = {k: geometry(n) for k, n in [('legacy', 'SHAFT_P001835_ORIG'), ('approved', 'SHAFT_P001835_HOBBED_NEW')]}
ANG = np.arange(1440) * 2 * math.pi / 1440
YS = np.arange(0, 22.0001, .05)
fields, star_errors = {}, {}
for key, (_, _, tree) in GEO.items():
    rr = np.empty((len(YS), len(ANG)))
    for i, y in enumerate(YS):
        for j, phi in enumerate(ANG):
            d = Vector((math.cos(phi), 0, math.sin(phi)))
            hit, _, _, _ = tree.ray_cast(d * 20 + Vector((0, y, 0)), -d, 20)
            rr[i, j] = math.hypot(hit.x, hit.z) if hit is not None else 0
    fields[key] = rr
    error = 0
    for y in [3.5, 6, 9, 9.72, 10.92, 13.78, 14.18]:
        for phi in ANG[::4]:
            d = Vector((math.cos(phi), 0, math.sin(phi)))
            outer, _, _, _ = tree.ray_cast(d * 20 + Vector((0, y, 0)), -d, 20)
            inner, _, _, _ = tree.ray_cast(Vector((0, y, 0)), d, 20)
            error = max(error, (outer - inner).length) if outer is not None and inner is not None else float('inf')
    star_errors[key] = error
    print('OCCUPANCY', key, error, flush=True)

def radial_field(key, p):
    a = (np.arctan2(p[:, 2], p[:, 0]) % (2*math.pi)) / (2*math.pi) * len(ANG)
    j, f = np.floor(a).astype(int) % len(ANG), a - np.floor(a)
    y = p[:, 1] / .05
    valid = (y >= 0) & (y <= len(YS)-1.001)
    i = np.clip(np.floor(y).astype(int), 0, len(YS)-2)
    g = np.clip(y-i, 0, 1)
    rr = fields[key]
    r0 = rr[i, j]*(1-f) + rr[i, (j+1)%len(ANG)]*f
    r1 = rr[i+1, j]*(1-f) + rr[i+1, (j+1)%len(ANG)]*f
    return np.where(valid, np.hypot(p[:, 0], p[:, 2]) - (r0*(1-g)+r1*g), np.inf)

def rotate_y(p, a):
    q = p.copy()
    q[:, 0] = p[:, 0]*math.cos(a)+p[:, 2]*math.sin(a)
    q[:, 2] = -p[:, 0]*math.sin(a)+p[:, 2]*math.cos(a)
    return q

# Candidate classes are reused without executing the invalid v1 tests.
parsed = ast.parse((OUT / 'clearance-v1-invalid.py').read_text())
exec(compile(ast.Module(body=[n for n in parsed.body if isinstance(n, ast.ClassDef)], type_ignores=[]), 'candidate definitions', 'exec'))

class MatchedShaper(Shaper):
    def __init__(self):
        rr = np.array(STUDY['matched_shaper_diagnostics'][0]['radii_mm'])*MM
        super().__init__(rr.max()/MM, rr.min()/MM, .6, 20)
        self.vphi, self.vr = np.arange(len(rr))*2*math.pi/len(rr), rr

def hob(radius, length):
    tool = Hob(radius, .18, length, 1, 1)
    tool.pitch_d = (2*radius-1)*MM
    tool.gamma = math.asin(1/(tool.pitch_d/MM))
    tool.lead = math.pi*tool.pitch_d*math.tan(tool.gamma)
    tool.axis = np.array([math.cos(tool.gamma), math.sin(tool.gamma), 0])
    tool.cross = np.array([-math.sin(tool.gamma), math.cos(tool.gamma), 0])
    return tool

def exact_witness(key, point):
    tree, p = GEO[key][2], Vector(point)
    hit, _, idx, distance = tree.find_nearest(p)
    d = Vector((p.x, 0, p.z)).normalized()
    outer, _, _, _ = tree.ray_cast(d*20+Vector((0, p.y, 0)), -d, 20)
    inner, _, _, _ = tree.ray_cast(Vector((0, p.y, 0)), d, 20)
    assert outer is not None and inner is not None
    inside = math.hypot(p.x, p.z) < math.hypot(outer.x, outer.z)
    error = (outer-inner).length
    return {'point_mm': list(p), 'inside_radial_solid': inside, 'reciprocal_ray_error_mm': error,
            'unsigned_nearest_mesh_distance_mm': distance, 'signed_distance_mm': -distance if inside else distance,
            'nearest_point_mm': list(hit), 'triangle': idx, 'validated': error < .002}

def scan(tool, kind, key, z, ys, clocks=True):
    out = []
    alphas = np.radians(np.arange(0, 18, .5) if kind == 'shaper' else np.arange(0, 360, 5))
    cs = np.radians(np.arange(0, 36, 1)) if clocks else [0]
    for y in ys:
        records = []
        for clock in cs:
            worst, witness = 0, None
            for a in alphas:
                theta = clock-(2 if kind == 'shaper' else .1)*a
                p = rotate_y(tool.points(a, [0, y*MM, z*MM])/MM, -theta)
                gap = radial_field(key, p)
                i = int(np.argmin(gap))
                if gap[i] < worst:
                    worst, witness = float(gap[i]), (p[i], math.degrees(a), math.degrees(theta))
            exact = exact_witness(key, witness[0]) if witness else None
            if exact:
                exact.update(alpha_deg=witness[1], work_deg=witness[2])
            records.append({'clock_deg': math.degrees(clock), 'radial_overlap_mm_sampled': -worst, 'witness': exact})
        signed = lambda r: r['witness']['signed_distance_mm'] if r['witness'] else 0
        best = max(records, key=signed)
        clock_error = 12*math.radians(.5) if clocks else 0
        all_valid = all(r['witness'] and r['witness']['validated'] and r['witness']['inside_radial_solid'] for r in records)
        bound = min(-signed(r) for r in records)-clock_error-U_NUMERIC if all_valid else None
        out.append({'centre_y_mm': y, 'best_clock': best, 'per_clock': records,
                    'all_clocks_penetration_lower_bound_mm': bound, 'clock_coverage_error_mm': clock_error,
                    'claim': 'Positive bound rejects every clock for this fixed tool/path. Null does not establish fit.'})
        print('FIT', key, kind, y, 'best_signed', signed(best), 'all_clock_bound', bound, flush=True)
    return out

def cylinder_sdf(p, centre, axis, r, h):
    q = p-centre
    a = q@axis
    v = np.column_stack((np.linalg.norm(q-a[:, None]*axis, axis=1)-r, np.abs(a)-h))
    return np.linalg.norm(np.maximum(v, 0), axis=1)+np.minimum(v.max(1), 0)

def clip_journal(vv, tt, y):
    out = []
    for tri in vv[tt]:
        poly, cut = list(tri), []
        for a, b in zip(poly, poly[1:]+poly[:1]):
            if a[1] >= y:
                cut.append(a)
            if (a[1] >= y) != (b[1] >= y):
                cut.append(a+(b-a)*((y-a[1])/(b[1]-a[1])))
        for i in range(1, len(cut)-1):
            out.append([cut[0], cut[i], cut[i+1]])
    return np.array(out)

def bounded_distance(tris, centre, axis, r, h):
    active, certified, sampled, witness = tris, float('inf'), float('inf'), None
    for depth in range(8):
        c = active.mean(1)
        cover = np.linalg.norm(active-c[:, None], axis=2).max(1)
        d = cylinder_sdf(c, centre, axis, r, h)
        j = int(np.argmin(d))
        if d[j] < sampled:
            sampled, witness = float(d[j]), c[j].tolist()
        low = d-cover
        refine = (low < sampled+.03) & (cover > .025)
        if (~refine).any():
            certified = min(certified, float(low[~refine].min()))
        if not refine.any():
            break
        if depth == 7:
            certified = min(certified, float(low[refine].min()))
            break
        a, b, c = active[refine, 0], active[refine, 1], active[refine, 2]
        ab, bc, ca = (a+b)/2, (b+c)/2, (c+a)/2
        active = np.concatenate([np.stack([a, ab, ca], 1), np.stack([ab, b, bc], 1),
                                 np.stack([ca, bc, c], 1), np.stack([ab, bc, ca], 1)])
    return certified, sampled, witness

def swept(tool, kind, key, z, y0, y1):
    vv, tt, _ = GEO[key]
    journal_y = 12 if key == 'legacy' else 14.18
    tris = clip_journal(vv, tt, journal_y)
    if kind == 'shaper':
        axis = np.array([0, 1, 0])
        components = [('cutter', tool.tip_r/MM, tool.thick/MM/2, 0), ('hub', 3, 2, -2.3),
                      ('arbor', 1.5, 8, -12.3), ('holder', 4, 3, -23.3)]
    else:
        axis, hl = tool.axis, tool.half_len/MM
        components = [('cutter', tool.tip_r/MM, hl, 0), ('left_arbor', 1.25, 4, -hl-4),
                      ('right_arbor', 1.25, 4, hl+4), ('left_holder', 2.5, 2, -hl-10), ('right_holder', 2.5, 2, hl+10)]
    anchors = np.array([(0, y0, z+3), (0, y0, z), (0, y1, z), (0, y1, z+2.5), (0, y0, z+2.5), (0, y0, z+5)])
    poses, step = [], 0
    for k, (a, b) in enumerate(zip(anchors, anchors[1:])):
        n = max(1, math.ceil(np.linalg.norm(b-a)/.2))
        step = max(step, float(np.linalg.norm(b-a)/n))
        poses.extend((k, a+(b-a)*i/n) for i in range(n+1))
    records = []
    for name, r, h, offset in components:
        best, sample, witness, pose = float('inf'), float('inf'), None, None
        for k, p in poses:
            centre = p+axis*offset
            lower, d, q = bounded_distance(tris, centre, axis, r, h)
            if lower < best:
                best, sample, witness, pose = lower, d, q, {'segment': k, 'centre_mm': centre.tolist()}
        bound = best-step/2-U_NUMERIC
        records.append({'component': name, 'radius_mm': r, 'half_length_mm': h, 'axis': axis.tolist(), 'axis_offset_mm': offset,
                        'sampled_signed_hull_distance_mm': sample, 'triangle_surface_lower_bound_mm': best,
                        'continuous_lower_bound_after_error_mm': bound, 'witness_mm': witness, 'pose': pose,
                        'status': 'PASS mesh separation' if bound > 0 else 'UNRESOLVED or hull overlap'})
        print('HULL', key, kind, name, bound, flush=True)
    return {'retained_domain_y_mm': journal_y, 'all_retained_triangles': len(tris), 'path_anchors_mm': anchors.tolist(),
            'maximum_translation_step_mm': step, 'translation_cover_error_mm': step/2, 'numeric_error_mm': U_NUMERIC,
            'rotation_time_error_mm': 0, 'rotation_reason': 'Exact rotational containing cylinder includes all phases.',
            'sagitta_error_mm': 0, 'sagitta_reason': 'Analytic cylinder contains polygonal tool. Full work triangle radius is subtracted.',
            'components': records, 'physical_cad_chord_uncertainty_mm': None,
            'scope': 'Isolated workpiece; housing/bearing/ring removed. No machine fixture certified.'}

results = []
for name, kind, key, tool, z, ys, y0, y1, clocks in [
    ('old_shaper_correct_legacy', 'shaper', 'legacy', Shaper(), 15, [6, 10.3248584], 2.0748584, 10.3248584, True),
    ('custom_matched_shaper', 'shaper', 'legacy', MatchedShaper(), 15.5, [6, 10.6], 2.8748584, 10.6, False),
    ('old_hob_consistent_7mm_pitch', 'hob', 'approved', hob(4, 16), 8.3, [6.35, 9.5248584], 3.1748584, 9.5248584, True),
    ('runout_radius_hob_candidate', 'hob', 'approved', hob(6, 3.2), 10.292, [6.35, 9.5248584], 3.1748584, 9.5248584, True),
]:
    results.append({'name': name, 'kind': kind, 'workpiece': key, 'centre_z_mm': z,
                    'fits': scan(tool, kind, key, z, ys, clocks), 'complete_represented_envelope': swept(tool, kind, key, z, y0, y1)})

(OUT/'clearance.json').write_text(json.dumps({'schema': 'jgun-g0-clearance-v2', 'blender_version': bpy.app.version_string,
    'source_blend_sha256': SHA, 'source_hash_unchanged_after_run': hashlib.sha256(BLEND.read_bytes()).hexdigest() == SHA,
    'reciprocal_ray_section_errors_mm': star_errors, 'occupancy_grid': {'axial_step_mm': .05, 'angular_step_deg': .25,
    'purpose': 'Find witnesses only; absence of sampled penetration is never accepted as fit.'}, 'results': results,
    'status': 'Diagnostics; full generating and retained-domain acceptance still required.',
    'superseded': 'clearance-v1-invalid.json: wrong shaper workpiece, unreliable sign, incomplete domain, inconsistent hob pitch.'}, indent=2)+'\n', encoding='utf-8')
print('G0_CLEARANCE_V2_DONE', flush=True)
