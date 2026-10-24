"""Render frame(s) from the saved scratch blend exactly as stored (no fixes applied).
blender -b <blend> --python render_saved.py -- <out.png> <frame> <w> <h> <spp>
"""
import bpy, sys

out, frame, w, h, spp = sys.argv[sys.argv.index('--') + 1:][:5]
sc = bpy.context.scene
sc.frame_set(int(frame))
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = int(w), int(h), 100
sc.cycles.samples = int(spp)
sc.cycles.device = 'CPU'
sc.render.use_border = False
sc.render.filepath = out
import os
mode = os.environ.get('MODE', '')
L = bpy.data.objects.get('POSTER_B4_FILL')
if mode == 'nolight' and L: bpy.data.objects.remove(L, do_unlink=True)
if mode.startswith('e') and L: L.data.energy = float(mode[1:])
if L and mode != 'nolight':
    d = L.data
    print('LIGHTPROPS', {k: getattr(d, k) for k in ('energy','size','size_y','shape','spread','use_shadow','color','exposure','normalize','use_custom_distance','cutoff_distance') if hasattr(d, k)})
if os.environ.get('EXPO'): sc.view_settings.exposure = float(os.environ['EXPO'])
print('CAM', sc.camera.name, 'exposure', sc.view_settings.exposure, 'engine', sc.render.engine)
bpy.ops.render.render(write_still=True)
print('RENDERED', out)
