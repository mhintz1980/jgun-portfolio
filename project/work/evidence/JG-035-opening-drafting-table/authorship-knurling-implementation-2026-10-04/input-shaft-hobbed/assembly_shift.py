import bpy, bmesh, numpy as np, json, math
from mathutils import Matrix
OUT=r'C:\Projects\CAD\jgun-input-shaft-hobbed\shifted'
DELTA=2.75e-3
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\public\models\Default.glb')
shaft0=bpy.data.objects['P001835-2']; M=shaft0.matrix_world.copy(); Mi=M.inverted()
json.dump([list(r) for r in M],open(OUT+r'\shaft_world_matrix.json','w'))
def localcopy(name,newname):
    o=bpy.data.objects[name]; me=o.data.copy(); me.transform(Mi@o.matrix_world)
    ob=bpy.data.objects.new(newname,me); bpy.context.scene.collection.objects.link(ob); return ob
orig={'housing':localcopy('P000725-1','HOUSING_P000725_ORIG'),'bearing':localcopy('K000210-1','BEARING_K000210_ORIG'),
      'ring':localcopy('K000211-1','RING_K000211_ORIG'),'shaft':localcopy('P001835-2','SHAFT_P001835_ORIG')}
new={k:localcopy(n,f'{k}_NEW') for k,n in (('housing','P000725-1'),('bearing','K000210-1'),('ring','K000211-1'))}
# bearing and retaining ring move with the journal
for k in ('bearing','ring'):
    for v in new[k].data.vertices: v.co.y+=DELTA
# housing: shift the bore shoulder rings (bore r 9.53 -> 9.12 chamfer/step) by DELTA so the 9.53 seat is extended
me=new['housing'].data; n=len(me.vertices); co=np.empty(n*3,dtype=np.float32); me.vertices.foreach_get('co',co); co=co.reshape(-1,3)
y=co[:,1]*1e3; r=np.hypot(co[:,0],co[:,2])*1e3
ys=np.unique(np.round(y[(r<9.7)&(y>15.5)&(y<18.0)],3)); print('HOUSING bore ring ys',ys.tolist())
mv=(r<9.56)&(y>=16.4)&(y<=17.05)
print('HOUSING moved',int(mv.sum()),'of',n)
co[mv,1]+=DELTA; me.vertices.foreach_set('co',co.reshape(-1)); me.update()
# verify modified housing bore profile
bm=bmesh.new(); bm.from_mesh(me)
for yy in (14.0,16.0,17.0,18.0,19.0,19.3,19.5,19.8,20.5,22.0):
    b=bm.copy(); res=bmesh.ops.bisect_plane(b,geom=b.verts[:]+b.edges[:]+b.faces[:],plane_co=(0,yy*1e-3,0),plane_no=(0,1,0))
    p=np.array([(v.co.x,v.co.z) for v in res['geom_cut'] if isinstance(v,bmesh.types.BMVert)]).reshape(-1,2); b.free()
    rr=np.hypot(p[:,0],p[:,1])*1e3 if len(p) else np.array([0]); print('HBORE y',yy,'min r',round(float(rr.min()),3))
bm.free()
# shaft (hobbed + shifted) from the build
bpy.ops.import_scene.gltf(filepath=OUT+r'\p001835-hobbed.glb')
hob=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name not in [x.name for x in list(orig.values())+list(new.values())] and o.parent is None and not o.name.startswith(('P0','K0'))]
print('HOBOBJ',[o.name for o in bpy.context.scene.objects if o.type=='MESH' and 'HOB' in o.name.upper()])
hobo=[o for o in bpy.context.scene.objects if o.type=='MESH' and 'HOB' in o.name.upper()][0]
hobo.data.transform(hobo.matrix_world); hobo.matrix_world=Matrix.Identity(4); hobo.name='SHAFT_P001835_HOBBED_NEW'
new['shaft']=hobo
# remove the original assembly objects so only local copies remain
for o in list(bpy.data.objects):
    if o.name in ('P000725-1','K000210-1','K000211-1','P001835-2') or (o.type=='MESH' and o.name not in [x.name for x in list(orig.values())+list(new.values())]):
        bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+r'\input-shaft-assembly-parts-v1.blend')
# exports
def export(objs,path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0]
    bpy.ops.export_scene.gltf(filepath=path,use_selection=True,export_apply=True)
export([new['housing']],OUT+r'\p000725-modified.glb'); export([new['bearing'],new['ring']],OUT+r'\k000210-k000211-moved.glb')
# sections
def section(obj,name,color):
    bm=bmesh.new(); bm.from_mesh(obj.data)
    res=bmesh.ops.bisect_plane(bm,geom=bm.verts[:]+bm.edges[:]+bm.faces[:],plane_co=(0,0,0),plane_no=(1,0,0),clear_outer=True)
    cut=[e for e in res['geom_cut'] if isinstance(e,bmesh.types.BMEdge)]
    try: bmesh.ops.triangle_fill(bm,edges=cut,use_beauty=True)
    except Exception as e: print('FILLFAIL',name,e)
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob=bpy.data.objects.new(name,me); bpy.context.scene.collection.objects.link(ob); ob.color=color; return ob
colors={'shaft':(.62,.66,.72,1),'housing':(.86,.62,.62,1),'bearing':(.95,.82,.1,1),'ring':(.9,.45,.05,1)}
sc=bpy.context.scene; sc.render.engine='BLENDER_WORKBENCH'; sc.display.shading.light='STUDIO'; sc.display.shading.color_type='OBJECT'; sc.display.shading.show_cavity=True
sc.world=bpy.data.worlds.new('w'); sc.world.color=(1,1,1); sc.render.resolution_x=1500; sc.render.resolution_y=1000
cam=bpy.data.objects.new('c',bpy.data.cameras.new('c')); sc.collection.objects.link(cam); cam.data.type='ORTHO'; cam.data.ortho_scale=0.052
cam.rotation_euler=(0,math.pi/2,0); cam.location=(0.3,0.0185,0.0); sc.camera=cam
for tag,src in (('before',orig),('after',new)):
    made=[section(src[k],f'{tag}_{k}',colors[k]) for k in ('shaft','housing','bearing','ring')]
    for o in bpy.data.objects:
        if o.type=='MESH': o.hide_render = not (o in made)
    sc.render.filepath=OUT+rf'\section_{tag}.png'; bpy.ops.render.render(write_still=True)
    for o in made: o.hide_render=True
print('DONE')

