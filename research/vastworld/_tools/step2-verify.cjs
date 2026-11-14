const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const text = fs.readFileSync(path.join(root, 'capture.md'), 'utf8');
const expected = {
  '0.':'da4c7999599f64bd4bd22b8aa14a678953d5ff437a2855c436dd2c99801377d2',
  '1.':'8ebbe5d5486dba30d67bc9b3c73d00e30f331d33e75f0099f8e742c1b2887a91',
  '2.':'e7c5c55d247c44c5ebb8c6ac02e6bc3ca16e3520f85ca041f377f9e5fbe83a99',
  '3.':'c3ddb798ebcc7dde9d1fa48901940faa61d3ff0b507652a72fa04d0227e3eae9',
  '4b.':'26ab2f64fb3071a23ac31948f67046717d8e710ecfb65f8cfcc3285f0db0e6c9',
  '8.':'43eed497b8bb786cfa94cb5c847f8c82f0f75200f294eb44648a8dcf36ca34b6',
  '8b.':'bfbee5b503fbf06c35a96992a1f5a3e9f34eb94f6985d6c0f4f7ead08d6cf293'
};
let checks = 0;
const assert = (condition, message) => { checks++; if (!condition) throw Error(message); };
for (const m of text.matchAll(/^## (0\.|1\.|2\.|3\.|4b\.|8\.|8b\.)[^\n]*\n/gm)) {
  let end = text.indexOf('\n## ', m.index + 1);
  if (end < 0) end = text.length;
  assert(crypto.createHash('sha256').update(text.slice(m.index,end)).digest('hex') === expected[m[1]], 'Original section changed: '+m[1]);
}
const headings = [...text.matchAll(/^## (\d+[a-z]?)\./gm)].map(m=>m[1]);
assert(headings.join(',') === '0,1,2,3,4,4b,4c,5,6,8,8b', 'Heading order');
const inventory = text.slice(text.indexOf('## 5.'), text.indexOf('## 6.'));
const rows = [...inventory.matchAll(/^\| (\d\d) \[seen\].*$/gm)];
assert(rows.length === 90, 'Effect count');
rows.forEach((m,i) => {
  const cells = m[0].split('|').slice(1,-1).map(x=>x.trim());
  assert(Number(m[1]) === i+1, 'Row order');
  assert(cells.length === 8 && cells.every(Boolean), 'Missing effect fields: '+m[1]);
  assert(/[JCH]\[\d+,\d+\)/.test(cells[7]), 'Missing local evidence: '+m[1]);
});
const files = {J:'layout.js', C:'page-wrapper.css', H:'index.html'};
const sources = Object.fromEntries(Object.entries(files).map(([k,v])=>[k,fs.readFileSync(path.join(root,'_dl/fresh',v),'utf8')]));
let citations = 0;
for (const m of text.matchAll(/\b([JCH])\[(\d+),(\d+)\)/g)) {
  assert(Number(m[2]) < Number(m[3]) && Number(m[3]) <= sources[m[1]].length, 'Out-of-bounds citation '+m[0]);
  citations++;
}
const aLines = fs.readFileSync(path.join(root,'_dl/fresh/alive-looks.json'),'utf8').split('\n').length;
for (const m of text.matchAll(/A L(\d+)(?:–(\d+))?/g)) assert(+m[1] <= +(m[2]||m[1]) && +(m[2]||m[1]) <= aLines,'JSON line citation');
for (const section of ['4.','4c.','5.','6.']) {
  const start = text.indexOf('## '+section);
  let end = text.indexOf('\n## ', start+1);
  if (end<0) end=text.length;
  const lines=text.slice(start,end).split('\n');
  for(const line of lines.filter(l=>l.trim()&&!/^#|^\|/.test(l))) assert(/\[seen\]|\[inferred\]/.test(line),'Unlabelled prose: '+line.slice(0,60));
}
console.log(JSON.stringify({result:'PASS',checks,originalSectionsPreserved:7,effectRows:rows.length,sourceOffsetCitations:citations,headings},null,2));
