// Prints header + per-case structure of capture-report.json. Read-only.
const fs = require('node:fs');
const cap = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log('url:', cap.url, 'started:', cap.started, 'completed:', cap.completed);
console.log('method:', cap.method);
for (const c of cap.cases) {
  console.log('case keys:', Object.keys(c).join(', '));
  for (const k of Object.keys(c)) {
    const v = c[k];
    if (Array.isArray(v)) console.log('  ' + k + ': array(' + v.length + ')');
    else if (v === null || typeof v !== 'object') console.log('  ' + k + ':', String(v).slice(0, 140));
  }
  const arrKey = Object.keys(c).find((k) => Array.isArray(c[k]));
  if (arrKey) {
    const one = c[arrKey][0];
    console.log('  ' + arrKey + '[0] keys:', one && typeof one === 'object' ? Object.keys(one).join(', ') : typeof one);
    if (one && typeof one === 'object') console.log('  sample:', JSON.stringify(one).slice(0, 900));
  }
}
