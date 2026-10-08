"""Read-only section measurements and inverse generating-envelope feasibility.

All dimensions here are millimetres. No source object is modified or saved.
"""
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
bpy.ops.wm.open_mainfile(filepath=str(BLEND))
deps = bpy.context.evaluated_depsgraph_get()

def tree_for(name):
    ob = bpy.data.objects[name]
    me = ob.evaluated_get(deps).to_mesh()
    return BVHTree.FromPolygons([tuple((ob.matrix_world @ v.co) * 1000) for v in me.vertices],
                               [tuple(p.vertices) for p in me.polygons])

ANG = np.arange(7200) * 2 * math.pi / 7200

def section(tree, y):
    rr = []
    for phi in ANG:
        d = Vector((math.cos(phi), 0, math.sin(phi)))
        p, _, _, _ = tree.ray_cast(d * 20 + Vector((0, y, 0)), -d, 20)
        assert p is not None, (y, phi)
        rr.append(math.hypot(p.x, p.z))
    return np.array(rr)

trees = {k: tree_for(n) for k, n in [('legacy', 'SHAFT_P001835_ORIG'),
                                    ('approved', 'SHAFT_P001835_HOBBED_NEW')]}
profiles = {k: {str(y): section(t, y).tolist() for y in [3.5, 6.0, 9.0, 9.72, 10.92, 13.78, 14.18]}
            for k, t in trees.items()}
print('PROFILE_SECTIONS', {k: {y: [min(r), max(r)] for y, r in v.items()} for k, v in profiles.items()}, flush=True)

work = np.array(profiles['legacy']['6.0'])
def radial(r, phi):
    return np.interp(phi % (2 * math.pi), np.r_[ANG, 2 * math.pi], np.r_[r, r[0]])

def rotate(x, z, a):
    return x * np.cos(a) + z * np.sin(a), -x * np.sin(a) + z * np.cos(a)

def inverse_shaper(teeth, centre, offset):
    # Trim each tool ray to the first work-solid encounter over the full coupled
    # cycle. First encounter is necessary because a larger radius can skip a solid.
    beta = ANG
    radius = np.full(len(beta), centre - min(work) - offset)
    rs = np.arange(centre - max(work) - .05, float(radius[0]) + .001, .0025)
    for alpha in np.arange(0, 2 * math.pi / teeth, math.radians(.025)):
        dx, dz = rotate(np.cos(beta), np.sin(beta), alpha)
        mask = (dz < 0) & (np.abs(dx) * centre < max(work) + offset)
        dx, dz = dx[mask], dz[mask]
        x = rs[:, None] * dx[None, :]
        z = rs[:, None] * dz[None, :] + centre
        x, z = rotate(x, z, teeth / 10 * alpha)
        gap = np.hypot(x, z) - radial(work, np.arctan2(z, x))
        hit = gap < offset
        first = np.argmax(hit, axis=0)
        radius[mask] = np.minimum(radius[mask], np.where(hit.any(0), rs[np.maximum(0, first - 1)], radius[mask]))
    # Enforce exact tooth repetition by the most restrictive ray of each sector.
    sector = len(beta) // teeth
    radius = np.tile(radius.reshape(teeth, sector).min(0), teeth)
    return np.interp(ANG, np.r_[beta, 2 * math.pi], np.r_[radius, radius[0]])

def forward_shaper(tool_r, teeth, centre):
    remaining = np.full(len(ANG), 20.0)
    worst_gap = 1e9
    for alpha in np.arange(0, 2 * math.pi / teeth, math.radians(.025)):
        x, z = rotate(tool_r * np.cos(ANG), tool_r * np.sin(ANG), alpha)
        z += centre
        x, z = rotate(x, z, teeth / 10 * alpha)
        phi = np.arctan2(z, x) % (2 * math.pi)
        rr = np.hypot(x, z)
        worst_gap = min(worst_gap, float(np.min(rr - radial(work, phi))))
        # Only the near/contact side contributes the removal envelope.
        ok = rr < max(work) + .5
        # Intersect work-angle rays with actual tool contour segments, rather
        # than rounding boundary points into bins (which leaves false stock).
        x1, z1 = np.roll(x, -1), np.roll(z, -1)
        p1 = np.arctan2(z1, x1) % (2 * math.pi)
        dp = (p1 - phi + math.pi) % (2 * math.pi) - math.pi
        lo = np.minimum(phi, phi + dp) / (2 * math.pi) * len(ANG)
        hi = np.maximum(phi, phi + dp) / (2 * math.pi) * len(ANG)
        start = np.ceil(lo).astype(int)
        count = np.floor(hi).astype(int) - start + 1
        ex, ez = x1 - x, z1 - z
        for k in range(int(max(count[ok], default=0))):
            use = ok & (count > k)
            idx = (start[use] + k) % len(ANG)
            dx, dz = np.cos(ANG[idx]), np.sin(ANG[idx])
            den = dx * ez[use] - dz * ex[use]
            good = np.abs(den) > 1e-12
            hit = (x[use] * ez[use] - z[use] * ex[use]) / np.where(good, den, 1)
            good &= hit >= 0
            np.minimum.at(remaining, idx[good], hit[good])
    # One coupled cutter-tooth cycle visits one work-tooth sector. Replicate the
    # removal envelope to the ten equivalent sectors before comparing the gear.
    remaining = np.tile(remaining.reshape(10, len(ANG) // 10).min(0), 10)
    unvisited = remaining == 20
    residual = np.minimum(remaining, max(work)) - work
    return {'minimum_radial_gap_mm_sampled': worst_gap,
            'maximum_unremoved_radial_stock_mm_sampled': float(residual.max()),
            'rms_unremoved_radial_stock_mm_sampled': float(np.sqrt(np.mean(residual ** 2))),
            'unvisited_angular_bins': int(unvisited.sum()),
            'note': 'Feasibility diagnostic only; radial differences are not Euclidean clearance or continuous proof.'}

results = []
for teeth, centre in [(20, 15.5)]:
    rr = inverse_shaper(teeth, centre, .005)
    fit = forward_shaper(rr, teeth, centre)
    print('MATCHED_SHAPER', teeth, centre, fit, flush=True)
    results.append({'teeth': teeth, 'centre_z_mm': centre, 'radii_mm': rr.tolist(), 'fit': fit})

(OUT / 'profile-study.json').write_text(json.dumps({'blender_version': bpy.app.version_string,
    'source_sha256': SHA, 'angular_step_deg': .05, 'profiles': profiles,
    'matched_shaper_diagnostics': results}, indent=2) + '\n', encoding='utf-8')
assert hashlib.sha256(BLEND.read_bytes()).hexdigest() == SHA
