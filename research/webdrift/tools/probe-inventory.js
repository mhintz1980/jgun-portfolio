(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource').map(r => ({
    name: r.name,
    type: r.initiatorType,
    transfer: r.transferSize,
    encoded: r.encodedBodySize,
    decoded: r.decodedBodySize,
    start: Math.round(r.startTime),
    dur: Math.round(r.duration),
  }));
  const short = (n) => { try { const u = new URL(n); return u.origin + u.pathname.slice(-90) + (u.search || ''); } catch (e) { return n; } };
  const paint = performance.getEntriesByType('paint').map(p => ({ name: p.name, t: Math.round(p.startTime) }));
  const canvases = [...document.querySelectorAll('canvas')].map((c, i) => ({
    i, w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight,
    fixed: getComputedStyle(c).position, visible: !!(c.offsetParent || c.getClientRects().length),
    parentClass: (c.parentElement && c.parentElement.className || '').toString().slice(0, 80),
  }));
  const globals = {};
  for (const k of ['THREE', 'gsap', 'ScrollTrigger', 'ScrollSmoother', 'SplitText', 'Flip', 'Draggable', 'CustomEase', 'DrawSVGPlugin', 'MorphSVGPlugin', 'PixiPlugin', 'MotionPathPlugin', 'Lenis', '__lenis', 'lenis', 'LocomotiveScroll', 'Rive', 'rive', 'lottie', 'lottieWeb', 'Howl', 'Howler', 'Theatre', '__NEXT_DATA__', '__next_f', 'Babylon', 'OGL', 'regl', '__torqueWorld']) {
    globals[k] = typeof window[k] !== 'undefined' ? (typeof window[k]) : false;
  }
  const meta = {};
  document.querySelectorAll('meta').forEach(m => {
    if (['viewport', 'description', 'theme-color'].includes(m.name)) meta[m.name] = m.content;
  });
  const webglInfo = (() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    for (const kind of ['webgl2', 'webgl']) {
      const gl = c.getContext(kind);
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          kind,
          vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
        };
      }
    }
    return 'no-webgl-context-obtainable';
  })();
  const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && !h.startsWith('http') && !h.startsWith('mailto') && !h.startsWith('#'));
  return {
    url: location.href,
    title: document.title,
    timing: {
      responseStart: Math.round(nav.responseStart),
      domInteractive: Math.round(nav.domInteractive),
      dcl: Math.round(nav.domContentLoadedEventEnd),
      loadEnd: Math.round(nav.loadEventEnd),
      transferTotal: nav.transferSize,
    },
    paint,
    fcpOrLcp: (() => { try { const po = performance.getEntriesByType('largest-contentful-paint'); return po.length ? Math.round(po[po.length - 1].startTime) : null; } catch (e) { return null; } })(),
    resourceCount: res.length,
    resourceBytes: res.reduce((a, r) => a + (r.transfer || 0), 0),
    resources: res.map(r => ({ ...r, name: short(r.name) })),
    canvases,
    webglInfo,
    globals,
    meta,
    internalLinks: [...new Set(links)].slice(0, 30),
    textSample: (document.body.innerText || '').slice(0, 400),
  };
})()
