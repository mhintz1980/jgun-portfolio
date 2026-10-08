// Prints recorded hashes and row structure of static-source-equivalence.json. Read-only.
const fs = require('node:fs');
const eq = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log('hashes:', JSON.stringify(eq.hashes, null, 1));
console.log('all_equal:', eq.all_equal, 'rows:', eq.rows.length);
const row = eq.rows[0];
console.log('row keys:', Object.keys(row).join(', '));
console.log(JSON.stringify(row).slice(0, 1600));
