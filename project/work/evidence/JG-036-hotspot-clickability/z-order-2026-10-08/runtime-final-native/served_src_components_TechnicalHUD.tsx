import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/TechnicalHUD.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=0ce3f7a6"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=0ce3f7a6"; const useEffect = __vite__cjsImport1_react["useEffect"]; const useLayoutEffect = __vite__cjsImport1_react["useLayoutEffect"]; const useRef = __vite__cjsImport1_react["useRef"];
import { CHAPTERS, HOTSPOTS, MATERIAL_MODE_LABELS } from "/src/data/caseStudies.ts";
import { characteristicKey, GdtSymbol } from "/src/components/GdtSymbols.tsx";
import { getScrollState, navigateToStation, setScrollState, SPATIAL_STATIONS, telemetry, useScrollValue } from "/src/state/scrollStore.ts";
import { useQuality } from "/src/state/qualityStore.ts";
const MODES = ["solid", "blueprint", "exploded"];
let hotspotLayerElement = null;
export const getHotspotLayerPortal = () => {
  if (typeof document === "undefined") return null;
  hotspotLayerElement ??= document.createElement("div");
  hotspotLayerElement.dataset.jg036HotspotLayer = "";
  hotspotLayerElement.style.cssText = "position:absolute;inset:0;pointer-events:none;";
  return { current: hotspotLayerElement };
};
export function TechnicalHUD() {
  _s();
  const chapter = useScrollValue("chapter");
  const materialMode = useScrollValue("materialMode");
  const hotspotId = useScrollValue("hotspotId");
  const { reducedMotion } = useQuality();
  useEffect(() => {
    if (!hotspotId) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 2 || Math.abs(e.deltaX) > 2) {
        setScrollState({ hotspotId: null });
      }
    };
    let touchStartY = 0;
    let touchStartX = 0;
    const onTouchStart = (e) => {
      if (e.touches[0]) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches[0]) {
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        if (dy > 6 || dx > 6) {
          setScrollState({ hotspotId: null });
        }
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape" || event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "PageDown" || event.key === "PageUp") {
        setScrollState({ hotspotId: null });
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hotspotId]);
  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (isInput) return;
      if (event.key === "1") {
        navigateToStation(0);
      } else if (event.key === "2") {
        navigateToStation(1);
      } else if (event.key === "3") {
        navigateToStation(2);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const progressRef = useRef(null);
  const datumCoordsRef = useRef(null);
  const modeControlsRef = useRef(null);
  const chromeRef = useRef(null);
  const hotspotLayerHostRef = useRef(null);
  useLayoutEffect(() => {
    const host = hotspotLayerHostRef.current;
    const layer = getHotspotLayerPortal()?.current;
    if (!host || !layer) return;
    host.appendChild(layer);
    return () => {
      if (layer.parentElement === host) host.removeChild(layer);
    };
  }, []);
  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const tick = () => {
      const { progress } = getScrollState();
      if (modeControlsRef.current) modeControlsRef.current.style.visibility = progress <= 0.12 ? "hidden" : "visible";
      if (chromeRef.current) {
        const k = Math.min(1, Math.max(0, (progress - 0.12) / 0.015));
        chromeRef.current.style.opacity = String(k * k * (3 - 2 * k));
        chromeRef.current.style.visibility = k > 0 ? "visible" : "hidden";
      }
      if (progressRef.current) {
        progressRef.current.textContent = `SCROLL // ${String(Math.round(progress * 100)).padStart(3, "0")}%`;
      }
      if (datumCoordsRef.current) {
        const cam = telemetry.camera;
        datumCoordsRef.current.textContent = `CAM [ ${cam.x.toFixed(3)} ${cam.y.toFixed(3)} ${cam.z.toFixed(3)} ] · FOV ${cam.fov.toFixed(1)}°`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);
  const chapterDef = CHAPTERS[chapter] ?? CHAPTERS[0];
  const hotspot = HOTSPOTS.find((def) => def.id === hotspotId) ?? null;
  return /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-none fixed inset-0 z-20 select-none font-mono text-[11px] tracking-widest text-cyan-300/90", children: [
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        ref: hotspotLayerHostRef,
        className: "pointer-events-none absolute inset-0 z-0"
      },
      void 0,
      false,
      {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 171,
        columnNumber: 7
      },
      this
    ),
    !reducedMotion && /* @__PURE__ */ jsxDEV("div", { ref: chromeRef, style: { opacity: 0, visibility: "hidden" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute left-5 top-5 space-y-1", children: [
        /* @__PURE__ */ jsxDEV("p", { className: "text-cyan-200", children: chapterDef.label }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 182,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { children: /* @__PURE__ */ jsxDEV("span", { ref: progressRef, children: "SCROLL // 000%" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 184,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 183,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 181,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute right-5 top-5 space-y-1 text-right", children: [
        chapterDef.callouts.map((callout) => {
          const wordMatch = callout.match(/^([A-Z ]+?)\s(.*)$/);
          const key = wordMatch ? characteristicKey(wordMatch[1]) : null;
          return /* @__PURE__ */ jsxDEV("p", { className: "flex items-center justify-end gap-1.5", title: callout, children: key && wordMatch ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV(GdtSymbol, { name: wordMatch[1] }, void 0, false, {
              fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
              lineNumber: 199,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("span", { children: wordMatch[2] }, void 0, false, {
              fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
              lineNumber: 200,
              columnNumber: 23
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
            lineNumber: 198,
            columnNumber: 17
          }, this) : /* @__PURE__ */ jsxDEV("span", { children: callout }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
            lineNumber: 203,
            columnNumber: 17
          }, this) }, callout, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
            lineNumber: 196,
            columnNumber: 15
          }, this);
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "text-cyan-200", children: [
          "DATUM: ",
          chapterDef.datum
        ] }, void 0, true, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 208,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 191,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-auto absolute top-5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 border border-cyan-900/60 rounded", children: SPATIAL_STATIONS.map(
        (st) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            "aria-label": `Navigate to ${st.label}: ${st.name}`,
            onClick: () => navigateToStation(st.index),
            className: `cursor-pointer px-2 py-0.5 text-[10px] tracking-widest outline-none transition-colors rounded focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-black ${st.index === 0 && (chapter === 0 || chapter === 1) || st.index === 1 && chapter === 2 || st.index === 2 && chapter === 3 ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/50" : "text-cyan-400/60 hover:text-cyan-200 border border-transparent"}`,
            children: st.label
          },
          st.id,
          false,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
            lineNumber: 214,
            columnNumber: 11
          },
          this
        )
      ) }, void 0, false, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 212,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-5 left-5", children: /* @__PURE__ */ jsxDEV("p", { children: /* @__PURE__ */ jsxDEV("span", { ref: datumCoordsRef, children: "CAM [ 0.000 0.000 0.000 ]" }, void 0, false, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 235,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 234,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 233,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
      lineNumber: 179,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { ref: modeControlsRef, style: { visibility: "hidden" }, className: "pointer-events-auto absolute bottom-5 right-5 z-10 flex flex-col items-end gap-1", children: MODES.map(
      (mode) => /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          "aria-pressed": materialMode === mode,
          onClick: () => setScrollState({ materialMode: mode }),
          className: `cursor-pointer px-2 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${materialMode === mode ? "bg-cyan-300/20 text-cyan-100 ring-1 ring-cyan-400/40" : "text-cyan-400/70 hover:text-cyan-200"}`,
          children: MATERIAL_MODE_LABELS[mode]
        },
        mode,
        false,
        {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 244,
          columnNumber: 9
        },
        this
      )
    ) }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
      lineNumber: 242,
      columnNumber: 7
    }, this),
    hotspot && /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-auto absolute bottom-6 left-1/2 z-10 w-[min(30rem,88vw)] -translate-x-1/2 border border-cyan-400/50 bg-black/85 p-4 shadow-[0_0_25px_rgba(0,229,255,0.25)] backdrop-blur-md", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-start justify-between gap-4 border-b border-cyan-400/30 pb-2.5", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff] animate-pulse" }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
            lineNumber: 265,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "font-semibold text-cyan-100", children: hotspot.kind === "inspect" ? "◉ SUBASSEMBLY INSPECTION" : "◎ GD&T DATUM REFERENCE" }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
            lineNumber: 266,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 264,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            "aria-label": "Close hotspot detail",
            onClick: () => setScrollState({ hotspotId: null }),
            className: "cursor-pointer font-mono text-cyan-400/70 outline-none transition-colors hover:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            children: "[ ESC · X ]"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
            lineNumber: 270,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 263,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-2.5", children: [
        /* @__PURE__ */ jsxDEV("p", { className: "font-mono text-xs tracking-wider text-cyan-200", children: hotspot.label }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 281,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "mt-1.5 font-sans text-xs normal-case tracking-normal leading-relaxed text-zinc-300", children: hotspot.detail }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 282,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 280,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-3 flex items-center justify-between border-t border-cyan-400/20 pt-2 font-mono text-[9px] text-cyan-400/60", children: [
        /* @__PURE__ */ jsxDEV("span", { children: [
          "OCCURRENCE: ",
          hotspot.occurrence
        ] }, void 0, true, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 288,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-cyan-300/80", children: "SCROLL TO RESUME FLIGHT ▸" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
          lineNumber: 289,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
        lineNumber: 287,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
      lineNumber: 262,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx",
    lineNumber: 170,
    columnNumber: 5
  }, this);
}
_s(TechnicalHUD, "tFJiV+owuo9l51yCAQIV8136t0A=", false, function() {
  return [useScrollValue, useScrollValue, useScrollValue, useQuality];
});
_c = TechnicalHUD;
var _c;
$RefreshReg$(_c, "TechnicalHUD");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/TechnicalHUD.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QUFBQSxNQUVBLHVCQUFDLFNBQUksV0FBVSxVQUNiO0FBQUEsK0JBQUMsT0FBRSxXQUFVLGtEQUFrRDJELGtCQUFRSSxTQUF2RTtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQTZFO0FBQUEsUUFDN0UsdUJBQUMsT0FBRSxXQUFVLHNGQUNWSixrQkFBUWdCLFVBRFg7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUVBO0FBQUEsV0FKRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBS0E7QUFBQSxNQUVBLHVCQUFDLFNBQUksV0FBVSxpSEFDYjtBQUFBLCtCQUFDLFVBQUs7QUFBQTtBQUFBLFVBQWFoQixRQUFRaUI7QUFBQUEsYUFBM0I7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUFzQztBQUFBLFFBQ3RDLHVCQUFDLFVBQUssV0FBVSxvQkFBbUIseUNBQW5DO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBNEQ7QUFBQSxXQUY5RDtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBR0E7QUFBQSxTQTVCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBNkJBO0FBQUEsT0F6SEo7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQTJIQTtBQUVKO0FBQUMvRSxHQTlQZUQsY0FBWTtBQUFBLFVBQ1ZaLGdCQUNLQSxnQkFDSEEsZ0JBQ1FDLFVBQVU7QUFBQTtBQUFBLEtBSnRCVztBQUFZLElBQUFpRjtBQUFBLGFBQUFBLElBQUEiLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VMYXlvdXRFZmZlY3QiLCJ1c2VSZWYiLCJDSEFQVEVSUyIsIkhPVFNQT1RTIiwiTUFURVJJQUxfTU9ERV9MQUJFTFMiLCJjaGFyYWN0ZXJpc3RpY0tleSIsIkdkdFN5bWJvbCIsImdldFNjcm9sbFN0YXRlIiwibmF2aWdhdGVUb1N0YXRpb24iLCJzZXRTY3JvbGxTdGF0ZSIsIlNQQVRJQUxfU1RBVElPTlMiLCJ0ZWxlbWV0cnkiLCJ1c2VTY3JvbGxWYWx1ZSIsInVzZVF1YWxpdHkiLCJNT0RFUyIsImhvdHNwb3RMYXllckVsZW1lbnQiLCJnZXRIb3RzcG90TGF5ZXJQb3J0YWwiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJkYXRhc2V0IiwiamcwMzZIb3RzcG90TGF5ZXIiLCJzdHlsZSIsImNzc1RleHQiLCJjdXJyZW50IiwiVGVjaG5pY2FsSFVEIiwiX3MiLCJjaGFwdGVyIiwibWF0ZXJpYWxNb2RlIiwiaG90c3BvdElkIiwicmVkdWNlZE1vdGlvbiIsIm9uV2hlZWwiLCJlIiwiTWF0aCIsImFicyIsImRlbHRhWSIsImRlbHRhWCIsInRvdWNoU3RhcnRZIiwidG91Y2hTdGFydFgiLCJvblRvdWNoU3RhcnQiLCJ0b3VjaGVzIiwiY2xpZW50WSIsImNsaWVudFgiLCJvblRvdWNoTW92ZSIsImR5IiwiZHgiLCJvbktleURvd24iLCJldmVudCIsImtleSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJwYXNzaXZlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsInRhcmdldCIsImlzSW5wdXQiLCJ0YWdOYW1lIiwicHJvZ3Jlc3NSZWYiLCJkYXR1bUNvb3Jkc1JlZiIsIm1vZGVDb250cm9sc1JlZiIsImNocm9tZVJlZiIsImhvdHNwb3RMYXllckhvc3RSZWYiLCJob3N0IiwibGF5ZXIiLCJhcHBlbmRDaGlsZCIsInBhcmVudEVsZW1lbnQiLCJyZW1vdmVDaGlsZCIsImZyYW1lIiwidGljayIsInByb2dyZXNzIiwidmlzaWJpbGl0eSIsImsiLCJtaW4iLCJtYXgiLCJvcGFjaXR5IiwiU3RyaW5nIiwidGV4dENvbnRlbnQiLCJyb3VuZCIsInBhZFN0YXJ0IiwiY2FtIiwiY2FtZXJhIiwieCIsInRvRml4ZWQiLCJ5IiwieiIsImZvdiIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiY2hhcHRlckRlZiIsImhvdHNwb3QiLCJmaW5kIiwiZGVmIiwiaWQiLCJsYWJlbCIsImNhbGxvdXRzIiwibWFwIiwiY2FsbG91dCIsIndvcmRNYXRjaCIsIm1hdGNoIiwiZGF0dW0iLCJzdCIsIm5hbWUiLCJpbmRleCIsIm1vZGUiLCJraW5kIiwiZGV0YWlsIiwib2NjdXJyZW5jZSIsIl9jIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlRlY2huaWNhbEhVRC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VMYXlvdXRFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0J1xyXG5pbXBvcnQgeyBDSEFQVEVSUywgSE9UU1BPVFMsIE1BVEVSSUFMX01PREVfTEFCRUxTIH0gZnJvbSAnLi4vZGF0YS9jYXNlU3R1ZGllcydcclxuaW1wb3J0IHsgY2hhcmFjdGVyaXN0aWNLZXksIEdkdFN5bWJvbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvR2R0U3ltYm9scydcclxuaW1wb3J0IHsgZ2V0U2Nyb2xsU3RhdGUsIG5hdmlnYXRlVG9TdGF0aW9uLCBzZXRTY3JvbGxTdGF0ZSwgU1BBVElBTF9TVEFUSU9OUywgdGVsZW1ldHJ5LCB1c2VTY3JvbGxWYWx1ZSB9IGZyb20gJy4uL3N0YXRlL3Njcm9sbFN0b3JlJ1xyXG5pbXBvcnQgeyB1c2VRdWFsaXR5IH0gZnJvbSAnLi4vc3RhdGUvcXVhbGl0eVN0b3JlJ1xyXG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsTW9kZSB9IGZyb20gJy4uL3R5cGVzL3BvcnRmb2xpbydcclxuXHJcbmNvbnN0IE1PREVTOiBNYXRlcmlhbE1vZGVbXSA9IFsnc29saWQnLCAnYmx1ZXByaW50JywgJ2V4cGxvZGVkJ11cclxuXHJcbi8vIENyZWF0ZWQgbGF6aWx5IHNvIGltcG9ydGluZyB0aGlzIG1vZHVsZSBmcm9tIE5vZGUvU1NSIG5ldmVyIHRvdWNoZXMgYGRvY3VtZW50YC5cclxuLy8gVGhlIGVsZW1lbnQgaXMgc3RhYmxlIG9uY2UgY3JlYXRlZDsgYXR0YWNoaW5nIGl0IHRvIHRoZSBob3N0IGJlbG93IGFsc28gbW92ZXNcclxuLy8gYW55IGJhZGdlIHdyYXBwZXJzIERyZWkgYXR0YWNoZWQgYmVmb3JlIHRoZSBob3N0IGNvbW1pdHRlZC5cclxubGV0IGhvdHNwb3RMYXllckVsZW1lbnQ6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGxcclxuXHJcbi8qKlxyXG4gKiBKRy0wMzYga2VlcGVyIGxheWVyLiBCYWRnZXMgc2hhcmUgdGhlIEhVRCdzIHotMjAgc3RhY2tpbmcgY29udGV4dCB3aXRob3V0XHJcbiAqIHByb21vdGluZyB0aGUgV2ViR0wgY2FudmFzIG9yIGFkZGluZyBhIGZ1bGwtc2NyZWVuIHBvaW50ZXIgdGFyZ2V0LlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGdldEhvdHNwb3RMYXllclBvcnRhbCA9ICgpOiB7IGN1cnJlbnQ6IEhUTUxEaXZFbGVtZW50IH0gfCBudWxsID0+IHtcclxuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykgcmV0dXJuIG51bGxcclxuICBob3RzcG90TGF5ZXJFbGVtZW50ID8/PSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gIGhvdHNwb3RMYXllckVsZW1lbnQuZGF0YXNldC5qZzAzNkhvdHNwb3RMYXllciA9ICcnXHJcbiAgaG90c3BvdExheWVyRWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOmFic29sdXRlO2luc2V0OjA7cG9pbnRlci1ldmVudHM6bm9uZTsnXHJcbiAgcmV0dXJuIHsgY3VycmVudDogaG90c3BvdExheWVyRWxlbWVudCB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgNCDigJQgZmxvYXRpbmcgdGVsZW1ldHJ5IEhVRCAmIENvbnRpbnVvdXMgU2Nyb2xsLXRvLVJlbGVhc2UgVVguXHJcbiAqXHJcbiAqIENoYXB0ZXIgbGFiZWwsIG1hdGVyaWFsLW1vZGUgc3dpdGNoZXIgYW5kIGhvdHNwb3QgcGFuZWwgYXJlIFJlYWN0LWRyaXZlblxyXG4gKiAodGhleSBjaGFuZ2UgcmFyZWx5KS4gVGhlIDYwIGZwcyByZWFkb3V0cyDigJQgc2Nyb2xsICUsIGNhbWVyYSBkYXR1bVxyXG4gKiBjb29yZGluYXRlcyDigJQgYXJlIHdyaXR0ZW4gc3RyYWlnaHQgaW50byB0aGUgRE9NIGZyb20gYSByQUYgbG9vcCBzbyB0aGUgSFVEXHJcbiAqIG5ldmVyIHJlLXJlbmRlcnMgcGVyIGZyYW1lLlxyXG4gKlxyXG4gKiBDb250aW51b3VzIFNjcm9sbCBVWDpcclxuICogV2hlbiBhIHZpc2l0b3IgaW5zcGVjdHMgYSBzdWJhc3NlbWJseSwgYW55IG1vdXNlIHdoZWVsIG1vdmVtZW50LCB0b3VjaCBkcmFnLFxyXG4gKiBvciBzY3JvbGwgbmF2aWdhdGlvbiBhdXRvbWF0aWNhbGx5IGFuZCBzZWFtbGVzc2x5IHJlbGVhc2VzIGluc3BlY3QgZm9jdXMsXHJcbiAqIHNtb290aGx5IHJldHVybmluZyB0aGUgdmlzaXRvciB0byB0aGUgc2Nyb2xseXRlbGxpbmcgcGF0aCB3aXRob3V0IHRyYXBwaW5nXHJcbiAqIHRoZW0gYmVoaW5kIGEgbW9kYWwgb3IgbWFuZGF0b3J5IGNsb3NlIGJ1dHRvbi5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBUZWNobmljYWxIVUQoKSB7XHJcbiAgY29uc3QgY2hhcHRlciA9IHVzZVNjcm9sbFZhbHVlKCdjaGFwdGVyJylcclxuICBjb25zdCBtYXRlcmlhbE1vZGUgPSB1c2VTY3JvbGxWYWx1ZSgnbWF0ZXJpYWxNb2RlJylcclxuICBjb25zdCBob3RzcG90SWQgPSB1c2VTY3JvbGxWYWx1ZSgnaG90c3BvdElkJylcclxuICBjb25zdCB7IHJlZHVjZWRNb3Rpb24gfSA9IHVzZVF1YWxpdHkoKVxyXG5cclxuICAvLyAxLiBDb250aW51b3VzIFNjcm9sbCBSZWxlYXNlOiB3aGVlbCwgdG91Y2ggZHJhZywgYW5kIEVzY2FwZSBzZWFtbGVzc2x5XHJcbiAgLy8gcmVsZWFzZSBpbnNwZWN0IG1vZGUgc28gdGhlIHVzZXIgaXMgbmV2ZXIgdHJhcHBlZCBiZWhpbmQgYW4gaW5zcGVjdCBvdmVybGF5LlxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBpZiAoIWhvdHNwb3RJZCkgcmV0dXJuXHJcblxyXG4gICAgY29uc3Qgb25XaGVlbCA9IChlOiBXaGVlbEV2ZW50KTogdm9pZCA9PiB7XHJcbiAgICAgIGlmIChNYXRoLmFicyhlLmRlbHRhWSkgPiAyIHx8IE1hdGguYWJzKGUuZGVsdGFYKSA+IDIpIHtcclxuICAgICAgICBzZXRTY3JvbGxTdGF0ZSh7IGhvdHNwb3RJZDogbnVsbCB9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHRvdWNoU3RhcnRZID0gMFxyXG4gICAgbGV0IHRvdWNoU3RhcnRYID0gMFxyXG4gICAgY29uc3Qgb25Ub3VjaFN0YXJ0ID0gKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IHtcclxuICAgICAgaWYgKGUudG91Y2hlc1swXSkge1xyXG4gICAgICAgIHRvdWNoU3RhcnRZID0gZS50b3VjaGVzWzBdLmNsaWVudFlcclxuICAgICAgICB0b3VjaFN0YXJ0WCA9IGUudG91Y2hlc1swXS5jbGllbnRYXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnN0IG9uVG91Y2hNb3ZlID0gKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IHtcclxuICAgICAgaWYgKGUudG91Y2hlc1swXSkge1xyXG4gICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMoZS50b3VjaGVzWzBdLmNsaWVudFkgLSB0b3VjaFN0YXJ0WSlcclxuICAgICAgICBjb25zdCBkeCA9IE1hdGguYWJzKGUudG91Y2hlc1swXS5jbGllbnRYIC0gdG91Y2hTdGFydFgpXHJcbiAgICAgICAgaWYgKGR5ID4gNiB8fCBkeCA+IDYpIHtcclxuICAgICAgICAgIHNldFNjcm9sbFN0YXRlKHsgaG90c3BvdElkOiBudWxsIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgb25LZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICBldmVudC5rZXkgPT09ICdFc2NhcGUnIHx8XHJcbiAgICAgICAgZXZlbnQua2V5ID09PSAnQXJyb3dEb3duJyB8fFxyXG4gICAgICAgIGV2ZW50LmtleSA9PT0gJ0Fycm93VXAnIHx8XHJcbiAgICAgICAgZXZlbnQua2V5ID09PSAnUGFnZURvd24nIHx8XHJcbiAgICAgICAgZXZlbnQua2V5ID09PSAnUGFnZVVwJ1xyXG4gICAgICApIHtcclxuICAgICAgICBzZXRTY3JvbGxTdGF0ZSh7IGhvdHNwb3RJZDogbnVsbCB9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbCwgeyBwYXNzaXZlOiB0cnVlIH0pXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgeyBwYXNzaXZlOiB0cnVlIH0pXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIHsgcGFzc2l2ZTogdHJ1ZSB9KVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pXHJcblxyXG4gICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbClcclxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQpXHJcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSlcclxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pXHJcbiAgICB9XHJcbiAgfSwgW2hvdHNwb3RJZF0pXHJcblxyXG4gIC8vIDIuIEdsb2JhbCBTdGF0aW9uIEtleWJvYXJkIE5hdmlnYXRpb24gKGtleXMgMSwgMiwgMylcclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3Qgb25LZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XHJcbiAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGxcclxuICAgICAgY29uc3QgaXNJbnB1dCA9IHRhcmdldD8udGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCB0YXJnZXQ/LnRhZ05hbWUgPT09ICdURVhUQVJFQSdcclxuICAgICAgaWYgKGlzSW5wdXQpIHJldHVyblxyXG5cclxuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJzEnKSB7XHJcbiAgICAgICAgbmF2aWdhdGVUb1N0YXRpb24oMClcclxuICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09ICcyJykge1xyXG4gICAgICAgIG5hdmlnYXRlVG9TdGF0aW9uKDEpXHJcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSAnMycpIHtcclxuICAgICAgICBuYXZpZ2F0ZVRvU3RhdGlvbigyKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pXHJcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pXHJcbiAgfSwgW10pXHJcblxyXG4gIGNvbnN0IHByb2dyZXNzUmVmID0gdXNlUmVmPEhUTUxTcGFuRWxlbWVudD4obnVsbClcclxuICBjb25zdCBkYXR1bUNvb3Jkc1JlZiA9IHVzZVJlZjxIVE1MU3BhbkVsZW1lbnQ+KG51bGwpXHJcbiAgY29uc3QgbW9kZUNvbnRyb2xzUmVmPXVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbClcclxuICBjb25zdCBjaHJvbWVSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpXHJcbiAgY29uc3QgaG90c3BvdExheWVySG9zdFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbClcclxuXHJcbiAgdXNlTGF5b3V0RWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IGhvc3QgPSBob3RzcG90TGF5ZXJIb3N0UmVmLmN1cnJlbnRcclxuICAgIGNvbnN0IGxheWVyID0gZ2V0SG90c3BvdExheWVyUG9ydGFsKCk/LmN1cnJlbnRcclxuICAgIGlmICghaG9zdCB8fCAhbGF5ZXIpIHJldHVyblxyXG4gICAgaG9zdC5hcHBlbmRDaGlsZChsYXllcilcclxuICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgIGlmIChsYXllci5wYXJlbnRFbGVtZW50ID09PSBob3N0KSBob3N0LnJlbW92ZUNoaWxkKGxheWVyKVxyXG4gICAgfVxyXG4gIH0sIFtdKVxyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgLy8gUmVkdWNlZCBtb3Rpb246IFNjcm9sbFJpZyBuZXZlciBtb3VudHMsIHNvIHNjcm9sbC9jYW1lcmEgdGVsZW1ldHJ5IGlzXHJcbiAgICAvLyBzdGF0aWMg4oCUIHNraXAgdGhlIHJBRiBsb29wIGVudGlyZWx5ICh0aGUgcmVhZG91dHMgYmVsb3cgYXJlIGhpZGRlbiB0b28pLlxyXG4gICAgaWYgKHJlZHVjZWRNb3Rpb24pIHJldHVyblxyXG5cclxuICAgIGxldCBmcmFtZSA9IDBcclxuICAgIGNvbnN0IHRpY2sgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgIGNvbnN0IHsgcHJvZ3Jlc3MgfSA9IGdldFNjcm9sbFN0YXRlKClcclxuICAgICAgaWYobW9kZUNvbnRyb2xzUmVmLmN1cnJlbnQpbW9kZUNvbnRyb2xzUmVmLmN1cnJlbnQuc3R5bGUudmlzaWJpbGl0eT1wcm9ncmVzczw9LjEyPydoaWRkZW4nOid2aXNpYmxlJ1xyXG4gICAgICAvLyBKRy0wMzU6IHRoZSBkcmFmdGluZy10YWJsZSBpbnRybyBpcyBhIHdhcm0sIHBoeXNpY2FsIHNjZW5lIOKAlCB0aGUgY3lhbiBpbnN0cnVtZW50XHJcbiAgICAgIC8vIGNocm9tZSBzdGF5cyBvdXQgb2YgaXQgYW5kIGZhZGVzIHVwIGFzIHRoZSBtb2RlbCB0YWtlcyBvdmVyIGF0IHRoZSBoYW5kb2ZmLlxyXG4gICAgICBpZiAoY2hyb21lUmVmLmN1cnJlbnQpIHtcclxuICAgICAgICBjb25zdCBrID0gTWF0aC5taW4oMSwgTWF0aC5tYXgoMCwgKHByb2dyZXNzIC0gMC4xMikgLyAwLjAxNSkpXG4gICAgICAgIGNocm9tZVJlZi5jdXJyZW50LnN0eWxlLm9wYWNpdHkgPSBTdHJpbmcoayAqIGsgKiAoMyAtIDIgKiBrKSlcclxuICAgICAgICBjaHJvbWVSZWYuY3VycmVudC5zdHlsZS52aXNpYmlsaXR5ID0gayA+IDAgPyAndmlzaWJsZScgOiAnaGlkZGVuJ1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwcm9ncmVzc1JlZi5jdXJyZW50KSB7XHJcbiAgICAgICAgcHJvZ3Jlc3NSZWYuY3VycmVudC50ZXh0Q29udGVudCA9IGBTQ1JPTEwgLy8gJHtTdHJpbmcoTWF0aC5yb3VuZChwcm9ncmVzcyAqIDEwMCkpLnBhZFN0YXJ0KDMsICcwJyl9JWBcclxuICAgICAgfVxyXG4gICAgICBpZiAoZGF0dW1Db29yZHNSZWYuY3VycmVudCkge1xyXG4gICAgICAgIGNvbnN0IGNhbSA9IHRlbGVtZXRyeS5jYW1lcmFcclxuICAgICAgICBkYXR1bUNvb3Jkc1JlZi5jdXJyZW50LnRleHRDb250ZW50ID0gYENBTSBbICR7Y2FtLngudG9GaXhlZCgzKX0gJHtjYW0ueS50b0ZpeGVkKDMpfSAke2NhbS56LnRvRml4ZWQoMyl9IF0gwrcgRk9WICR7Y2FtLmZvdi50b0ZpeGVkKDEpfcKwYFxyXG4gICAgICB9XHJcbiAgICAgIGZyYW1lID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spXHJcbiAgICB9XHJcbiAgICBmcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKVxyXG4gICAgcmV0dXJuICgpID0+IGNhbmNlbEFuaW1hdGlvbkZyYW1lKGZyYW1lKVxyXG4gIH0sIFtyZWR1Y2VkTW90aW9uXSlcclxuXHJcbiAgY29uc3QgY2hhcHRlckRlZiA9IENIQVBURVJTW2NoYXB0ZXJdID8/IENIQVBURVJTWzBdXHJcbiAgY29uc3QgaG90c3BvdCA9IEhPVFNQT1RTLmZpbmQoKGRlZikgPT4gZGVmLmlkID09PSBob3RzcG90SWQpID8/IG51bGxcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtbm9uZSBmaXhlZCBpbnNldC0wIHotMjAgc2VsZWN0LW5vbmUgZm9udC1tb25vIHRleHQtWzExcHhdIHRyYWNraW5nLXdpZGVzdCB0ZXh0LWN5YW4tMzAwLzkwXCI+XHJcbiAgICAgIDxkaXZcclxuICAgICAgICByZWY9e2hvdHNwb3RMYXllckhvc3RSZWZ9XHJcbiAgICAgICAgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtbm9uZSBhYnNvbHV0ZSBpbnNldC0wIHotMFwiXHJcbiAgICAgIC8+XHJcbiAgICAgIHsvKiBTY3JvbGwvY2hhcHRlciB0ZWxlbWV0cnkgb25seSBtYWtlcyBzZW5zZSB3aGVuIHRoZSBzY3JvbGwgcmlnIGlzXHJcbiAgICAgICAgICBsaXZlIOKAlCB1bmRlciByZWR1Y2VkIG1vdGlvbiB0aGUgY2hhcHRlciB0cmFja2VyIG5ldmVyIHJ1bnMsIHNvIHRoZXNlXHJcbiAgICAgICAgICB3b3VsZCBmcmVlemUgb24gc3RhbGUgdmFsdWVzLiBIaWRlIHRoZW07IGtlZXAgdGhlIG1vZGUgc3dpdGNoZXIuICovfVxyXG4gICAgICB7IXJlZHVjZWRNb3Rpb24gJiYgKFxyXG4gICAgICAgIDxkaXYgcmVmPXtjaHJvbWVSZWZ9IHN0eWxlPXt7IG9wYWNpdHk6IDAsIHZpc2liaWxpdHk6ICdoaWRkZW4nIH19PlxyXG4gICAgICAgICAgey8qIFRvcC1sZWZ0OiBjaGFwdGVyICsgc2Nyb2xsIHByb2dyZXNzICovfVxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTUgdG9wLTUgc3BhY2UteS0xXCI+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtY3lhbi0yMDBcIj57Y2hhcHRlckRlZi5sYWJlbH08L3A+XHJcbiAgICAgICAgICAgIDxwPlxyXG4gICAgICAgICAgICAgIDxzcGFuIHJlZj17cHJvZ3Jlc3NSZWZ9PlNDUk9MTCAvLyAwMDAlPC9zcGFuPlxyXG4gICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICB7LyogVG9wLXJpZ2h0OiBsaXZlIHRvbGVyYW5jZSBjYWxsb3V0cyArIGFjdGl2ZSBkYXR1bS4gQ2FsbG91dHMgbGVhZFxyXG4gICAgICAgICAgICAgIHdpdGggdGhlIFkxNC41IGNoYXJhY3RlcmlzdGljIHN5bWJvbCwgbm90IHRoZSBzcGVsbGVkLW91dCB3b3JkXHJcbiAgICAgICAgICAgICAgKEpHLTAyMSByZW1lZGlhdGlvbikg4oCUIHRoZSB3b3JkIHN0YXlzIGluIHRoZSB0aXRsZSB0b29sdGlwLiAqL31cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgcmlnaHQtNSB0b3AtNSBzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxyXG4gICAgICAgICAgICB7Y2hhcHRlckRlZi5jYWxsb3V0cy5tYXAoKGNhbGxvdXQpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCB3b3JkTWF0Y2ggPSBjYWxsb3V0Lm1hdGNoKC9eKFtBLVogXSs/KVxccyguKikkLylcclxuICAgICAgICAgICAgICBjb25zdCBrZXkgPSB3b3JkTWF0Y2ggPyBjaGFyYWN0ZXJpc3RpY0tleSh3b3JkTWF0Y2hbMV0pIDogbnVsbFxyXG4gICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICA8cCBrZXk9e2NhbGxvdXR9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktZW5kIGdhcC0xLjVcIiB0aXRsZT17Y2FsbG91dH0+XHJcbiAgICAgICAgICAgICAgICAgIHtrZXkgJiYgd29yZE1hdGNoID8gKFxyXG4gICAgICAgICAgICAgICAgICAgIDw+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8R2R0U3ltYm9sIG5hbWU9e3dvcmRNYXRjaFsxXX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPnt3b3JkTWF0Y2hbMl19PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvPlxyXG4gICAgICAgICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPntjYWxsb3V0fTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIH0pfVxyXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWN5YW4tMjAwXCI+REFUVU06IHtjaGFwdGVyRGVmLmRhdHVtfTwvcD5cclxuICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgIHsvKiBUb3AtY2VudGVyOiBzcGF0aWFsIHN0YXRpb24gbmF2aWdhdGlvbiAqL31cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtYXV0byBhYnNvbHV0ZSB0b3AtNSBsZWZ0LTEvMiB6LTEwIC10cmFuc2xhdGUteC0xLzIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBiZy1ibGFjay83MCBiYWNrZHJvcC1ibHVyLXNtIHB4LTIuNSBweS0xIGJvcmRlciBib3JkZXItY3lhbi05MDAvNjAgcm91bmRlZFwiPlxyXG4gICAgICAgICAgICB7U1BBVElBTF9TVEFUSU9OUy5tYXAoKHN0KSA9PiAoXHJcbiAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAga2V5PXtzdC5pZH1cclxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD17YE5hdmlnYXRlIHRvICR7c3QubGFiZWx9OiAke3N0Lm5hbWV9YH1cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG5hdmlnYXRlVG9TdGF0aW9uKHN0LmluZGV4KX1cclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGN1cnNvci1wb2ludGVyIHB4LTIgcHktMC41IHRleHQtWzEwcHhdIHRyYWNraW5nLXdpZGVzdCBvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1jb2xvcnMgcm91bmRlZCBmb2N1cy12aXNpYmxlOnJpbmctMiBmb2N1cy12aXNpYmxlOnJpbmctY3lhbi0zMDAgZm9jdXMtdmlzaWJsZTpyaW5nLW9mZnNldC0xIGZvY3VzLXZpc2libGU6cmluZy1vZmZzZXQtYmxhY2sgJHtcclxuICAgICAgICAgICAgICAgICAgKHN0LmluZGV4ID09PSAwICYmIChjaGFwdGVyID09PSAwIHx8IGNoYXB0ZXIgPT09IDEpKSB8fFxyXG4gICAgICAgICAgICAgICAgICAoc3QuaW5kZXggPT09IDEgJiYgY2hhcHRlciA9PT0gMikgfHxcclxuICAgICAgICAgICAgICAgICAgKHN0LmluZGV4ID09PSAyICYmIGNoYXB0ZXIgPT09IDMpXHJcbiAgICAgICAgICAgICAgICAgICAgPyAnYmctY3lhbi00MDAvMjAgdGV4dC1jeWFuLTIwMCBib3JkZXIgYm9yZGVyLWN5YW4tNDAwLzUwJ1xyXG4gICAgICAgICAgICAgICAgICAgIDogJ3RleHQtY3lhbi00MDAvNjAgaG92ZXI6dGV4dC1jeWFuLTIwMCBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50J1xyXG4gICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge3N0LmxhYmVsfVxyXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICApKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgIHsvKiBCb3R0b20tbGVmdDogY2FtZXJhIHRlbGVtZXRyeSAoZGF0dW0gY29vcmRpbmF0ZXMpICovfVxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBib3R0b20tNSBsZWZ0LTVcIj5cclxuICAgICAgICAgICAgPHA+XHJcbiAgICAgICAgICAgICAgPHNwYW4gcmVmPXtkYXR1bUNvb3Jkc1JlZn0+Q0FNIFsgMC4wMDAgMC4wMDAgMC4wMDAgXTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7LyogQm90dG9tLXJpZ2h0OiBtYXRlcmlhbCBtb2RlIHN3aXRjaGVyICovfVxyXG4gICAgICA8ZGl2IHJlZj17bW9kZUNvbnRyb2xzUmVmfSBzdHlsZT17e3Zpc2liaWxpdHk6J2hpZGRlbid9fSBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1hdXRvIGFic29sdXRlIGJvdHRvbS01IHJpZ2h0LTUgei0xMCBmbGV4IGZsZXgtY29sIGl0ZW1zLWVuZCBnYXAtMVwiPlxyXG4gICAgICAgIHtNT0RFUy5tYXAoKG1vZGUpID0+IChcclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAga2V5PXttb2RlfVxyXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgYXJpYS1wcmVzc2VkPXttYXRlcmlhbE1vZGUgPT09IG1vZGV9XHJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNjcm9sbFN0YXRlKHsgbWF0ZXJpYWxNb2RlOiBtb2RlIH0pfVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BjdXJzb3ItcG9pbnRlciBweC0yIHB5LTEgb3V0bGluZS1ub25lIHRyYW5zaXRpb24tY29sb3JzIGZvY3VzLXZpc2libGU6cmluZy0yIGZvY3VzLXZpc2libGU6cmluZy1jeWFuLTMwMCBmb2N1cy12aXNpYmxlOnJpbmctb2Zmc2V0LTIgZm9jdXMtdmlzaWJsZTpyaW5nLW9mZnNldC1ibGFjayAke1xyXG4gICAgICAgICAgICAgIG1hdGVyaWFsTW9kZSA9PT0gbW9kZVxyXG4gICAgICAgICAgICAgICAgPyAnYmctY3lhbi0zMDAvMjAgdGV4dC1jeWFuLTEwMCByaW5nLTEgcmluZy1jeWFuLTQwMC80MCdcclxuICAgICAgICAgICAgICAgIDogJ3RleHQtY3lhbi00MDAvNzAgaG92ZXI6dGV4dC1jeWFuLTIwMCdcclxuICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIHtNQVRFUklBTF9NT0RFX0xBQkVMU1ttb2RlXX1cclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICkpfVxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBCb3R0b20tY2VudGVyOiBzZWxlY3RlZCBob3RzcG90IGRldGFpbCBjYXJkIHdpdGggY29udGludW91cyBzY3JvbGwgaGludCAqL31cclxuICAgICAge2hvdHNwb3QgJiYgKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtYXV0byBhYnNvbHV0ZSBib3R0b20tNiBsZWZ0LTEvMiB6LTEwIHctW21pbigzMHJlbSw4OHZ3KV0gLXRyYW5zbGF0ZS14LTEvMiBib3JkZXIgYm9yZGVyLWN5YW4tNDAwLzUwIGJnLWJsYWNrLzg1IHAtNCBzaGFkb3ctWzBfMF8yNXB4X3JnYmEoMCwyMjksMjU1LDAuMjUpXSBiYWNrZHJvcC1ibHVyLW1kXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC00IGJvcmRlci1iIGJvcmRlci1jeWFuLTQwMC8zMCBwYi0yLjVcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImlubGluZS1ibG9jayBoLTIgdy0yIHJvdW5kZWQtZnVsbCBiZy1jeWFuLTQwMCBzaGFkb3ctWzBfMF84cHhfIzAwZTVmZl0gYW5pbWF0ZS1wdWxzZVwiIC8+XHJcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWN5YW4tMTAwXCI+XHJcbiAgICAgICAgICAgICAgICB7aG90c3BvdC5raW5kID09PSAnaW5zcGVjdCcgPyAn4peJIFNVQkFTU0VNQkxZIElOU1BFQ1RJT04nIDogJ+KXjiBHRCZUIERBVFVNIFJFRkVSRU5DRSd9XHJcbiAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJDbG9zZSBob3RzcG90IGRldGFpbFwiXHJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2Nyb2xsU3RhdGUoeyBob3RzcG90SWQ6IG51bGwgfSl9XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY3Vyc29yLXBvaW50ZXIgZm9udC1tb25vIHRleHQtY3lhbi00MDAvNzAgb3V0bGluZS1ub25lIHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOnRleHQtY3lhbi0xMDAgZm9jdXMtdmlzaWJsZTpyaW5nLTIgZm9jdXMtdmlzaWJsZTpyaW5nLWN5YW4tMzAwIGZvY3VzLXZpc2libGU6cmluZy1vZmZzZXQtMiBmb2N1cy12aXNpYmxlOnJpbmctb2Zmc2V0LWJsYWNrXCJcclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIFsgRVNDIMK3IFggXVxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMi41XCI+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbW9ubyB0ZXh0LXhzIHRyYWNraW5nLXdpZGVyIHRleHQtY3lhbi0yMDBcIj57aG90c3BvdC5sYWJlbH08L3A+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTEuNSBmb250LXNhbnMgdGV4dC14cyBub3JtYWwtY2FzZSB0cmFja2luZy1ub3JtYWwgbGVhZGluZy1yZWxheGVkIHRleHQtemluYy0zMDBcIj5cclxuICAgICAgICAgICAgICB7aG90c3BvdC5kZXRhaWx9XHJcbiAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLXQgYm9yZGVyLWN5YW4tNDAwLzIwIHB0LTIgZm9udC1tb25vIHRleHQtWzlweF0gdGV4dC1jeWFuLTQwMC82MFwiPlxyXG4gICAgICAgICAgICA8c3Bhbj5PQ0NVUlJFTkNFOiB7aG90c3BvdC5vY2N1cnJlbmNlfTwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1jeWFuLTMwMC84MFwiPlNDUk9MTCBUTyBSRVNVTUUgRkxJR0hUIOKWuDwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApfVxyXG4gICAgPC9kaXY+XHJcbiAgKVxyXG59XHJcbiJdLCJmaWxlIjoiQzovVXNlcnMvTWFya2ltdXMvLmJ1enovUkVQT1Mvamd1bi1wb3J0Zm9saW8vc3JjL2NvbXBvbmVudHMvVGVjaG5pY2FsSFVELnRzeCJ9