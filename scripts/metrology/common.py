"""Render-only metrology assets. Metres, +Z up, long/rolling axis +X."""
import bpy, math
from mathutils import Vector

MATS = {}
ROOT = None

def material(name, color, metal=0, rough=.35):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    MATS[name] = m
    return m

def palette():
    for args in [('steel', (.59,.63,.65),1,.26), ('lap',(.74,.77,.79),1,.12),
                 ('black',(.028,.032,.035),.65,.32), ('grip',(.035,.038,.041),0,.58),
                 ('brass',(.58,.36,.12),1,.3), ('red',(.42,.016,.012),.25,.32),
                 ('green',(.018,.22,.09),.5,.3), ('ink',(.008,.012,.014),0,.7),
                 ('ivory',(.82,.81,.73),0,.42), ('ruby',(.62,.006,.025),.1,.12)]:
        material(*args)

def root(name):
    global ROOT
    ROOT = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(ROOT)
    return ROOT

def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.parent = ROOT
    obj.data.materials.append(MATS[mat])
    if bevel:
        mod = obj.modifiers.new('machined edge radius', 'BEVEL')
        mod.width, mod.segments = bevel, 3
        mod.affect = 'EDGES'
        mod.limit_method = 'ANGLE'
        bpy.context.view_layer.objects.active = obj
        assert bpy.ops.object.modifier_apply(modifier=mod.name) == {'FINISHED'}
    return obj

def box(name, size, pos, mat='steel', bevel=.00035):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    o = bpy.context.object
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o,name,mat,bevel)

def cylinder(name, radius, length, pos, mat='steel', axis='X', vertices=48, r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius,
        radius2=radius if r2 is None else r2, depth=length, location=pos)
    o = bpy.context.object
    if axis == 'X': o.rotation_euler.y = math.pi/2
    if axis == 'Y': o.rotation_euler.x = math.pi/2
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    finish(o,name,mat,0 if name.startswith('detail-') else min(radius*.12,.00025))
    for f in o.data.polygons: f.use_smooth = len(f.vertices)==4
    return o

def profile(name, points, depth, z, mat='steel', bevel=.0004):
    n = len(points)
    verts = [(x,y,z + h) for h in (0,depth) for x,y in points]
    faces = [tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o)
    return finish(o,name,mat,bevel)

def line(name, a, b, radius=.00025, mat='steel', vertices=12):
    d=Vector(b)-Vector(a)
    o=cylinder(name,radius,d.length,(Vector(a)+Vector(b))/2,mat,'Z',vertices)
    o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    return o

def knurl(name,x,length,r,z,mat='steel',count=40):
    # Real diagonal crosshatch, consolidated into the detail material mesh later.
    for direction in (-1,1):
        for i in range(count):
            a=2*math.pi*i/count
            b=a+direction*.26
            line('detail-'+name,(x-length/2,r*math.sin(a),z+r*math.cos(a)),
                (x+length/2,r*math.sin(b),z+r*math.cos(b)),.00012,mat,6)

def text(name, body, pos, size, mat='ink', rotation=(0,0,0)):
    curve=bpy.data.curves.new(name,'FONT'); curve.body=body
    curve.size=size; curve.extrude=0; curve.resolution_u=2
    o=bpy.data.objects.new(name,curve); bpy.context.collection.objects.link(o)
    o.location=pos; o.rotation_euler=rotation; o.parent=ROOT
    o.data.materials.append(MATS[mat])
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o.select_set(False)
    return o

def consolidate(r):
    # Preserve a real lite tier: all crosshatch/fastener micro-detail is removable.
    bpy.ops.object.select_all(action='DESELECT')
    groups={}
    for o in list(r.children):
        if o.type=='MESH':
            key=(o.data.materials[0].name,o.name.startswith('detail-'))
            groups.setdefault(key,[]).append(o)
    for (mat,detail),obs in groups.items():
        for o in obs: o.select_set(True)
        bpy.context.view_layer.objects.active=obs[0]
        if len(obs)>1: assert bpy.ops.object.join()=={'FINISHED'}
        o=bpy.context.object; o.name=('detail-' if detail else '')+r.name+'-'+mat
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        o.select_set(False)
    assert len(r.children)>0
