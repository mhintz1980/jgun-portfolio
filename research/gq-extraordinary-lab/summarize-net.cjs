// Summarize probe v2 network JSONs.
const fs = require('fs');
const dir = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab/';
const d = JSON.parse(fs.readFileSync(dir + 'net-desktop2.json', 'utf8'));
const m = JSON.parse(fs.readFileSync(dir + 'net-mobile2.json', 'utf8'));

function group(rows) {
  const g = { jsGQ: 0, jsInteractive: 0, models3D: 0, video: 0, img: 0, font: 0, doc: 0, other: 0, count: 0 };
  const items = [];
  for (const r of rows) {
    g.count++;
    const b = r.bytes || 0;
    const u = r.url;
    if (/interactive\.gq\.com/.test(u)) {
      if (/\.(js|mjs)(\?|$)/.test(u)) g.jsInteractive += b;
      else if (/\.(glb|gltf|ktx2|basis|hdr|exr|bin|draco)(\?|$)/.test(u)) g.models3D += b;
      else if (/\.(mp4|webm)(\?|$)/.test(u) || /video/.test(r.type || '')) g.video += b;
      else if (/\.(webp|png|jpg|jpeg)(\?|$)/.test(u)) g.img += b;
      else if (/\.(woff2?|ttf)(\?|$)/.test(u)) g.font += b;
      else g.other += b;
      if (!/\.(webp|png|jpg)/.test(u)) items.push({ tail: u.replace('https://interactive.gq.com', '').slice(0, 100), type: r.type, bytes: r.bytes, wall: Math.round(r.wall) });
    } else {
      if (/\.(js|mjs)(\?|$)/.test(u) || r.type === 'Script') g.jsGQ += b;
      else if (r.type === 'Document') g.doc += b;
      else if (/\.(woff2?|ttf)(\?|$)/.test(u) || r.type === 'Font') g.font += b;
      else g.other += b;
    }
  }
  return { g, items };
}

for (const [name, cap] of [['DESKTOP', d], ['MOBILE', m]]) {
  const rows = cap.requests;
  const { g, items } = group(rows);
  const withBytes = rows.filter(r => r.bytes != null);
  const totalBytes = withBytes.reduce((s, r) => s + r.bytes, 0);
  console.log('==== ' + name + ' ====');
  console.log('requests:', rows.length, 'total transferred KB:', Math.round(totalBytes / 1024));
  console.log('groups KB:', JSON.stringify({ jsGQ: Math.round(g.jsGQ / 1024), jsInteractive: Math.round(g.jsInteractive / 1024), models3D: Math.round(g.models3D / 1024), video: Math.round(g.video / 1024), img: Math.round(g.img / 1024), font: Math.round(g.font / 1024), doc: Math.round(g.doc / 1024), other: Math.round(g.other / 1024) }));
  const biggest = withBytes.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 14);
  console.log('biggest:');
  for (const b of biggest) console.log('  ', Math.round(b.bytes / 1024) + ' KB', 'wall=' + Math.round(b.wall), b.url.replace(/https:\/\/(www\.gq\.com|interactive\.gq\.com)/, '').slice(0, 95));
  const inter = rows.filter(r => /interactive\.gq\.com/.test(r.url));
  const firstInter = inter.length ? Math.round(Math.min(...inter.map(r => r.wall))) : null;
  const lastInter = inter.length ? Math.round(Math.max(...inter.map(r => r.wall))) : null;
  console.log('interactive requests:', inter.length, 'first wall:', firstInter, 'last wall:', lastInter);
  console.log('milestones:', JSON.stringify(cap.milestones || {}));
  console.log('probe:', JSON.stringify(cap.probe1 || cap.probe || {}));
  console.log('clicks:', JSON.stringify(cap.clicks || []));
  const poll = cap.domPoll || [];
  console.log('domPoll first4:', JSON.stringify(poll.slice(0, 4)));
  console.log('domPoll last3:', JSON.stringify(poll.slice(-3)));
  console.log('consent:', JSON.stringify(cap.consent || {}));
  console.log('survey1:', JSON.stringify(cap.survey1 || cap.survey || {}));
  if (cap.survey2) console.log('survey2:', JSON.stringify({ bodyTextLength: cap.survey2.bodyTextLength, text: cap.survey2.text }));
  const nonMedia = items.filter(i => !/\.mp4$/.test(i.tail));
  console.log('interactive non-image items (' + nonMedia.length + '):');
  for (const i of nonMedia.slice(0, 40)) console.log('  ', JSON.stringify(i));
  console.log('');
}
// mobile vs desktop url diff
const dset = new Set(d.requests.map(r => r.url.replace(/\?.*/, '')));
const mset = new Set(m.requests.map(r => r.url.replace(/\?.*/, '')));
const onlyD = [...dset].filter(u => !mset.has(u));
const onlyM = [...mset].filter(u => !dset.has(u));
console.log('URLs only in desktop (' + onlyD.length + '): sample:', JSON.stringify(onlyD.slice(0, 12).map(u => u.replace('https://', '').slice(0, 90))));
console.log('URLs only in mobile (' + onlyM.length + '): sample:', JSON.stringify(onlyM.slice(0, 12).map(u => u.replace('https://', '').slice(0, 90))));
