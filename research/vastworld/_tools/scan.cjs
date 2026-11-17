// Fingerprint scanner: finds library version tokens + short contexts in a JS/HTML file.
// Usage: node scan.js <file> <token1> <token2> ...
const fs = require('fs');
const file = process.argv[2];
const tokens = process.argv.slice(3);
const text = fs.readFileSync(file, 'utf8');
console.log('FILE', file, 'LEN', text.length, 'LINES', text.split('\n').length);
for (const t of tokens) {
  let idx = text.indexOf(t);
  let count = 0;
  let first = -1;
  while (idx !== -1 && count < 200) { count++; if (first === -1) first = idx; idx = text.indexOf(t, idx + 1); }
  console.log('TOKEN', JSON.stringify(t), 'count', count, 'firstIndex', first);
  if (first !== -1) {
    const s = Math.max(0, first - 100);
    console.log('  CTX:', JSON.stringify(text.slice(s, first + t.length + 140)));
  }
}
// version-string sweep
const vers = text.match(/\b\d+\.\d+\.\d+\b/g) || [];
const freq = {};
for (const v of vers) freq[v] = (freq[v] || 0) + 1;
const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log('SEMVER_FREQ', JSON.stringify(top));
