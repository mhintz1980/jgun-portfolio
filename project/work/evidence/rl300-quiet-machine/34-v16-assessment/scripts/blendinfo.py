import bpy, json, os, re, collections

out = {}
out['blender'] = bpy.app.version_string
out['file_version'] = list(bpy.data.version)
sc = bpy.context.scene
out['scenes'] = [s.name for s in bpy.data.scenes]
out['frame_range'] = [sc.frame_start, sc.frame_end]
out['render_engine'] = sc.render.engine

# objects
types = collections.Counter(o.type for o in bpy.data.objects)
out['object_types'] = dict(types)
mods = collections.Counter()
tris_total = 0
tris_visible = 0
per_coll = collections.Counter()
roots = collections.Counter()
mesh_objs = 0
for o in bpy.data.objects:
    for m in o.modifiers:
        mods[m.type] += 1
    if o.type == 'MESH' and o.data is not None:
        mesh_objs += 1
        t = sum(max(0, len(p.vertices) - 2) for p in o.data.polygons)
        tris_total += t
        if not o.hide_render and not o.hide_viewport:
            tris_visible += t
        # top-level ancestor name
        a = o
        while a.parent is not None:
            a = a.parent
        roots[a.name] += t
out['mesh_objects'] = mesh_objs
out['modifier_types'] = dict(mods)
out['triangles_all_mesh_objects_instances_counted'] = tris_total
out['triangles_not_hidden'] = tris_visible
out['unique_mesh_datablocks'] = len(bpy.data.meshes)
out['unique_mesh_triangles'] = sum(sum(max(0, len(p.vertices) - 2) for p in m.polygons) for m in bpy.data.meshes)
out['top_roots_by_tris'] = roots.most_common(14)
out['collections'] = [(c.name, len(c.objects)) for c in bpy.data.collections][:40]

# names compared with the shipped glb naming
v2 = [o.name for o in bpy.data.objects if o.name.startswith('V2')]
out['objects_named_V2'] = len(v2)
out['has_res_1019'] = [n for n in v2 if '1019' in n][:4]
out['has_res_1020'] = [n for n in v2 if '1020' in n][:4]
shipped_roots = ['ENCLOSURE_CHASSIS','COMPOSITE_PANELS','PUMP_HOUSING','ACOUSTIC_BAFFLES','ISOLATION_MOUNTS','DUCT_INTAKE','DUCT_EXHAUST','PROPOSED_LOWER_INTAKE']
out['shipped_roots_present'] = {r: (r in bpy.data.objects) for r in shipped_roots}
out['objects_with_LABYRINTH_or_EXHAUST_PORT'] = [o.name for o in bpy.data.objects if 'LABYRINTH' in o.name or 'EXHAUST_PORT' in o.name][:6]

# materials
PROC = {'TEX_NOISE','TEX_VORONOI','TEX_MUSGRAVE','TEX_WAVE','TEX_MAGIC','TEX_CHECKER','TEX_BRICK','TEX_GRADIENT','TEX_SKY','TEX_WHITE_NOISE','TEX_GABOR'}
EXPORTABLE = {'BSDF_PRINCIPLED','OUTPUT_MATERIAL','TEX_IMAGE','NORMAL_MAP','MAPPING','TEX_COORD','UVMAP','MIX','MATH','SEPARATE_COLOR','COMBINE_COLOR','SEPARATE_XYZ','COMBINE_XYZ','VALUE','RGB','REROUTE','GROUP','GROUP_INPUT','GROUP_OUTPUT','INVERT','COLOR_RAMP','CURVE_RGB','MIX_RGB','HUE_SAT','BRIGHTCONTRAST','GAMMA'}
mat_rows = []
nodetypes_all = collections.Counter()
used = set(m for o in bpy.data.objects if o.type == 'MESH' for m in (s.material for s in o.material_slots) if m)
for m in bpy.data.materials:
    if m not in used:
        continue
    if not m.use_nodes or m.node_tree is None:
        mat_rows.append({'name': m.name, 'nodes': 0, 'proc': [], 'img': [], 'bsdf': []})
        continue
    nt = m.node_tree
    types_here = collections.Counter(n.type for n in nt.nodes)
    for t, c in types_here.items():
        nodetypes_all[t] += c
    imgs = [(n.image.name, n.image.size[0], n.image.size[1]) for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image]
    bsdfs = sorted(set(n.type for n in nt.nodes if n.type.startswith('BSDF') or n.type in ('EMISSION','SUBSURFACE_SCATTERING','VOLUME_ABSORPTION','VOLUME_SCATTER')))
    proc = sorted(set(types_here) & PROC)
    nongltf = sorted(t for t in types_here if t not in EXPORTABLE)
    mat_rows.append({'name': m.name, 'nodes': len(nt.nodes), 'proc': proc, 'img': imgs, 'bsdf': bsdfs, 'non_gltf': nongltf})
out['materials_used'] = len(mat_rows)
out['materials_total_datablocks'] = len(bpy.data.materials)
out['materials_with_procedural_textures'] = sum(1 for r in mat_rows if r.get('proc'))
out['materials_with_non_principled_bsdf'] = sum(1 for r in mat_rows if any(b != 'BSDF_PRINCIPLED' for b in r.get('bsdf', [])))
out['materials_with_any_image'] = sum(1 for r in mat_rows if r.get('img'))
out['materials_gltf_clean'] = sum(1 for r in mat_rows if not r.get('non_gltf') and not r.get('proc') and all(b == 'BSDF_PRINCIPLED' for b in r.get('bsdf', [])))
out['node_types_top'] = nodetypes_all.most_common(16)
out['material_rows_first'] = mat_rows[:60]

# images
imgs = [(i.name, i.size[0], i.size[1], i.source, bool(i.packed_file)) for i in bpy.data.images if i.users > 0 and i.source in ('FILE','GENERATED','TILED')]
out['images_in_use'] = len(imgs)
out['images_pixels_total_M'] = round(sum(w*h for _, w, h, _, _ in imgs) / 1e6, 1)
out['images_largest'] = sorted(imgs, key=lambda r: -r[1]*r[2])[:8]

# world / lights / cameras / animation
out['lights'] = collections.Counter(l.type for l in bpy.data.lights)
out['cameras'] = len(bpy.data.cameras)
out['actions'] = len(bpy.data.actions)
w = sc.world
out['world_nodes'] = sorted(set(n.type for n in w.node_tree.nodes)) if w and w.use_nodes else None

path = os.environ['OUT_JSON']
with open(path, 'w') as f:
    json.dump(out, f, indent=1, default=str)
print('WROTE', path)
