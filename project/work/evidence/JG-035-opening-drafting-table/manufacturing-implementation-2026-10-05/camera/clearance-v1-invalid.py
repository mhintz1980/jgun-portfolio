"""Swept illustrative-tool clearance study against the accepted CAD.

Run: Blender -b --factory-startup --python clearance.py
Read-only on the approved source. Writes clearance.json beside this script.

Two tests, each stated with what it can and cannot prove:
1. HULL vs RETAINED NEIGHBOURS. The full rotational hull of each represented tool
   (solid of revolution containing every tooth/ridge) is swept along the whole
   infeed / feed / withdrawal path and its sampled surface is measured against the
   journal-side shaft (y >= leadout end), housing, bearing and ring BVHs. The hull
   contains the real tool, so a positive hull separation bounds the real separation.
2. GENERATING-POSE FIT vs the accepted work zone. The ridged hob / toothed shaper
   is placed with the signed work/tool coupling and scanned over tool phase and
   work clock angle. Penetration depth into the accepted shaft is read from a
   signed distance field. Any penetration found at a sample is a certain
   violation; absence of penetration at samples is only a lower bound on fit
   (tool phase is sampled, not swept continuously).
"""
import hashlib
import json
import math
import time
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

OUT = Path(__file__).resolve().parent
SOURCE = Path(r'C:\Projects\CAD\jgun-input-shaft-hobbed\shifted')
BLEND_SHA = '88d1ce4ac7ca112adcd370e77852cfb9977dfec81b4bfcb61ee1872895574a89'
REPORT = json.loads((SOURCE / 'build-report.json').read_text())
assert hashlib.sha256((SOURCE / 'input-shaft-assembly-parts-v1.blend').read_bytes()).hexdigest() == BLEND_SHA

MM = 1e-3
ROOT_R = REPORT['root_r_mm']          # 4.297858
FACE_START = REPORT['y_face_mm']      # 3.174858
FACE_END = REPORT['y_functional_end_mm']   # 9.524858
LEADOUT_END = REPORT['leadout_end_y_mm']   # 14.063948
# Uncertainty terms in mm: export/decode 0.002 and comparison/contact 0.02 are
# the geometry worker's measured screens; the rest are computed per test below.
U_EXPORT = 0.002
U_COMPARE = 0.02

bpy.ops.wm.open_mainfile(filepath=str(SOURCE / 'input-shaft-assembly-parts-v1.blend'))
deps = bpy.context.evaluated_depsgraph_get()


def bvh_for(name, poly_filter=None):
    ob = bpy.data.objects[name]
    me = ob.evaluated_get(deps).to_mesh()
    verts = [tuple(ob.matrix_world @ v.co) for v in me.vertices]
    polys = [tuple(p.vertices) for p in me.polygons]
    if poly_filter is not None:
        polys = [p for p in polys if poly_filter(np.mean([verts[i] for i in p], axis=0))]
    return BVHTree.FromPolygons(verts, polys), len(polys)


t0 = time.time()
shaft_tree, shaft_polys = bvh_for('SHAFT_P001835_HOBBED_NEW')
journal_tree, journal_polys = bvh_for('SHAFT_P001835_HOBBED_NEW', lambda c: c[1] >= LEADOUT_END * MM)
neighbours = {'shaft_journal_side_y>=%.4f' % LEADOUT_END: journal_tree}
neighbour_polys = {'shaft_journal_side_y>=%.4f' % LEADOUT_END: journal_polys}
for key, name in (('housing', 'housing_NEW'), ('bearing', 'bearing_NEW'), ('ring', 'ring_NEW')):
    neighbours[key], neighbour_polys[key] = bvh_for(name)
print('G0_CLEAR_BVH', round(time.time() - t0, 1), 's', neighbour_polys, shaft_polys, flush=True)

# ---------------- signed distance field of the accepted shaft work zone -------------
H = 0.1 * MM
LO = np.array([-7.0, 0.0, 2.0]) * MM
HI = np.array([7.0, 15.0, 7.2]) * MM
axes = [np.arange(LO[i], HI[i] + H / 2, H) for i in range(3)]
SHAPE = tuple(len(a) for a in axes)
t0 = time.time()
sdf = np.empty(SHAPE, dtype=np.float32)
for ix, x in enumerate(axes[0]):
    for iy, y in enumerate(axes[1]):
        for iz, z in enumerate(axes[2]):
            loc, nor, idx, dist = shaft_tree.find_nearest(Vector((x, y, z)))
            sdf[ix, iy, iz] = dist if (Vector((x, y, z)) - loc).dot(nor) >= 0 else -dist
print('G0_CLEAR_SDF', round(time.time() - t0, 1), 's', SHAPE, flush=True)

# Sign check: ray-parity vote on random in-grid points (non-manifold edge present).
rng = np.random.default_rng(7)
agree = total = 0
for _ in range(1500):
    p = LO + rng.random(3) * (HI - LO)
    votes = 0
    for d in ((1, 0, 0), (0, 0, 1), (-.577, .577, .577)):
        hits, o = 0, Vector(p)
        direction = Vector(d).normalized()
        while True:
            loc, nor, idx, dist = shaft_tree.ray_cast(o, direction)
            if loc is None:
                break
            hits += 1
            o = loc + direction * 1e-9
        votes += hits % 2
    inside_ray = votes >= 2
    ip = ((p - LO) / H).round().astype(int)
    inside_sdf = sdf[tuple(np.clip(ip, 0, np.array(SHAPE) - 1))] < 0
    agree += int(inside_ray == inside_sdf)
    total += 1
SIGN_AGREEMENT = agree / total
print('G0_CLEAR_SIGN_AGREEMENT', SIGN_AGREEMENT, flush=True)


def sample_sdf(points):
    """Trilinear sample of the shaft SDF; points outside the grid get +inf."""
    g = (points - LO) / H
    ok = np.all((g >= 0) & (g <= np.array(SHAPE) - 1.001), axis=1)
    out = np.full(len(points), np.inf)
    gg = g[ok]
    i0 = np.floor(gg).astype(int)
    f = gg - i0
    acc = np.zeros(len(gg))
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                acc += w * sdf[i0[:, 0] + dx, i0[:, 1] + dy, i0[:, 2] + dz]
    out[ok] = acc
    return out


# ---------------- tool models (match blockout.py parameters) ------------------------
class Hob:
    def __init__(self, tip_r_mm=4.0, ridge_half_width=0.18, body_len_mm=16.0, module_mm=1.0, ridge_h_mm=1.0):
        self.tip_r = tip_r_mm * MM
        self.base_r = (tip_r_mm - ridge_h_mm) * MM
        self.ridge_h = ridge_h_mm * MM
        self.w = ridge_half_width
        self.half_len = body_len_mm * MM / 2
        self.pitch_d = (2 * tip_r_mm - 2 * module_mm) * MM  # tip - 2 modules? keeps 7/8 mm pair when tip 4 -> pitch 3.5 mm radius
        self.gamma = math.asin(module_mm / (self.pitch_d / MM))
        self.lead = math.pi * self.pitch_d * math.tan(self.gamma)
        self.axis = np.array([math.cos(self.gamma), math.sin(self.gamma), 0.0])
        self.cross = np.array([-math.sin(self.gamma), math.cos(self.gamma), 0.0])
        step = 0.1 * MM
        a = np.arange(-self.half_len, self.half_len + step / 2, step)
        nphi = int(math.ceil(2 * math.pi * self.tip_r / step))
        phi = np.arange(nphi) * 2 * math.pi / nphi
        self.A, self.PHI = np.meshgrid(a, phi, indexing='ij')
        self.A, self.PHI = self.A.ravel(), self.PHI.ravel()
        # End caps: concentric rings out to the base radius.
        rc = np.arange(step, self.base_r + step / 2, step)
        cap_a, cap_phi, cap_r = [], [], []
        for sgn in (-1, 1):
            for r in rc:
                n = max(8, int(math.ceil(2 * math.pi * r / step)))
                ph = np.arange(n) * 2 * math.pi / n
                cap_a.append(np.full(n, sgn * self.half_len)); cap_phi.append(ph); cap_r.append(np.full(n, r))
        self.cap = (np.concatenate(cap_a), np.concatenate(cap_phi), np.concatenate(cap_r))

    def points(self, alpha, centre):
        """Tool points, RH rotation alpha about +axis, centre in metres (shaft-local)."""
        rel = self.PHI - alpha
        phase = (self.A / self.lead - rel / (2 * math.pi)) % 1.0
        ridge = np.maximum(0, 1 - np.abs(phase - .5) / self.w)
        r = self.base_r + self.ridge_h * ridge
        gash = (np.floor((rel % (2 * math.pi)) / (2 * math.pi) * 160).astype(int) % 16) < 3
        r = np.where(gash, self.base_r - 0.1 * MM, r)
        ca, cp, cr = self.cap
        a = np.concatenate([self.A, ca])
        phi = np.concatenate([self.PHI, cp])
        rr = np.concatenate([r, cr])
        return (a[:, None] * self.axis + (rr * np.cos(phi))[:, None] * self.cross
                + (rr * np.sin(phi))[:, None] * np.array([0, 0, 1.0]) + np.asarray(centre))

    def hull_points(self, centre, step=0.1 * MM):
        a = np.arange(-self.half_len, self.half_len + step / 2, step)
        nphi = int(math.ceil(2 * math.pi * self.tip_r / step))
        phi = np.arange(nphi) * 2 * math.pi / nphi
        A, P = np.meshgrid(a, phi, indexing='ij')
        rr = np.full(A.shape, self.tip_r)
        pts = [(A.ravel()[:, None] * self.axis + (rr * np.cos(P)).ravel()[:, None] * self.cross
                + (rr * np.sin(P)).ravel()[:, None] * np.array([0, 0, 1.0]))]
        for sgn in (-1, 1):
            for r in np.arange(step, self.tip_r, step):
                n = max(8, int(math.ceil(2 * math.pi * r / step)))
                ph = np.arange(n) * 2 * math.pi / n
                pts.append(sgn * self.half_len * self.axis + (r * np.cos(ph))[:, None] * self.cross
                           + (r * np.sin(ph))[:, None] * np.array([0, 0, 1.0]))
        return np.vstack(pts) + np.asarray(centre)


class Shaper:
    """Disc pinion, axis +Y, 20 teeth, same 4-of-8-segment tooth block as blockout.py."""
    def __init__(self, tip_r_mm=11.0, root_r_mm=8.75, thick_mm=1.2, teeth=20):
        self.tip_r, self.root_r, self.thick, self.teeth = tip_r_mm * MM, root_r_mm * MM, thick_mm * MM, teeth
        n = teeth * 8
        self.vphi = np.arange(n + 1) * 2 * math.pi / n
        self.vr = np.array([self.tip_r if (i % 8) in (2, 3, 4, 5) else self.root_r for i in range(n)] + [self.root_r])
        step = 0.1 * MM
        self.nph = int(math.ceil(2 * math.pi * self.tip_r / step))
        self.phi = np.arange(self.nph) * 2 * math.pi / self.nph
        self.ys = np.arange(-self.thick / 2, self.thick / 2 + step / 2, step)

    def radius(self, phi_local):
        return np.interp(phi_local % (2 * math.pi), self.vphi, self.vr)

    def points(self, alpha, centre):
        """alpha: RH rotation about +Y. phi increases x->z (that is RH about -Y), so local = world + alpha."""
        loc = self.phi + alpha
        r = self.radius(loc)
        pts = []
        for y in self.ys:
            pts.append(np.column_stack((r * np.cos(self.phi), np.full(self.nph, y), r * np.sin(self.phi))))
        for sgn in (-1, 1):
            for k in range(1, 41):
                rk = self.root_r - 0.2 * MM + (r - self.root_r + 0.2 * MM) * k / 40
                pts.append(np.column_stack((rk * np.cos(self.phi), np.full(self.nph, sgn * self.thick / 2), rk * np.sin(self.phi))))
        return np.vstack(pts) + np.asarray(centre)

    def hull_points(self, centre, step=0.1 * MM):
        pts = []
        for y in self.ys:
            pts.append(np.column_stack((self.tip_r * np.cos(self.phi), np.full(self.nph, y), self.tip_r * np.sin(self.phi))))
        for sgn in (-1, 1):
            for r in np.arange(step, self.tip_r, step):
                n = max(8, int(math.ceil(2 * math.pi * r / step)))
                ph = np.arange(n) * 2 * math.pi / n
                pts.append(np.column_stack((r * np.cos(ph), np.full(n, sgn * self.thick / 2), r * np.sin(ph))))
        return np.vstack(pts) + np.asarray(centre)


def rot_y(points, angle):
    """Rotate points RH about +Y by angle."""
    c, s = math.cos(angle), math.sin(angle)
    x, z = points[:, 0].copy(), points[:, 2].copy()
    q = points.copy()
    q[:, 0] = x * c + z * s
    q[:, 2] = -x * s + z * c
    return q


def zone_of(y_mm):
    if y_mm < FACE_START: return 'pre-face'
    if y_mm <= FACE_END: return 'functional-face'
    if y_mm <= LEADOUT_END: return 'leadout-ramp'
    return 'journal-side'


def hull_clearance(tool, path, step_mm, dmax_mm=6.0):
    """Minimum sampled hull-to-neighbour distance over the whole pose path (mm)."""
    summary = {k: {'min_signed_mm': None, 'pose': None} for k in neighbours}
    base_pts = None
    for pose in path:
        pts = tool.hull_points(pose['centre_m'])
        # Only points that can be within dmax of the journal side / supports.
        pts = pts[pts[:, 1] > (LEADOUT_END - dmax_mm) * MM]
        for key, tree in neighbours.items():
            best = None
            for p in pts:
                loc, nor, idx, dist = tree.find_nearest(Vector(p), dmax_mm * MM)
                if loc is None:
                    continue
                s = dist if (Vector(p) - loc).dot(nor) >= 0 else -dist
                if best is None or s < best:
                    best = s
            if best is not None and (summary[key]['min_signed_mm'] is None or best / MM < summary[key]['min_signed_mm']):
                summary[key] = {'min_signed_mm': best / MM, 'pose': pose['label']}
    return summary


def scan_fit(tool, kind, y_centres_mm, z_centre_m, sign, theta_steps, alpha_steps, alpha_period):
    """Generating-pose scan. Returns per-y best coupling clock and its worst penetration (mm)."""
    result = {}
    ratio = 10.0 if kind == 'hob' else 2.0       # |omega_cutter| / |omega_work| inverse: work = sign*? see below
    for y_mm in y_centres_mm:
        centre = np.array([0.0, y_mm * MM, z_centre_m])
        best = None
        per_theta = []
        for th0 in theta_steps:
            worst, worst_info = 0.0, None
            for alpha in alpha_steps:
                work_ratio = (0.1 if kind == 'hob' else 2.0)
                theta = th0 + sign * work_ratio * alpha
                pts = tool.points(alpha, centre)
                pts = rot_y(pts, -theta)      # work rotated by theta == tool rotated by -theta in shaft frame
                d = sample_sdf(pts)
                m = d.min()
                if m < worst:
                    k = int(np.argmin(d))
                    worst, worst_info = float(m), {'alpha_deg': math.degrees(alpha), 'theta_deg': math.degrees(theta),
                                                   'y_mm': float(pts[k, 1] / MM), 'zone': zone_of(float(pts[k, 1] / MM))}
            per_theta.append((th0, worst, worst_info))
            if best is None or worst > best[1]:
                best = (th0, worst, worst_info)
        result[y_mm] = {'best_clock_deg': math.degrees(best[0]), 'worst_penetration_mm': -best[1] / MM,
                        'at': best[2],
                        'median_over_clocks_mm': float(-np.median([w for _, w, _ in per_theta]) / MM)}
    return result


def make_path(kind, z_c, y0_mm, y1_mm, step_mm, lift_mm=3.0):
    path = []
    n = int(round(lift_mm / step_mm))
    for i in range(n, 0, -1):
        path.append({'label': 'infeed z+%.2f' % (i * step_mm), 'centre_m': np.array([0, y0_mm * MM, z_c + i * step_mm * MM])})
    m = int(round((y1_mm - y0_mm) / step_mm))
    for i in range(m + 1):
        path.append({'label': 'feed y=%.3f' % (y0_mm + i * step_mm), 'centre_m': np.array([0, (y0_mm + i * step_mm) * MM, z_c])})
    for i in range(1, n + 1):
        path.append({'label': 'withdraw z+%.2f' % (i * step_mm), 'centre_m': np.array([0, y1_mm * MM, z_c + i * step_mm * MM])})
    return path


def run_candidate(name, kind, tool, y0_mm, y1_mm, depth_clear_mm, signs=(-1, 1)):
    z_c = (ROOT_R + depth_clear_mm) * MM + tool.tip_r
    out = {'name': name, 'kind': kind, 'tip_radius_mm': tool.tip_r / MM, 'centre_z_mm': z_c / MM,
           'root_clearance_mm_at_nominal_depth': depth_clear_mm}
    t0 = time.time()
    step_mm = 0.5
    path = make_path(kind, z_c, y0_mm, y1_mm, step_mm)
    out['hull_vs_retained_neighbours'] = hull_clearance(tool, path, step_mm)
    out['hull_path'] = {'poses': len(path), 'step_mm': step_mm, 'y_range_mm': [y0_mm, y1_mm]}
    # Uncertainty (mm, linear sum, conservative): export + comparison + hull point spacing
    # 0.1 mm * 0.71 + half the pose step (distance is 1-Lipschitz in rigid translation).
    out['hull_uncertainty_mm'] = U_EXPORT + U_COMPARE + 0.071 + step_mm / 2
    print('G0_CLEAR_HULL', name, round(time.time() - t0, 1), flush=True)
    th = np.radians(np.arange(0, 36, 2.0))
    if kind == 'hob':
        al = np.radians(np.arange(0, 360, 5.0))
    else:
        al = np.radians(np.arange(0, 18, 0.75))
    ys = [y0_mm, (y0_mm + y1_mm) / 2, y1_mm]
    fit = {}
    for sign in signs:
        t1 = time.time()
        fit['work_sign_%+d' % sign] = scan_fit(tool, kind, ys, z_c, sign, th, al, None)
        print('G0_CLEAR_FIT', name, sign, round(time.time() - t1, 1), flush=True)
    out['generating_pose_fit_mm'] = fit
    out['fit_uncertainty_mm'] = U_EXPORT + U_COMPARE + 0.1 * 0.87 / 1.0  # grid 0.1 mm trilinear across a sharp edge, bound 0.087
    return out


candidates = []
# 1: candidate as drawn in blockout.py (shaper centre z 15.0 mm sits 0.3 mm below the accepted root).
shaper_drawn = Shaper()
candidates.append(('shaper_as_drawn_z15.0', 'shaper', shaper_drawn, 2.0748584, 10.3248584, 15.0 - 11.0 - ROOT_R))
candidates.append(('shaper_at_root_z15.298', 'shaper', Shaper(), 2.0748584, 10.3248584, 0.0))
candidates.append(('hob_as_drawn_tip4', 'hob', Hob(), FACE_START, FACE_END, 8.3 - 4.0 - ROOT_R))

results = []
for name, kind, tool, y0, y1, dc in candidates:
    results.append(run_candidate(name, kind, tool, y0, y1, dc))

(OUT / 'clearance.json').write_text(json.dumps({
    'schema': 'jgun-g0-clearance-v1', 'blender_version': bpy.app.version_string,
    'source_blend_sha256': BLEND_SHA, 'sdf': {'grid_mm': H / MM, 'shape': SHAPE, 'sign_agreement_vs_ray_parity': SIGN_AGREEMENT},
    'frame': 'shaft-local Blender metres; +Y shaft axis',
    'results': results}, indent=2, default=float) + '\n', encoding='utf-8')
print('G0_CLEARANCE_JSON', flush=True)
