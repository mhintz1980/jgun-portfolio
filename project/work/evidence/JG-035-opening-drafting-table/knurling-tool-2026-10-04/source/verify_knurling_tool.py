"""Reimport the delivered GLB, compare driver poses, render inspection views."""
import bpy,json,math,hashlib
from pathlib import Path
source=bpy.data.scenes['JGUN_KNURLING_TOOL']
base=Path(r'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-035-opening-drafting-table\knurling-tool-2026-10-04')
path=base/'knurling-tool.glb'
qa=bpy.data.scenes.new('KT_REIMPORT_VERIFY');qa.render.fps=30
bpy.context.window.scene=qa;bpy.ops.import_scene.gltf(filepath=str(path))
keys=['KT_TOOL_ROOT','KT_UPPER_HOLDER','KT_LOWER_HOLDER','KT_UPPER_KNURL_WHEEL_RH','KT_LOWER_KNURL_WHEEL_LH']
lookup={k:next(o for o in qa.objects if o.name==k or o.name.startswith(k+'.')) for k in keys}
records=[]
for f in [1,30,45,55,85,115,120,135,150]:
    bpy.context.window.scene=source;source.frame_set(f);bpy.context.view_layer.update()
    expected={k:(bpy.data.objects[k].location.copy(),bpy.data.objects[k].rotation_euler.to_quaternion()) for k in keys}
    bpy.context.window.scene=qa;qa.frame_set(f);bpy.context.view_layer.update()
    data={}
    for k,o in lookup.items():
        loc,q=expected[k];a=q.rotation_difference(o.rotation_quaternion).angle
        a=min(a,abs(2*math.pi-a))
        data[k]={'translation_error_m':(o.location-loc).length,'angular_error_rad':a,
            'position':list(o.location),'quaternion':list(o.rotation_quaternion)}
    records.append({'frame':f,'units':data})
maxpos=max(v['translation_error_m'] for r in records for v in r['units'].values())
maxang=max(v['angular_error_rad'] for r in records for v in r['units'].values())
assert maxpos<1e-6 and maxang<.001
report={'status':'PASS','glb_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
    'frames_compared':len(records),'moving_units':5,'meshes_reimported':sum(o.type=='MESH' for o in qa.objects),
    'max_translation_error_m':maxpos,'max_angular_error_rad':maxang,'records':records}
(base/'reimport-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.context.window.scene=source
for o in list(qa.objects):bpy.data.objects.remove(o,do_unlink=True)
bpy.data.scenes.remove(qa)
source.frame_set(85)
ring=bpy.data.objects['P003068_ACTUAL_RING_FIT_REFERENCE']
renders=[]
for cam,file,show in [('KT_CAMERA_HERO','tool-hero.png',False),
                      ('KT_CAMERA_FRONT','tool-front.png',False),
                      ('KT_CAMERA_REAR','tool-rear.png',False),
                      ('KT_CAMERA_CONTACT','tool-ring-contact.png',True)]:
    ring.hide_render=not show;ring.hide_set(not show)
    source.view_settings.exposure=-1.5 if cam=='KT_CAMERA_REAR' else -.35
    source.camera=bpy.data.objects[cam];source.render.filepath=str(base/file)
    bpy.ops.render.render(write_still=True);renders.append(str(base/file))
ctrl=bpy.data.objects['KT_CONTROL']
source.view_settings.exposure=-.35
bpy.ops.object.select_all(action='DESELECT');ctrl.select_set(True)
bpy.context.view_layer.objects.active=ctrl
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_rotation=source.camera.rotation_euler.to_quaternion()
            area.spaces.active.region_3d.view_location=(.045,0,0)
            area.spaces.active.region_3d.view_distance=.33
bpy.ops.wm.save_as_mainfile(filepath=r'C:\Projects\CAD\jgun-knurling-tool\knurling-tool-v1.blend')
result={'status':report['status'],'sha256':report['glb_sha256'],'frames_compared':len(records),
    'moving_units':5,'max_translation_error_m':maxpos,'max_angular_error_rad':maxang,'renders':renders}
