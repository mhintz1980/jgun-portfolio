"""Writes a COPY of the V16 master with only the REVEAL_FILL fix. The master is opened read-only and never saved.
blender -b <master> --python patch_master_copy.py -- <out.blend>
"""
import bpy, sys

out = sys.argv[sys.argv.index('--') + 1]
src = bpy.data.filepath.replace('\\', '/')
assert src.endswith('RL300-SAFE-photoreal-V16-review.blend'), src
assert not out.replace('\\', '/').endswith('RL300-SAFE-photoreal-V16-review.blend')
f = bpy.data.objects['REVEAL_FILL']
print('BEFORE', round(f.data.size_y, 4), round(f.location.y, 4))
if abs(f.data.size_y - 2.6) < 1e-6:
    top = f.location.y + f.data.size_y / 2
    f.data.size_y = top + 1.2
    f.location.y = (top - 1.2) / 2
print('AFTER', round(f.data.size_y, 4), round(f.location.y, 4))
bpy.ops.wm.save_as_mainfile(filepath=out, copy=True)
print('WROTE', out)
