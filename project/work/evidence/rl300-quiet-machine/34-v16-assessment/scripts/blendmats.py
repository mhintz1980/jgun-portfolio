import bpy, json, os

def val(sock):
    if sock is None:
        return None
    try:
        v = sock.default_value
        return [round(x, 3) for x in v] if hasattr(v, '__len__') else round(float(v), 3)
    except Exception:
        return None

rows = {}
for m in bpy.data.materials:
    if not m.use_nodes or not m.node_tree:
        continue
    nt = m.node_tree
    p = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not p:
        continue
    def link_src(name):
        s = p.inputs.get(name)
        if s is None or not s.is_linked:
            return None
        return s.links[0].from_node.type
    bump = next((n for n in nt.nodes if n.type == 'BUMP'), None)
    noise = next((n for n in nt.nodes if n.type == 'TEX_NOISE'), None)
    rows[m.name] = {
        'base': val(p.inputs.get('Base Color')), 'base_linked': link_src('Base Color'),
        'metal': val(p.inputs.get('Metallic')), 'metal_linked': link_src('Metallic'),
        'rough': val(p.inputs.get('Roughness')), 'rough_linked': link_src('Roughness'),
        'coat': val(p.inputs.get('Coat Weight')), 'coat_rough': val(p.inputs.get('Coat Roughness')),
        'aniso': val(p.inputs.get('Anisotropic')), 'trans': val(p.inputs.get('Transmission Weight')),
        'alpha': val(p.inputs.get('Alpha')), 'emit': val(p.inputs.get('Emission Strength')),
        'bump_strength': val(bump.inputs.get('Strength')) if bump else None,
        'noise_scale': val(noise.inputs.get('Scale')) if noise else None,
        'noise_detail': val(noise.inputs.get('Detail')) if noise else None,
    }
with open(os.environ['OUT_JSON'], 'w') as f:
    json.dump(rows, f, indent=1)
print('WROTE', len(rows))
