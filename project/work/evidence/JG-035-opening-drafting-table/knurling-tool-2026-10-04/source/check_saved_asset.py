import bpy,json,os
from pathlib import Path
sc=bpy.data.scenes['JGUN_KNURLING_TOOL'];ctrl=bpy.data.objects['KT_CONTROL']
assert ctrl.animation_data and ctrl.animation_data.action
assert len(bpy.data.scenes['Scene'].objects)==3
report={'status':'PASS','filepath':bpy.data.filepath,'bytes':os.path.getsize(bpy.data.filepath),
    'scene':sc.name,'frame':sc.frame_current,'tool_objects':len(bpy.data.collections['KT_TOOL_ASSET'].objects),
    'control_action':ctrl.animation_data.action.name,
    'startup_objects':[o.name for o in bpy.data.scenes['Scene'].objects],
    'moving_nodes':[n for n in ['KT_TOOL_ROOT','KT_UPPER_HOLDER','KT_LOWER_HOLDER','KT_UPPER_KNURL_WHEEL_RH','KT_LOWER_KNURL_WHEEL_LH'] if n in bpy.data.objects]}
assert len(report['moving_nodes'])==5
Path(r'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-035-opening-drafting-table\knurling-tool-2026-10-04\saved-blend-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
