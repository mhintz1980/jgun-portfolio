import bpy, json, sys, mathutils
out = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
info = {}
mats = {}
for m in bpy.data.materials:
    d = {'users': m.users, 'nodes': 0, 'plane_nodes': 0, 'blend': getattr(m, 'surface_render_method', None)}
    if m.node_tree:
        d['nodes'] = len(m.node_tree.nodes)
        for n in m.node_tree.nodes:
            if n.type == 'TEX_COORD' and n.object is not None:
                d['plane_nodes'] += 1
    mats[m.name] = d
info['materials'] = mats
# objects with section_cap_flip
info['cap_flip'] = [o.name for o in bpy.data.objects if 'section_cap_flip' in o.keys()][:5]
info['cap_flip_n'] = sum(1 for o in bpy.data.objects if 'section_cap_flip' in o.keys())
# slots linked to OBJECT
n_obj_link = 0
n_section_slots = 0
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    for s in o.material_slots:
        if s.link == 'OBJECT':
            n_obj_link += 1
        if s.material and s.material.name.endswith('__SECTION'):
            n_section_slots += 1
info['obj_link_slots'] = n_obj_link
info['section_slots'] = n_section_slots
sp = bpy.data.objects['SECTION_PLANE']
ad = sp.animation_data
info['plane_anim'] = None
if ad and ad.action:
    info['plane_anim'] = {'action': ad.action.name, 'frame_range': list(ad.action.frame_range)}
    vals = []
    for f in (1, 100, 211, 300, 301, 392, 420, 450, 580, 600):
        sc.frame_set(f)
        vals.append((f, round(sp.matrix_world.translation.x, 3), round(sp.matrix_world.to_euler().z, 4)))
    info['plane_x_by_frame'] = vals
info['plane_empty'] = [sp.empty_display_type, list(sp.matrix_world.translation), [round(a, 4) for a in sp.matrix_world.to_euler()]]
sc.frame_set(1)
# door pivots over time
doors = [o for o in bpy.data.objects if o.name.startswith('DOOR_PIVOT_')]
dv = {}
for f in (1, 100, 211, 301, 600):
    sc.frame_set(f)
    dv[f] = {o.name[-10:]: round(o.rotation_euler.z, 3) for o in doors}
info['doors'] = dv
sc.frame_set(1)
# camera anim
for cn in ('CAM_ACCESS', 'CAM_REVEAL', 'HERO_CAM'):
    c = bpy.data.objects[cn]
    info[cn] = {'constraints': [(k.type, k.target.name if getattr(k, 'target', None) else None) for k in c.constraints],
                'action': c.animation_data.action.name if c.animation_data and c.animation_data.action else None,
                'parent': c.parent.name if c.parent else None}
info['render_cycles'] = {k: getattr(sc.cycles, k) for k in ('max_bounces', 'transparent_max_bounces', 'transmission_bounces', 'use_adaptive_sampling', 'adaptive_threshold', 'film_exposure') if hasattr(sc.cycles, k)}
info['film_transparent'] = sc.render.film_transparent
info['world_color'] = None
# bbox of whole mesh set, in blend coordinates
mn = mathutils.Vector((1e9,) * 3); mx = mathutils.Vector((-1e9,) * 3)
for o in bpy.data.objects:
    if o.type != 'MESH' or o.hide_render:
        continue
    for c in o.bound_box:
        v = o.matrix_world @ mathutils.Vector(c)
        mn = mathutils.Vector([min(a, b) for a, b in zip(mn, v)]); mx = mathutils.Vector([max(a, b) for a, b in zip(mx, v)])
info['bbox_blend'] = [list(mn), list(mx)]
json.dump(info, open(out, 'w'), indent=1, default=str)
