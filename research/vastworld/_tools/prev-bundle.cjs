// Inspect previous REA evidence bundle records for vastworld captures
const fs = require('fs');
const path = require('path');
const bundlePath = path.join(__dirname, '..', '_dl', 'rea-evidence-bundle.json');
const b = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
const want = process.argv.slice(2).map(Number);
const idxs = want.length ? want : [13, 6, 4, 12, 14];
for (const idx of idxs) {
  const r = b.records[idx];
  const nr = r.normalized_result;
  const p = r.parameters || {};
  const steps = nr.steps || [];
  console.log('=== record', idx, p.start_url && p.start_url.url, 'steps:', steps.length,
    'completeness:', nr.completeness && nr.completeness.status,
    '| at_end:', JSON.stringify((p.capture && p.capture.at_end) || []));
  for (const s of steps) {
    console.log('   step', s.step_index, s.action, s.status, 't=' + s.elapsed_ms,
      '| err:', s.error && s.error.message ? String(s.error.message).slice(0, 100) : s.error);
  }
  // events shape
  const ev = nr.events;
  if (Array.isArray(ev)) {
    console.log('   events:', ev.length, 'kinds:', [...new Set(ev.map(e => e.kind))].join(','));
  } else if (ev && typeof ev === 'object') {
    console.log('   events obj keys:', Object.keys(ev).join(','), JSON.stringify(ev).length, 'bytes');
  }
  // transaction count in raw result
  const raw = nr.transactions;
  if (Array.isArray(raw)) console.log('   transactions:', raw.length);
  console.log('   limitations:', JSON.stringify(nr.limitations || []).slice(0, 300));
}
