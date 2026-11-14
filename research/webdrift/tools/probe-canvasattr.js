(() => {
  const c = document.querySelector('canvas');
  const body = getComputedStyle(document.body);
  const html = getComputedStyle(document.documentElement);
  const rmCss = (() => {
    let hits = 0;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      const scan = (list) => {
        for (const r of list) {
          if (r.media) {
            if (/prefers-reduced-motion/i.test(r.media.mediaText)) hits++;
            try { scan(r.cssRules); } catch (e) {}
          } else if (r.cssText && /prefers-reduced-motion/i.test(r.cssText)) hits++;
        }
      };
      try { scan(rules); } catch (e) {}
    }
    return hits;
  })();
  return {
    canvasAttrs: c ? { id: c.id, engine: c.getAttribute('data-engine'), split: c.getAttribute('data-split') } : null,
    bodyTouchAction: body.touchAction, htmlTouchAction: html.touchAction,
    htmlOverflow: html.overflow, bodyOverflow: body.overflow,
    reducedMotionCssRules: rmCss,
    lenisVersionGlobal: window.lenisVersion || null,
  };
})()
