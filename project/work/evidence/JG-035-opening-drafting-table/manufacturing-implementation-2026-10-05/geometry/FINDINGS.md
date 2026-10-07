# G0 geometry findings

Command (Blender 5.1, read-only inputs; rewrites only this folder):

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' -b --factory-startup --python-exit-code 1 --python scripts/manufacturing/measure_g0.py
```

Outputs: `early-datum.json` (camera/datum), `measurement-summary.json`, `source-registry.json`, `measurement.log`. Final stdout line starts `G0_MEASUREMENT`.

## Measured

- All six approved baseline files match size and SHA-256. Source hashes are re-read after the run and are unchanged.
- Live Default.glb occurrence: nodes 0 Default > 9 gearbox > 66 A000881-1 > 71 occurrence of P001835-2 > 72 P001835-2. Mesh JSON, accessor/bufferView tables and BIN payload equal the isolated extract; decoded local vertex error 0.0 mm. A failed historical revision is not authenticated.
- Shaft-local datum: saved matrix equals live matrix (max abs error 0). Local +Y maps to glTF -Z. Export-to-runtime registration, including rest recentering, is in registration.approved_export_gltf_to_hero_rest. Runtime parent pose is applied afterwards.
- Bearing K000210 and ring K000211 move by +2.750000101 / +2.749999985 mm along shaft-local Y; rigid residual below 0.0021 mm. Their GLB vertex sets equal the approved native Blend. Housing P000725 has 332 moved bore-shoulder vertices at +2.749999985 mm; the housing is alternate design geometry, not a sliding part. The shift is already included in the exports.
- Approved shaft bounds (mm, shaft-local): X -8.8646/8.8646, Y -0.00011/71.52395, Z -8.86458/8.86424.
- Tooth section y=6 mm: 10 teeth, 36 deg pitch, 0.0 deg clock delta (0.1 deg sampling), tip 6.0834 mm, root 4.2918 mm, same-clock radial RMS 0.000209 mm, max 0.00256 mm. Module/pressure angle/cutter are unresolved.
- Face start y=3.1749 mm; functional face end y=9.5249 mm; +X tooth-space floor reaches the 6.074 mm filler radius at y=13.78 mm; the report's 14.0639 mm is the authored sweep end, not clearance. The 6 mm value is an authored construction radius, not a verified hob OD or axial travel. Journal r about 6.32 mm from y 14.18 mm; ring groove floor about 6.04 mm from y 14.70 to 15.50 mm; shoulder r about 8.27 mm at y 19.75 mm.
- Reported build topology has exactly one non-manifold edge at y=8.9 mm (4 linked faces). Approved Blend/GLB reimport have unwelded split edges (282998 native, 363 after 1 um weld in export), so G2 must derive a fixed copy and compare silhouette/fit.
- K000180-1 spring: no triangle intersection with approved shaft; sampled mesh surface distance 5.461 mm. This is mesh distance only.
- Bearing is one connected component after 1 um weld; independent races are not established.

## Unresolved or blocking for G2

- Planet P000247 x4 cross the revised shaft in the gear band (triangle pairs 469-656 vs 109-128 against the legacy same pose). Pair count is not penetration depth; classify mesh-contact/overlap and clocking before accepting gear envelopes.
- ring_NEW crosses the approved shaft near y 14.447-19.323 mm (1029 vs 408 legacy-shaft pairs). The seat/groove contact must be classified as intended retained fit vs overlap before bearing or ring separability claims.
- K000131 pair and ROTOR also cross at y 33-71 mm, nearly the same as the legacy shaft pose; far from the machined feature.
- Production shaper/hob geometry, setting angle, starts, swept envelope and positive tool clearance are unresolved. Uncertainty screen: 0.002 mm export/decode, 0.02 mm comparison/contact; not a tolerance or CAD chord-error proof.

## Served attribution

Unproven. usage.jsonl shows request IDs under one shared conversation containing mixed gpt-6.1-sol and anthropic/claude-sonnet-5-5 records; I cannot reliably associate individual records with this leaf agent.
