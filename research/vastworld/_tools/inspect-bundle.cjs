// Inspect exported REA evidence bundle for vastworld.ai scenario captures.
// Usage: node inspect-bundle.cjs <bundle.json> <mode>
//   modes: list | scenario <evidence_id prefix> | tx <evidence_id prefix> | artifacts <id prefix>
const fs = require('fs');
const path = process.argv[2];
const mode = process.argv[3] || 'list';
const idArg = process.argv[4] || '';
const bundle = JSON.parse(fs.readFileSync(path, 'utf8'));
const records = Array.isArray(bundle) ? bundle : (bundle.records || bundle.evidence || []);
function recStart(r) {
  const s = JSON.stringify(r);
  return s.includes('vastworld');
}
function norm(r) {
  return (r.normalized_result) || (r.result && r.result.normalized_result) || null;
}
if (mode === 'list') {
  records.forEach((r, i) => {
    const n = norm(r);
    const origin = n && n.scenario && n.scenario.start_origin;
    const steps = n && n.steps ? n.steps.length : '';
    const ev = n && n.events ? n.events.retained : '';
    console.log(i, (r.evidence_id || '').slice(0, 12), r.operation, origin || '', 'steps:' + steps, 'events:' + ev, 'limits:' + (r.limitation_count !== undefined ? r.limitation_count : (r.limitations ? r.limitations.length : '')));
  });
} else if (mode === 'scenario') {
  const r = records.find(x => (x.evidence_id || '').startsWith(idArg));
  if (!r) { console.log('NOT FOUND'); process.exit(1); }
  const n = norm(r);
  console.log('EVIDENCE', r.evidence_id);
  console.log('PARAMS start_url', JSON.stringify(r.parameters && r.parameters.start_url));
  console.log('PARAMS env', JSON.stringify(r.parameters && r.parameters.environment));
  console.log('PARAMS capture', JSON.stringify(r.parameters && r.parameters.capture));
  console.log('DURATION_MS', n.duration_ms, 'BROWSER', JSON.stringify(n.browser));
  for (const s of n.steps) {
    console.log(`STEP ${s.step_index} ${s.step_id} ${s.action} elapsed=${s.elapsed_ms} status=${s.status} err=${s.error ? JSON.stringify(s.error).slice(0, 200) : '-'} after_url=${s.after_url ? s.after_url.url : '-'}`);
  }
  console.log('EVENTS retained', n.events.retained, 'dropped', n.events.dropped);
  const fams = {};
  for (const e of n.events.items) fams[e.kind] = (fams[e.kind] || 0) + 1;
  console.log('EVENT_KINDS', JSON.stringify(fams));
} else if (mode === 'tx') {
  const r = records.find(x => (x.evidence_id || '').startsWith(idArg));
  if (!r) { console.log('NOT FOUND'); process.exit(1); }
  const n = norm(r);
  const items = n.events.items;
  // transaction map: id -> {url, type, status, headers, contentEventSequences}
  const tx = new Map();
  for (const e of items) {
    if (e.kind === 'request' || e.kind === 'request-finished' || e.kind === 'response' || e.kind === 'request-failed') {
      if (!tx.has(e.transaction_id)) tx.set(e.transaction_id, { url: e.url.url, type: e.resource_type, status: null, finish: null, enc: null, len: null, ct: null, observed: e.observed_at });
      const t = tx.get(e.transaction_id);
      if (e.kind === 'response') { t.status = e.status; }
      if (e.kind === 'request-finished') t.finish = e.elapsed_ms;
      if (e.kind === 'request-failed') t.fail = e.failure;
    } else if (e.kind === 'network-content') {
      const t = tx.get(e.transaction_id);
      if (!t) continue;
      if (e.phase === 'response' && e.headers && e.headers.state === 'captured') {
        for (const h of e.headers.items) {
          if (h.name === 'content-encoding') t.enc = h.value;
          if (h.name === 'content-length') t.len = h.value;
          if (h.name === 'content-type') t.ct = h.value;
        }
      }
      if (e.body && e.body.state) t.body = e.body.state + (e.body.observed_bytes !== undefined ? ':' + e.body.observed_bytes : '');
    }
  }
  let i = 0;
  for (const [id, t] of tx) {
    i++;
    console.log(`TX ${id} [${t.type}] ${t.status || '-'} finish=${t.finish != null ? Math.round(t.finish) : '-'}ms enc=${t.enc || '-'} len=${t.len || '-'} ${t.url.slice(0, 130)}`);
  }
  console.log('TOTAL_TX', i);
} else if (mode === 'artifacts') {
  const r = records.find(x => (x.evidence_id || '').startsWith(idArg));
  if (!r) { console.log('NOT FOUND'); process.exit(1); }
  const n = norm(r);
  for (const s of n.steps) {
    const a = s.artifacts || {};
    const parts = [];
    for (const [k, v] of Object.entries(a)) {
      if (v && v.state === 'captured') {
        if (k === 'screenshot') parts.push('screenshot:' + (v.artifact_id || v.digest || 'yes'));
        else if (k === 'dom') parts.push('dom:len' + (v.text ? v.text.length : JSON.stringify(v).length));
        else parts.push(k + ':' + JSON.stringify(v).slice(0, 120));
      }
    }
    if (parts.length) console.log('STEP', s.step_id, parts.join(' | '));
  }
  // full artifact bodies location
  const artKeys = Object.keys(r).filter(k => !['evidence_id','provider','operation','parameters','normalized_result','limitations','subject','confidence','authority','analysis_profile_digest','retention','predicate_type','analysis_profile','raw_result'].includes(k));
  console.log('TOP_LEVEL_KEYS', artKeys.join(','));
} else if (mode === 'dump-artifact') {
  const r = records.find(x => (x.evidence_id || '').startsWith(idArg));
  const artId = process.argv[5];
  const s = JSON.stringify(r);
  console.log('searching for artifact', artId, 'length', s.length);
}
