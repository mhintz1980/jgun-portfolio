"""Independent review execution on existing immutable inputs; never exports or saves CAD.

The enumerated profile metrics reuse the inspected producer's pure measurement
functions, so this is independent execution/provider review, not an independent
numerical algorithm. Support correspondence additionally checks every decoded
vertex bidirectionally, rather than trusting centroid displacement alone.
"""
from pathlib import Path
import hashlib, json, sys, time, importlib.util
import bpy, numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

ROOT = Path.cwd()
OUT = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('review_metrics', ROOT / 'scripts/manufacturing/export_study.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
producer = json.loads((m.OUT / 'core-assets-report-v3.json').read_text())
source_paths = [m.SOURCE, m.TOPOLOGY_SOURCE, m.SOURCE.parent / 'shaft_world_matrix.json', m.SOURCE.parent / 'build-report.json']
before = {str(p): sha(p) for p in source_paths}
assert before[str(m.SOURCE)] == m.SOURCE_HASH
bpy.ops.wm.open_mainfile(filepath=str(m.SOURCE))
originals = {}
source_census = {}
for key, (name, pn, state) in m.PARTS.items():
    ob = bpy.data.objects[name]
    me = ob.data.copy(); me.transform(ob.matrix_world)
    originals[key] = me
    source_census[key] = m.census(me)
refs = {k: m.reference_data(originals[k]) for k in ('legacyshaft', 'approvedshaft')}
hrefs = {k: {y: m.section_segments(originals[k], y) for y in m.HOUSING_SECTION_YS} for k in ('approvedhousing', 'legacyhousing')}

def nearest_max(a, b):
    kd = KDTree(len(b))
    for i, p in enumerate(b): kd.insert(Vector(p), i)
    kd.balance()
    return max(kd.find(Vector(p))[2] for p in a)

result = {'schema': 1, 'review_provider': 'OpenAI', 'producer_provider': 'GLM (PLAN/log attribution)',
          'method': __doc__, 'source_hash_before': before, 'source_census': source_census, 'bundles': {}}
for tier in ('full', 'lite'):
    path = ROOT / ('public/models/manufacturing-core-' + tier + '.glb')
    reported = producer['bundles'][tier]
    assert sha(path) == reported['sha256'], 'Current runtime artifact differs from producer report'
    assert sha(m.OUT / ('manufacturing-core-' + tier + '-v3.glb')) == sha(path)
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    decoded = {}
    for key in m.PARTS:
        ob = bpy.data.objects[key]
        me = ob.data.copy(); me.transform(ob.matrix_world); decoded[key] = me
    item = m.glb_census(path)
    item['path'] = str(path)
    item['decoded'] = {}
    limit = 0.025 if tier == 'full' else 0.05
    cap = 50000 if tier == 'full' else 15000
    for key, me in decoded.items():
        rec = {'geometry_sha256': m.geometry_hash(me), 'census': m.census(me)}
        rec['producer_geometry_hash_match'] = rec['geometry_sha256'] == reported['decoded'][key]['geometry_sha256']
        assert rec['producer_geometry_hash_match']
        if 'shaft' in key:
            rec['fidelity'] = m.shaft_fidelity(refs[key], me)
            rec['enumerated_fidelity_pass'] = m.fidelity_ok(rec['fidelity'], limit, cap)
        elif 'housing' in key:
            rec['seat_fidelity'] = m.housing_seat_fidelity(hrefs[key], me)
            rec['seat_fidelity_pass'] = rec['seat_fidelity']['sections_max_mm'] <= limit
        rec['sampled_surface_error'] = m.compare(originals[key], me)
        rec['surface_within_tier_limit'] = rec['sampled_surface_error']['symmetric_max_mm'] <= limit
        item['decoded'][key] = rec
        print('REVIEW_PART', tier, key, 'triangles', rec['census']['triangles'], 'surface_mm', rec['sampled_surface_error']['symmetric_max_mm'], flush=True)
    item['housing_registration'] = m.housing_registration(decoded['approvedhousing'], decoded['legacyhousing'])
    item['support_vertex_checks'] = {}
    for approved, legacy in (('approvedbearing', 'legacybearing'), ('approvedring', 'legacyring')):
        a = m.coordinates(decoded[approved]).astype(float) * 1000
        l = m.coordinates(decoded[legacy]).astype(float) * 1000
        shift = np.array([0, 2.75, 0])
        error = max(nearest_max(a - shift, l), nearest_max(l + shift, a))
        item['support_vertex_checks'][approved] = {'expected_delta_shaft_local_mm': shift.tolist(), 'bidirectional_max_residual_mm': error, 'pass': error <= 0.005,
                                                 'measured_center_delta_mm': (a.mean(0)-l.mean(0)).tolist()}
    item['budget_checks'] = {'bytes': item['bytes'] <= 2*1024*1024, 'core_primitives': item['primitive_calls'] <= 25,
                             'approvedshaft_triangles': item['triangles']['approvedshaft'] <= cap}
    item['pass'] = all(item['budget_checks'].values()) and item['housing_registration']['ok'] and all(x['pass'] for x in item['support_vertex_checks'].values()) and all(
        x.get('enumerated_fidelity_pass', x.get('seat_fidelity_pass', x['surface_within_tier_limit'])) for x in item['decoded'].values())
    result['bundles'][tier] = item
    (OUT / 'report.json').write_text(json.dumps(result, indent=2, allow_nan=False)+'\n')
result['source_hash_after'] = {str(p): sha(p) for p in source_paths}
result['source_unchanged'] = before == result['source_hash_after']
result['pass'] = result['source_unchanged'] and all(x['pass'] for x in result['bundles'].values())
(OUT / 'report.json').write_text(json.dumps(result, indent=2, allow_nan=False)+'\n')
print('INDEPENDENT_ASSET_REVIEW', result['pass'], flush=True)
assert result['pass']
