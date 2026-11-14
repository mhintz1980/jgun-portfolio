// Extract network transaction table from a REA bundle record
const fs = require('fs');
const path = require('path');
const bundlePath = path.join(__dirname, '..', '_dl', 'rea-evidence-bundle.json');
const b = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
const idx = Number(process.argv[2] || 13);
const r = b.records[idx];
const nr = r.normalized_result;
const items = (nr.events && nr.events.items) || [];

// group by transaction_id
const tx = new Map();
for (const e of items) {
  const id = e.transaction_id || '?';
  if (!tx.has(id)) tx.set(id, { id, seq: e.source_event_sequence, step: e.step_index });
  const t = tx.get(id);
  if (e.phase === 'request') {
    const h = hdr(e);
    t.method = h[':method'] || '?';
    t.url = (h[':scheme'] || 'https') + '://' + (h[':authority'] || '') + (h[':path'] || '');
    t.reqAccept = h['accept'];
    if (e.body && e.body.state === 'captured' && e.body.text) t.reqBody = e.body.text;
  } else if (e.phase === 'response' || e.kind === 'response') {
    const h = hdr(e);
    t.status = h[':status'] || h['status'] || '?';
    t.ctype = h['content-type'] || '';
    t.clen = h['content-length'] || '';
    t.cenc = h['content-encoding'] || '';
    t.cache = h['cache-control'] || '';
    t.cdn = h['server'] || h['x-vercel-id'] || h['cf-ray'] || '';
    if (e.body && e.body.state === 'captured' && e.body.text) t.respText = e.body.text;
    else if (e.body) t.bodyState = e.body.state;
  }
  if (e.kind === 'request-finished') t.finishedSeq = e.source_event_sequence;
}
function hdr(e) {
  const o = {};
  if (e.headers && e.headers.items) for (const h of e.headers.items) o[h.name.toLowerCase()] = h.value;
  return o;
}
const rows = [...tx.values()];
console.log('record', idx, 'transactions:', rows.length);
for (const t of rows) {
  const line = [
    t.id, 's' + (t.seq !== undefined ? t.seq : '?'), 'st' + (t.step !== undefined ? t.step : '?'),
    t.status || '-', (t.cenc || '-').split(',')[0],
    t.clen || '-', (t.ctype || '').split(';')[0],
    t.url ? t.url.slice(0, 120) : '?'
  ].join(' | ');
  console.log(line);
}
