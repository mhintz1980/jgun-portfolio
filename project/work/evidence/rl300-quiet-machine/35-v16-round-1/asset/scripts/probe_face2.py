"""Probe the face plate topology: pinch vertices, loop lengths vs boundary edge counts, per-face-component sizes."""
import bpy, bmesh, json

o = bpy.data.objects['BREP1.002']
bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
be = [e for e in bm.edges if len(e.link_faces) == 1]
cnt = {}
for e in be:
    for v in e.verts:
        cnt[v] = cnt.get(v, 0) + 1
pinch = [v for v, c in cnt.items() if c > 2]
print('PF boundary_edges', len(be), 'boundary_verts', len(cnt), 'pinch_verts', len(pinch))
# edge-connected components of faces
bm.faces.ensure_lookup_table()
seen = set(); comps = []
for f in bm.faces:
    if f in seen:
        continue
    st = [f]; seen.add(f); n = 0
    while st:
        c = st.pop(); n += 1
        for e in c.edges:
            for g in e.link_faces:
                if g not in seen:
                    seen.add(g); st.append(g)
    comps.append(n)
print('PF face_components_by_edge', sorted(comps, reverse=True)[:10])
# boundary loops via edge adjacency only (not via vertex pinch)
adj = {}
for e in be:
    adj.setdefault(e.verts[0], []).append(e.verts[1]); adj.setdefault(e.verts[1], []).append(e.verts[0])
visited = set(); loops = []
for v in adj:
    if v in visited:
        continue
    n = 0; st = [v]; visited.add(v)
    while st:
        c = st.pop(); n += 1
        for w in adj[c]:
            if w not in visited:
                visited.add(w); st.append(w)
    loops.append(n)
print('PF loops_by_vertex_adjacency', len(loops), sorted(loops, reverse=True)[:34])
