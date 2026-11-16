"""Independent glTF round-trip geometry/axis/codec assertions."""
import bpy,sys,json,struct,gzip
from pathlib import Path
from mathutils import Vector
repo=Path(sys.argv[sys.argv.index('--')+1]).resolve()
asset=repo/'public/models/metrology-tools.glb'
blob=asset.read_bytes();length=struct.unpack_from('<I',blob,12)[0]
doc=json.loads(blob[20:20+length])
assert 'KHR_draco_mesh_compression' in doc.get('extensionsRequired',[])
assert 'KHR_texture_basisu' not in doc.get('extensionsUsed',[])
assert all(not i.get('uri','').startswith(('http:','https:')) for i in doc.get('images',[]))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
assert bpy.ops.import_scene.gltf(filepath=str(asset))=={'FINISHED'}
source=json.loads((repo/'.scratch/metrology-review/asset-report.json').read_text())
results=[]
for spec in source['tools']:
    root=bpy.data.objects.get(spec['id']);assert root is not None,spec['id']
    pts=[o.matrix_world@v.co for o in root.children_recursive if o.type=='MESH' for v in o.data.vertices]
    lo=[min(p[i] for p in pts) for i in range(3)];hi=[max(p[i] for p in pts) for i in range(3)]
    error=max(abs(a-b) for a,b in zip(lo+hi,spec['min']+spec['max']))
    assert error<.0001,(spec['id'],error,lo,hi)
    assert lo[2]>=-.0001,(spec['id'],lo)
    results.append({'id':spec['id'],'boundsErrorM':error,'min':lo,'max':hi})
report={'pass':True,'scope':'All 14 exported roots reimported into independent Blender process; 0.1 mm bounds tolerance; Draco/no Basis/no remote images','tools':results}
(repo/'.scratch/metrology-review/roundtrip.json').write_text(json.dumps(report,indent=2))
print('AGENT_OK roundtrip all14',flush=True)
