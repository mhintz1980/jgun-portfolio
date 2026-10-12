import bpy, json, sys, mathutils
out = sys.argv[sys.argv.index('--') + 1]
names = json.load(open(sys.argv[sys.argv.index('--') + 2]))
res = {}
def mesh_desc(o):
    r = []
    if o.type == 'MESH':
        r.append(o)
    for c in o.children_recursive:
        if c.type == 'MESH':
            r.append(c)
    return r
for n in names:
    o = bpy.data.objects.get(n)
    if o is None:
        res[n] = None
        continue
    ms = mesh_desc(o)
    mn = [1e9] * 3; mx = [-1e9] * 3
    for m in ms:
        for c in m.bound_box:
            v = m.matrix_world @ mathutils.Vector(c)
            for i in range(3):
                mn[i] = min(mn[i], v[i]); mx[i] = max(mx[i], v[i])
    res[n] = {'min': mn, 'max': mx, 'meshes': len(ms)}
json.dump(res, open(out, 'w'))
