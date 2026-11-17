// Minimal install-expression test against the live page.
const http = require('http');
const t0 = Date.now();
const log = (...a) => console.error(Date.now() - t0, ...a);
const seconds = parseFloat(process.argv[2] || '3');
http.get({ host: '127.0.0.1', port: 9333, path: '/json/list' }, r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    const p = JSON.parse(d).find(t => t.type === 'page' && /vastworld/.test(t.url));
    const ws = new WebSocket(p.webSocketDebuggerUrl);
    ws.onopen = () => {
      log('open');
      const expr = `(() => {
        window.__probe = { frames: [], longtasks: [], start: performance.now(), scrolls: [] };
        let last = performance.now();
        const loop = t => { window.__probe.frames.push(t - last); last = t; if (t - window.__probe.start < ${seconds * 1000}) requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
        new PerformanceObserver(list => { for (const e of list.getEntries()) window.__probe.longtasks.push({ s: e.startTime, d: e.duration }); }).observe({ entryTypes: ['longtask'] });
        return 'installed';
      })()`;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
      log('sent');
    };
    ws.onmessage = ev => { log('msg', String(ev.data).slice(0, 150)); process.exit(0); };
    ws.onerror = () => { log('err'); process.exit(1); };
  });
});
setTimeout(() => { log('TIMEOUT'); process.exit(2); }, 6000);
