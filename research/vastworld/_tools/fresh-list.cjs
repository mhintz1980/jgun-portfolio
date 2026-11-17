// Analyze fresh REA evidence bundle: list capture records, steps, urls, screenshots
const fs = require('fs');
const path = require('path');
const b = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '_dl', 'rea-evidence-fresh.json'), 'utf8'));
const OUT = path.join(__dirname, '..', '_dl', 'fresh');
const records = b.records || [];
console.log('records:', records.length);
const caps = [];
records.forEach((r, i) => {
  if (r.operation === 'capture_browser_scenario') {
    const n = r.normalized_result || {};
    const su = r.parameters && r.parameters.start_url ? r.parameters.start_url.url : '?';
    const env = r.parameters && r.parameters.environment ? r.parameters.environment : {};
    const vp = env.viewport ? env.viewport.width + 'x' + env.viewport.height : '?';
    const steps = n.steps || [];
    const lastUrl = steps.length ? (steps[steps.length - 1].after_url || {}).url : '?';
    console.log(`REC ${i} eid=${(r.evidence_id || '').slice(0, 14)} start=${su} vp=${vp} rm=${env.reduced_motion} steps=${steps.length} end=${lastUrl} completeness=${n.completeness ? n.completeness.status : '?'}`);
    steps.forEach(s => console.log(`   step ${s.step_index} ${s.action} ${s.step_id} t=${s.elapsed_ms} status=${s.status} url=${s.after_url ? s.after_url.url.slice(0, 60) : '-'}`));
    caps.push(i);
  }
});
// dump screenshots of interesting records
for (const i of caps) {
  const r = records[i];
  const n = r.normalized_result || {};
  const eid = (r.evidence_id || '').slice(0, 10);
  const env = r.parameters && r.parameters.environment ? r.parameters.environment : {};
  const tag = (env.viewport ? env.viewport.width : 'x') + '-' + (env.reduced_motion || '').slice(0, 4);
  for (const s of n.steps || []) {
    const a = s.artifacts && s.artifacts.screenshot;
    if (a && a.state === 'captured' && a.value && a.value.data_base64) {
      const f = path.join(OUT, `shot-${eid}-${tag}-${s.step_id}.png`);
      fs.writeFileSync(f, Buffer.from(a.value.data_base64, 'base64'));
      console.log('WROTE', f, a.value.bytes, 'bytes');
    }
    const dom = s.artifacts && s.artifacts.dom;
    if (dom && dom.state === 'captured' && dom.value && dom.value.text) {
      const f = path.join(OUT, `dom-${eid}-${tag}-${s.step_id}.html`);
      fs.writeFileSync(f, dom.value.text);
      console.log('WROTE-DOM', f, dom.value.text.length, 'chars');
    }
  }
}
