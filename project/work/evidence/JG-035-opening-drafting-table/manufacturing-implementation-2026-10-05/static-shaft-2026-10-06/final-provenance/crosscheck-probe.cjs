// Field-level diff of my fresh new-source sample vs the source worker's recorded
// "before" rows. Diagnostic companion to equivalence-resample.mjs. Read-only.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.join(process.cwd(), 'package.json'));
const ts = req('typescript');
const root = process.cwd();
const SHAFT = path.join(root, 'src/scene/inspection/shaft');
const cache = new Map();
function load(file, base) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const m = { exports: {} };
  cache.set(file, m);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('module', 'exports', 'require', js)(m, m.exports, (s) => {
    if (s.startsWith('.')) {
      let r = path.resolve(base, s);
      if (!path.extname(r)) r += '.ts';
      return load(r, SHAFT);
    }
    return req(s);
  });
  return m.exports;
}
const New = load(path.join(SHAFT, 'kinematics.ts'), SHAFT);
const Prog = load(path.join(SHAFT, 'progression.ts'), SHAFT);
const worker = JSON.parse(fs.readFileSync(path.join(root,
  'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05',
  'shaft-stock-contact-correction-2026-10-06/static-source-equivalence.json'), 'utf8'));
function flat(o, p, out) {
  if (o === null || typeof o !== 'object') { out[p] = o; return out; }
  for (const k of Object.keys(o)) flat(o[k], p + '.' + k, out);
  return out;
}
for (const row of worker.rows) {
  const f = New.createShaftKinematicsFrame();
  const s = Prog.createProgressionState();
  New.sampleShaftKinematics(row.t, f);
  New.writeShaftProgression(f, s);
  const mine = Object.assign({}, flat(f, 'k', {}), flat(s, 'p', {}));
  const theirs = Object.assign({}, flat(row.before.kinematics, 'k', {}), flat(row.before.progression, 'p', {}));
  const diffs = [];
  for (const key of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const a = mine[key];
    const b = theirs[key];
    if (typeof a === 'number' && typeof b === 'number') {
      if (!Object.is(a, b)) diffs.push(key + ': mine=' + a + ' theirs=' + b + ' delta=' + (a - b));
    } else if (String(a) !== String(b)) diffs.push(key + ': mine=' + String(a) + ' theirs=' + String(b));
  }
  console.log('t=' + row.t + ' diffs=' + diffs.length + (diffs.length ? '\n  ' + diffs.slice(0, 8).join('\n  ') : ''));
}
