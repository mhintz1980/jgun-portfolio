/* Chapter 04 thin console (JG-044 P4). Plain DOM + one 2D canvas, no GL context.
 *
 *   window.StudioConsole = { open({root, sets, beat, deg, theme}), close(), isOpen() }
 *
 * Leaving is requested, never performed: Esc or the close control dispatches the
 * `studio:console-exit` event on document; the host calls close(). The console never scrolls
 * the page and never touches the host canvas. Labels are pattern names only.
 *
 * Memory model: every fetched frame is kept as a compressed Blob (small). Decoded ImageBitmaps
 * live in a bounded LRU so a 360-frame set never holds ~1 GB of pixels.
 */

const BASE = new URL('./', import.meta.url);
const FALLBACK_SET = 'ch4/cage'; // stand-in used when another set's manifest fails (until P3 ships)
const DEFAULT_SETS = ['ch4/cage', 'ch4/pump', 'ch4/receiver'];
const TAB_LABELS = ['Cage', 'Pump', 'Receiver'];
const VIEWS = [['shade', 'Shade'], ['line', 'Line'], ['wipe', 'Wipe']];
const BGS = [['light', 'Light'], ['dark', 'Dark'], ['jobsite', 'Jobsite']];
const STEPS = [12, 6, 3, 1]; // coarse-first: every 12th, 6th, 3rd, then all
const MAX_FETCH = 6;
const BITMAP_CAP = 40;

/* ------------------------------------------------------------------ set + frame loading */

const setCache = new Map(); // resolved base href -> Promise<FrameSet|null>

const fmt = (pattern, i) =>
  pattern.replace(/%0(\d+)d/, (_, w) => String(i).padStart(+w, '0')).replace(/%d/, String(i));

function loadSet(path) {
  const base = new URL(path.replace(/\/?$/, '/'), BASE);
  const key = base.href;
  if (!setCache.has(key)) {
    setCache.set(
      key,
      fetch(new URL('manifest.json', base))
        .then((r) => { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); })
        .then((m) => {
          const N = m.frames | 0;
          if (!(N > 0) || typeof m.line !== 'string' || typeof m.shade !== 'string') throw new Error('bad manifest');
          return {
            key, base, man: m, N,
            deg: m.deg || 360 / N,
            size: Array.isArray(m.size) ? m.size : [1024, 640],
            blobs: { line: new Array(N).fill(null), shade: new Array(N).fill(null) },
            count: 0, pending: new Set(), failed: new Set(),
            queue: [], urgent: [], active: 0, ac: null, onFrame: null,
            heroBlob: {}, heroStarted: false,
          };
        })
        .catch(() => { setCache.delete(key); return null; })
    );
  }
  return setCache.get(key);
}

/* A set whose manifest fails to load falls back to ch4/cage (stand-in until P3). Explicit, flagged. */
async function resolveSet(path) {
  const want = path || FALLBACK_SET;
  let S = await loadSet(want);
  if (S) return { S, standIn: false };
  if (want.replace(/\/$/, '') !== FALLBACK_SET) {
    S = await loadSet(FALLBACK_SET);
    if (S) return { S, standIn: true };
  }
  return { S: null, standIn: false };
}

function pump(S) {
  const ac = S.ac;
  if (!ac) return;
  while (S.active < MAX_FETCH) {
    const job = S.urgent.shift() || S.queue.shift();
    if (!job) break;
    const [kind, i] = job;
    const k = kind + i;
    if (S.blobs[kind][i] || S.pending.has(k) || S.failed.has(k)) continue;
    S.pending.add(k);
    S.active++;
    fetch(new URL(fmt(S.man[kind], i), S.base), { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then((b) => {
        if (S.ac !== ac) return;
        S.blobs[kind][i] = b;
        S.count++;
        if (S.onFrame) S.onFrame(kind, i);
      })
      .catch(() => { if (S.ac === ac) S.failed.add(k); })
      .finally(() => {
        if (S.ac !== ac) return;
        S.pending.delete(k);
        S.active--;
        pump(S);
      });
  }
}

function startLoading(S, kinds, onFrame) {
  stopLoading(S);
  S.ac = new AbortController();
  S.onFrame = onFrame;
  prioritise(S, kinds);
}

function prioritise(S, kinds) {
  const q = [];
  for (const st of STEPS) for (const kind of kinds) for (let i = 0; i < S.N; i += st) q.push([kind, i]);
  S.queue = q;
  pump(S);
}

function stopLoading(S) {
  if (S.ac) S.ac.abort();
  S.ac = null;
  S.onFrame = null;
  S.pending.clear();
  S.active = 0;
  S.urgent = [];
}

function wantFrame(S, kind, i) {
  if (!S.ac || S.blobs[kind][i] || S.pending.has(kind + i)) return;
  S.urgent.unshift([kind, i]);
  if (S.urgent.length > 6) S.urgent.length = 6;
  pump(S);
}

function nearestLoaded(S, kind, f) {
  const arr = S.blobs[kind];
  for (let d = 0; d <= S.N >> 1; d++) {
    const a = (f + d) % S.N;
    if (arr[a]) return a;
    const b = (f - d + S.N) % S.N;
    if (arr[b]) return b;
  }
  return -1;
}

function heroBlob(S, name) {
  if (!S.heroBlob[name]) {
    S.heroBlob[name] = fetch(new URL(fmt(S.man.hero || 'hero-%s.webp', 0).replace('%s', name), S.base))
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .catch(() => { delete S.heroBlob[name]; return null; });
  }
  return S.heroBlob[name];
}

/* ------------------------------------------------------------------ bounded decoded-bitmap LRU */

const bmc = new Map();
const bmInflight = new Map();
let bmGen = 0; // bumped by clearBitmaps: a decode resolving under an older generation closes its bitmap instead of caching it
const STAND_IN_NOTE = 'Render in progress — cage shown for now.';

function decode(key, getBlob) {
  if (bmc.has(key)) {
    const b = bmc.get(key);
    bmc.delete(key);
    bmc.set(key, b);
    return Promise.resolve(b);
  }
  if (bmInflight.has(key)) return bmInflight.get(key);
  const gen = bmGen;
  const p = Promise.resolve(getBlob())
    .then((blob) => (blob ? createImageBitmap(blob) : null))
    .then((b) => {
      if (bmInflight.get(key) === p) bmInflight.delete(key);
      if (!b) return null;
      if (gen !== bmGen) { try { b.close(); } catch (e) { /* already closed */ } return null; } // console closed or set switched mid-decode
      bmc.set(key, b);
      while (bmc.size > BITMAP_CAP) {
        const [ok, ob] = bmc.entries().next().value;
        bmc.delete(ok);
        try { ob.close(); } catch (e) { /* already closed */ }
      }
      return b;
    })
    .catch(() => { if (bmInflight.get(key) === p) bmInflight.delete(key); return null; });
  bmInflight.set(key, p);
  return p;
}

function clearBitmaps() {
  for (const b of bmc.values()) { try { b.close(); } catch (e) { /* already closed */ } }
  bmc.clear();
  bmInflight.clear();
  bmGen++;
}

/* ------------------------------------------------------------------ backgrounds (drawn, no images) */

const bgCache = new Map();

function makeBackground(name, W, H) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  if (name === 'light') {
    x.fillStyle = '#f4f1ea';
    x.fillRect(0, 0, W, H);
  } else if (name === 'dark') {
    x.fillStyle = '#0b1622';
    x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, W * 0.62);
    g.addColorStop(0, 'rgba(36,64,92,.55)');
    g.addColorStop(1, 'rgba(36,64,92,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  } else {
    // jobsite: overcast haze above a dusty slab, soft horizon, grain, vignette
    const hz = H * 0.6;
    let g = x.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, '#8e9498');
    g.addColorStop(1, '#6a6f71');
    x.fillStyle = g;
    x.fillRect(0, 0, W, hz);
    g = x.createLinearGradient(0, hz, 0, H);
    g.addColorStop(0, '#5a5853');
    g.addColorStop(1, '#3a3935');
    x.fillStyle = g;
    x.fillRect(0, hz, W, H - hz);
    g = x.createLinearGradient(0, hz - 14, 0, hz + 14);
    g.addColorStop(0, 'rgba(120,124,124,0)');
    g.addColorStop(0.5, 'rgba(130,132,130,.35)');
    g.addColorStop(1, 'rgba(90,88,83,0)');
    x.fillStyle = g;
    x.fillRect(0, hz - 14, W, 28);
    const t = document.createElement('canvas');
    t.width = t.height = 128;
    const tx = t.getContext('2d');
    const img = tx.createImageData(128, 128);
    let s = 1234567;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const v = (s >>> 24) & 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 14;
    }
    tx.putImageData(img, 0, 0);
    x.fillStyle = x.createPattern(t, 'repeat');
    x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.5, W * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.38)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  }
  return c;
}

function background(name, W, H) {
  const k = name + W + 'x' + H;
  if (!bgCache.has(k)) bgCache.set(k, makeBackground(name, W, H));
  return bgCache.get(k);
}

/* ------------------------------------------------------------------ the view */

let inst = null;

class ConsoleView {
  constructor(opts) {
    this.root = opts.root || document.getElementById('studioConsole');
    if (!this.root) throw new Error('no root');
    this.sets = Array.isArray(opts.sets) && opts.sets.length ? opts.sets : DEFAULT_SETS;
    this.prevFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    this.theme = null; // resolved in applyTheme
    this.explicitTheme = opts.theme === 'light' || opts.theme === 'dark' ? opts.theme : null;
    this.mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    this.S = null;
    this.standIn = false;
    this.tab = -1;
    this.angle = Number.isFinite(opts.deg) ? ((opts.deg % 360) + 360) % 360 : 0;
    this.view = 'shade';
    this.bg = null;
    this.finish = null;
    this.wipe = 0.5;
    this.gen = 0;
    this.tok = 0;
    this.drawnTok = 0;
    this.lastExact = false;
    this.lastPct = -1;
    this.W = 1024; this.H = 640;
    this.build();
    this.applyTheme(true);
    this.onMq = () => { if (!this.explicitTheme) this.applyTheme(false); };
    if (this.mq) (this.mq.addEventListener ? this.mq.addEventListener('change', this.onMq) : this.mq.addListener(this.onMq));
    this.onDocKey = (e) => {
      if (e.key === 'Tab' && !e.isComposing) this.trapTab(e);
      else if (e.key === 'Escape' && !e.isComposing) {
        e.preventDefault();
        e.stopPropagation(); // the host's own Escape listener (window, bubble) must not also climb out
        this.requestExit();
      }
    };
    document.addEventListener('keydown', this.onDocKey, true);
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', 'Chapter 04 console');
    this.root.hidden = false;
    this.inerted = []; // modal: the rest of the page is inert while open; only what this console inerted is restored
    for (const el of document.body.children) {
      if (el === this.root || el.contains(this.root) || el.inert) continue;
      el.inert = true;
      this.inerted.push(el);
    }
    this.focusFirst();
    const beat = Number.isInteger(opts.beat) ? Math.min(2, Math.max(0, opts.beat)) : 0;
    this.activate(beat);
  }

  update(opts) {
    if (opts.theme === 'light' || opts.theme === 'dark') { this.explicitTheme = opts.theme; this.applyTheme(false); }
    if (Number.isFinite(opts.deg)) this.setAngle(opts.deg, false);
    if (Number.isInteger(opts.beat) && opts.beat >= 0 && opts.beat <= 2 && opts.beat !== this.tab) this.activate(opts.beat);
  }

  /* -------- dom */
  build() {
    const root = this.root;
    root.classList.add('sc-host');
    root.innerHTML = `
<div class="sc" data-view="shade" data-bg="light">
  <header class="sc-top">
    <p class="sc-id">Chapter 04 <span aria-hidden="true">/</span> Console</p>
    <div class="sc-tabs" role="tablist" aria-label="Assembly"></div>
    <button type="button" class="sc-close"><span>Close</span><kbd aria-hidden="true">Esc</kbd></button>
  </header>
  <div class="sc-main">
    <section class="sc-view" role="tabpanel" aria-label="Viewer">
      <div class="sc-stage" tabindex="0" role="group" aria-label="Angle viewer. Left and right arrow keys turn the assembly; hold Shift for larger steps.">
        <canvas class="sc-canvas" role="img"></canvas>
        <span class="sc-lab sc-lab-a" aria-hidden="true">A Line</span>
        <span class="sc-lab sc-lab-b" aria-hidden="true">B Shade</span>
        <div class="sc-wipe" role="slider" tabindex="0" aria-label="Wipe position, line on the left, shade on the right" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100"><i aria-hidden="true"></i></div>
        <p class="sc-load" aria-hidden="true"><i></i></p>
      </div>
      <p class="sc-meta"><span class="sc-meta-l"></span><span class="sc-meta-r"></span></p>
    </section>
    <aside class="sc-side">
      <div class="sc-box sc-box-angle">
        <h3 id="sc-h-angle">Angle</h3>
        <div class="sc-angle-row">
          <input class="sc-range" type="range" min="0" max="359" step="1" value="0" aria-labelledby="sc-h-angle">
          <output class="sc-deg" aria-hidden="true">000&deg;</output>
        </div>
      </div>
      <div class="sc-box"><h3 id="sc-h-view">View</h3><div class="sc-seg sc-seg-view" role="radiogroup" aria-labelledby="sc-h-view"></div></div>
      <div class="sc-box"><h3 id="sc-h-bg">Background</h3><div class="sc-seg sc-seg-bg" role="radiogroup" aria-labelledby="sc-h-bg"></div></div>
      <div class="sc-box sc-box-finish"><h3 id="sc-h-finish">Finish</h3><div class="sc-chips" role="group" aria-labelledby="sc-h-finish"></div></div>
      <p class="sc-note" role="status"></p>
    </aside>
  </div>
</div>`;
    const q = (s) => root.querySelector(s);
    this.el = q('.sc');
    this.canvas = q('.sc-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.stage = q('.sc-stage');
    this.wipeEl = q('.sc-wipe');
    this.loadBar = q('.sc-load i');
    this.metaL = q('.sc-meta-l');
    this.metaR = q('.sc-meta-r');
    this.range = q('.sc-range');
    this.degOut = q('.sc-deg');
    this.chips = q('.sc-chips');
    this.note = q('.sc-note');
    this.tabsEl = q('.sc-tabs');
    this.off = document.createElement('canvas'); // scratch for inverted line art

    // tabs (roving focus, manual activation)
    TAB_LABELS.forEach((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sc-tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.tabIndex = -1;
      b.innerHTML = '<span class="sc-tab-n"></span><span class="sc-tab-t"></span>';
      b.firstChild.textContent = String(i + 1).padStart(2, '0');
      b.lastChild.textContent = label;
      b.addEventListener('click', () => this.activate(i));
      this.tabsEl.appendChild(b);
    });
    this.tabsEl.addEventListener('keydown', (e) => {
      const tabs = [...this.tabsEl.children];
      const cur = tabs.indexOf(document.activeElement);
      if (cur < 0) return;
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (cur + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (cur - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      tabs.forEach((t, k) => { t.tabIndex = k === n ? 0 : -1; });
      tabs[n].focus({ preventScroll: true });
    });

    // segmented radio groups
    this.viewSeg = this.radios(q('.sc-seg-view'), VIEWS, 'shade', (v) => this.setView(v));
    this.bgSeg = this.radios(q('.sc-seg-bg'), BGS, 'light', (v) => this.setBg(v));

    q('.sc-close').addEventListener('click', () => this.requestExit());

    // slider
    this.range.addEventListener('input', () => this.setAngle(+this.range.value * (this.S ? this.S.deg : 1), true));

    // stage: arrow keys + drag
    this.stage.addEventListener('keydown', (e) => {
      if (e.target !== this.stage) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const d = (this.S ? this.S.deg : 1) * (e.shiftKey ? 10 : 1);
      this.setAngle(this.angle + (e.key === 'ArrowRight' ? d : -d), true);
    });
    let drag = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      drag = { x: e.clientX, a: this.angle, id: e.pointerId };
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      this.stage.classList.add('is-drag');
      this.stage.focus({ preventScroll: true });
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const w = this.canvas.getBoundingClientRect().width || 1;
      this.setAngle(drag.a + ((e.clientX - drag.x) / w) * 360, true);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      this.stage.classList.remove('is-drag');
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);

    // wipe bar
    let wd = null;
    this.wipeEl.addEventListener('pointerdown', (e) => {
      wd = e.pointerId;
      try { this.wipeEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      this.wipeEl.classList.add('is-drag');
      this.moveWipe(e.clientX);
    });
    this.wipeEl.addEventListener('pointermove', (e) => { if (wd === e.pointerId) this.moveWipe(e.clientX); });
    const wend = (e) => { if (wd === e.pointerId) { wd = null; this.wipeEl.classList.remove('is-drag'); } };
    this.wipeEl.addEventListener('pointerup', wend);
    this.wipeEl.addEventListener('pointercancel', wend);
    this.wipeEl.addEventListener('keydown', (e) => {
      const big = e.shiftKey ? 0.1 : 0.02;
      let v = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = this.wipe - big;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = this.wipe + big;
      else if (e.key === 'Home') v = 0;
      else if (e.key === 'End') v = 1;
      if (v === null) return;
      e.preventDefault();
      e.stopPropagation();
      this.setWipe(v);
    });
    this.setWipe(0.5, true);
  }

  radios(host, items, initial, onPick) {
    const btns = items.map(([val, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sc-seg-b';
      b.setAttribute('role', 'radio');
      b.dataset.val = val;
      b.textContent = label;
      host.appendChild(b);
      b.addEventListener('click', () => onPick(val));
      return b;
    });
    host.addEventListener('keydown', (e) => {
      const cur = btns.indexOf(document.activeElement);
      if (cur < 0) return;
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (cur + 1) % btns.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (cur - 1 + btns.length) % btns.length;
      if (n === null) return;
      e.preventDefault();
      btns[n].focus({ preventScroll: true });
      onPick(btns[n].dataset.val);
    });
    const api = {
      set(val) {
        btns.forEach((b) => {
          const on = b.dataset.val === val;
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
        });
      },
    };
    api.set(initial);
    return api;
  }

  /* -------- theme + background */
  applyTheme(first) {
    const t = this.explicitTheme || (this.mq && this.mq.matches ? 'dark' : 'light');
    this.theme = t;
    this.el.dataset.theme = t;
    if (first || this.bgFollowsTheme !== false) {
      this.bgFollowsTheme = true;
      this.setBg(t, true);
    }
  }

  setBg(name, auto) {
    if (!auto) this.bgFollowsTheme = false;
    this.bg = name;
    this.el.dataset.bg = name;
    this.bgSeg.set(name);
    this.render();
  }

  setView(v) {
    this.view = v;
    this.finish = null;
    this.syncFinishUi();
    this.el.dataset.view = v;
    this.viewSeg.set(v);
    if (this.S && this.S.ac) prioritise(this.S, v === 'line' ? ['line', 'shade'] : ['shade', 'line']);
    this.render();
  }

  /* -------- assembly activation + loading */
  async activate(idx) {
    const gen = ++this.gen;
    if (this.S) stopLoading(this.S);
    clearBitmaps();
    this.tab = idx;
    [...this.tabsEl.children].forEach((t, k) => {
      t.setAttribute('aria-selected', k === idx ? 'true' : 'false');
      t.tabIndex = k === idx ? 0 : -1;
    });
    this.finish = null;
    this.note.textContent = '';
    this.setProgress(0, true);
    this.metaL.textContent = TAB_LABELS[idx] + ' / loading';
    const { S, standIn } = await resolveSet(this.sets[idx] || FALLBACK_SET);
    if (gen !== this.gen || !this.el.isConnected) return;
    this.S = S;
    this.standIn = standIn;
    if (!S) {
      this.canvas.setAttribute('aria-label', TAB_LABELS[idx] + ' frames are unavailable');
      this.note.textContent = 'Frames could not be loaded.';
      this.metaL.textContent = TAB_LABELS[idx] + ' / unavailable';
      this.draw(null);
      return;
    }
    this.W = S.size[0]; this.H = S.size[1];
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.el.style.setProperty('--sc-ar', this.W + ' / ' + this.H);
    this.range.max = String(S.N - 1);
    this.note.textContent = standIn ? STAND_IN_NOTE : '';
    this.buildChips();
    this.setAngle(this.angle, false);
    this.updateProgress();
    startLoading(S, this.view === 'line' ? ['line', 'shade'] : ['shade', 'line'], (kind, i) => this.onFrame(kind, i));
    this.render();
  }

  onFrame(kind, i) {
    const S = this.S;
    if (!S) return;
    this.updateProgress();
    if (!this.finish && !this.lastExact) this.render(); // showing a stand-in frame: a nearer or exact one may have arrived
    if (!S.heroStarted && S.count >= 2 * Math.ceil(S.N / 12)) {
      S.heroStarted = true;
      (S.man.finishes || []).forEach((f) => heroBlob(S, f));
    }
  }

  setProgress(p, force) {
    const pct = Math.floor(p * 100);
    const loading = p < 1;
    const sig = pct + (loading ? 'l' : 'd');
    if (!force && sig === this.lastPct) return;
    this.lastPct = sig;
    this.loadBar.style.width = pct + '%';
    this.stage.classList.toggle('is-loading', loading);
  }

  updateProgress() {
    const S = this.S;
    if (!S) return;
    this.setProgress(Math.min(1, (S.count + S.failed.size) / (S.N * 2)));
  }

  /* -------- state changes */
  frame() {
    const S = this.S;
    if (!S) return 0;
    return ((Math.round(this.angle / S.deg) % S.N) + S.N) % S.N;
  }

  setAngle(a, fromUser) {
    this.angle = ((a % 360) + 360) % 360;
    if (fromUser && this.finish) { this.finish = null; this.syncFinishUi(); }
    const f = this.frame();
    if (this.S) this.range.value = String(f);
    this.render();
  }

  setWipe(v, silent) {
    this.wipe = Math.min(1, Math.max(0, v));
    const pct = Math.round(this.wipe * 100);
    this.wipeEl.style.left = pct + '%';
    this.wipeEl.setAttribute('aria-valuenow', String(pct));
    this.wipeEl.setAttribute('aria-valuetext', pct + ' percent line');
    if (!silent) this.render();
  }

  moveWipe(clientX) {
    const r = this.canvas.getBoundingClientRect();
    this.setWipe((clientX - r.left) / (r.width || 1));
  }

  buildChips() {
    this.chips.textContent = '';
    const list = (this.S && this.S.man.finishes) || [];
    list.forEach((name) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sc-chip';
      b.dataset.finish = name;
      b.setAttribute('aria-pressed', 'false');
      b.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      b.addEventListener('click', () => this.pickFinish(name));
      this.chips.appendChild(b);
    });
    this.chips.parentNode.hidden = list.length === 0;
  }

  syncFinishUi() {
    this.el.toggleAttribute('data-finish', !!this.finish);
    [...this.chips.children].forEach((b) => b.setAttribute('aria-pressed', b.dataset.finish === this.finish ? 'true' : 'false'));
  }

  async pickFinish(name) {
    if (this.finish === name) { this.finish = null; this.syncFinishUi(); this.render(); return; }
    this.finish = name;
    this.syncFinishUi();
    this.note.textContent = this.standIn ? STAND_IN_NOTE : '';
    this.render();
  }

  /* -------- drawing */
  async render() {
    const S = this.S;
    if (!S) return;
    const tok = ++this.tok;
    const f = this.frame();
    const ctx = this.ctx;
    if (this.finish) {
      const name = this.finish;
      const hero = await decode(S.key + 'hero-' + name, () => heroBlob(S, name));
      if (tok <= this.drawnTok || !this.el.isConnected) return;
      if (!hero) {
        if (this.finish === name) { this.finish = null; this.syncFinishUi(); this.note.textContent = 'That finish still is not available.'; this.render(); }
        return;
      }
      this.drawnTok = tok;
      this.lastExact = true;
      this.draw(() => ctx.drawImage(hero, 0, 0, this.W, this.H));
      this.paintMeta(null);
      return;
    }
    const kinds = this.view === 'shade' ? ['shade'] : this.view === 'line' ? ['line'] : ['line', 'shade'];
    const picks = kinds.map((k) => {
      wantFrame(S, k, f);
      return [k, nearestLoaded(S, k, f)];
    });
    const bms = await Promise.all(picks.map(([k, j]) => (j < 0 ? null : decode(S.key + k + j, () => S.blobs[k][j]))));
    if (tok <= this.drawnTok || !this.el.isConnected || this.finish) return;
    const by = {};
    kinds.forEach((k, n) => { by[k] = bms[n]; });
    if (kinds.some((k) => !by[k])) { // nothing loaded yet for a needed kind: show background only
      if (this.drawnTok === 0) { this.drawnTok = tok; this.draw(null); }
      return;
    }
    this.drawnTok = tok;
    const exact = picks.every(([, j]) => j === f);
    this.lastExact = exact;
    this.draw(() => {
      if (this.view === 'shade') ctx.drawImage(by.shade, 0, 0, this.W, this.H);
      else if (this.view === 'line') this.drawLine(by.line, 0, this.W);
      else {
        const x = Math.round(this.wipe * this.W);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, x, this.H); ctx.clip();
        this.drawLine(by.line, 0, this.W);
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.rect(x, 0, this.W - x, this.H); ctx.clip();
        ctx.drawImage(by.shade, 0, 0, this.W, this.H);
        ctx.restore();
      }
    });
    this.paintMeta(exact);
  }

  draw(fn) {
    const ctx = this.ctx;
    try {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(background(this.bg, this.W, this.H), 0, 0);
      if (fn) fn();
    } catch (e) { /* bitmap evicted mid-draw: next render repaints */ }
  }

  /* Line frames are ink on white. Light ground: multiply. Dark / jobsite: invert, then screen. */
  drawLine(bm) {
    const ctx = this.ctx;
    if (this.bg === 'light') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(bm, 0, 0, this.W, this.H);
    } else {
      const o = this.off;
      if (o.width !== this.W || o.height !== this.H) { o.width = this.W; o.height = this.H; }
      const ox = o.getContext('2d');
      ox.globalCompositeOperation = 'source-over';
      ox.drawImage(bm, 0, 0, this.W, this.H);
      ox.globalCompositeOperation = 'difference';
      ox.fillStyle = '#fff';
      ox.fillRect(0, 0, this.W, this.H);
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(o, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  paintMeta(exact) {
    const S = this.S;
    if (!S) return;
    const label = TAB_LABELS[this.tab] || '';
    const ang = this.finish ? S.man.heroDeg || 0 : this.frame() * S.deg;
    const a = String(Math.round(ang)).padStart(3, '0');
    this.degOut.textContent = String(Math.round(this.frame() * S.deg)).padStart(3, '0') + '°';
    this.range.setAttribute('aria-valuetext', Math.round(this.frame() * S.deg) + ' degrees');
    const what = this.finish ? this.finish : this.view;
    this.metaL.textContent = label + ' / ' + what;
    this.metaR.textContent = this.finish ? 'Still at ' + a + '°' : (exact === false ? 'Sharpening ' : '') + a + '°';
    this.canvas.setAttribute('aria-label', label + ', ' + what + ' view at ' + a + ' degrees');
  }

  /* -------- exit + teardown */
  requestExit() {
    document.dispatchEvent(new CustomEvent('studio:console-exit'));
  }

  focusables() {
    return [...this.root.querySelectorAll('button, input, [tabindex]')].filter(
      (n) => n.tabIndex >= 0 && !n.disabled && n.getClientRects().length > 0
    );
  }

  /* Tab wraps inside the console even where the browser would move on to its own chrome. */
  trapTab(e) {
    const list = this.focusables();
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1], a = document.activeElement;
    if (!this.root.contains(a)) { e.preventDefault(); first.focus({ preventScroll: true }); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus({ preventScroll: true }); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus({ preventScroll: true }); }
  }

  focusFirst() {
    const t = this.tabsEl.children[0];
    if (t) { t.tabIndex = 0; t.focus({ preventScroll: true }); }
  }

  destroy() {
    this.gen++;
    document.removeEventListener('keydown', this.onDocKey, true);
    if (this.mq) (this.mq.removeEventListener ? this.mq.removeEventListener('change', this.onMq) : this.mq.removeListener(this.onMq));
    if (this.S) stopLoading(this.S);
    clearBitmaps();
    for (const el of this.inerted || []) el.inert = false;
    this.inerted = [];
    const root = this.root;
    root.textContent = '';
    root.classList.remove('sc-host');
    root.hidden = true;
    const prev = this.prevFocus;
    if (prev && prev.isConnected && typeof prev.focus === 'function') prev.focus({ preventScroll: true });
  }
}

/* ------------------------------------------------------------------ public api */

window.StudioConsole = {
  open(opts) {
    try {
      const o = opts || {};
      if (inst) { inst.update(o); return; }
      inst = new ConsoleView(o);
    } catch (err) {
      inst = null;
    }
  },
  close() {
    if (!inst) return;
    const v = inst;
    inst = null;
    try { v.destroy(); } catch (err) { /* ignore */ }
  },
  isOpen() { return !!inst; },
};
