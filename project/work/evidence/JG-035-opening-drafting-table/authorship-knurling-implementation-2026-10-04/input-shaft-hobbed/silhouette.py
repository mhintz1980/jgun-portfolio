import bpy, bmesh, numpy as np, json
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Projects\CAD\jgun-input-shaft-hobbed\p001835-source-extract.glb')
o=[o for o in bpy.context.scene.objects if o.type=='MESH'][0]
bm=bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world); bmesh.ops.remove_doubles(bm,verts=bm.verts[:],dist=5e-6)
out=[]
for y in np.arange(0.0002,0.0200,0.0001):
    b=bm.copy()
    res=bmesh.ops.bisect_plane(b,geom=b.verts[:]+b.edges[:]+b.faces[:],plane_co=(0,y,0),plane_no=(0,1,0))
    p=np.array([(v.co.x,v.co.z) for v in res['geom_cut'] if isinstance(v,bmesh.types.BMVert)]).reshape(-1,2)
    b.free()
    if len(p)==0: continue
    r=np.hypot(p[:,0],p[:,1]); out.append((y*1e3,float(r.max()*1e3),float(r.min()*1e3)))
json.dump(out,open(r'C:\Projects\CAD\jgun-input-shaft-hobbed\silhouette.json','w'))
print('SIL',len(out))

