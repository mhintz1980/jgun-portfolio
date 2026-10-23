"""Read-only: state of the saved scratch blend at frame 584 (lights, exposure, world)."""
import bpy

sc = bpy.context.scene
sc.frame_set(584)
vs = sc.view_settings
print('CM', vs.view_transform, 'look', vs.look, 'exposure', vs.exposure, 'gamma', vs.gamma)
for o in bpy.data.objects:
    if o.type == 'LIGHT':
        d = o.data
        print('LIGHT', o.name, d.type, 'energy', round(d.energy, 1), 'hide_render', o.hide_render,
              'anim', bool(o.animation_data and o.animation_data.action),
              'size', round(getattr(d, 'size', 0), 2), round(getattr(d, 'size_y', 0), 2),
              'loc', [round(v, 2) for v in o.matrix_world.translation])
wn = [n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND']
print('WORLD strength', [round(n.inputs['Strength'].default_value, 3) for n in wn])
print('CYCLES', sc.cycles.samples, sc.cycles.use_adaptive_sampling, 'clamp', sc.cycles.sample_clamp_indirect, sc.cycles.sample_clamp_direct)
print('FLOOR', bpy.data.objects['REVEAL_FLOOR'].hide_render, round(bpy.data.objects['REVEAL_FLOOR'].matrix_world.translation.z, 3))
