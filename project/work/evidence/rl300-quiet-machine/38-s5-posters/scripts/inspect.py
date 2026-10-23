import bpy, json, sys, mathutils
out = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
objs = list(bpy.data.objects)
info = {
    'file': bpy.data.filepath,
    'scenes': [s.name for s in bpy.data.scenes],
    'frame': [sc.frame_start, sc.frame_end, sc.frame_current, sc.render.fps],
    'camera': sc.camera.name if sc.camera else None,
    'cameras': [(o.name, o.data.lens, o.data.sensor_width, o.data.sensor_fit, o.data.angle_y, list(o.matrix_world.translation)) for o in objs if o.type == 'CAMERA'],
    'types': {},
    'engine': sc.render.engine,
    'res': [sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage],
    'cycles': {k: getattr(sc.cycles, k, None) for k in ('samples', 'use_denoising', 'denoiser', 'device', 'preview_samples')},
    'unit': [sc.unit_settings.system, sc.unit_settings.scale_length],
    'world': sc.world.name if sc.world else None,
    'view_transform': sc.view_settings.view_transform,
    'look': sc.view_settings.look,
    'booleans': [], 'modifiers': {}, 'clip': [],
    'collections': [(c.name, len(c.objects), c.hide_render, c.hide_viewport) for c in bpy.data.collections],
    'lights': [(o.name, o.data.type, o.data.energy, list(o.matrix_world.translation)) for o in objs if o.type == 'LIGHT'],
    'anim_objects': [o.name for o in objs if o.animation_data and o.animation_data.action],
    'materials': len(bpy.data.materials),
    'meshes': len(bpy.data.meshes),
    'hidden_render': [o.name for o in objs if o.hide_render],
    'top_level': [],
}
for o in objs:
    info['types'][o.type] = info['types'].get(o.type, 0) + 1
    for m in o.modifiers:
        info['modifiers'][m.type] = info['modifiers'].get(m.type, 0) + 1
        if m.type == 'BOOLEAN':
            info['booleans'].append((o.name, m.name))
    if 'cut' in o.name.lower() or 'section' in o.name.lower() or 'clip' in o.name.lower():
        info['clip'].append(o.name)
for o in objs:
    if o.parent is None:
        info['top_level'].append((o.name, o.type, len(o.children_recursive), [round(v, 4) for v in o.matrix_world.translation], [round(v, 4) for v in o.scale], o.hide_render))
json.dump(info, open(out, 'w'), indent=1, default=str)
