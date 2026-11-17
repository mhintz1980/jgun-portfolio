// Analyze vastworld scenario captures from exported REA evidence bundle.
// Usage: node timeline.cjs <bundle.json> <mode> <idPrefix>
// modes: tx (transaction timeline) | shots (dump screenshots) | urls (unique URL list)
const fs = require('fs');
const path = process.argv[2];
const mode = process.argv[3] || 'tx';
const idArg = process.argv[4] || '';
const OUT = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/vastworld/_dl';
const bundle = JSON.parse(fs.readFileSync(path, 'utf8'));
const records = Array.isArray(bundle) ? bundle : (bundle.records || bundle.evidence || []);
function norm(r) { return r.normalized_result || (r.result && r.result.normalized_result) || null; }

const rec = records.find(x => (x.evidence_id || '').includes(idArg));
if (!rec) { console.log('NOT FOUND', idArg); process.exit(1); }
const n = norm(rec);

if (mode === 'shots') {
  for (const s of n.steps) {
    const a = s.artifacts && s.artifacts.screenshot;
    if (a && a.state === 'captured' && a.value && a.value.data_base64) {
      const f = `${OUT}/shot-${idArg.slice(0, 8)}-${s.step_id}.png`;
      fs.writeFileSync(f, Buffer.from(a.value.data_base64, 'base64'));
      console.log('WROTE', f, a.value.bytes, 'bytes', 'sha256', a.value.sha256);
    }
  }
  process.exit(0);
}

// Build transaction table
const items = n.events.items;
const navStart = Math.min(...items.filter(e => e.observed_at || e.started_at).map(e => new Date((e.started_at || e.observed_at)).getTime()));
const tx = new Map();
for (const e of items) {
  if (['request', 'request-finished', 'response', 'request-failed'].includes(e.kind)) {
    if (!tx.has(e.transaction_id)) tx.set(e.transaction_id, { url: e.url.url, type: e.resource_type, status: null, t0: null, finish: null, enc: null, len: null, ct: null, fail: null, step: e.step_index });
    const t = tx.get(e.transaction_id);
    if (e.kind === 'request' && e.observed_at) { const ts = new Date(e.observed_at).getTime(); if (t.t0 === null) t.t0 = ts - navStart; }
    if (e.kind === 'request-finished') { const ts = new Date(e.started_at).getTime(); if (t.t0 === null) t.t0 = ts - navStart; t.finish = ts - navStart + e.elapsed_ms; }
    if (e.kind === 'response') t.status = e.status;
    if (e.kind === 'request-failed') t.fail = JSON.stringify(e.failure).slice(0, 80);
  } else if (e.kind === 'network-content' && e.phase === 'response' && e.headers && e.headers.state === 'captured') {
    const t = tx.get(e.transaction_id);
    if (!t) continue;
    for (const h of e.headers.items) {
      if (h.name === 'content-encoding') t.enc = h.value;
      if (h.name === 'content-length') t.len = h.value;
      if (h.name === 'content-type') t.ct = h.value;
    }
  }
}
const list = [...tx.entries()].sort((a, b) => (a[1].t0 ?? 1e15) - (b[1].t0 ?? 1e15));

if (mode === 'tx') {
  let totLen = 0, totKnown = 0, unknown = 0;
  for (const [id, t] of list) {
    const len = t.len ? parseInt(t.len) : null;
    if (len != null) { totKnown += len; } else unknown++;
    console.log(`t0=${String(Math.round(t.t0 ?? -1)).padStart(6)}ms finish=${t.finish != null ? String(Math.round(t.finish)).padStart(6) : '     -'}ms [${(t.type || '?').padEnd(10)}] ${t.status || '---'} enc=${(t.enc || '-').padEnd(4)} len=${t.len || '?'} ${t.fail || ''} ${short(t.url)}`);
  }
  console.log(`TOTAL_TX=${list.length} sum_content_length=${totKnown} bytes (${(totKnown / 1024).toFixed(0)} KB) no_content_length=${unknown}`);
} else if (mode === 'urls') {
  const set = new Set(list.map(([, t]) => t.url));
  [...set].sort().forEach(u => console.log(u));
}
function short(u) { return u.replace('https://vastworld.ai', '').replace('https://media.vastworld.ai', 'MEDIA:').slice(0, 110); }
