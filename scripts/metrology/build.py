"""Run with Blender --background --factory-startup --python build.py -- <repo>."""
import sys, json, gzip
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import bpy
from mathutils import Vector
from common import palette
from hand_tools import pencil, calipers, micrometer
from standards import standards, go_nogo
from fixtures import vblock, height_gauge

repo=Path(sys.argv[sys.argv.index('--')+1]).resolve()
out=repo/'.scratch/metrology-review'; out.mkdir(parents=True,exist_ok=True)
assert bpy.app.version >= (4,5), bpy.app.version
assert bpy.ops.object.select_all(action='SELECT') == {'FINISHED'}
assert bpy.ops.object.delete(use_global=False) == {'FINISHED'}
bpy.context.scene.unit_settings.system='METRIC'
bpy.context.scene.unit_settings.scale_length=1
palette()
for build in (pencil,calipers,micrometer,standards,go_nogo,vblock,height_gauge):
    build()
    print('AGENT_OK stage='+build.__name__, flush=True)
bpy.context.view_layer.update()
roots=[o for o in bpy.context.scene.objects if o.type=='EMPTY' and o.parent is None]
assert len(roots)==14,len(roots)
report={'purpose':'render-only','version':list(bpy.app.version),'tools':[]}
total=0
for r in roots:
    pts=[o.matrix_world@v.co for o in r.children if o.type=='MESH' for v in o.data.vertices]
    low=[min(p[i] for p in pts) for i in range(3)]
    high=[max(p[i] for p in pts) for i in range(3)]
    # Normalize sole to exact zero once, in authored geometry, before export.
    for o in r.children: o.location.z-=low[2]
    tris=0
    for o in r.children:
        o.data.calc_loop_triangles(); tris+=len(o.data.loop_triangles)
    total+=tris
    report['tools'].append({'id':r.name,'authoredMinZ':low[2],'min':[low[0],low[1],0],
      'max':[high[0],high[1],high[2]-low[2]],'triangles':tris,'drawCalls':len(r.children)})
assert total<=120000,total
report['triangles']=total
bpy.context.view_layer.update()
assert bpy.ops.wm.save_as_mainfile(filepath=str(out/'metrology-tools.blend'))=={'FINISHED'}
target=repo/'public/models/metrology-tools.glb'
result=bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_yup=True,
    export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=7,
    export_draco_position_quantization=16,export_draco_normal_quantization=10,
    export_materials='EXPORT',export_extras=True)
assert result=={'FINISHED'} and target.stat().st_size>1000
report['bytes']=target.stat().st_size
report['gzipBytes']=len(gzip.compress(target.read_bytes()))
assert report['gzipBytes']<=1500000,report['gzipBytes']
(out/'asset-report.json').write_text(json.dumps(report,indent=2))
print('AGENT_OK export '+json.dumps({'triangles':total,'gzipBytes':report['gzipBytes']}),flush=True)
