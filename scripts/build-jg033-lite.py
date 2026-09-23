"""Blender-only RL300 lite derivative; never saves or overwrites the source asset.

Run Blender --background --factory-startup --python scripts/build-jg033-lite.py.
The imported CAD hierarchy, materials, transforms and every occurrence survive.
"""
import bpy
import json
import hashlib
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'public/models/msp-enclosure.glb'
OUTPUT = ROOT / 'public/models/rl300-lite.glb'

if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != 'a48c12e578f2143944820cbbd1d64c9058556b85d4a01327903b28e8972615c6':
    raise RuntimeError('Audited source changed: reassess geometry and protected occurrences before rebuilding')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
# Exact ruled parts and retained twins are small: keep their tessellation too.
PROTECTED = (
    'V2RL300-SAF-RES-1020-SAFE', 'RL300-PEM-1001', 'RL300-EMG-1001',
    'MirrorRL200-AFS-2001', 'RL300-AFS-2003', 'V23028T25', 'V2RL300-WO-NP-SAFE',
    'V2EDW-60335', 'V2SKF-TB-', 'V2MSP-MID-5406HHP24', 'ISO_MOUNT_',
    'V2WISC-4770', '12335A81', 'V2RL300-SAF-1047',
)

def protected(obj):
    while obj:
        if any(part in obj.name for part in PROTECTED):
            return True
        obj = obj.parent
    return False

def triangles(mesh):
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)

SHELL_ROOTS = {'ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'ACOUSTIC_BAFFLES', 'DUCT_INTAKE', 'DUCT_EXHAUST'}

def carries_cap(obj):
    root = obj
    while root.parent:
        root = root.parent
    if root.name not in SHELL_ROOTS:
        return False
    mesh = obj.data
    mesh.calc_loop_triangles()
    # Same geometric edge test as runtime, independently in Blender's world frame.
    keys = [tuple(round(c * 1e5) for c in obj.matrix_world @ v.co) for v in mesh.vertices]
    edges = defaultdict(lambda: [0, 0])
    for tri in mesh.loop_triangles:
        vertices = [keys[i] for i in tri.vertices]
        if len(set(vertices)) < 3:
            continue
        for i in range(3):
            a, b = vertices[i], vertices[(i + 1) % 3]
            edge = edges[tuple(sorted((a, b)))]
            edge[0] += 1
            edge[1] += 1 if a < b else -1
    return bool(edges) and all(count == 2 and balance == 0 for count, balance in edges.values())

objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
before = sum(triangles(obj.data) for obj in objects)
records = []
# Work on each shared mesh once. If any occurrence is protected, protect the mesh.
for mesh in list(bpy.data.meshes):
    users = [obj for obj in objects if obj.data == mesh]
    if not users or any(protected(obj) or carries_cap(obj) for obj in users):
        continue
    obj = users[0]
    initial = triangles(mesh)
    if initial < 500:
        continue
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    # Apply on an owned copy, then reconnect instances to the same reduced mesh.
    obj.data = mesh.copy()
    mod = obj.modifiers.new('JG033_LITE', 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = 0.20
    mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for other in users[1:]:
        other.data = obj.data
    records.append({'mesh': mesh.name, 'instances': len(users), 'before': initial, 'after': triangles(obj.data)})
    obj.select_set(False)

after = sum(triangles(obj.data) for obj in objects)
print('JG033_LITE ' + json.dumps({'sourceTriangles': before, 'liteTriangles': after, 'simplifiedMeshes': len(records)}))
if after > 248000:
    raise RuntimeError(f'Lite derivative exceeds geometry allowance: {after}')
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', export_yup=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_animations=False, export_cameras=False, export_lights=False)
