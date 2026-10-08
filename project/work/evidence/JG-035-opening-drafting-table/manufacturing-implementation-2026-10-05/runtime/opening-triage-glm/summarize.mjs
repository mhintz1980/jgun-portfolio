import { readFileSync } from 'node:fs';

const clip = (v, n = 600) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s && s.length > n ? s.slice(0, n) + ' ...(' + s.length + ' chars)' : s;
};

for (const f of process.argv.slice(2)) {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  console.log('');
  console.log('########## ' + f);
  console.log('root keys: ' + Object.keys(j).join(', '));
  for (const [k, v] of Object.entries(j)) {
    if (k === 'cases' || k === 'checkpoints') continue;
    if (v == null || typeof v !== 'object') console.log('  ' + k + ': ' + clip(v));
    else if (Array.isArray(v)) console.log('  ' + k + ': array(' + v.length + ') ' + clip(v, 1200));
    else console.log('  ' + k + ': keys={' + Object.keys(v).join(',') + '} ' + clip(v, 300));
  }
  const cases = j.cases || (j.checkpoints ? [j] : []);
  for (const c of cases) {
    console.log('');
    console.log('== case ' + c.name + ' ' + c.width + 'x' + c.height + ' reduced=' + c.reducedMotion);
    for (const [k, v] of Object.entries(c)) {
      if (k === 'checkpoints') continue;
      if (v == null || typeof v !== 'object') console.log('   ' + k + ': ' + clip(v));
      else if (Array.isArray(v)) console.log('   ' + k + ': array(' + v.length + ') ' + clip(v, 1500));
      else console.log('   ' + k + ': keys={' + Object.keys(v).join(',') + '} ' + clip(v, 400));
    }
    for (const cp of c.checkpoints || []) {
      const perf = (cp.telemetry && cp.telemetry.performance) || {};
      console.log('   - ' + cp.name + ' mode=' + cp.mode + ' p=' + cp.progress + ' dir=' + (cp.direction || '') +
        ' live=' + cp.live + ' settled=' + cp.settled + ' settleMs=' + cp.settleMs +
        ' tier=' + (cp.tier || perf.tier) + ' declines=' + perf.declines + ' warm=' + perf.warmReady);
    }
  }
}
