(() => {
  const out = {};
  try { out.lenisOptions = window.lenis && window.lenis.options ? JSON.parse(JSON.stringify(window.lenis.options)) : 'no-options-prop'; } catch (e) { out.lenisOptions = 'err:' + e.message; }
  const gl = document.querySelector('.gl') || document.querySelector('canvas').parentElement;
  const cs = getComputedStyle(gl);
  out.glContainer = { cls: gl.className.toString().slice(0, 60), position: cs.position, zIndex: cs.zIndex, inset: cs.top + ' ' + cs.left + ' ' + cs.bottom + ' ' + cs.right, pointerEvents: cs.pointerEvents, height: cs.height, overflow: cs.overflow };
  const canvas = document.querySelector('canvas');
  const ccs = getComputedStyle(canvas);
  out.canvasStyle = { position: ccs.position, zIndex: ccs.zIndex, pointerEvents: ccs.pointerEvents, width: ccs.width, height: ccs.height };
  out.mediaElements = {
    video: document.querySelectorAll('video').length,
    audio: document.querySelectorAll('audio').length,
    iframe: document.querySelectorAll('iframe').length,
  };
  const introish = [...document.querySelectorAll('[class*="intro" i],[class*="loader" i],[class*="preload" i],[data-intro],[id*="intro" i]')].slice(0, 6).map((el) => ({
    tag: el.tagName, cls: (el.className || '').toString().slice(0, 80),
    display: getComputedStyle(el).display, opacity: getComputedStyle(el).opacity,
    visible: !!(el.offsetParent || el.getClientRects().length),
  }));
  out.introish = introish;
  const hero = [...document.querySelectorAll('h1,h2')].slice(0, 3).map((h) => {
    const spans = h.querySelectorAll('span').length;
    const words = h.querySelectorAll('[class*="word" i]').length;
    const chars = h.querySelectorAll('[class*="char" i]').length;
    return { tag: h.tagName, cls: (h.className || '').toString().slice(0, 60), spans, wordNodes: words, charNodes: chars, text: (h.textContent || '').slice(0, 60) };
  });
  out.headings = hero;
  out.scroller = { docScrollHeight: document.documentElement.scrollHeight, viewportH: innerHeight, useNativeScroll: document.documentElement.style.scrollBehavior || '(unset)' };
  out.counterText = (document.querySelector('[class*="counter" i],[class*="percent" i],[data-counter]') || {}).textContent || null;
  const fig = document.querySelector('[class*="fig" i]');
  out.figSample = fig ? (fig.className || '').toString().slice(0, 60) : null;
  return out;
})()
