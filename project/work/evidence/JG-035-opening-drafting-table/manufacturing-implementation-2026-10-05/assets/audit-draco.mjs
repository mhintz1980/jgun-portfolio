import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import draco3d from 'draco3d';

const directory = path.dirname(fileURLToPath(import.meta.url));
const module = await draco3d.createDecoderModule({});
const report = { decoder: 'installed draco3d', bundles: {} };
for (const tier of ['full', 'lite']) {
  const filename = path.join(directory, `manufacturing-core-${tier}.glb`);
  const raw = fs.readFileSync(filename);
  const jsonLength = raw.readUInt32LE(12);
  const gltf = JSON.parse(raw.subarray(20, 20 + jsonLength).toString());
  const bin = raw.subarray(28 + jsonLength);
  const parts = {};
  for (const node of gltf.nodes.filter(node => node.mesh !== undefined)) {
    const primitives = gltf.meshes[node.mesh].primitives;
    if (primitives.length !== 1) throw new Error(`Unexpected primitive split ${node.name}`);
    const primitive = primitives[0];
    const extension = primitive.extensions.KHR_draco_mesh_compression;
    const view = gltf.bufferViews[extension.bufferView];
    const compressed = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const buffer = new module.DecoderBuffer();
    buffer.Init(new Int8Array(compressed), compressed.length);
    const decoder = new module.Decoder();
    const mesh = new module.Mesh();
    const status = decoder.DecodeBufferToMesh(buffer, mesh);
    if (!status.ok()) throw new Error(status.error_msg());
    if (mesh.num_faces() * 3 !== gltf.accessors[primitive.indices].count) throw new Error('Index count mismatch');
    const values = new module.DracoFloat32Array();
    const attribute = decoder.GetAttributeByUniqueId(mesh, extension.attributes.POSITION);
    decoder.GetAttributeFloatForAllPoints(mesh, attribute, values);
    const minimum = [Infinity, Infinity, Infinity], maximum = [-Infinity, -Infinity, -Infinity], center = [0, 0, 0];
    for (let i = 0; i < values.size(); i++) {
      const value = values.GetValue(i), axis = i % 3;
      if (!Number.isFinite(value)) throw new Error('Nonfinite coordinate');
      minimum[axis] = Math.min(minimum[axis], value);
      maximum[axis] = Math.max(maximum[axis], value);
      center[axis] += value / mesh.num_points();
    }
    const normalValues = new module.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(mesh, decoder.GetAttributeByUniqueId(mesh, extension.attributes.NORMAL), normalValues);
    let maxNormalLengthError = 0;
    for (let i = 0; i < normalValues.size(); i += 3) {
      const length = Math.hypot(normalValues.GetValue(i), normalValues.GetValue(i + 1), normalValues.GetValue(i + 2));
      if (!Number.isFinite(length)) throw new Error('Nonfinite normal');
      maxNormalLengthError = Math.max(maxNormalLengthError, Math.abs(length - 1));
    }
    parts[node.name] = { triangles: mesh.num_faces(), vertices: mesh.num_points(), bounds_gltf_m: [minimum, maximum],
      center_gltf_m: center, max_normal_length_error: maxNormalLengthError, extras: node.extras };
    for (const value of [values, normalValues, mesh, decoder, buffer]) module.destroy(value);
  }
  const expected = ['legacyshaft', 'approvedshaft', 'housing', 'legacybearing', 'legacyring', 'approvedbearing', 'approvedring'];
  if (expected.some(name => !parts[name]) || Object.keys(parts).length !== expected.length) throw new Error('Registry mismatch');
  const supportDeltas = {};
  for (const part of ['bearing', 'ring']) {
    supportDeltas[part] = parts[`approved${part}`].center_gltf_m.map((value, axis) => (value - parts[`legacy${part}`].center_gltf_m[axis]) * 1000);
    if (Math.abs(supportDeltas[part][2] + 2.75) > .002 || supportDeltas[part].slice(0, 2).some(value => Math.abs(value) > .002)) throw new Error('Baked endpoint delta mismatch');
  }
  report.bundles[tier] = { bytes: raw.length, sha256: createHash('sha256').update(raw).digest('hex'),
    primitive_calls: Object.keys(parts).length, parts, support_delta_gltf_mm: supportDeltas,
    scope: 'independent Node Draco decoding; no browser draw-call/performance or G2 acceptance claim' };
}
fs.writeFileSync(path.join(directory, 'draco-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(report.bundles).map(([tier, bundle]) => [tier, {
  bytes: bundle.bytes, sha256: bundle.sha256, calls: bundle.primitive_calls, support_delta_mm: bundle.support_delta_gltf_mm,
}]))));
