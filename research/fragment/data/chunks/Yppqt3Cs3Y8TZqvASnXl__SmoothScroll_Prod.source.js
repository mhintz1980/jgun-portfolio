import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { addPropertyControls, ControlType, RenderTarget } from "framer";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function isPhoneDevice() { return window.matchMedia("(max-width: 767px)").matches || /iPhone|iPod|Android.+Mobile|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent); }
function canScrollBy(node, delta) { const limit = node.scrollHeight - node.clientHeight; return delta > 0 && node.scrollTop < limit - 1 || delta < 0 && node.scrollTop > 1; } // Walks composedPath() so panels inside shadow DOM still count.
// Returns the first nested scroller that can move in this direction, or one
// at its edge whose overscroll-behavior forbids chaining to the page.
function findNestedScroller(path, delta) { for (const node of path) {
    if (!(node instanceof HTMLElement))
        continue;
    if (node === document.documentElement || node === document.body)
        break;
    if (node.scrollHeight - node.clientHeight < 1)
        continue;
    const style = getComputedStyle(node);
    if (!/^(auto|scroll|overlay)$/.test(style.overflowY))
        continue;
    if (canScrollBy(node, delta))
        return node;
    if (/^(contain|none)$/.test(style.overscrollBehaviorY))
        return node;
} return null; } // How much of the viewport top is covered by fixed or sticky bars (headers,
// banners, floating nav pills), so anchors land below them with zero
// configuration. Hit-tests dense rows through the top band (compact floating
// bars) plus a few lower rows, and walks ancestors, so a sticky header that
// sits below a banner and has not stuck yet still counts at its stuck spot.
function measureHeader() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const band = height * .1;
    const rows = [height * .12, height * .2, height * .3];
    for (let y = 1; y <= band + 12; y += 12)
        rows.push(y);
    const seen = new Set;
    let bottom = 0;
    for (const y of rows) {
        for (const x of [.25, .5, .75]) {
            for (const hit of document.elementsFromPoint(width * x, y)) {
                for (let node = hit; node; node = node.parentElement) {
                    if (node === document.body || seen.has(node))
                        break;
                    seen.add(node);
                    const style = getComputedStyle(node);
                    if (style.position !== "fixed" && style.position !== "sticky")
                        continue;
                    if (style.visibility === "hidden" || style.opacity === "0")
                        continue;
                    const rect = node.getBoundingClientRect();
                    if (rect.height <= 0 || rect.height >= height * .4)
                        continue; // Wide bars, or a nav pill across the centre line.
                    const centred = rect.left <= width / 2 && rect.right >= width / 2 && rect.width >= 120;
                    if (rect.width < width * .4 && !centred)
                        continue;
                    let top = rect.top;
                    if (style.position === "sticky") { // Pinned to the top (not `top: auto`), in a containing
                        // block that starts in the first screen of the page
                        // and is at least a screen taller than the bar: a site
                        // header, not a section title. Judged on the whole
                        // block, not the part left below the current scroll
                        // position, so it still counts near the page end.
                        const stick = Number.parseFloat(style.top); // Skip `display: contents` wrappers, which have no
                        // box of their own.
                        let parent = node.parentElement;
                        while (parent && getComputedStyle(parent).display === "contents") {
                            parent = parent.parentElement;
                        }
                        if (Number.isNaN(stick) || !parent)
                            continue;
                        const range = parent.getBoundingClientRect();
                        if (range.top + window.scrollY > height)
                            continue;
                        if (range.height - rect.height < height)
                            continue;
                        top = stick;
                    }
                    if (top > band || top + rect.height <= 0)
                        continue;
                    bottom = Math.max(bottom, top + rect.height);
                }
            }
        }
    }
    return Math.round(bottom);
} /**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 24
 * @framerIntrinsicHeight 24
 */
export default function SmoothScroll(props) {
    const { enabled = true, intensity = 50 } = props;
    const isCanvas = RenderTarget.current() === RenderTarget.canvas;
    React.useEffect(() => {
        if (!enabled || isCanvas || typeof window === "undefined")
            return;
        window.__framerUniversitySmoothScroll?.release();
        if (isPhoneDevice())
            return;
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const rootStyle = document.documentElement.style;
        const previousPadding = rootStyle.scrollPaddingTop; // A site that already sets scroll-padding-top keeps it.
        const authoredPadding = !previousPadding && (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) > 0;
        let current = window.scrollY;
        let target = current;
        let frame = 0;
        let previousTime = 0;
        let stopped = false;
        let gesture = null;
        const normalized = clamp(intensity, 0, 100) / 100;
        const response = normalized <= .5 ? .22 - .12 * (normalized / .5) : .1 - .07 * ((normalized - .5) / .5);
        const writeScroll = top => { window.scrollTo({
            top, behavior: "instant"
        }); }; // Chrome fires `scrollend` after every instant programmatic scroll,
        // so a glide would fire one per frame, and Framer's router saves the
        // position with history.replaceState on each. Hold them while the
        // page glides and deliver one when it ends, like a native smooth
        // scroll.
        const pendingFrames = new Set;
        const requestOwnedFrame = callback => { const id = requestAnimationFrame(time => { pendingFrames.delete(id); callback(time); }); pendingFrames.add(id); return id; };
        let scrollEndHeld = false;
        const onScrollEnd = event => { if (event.target !== document)
            return; if (frame && event.isTrusted) {
            event.stopImmediatePropagation();
            scrollEndHeld = true;
            return;
        } scrollEndHeld = false; }; // A glide that stopped without a later write of its own gets the held
        // scrollend delivered after this frame's scroll events.
        const flushScrollEnd = () => { if (!scrollEndHeld)
            return; requestOwnedFrame(() => { if (!scrollEndHeld || frame)
            return; scrollEndHeld = false; document.dispatchEvent(new Event("scrollend", {
            bubbles: true
        })); }); };
        const stop = () => { if (frame)
            cancelAnimationFrame(frame); frame = 0; previousTime = 0; current = target = window.scrollY; flushScrollEnd(); };
        const hasStopScroll = () => { if (document.querySelector("style[data-frameruni-stop-scroll]")) {
            return true;
        } const htmlOverflow = getComputedStyle(document.documentElement).overflowY; const bodyOverflow = getComputedStyle(document.body).overflowY; return htmlOverflow === "hidden" || htmlOverflow === "clip" || bodyOverflow === "hidden" || bodyOverflow === "clip"; };
        const syncStoppedState = () => { const nextStopped = hasStopScroll(); if (nextStopped && !stopped)
            stop(); if (!nextStopped && stopped) {
            current = target = window.scrollY;
        } stopped = nextStopped; };
        const scheduleFrame = () => { frame = requestAnimationFrame(advanceFrame); };
        const advanceFrame = time => {
            if (stopped || motionQuery.matches) {
                stop();
                return;
            } // Real elapsed time, uncapped: when the main thread is starved the
            // glide catches up on the next frame instead of running in slow
            // motion (the exponential mix stays bounded for any delta).
            const deltaTime = previousTime ? Math.max(0, (time - previousTime) / 1e3) : 1 / 60;
            previousTime = time;
            if (step(deltaTime))
                scheduleFrame();
            else {
                frame = 0;
                previousTime = 0;
                flushScrollEnd();
            }
        }; // One interpolation step; returns true while still gliding.
        const step = deltaTime => { const mix = 1 - Math.exp(-response * 60 * deltaTime); current += (target - current) * mix; if (Math.abs(target - current) < .35)
            current = target; writeScroll(current); return current !== target; }; // Page scroll range, read once per gesture (and again at the cached
        // edge or after a resize) so the wheel path does not force layout on
        // every event.
        let cachedLimit = -1;
        const scrollLimit = () => { if (cachedLimit < 0) {
            cachedLimit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        } return cachedLimit; };
        const jumpTo = nextTarget => { if (frame)
            cancelAnimationFrame(frame); frame = 0; previousTime = 0; current = target = nextTarget; writeScroll(nextTarget); flushScrollEnd(); };
        const animateTo = nextTarget => { if (motionQuery.matches) {
            jumpTo(nextTarget);
            return;
        } current = window.scrollY; target = nextTarget; previousTime = 0; if (current === target)
            return; if (!frame)
            scheduleFrame(); }; // Applied as scroll-padding-top so Framer's own anchor links, the
        // browser's deep-link jump, and our click handler all share it.
        const applyHeaderOffset = () => { if (previousPadding || authoredPadding)
            return; const value = measureHeader(); rootStyle.scrollPaddingTop = value ? `${value}px` : previousPadding; }; // Fixes a hash target that landed flush with the top, under the header.
        const alignHashTarget = () => { if (stopped || !window.location.hash)
            return; let id = window.location.hash.slice(1); try {
            id = decodeURIComponent(id);
        }
        catch {
            return;
        } const element = document.getElementById(id); if (!element)
            return; applyHeaderOffset(); const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0; const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0; if (padding < 1)
            return; if (Math.abs(element.getBoundingClientRect().top - margin) > 2)
            return; jumpTo(resolveScrollTarget(element)); };
        const resolveScrollTarget = value => { const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight); if (typeof value === "number")
            return clamp(value, 0, limit); const element = value instanceof HTMLElement ? value : value === "#" || value === "#top" ? null : document.getElementById(value.replace(/^#/, "")); if (!element)
            return 0; const style = getComputedStyle(element); const rootStyle = getComputedStyle(document.documentElement); const margin = Number.parseFloat(style.scrollMarginTop) || 0; const padding = Number.parseFloat(rootStyle.scrollPaddingTop) || 0; return clamp(element.getBoundingClientRect().top + window.scrollY - margin - padding, 0, limit); };
        const onWheel = event => {
            if (stopped || motionQuery.matches || event.ctrlKey || !event.cancelable)
                return;
            const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
            const delta = event.deltaY * multiplier;
            if (!delta)
                return; // Native-style latching: a gesture stays with the scroller it
            // started on. A nested panel at its edge only chains to the page
            // on the next gesture, and page momentum is not hijacked by a
            // panel that slides under the pointer.
            const path = event.composedPath();
            const continuing = gesture && event.timeStamp - gesture.time < 150 && (!gesture.node || path.includes(gesture.node));
            const owner = continuing ? gesture.node : findNestedScroller(path, delta);
            gesture = {
                node: owner, time: event.timeStamp
            };
            if (owner) {
                if (!canScrollBy(owner, delta))
                    event.preventDefault();
                return;
            } // Once this page gesture is ours, keep ownership even when the
            // clamped target cannot move. Letting edge events fall through lets
            // native scrolling race the active interpolation and causes bounce.
            event.preventDefault(); // Re-read the range at a gesture start or at the cached edge
            // (lazy content may have grown); otherwise reuse it.
            if (!continuing || target + delta > scrollLimit())
                cachedLimit = -1;
            const nextTarget = clamp(target + delta, 0, scrollLimit());
            if (nextTarget === target)
                return;
            target = nextTarget;
            if (frame)
                return; // Idle: take the first step now, inside the wheel event, so the
            // page moves this frame instead of waiting for the next rAF. The
            // next frame integrates from this handler, so the curve is the
            // same, just one frame earlier.
            current = window.scrollY;
            scheduleFrame(); // rAF time is the frame start: a frame that began before this
            // handler ran is the same frame, so it adds no second step.
            previousTime = performance.now();
            if (!step(1 / 60)) {
                cancelAnimationFrame(frame);
                frame = 0;
                previousTime = 0;
                flushScrollEnd();
            }
        };
        const onScroll = () => { const actual = window.scrollY; if (frame && Math.abs(actual - current) <= 1)
            return; if (frame)
            cancelAnimationFrame(frame); frame = 0; previousTime = 0; current = target = actual; flushScrollEnd(); };
        const onClick = event => { const clickable = event.composedPath().find(node => node instanceof HTMLElement && node.matches("a[href], button")); if (!clickable)
            return; stop(); if (!(clickable instanceof HTMLAnchorElement))
            return; if (event.defaultPrevented)
            return; if (event.button !== 0)
            return; if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return; if (clickable.hasAttribute("download"))
            return; if (clickable.target && clickable.target !== "" && clickable.target !== "_self") {
            return;
        } const url = new URL(clickable.href, window.location.href); const currentUrl = new URL(window.location.href); const isSamePage = url.origin === currentUrl.origin && url.pathname === currentUrl.pathname && url.search === currentUrl.search; if (!isSamePage || !url.hash)
            return; let hash = url.hash; try {
            hash = decodeURIComponent(url.hash);
        }
        catch {
            return;
        } const element = document.getElementById(hash.slice(1)); if (!element && hash !== "#top" && hash !== "#")
            return; event.preventDefault(); if (window.location.hash === url.hash) {
            history.replaceState(history.state, "", url.hash);
        }
        else {
            history.pushState(history.state, "", url.hash);
        } animateTo(resolveScrollTarget(element ?? hash)); };
        const onHashChange = () => requestOwnedFrame(alignHashTarget); // Re-measure before any same-page hash link runs (ours, Framer's
        // Links, or the browser's), so breakpoint and late headers count.
        const onClickCapture = event => { const link = event.composedPath().find(node => node instanceof HTMLAnchorElement && node.hash); if (link)
            applyHeaderOffset(); };
        let resizeTimer = 0;
        const onResize = () => { cachedLimit = -1; clearTimeout(resizeTimer); resizeTimer = window.setTimeout(applyHeaderOffset, 100); };
        let alignFrame = requestAnimationFrame(() => { alignFrame = requestAnimationFrame(alignHashTarget); });
        const attributeObserver = new MutationObserver(records => { const relevant = records.some(record => record.type === "attributes" && (record.target === document.documentElement || record.target === document.body)); if (relevant)
            syncStoppedState(); });
        const markerObserver = new MutationObserver(records => { const relevant = records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element && (node.matches("style[data-frameruni-stop-scroll]") || Boolean(node.querySelector("style[data-frameruni-stop-scroll]"))))); if (relevant)
            syncStoppedState(); });
        attributeObserver.observe(document.documentElement, {
            attributes: true, attributeFilter: ["style", "class"]
        });
        attributeObserver.observe(document.body, {
            attributes: true, attributeFilter: ["style", "class"]
        });
        markerObserver.observe(document.head, {
            subtree: true, childList: true
        });
        markerObserver.observe(document.body, {
            subtree: true, childList: true
        });
        const release = () => { stop(); cancelAnimationFrame(alignFrame); pendingFrames.forEach(cancelAnimationFrame); pendingFrames.clear(); clearTimeout(resizeTimer); rootStyle.scrollPaddingTop = previousPadding; window.removeEventListener("hashchange", onHashChange); window.removeEventListener("popstate", onHashChange); window.removeEventListener("resize", onResize); window.removeEventListener("load", onResize); window.removeEventListener("click", onClickCapture, true); attributeObserver.disconnect(); markerObserver.disconnect(); window.removeEventListener("wheel", onWheel); window.removeEventListener("scroll", onScroll); window.removeEventListener("scrollend", onScrollEnd, true); window.removeEventListener("touchstart", stop); window.removeEventListener("click", onClick); motionQuery.removeEventListener("change", stop); if (window.__framerUniversitySmoothScroll?.release === release) {
            delete window.__framerUniversitySmoothScroll;
        } };
        window.__framerUniversitySmoothScroll = {
            release
        };
        window.addEventListener("wheel", onWheel, {
            passive: false
        });
        window.addEventListener("scroll", onScroll, {
            passive: true
        });
        window.addEventListener("scrollend", onScrollEnd, true);
        window.addEventListener("touchstart", stop, {
            passive: true
        });
        window.addEventListener("click", onClick);
        window.addEventListener("hashchange", onHashChange);
        window.addEventListener("popstate", onHashChange);
        window.addEventListener("resize", onResize);
        window.addEventListener("load", onResize);
        window.addEventListener("click", onClickCapture, true);
        motionQuery.addEventListener("change", stop);
        syncStoppedState();
        applyHeaderOffset();
        return release;
    }, [enabled, intensity, isCanvas]);
    return /*#__PURE__*/ _jsx("div", {
        "data-build": "smooth-scroll-prod-20261005-01", "aria-hidden": "true", "data-smooth-scroll-host": "", style: {
            position: "relative", width: "100%", height: "100%", minWidth: isCanvas ? 24 : 0, minHeight: isCanvas ? 24 : 0, boxSizing: "border-box", border: "none", borderRadius: 0, pointerEvents: "none"
        }
    });
}
addPropertyControls(SmoothScroll, {
    enabled: {
        type: ControlType.Boolean, title: "Enabled", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No"
    }, intensity: {
        type: ControlType.Number, title: "Intensity", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", displayStepper: true, description: "More components at [Framer University](https://frameruni.link/cc)."
    }
});
SmoothScroll.displayName = "Smooth Scroll";
export const __FramerMetadata__ = {
    "exports": {
        "default": {
            "type": "reactComponent", "name": "SmoothScroll", "slots": [], "annotations": {
                "framerSupportedLayoutHeight": "any-prefer-fixed", "framerContractVersion": "1", "framerIntrinsicWidth": "24", "framerIntrinsicHeight": "24", "framerDisableUnlink": "* @framerSupportedLayoutWidth any-prefer-fixed"
            }
        }, "__FramerMetadata__": {
            "type": "variable"
        }
    }
};
//# sourceMappingURL=./SmoothScroll_Prod.map
