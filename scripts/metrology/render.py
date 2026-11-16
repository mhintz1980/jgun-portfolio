"""Multi-angle evidence from the actual authored meshes, including undersides."""
import bpy, sys, math, json
from pathlib import Path
from mathutils import Vector
repo=Path(sys.argv[sys.argv.index('--')+1]).resolve()
out=repo/'.scratch/metrology-review'
bpy.ops.wm.open_mainfile(filepath=str(out/'metrology-tools.blend'))
scene=bpy.context.scene
roots=[o for o in scene.objects if o.type=='EMPTY' and not o.parent]
scene.render.engine='CYCLES'; scene.cycles.samples=16
scene.cycles.use_denoising=True
scene.render.resolution_x=512;scene.render.resolution_y=384;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world.color=(.22,.22,.22)
scene.view_settings.view_transform='AgX'
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera
camera.data.type='ORTHO';camera.data.clip_start=.0005;camera.data.clip_end=10
for location,power,size in [((.2,-.12,.3),12,.18),((-.15,.1,.2),8,.14),((.02,.2,-.08),5,.12)]:
    bpy.ops.object.light_add(type='AREA',location=location)
    light=bpy.context.object;light.data.energy=power*.22;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=10,location=(0,0,-.001))
floor=bpy.context.object
mat=bpy.data.materials.new('review floor');mat.diffuse_color=(.07,.08,.085,1)
p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.07,.08,.085,1);p.inputs['Roughness'].default_value=.75
floor.data.materials.append(mat)
views=[('front',(1,-1.6,1.5)),('side',(.2,-2,.45)),('underside',(-1,1,-1.4))]
if '--quick' in sys.argv: views=views[:1]
for r in roots:
    for other in roots:
        for o in other.children: o.hide_render=other!=r
    bpy.context.view_layer.update()
    pts=[o.matrix_world@v.co for o in r.children if o.type=='MESH' for v in o.data.vertices]
    low=Vector([min(p[i] for p in pts) for i in range(3)])
    high=Vector([max(p[i] for p in pts) for i in range(3)])
    center=(low+high)/2;size=(high-low).length
    camera.data.ortho_scale=size*1.25
    for label,offset in views:
        floor.hide_render=label=='underside'
        camera.location=center+Vector(offset).normalized()*size*3
        camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(out/(r.name+'-'+label+'.png'))
        assert bpy.ops.render.render(write_still=True)=={'FINISHED'}
        assert Path(scene.render.filepath).stat().st_size>3000
        print('AGENT_OK render '+r.name+' '+label,flush=True)
