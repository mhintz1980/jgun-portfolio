import { t as e } from "./rolldown-runtime.Bi-D_2cA.mjs";
import { C as t, D as n, F as r, L as i, g as a, l as o, o as s, s as c, v as l, y as u } from "./react.B4lOa1lM.mjs";
import { H as d, r as f, w as p } from "./framer.BIOwr9OE.mjs";
function m(e) { let { imageBefore: t, imageAfter: r, labelBefore: c, labelAfter: d, labelBeforeColor: f, labelAfterColor: p, font: m, direction: b, labelPosition: x } = e, [S, C] = a(50), w = u(null), T = u(!1), E = u(0), D = u(0), O = u(null), k = b === `horizontal`, A = u(null), j = u(null), M = u(null), N = u(null), P = n(e => { let t = Math.min(100, Math.max(0, e)); A.current && (A.current.style.clipPath = k ? `inset(0% ${100 - t}% 0% 0%)` : `inset(0% 0% ${100 - t}% 0%)`), j.current && (k ? j.current.style.left = `${t}%` : j.current.style.top = `${t}%`), M.current && (M.current.style.opacity = t < 15 ? `0` : `1`), N.current && (N.current.style.opacity = t > 85 ? `0` : `1`); }, [k]), F = n((e, t) => { if (!w.current)
    return S; let n = w.current.getBoundingClientRect(); return k ? (e - n.left) / n.width * 100 : (t - n.top) / n.height * 100; }, [k, S]), I = n(e => { if (!e.touches || e.touches.length === 0)
    return; let t = e.touches[0]; E.current = t.clientX, D.current = t.clientY, O.current = null, T.current = !0; }, []), L = n(e => { if (!T.current || !e.touches || e.touches.length === 0)
    return; let t = e.touches[0], n = t.clientX - E.current, r = t.clientY - D.current, i = Math.abs(n), a = Math.abs(r); if (k) {
    if (O.current === null) {
        if (Math.max(i, a) < 6)
            return;
        if (i > a * 1.15)
            O.current = `slider`;
        else if (a > i * 1.15) {
            O.current = `scroll`, T.current = !1;
            return;
        }
        else
            return;
    }
    if (O.current === `scroll`)
        return;
    if (O.current === `slider`) {
        e.preventDefault();
        let n = F(t.clientX, t.clientY);
        P(n);
    }
    return;
} e.preventDefault(); let o = F(t.clientX, t.clientY); P(o); }, [k, F, P]), R = n(e => { if (!T.current) {
    O.current = null;
    return;
} if (!e.changedTouches || e.changedTouches.length === 0) {
    T.current = !1, O.current = null;
    return;
} let t = e.changedTouches[0]; if (O.current === `scroll`) {
    T.current = !1, O.current = null;
    return;
} let n = F(t.clientX, t.clientY); P(n), C(Math.min(100, Math.max(0, n))), T.current = !1, O.current = null; }, [F, P]), z = n(() => { T.current = !1, O.current = null; }, []), B = n(e => { e.preventDefault(), T.current = !0; let t = F(e.clientX, e.clientY); P(t), C(Math.min(100, Math.max(0, t))); }, [F, P]), V = n(e => { if (!T.current)
    return; e.preventDefault(); let t = F(e.clientX, e.clientY); P(t); }, [F, P]), H = n(e => { if (!T.current)
    return; let t = F(e.clientX, e.clientY); C(Math.min(100, Math.max(0, t))), T.current = !1; }, [F]); l(() => { let e = w.current; if (e)
    return e.addEventListener(`touchstart`, I, { passive: !0 }), e.addEventListener(`touchmove`, L, { passive: !1 }), e.addEventListener(`touchend`, R, { passive: !0 }), e.addEventListener(`touchcancel`, z, { passive: !0 }), e.addEventListener(`mousedown`, B), i.addEventListener(`mousemove`, V), i.addEventListener(`mouseup`, H), () => { e.removeEventListener(`touchstart`, I), e.removeEventListener(`touchmove`, L), e.removeEventListener(`touchend`, R), e.removeEventListener(`touchcancel`, z), e.removeEventListener(`mousedown`, B), i.removeEventListener(`mousemove`, V), i.removeEventListener(`mouseup`, H); }; }, [I, L, R, z, B, V, H]); let U = e => e ? typeof e == `number` ? `${e}px` : e : `inherit`, W = e => e ? typeof e == `number` ? `${e}px` : e : `14px`, G = { ..._, ...m, fontSize: W(m?.fontSize), lineHeight: U(m?.lineHeight) }, K = k ? `inset(0% ${100 - S}% 0% 0%)` : `inset(0% 0% ${100 - S}% 0%)`, q = x === `top` ? { top: `16px` } : { bottom: `16px` }; return /*#__PURE__*/ o(`div`, { ref: w, style: { ...h, cursor: k ? `ew-resize` : `ns-resize`, touchAction: k ? `pan-y` : `none` }, children: [r ? /*#__PURE__*/ s(`img`, { src: r, style: g, alt: ``, draggable: !1 }) : /*#__PURE__*/ s(`div`, { style: { ...g, backgroundColor: `#EBEBEB` } }), t ? /*#__PURE__*/ s(`img`, { ref: A, src: t, style: { ...g, clipPath: K }, alt: ``, draggable: !1 }) : /*#__PURE__*/ s(`div`, { ref: A, style: { ...g, backgroundColor: `#CCCCCC`, clipPath: K } }), c && /*#__PURE__*/ s(`div`, { ref: M, style: { ...G, backgroundColor: f, ...k ? { left: `16px`, ...q } : { top: `16px`, left: `50%`, transform: `translateX(-50%)` }, opacity: S < 15 ? 0 : 1, transition: `opacity 0.25s ease-in-out` }, children: c }), d && /*#__PURE__*/ s(`div`, { ref: N, style: { ...G, backgroundColor: p, ...k ? { right: `16px`, ...q } : { bottom: `16px`, left: `50%`, transform: `translateX(-50%)` }, opacity: S > 85 ? 0 : 1, transition: `opacity 0.25s ease-in-out` }, children: d }), /*#__PURE__*/ s(`div`, { ref: j, style: { ...v, left: k ? `${S}%` : 0, top: k ? 0 : `${S}%`, width: k ? `2px` : `100%`, height: k ? `100%` : `2px`, transform: k ? `translateX(-50%)` : `translateY(-50%)` }, children: /*#__PURE__*/ s(`div`, { style: { ...y, transform: k ? `rotate(0deg)` : `rotate(90deg)` }, children: /*#__PURE__*/ o(`svg`, { viewBox: `0 0 24 24`, width: `32`, height: `32`, stroke: `#333`, strokeWidth: `2.5`, fill: `none`, children: [/*#__PURE__*/ s(`polyline`, { points: `9 16 5 12 9 8` }), /*#__PURE__*/ s(`polyline`, { points: `15 8 19 12 15 16` })] }) }) })] }); }
var h, g, _, v, y;
function b() { return (b = e((() => { r(), c(), t(), d(), m.defaultProps = { direction: `horizontal`, labelPosition: `bottom`, labelBefore: `Before`, labelAfter: `After`, labelBeforeColor: `#408053`, labelAfterColor: `#408053` }, p(m, { direction: { type: f.Enum, title: `Direction`, options: [`horizontal`, `vertical`], optionTitles: [`Horizontal`, `Vertical`], defaultValue: `horizontal`, displaySegmentedControl: !0 }, labelPosition: { type: f.Enum, title: `Label Position`, options: [`top`, `bottom`], optionTitles: [`Top`, `Bottom`], defaultValue: `bottom`, displaySegmentedControl: !0, hidden(e) { return e.direction === `vertical`; } }, imageBefore: { type: f.Image, title: `Before Image` }, imageAfter: { type: f.Image, title: `After Image` }, labelBefore: { type: f.String, title: `Before Label`, defaultValue: `Before` }, labelBeforeColor: { type: f.Color, title: `Before Color`, defaultValue: `#408053` }, labelAfter: { type: f.String, title: `After Label`, defaultValue: `After` }, labelAfterColor: { type: f.Color, title: `After Color`, defaultValue: `#408053` }, font: { type: f.Font, title: `Label Typography`, controls: `extended`, displayFontSize: !0, displayTextAlignment: !0, defaultValue: { fontFamily: `Inter, sans-serif`, fontSize: 14, fontWeight: 500 } } }), h = { position: `relative`, width: `100%`, height: `100%`, overflow: `hidden`, backgroundColor: `#F5F5F5`, userSelect: `none`, WebkitUserSelect: `none` }, g = { position: `absolute`, top: 0, left: 0, width: `100%`, height: `100%`, objectFit: `cover`, pointerEvents: `none` }, _ = { position: `absolute`, padding: `6px 14px`, color: `#FFFFFF`, borderRadius: `20px`, border: `1px solid rgba(255, 255, 255, 0.3)`, backdropFilter: `blur(4px)`, pointerEvents: `none`, zIndex: 2 }, v = { position: `absolute`, backgroundColor: `#FFFFFF`, pointerEvents: `none`, zIndex: 3, display: `flex`, alignItems: `center`, justifyContent: `center`, boxShadow: `0px 0px 5px rgba(0,0,0,0.3)` }, y = { width: `64px`, height: `40px`, backgroundColor: `#FFFFFF`, borderRadius: `8px`, display: `flex`, alignItems: `center`, justifyContent: `center`, boxShadow: `0 2px 6px rgba(0,0,0,0.3)` }; })))(); }
function x(e) { let { imageBefore: t, imageAfter: r, labelBefore: c, labelAfter: d, labelBeforeColor: f, labelAfterColor: p, font: m, direction: h, labelPosition: g } = e, [_, v] = a(50), y = u(null), b = u(!1), x = u(0), D = u(0), O = u(null), k = h === `horizontal`, A = u(null), j = u(null), M = u(null), N = u(null), P = n(e => { let t = Math.min(100, Math.max(0, e)); A.current && (A.current.style.clipPath = k ? `inset(0% ${100 - t}% 0% 0%)` : `inset(0% 0% ${100 - t}% 0%)`), j.current && (k ? j.current.style.left = `${t}%` : j.current.style.top = `${t}%`), M.current && (M.current.style.opacity = t < 15 ? `0` : `1`), N.current && (N.current.style.opacity = t > 85 ? `0` : `1`); }, [k]), F = n((e, t) => { if (!y.current)
    return _; let n = y.current.getBoundingClientRect(); return k ? (e - n.left) / n.width * 100 : (t - n.top) / n.height * 100; }, [k, _]), I = n(e => { if (!e.touches || e.touches.length === 0)
    return; let t = e.touches[0]; x.current = t.clientX, D.current = t.clientY, O.current = null, b.current = !0; }, []), L = n(e => { if (!b.current || !e.touches || e.touches.length === 0)
    return; let t = e.touches[0], n = t.clientX - x.current, r = t.clientY - D.current, i = Math.abs(n), a = Math.abs(r); if (k) {
    if (O.current === null) {
        if (Math.max(i, a) < 6)
            return;
        if (i > a * 1.15)
            O.current = `slider`;
        else if (a > i * 1.15) {
            O.current = `scroll`, b.current = !1;
            return;
        }
        else
            return;
    }
    if (O.current === `scroll`)
        return;
    if (O.current === `slider`) {
        e.preventDefault();
        let n = F(t.clientX, t.clientY);
        P(n);
    }
    return;
} e.preventDefault(); let o = F(t.clientX, t.clientY); P(o); }, [k, F, P]), R = n(e => { if (!b.current) {
    O.current = null;
    return;
} if (!e.changedTouches || e.changedTouches.length === 0) {
    b.current = !1, O.current = null;
    return;
} let t = e.changedTouches[0]; if (O.current === `scroll`) {
    b.current = !1, O.current = null;
    return;
} let n = F(t.clientX, t.clientY); P(n), v(Math.min(100, Math.max(0, n))), b.current = !1, O.current = null; }, [F, P]), z = n(() => { b.current = !1, O.current = null; }, []), B = n(e => { e.preventDefault(), b.current = !0; let t = F(e.clientX, e.clientY); P(t), v(Math.min(100, Math.max(0, t))); }, [F, P]), V = n(e => { if (!b.current)
    return; e.preventDefault(); let t = F(e.clientX, e.clientY); P(t); }, [F, P]), H = n(e => { if (!b.current)
    return; let t = F(e.clientX, e.clientY); v(Math.min(100, Math.max(0, t))), b.current = !1; }, [F]); l(() => { let e = y.current; if (e)
    return e.addEventListener(`touchstart`, I, { passive: !0 }), e.addEventListener(`touchmove`, L, { passive: !1 }), e.addEventListener(`touchend`, R, { passive: !0 }), e.addEventListener(`touchcancel`, z, { passive: !0 }), e.addEventListener(`mousedown`, B), i.addEventListener(`mousemove`, V), i.addEventListener(`mouseup`, H), () => { e.removeEventListener(`touchstart`, I), e.removeEventListener(`touchmove`, L), e.removeEventListener(`touchend`, R), e.removeEventListener(`touchcancel`, z), e.removeEventListener(`mousedown`, B), i.removeEventListener(`mousemove`, V), i.removeEventListener(`mouseup`, H); }; }, [I, L, R, z, B, V, H]); let U = e => e ? typeof e == `number` ? `${e}px` : e : `inherit`, W = e => e ? typeof e == `number` ? `${e}px` : e : `14px`, G = { ...w, ...m, fontSize: W(m?.fontSize), lineHeight: U(m?.lineHeight) }, K = k ? `inset(0% ${100 - _}% 0% 0%)` : `inset(0% 0% ${100 - _}% 0%)`, q = g === `top` ? { top: `16px` } : { bottom: `16px` }; return /*#__PURE__*/ o(`div`, { ref: y, style: { ...S, cursor: k ? `ew-resize` : `ns-resize`, touchAction: k ? `pan-y` : `none` }, children: [r ? /*#__PURE__*/ s(`img`, { src: r, style: C, alt: ``, draggable: !1 }) : /*#__PURE__*/ s(`div`, { style: { ...C, backgroundColor: `#EBEBEB` } }), t ? /*#__PURE__*/ s(`img`, { ref: A, src: t, style: { ...C, clipPath: K }, alt: ``, draggable: !1 }) : /*#__PURE__*/ s(`div`, { ref: A, style: { ...C, backgroundColor: `#CCCCCC`, clipPath: K } }), c && /*#__PURE__*/ s(`div`, { ref: M, style: { ...G, backgroundColor: f, ...k ? { left: `16px`, ...q } : { top: `16px`, left: `50%`, transform: `translateX(-50%)` }, opacity: _ < 15 ? 0 : 1, transition: `opacity 0.25s ease-in-out` }, children: c }), d && /*#__PURE__*/ s(`div`, { ref: N, style: { ...G, backgroundColor: p, ...k ? { right: `16px`, ...q } : { bottom: `16px`, left: `50%`, transform: `translateX(-50%)` }, opacity: _ > 85 ? 0 : 1, transition: `opacity 0.25s ease-in-out` }, children: d }), /*#__PURE__*/ s(`div`, { ref: j, style: { ...T, left: k ? `${_}%` : 0, top: k ? 0 : `${_}%`, width: k ? `2px` : `100%`, height: k ? `100%` : `2px`, transform: k ? `translateX(-50%)` : `translateY(-50%)` }, children: /*#__PURE__*/ s(`div`, { style: { ...E, transform: k ? `rotate(0deg)` : `rotate(90deg)` }, children: /*#__PURE__*/ o(`svg`, { viewBox: `0 0 24 24`, width: `32`, height: `32`, stroke: `#333`, strokeWidth: `2.5`, fill: `none`, children: [/*#__PURE__*/ s(`polyline`, { points: `9 16 5 12 9 8` }), /*#__PURE__*/ s(`polyline`, { points: `15 8 19 12 15 16` })] }) }) })] }); }
var S, C, w, T, E;
function D() { return (D = e((() => { r(), c(), t(), d(), x.defaultProps = { direction: `horizontal`, labelPosition: `bottom`, labelBefore: `Before`, labelAfter: `After`, labelBeforeColor: `#408053`, labelAfterColor: `#408053` }, p(x, { direction: { type: f.Enum, title: `Direction`, options: [`horizontal`, `vertical`], optionTitles: [`Horizontal`, `Vertical`], defaultValue: `horizontal`, displaySegmentedControl: !0 }, labelPosition: { type: f.Enum, title: `Label Position`, options: [`top`, `bottom`], optionTitles: [`Top`, `Bottom`], defaultValue: `bottom`, displaySegmentedControl: !0, hidden(e) { return e.direction === `vertical`; } }, imageBefore: { type: f.Image, title: `Before Image` }, imageAfter: { type: f.Image, title: `After Image` }, labelBefore: { type: f.String, title: `Before Label`, defaultValue: `Before` }, labelBeforeColor: { type: f.Color, title: `Before Color`, defaultValue: `#408053` }, labelAfter: { type: f.String, title: `After Label`, defaultValue: `After` }, labelAfterColor: { type: f.Color, title: `After Color`, defaultValue: `#408053` }, font: { type: f.Font, title: `Label Typography`, controls: `extended`, displayFontSize: !0, displayTextAlignment: !0, defaultValue: { fontFamily: `Inter, sans-serif`, fontSize: 14, fontWeight: 500 } } }), S = { position: `relative`, width: `100%`, height: `100%`, overflow: `hidden`, backgroundColor: `#F5F5F5`, userSelect: `none`, WebkitUserSelect: `none` }, C = { position: `absolute`, top: 0, left: 0, width: `100%`, height: `100%`, objectFit: `cover`, pointerEvents: `none` }, w = { position: `absolute`, padding: `6px 14px`, color: `#FFFFFF`, borderRadius: `20px`, border: `1px solid rgba(255, 255, 255, 0.3)`, backdropFilter: `blur(4px)`, pointerEvents: `none`, zIndex: 2 }, T = { position: `absolute`, backgroundColor: `#FFFFFF`, pointerEvents: `none`, zIndex: 3, display: `flex`, alignItems: `center`, justifyContent: `center`, boxShadow: `0px 0px 5px rgba(0,0,0,0.3)` }, E = { width: `64px`, height: `40px`, backgroundColor: `#FFFFFF`, borderRadius: `8px`, display: `flex`, alignItems: `center`, justifyContent: `center`, boxShadow: `0 2px 6px rgba(0,0,0,0.3)` }; })))(); }
export { b as i, D as n, m as r, x as t };
//# sourceMappingURL=ewm_before_after_slider_web.D3LIiC0P.mjs.map
