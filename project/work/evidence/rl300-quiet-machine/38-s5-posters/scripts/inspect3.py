import bpy, json, sys

def fcs(action):
    r = []
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                r.extend(cb.fcurves)
    return r
out = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
info = {}
info['markers'] = [(m.name, m.frame, m.camera.name if m.camera else None) for m in sc.timeline_markers]
info['light_anim'] = {l.name: [(fc.data_path, fc.array_index, len(fc.keyframe_points)) for fc in fcs(l.animation_data.action)] for l in bpy.data.lights if l.animation_data and l.animation_data.action}
info['light_drivers'] = [l.name for l in bpy.data.lights if l.animation_data and len(l.animation_data.drivers)]
w = sc.world
info['world_anim'] = bool(w and w.animation_data)
info['world_node_tree_anim'] = bool(w and w.node_tree and w.node_tree.animation_data)
info['light_obj_anim'] = {o.name: bool(o.animation_data and o.animation_data.action) for o in bpy.data.objects if o.type == 'LIGHT'}
# object-level hide_render / hide_viewport fcurves anywhere
hid = []
for o in bpy.data.objects:
    if o.animation_data and o.animation_data.action:
        for fc in fcs(o.animation_data.action):
            if 'hide' in fc.data_path or 'visible' in fc.data_path:
                hid.append((o.name, fc.data_path))
info['hide_fcurves'] = hid
doors = [o for o in bpy.data.objects if o.name.startswith('DOOR_PIVOT_')] + [bpy.data.objects['STD-LBAP-4001-1']]
frames = (1, 7, 100, 211, 301, 392, 580)
info['frames'] = {}
for f in frames:
    sc.frame_set(f)
    d = {}
    for o in doors:
        m = o.matrix_world
        d[o.name[-14:]] = [round(m[i][j], 3) for i in range(3) for j in range(3)]
    info['frames'][f] = {
        'doors': d,
        'lights': {l.name: round(l.energy, 2) for l in bpy.data.lights},
        'camera': sc.camera.name if sc.camera else None,
        'plane_x': round(bpy.data.objects['SECTION_PLANE'].matrix_world.translation.x, 3),
    }
# which door pivot fcurves
info['door_fcurves'] = {o.name[-14:]: sorted({(fc.data_path, fc.array_index) for fc in fcs(o.animation_data.action)}) for o in doors if o.animation_data and o.animation_data.action}
info['door_keys'] = {o.name[-14:]: sorted({int(kp.co[0]) for fc in fcs(o.animation_data.action) for kp in fc.keyframe_points}) for o in doors if o.animation_data and o.animation_data.action}
# first frame doors differ from frame 1
sc.frame_set(1)
base = {o.name: [tuple(round(v, 4) for v in r) for r in o.matrix_world] for o in doors}
first_diff = {}
for f in range(1, 40):
    sc.frame_set(f)
    cur = {o.name: [tuple(round(v, 4) for v in r) for r in o.matrix_world] for o in doors}
    if cur != base:
        first_diff = f
        break
info['first_door_change_frame'] = first_diff
# images
info['images'] = [(i.name, i.filepath, i.source, bool(i.packed_file), i.has_data) for i in bpy.data.images]
bpy.ops.file.report_missing_files()
info['floor'] = {'hide_render': bpy.data.objects['REVEAL_FLOOR'].hide_render, 'visible_camera': bpy.data.objects['REVEAL_FLOOR'].visible_camera}
info['frame_end'] = sc.frame_end
info['render_filepath'] = sc.render.filepath
info['view_layers'] = [v.name for v in sc.view_layers]
info['color_mgmt'] = [sc.view_settings.view_transform, sc.view_settings.look, sc.view_settings.exposure, sc.display_settings.display_device]
json.dump(info, open(out, 'w'), indent=1, default=str)
