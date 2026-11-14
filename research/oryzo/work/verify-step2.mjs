import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const captureBytes = readFileSync(resolve(root, 'capture.md'));
const originalBytes = readFileSync(resolve(root, 'work/capture.step2-before.md'));
const capture = captureBytes.toString('utf8');
const failures = [];
const requireCheck = (condition, label) => { if (!condition) failures.push(label); };
const heading = n => capture.indexOf(`## ${n}. `);
const originalRecovered = capture.slice(0, heading('4'))
  + capture.slice(heading('4b'), heading('4c'))
  + capture.slice(heading('8'));
requireCheck(Buffer.from(originalRecovered).equals(originalBytes), 'Original GLM bytes changed');
const headingOrder = [...capture.matchAll(/^## ([\d]+[a-z]?)\./gm)].map(m => m[1]);
requireCheck(JSON.stringify(headingOrder) === JSON.stringify(['0','1','2','3','4','4b','4c','5','6','8','8b']), 'Heading order');
const animationSection = capture.slice(heading('5'), heading('6'));
const tableLines = animationSection.split(/\r?\n/).filter(l => l.startsWith('|'));
const columns = tableLines[0].split('|').slice(1, -1).map(s => s.trim());
requireCheck(columns.length === 9, 'Animation column count');
for (const term of ['Trigger','What moves','Property','From','Duration or scroll span','Easing','Stagger','Source evidence']) {
  requireCheck(columns.some(c => c.includes(term)), `Missing column ${term}`);
}
const animationRows = tableLines.slice(2);
requireCheck(animationRows.length === 85, 'Animation inventory row count');
for (const [index, row] of animationRows.entries()) {
  const cells = row.split('|').slice(1, -1).map(s => s.trim());
  requireCheck(cells.length === 9 && cells.every(Boolean), `Invalid animation row ${index+1}`);
  requireCheck(/\[(seen|inferred)\]/.test(cells[0]), `Missing evidence marker row ${index+1}`);
  requireCheck(/\b[JCW] chars \d+–\d+/.test(cells.at(-1)), `Missing source location row ${index+1}`);
}
const additions = capture.slice(heading('4'), heading('4b')) + capture.slice(heading('4c'), heading('8'));
const sourceFiles = {
  J: 'data/js/hoisted.CRsATKbF.js',
  C: 'data/js/index.TL6TuoJb.css',
  W: 'data/js/SplatsWorker-DSMxtdkh.js'
};
const sourceEvidence = {};
for (const [alias, relativePath] of Object.entries(sourceFiles)) {
  const bytes = readFileSync(resolve(root, relativePath));
  sourceEvidence[alias] = {
    path: resolve(root, relativePath),
    bytes: bytes.length,
    utf16Chars: bytes.toString('utf8').length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
}
let citationsChecked = 0;
for (const citation of additions.matchAll(/\b([JCW]) chars ([\d–, ]+)/g)) {
  for (const range of citation[2].matchAll(/(\d+)–(\d+)/g)) {
    const from = Number(range[1]), to = Number(range[2]);
    requireCheck(from >= 0 && to > from && to <= sourceEvidence[citation[1]].utf16Chars, `Out-of-range citation ${citation[0]}`);
    citationsChecked++;
  }
}
const shaderSection = capture.slice(capture.indexOf('| Shader(s) / use'), heading('8'));
const shaderRows = shaderSection.split(/\r?\n/).filter(l => l.startsWith('| [seen]'));
for (const row of shaderRows) {
  const cells = row.split('|').slice(1, -1).map(s => s.trim());
  requireCheck(cells.length === 3 && /J chars/.test(cells[2]), 'Invalid shader catalogue row');
}
requireCheck(!additions.includes('```'), 'Unexpected long code block');
requireCheck(additions.includes('authored Rive easing unknown'), 'Missing opaque Rive disclosure');
requireCheck(additions.includes('Frame-dependent') || additions.includes('Frame-dependent'.toLowerCase()), 'Missing frame-dependent disclosure');
const report = {
  status: failures.length ? 'FAIL' : 'PASS',
  capture: resolve(root, 'capture.md'),
  headingOrder, animationRows: animationRows.length, animationColumns: columns,
  shaderFamilies: shaderRows.length, sourceRangesChecked: citationsChecked,
  originalBytesPreserved: Buffer.from(originalRecovered).equals(originalBytes),
  originalByteCount: originalBytes.length,
  originalSha256: createHash('sha256').update(originalBytes).digest('hex'),
  sourceEvidence, failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
