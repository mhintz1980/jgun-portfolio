"""Inspection-clone phase study; no CAD, GLB or narrative transform is written."""
import argparse
import json
import math
import sys
from pathlib import Path

sys.dont_write_bytecode = True
REVIEW = Path(__file__).resolve().parent
ROOT = REVIEW.parents[6]  # GLM rerun copy: script lives one level deeper
sys.path.insert(0, str(ROOT / 'scripts/manufacturing'))
import classify_contacts as cc
import numpy as np
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

N = 3600
ANGLES = np.arange(N) * 2 * math.pi / N
UNIT = np.column_stack((np.cos(ANGLES), np.sin(ANGLES)))
YS = (4.0, 6.0, 8.9, 9.3, 9.45, 9.52, 9.6, 9.9)


def rotate(points, degrees, pivot=(0, 0)):
    angle = math.radians(degrees)
    mat = np.array(((math.cos(angle), -math.sin(angle)), (math.sin(angle), math.cos(angle))))
    pp = np.array(points, copy=True)
    pp[:, [0, 2]] = (pp[:, [0, 2]] - pivot) @ mat.T + pivot
    return pp


def pivot_from_bore(mesh):
    pts = np.unique(np.round(np.array(cc.section_segments(mesh, 6)).reshape(-1, 2), 7), axis=0)
    initial = (pts.min(0) + pts.max(0)) / 2
    radius = np.linalg.norm(pts - initial, axis=1)
    bore = pts[radius < radius.min() + 0.3]
    fit = np.linalg.lstsq(np.column_stack((2 * bore, np.ones(len(bore)))), np.sum(bore * bore, axis=1), rcond=None)[0]
    center = fit[:2]
    radii = np.linalg.norm(bore - center, axis=1)
    return center / 1000, {'pivot_xz_mm': center.tolist(), 'bore_fit_samples': len(bore),
        'bore_radius_mm': float(radii.mean()), 'bore_radius_spread_mm': float(np.ptp(radii)),
        'limitation': 'Circle fit to small-radius section endpoints; numeric fit, not a CAD datum tolerance.'}


def radial_outer(mesh, y, pivot):
    radii = []
    for direction in UNIT:
        origin = Vector((pivot[0] + 0.04 * direction[0], y / 1000, pivot[1] + 0.04 * direction[1]))
        hit = mesh.tree.ray_cast(origin, Vector((-direction[0], 0, -direction[1])), 0.04)[0]
        if hit is None:
            return None
        radii.append(math.hypot(hit.x - pivot[0], hit.z - pivot[1]))
    return np.array(radii)


def interpolate(profile, theta):
    index = (theta % (2 * math.pi)) * N / (2 * math.pi)
    base = np.floor(index).astype(int)
    weight = index - base
    return profile[base % N] * (1 - weight) + profile[(base + 1) % N] * weight


def radial_gap(sun_profile, planet_profile, pivot, sun_deg, planet_deg):
    radius = interpolate(sun_profile, ANGLES - math.radians(sun_deg))
    points = radius[:, None] * UNIT
    rel = points - pivot
    planet_radius = interpolate(planet_profile, np.arctan2(rel[:, 1], rel[:, 0]) - math.radians(planet_deg))
    return float(np.min(np.linalg.norm(rel, axis=1) - planet_radius) * 1000)


def signed_samples(points, opposing, pivot, rotation):
    # Inverse transforms query points into the original opposing mesh, never its source data.
    pp = rotate(points, -rotation, pivot)
    lo, hi = opposing.pts.min(0), opposing.pts.max(0)
    pp = pp[np.all((pp >= lo) & (pp <= hi), axis=1)]
    best, corroborated, ambiguous = None, None, 0
    for p in pp:
        loc, normal, _, dist = opposing.tree.find_nearest(Vector(p))
        if dist * 1000 < cc.CONTACT_SCREEN_MM:
            continue
        # A fast normal test screens candidates; parity remains the independent sign check.
        if (Vector(p) - loc).dot(normal) >= 0:
            continue
        votes = cc.votes_inside(opposing.tree, p)
        ambiguous += votes in (1, 2)
        if votes >= 2:
            row = {'signed_distance_mm': -dist * 1000, 'inside_votes': votes,
                   'point_in_opposing_source_datum_mm': (p * 1000).tolist()}
            if best is None or row['signed_distance_mm'] < best['signed_distance_mm']:
                best = row
            if votes == 3 and (corroborated is None or row['signed_distance_mm'] < corroborated['signed_distance_mm']):
                corroborated = row
    return {'above_screen_witness': best, 'unanimous_witness': corroborated,
            'ambiguous_candidate_samples': ambiguous, 'aabb_samples': len(pp),
            'limitation': 'Normals screen candidates; untrustworthy winding/open boundaries can hide or invent a sign. No certified upper bound.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--search-only', action='store_true')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    registry = json.loads((REVIEW.parents[1] / 'geometry/final-glm-rerun/source-registry.json').read_text())  # GLM rerun copy: consume GLM independent measure_g0 rerun registry
    pins = {s['path']: s['sha256'] for s in registry['sources'] if s.get('baseline_match') or s['path'].endswith('Default.glb')}
    for p, digest in pins.items():
        if cc.g0.sha(Path(p)) != digest:
            raise RuntimeError('Approved source drift: ' + p)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    live = cc.g0.import_meshes(ROOT / 'public/models/Default.glb')
    shaft_obj = bpy.data.objects['P001835-2']
    inverse = shaft_obj.matrix_world.inverted()
    old = cc.Mesh('legacy', shaft_obj)
    new_obj = cc.g0.import_meshes(cc.SHIFTED / 'p001835-hobbed.glb')[0]
    new = cc.Mesh('approved', new_obj, new_obj.matrix_world)
    names = ('P000247-1', 'P000247-1.001', 'P000247-1.002', 'P000247-1.003')
    planets = {o.name: cc.Mesh(o.name, o, inverse @ o.matrix_world) for o in live if o.name in names}
    profiles = {label: {y: radial_outer(mesh, y, (0, 0)) for y in YS} for label, mesh in (('legacy', old), ('approved', new))}
    result = {'schema': 'jgun-inspection-study-phase/v1', 'scope': 'Inspection-owned clones only; source/narrative rest never changed',
              'source_sha256': pins, 'sun_teeth': 10, 'study_planets': {}, 'status': 'search_running'}
    for name, planet in planets.items():
        pivot, datum = pivot_from_bore(planet)
        pp = {y: radial_outer(planet, y, pivot) for y in YS}
        spectrum = np.abs(np.fft.rfft(pp[6.0] - pp[6.0].mean()))
        count = int(np.argmax(spectrum[1:100]) + 1)
        pitch = 360 / count
        candidates = []
        for phase in np.arange(-pitch / 2, pitch / 2 + 1e-6, 0.1):
            gaps = [radial_gap(profiles[label][y], pp[y], pivot, 0, phase)
                    for label in profiles for y in YS if pp[y] is not None]
            candidates.append({'planet_phase_deg': float(phase), 'min_radial_proxy_gap_mm': min(gaps)})
        feasible = [c for c in candidates if c['min_radial_proxy_gap_mm'] > cc.CONTACT_SCREEN_MM]
        rest_chosen = min(feasible, key=lambda c: abs(c['planet_phase_deg'])) if feasible else max(candidates, key=lambda c: c['min_radial_proxy_gap_mm'])
        if not args.search_only:
            for candidate in candidates:
                gaps = [radial_gap(profiles[label][y], pp[y], pivot, sun_phase,
                                   candidate['planet_phase_deg'] - sun_phase * 10 / count)
                        for sun_phase in range(0, 37, 3) for label in profiles for y in YS if pp[y] is not None]
                candidate['min_cycle_radial_proxy_gap_mm'] = min(gaps)
            cycle_feasible = [c for c in candidates if c['min_cycle_radial_proxy_gap_mm'] > cc.CONTACT_SCREEN_MM]
            chosen = min(cycle_feasible, key=lambda c: abs(c['planet_phase_deg'])) if cycle_feasible else max(candidates, key=lambda c: c['min_cycle_radial_proxy_gap_mm'])
        else:
            chosen, cycle_feasible = rest_chosen, []
        result['study_planets'][name] = {'datum': datum, 'measured_tooth_harmonic': count,
            'pitch_deg': pitch, 'search_step_deg': 0.1, 'chosen_rest_phase': chosen,
            'minimal_rest_only_phase': rest_chosen,
            'rest_proxy_feasible_above_numeric_screen': bool(feasible), 'all_search_candidates': candidates,
            'cycle_proxy_feasible_above_numeric_screen': bool(cycle_feasible) if not args.search_only else None,
            'phase_convention': 'Positive angle rotates X toward +Z in shaft-local XZ plane; about fitted planet bore center, not global origin',
            'kinematic_candidate_planet_per_sun': -10 / count,
            'kinematic_status': 'Illustrative fixed-center external gearing from measured counts; not canonical display turns or machining/production truth',
            'cycle': []}
        print('STUDY_PHASE_REST ' + name + ' ' + json.dumps({k: result['study_planets'][name][k] for k in ('datum', 'measured_tooth_harmonic', 'chosen_rest_phase', 'rest_proxy_feasible_above_numeric_screen')}), flush=True)
        if not args.search_only:
            sun_samples = {label: mesh.samples() for label, mesh in (('legacy', old), ('approved', new))}
            planet_samples = planet.samples()
            for sun_phase in range(0, 37, 3):
                planet_phase = chosen['planet_phase_deg'] - sun_phase * 10 / count
                cycle = {'sun_deg': sun_phase, 'planet_deg': planet_phase, 'radial_sections': {}, 'full_mesh_samples': {}}
                for label, mesh in (('legacy', old), ('approved', new)):
                    cycle['radial_sections'][label] = {y: radial_gap(profiles[label][y], pp[y], pivot, sun_phase, planet_phase)
                                                      for y in YS if pp[y] is not None}
                    ss = sun_samples[label]
                    ss = ss[(ss[:, 1] >= planet.pts[:, 1].min()) & (ss[:, 1] <= planet.pts[:, 1].max())]
                    forward = signed_samples(rotate(ss, sun_phase), planet, pivot, planet_phase)
                    reverse = signed_samples(rotate(planet_samples, planet_phase, pivot), mesh, (0, 0), sun_phase)
                    cycle['full_mesh_samples'][label] = {'shaft_in_planet': forward, 'planet_in_shaft': reverse}
                result['study_planets'][name]['cycle'].append(cycle)
                print('STUDY_CYCLE ' + name + ' ' + str(sun_phase) + ' ' + json.dumps(cycle['full_mesh_samples']), flush=True)
                (REVIEW / 'study-phase.json').write_text(json.dumps(result, indent=1, allow_nan=False) + '\n')
    for p, digest in pins.items():
        if cc.g0.sha(Path(p)) != digest:
            raise RuntimeError('Source changed during study: ' + p)
    result['source_hashes_unchanged_after_run'] = True
    result['status'] = 'search_only' if args.search_only else 'measured_sampled_cycle_requires_review'
    result['limitation'] = 'Radial profiles are search proxies, not signed Euclidean separation. Cycle samples cover full mesh surfaces at discrete poses, not a continuous swept-volume or production gear-tolerance certificate.'
    (REVIEW / 'study-phase.json').write_text(json.dumps(result, indent=1, allow_nan=False) + '\n')
    print('STUDY_PHASE_DONE', flush=True)


if __name__ == '__main__':
    main()
