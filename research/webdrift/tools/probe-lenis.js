(() => {
  const o = window.lenis || {};
  const g = (k) => { try { return o[k]; } catch (e) { return 'err'; } };
  return {
    hasLenis: !!o,
    lerp: g('lerp'), duration: g('duration'), wheelMultiplier: g('wheelMultiplier'),
    syncTouch: g('syncTouch'), smoothWheel: g('smoothWheel'), orientation: g('orientation'),
    gestureOrientation: g('gestureOrientation'), autoRaf: g('autoRaf'),
    autoResize: g('autoResize'), wrapper: o.wrapper === window ? 'window' : (o.wrapper && o.wrapper.tagName) || 'other',
    content: o.content && o.content.tagName, isStopped: o.isStopped,
    scrollLimit: g('limit'),
    lenisVersion: o.constructor && o.constructor.name,
    glParentChain: (() => {
      const gl = document.querySelector('.gl');
      if (!gl) return null;
      const chain = [];
      let el = gl;
      for (let i = 0; i < 6 && el; i++) { chain.push(el.tagName + '.' + (el.className || '').toString().slice(0, 30)); el = el.parentElement; }
      const r = gl.getBoundingClientRect();
      return { chain, top: Math.round(r.top), height: Math.round(r.height) };
    })(),
    heroSection: (() => {
      const h = document.querySelector('.hero');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { top: Math.round(r.top), height: Math.round(r.height), canvasInside: !!h.querySelector('canvas') };
    })(),
  };
})()
