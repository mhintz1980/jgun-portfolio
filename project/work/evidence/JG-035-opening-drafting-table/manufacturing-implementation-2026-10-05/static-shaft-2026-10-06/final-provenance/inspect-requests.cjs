// Prints per-case requests, store URLs, support pair and shot grid from capture-report.json.
const fs = require('node:fs');
const cap = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const c of cap.cases) {
  console.log('case', c.name, 'pass', c.pass, 'storeUrls', JSON.stringify(c.storeUrls));
  console.log(' requests:', JSON.stringify(c.requests));
  console.log(' supportPair:', JSON.stringify(c.supportPair).slice(0, 400));
  console.log(' shot ids/ts:', c.shots.map((s) => s.id + '@' + s.t + (s.sha256 ? '#' + s.sha256.slice(0, 8) : '')).join(', '));
}
