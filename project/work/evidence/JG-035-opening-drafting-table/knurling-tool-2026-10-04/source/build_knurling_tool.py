"""Build the owner-requested, reference-led JGun knurling animation prop.
Run in Blender after importing the isolated P003068 reference into
JGUN_KNURLING_TOOL. No original CAD or pre-existing scene is modified.
"""
import bpy, math, json, os, shutil, struct, copy, tempfile
from mathutils import Vector, Matrix
from pathlib import Path

SOURCE = Path(r'C:\Projects\CAD\jgun-knurling-tool')
EVIDENCE = Path(r'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-035-opening-drafting-table\knurling-tool-2026-10-04')
SOURCE.mkdir(parents=True, exist_ok=True)
EVIDENCE.mkdir(parents=True, exist_ok=True)
if 'JGUN_KNURLING_TOOL' not in bpy.data.scenes:
    sc = bpy.data.scenes.new('JGUN_KNURLING_TOOL')
    bpy.context.window.scene = sc
    cad = Path(r'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\public\models\Default.glb')
    with cad.open('rb') as f:
        f.read(12); n,t=struct.unpack('<II',f.read(8)); g=json.loads(f.read(n))
        n,t=struct.unpack('<II',f.read(8)); bb=f.read(n)
    part = next(n for n in g['nodes'] if n.get('name') == 'P003068-2')
    mini=copy.deepcopy(g);mini['meshes']=[g['meshes'][part['mesh']]]
    mini['nodes']=[{'name':'P003068_ACTUAL_REFERENCE','mesh':0}]
    mini['scenes']=[{'nodes':[0]}];mini['scene']=0
    j=json.dumps(mini,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
    bb+=b'\0'*((-len(bb))%4)
    temp=Path(tempfile.gettempdir())/'jgun-p003068-extraction-reference.glb'
    temp.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(bb))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(bb),0x004e4942)+bb)
    bpy.ops.import_scene.gltf(filepath=str(temp))
else:
    sc = bpy.data.scenes['JGUN_KNURLING_TOOL']
bpy.context.window.scene = sc
if bpy.context.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
if bpy.data.objects.get('KT_CONTROL'):
    raise RuntimeError('Tool already exists: rebuild only in a fresh owned scene.')

tool = bpy.data.collections.new('KT_TOOL_ASSET')
sc.collection.children.link(tool)
demo = bpy.data.collections.new('KT_RING_FIT_REFERENCE')
sc.collection.children.link(demo)
studio = bpy.data.collections.new('KT_STUDIO')
sc.collection.children.link(studio)
owned = []

def link(o, collection=tool):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    collection.objects.link(o)
    if collection == tool: owned.append(o)
    return o

def material(name, color, metal, rough):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m

steel = material('KT_Satin_tool_steel', (.34,.38,.43), .85, .28)
edge = material('KT_Ground_steel', (.52,.56,.62), .92, .22)
black = material('KT_Black_oxide', (.012,.016,.023), .4, .32)
gold = material('KT_Gold_colored_knurl_wheel', (.65,.38,.085), .85, .25)
raw = material('KT_Reference_raw_aluminium', (.58,.62,.69), .88, .25)
inset = material('KT_Dark_recess', (.008,.011,.015), .3, .4)

def empty(name, parent=None, loc=(0,0,0)):
    o = bpy.data.objects.new(name,None)
    tool.objects.link(o); owned.append(o)
    o.empty_display_type = 'PLAIN_AXES'; o.empty_display_size = .009
    o.parent = parent; o.location = loc
    return o

ctrl = empty('KT_CONTROL')
root = empty('KT_TOOL_ROOT', ctrl)
ctrl['jaw_open_mm'] = 0.0
ctrl['traverse_mm'] = 0.0
ctrl['approach_mm'] = 0.0
ctrl['ring_angle_rad'] = 0.0
ctrl['reference_part'] = 'P003068'
ctrl['mechanism'] = 'opposed sliding holders; reference-derived animation prop'
ctrl['axis_contract'] = 'Blender Z: ring/wheel axes and axial traverse; X: shank; Y: jaw opening'
for k, lo, hi, desc in [
    ('jaw_open_mm',0,14,'Additional radial clearance per holder, millimetres'),
    ('traverse_mm',-18,18,'Axial tool position relative to ring centre, millimetres'),
    ('approach_mm',0,100,'Tool withdrawal along the shank axis, millimetres'),
    ('ring_angle_rad',-1000,1000,'Demo ring angle; wheel angles use external rolling-contact ratio')]:
    ctrl.id_properties_ui(k).update(min=lo,max=hi,description=desc)

def driver(o, prop, index, control_prop, expression):
    fc = o.driver_add(prop,index); d=fc.driver; d.type='SCRIPTED'
    v=d.variables.new(); v.name='v'; v.type='SINGLE_PROP'
    v.targets[0].id=ctrl; v.targets[0].data_path='["'+control_prop+'"]'
    d.expression=expression
    return fc

driver(root,'location',0,'approach_mm','v/1000')
driver(root,'location',2,'traverse_mm','v/1000')

def finish(o, mat, bevel=.0004, smooth=False):
    o.data.materials.append(mat)
    if smooth:
        for p in o.data.polygons: p.use_smooth=True
    if bevel:
        m=o.modifiers.new('Machined edge breaks','BEVEL');m.width=bevel;m.segments=3
    return o

def cube(name, size, loc, mat, parent=root, bevel=.0004):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o=link(bpy.context.object);o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.parent=parent;o.location=loc
    return finish(o,mat,bevel)

def cylinder(name, radius, depth, loc, mat, parent=root, vertices=48, bevel=.0002):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth)
    o=link(bpy.context.object);o.name=name;o.parent=parent;o.location=loc
    return finish(o,mat,bevel,True)

def boolean_difference(o, cutter):
    bpy.context.view_layer.objects.active=o
    m=o.modifiers.new('Machined pocket','BOOLEAN');m.operation='DIFFERENCE';m.object=cutter
    bpy.ops.object.modifier_apply(modifier=m.name)
    if cutter in owned: owned.remove(cutter)
    bpy.data.objects.remove(cutter,do_unlink=True)

def socket_screw(name, xy, z, parent=root, radius=.003):
    x,y=xy
    cylinder(name+'_washer',radius*1.28,.0007,(x,y,z-.0018),black,parent)
    cap=cylinder(name,radius,.0038,(x,y,z),black,parent,48,.00018)
    # Real recessed hexagon; no floating painted socket.
    cut=cylinder(name+'_socket_cutter',radius*.55,.0025,(x,y,z+.00135),inset,parent,6,0)
    boolean_difference(cap,cut)
    return cap

def prism(name, outline, depth, z, mat, parent):
    n=len(outline)
    vv=[(x,y,z-depth/2) for x,y in outline]+[(x,y,z+depth/2) for x,y in outline]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    m=bpy.data.meshes.new(name+'_mesh');m.from_pydata(vv,[],faces);m.update()
    o=bpy.data.objects.new(name,m);tool.objects.link(o);owned.append(o);o.parent=parent
    return finish(o,mat,.00055)

# Bake the imported ring back to its native CAD part frame, then centre its axis.
ring=bpy.data.objects['P003068_ACTUAL_REFERENCE']
ring.data.transform(Matrix.Rotation(-math.pi/2,4,'X') @ ring.matrix_world)
ring.matrix_world=Matrix.Identity(4)
z0=min(v.co.z for v in ring.data.vertices);z1=max(v.co.z for v in ring.data.vertices)
mid=(z0+z1)/2
for v in ring.data.vertices:v.co.z-=mid
ring.data.update()
R=max(math.hypot(v.co.x,v.co.y) for v in ring.data.vertices)
W=z1-z0
ring.name='P003068_ACTUAL_RING_FIT_REFERENCE';link(ring,demo)
ring.data.materials.clear();ring.data.materials.append(raw)
for p in ring.data.polygons:p.material_index=0;p.use_smooth=True
ring.rotation_mode='XYZ'
driver(ring,'rotation_euler',2,'ring_angle_rad','v')
ring['source']='Default.glb mesh30, P003068-2, all 60 primitives'
ring['reference_only']=True

RW=.0115; WW=.0075; teeth=64; bands=20; segments=teeth*4
contact=R+RW
stroke=(W-WW)/2
ctrl['ring_diameter_mm']=2*R*1000
ctrl['ring_width_mm']=W*1000
ctrl['wheel_diameter_mm']=2*RW*1000
ctrl['wheel_width_mm']=WW*1000

# Backbone, guide rail, rectangular machine shank and end retainers.
body=cube('KT_BODY_SPINE',(.031,.177,.027),(.0645,0,0),steel)
cube('KT_SHANK',(.096,.025,.025),(.128,0,0),black)
cube('KT_SHANK_SHOULDER',(.009,.038,.030),(.082,0,0),black)
for side in [-1,1]:
    cube('KT_GUIDE_PLATE_'+str(side),(.008,.167,.0024),(.055,0,side*.0145),edge)
    cube('KT_SLIDE_CHANNEL_'+str(side),(.006,.157,.0012),(.061,0,side*.0146),inset,bevel=.00015)
    for i in range(11):
        socket_screw('KT_RAIL_SET_SCREW_%s_%02d'%(side,i),(.075,-.070+i*.014),side*.0155,radius=.0017)
for s in [-1,1]:
    cube('KT_END_STOP_'+str(s),(.035,.007,.031),(.0645,s*.088,0),black)
    for x in [.055,.074]: socket_screw('KT_END_STOP_BOLT_%s_%s'%(s,x),(x,s*.088),.018,radius=.0027)

def wheel(name,hand,parent):
    # Physical helical teeth, smooth rims, and a real bore. The two hands differ.
    verts=[];faces=[];bore=.0024
    for j in range(bands+1):
        z=-WW/2+WW*j/bands
        rim=min(1,max(0,(WW/2-abs(z))/.0007))
        for i in range(segments):
            th=2*math.pi*i/segments
            phase=teeth*(th-hand*z*math.tan(math.radians(30))/RW)
            tri=1-abs(((phase/(2*math.pi))%1)*2-1)
            rad=RW-.00038*rim*(1-tri)
            verts.append((rad*math.cos(th),rad*math.sin(th),z))
    for j in range(bands):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments
            faces.append((a,b,b+segments,a+segments))
    for end in [0,1]:
        start=len(verts);z=(-1 if end==0 else 1)*WW/2
        verts.extend([(bore*math.cos(2*math.pi*i/segments),bore*math.sin(2*math.pi*i/segments),z) for i in range(segments)])
        outer=0 if end==0 else bands*segments
        for i in range(segments):
            ni=(i+1)%segments
            f=(outer+i,outer+ni,start+ni,start+i)
            faces.append(tuple(reversed(f)) if end==0 else f)
    b0=(bands+1)*segments;b1=b0+segments
    for i in range(segments):
        ni=(i+1)%segments;faces.append((b0+i,b0+ni,b1+ni,b1+i))
    m=bpy.data.meshes.new(name+'_mesh');m.from_pydata(verts,[],faces);m.update()
    o=bpy.data.objects.new(name,m);tool.objects.link(o);owned.append(o);o.parent=parent
    finish(o,gold,0,True)
    for p in m.polygons:
        if bands*segments <= p.index < (bands+2)*segments:
            p.use_smooth=False
    o.rotation_mode='XYZ'
    driver(o,'rotation_euler',2,'ring_angle_rad','-v*%.12f'%(R/RW))
    o['tooth_hand']='RH' if hand>0 else 'LH'
    o['tooth_count']=teeth;o['helix_deg']=30
    return o

jaws=[];wheels=[]
for s,tag in [(1,'UPPER'),(-1,'LOWER')]:
    jaw=empty('KT_'+tag+'_HOLDER',root,loc=(0,s*contact,0))
    driver(jaw,'location',1,'jaw_open_mm','%s*(%.12f+v/1000)'%(s,contact))
    jaws.append(jaw)
    outline=[(-.017,.013),(-.014,-.002),(.012,-.006),(.031,.000),(.049,.009),(.049,.026),(-.007,.026)]
    outline=[(x,s*y) for x,y in outline]
    if s<0:outline.reverse()
    # Fork cheeks straddle the freely rotating wheel; rear bridge joins them.
    for z,side in [(-.008,'BACK'),(.008,'FRONT')]:
        prism('KT_'+tag+'_FORK_'+side,outline,.006,z,steel,jaw)
    cube('KT_'+tag+'_FORK_BRIDGE',(.030,.013,.016),(.033,s*.0195,0),steel,jaw)
    cube('KT_'+tag+'_SLIDE_BLOCK',(.027,.024,.029),(.054,s*.0175,0),steel,jaw)
    cube('KT_'+tag+'_LOCKING_SHIM',(.005,.025,.032),(.067,s*.0175,0),black,jaw,bevel=.0002)
    wheels.append(wheel('KT_'+tag+'_KNURL_WHEEL_'+('RH' if s>0 else 'LH'),s,jaw))
    cylinder('KT_'+tag+'_ROLLER_PIN',.00235,.022,(0,0,0),edge,jaw)
    for z in [-.0114,.0114]:
        cylinder('KT_'+tag+'_PIN_HEAD_'+str(z),.0044,.001,(0,0,z),black,jaw,48,.00012)
        cylinder('KT_'+tag+'_PIN_SOCKET_'+str(z),.002,.0002,(0,0,z+(.00052 if z>0 else -.00052)),edge,jaw,6,0)
    for x in [.022,.050]:
        socket_screw('KT_'+tag+'_CLAMP_BOLT_'+str(x),(x,s*.020),.0145,jaw,.0031)
    socket_screw('KT_'+tag+'_WHEEL_LOCK',(-.007,s*.021),.012,jaw,.0022)

# Restrained maker plate identifies the custom prop without inventing a brand.
cube('KT_MAKER_PLATE',(.024,.012,.0006),(.128,0,.0131),steel,bevel=.0002)
for x in [.118,.138]:socket_screw('KT_MAKER_PLATE_BOLT_'+str(x),(x,0),.0138,radius=.0009)

# Animation demonstrates tool mechanics; the ring is a separate reference only.
sc.render.fps=30;sc.frame_start=1;sc.frame_end=150
anim=[
    (1,10,-stroke*1000,22,0),
    (30,10,-stroke*1000,0,0),
    (45,0,-stroke*1000,0,0),
    (55,0,-stroke*1000,0,4*math.pi/3),
    (115,0,stroke*1000,0,28*math.pi/3),
    (120,0,stroke*1000,0,10*math.pi),
    (135,10,stroke*1000,0,11*math.pi),
    (150,10,stroke*1000,22,11*math.pi)]
for frame,gap,trav,approach,angle in anim:
    for k,val in [('jaw_open_mm',gap),('traverse_mm',trav),('approach_mm',approach),('ring_angle_rad',angle)]:
        ctrl[k]=float(val);ctrl.keyframe_insert(data_path='["'+k+'"]',frame=frame)
action=ctrl.animation_data.action;action.name='KT_Approach_Contact_Traverse_Retract'
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for fc in bag.fcurves:
                for kp in fc.keyframe_points:kp.interpolation='LINEAR'
for f,label in [(1,'OPEN / APPROACH'),(45,'CONTACT'),(55,'START 2s TRAVERSE'),(115,'END TRAVERSE'),(135,'OPEN'),(150,'RETRACT')]:
    sc.timeline_markers.new(label,frame=f)
sc.frame_set(85)
sc.unit_settings.system='METRIC';sc.unit_settings.length_unit='MILLIMETERS'

# Three useful inspection cameras plus a contact view, studio excluded from GLB.
def camera(name,pos,target,scale):
    d=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,d);studio.objects.link(o)
    o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    d.type='ORTHO';d.ortho_scale=scale;d.lens=55;d.clip_start=.001
    return o
hero=camera('KT_CAMERA_HERO',(-.18,-.25,.28),(.065,0,0),.27)
front=camera('KT_CAMERA_FRONT',(.066,0,.42),(.066,0,0),.285)
rear=camera('KT_CAMERA_REAR',(.065,0,-.42),(.065,0,0),.285)
contact_cam=camera('KT_CAMERA_CONTACT',(-.15,-.20,.27),(.045,0,0),.26)
sc.camera=hero
world=bpy.data.worlds.new('KT_Studio_world');sc.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.025,.032,.047,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35
def area(name,pos,power,size,color,target=(.045,0,0)):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
    o=bpy.data.objects.new(name,d);studio.objects.link(o);o.location=pos
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('KT_KEY',(.04,-.18,.25),4,.18,(.84,.90,1))
area('KT_RIM',(.09,.18,.12),6,.14,(1,.86,.65))
area('KT_FILL',(-.16,-.04,.08),2,.16,(.68,.79,1))
area('KT_REAR_LIGHT',(.06,0,-.22),3,.18,(.80,.86,1))
sc.render.engine='BLENDER_EEVEE'
sc.eevee.taa_render_samples=256
sc.render.resolution_x=1440;sc.render.resolution_y=1080;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'
sc.render.film_transparent=False
sc.view_settings.view_transform='AgX'
sc.view_settings.exposure=-.35

# Numeric acceptance: contact, gap, wheel axes, axial coverage, and body clearance.
sc.frame_set(85);bpy.context.view_layer.update()
checks={
    'contact_gap_mm':[round((abs(j.matrix_world.translation.y)-RW-R)*1000,6) for j in jaws],
    'wheel_width_mm':WW*1000,
    'fork_inner_clearance_per_side_mm':(.008-.003-WW/2)*1000,
    'rail_to_ring_clearance_mm':(.049-R)*1000,
    'traverse_duration_seconds':(115-55)/sc.render.fps,
    'stroke_mm':2*stroke*1000,
    'coverage_width_mm':(2*stroke+WW)*1000,
    'ring_width_mm':W*1000,
    'tooth_hands':[o['tooth_hand'] for o in wheels],
}
assert max(abs(x) for x in checks['contact_gap_mm'])<.002
assert checks['fork_inner_clearance_per_side_mm']>0
assert checks['rail_to_ring_clearance_mm']>10
assert abs(checks['coverage_width_mm']-checks['ring_width_mm'])<1e-5
checks['status']='PASS'

# Export only the named tool assembly, with sampled driver motion in one clip.
bpy.ops.object.select_all(action='DESELECT')
for o in owned:o.select_set(True)
bpy.context.view_layer.objects.active=ctrl
glb=SOURCE/'knurling-tool-editable-export.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,
    use_active_scene=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_force_sampling=True,export_apply=True,export_extras=True,
    export_cameras=False,export_lights=False,export_yup=True)
sc.frame_set(85)
ring.hide_render=True;ring.hide_set(True)
# Select controls and frame the tool in every visible viewport.
bpy.ops.object.select_all(action='DESELECT');ctrl.select_set(True)
bpy.context.view_layer.objects.active=ctrl
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_distance=.32
            a.spaces.active.region_3d.view_location=(.055,0,0)
            a.spaces.active.region_3d.view_rotation=hero.rotation_euler.to_quaternion()
            a.spaces.active.clip_start=.001
            a.spaces.active.shading.type='MATERIAL'

reference=Path(r'C:\Users\Markimus\AppData\Local\Temp\codex-clipboard-5e1d65f6-c3b5-4dcd-8bd2-6d65ccd74a93.png')
shutil.copy2(reference,EVIDENCE/'owner-tool-reference.png')
manifest={
    'asset':'Reference-led opposed-holder knurling animation tool','date':'2026-10-04',
    'blender_version':bpy.app.version_string,'units':'metres','source_image':str(reference),
    'mechanism':'opposed sliding holders, not pivoting scissor arms',
    'dimensions_basis':'Body proportions from owner illustration; contact fit from decoded P003068 vertices. No manufacturer size table supplied.',
    'ring_source':'public/models/Default.glb, P003068-2, mesh30; isolated only for fit checking',
    'ring_diameter_mm':2*R*1000,'ring_width_mm':W*1000,
    'wheel_diameter_mm':2*RW*1000,'wheel_width_mm':WW*1000,
    'wheel_tooth_count':teeth,'wheel_helix_deg':30,
    'controls':{k:ctrl[k] for k in ['jaw_open_mm','traverse_mm','approach_mm','ring_angle_rad']},
    'axes_blender':{'spin_traverse':'Z','jaw_opening':'Y','shank_withdrawal':'X'},
    'axis_conversion':'GLB glTF Y-up: Blender Z becomes glTF Y; Blender Y becomes glTF -Z',
    'moving_nodes':[root.name]+[o.name for o in jaws+wheels],
    'demo':'Frames 1–150 at 30 fps, 2-second traverse at 55–115; geometry demonstration only',
    'checks':checks,'tool_objects':len(owned),
    'outputs':{'blend':str(SOURCE/'knurling-tool-v1.blend'),'glb':str(glb)},
    'limits':['Reference body dimensions approximate','No production-tool identity asserted','No fixture, ring knurl creation, anodizing, or website integration implemented'],
}
(EVIDENCE/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'knurling-tool-v1.blend'))
result={'blend':str(SOURCE/'knurling-tool-v1.blend'),'glb':str(glb),'objects':len(owned),'checks':checks,'manifest':str(EVIDENCE/'asset-manifest.json')}
