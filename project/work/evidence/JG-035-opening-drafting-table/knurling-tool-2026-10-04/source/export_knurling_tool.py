"""Consolidate rigid geometry while retaining five separately animated units."""
import bpy,json,struct,os
from mathutils import Matrix
from pathlib import Path
base=Path(r'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-035-opening-drafting-table\knurling-tool-2026-10-04')
source=bpy.data.scenes['JGUN_KNURLING_TOOL'];bpy.context.window.scene=source
source.frame_set(85);bpy.context.view_layer.update()
names=['KT_CONTROL','KT_TOOL_ROOT','KT_UPPER_HOLDER','KT_LOWER_HOLDER','KT_UPPER_KNURL_WHEEL_RH','KT_LOWER_KNURL_WHEEL_LH']
orig={n:bpy.data.objects[n] for n in names}
sc=bpy.data.scenes.new('KT_WEB_EXPORT')
clones={}
for name in names:
    o=bpy.data.objects.new(name+'_EXPORT',None);sc.collection.objects.link(o)
    clones[name]=o;o.rotation_mode='XYZ'
    for k in orig[name].keys():
        if k!='_RNA_UI':o[k]=orig[name][k]
for name,o in clones.items():
    p=orig[name].parent
    if p is not None:o.parent=clones[p.name]
    o.matrix_basis=orig[name].matrix_basis.copy()

groups={}
dg=bpy.context.evaluated_depsgraph_get()
for o in bpy.data.collections['KT_TOOL_ASSET'].objects:
    if o.type!='MESH':continue
    unit=o if o.name in names else o.parent
    assert unit.name in names
    matrix=unit.matrix_world.inverted()@o.matrix_world
    ev=o.evaluated_get(dg);mesh=ev.to_mesh()
    for mat_index in set(p.material_index for p in mesh.polygons):
        mat=mesh.materials[mat_index];key=(unit.name,mat.name)
        verts,faces=groups.setdefault(key,([],[]))
        indices=set(i for p in mesh.polygons if p.material_index==mat_index for i in p.vertices)
        remap={old:len(verts)+idx for idx,old in enumerate(sorted(indices))}
        verts.extend([tuple(matrix@mesh.vertices[i].co) for i in sorted(indices)])
        faces.extend([(tuple(remap[i] for i in p.vertices),p.use_smooth) for p in mesh.polygons if p.material_index==mat_index])
    ev.to_mesh_clear()
for (unit,mat),(verts,faces) in groups.items():
    name=unit+'_'+mat+'_GEOMETRY'
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[f[0] for f in faces]);mesh.update()
    for p,f in zip(mesh.polygons,faces):p.use_smooth=f[1]
    mesh.materials.append(bpy.data.materials[mat])
    o=bpy.data.objects.new(name,mesh);sc.collection.objects.link(o);o.parent=clones[unit]
    o['rigid_geometry_consolidated']=True

# Sample all driver motion explicitly; standard glTF channels have no dependency
# on Blender's custom properties, drivers, or the separate CAD reference ring.
for frame in range(1,151):
    source.frame_set(frame);bpy.context.view_layer.update()
    for name in names[1:]:
        oo=orig[name];co=clones[name]
        co.location=oo.location;co.rotation_euler=oo.rotation_euler
        co.keyframe_insert(data_path='location',frame=frame)
        co.keyframe_insert(data_path='rotation_euler',frame=frame)
for o in clones.values():
    if not o.animation_data:continue
    o.animation_data.action.name=o.name+'_SAMPLED'
    for layer in o.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for kp in fc.keyframe_points:kp.interpolation='LINEAR'
sc.frame_start=1;sc.frame_end=150;sc.render.fps=30
bpy.context.window.scene=sc;sc.frame_set(85)
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active=clones['KT_CONTROL']
path=base/'knurling-tool.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
    use_active_scene=True,
    export_animations=True,export_animation_mode='SCENE',export_anim_scene_split_object=False,
    export_frame_range=True,export_force_sampling=True,export_extras=True,
    export_cameras=False,export_lights=False,export_yup=True)

# Restore the meaningful node names in the exported JSON; suffixes only prevent
# Blender datablock collisions with the editable source scene.
binary=path.read_bytes();jsonlen=struct.unpack_from('<I',binary,12)[0]
g=json.loads(binary[20:20+jsonlen]);binchunk=binary[20+jsonlen:]
for n in g['nodes']:
    if n.get('name','').endswith('_EXPORT'):n['name']=n['name'][:-7]
for a in g.get('animations',[]):a['name']='KnurlTool_Approach_Contact_Traverse_Retract'
j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(j)+len(binchunk))+struct.pack('<II',len(j),0x4e4f534a)+j+binchunk)
triangles=sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives'])
report={'glb':str(path),'bytes':path.stat().st_size,'rigid_meshes':len(g['meshes']),
    'triangles':triangles,'animation_clips':len(g.get('animations',[])),
    'animation_channels':len(g['animations'][0]['channels']),
    'moving_nodes':names[1:],'reference_ring_excluded':not any('P003068' in n.get('name','') for n in g['nodes'])}
assert report['animation_clips']==1
assert report['reference_ring_excluded']
assert report['rigid_meshes']<20
assert len(g['scenes'])==1
assert not any(n.get('name')=='Cube' for n in g['nodes'])
report['scene_count']=len(g['scenes'])
(base/'web-export-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
manifest=json.loads((base/'asset-manifest.json').read_text())
manifest['outputs']['glb']=str(path);manifest['web_export']=report
(base/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
bpy.context.window.scene=source;source.frame_set(85)
# Keep only editable source/reference/studio in the saved asset file.
for o in list(sc.objects):bpy.data.objects.remove(o,do_unlink=True)
bpy.data.scenes.remove(sc)
source.camera=bpy.data.objects['KT_CAMERA_HERO']
bpy.ops.wm.save_as_mainfile(filepath=r'C:\Projects\CAD\jgun-knurling-tool\knurling-tool-v1.blend')
result=report
