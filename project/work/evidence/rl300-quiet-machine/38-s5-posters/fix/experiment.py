"""Diagnostic renders of the beat-1 band region from the scratch blend; NEVER saves the blend.
blender -b <scratch blend> --python experiment.py -- <variant> <out.png>
variants: base | plain (skin gets a plain orange diffuse) | flat (skin flat shading) | nocustom (clear custom normals)
          | noclip (skin material mix factors untouched, section plane parked far away) | hideskin
"""
import bpy, sys, os

variant, out = sys.argv[sys.argv.index('--') + 1:][:2]
assert bpy.data.filepath.replace('\\', '/').endswith('/scratch/rl300-posters-v16.blend')
sc = bpy.context.scene
sc.frame_set(581)
sc.camera = bpy.data.objects['POSTER_CAM_1']
skin = bpy.data.objects['G2RL300-SAF-1003-2']

if variant == 'plain':
    m = bpy.data.materials.new('EXP_PLAIN')
    m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.9, 0.35, 0.02, 1)
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.5
    skin.data.materials[0] = m
elif variant == 'flat':
    for p in skin.data.polygons:
        p.use_smooth = False
elif variant == 'nocustom':
    bpy.context.view_layer.objects.active = skin
    for o in bpy.context.selected_objects:
        o.select_set(False)
    skin.select_set(True)
    bpy.ops.mesh.customdata_custom_splitnormals_clear()
elif variant == 'hideskin':
    skin.hide_render = True
elif variant.startswith('hide:'):
    for n in variant[5:].split(','):
        ob = bpy.data.objects[n]
        if ob.type == 'LIGHT':
            bpy.data.objects.remove(ob, do_unlink=True)   # animation would re-key hide/energy at render time
        else:
            ob.animation_data_clear()
            ob.hide_render = True
elif variant.startswith('fillfix:'):
    # fillfix:<min_y>  keep the +y end (1.2) and pull the -y end in to <min_y>
    min_y = float(variant.split(':')[1])
    L = bpy.data.objects['REVEAL_FILL']
    max_y = L.location.y + L.data.size_y / 2
    L.data.size_y = max_y - min_y
    L.location.y = (max_y + min_y) / 2
elif variant == 'lights':
    for ob in bpy.data.objects:
        if ob.type == 'LIGHT':
            print('LIGHT', ob.name, ob.data.type, round(ob.data.energy, 1), [round(v, 2) for v in ob.matrix_world.translation],
                  'spot' if ob.data.type == 'SPOT' else '', round(getattr(ob.data, 'spot_size', 0), 2), 'hide', ob.hide_render)

cy = sc.cycles
prefs = bpy.context.preferences.addons['cycles'].preferences
for backend in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
    try:
        prefs.compute_device_type = backend
        prefs.get_devices()
        on = [d for d in prefs.devices if d.type == backend]
        if on:
            for d in prefs.devices:
                d.use = (d.type == backend)
            break
    except Exception:
        continue
cy.device = 'GPU'
cy.samples = 64
cy.use_adaptive_sampling = True
cy.use_denoising = True
cy.denoiser = 'OPENIMAGEDENOISE'
r = sc.render
r.engine = 'CYCLES'
r.resolution_x, r.resolution_y, r.resolution_percentage = 1920, 1080, 100
r.use_border = True
r.use_crop_to_border = False
r.border_min_x, r.border_max_x = 380 / 1920, 860 / 1920
r.border_min_y, r.border_max_y = 1 - 420 / 1080, 1 - 180 / 1080
r.image_settings.file_format = 'PNG'
r.filepath = out
bpy.ops.render.render(write_still=True)
print('EXPERIMENT', variant, 'done', flush=True)
