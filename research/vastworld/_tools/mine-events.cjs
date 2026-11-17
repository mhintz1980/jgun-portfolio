// Mine network transactions and events from previous REA bundle (vastworld records)
const fs = require('fs');
const path = require('path');
const bundlePath = path.join(__dirname, '..', '_dl', 'rea-evidence-bundle.json');
const b = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
const idx = Number(process.argv[2] || 13);
const r = b.records[idx];
const nr = r.normalized_result;
const ev = nr.events;
console.log('retained:', ev.retained, 'dropped:', ev.dropped, 'omissions:', JSON.stringify(ev.omissions).slice(0, 300));
const items = ev.items || [];
console.log('items:', items.length, 'kinds:', [...new Set(items.map(e => e.kind))].join(','));
// find network transactions
const txs = items.filter(e => e.kind && e.kind.toLowerCase().includes('transaction') || e.kind && e.kind.toLowerCase().includes('network'));
console.log('network-ish events:', txs.length);
if (txs.length) {
  console.log('sample tx:', JSON.stringify(txs[0]).slice(0, 2000));
}
// console events sample
const con = items.filter(e => e.kind && e.kind.toLowerCase().includes('console'));
console.log('console events:', con.length);
con.slice(0, 10).forEach(c => console.log('  console:', JSON.stringify(c).slice(0, 300)));
