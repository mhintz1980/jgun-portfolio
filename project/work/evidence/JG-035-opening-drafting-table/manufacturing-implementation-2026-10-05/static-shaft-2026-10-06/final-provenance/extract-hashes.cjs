// Recursively lists every hash-like string field in a JSON file. Read-only.
const fs = require('node:fs');
function walk(node, acc, path) {
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (/hash|sha/i.test(key) && typeof value === 'string' && /^[0-9a-f]{16,}/i.test(value)) {
        acc.push(path + '.' + key + '=' + value);
      } else {
        walk(value, acc, path + '.' + key);
      }
    }
  }
  return acc;
}
console.log(walk(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), [], '$').join('\n'));
