import { t as e } from "./rolldown-runtime.Bi-D_2cA.mjs";
import { C as t, F as n, I as r, L as i, g as a, l as o, o as s, s as c, v as l, y as u } from "./react.B4lOa1lM.mjs";
import { Ct as d, H as f, r as p, w as m } from "./framer.BIOwr9OE.mjs";
function h(e) { return new Promise((t, n) => { let r = new Image; r.crossOrigin = `anonymous`, r.decoding = `async`, r.onload = () => t(r), r.onerror = () => n(/* @__PURE__ */ Error(`Nie udało się wczytać obrazu.`)), r.src = e; }); }
function g(e, t, n, r, a = () => { }) {
    let o = { ...y, ...r }, s = e.getContext(`webgl`, { alpha: !1, antialias: !1, depth: !1, stencil: !1, powerPreference: `low-power`, preserveDrawingBuffer: !1 });
    if (!s)
        throw Error(`WebGL jest niedostępny. Wyświetlam zdjęcie statyczne.`);
    let c = s.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.HIGH_FLOAT), l = `
        precision ${c && c.precision > 0 ? `highp` : `mediump`} float;
        varying vec2 screenUV;
        uniform sampler2D photograph;
        uniform sampler2D sceneDepth;
        uniform vec2 uvScale;
        uniform vec2 uvOffset;
        uniform vec2 movement;
        uniform vec2 translation;
        float displacement(vec2 uv) {
            float d = texture2D(sceneDepth, clamp(uv, 0.0, 1.0)).r;
            return 1.0 - exp(-max(d - 0.12, 0.0) / 0.68);
        }
        void main() {
            // Fixed image-space point between the eyes in the supplied portrait.
            float anchorDepth = displacement(vec2(0.480191275, 0.2315));
            // Translation is independent of perspective on both axes.
            vec2 uv = screenUV * uvScale + uvOffset - translation;
            vec2 sourceUV = uv - movement * (displacement(uv) - anchorDepth);
            // The anchor remains still when Move X and Move Y are zero.
            // All other points retain their relative depth-driven motion.
            sourceUV = uv - movement * (displacement(sourceUV) - anchorDepth);
            if (sourceUV.x < 0.0 || sourceUV.x > 1.0 ||
                sourceUV.y < 0.0 || sourceUV.y > 1.0) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            } else {
                gl_FragColor = vec4(texture2D(photograph, sourceUV).rgb, 1.0);
            }
        }
    `, u = [], d = [], f = null, p = null;
    function m() { d.forEach(e => s.deleteTexture(e)), u.forEach(e => s.deleteShader(e)), p && s.deleteBuffer(p), f && s.deleteProgram(f); }
    function h(e, t) { let n = s.createShader(e); if (!n)
        throw Error(`Nie udało się przygotować efektu.`); if (u.push(n), s.shaderSource(n, t), s.compileShader(n), !s.getShaderParameter(n, s.COMPILE_STATUS))
        throw Error(s.getShaderInfoLog(n) || `Błąd kompilacji efektu.`); return n; }
    try {
        if (f = s.createProgram(), !f)
            throw Error(`Nie udało się przygotować efektu.`);
        if (s.attachShader(f, h(s.VERTEX_SHADER, `
        attribute vec2 position;
        varying vec2 screenUV;
        void main() {
            screenUV = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `)), s.attachShader(f, h(s.FRAGMENT_SHADER, l)), s.linkProgram(f), !s.getProgramParameter(f, s.LINK_STATUS))
            throw Error(s.getProgramInfoLog(f) || `Błąd inicjalizacji efektu.`);
        s.useProgram(f), p = s.createBuffer(), s.bindBuffer(s.ARRAY_BUFFER, p), s.bufferData(s.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), s.STATIC_DRAW);
        let e = s.getAttribLocation(f, `position`);
        s.enableVertexAttribArray(e), s.vertexAttribPointer(e, 2, s.FLOAT, !1, 0, 0);
        for (let [e, r] of [t, n].entries()) {
            let t = s.createTexture();
            if (!t)
                throw Error(`Nie udało się wczytać tekstury.`);
            d.push(t), s.activeTexture(s.TEXTURE0 + e), s.bindTexture(s.TEXTURE_2D, t), s.texParameteri(s.TEXTURE_2D, s.TEXTURE_WRAP_S, s.CLAMP_TO_EDGE), s.texParameteri(s.TEXTURE_2D, s.TEXTURE_WRAP_T, s.CLAMP_TO_EDGE), s.texParameteri(s.TEXTURE_2D, s.TEXTURE_MIN_FILTER, s.LINEAR), s.texParameteri(s.TEXTURE_2D, s.TEXTURE_MAG_FILTER, s.LINEAR), s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL, e === 1 ? s.NONE : s.BROWSER_DEFAULT_WEBGL), s.texImage2D(s.TEXTURE_2D, 0, s.RGBA, s.RGBA, s.UNSIGNED_BYTE, r);
        }
        s.uniform1i(s.getUniformLocation(f, `photograph`), 0), s.uniform1i(s.getUniformLocation(f, `sceneDepth`), 1);
    }
    catch (e) {
        throw m(), e;
    }
    let g = s.getUniformLocation(f, `uvScale`), _ = s.getUniformLocation(f, `uvOffset`), v = s.getUniformLocation(f, `movement`), x = s.getUniformLocation(f, `translation`), S = !1, C = !0, w = !1, T = 0, E = 0, D = 0, O = 0, k = 0, A = 0, j = 0, M = 1, N = 1;
    function P() { if (S || w)
        return; let e = (o.fit === `contain` ? Math.min(M / t.naturalWidth, N / t.naturalHeight) : Math.max(M / t.naturalWidth, N / t.naturalHeight)) * o.zoom, n = t.naturalWidth * e, r = t.naturalHeight * e, i = M / n, a = N / r; s.uniform2f(g, i, a), s.uniform2f(_, (1 - i) * o.positionX / 100, (1 - a) * o.positionY / 100), s.uniform2f(v, O * o.horizontal / 100, k * o.vertical / 100), s.uniform2f(x, O * o.moveX / 100, k * o.moveY / 100), s.drawArrays(s.TRIANGLES, 0, 3), D++; }
    function F(e) { if (T = 0, !C || S || w)
        return; let t = E ? Math.min((e - E) / 1e3, .05) : 1 / 60; E = e; let n = o.smoothing <= 0 ? 1 : 1 - Math.exp(-t / o.smoothing); O += (A - O) * n, k += (j - k) * n, Math.abs(O - A) < 5e-5 && (O = A), Math.abs(k - j) < 5e-5 && (k = j), P(), O !== A || k !== j ? T = requestAnimationFrame(F) : E = 0; }
    function I() { C && !S && !w && !T && (E = 0, T = requestAnimationFrame(F)); }
    function L() { if (S || w)
        return; let t = e.getBoundingClientRect(); M = Math.max(1, t.width), N = Math.max(1, t.height); let n = Math.min(i.devicePixelRatio || 1, o.pixelRatio); n = Math.min(n, Math.sqrt(25e5 / (M * N))); let r = Math.max(1, Math.round(M * n)), a = Math.max(1, Math.round(N * n)); (e.width !== r || e.height !== a) && (e.width = r, e.height = a, s.viewport(0, 0, r, a)), P(); }
    function R(e) { e.preventDefault(), w = !0, cancelAnimationFrame(T), T = 0, a(); }
    e.addEventListener(`webglcontextlost`, R);
    let z = new ResizeObserver(L);
    return z.observe(e), L(), { setPointer(e, t, n = !1) { A = b(e, -1, 1), j = b(t, -1, 1), n ? (O = A, k = j, C && P()) : I(); }, update(e) { o = { ...o, ...e }, L(), I(); }, setActive(e) { C = e, C ? (L(), I()) : (cancelAnimationFrame(T), T = 0, E = 0); }, getState() { return { currentX: O, currentY: k, targetX: A, targetY: j, draws: D, active: C, lost: w, width: e.width, height: e.height }; }, dispose() { S = !0, cancelAnimationFrame(T), z.disconnect(), e.removeEventListener(`webglcontextlost`, R), m(); } };
}
function _() { if (i === void 0)
    return; let e = i; e.__fragmentPortraitReady !== !0 && (e.__fragmentPortraitReady = !0, i.dispatchEvent(new CustomEvent(`fragment-portrait-ready`))); }
function v(e) { let { photo: t, depthMap: n = ``, tracking: c = `window`, touchMode: f = `drag`, reverseX: p = !1, reverseY: m = !1, alt: v = `Portret Pawła`, style: b, horizontal: S = y.horizontal, vertical: C = y.vertical, moveX: w = y.moveX, moveY: T = y.moveY, smoothing: E = y.smoothing, zoom: D = 1, fit: O = `cover`, positionX: k = 50, positionY: A = 50, pixelRatio: j = 1.5 } = e, M = x(t), N = u(null), P = u(null), F = u(null), [I, L] = a(!1), [R, z] = a(0), B = u({ horizontal: S, vertical: C, moveX: w, moveY: T, smoothing: E, zoom: D, fit: O, positionX: k, positionY: A, pixelRatio: j }); B.current = { horizontal: S, vertical: C, moveX: w, moveY: T, smoothing: E, zoom: D, fit: O, positionX: k, positionY: A, pixelRatio: j }; let V = u({ tracking: c, touchMode: f, reverseX: p, reverseY: m }); V.current = { tracking: c, touchMode: f, reverseX: p, reverseY: m }; let H = d.current() === d.canvas; return l(() => { if (L(!1), r.maxTouchPoints > 0 || i.matchMedia(`(any-pointer: coarse)`).matches || !M || !n)
    return; let e = P.current, t = N.current; if (!e || !t)
    return; let a = !1, o = null, s = !0, c = () => { }, l = i.matchMedia(`(prefers-reduced-motion: reduce)`), u = () => { a || (L(!1), _()); }, d = () => { o && ((l.matches || H) && o.setPointer(0, 0, !0), o.setActive(s && !document.hidden && !l.matches && !H)); }, f = () => { a || z(e => e + 1); }; return e.addEventListener(`webglcontextrestored`, f), Promise.all([h(M), h(n)]).then(([n, r]) => { if (a)
    return; if (Math.abs(n.naturalWidth / n.naturalHeight - r.naturalWidth / r.naturalHeight) > .005)
    throw Error(`Zdjęcie i mapa głębi muszą mieć te same proporcje.`); o = g(e, n, r, B.current, u), F.current = o, L(!0), _(); let f = (e, t) => { if (l.matches || H)
    return; let n = V.current; o?.setPointer(n.reverseX ? -e : e, n.reverseY ? -t : t); }, p = e => { if (e.pointerType === `touch`)
    return; let n = V.current.tracking === `component` ? t.getBoundingClientRect() : null; if (n && (e.clientX < n.left || e.clientX > n.right || e.clientY < n.top || e.clientY > n.bottom)) {
    f(0, 0);
    return;
} let r = n ? (e.clientX - n.left) / Math.max(n.width, 1) : e.clientX / i.innerWidth, a = n ? (e.clientY - n.top) / Math.max(n.height, 1) : e.clientY / i.innerHeight; f(r * 2 - 1, a * 2 - 1); }, m = () => f(0, 0), h = null, v = e => { e.pointerType === `touch` && V.current.touchMode === `drag` && e.isPrimary && (h = { id: e.pointerId, x: e.clientX, y: e.clientY, direction: `pending` }); }, y = e => { if (!h || e.pointerId !== h.id)
    return; let n = e.clientX - h.x, r = e.clientY - h.y; if (h.direction === `pending` && Math.hypot(n, r) > 8 && (h.direction = Math.abs(n) > Math.abs(r) ? `horizontal` : `vertical`, h.direction === `horizontal`))
    try {
        t.setPointerCapture(e.pointerId);
    }
    catch { } h.direction === `horizontal` && f(n / Math.max(t.clientWidth * .35, 1), 0); }, b = e => { h && e.pointerId === h.id && (h = null, m()); }; i.addEventListener(`pointermove`, p, { passive: !0 }), i.addEventListener(`blur`, m), document.documentElement.addEventListener(`pointerleave`, m), t.addEventListener(`pointerdown`, v, { passive: !0 }), t.addEventListener(`pointermove`, y, { passive: !0 }), t.addEventListener(`pointerup`, b, { passive: !0 }), t.addEventListener(`pointercancel`, b, { passive: !0 }), document.addEventListener(`visibilitychange`, d), l.addEventListener(`change`, d); let x = new IntersectionObserver(e => { s = e[0]?.isIntersecting ?? !0, d(); }, { threshold: 0 }); x.observe(t), d(), c = () => { i.removeEventListener(`pointermove`, p), i.removeEventListener(`blur`, m), document.documentElement.removeEventListener(`pointerleave`, m), t.removeEventListener(`pointerdown`, v), t.removeEventListener(`pointermove`, y), t.removeEventListener(`pointerup`, b), t.removeEventListener(`pointercancel`, b), document.removeEventListener(`visibilitychange`, d), l.removeEventListener(`change`, d), x.disconnect(); }; }).catch(() => u()), () => { a = !0, c(), e.removeEventListener(`webglcontextrestored`, f), o?.dispose(), F.current === o && (F.current = null); }; }, [M, n, H, R]), l(() => { F.current?.update(B.current); }, [S, C, w, T, E, D, O, k, A, j]), /*#__PURE__*/ o(`div`, { ref: N, role: `img`, "aria-label": v, style: { ...b, position: `relative`, width: `100%`, height: `100%`, overflow: `hidden`, background: `#000`, isolation: `isolate`, touchAction: `auto` }, children: [M && /*#__PURE__*/ s(`img`, { src: M, alt: ``, "aria-hidden": `true`, draggable: !1, onLoad: () => { (r.maxTouchPoints > 0 || i.matchMedia(`(any-pointer: coarse)`).matches) && _(); }, onError: () => { (r.maxTouchPoints > 0 || i.matchMedia(`(any-pointer: coarse)`).matches) && _(); }, style: { position: `absolute`, inset: 0, width: `100%`, height: `100%`, objectFit: O, objectPosition: `${k}% ${A}%`, transform: `scale(${D})`, transformOrigin: `${k}% ${A}%`, display: `block`, pointerEvents: `none`, userSelect: `none`, visibility: I ? `hidden` : `visible` } }), /*#__PURE__*/ s(`canvas`, { ref: P, "aria-hidden": `true`, style: { display: `block`, position: `absolute`, inset: 0, width: `100%`, height: `100%`, pointerEvents: `none`, opacity: +!!I } })] }); }
var y, b, x;
function S() { return (S = e((() => { n(), c(), t(), f(), y = { horizontal: 2.8, vertical: 2, moveX: 0, moveY: 0, smoothing: .22, zoom: 1, fit: `cover`, positionX: 50, positionY: 50, pixelRatio: 1.5 }, b = (e, t, n) => Math.min(n, Math.max(t, e)), x = e => typeof e == `string` ? e : e?.src || ``, v.defaultProps = { width: 800, height: 800, ...y, tracking: `window`, touchMode: `drag`, reverseX: !1, reverseY: !1, alt: `Portret Pawła` }, m(v, { photo: { type: p.ResponsiveImage, title: `Photo` }, depthMap: { type: p.File, title: `Depth map`, allowedFileTypes: [`png`] }, horizontal: { type: p.Number, title: `Horizontal`, min: 0, max: 5, step: .1, defaultValue: 2.8, unit: `%` }, vertical: { type: p.Number, title: `Vertical`, min: 0, max: 4, step: .1, defaultValue: 2, unit: `%` }, moveX: { type: p.Number, title: `Move X`, min: -5, max: 5, step: .1, defaultValue: 0, unit: `%`, description: `Przesunięcie w poziomie jako % szerokości zdjęcia. 0 = zakotwiczona twarz.` }, moveY: { type: p.Number, title: `Move Y`, min: -5, max: 5, step: .1, defaultValue: 0, unit: `%`, description: `Przesunięcie w pionie jako % wysokości zdjęcia. 0 = zakotwiczona twarz.` }, smoothing: { type: p.Number, title: `Smoothing`, min: .05, max: .8, step: .01, defaultValue: .22, unit: `s` }, zoom: { type: p.Number, title: `Zoom`, min: 1, max: 1.5, step: .01, defaultValue: 1 }, fit: { type: p.Enum, title: `Fit`, options: [`cover`, `contain`], optionTitles: [`Cover`, `Contain`], defaultValue: `cover` }, positionX: { type: p.Number, title: `Position X`, min: 0, max: 100, step: 1, defaultValue: 50, unit: `%` }, positionY: { type: p.Number, title: `Position Y`, min: 0, max: 100, step: 1, defaultValue: 50, unit: `%` }, tracking: { type: p.Enum, title: `Tracking`, options: [`window`, `component`], optionTitles: [`Whole window`, `Component`], defaultValue: `window` }, reverseX: { type: p.Boolean, title: `Reverse X`, defaultValue: !1 }, reverseY: { type: p.Boolean, title: `Reverse Y`, defaultValue: !1 }, pixelRatio: { type: p.Number, title: `Quality`, min: 1, max: 2, step: .25, defaultValue: 1.5 }, alt: { type: p.String, title: `Alt text`, defaultValue: `Portret Pawła` } }); })))(); }
export { S as n, v as t };
//# sourceMappingURL=portrait_parallax_v1.DgkqosuF.mjs.map
