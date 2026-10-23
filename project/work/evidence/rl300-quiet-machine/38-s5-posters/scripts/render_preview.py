"""Local low-res previews of the poster frames from the scratch blend (nothing is saved to the blend).

blender -b <scratch blend> --python render_preview.py -- <outdir> <w> <h> <samples> <frame,frame,...> [cpu]
"""
import bpy, sys, os, time

a = sys.argv[sys.argv.index('--') + 1:]
outdir, w, h, spp, frames = a[0], int(a[1]), int(a[2]), int(a[3]), [int(x) for x in a[4].split(',')]
force_cpu = len(a) > 5 and a[5] == 'cpu'
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
cy = sc.cycles
dev = 'CPU'
if not force_cpu:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for backend in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            on = [d for d in prefs.devices if d.type == backend]
            if on:
                for d in prefs.devices:
                    d.use = (d.type == backend)
                dev = backend + ':' + ','.join(d.name for d in on)
                break
        except Exception:
            continue
cy.device = 'GPU' if dev != 'CPU' else 'CPU'
cy.samples = spp
cy.use_adaptive_sampling = True
cy.use_denoising = True
cy.denoiser = 'OPENIMAGEDENOISE'
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
sc.render.image_settings.file_format = 'PNG'
sc.render.use_motion_blur = False
os.makedirs(outdir, exist_ok=True)
print('PREVIEW device:', dev, flush=True)
for f in frames:
    t0 = time.time()
    sc.frame_set(f)
    sc.render.filepath = os.path.join(outdir, f'poster-f{f}.png')
    bpy.ops.render.render(write_still=True)
    print('PREVIEW frame', f, sc.camera.name, round(time.time() - t0, 1), 's', flush=True)
