// Load vastworld.ai in the no-WebGL chrome (port 9556) and report fallback behavior.
// Usage: node nowebgl.cjs <port>
const http = require('http');
const fs = require('fs');
const port = parseInt(process.argv[2] || '9556');
function getJSON(path) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port, path }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej);
  });
}
setTimeout(() => { console.error('WATCHDOG'); process.exit(3); }, 45000);
async function main() {
  const targets = await getJSON('/json/list');
  const page = targets.find(t => t.type === 'page');
  if (!page) { console.error('NO_PAGE'); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const consoleLines = [];
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    else if (m.method === 'Runtime.consoleAPICalled') {
      const args = (m.params.args || []).map(a => a.value !== undefined ? JSON.stringify(a.value) : (a.description || a.type)).join(' ');
      consoleLines.push('CONSOLE[' + m.params.type + '] ' + args.slice(0, 200));
    } else if (m.method === 'Log.entryAdded') {
      consoleLines.push('LOG[' + m.params.entry.level + '] ' + String(m.params.entry.text).slice(0, 200));
    } else if (m.method === 'Runtime.exceptionThrown') {
      consoleLines.push('EXC ' + String(JSON.stringify(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text)).slice(0, 200));
    }
  };
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'https://vastworld.ai/' });
  await new Promise(r => setTimeout(r, 12000));
  const r = await send('Runtime.evaluate', { expression: `(() => {
    const canvases = [...document.querySelectorAll('canvas')].map(c => ({ w: c.width, h: c.height, cssW: c.clientWidth, visible: !!c.offsetParent }));
    return JSON.stringify({
      title: document.title,
      gl: (() => { try { const t = document.createElement('canvas'); return !!(t.getContext('webgl2') || t.getContext('webgl')); } catch (e) { return 'err'; } })(),
      canvases,
      bodyTextLen: (document.body.innerText || '').length,
      bodyTextSample: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 300),
      scrollContainer: !!document.querySelector('#scroll-container')
    });
  })()`, returnByValue: true });
  let val = null;
  try { val = JSON.parse(r.result.value); } catch (e) { console.error('PARSE', r.result && r.result.value); }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot && shot.data) fs.writeFileSync(__dirname + '\\..\\_dl\\fresh\\nowebgl-shot.png', Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ val, console: consoleLines.slice(0, 30) }, null, 1));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
