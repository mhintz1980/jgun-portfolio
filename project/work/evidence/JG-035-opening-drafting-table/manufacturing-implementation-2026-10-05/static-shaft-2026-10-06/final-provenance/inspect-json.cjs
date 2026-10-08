// CPU-only structural inspector for large evidence JSON files. Read-only.
// Usage: node inspect-json.cjs <file.json>
const fs = require('node:fs');

const file = process.argv[2];
if (!file) {
  console.error('usage: node inspect-json.cjs <file.json>');
  process.exit(2);
}
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function summarize(value, depth) {
  if (value === null || typeof value !== 'object') return typeof value;
  if (Array.isArray(value)) {
    return 'array(' + value.length + ')';
  }
  if (depth >= 3) return 'object';
  const out = {};
  for (const key of Object.keys(value)) out[key] = summarize(value[key], depth + 1);
  return out;
}

console.log(JSON.stringify(summarize(data, 0), null, 1));
