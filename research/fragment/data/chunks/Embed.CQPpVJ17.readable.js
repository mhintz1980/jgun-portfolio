import { t as e } from "./rolldown-runtime.Bi-D_2cA.mjs";
import { C as t, F as n, L as r, g as i, o as a, s as o, v as s, y as c } from "./react.B4lOa1lM.mjs";
import { H as l, r as u, w as d } from "./framer.BIOwr9OE.mjs";
import { S as f, b as p, v as m, x as h } from "./toplevel-deps.B0dn5Ev5.mjs";
function g() { return (g = e((() => { m(); })))(); }
function _({ type: e, url: t, html: n, zoom: r, radius: i, border: o, style: s = {} }) { return e === `url` && t ? /*#__PURE__*/ a(y, { url: t, zoom: r, radius: i, border: o, style: s }) : e === `html` && n ? /*#__PURE__*/ a(x, { html: n, style: s }) : /*#__PURE__*/ a(v, { style: s }); }
function v({ style: e }) { return /*#__PURE__*/ a(`div`, { style: { minHeight: O(e), ...f, overflow: `hidden`, ...e }, children: /*#__PURE__*/ a(`div`, { style: j, children: `To embed a website or widget, add it to the properties\xA0panel.` }) }); }
function y({ url: e, zoom: t, radius: n, border: r, style: o }) { let c = !o.height; /[a-z]+:\/\//.test(e) || (e = `https://` + e); let l = p(), [u, d] = i(l ? void 0 : !1); if (s(() => { if (!l)
    return; let t = !0; d(void 0); async function n() { let n = await fetch(`https://api.framer.com/functions/check-iframe-url?url=` + encodeURIComponent(e)); if (n.status == 200) {
    let { isBlocked: e } = await n.json();
    t && d(e);
}
else {
    let e = await n.text();
    console.error(e), d(/* @__PURE__ */ Error(`This site can’t be reached.`));
} } return n().catch(e => { console.error(e), d(e); }), () => { t = !1; }; }, [e]), l && c)
    return /*#__PURE__*/ a(D, { message: `URL embeds do not support auto height.`, style: o }); if (!e.startsWith(`https://`))
    return /*#__PURE__*/ a(D, { message: `Unsupported protocol.`, style: o }); if (u === void 0)
    return /*#__PURE__*/ a(E, {}); if (u instanceof Error)
    return /*#__PURE__*/ a(D, { message: u.message, style: o }); if (u === !0) {
    let t = `Can’t embed ${e} due to its content security policy.`;
    return /*#__PURE__*/ a(D, { message: t, style: o });
} return /*#__PURE__*/ a(`iframe`, { src: e, style: { ...k, ...o, ...r, zoom: t, borderRadius: n, transformOrigin: `top center` }, loading: `lazy`, fetchPriority: l ? `low` : `auto`, referrerPolicy: `no-referrer`, sandbox: b(l), allowFullScreen: !0, allow: `presentation; fullscreen; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write` }); }
function b(e) { let t = [`allow-same-origin`, `allow-scripts`]; return e || t.push(`allow-downloads`, `allow-forms`, `allow-modals`, `allow-orientation-lock`, `allow-pointer-lock`, `allow-popups`, `allow-popups-to-escape-sandbox`, `allow-presentation`, `allow-storage-access-by-user-activation`, `allow-top-navigation-by-user-activation`), t.join(` `); }
function x({ html: e, ...t }) { if (e.includes(`<\/script>`)) {
    let n = e.includes(`</spline-viewer>`), r = e.includes(`<!-- framer-direct-embed -->`);
    return a(n || r ? C : S, { html: e, ...t });
} return /*#__PURE__*/ a(w, { html: e, ...t }); }
function S({ html: e, style: t }) {
    let n = c(), [o, l] = i(0);
    s(() => { let e = n.current?.contentWindow; function t(t) { if (t.source !== e)
        return; let n = t.data; if (typeof n != `object` || !n)
        return; let r = n.embedHeight; typeof r == `number` && l(r); } return r.addEventListener(`message`, t), e?.postMessage(`getEmbedHeight`, `*`), () => { r.removeEventListener(`message`, t); }; }, []);
    let u = `
<html>
    <head>
        <style>
            html, body {
                margin: 0;
                padding: 0;
            }

            body {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            :root {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            * {
                box-sizing: border-box;
                -webkit-font-smoothing: inherit;
            }

            h1, h2, h3, h4, h5, h6, p, figure {
                margin: 0;
            }

            body, input, textarea, select, button {
                font-size: 12px;
                font-family: sans-serif;
            }
        </style>
    </head>
    <body>
        ${e}
        <script type="module">
            let height = 0

            function sendEmbedHeight() {
                window.parent.postMessage({
                    embedHeight: height
                }, "*")
            }

            const observer = new ResizeObserver((entries) => {
                if (entries.length !== 1) return
                const entry = entries[0]
                if (entry.target !== document.body) return

                height = entry.contentRect.height
                sendEmbedHeight()
            })

            observer.observe(document.body)

            window.addEventListener("message", (event) => {
                if (event.source !== window.parent) return
                if (event.data !== "getEmbedHeight") return
                sendEmbedHeight()
            })
        <\/script>
    <body>
</html>
`, d = { ...k, ...t };
    return t.height || (d.height = o + `px`), /*#__PURE__*/ a(`iframe`, { ref: n, style: d, srcDoc: u });
}
function C({ html: e, style: t }) { let n = c(); return s(() => { let t = n.current; if (t)
    return t.innerHTML = e, T(t), () => { t.innerHTML = ``; }; }, [e]), /*#__PURE__*/ a(`div`, { ref: n, style: { ...A, ...t } }); }
function w({ html: e, style: t }) { return /*#__PURE__*/ a(`div`, { style: { ...A, ...t }, dangerouslySetInnerHTML: { __html: e } }); }
function T(e) { if (e instanceof Element && e.tagName === `SCRIPT`) {
    let t = document.createElement(`script`);
    t.text = e.innerHTML;
    for (let { name: n, value: r } of e.attributes)
        t.setAttribute(n, r);
    e.parentElement.replaceChild(t, e);
}
else
    for (let t of e.childNodes)
        T(t); }
function E() { return /*#__PURE__*/ a(`div`, { className: `framerInternalUI-componentPlaceholder`, style: { ...h, overflow: `hidden` }, children: /*#__PURE__*/ a(`div`, { style: j, children: `Loading…` }) }); }
function D({ message: e, style: t }) { return /*#__PURE__*/ a(`div`, { className: `framerInternalUI-errorPlaceholder`, style: { minHeight: O(t), ...h, overflow: `hidden`, ...t }, children: /*#__PURE__*/ a(`div`, { style: j, children: e }) }); }
function O(e) { if (!e.height)
    return 200; }
var k, A, j;
function M() { return (M = e((() => { n(), o(), t(), l(), g(), d(_, { type: { type: u.Enum, defaultValue: `url`, displaySegmentedControl: !0, options: [`url`, `html`], optionTitles: [`URL`, `HTML`] }, url: { title: `URL`, type: u.String, description: `Some websites don’t support embedding.`, hidden(e) { return e.type !== `url`; } }, html: { title: `HTML`, type: u.String, displayTextArea: !0, hidden(e) { return e.type !== `html`; } }, border: { title: `Border`, type: u.Border, optional: !0, hidden(e) { return e.type !== `url`; } }, radius: { type: u.BorderRadius, title: `Radius`, hidden(e) { return e.type !== `url`; } }, zoom: { title: `Zoom`, defaultValue: 1, type: u.Number, hidden(e) { return e.type !== `url`; }, min: .1, max: 1, step: .1, displayStepper: !0 } }), k = { width: `100%`, height: `100%`, border: `none` }, A = { width: `100%`, height: `100%`, display: `flex`, flexDirection: `column`, justifyContent: `center`, alignItems: `center` }, j = { textAlign: `center`, minWidth: 140 }; })))(); }
export { M as n, _ as t };
//# sourceMappingURL=Embed.CQPpVJ17.mjs.map
