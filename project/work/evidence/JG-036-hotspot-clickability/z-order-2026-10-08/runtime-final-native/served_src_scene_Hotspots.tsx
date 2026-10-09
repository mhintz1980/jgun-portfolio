import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/scene/Hotspots.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=0ce3f7a6"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$(), _s2 = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=0ce3f7a6"; const useEffect = __vite__cjsImport1_react["useEffect"]; const useMemo = __vite__cjsImport1_react["useMemo"]; const useRef = __vite__cjsImport1_react["useRef"]; const useState = __vite__cjsImport1_react["useState"];
import { Html } from "/node_modules/.vite/deps/@react-three_drei.js?v=0389c4f2";
import { useFrame, useThree } from "/node_modules/.vite/deps/@react-three_fiber.js?v=c8d145e3";
import { Vector3 } from "/node_modules/.vite/deps/three.js?v=f13af4f6";
import { characteristicKey, GdtSymbol } from "/src/components/GdtSymbols.tsx";
import { ACTIVE_HOTSPOT_IDS, EXPLODE_OFFSETS, HOTSPOTS } from "/src/data/caseStudies.ts";
import { getHotspotLayerPortal } from "/src/components/TechnicalHUD.tsx";
import { setScrollState, telemetry, useScrollValue } from "/src/state/scrollStore.ts";
const _worldPos = new Vector3();
const _proj = new Vector3();
const _placedBadges = /* @__PURE__ */ new Map();
let _badgeFrameEpoch = -1;
const HANDLE_UNIT_OFFSET = EXPLODE_OFFSETS.handle;
const HOTSPOT_CONFIG = {
  rotor: { dx: 220, dy: -100, unitOffset: HANDLE_UNIT_OFFSET, offset: [0, 0, -0.0315] },
  "motor-housing": { dx: 220, dy: 70, unitOffset: HANDLE_UNIT_OFFSET, offset: [0, 0, -0.019] },
  flange: { dx: 220, dy: -130, unitOffset: HANDLE_UNIT_OFFSET, offset: [0, 0.028, 0] },
  "gearbox-housing": { dx: 220, dy: 90, unitOffset: 0, offset: [0, 0.032, 0] },
  mcu: { dx: -220, dy: -90, unitOffset: HANDLE_UNIT_OFFSET, offset: [-3e-3, 0, 2e-3] },
  lcd: { dx: 200, dy: -100, unitOffset: HANDLE_UNIT_OFFSET, offset: [-3e-3, 0, -6e-3] },
  lipo: { dx: -220, dy: 90, unitOffset: HANDLE_UNIT_OFFSET, offset: [3e-3, 0, 4e-3] }
};
export function HotspotButton({
  def,
  selected,
  style,
  onMouseEnter,
  onMouseLeave,
  tone = "full"
}) {
  const datumLetter = def.annotation?.datum;
  const frame = def.annotation?.frame;
  const processNote = def.annotation?.processNote;
  const dim = tone === "dim";
  return /* @__PURE__ */ jsxDEV(
    "button",
    {
      type: "button",
      "aria-pressed": selected,
      "aria-label": `${def.label} · ${def.detail}`,
      onClick: () => setScrollState({ hotspotId: selected ? null : def.id }),
      onMouseEnter,
      onMouseLeave,
      style,
      className: `group pointer-events-auto cursor-pointer select-none max-w-[calc(100vw-32px)] md:max-w-none border px-2.5 py-1.5 font-mono text-[10px] tracking-widest outline-none backdrop-blur-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${selected ? "border-cyan-300 bg-cyan-950/95 text-cyan-100 shadow-[0_0_20px_rgba(0,229,255,0.5)] ring-1 ring-cyan-400/60" : dim ? "border-cyan-400/35 bg-black/70 text-cyan-300/70 hover:border-cyan-300 hover:bg-black/95 hover:text-cyan-100" : "border-cyan-400/60 bg-black/85 text-cyan-300 hover:border-cyan-300 hover:bg-black/95 hover:text-cyan-100 hover:shadow-[0_0_15px_rgba(0,229,255,0.35)]"}`,
      children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 overflow-hidden", children: [
        /* @__PURE__ */ jsxDEV(
          "span",
          {
            className: `inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-200 ${selected ? "bg-cyan-300 shadow-[0_0_8px_#00e5ff] ring-2 ring-cyan-400/50" : dim ? "bg-cyan-400/45 group-hover:bg-cyan-300" : "bg-cyan-400/70 group-hover:bg-cyan-300"}`
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 87,
            columnNumber: 9
          },
          this
        ),
        datumLetter && /* @__PURE__ */ jsxDEV(
          "span",
          {
            className: `inline-flex h-5 min-w-[22px] shrink-0 items-center justify-center border px-1 font-mono text-[11px] font-bold text-cyan-100 ${dim ? "border-cyan-300/60 bg-cyan-950/60" : "border-cyan-300 bg-cyan-950/80 shadow-[0_0_8px_rgba(0,229,255,0.4)]"}`,
            children: [
              "-",
              datumLetter,
              "-"
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 99,
            columnNumber: 9
          },
          this
        ),
        frame ? /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `inline-flex shrink-0 items-center border text-cyan-100 ${dim ? "border-cyan-300/45 bg-cyan-950/25" : "border-cyan-300/90 bg-cyan-950/40"}`,
            children: [
              frame.characteristic && /* @__PURE__ */ jsxDEV(
                "span",
                {
                  className: `flex h-5 items-center justify-center border-r px-1.5 font-mono text-[10px] font-semibold ${dim ? "border-cyan-300/40" : "border-cyan-300/70"}`,
                  title: frame.characteristic,
                  children: characteristicKey(frame.characteristic) ? /* @__PURE__ */ jsxDEV(GdtSymbol, { name: frame.characteristic }, void 0, false, {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                    lineNumber: 126,
                    columnNumber: 13
                  }, this) : frame.characteristic
                },
                void 0,
                false,
                {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                  lineNumber: 119,
                  columnNumber: 11
                },
                this
              ),
              frame.cells.map(
                (cell, idx) => /* @__PURE__ */ jsxDEV(
                  "span",
                  {
                    className: `flex h-5 items-center justify-center border-r px-1.5 font-mono text-[10px] font-semibold last:border-r-0 ${dim ? "border-cyan-300/40" : "border-cyan-300/70"}`,
                    children: cell
                  },
                  `${cell}-${idx}`,
                  false,
                  {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                    lineNumber: 133,
                    columnNumber: 11
                  },
                  this
                )
              )
            ]
          },
          void 0,
          true,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 113,
            columnNumber: 9
          },
          this
        ) : null,
        /* @__PURE__ */ jsxDEV("span", { className: `truncate font-semibold tracking-wider ${dim ? "text-cyan-100/70" : "text-cyan-100/95"}`, children: def.label }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
          lineNumber: 146,
          columnNumber: 9
        }, this),
        processNote && !frame && !datumLetter && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("span", { className: "hidden text-cyan-400/40 sm:inline", children: "·" }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 153,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: `hidden text-[9px] sm:inline ${dim ? "text-cyan-300/45" : "text-cyan-300/70"}`, children: processNote }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 154,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
          lineNumber: 152,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
        lineNumber: 86,
        columnNumber: 7
      }, this)
    },
    void 0,
    false,
    {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
      lineNumber: 70,
      columnNumber: 5
    },
    this
  );
}
_c = HotspotButton;
export function SpatialLeaderLine({
  dx,
  dy,
  selected,
  hovered
}) {
  const isRight = dx > 0;
  const elbowX = dx * 0.45;
  const shelfLength = 60;
  const shelfEndX = isRight ? dx + shelfLength : dx - shelfLength;
  const active = selected || hovered;
  const strokeColor = active ? "#00e5ff" : "rgba(34, 211, 238, 0.65)";
  const strokeWidth = active ? 1.5 : 1.1;
  return /* @__PURE__ */ jsxDEV(
    "svg",
    {
      "aria-hidden": "true",
      className: "pointer-events-none absolute left-0 top-0 overflow-visible",
      style: { width: 1, height: 1 },
      children: [
        /* @__PURE__ */ jsxDEV("defs", { children: /* @__PURE__ */ jsxDEV("filter", { id: `glow-${dx}-${dy}`, x: "-30%", y: "-30%", width: "160%", height: "160%", children: /* @__PURE__ */ jsxDEV("feDropShadow", { dx: "0", dy: "0", stdDeviation: "3", floodColor: "#00e5ff", floodOpacity: "0.75" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
          lineNumber: 195,
          columnNumber: 11
        }, this) }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
          lineNumber: 194,
          columnNumber: 9
        }, this) }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
          lineNumber: 193,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV("g", { children: [
          /* @__PURE__ */ jsxDEV("line", { x1: "-8", y1: "0", x2: "8", y2: "0", stroke: strokeColor, strokeWidth: "1" }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 200,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ jsxDEV("line", { x1: "0", y1: "-8", x2: "0", y2: "8", stroke: strokeColor, strokeWidth: "1" }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 201,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: "2", fill: active ? "#00e5ff" : "#38bdf8" }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 202,
            columnNumber: 9
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
          lineNumber: 199,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV(
          "path",
          {
            d: `M 0 0 L ${elbowX} ${dy} L ${shelfEndX} ${dy}`,
            fill: "none",
            stroke: strokeColor,
            strokeWidth,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            filter: active ? `url(#glow-${dx}-${dy})` : void 0,
            className: active ? "leader-line-flow" : void 0
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 205,
            columnNumber: 7
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "line",
          {
            x1: dx,
            y1: dy - 6,
            x2: dx,
            y2: dy + 6,
            stroke: strokeColor,
            strokeWidth: strokeWidth + 0.5,
            opacity: active ? "1" : "0.75"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 216,
            columnNumber: 7
          },
          this
        )
      ]
    },
    void 0,
    true,
    {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
      lineNumber: 188,
      columnNumber: 5
    },
    this
  );
}
_c2 = SpatialLeaderLine;
export function SpatialHotspotAnchor({
  def,
  selected,
  position = [0, 0, 0],
  anchorOffset = [0, 0, 0],
  unitOffset = 0,
  visible = true,
  nominalDx,
  nominalDy,
  tone = "full"
}) {
  _s();
  const groupRef = useRef(null);
  const containerRef = useRef(null);
  const badgeWrapperRef = useRef(null);
  const buttonContainerRef = useRef(null);
  const pathRef = useRef(null);
  const tickRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const hotspotPortal = useMemo(() => getHotspotLayerPortal(), []);
  const { camera, size } = useThree();
  useFrame((frameState) => {
    if (!groupRef.current || !containerRef.current || !badgeWrapperRef.current || !buttonContainerRef.current) return;
    if (frameState.clock.elapsedTime !== _badgeFrameEpoch) {
      _badgeFrameEpoch = frameState.clock.elapsedTime;
      _placedBadges.clear();
    }
    if (!visible) {
      containerRef.current.style.display = "none";
      return;
    }
    const explode = telemetry.rig.explodeFactor;
    const offsetZ = unitOffset * explode;
    groupRef.current.position.set(
      position[0] + anchorOffset[0],
      position[1] + anchorOffset[1],
      position[2] + anchorOffset[2] + offsetZ
    );
    groupRef.current.getWorldPosition(_worldPos);
    _proj.copy(_worldPos).project(camera);
    if (_proj.z < -1 || _proj.z > 1 || _proj.x < -1.3 || _proj.x > 1.3 || _proj.y < -1.3 || _proj.y > 1.3) {
      containerRef.current.style.display = "none";
      return;
    }
    containerRef.current.style.display = "block";
    const ax = (_proj.x * 0.5 + 0.5) * size.width;
    const ay = (-_proj.y * 0.5 + 0.5) * size.height;
    const isMobile = size.width <= 768;
    const safeLeft = isMobile ? 12 : 24;
    const safeRight = size.width - (isMobile ? 12 : 24);
    const safeTop = isMobile ? 80 : 60;
    const safeBottom = size.height - (isMobile ? 70 : 60);
    const badgeW = buttonContainerRef.current?.offsetWidth || (isMobile ? 220 : 380);
    const badgeH = buttonContainerRef.current?.offsetHeight || 32;
    let isRight = nominalDx !== void 0 ? nominalDx > 0 : ax < size.width * 0.5;
    if (nominalDx === void 0) {
      if (isRight && ax + 25 + badgeW > safeRight && ax - 25 - badgeW >= safeLeft) {
        isRight = false;
      } else if (!isRight && ax - 25 - badgeW < safeLeft && ax + 25 + badgeW <= safeRight) {
        isRight = true;
      }
    }
    const spanX = isMobile ? 20 : nominalDx ? Math.abs(nominalDx) : 150;
    let bx = isRight ? ax + spanX : ax - spanX;
    if (isRight) {
      bx = Math.max(safeLeft, Math.min(bx, safeRight - badgeW));
    } else {
      bx = Math.min(safeRight, Math.max(bx, safeLeft + badgeW));
    }
    const spanY = nominalDy !== void 0 ? nominalDy : ay > size.height * 0.5 ? -60 : 60;
    let by = ay + spanY;
    by = Math.max(safeTop, Math.min(by, safeBottom - badgeH));
    const renderX = isRight ? bx : bx - badgeW;
    let stacking = true;
    let guard = 0;
    while (stacking && guard++ < 12) {
      stacking = false;
      for (const [key, rect] of _placedBadges) {
        if (key === def.id) continue;
        const overlaps = renderX < rect.x + rect.w - 4 && rect.x < renderX + badgeW - 4 && by - 14 < rect.y + rect.h + 6 && rect.y < by - 14 + badgeH + 6;
        if (overlaps) {
          by = rect.y + 14 + rect.h + 6;
          stacking = true;
        }
      }
      by = Math.min(by, safeBottom - badgeH);
    }
    _placedBadges.set(def.id, { x: renderX, y: by - 14, w: badgeW, h: badgeH });
    const dx = bx - ax;
    const dy = by - ay;
    const elbowX = dx * 0.45;
    const shelfLength = Math.min(60, Math.max(20, Math.abs(dx) * 0.35));
    const shelfEndX = isRight ? dx + shelfLength : dx - shelfLength;
    if (pathRef.current) {
      pathRef.current.setAttribute("d", `M 0 0 L ${elbowX} ${dy} L ${shelfEndX} ${dy}`);
    }
    if (tickRef.current) {
      tickRef.current.setAttribute("x1", `${dx}`);
      tickRef.current.setAttribute("x2", `${dx}`);
      tickRef.current.setAttribute("y1", `${dy - 6}`);
      tickRef.current.setAttribute("y2", `${dy + 6}`);
    }
    badgeWrapperRef.current.style.transform = `translate3d(${dx}px, ${dy - 14}px, 0)`;
    badgeWrapperRef.current.style.transformOrigin = isRight ? "left center" : "right center";
    buttonContainerRef.current.style.transform = isRight ? "none" : "translateX(-100%)";
    buttonContainerRef.current.style.transformOrigin = isRight ? "left center" : "right center";
  });
  const active = selected || hovered;
  const dim = tone === "dim";
  const strokeColor = active ? "#00e5ff" : dim ? "rgba(34, 211, 238, 0.32)" : "rgba(34, 211, 238, 0.65)";
  const strokeWidth = active ? 1.5 : dim ? 0.9 : 1.1;
  const restTickOpacity = dim ? "0.4" : "0.75";
  return /* @__PURE__ */ jsxDEV(
    "group",
    {
      ref: groupRef,
      position: [
        position[0] + anchorOffset[0],
        position[1] + anchorOffset[1],
        position[2] + anchorOffset[2]
      ],
      children: /* @__PURE__ */ jsxDEV(
        Html,
        {
          center: false,
          portal: hotspotPortal ?? void 0,
          zIndexRange: [40, 0],
          style: { pointerEvents: "none" },
          children: /* @__PURE__ */ jsxDEV("div", { ref: containerRef, className: "relative", children: [
            /* @__PURE__ */ jsxDEV(
              "svg",
              {
                "aria-hidden": "true",
                className: "pointer-events-none absolute left-0 top-0 overflow-visible",
                style: { width: 1, height: 1 },
                children: [
                  /* @__PURE__ */ jsxDEV("g", { children: [
                    /* @__PURE__ */ jsxDEV("line", { x1: "-8", y1: "0", x2: "8", y2: "0", stroke: strokeColor, strokeWidth: "1" }, void 0, false, {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                      lineNumber: 435,
                      columnNumber: 15
                    }, this),
                    /* @__PURE__ */ jsxDEV("line", { x1: "0", y1: "-8", x2: "0", y2: "8", stroke: strokeColor, strokeWidth: "1" }, void 0, false, {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                      lineNumber: 436,
                      columnNumber: 15
                    }, this),
                    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: "2", fill: active ? "#00e5ff" : "#38bdf8" }, void 0, false, {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                      lineNumber: 437,
                      columnNumber: 15
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                    lineNumber: 434,
                    columnNumber: 13
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "path",
                    {
                      ref: pathRef,
                      d: "M 0 0 L 60 -40 L 100 -40",
                      fill: "none",
                      stroke: strokeColor,
                      strokeWidth,
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      className: active ? "leader-line-flow" : void 0
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                      lineNumber: 439,
                      columnNumber: 13
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "line",
                    {
                      ref: tickRef,
                      x1: "100",
                      y1: "-46",
                      x2: "100",
                      y2: "-34",
                      stroke: strokeColor,
                      strokeWidth: strokeWidth + 0.5,
                      opacity: active ? "1" : restTickOpacity
                    },
                    void 0,
                    false,
                    {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                      lineNumber: 449,
                      columnNumber: 13
                    },
                    this
                  )
                ]
              },
              void 0,
              true,
              {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                lineNumber: 429,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                ref: badgeWrapperRef,
                style: {
                  position: "absolute",
                  left: "0px",
                  top: "0px",
                  transform: "translate3d(120px, -40px, 0)"
                },
                children: /* @__PURE__ */ jsxDEV("div", { ref: buttonContainerRef, children: /* @__PURE__ */ jsxDEV(
                  HotspotButton,
                  {
                    def,
                    selected,
                    onMouseEnter: () => setHovered(true),
                    onMouseLeave: () => setHovered(false),
                    tone
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                    lineNumber: 472,
                    columnNumber: 15
                  },
                  this
                ) }, void 0, false, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                  lineNumber: 471,
                  columnNumber: 13
                }, this)
              },
              void 0,
              false,
              {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
                lineNumber: 462,
                columnNumber: 11
              },
              this
            )
          ] }, void 0, true, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
            lineNumber: 427,
            columnNumber: 9
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
          lineNumber: 421,
          columnNumber: 7
        },
        this
      )
    },
    void 0,
    false,
    {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
      lineNumber: 413,
      columnNumber: 5
    },
    this
  );
}
_s(SpatialHotspotAnchor, "UgfwNiEKqCkk/8J0pftUyWTB+UM=", false, function() {
  return [useThree, useFrame];
});
_c3 = SpatialHotspotAnchor;
const STATION_REPLACED = /* @__PURE__ */ new Set(["rotor", "motor-housing", "flange", "gearbox-housing"]);
export function Hotspots() {
  _s2();
  const [roleMap, setRoleMap] = useState([]);
  const chapter = useScrollValue("chapter");
  const progress = useScrollValue("progress");
  const selected = useScrollValue("hotspotId");
  useEffect(() => {
    let alive = true;
    fetch("/models/role-map.json").then((response) => response.json()).then((entries) => {
      if (alive) setRoleMap(entries);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, []);
  const normalizeOccurrence = (name) => name.replace(/^occurrence of /i, "");
  const anchors = useMemo(() => {
    const rowsFor = (name) => {
      const exact = roleMap.filter((entry) => entry.occurrence === name);
      if (exact.length > 0) return exact;
      const normalized = normalizeOccurrence(name);
      return roleMap.filter((entry) => normalizeOccurrence(entry.occurrence) === normalized);
    };
    return HOTSPOTS.filter((h) => ACTIVE_HOTSPOT_IDS.has(h.id) && (!STATION_REPLACED.has(h.id) || h.id === "rotor")).flatMap((def) => {
      const rows = rowsFor(def.occurrence);
      if (rows.length === 0) return [];
      let entry = rows[0];
      if (rows.length > 1) {
        if (def.pickNear) {
          const [px, py, pz] = def.pickNear;
          entry = rows.reduce((best, row) => {
            const d = (r) => (r.bboxCenter[0] - px) ** 2 + (r.bboxCenter[1] - py) ** 2 + (r.bboxCenter[2] - pz) ** 2;
            return d(row) < d(best) ? row : best;
          }, rows[0]);
        } else {
          console.warn(
            `[Hotspots] ${def.occurrence} matches ${rows.length} role-map rows with no pickNear — using the first`
          );
        }
      }
      return [{ def, entry }];
    });
  }, [roleMap]);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: anchors.filter(
    ({ def }) => progress > 0.12 && (def.window ? progress >= def.window[0] && progress <= def.window[1] : def.chapters.includes(chapter))
  ).map(({ def, entry }) => {
    const config = HOTSPOT_CONFIG[def.id] ?? { dx: 180, dy: -80, unitOffset: 0 };
    return /* @__PURE__ */ jsxDEV(
      SpatialHotspotAnchor,
      {
        def,
        position: entry.bboxCenter,
        anchorOffset: config.offset,
        unitOffset: config.unitOffset,
        nominalDx: config.dx,
        nominalDy: config.dy,
        selected: selected === def.id
      },
      def.id,
      false,
      {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
        lineNumber: 563,
        columnNumber: 11
      },
      this
    );
  }) }, void 0, false, {
    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx",
    lineNumber: 552,
    columnNumber: 5
  }, this);
}
_s2(Hotspots, "VMKWMW7GWD1Q/G7S83X+w8JklFA=", false, function() {
  return [useScrollValue, useScrollValue, useScrollValue];
});
_c4 = Hotspots;
var _c, _c2, _c3, _c4;
$RefreshReg$(_c, "HotspotButton");
$RefreshReg$(_c2, "SpatialLeaderLine");
$RefreshReg$(_c3, "SpatialHotspotAnchor");
$RefreshReg$(_c4, "Hotspots");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/Hotspots.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QU96SjtBQUFBQSxRQUNyQixZQUFZeUosT0FBTzFKO0FBQUFBLFFBQ25CLFdBQVcwSixPQUFPNUo7QUFBQUEsUUFDbEIsV0FBVzRKLE9BQU8zSjtBQUFBQSxRQUNsQixVQUFVUyxhQUFhRCxJQUFJZTtBQUFBQTtBQUFBQSxNQVB0QmYsSUFBSWU7QUFBQUEsTUFEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBUWdDO0FBQUEsRUFHcEMsQ0FBQyxLQXRCTDtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBdUJBO0FBRUo7QUFBQzJGLElBckZlRCxVQUFRO0FBQUEsVUFFTjVILGdCQUNDQSxnQkFDQUEsY0FBYztBQUFBO0FBQUEsTUFKakI0SDtBQUFRLElBQUFwRixJQUFBYSxLQUFBa0gsS0FBQUM7QUFBQSxhQUFBaEksSUFBQTtBQUFBLGFBQUFhLEtBQUE7QUFBQSxhQUFBa0gsS0FBQTtBQUFBLGFBQUFDLEtBQUEiLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VNZW1vIiwidXNlUmVmIiwidXNlU3RhdGUiLCJIdG1sIiwidXNlRnJhbWUiLCJ1c2VUaHJlZSIsIlZlY3RvcjMiLCJjaGFyYWN0ZXJpc3RpY0tleSIsIkdkdFN5bWJvbCIsIkFDVElWRV9IT1RTUE9UX0lEUyIsIkVYUExPREVfT0ZGU0VUUyIsIkhPVFNQT1RTIiwiZ2V0SG90c3BvdExheWVyUG9ydGFsIiwic2V0U2Nyb2xsU3RhdGUiLCJ0ZWxlbWV0cnkiLCJ1c2VTY3JvbGxWYWx1ZSIsIl93b3JsZFBvcyIsIl9wcm9qIiwiX3BsYWNlZEJhZGdlcyIsIk1hcCIsIl9iYWRnZUZyYW1lRXBvY2giLCJIQU5ETEVfVU5JVF9PRkZTRVQiLCJoYW5kbGUiLCJIT1RTUE9UX0NPTkZJRyIsInJvdG9yIiwiZHgiLCJkeSIsInVuaXRPZmZzZXQiLCJvZmZzZXQiLCJmbGFuZ2UiLCJtY3UiLCJsY2QiLCJsaXBvIiwiSG90c3BvdEJ1dHRvbiIsImRlZiIsInNlbGVjdGVkIiwic3R5bGUiLCJvbk1vdXNlRW50ZXIiLCJvbk1vdXNlTGVhdmUiLCJ0b25lIiwiZGF0dW1MZXR0ZXIiLCJhbm5vdGF0aW9uIiwiZGF0dW0iLCJmcmFtZSIsInByb2Nlc3NOb3RlIiwiZGltIiwibGFiZWwiLCJkZXRhaWwiLCJob3RzcG90SWQiLCJpZCIsImNoYXJhY3RlcmlzdGljIiwiY2VsbHMiLCJtYXAiLCJjZWxsIiwiaWR4IiwiX2MiLCJTcGF0aWFsTGVhZGVyTGluZSIsImhvdmVyZWQiLCJpc1JpZ2h0IiwiZWxib3dYIiwic2hlbGZMZW5ndGgiLCJzaGVsZkVuZFgiLCJhY3RpdmUiLCJzdHJva2VDb2xvciIsInN0cm9rZVdpZHRoIiwid2lkdGgiLCJoZWlnaHQiLCJ1bmRlZmluZWQiLCJfYzIiLCJTcGF0aWFsSG90c3BvdEFuY2hvciIsInBvc2l0aW9uIiwiYW5jaG9yT2Zmc2V0IiwidmlzaWJsZSIsIm5vbWluYWxEeCIsIm5vbWluYWxEeSIsIl9zIiwiZ3JvdXBSZWYiLCJjb250YWluZXJSZWYiLCJiYWRnZVdyYXBwZXJSZWYiLCJidXR0b25Db250YWluZXJSZWYiLCJwYXRoUmVmIiwidGlja1JlZiIsInNldEhvdmVyZWQiLCJob3RzcG90UG9ydGFsIiwiY2FtZXJhIiwic2l6ZSIsImZyYW1lU3RhdGUiLCJjdXJyZW50IiwiY2xvY2siLCJlbGFwc2VkVGltZSIsImNsZWFyIiwiZGlzcGxheSIsImV4cGxvZGUiLCJyaWciLCJleHBsb2RlRmFjdG9yIiwib2Zmc2V0WiIsInNldCIsImdldFdvcmxkUG9zaXRpb24iLCJjb3B5IiwicHJvamVjdCIsInoiLCJ4IiwieSIsImF4IiwiYXkiLCJpc01vYmlsZSIsInNhZmVMZWZ0Iiwic2FmZVJpZ2h0Iiwic2FmZVRvcCIsInNhZmVCb3R0b20iLCJiYWRnZVciLCJvZmZzZXRXaWR0aCIsImJhZGdlSCIsIm9mZnNldEhlaWdodCIsInNwYW5YIiwiTWF0aCIsImFicyIsImJ4IiwibWF4IiwibWluIiwic3BhblkiLCJieSIsInJlbmRlclgiLCJzdGFja2luZyIsImd1YXJkIiwia2V5IiwicmVjdCIsIm92ZXJsYXBzIiwidyIsImgiLCJzZXRBdHRyaWJ1dGUiLCJ0cmFuc2Zvcm0iLCJ0cmFuc2Zvcm1PcmlnaW4iLCJyZXN0VGlja09wYWNpdHkiLCJwb2ludGVyRXZlbnRzIiwibGVmdCIsInRvcCIsIlNUQVRJT05fUkVQTEFDRUQiLCJTZXQiLCJIb3RzcG90cyIsIl9zMiIsInJvbGVNYXAiLCJzZXRSb2xlTWFwIiwiY2hhcHRlciIsInByb2dyZXNzIiwiYWxpdmUiLCJmZXRjaCIsInRoZW4iLCJyZXNwb25zZSIsImpzb24iLCJlbnRyaWVzIiwiY2F0Y2giLCJub3JtYWxpemVPY2N1cnJlbmNlIiwibmFtZSIsInJlcGxhY2UiLCJhbmNob3JzIiwicm93c0ZvciIsImV4YWN0IiwiZmlsdGVyIiwiZW50cnkiLCJvY2N1cnJlbmNlIiwibGVuZ3RoIiwibm9ybWFsaXplZCIsImhhcyIsImZsYXRNYXAiLCJyb3dzIiwicGlja05lYXIiLCJweCIsInB5IiwicHoiLCJyZWR1Y2UiLCJiZXN0Iiwicm93IiwiZCIsInIiLCJiYm94Q2VudGVyIiwiY29uc29sZSIsIndhcm4iLCJ3aW5kb3ciLCJjaGFwdGVycyIsImluY2x1ZGVzIiwiY29uZmlnIiwiX2MzIiwiX2M0Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkhvdHNwb3RzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcclxuaW1wb3J0IHsgSHRtbCB9IGZyb20gJ0ByZWFjdC10aHJlZS9kcmVpJ1xyXG5pbXBvcnQgeyB1c2VGcmFtZSwgdXNlVGhyZWUgfSBmcm9tICdAcmVhY3QtdGhyZWUvZmliZXInXHJcbmltcG9ydCB7IEdyb3VwLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnXHJcbmltcG9ydCB7IGNoYXJhY3RlcmlzdGljS2V5LCBHZHRTeW1ib2wgfSBmcm9tICcuLi9jb21wb25lbnRzL0dkdFN5bWJvbHMnXHJcbmltcG9ydCB7IEFDVElWRV9IT1RTUE9UX0lEUywgRVhQTE9ERV9PRkZTRVRTLCBIT1RTUE9UUyB9IGZyb20gJy4uL2RhdGEvY2FzZVN0dWRpZXMnXHJcbmltcG9ydCB7IGdldEhvdHNwb3RMYXllclBvcnRhbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvVGVjaG5pY2FsSFVEJ1xyXG5pbXBvcnQgeyBzZXRTY3JvbGxTdGF0ZSwgdGVsZW1ldHJ5LCB1c2VTY3JvbGxWYWx1ZSB9IGZyb20gJy4uL3N0YXRlL3Njcm9sbFN0b3JlJ1xyXG5pbXBvcnQgdHlwZSB7IENoYXB0ZXJJbmRleCwgSG90c3BvdERlZiwgUm9sZU1hcEVudHJ5IH0gZnJvbSAnLi4vdHlwZXMvcG9ydGZvbGlvJ1xyXG5cclxuLyoqIE1vZHVsZS1sZXZlbCByZXVzYWJsZSB2ZWN0b3JzIChyM2Ytc2Nyb2xsLXBlcmZvcm1hbmNlLWd1YXJkIOKAlCB6ZXJvIEdDKS4gKi9cclxuY29uc3QgX3dvcmxkUG9zID0gbmV3IFZlY3RvcjMoKVxyXG5jb25zdCBfcHJvaiA9IG5ldyBWZWN0b3IzKClcclxuXHJcbi8qKlxyXG4gKiBDcm9zcy1hbmNob3IgcGxhY2VtZW50IHJlZ2lzdHJ5IChKRy0wMjEgcmVtZWRpYXRpb24pOiB3aGVuIHRoZSBwb3J0cmFpdFxyXG4gKiB2ZXJ0aWNhbCBiaWFzIGNvbXBvc2VzIHRoZSBzdWJqZWN0IGhpZ2gsIHNldmVyYWwgYmFkZ2VzIGNsYW1wIGludG8gdGhlIHNhbWVcclxuICogdG9wIGJhbmQ7IGVhY2ggbmV3bHkgcGxhY2VkIGJhZGdlIHN0YWNrcyBiZWxvdyB0aGUgb25lcyBwbGFjZWQgZWFybGllciBpblxyXG4gKiB0aGUgU0FNRSBmcmFtZS4gQ2xlYXJlZCBvbiB0aGUgY2xvY2sgZXBvY2ggKGlkZW50aWNhbCBmb3IgZXZlcnkgdXNlRnJhbWVcclxuICogY2FsbGJhY2sgaW4gb25lIHJlbmRlciBwYXNzKSwgc28gcmVzcG9uc2l2ZSBiYWRnZXMgY2FuIG5ldmVyIGZlZWQgZWFjaFxyXG4gKiBvdGhlcidzIHBvc2l0aW9ucyBhY3Jvc3MgZnJhbWVzIGFuZCBkcmlmdC4gU3RpbGwgcHVyZSByZWYgbXV0YXRpb24uXHJcbiAqL1xyXG5jb25zdCBfcGxhY2VkQmFkZ2VzID0gbmV3IE1hcDxzdHJpbmcsIHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHc6IG51bWJlcjsgaDogbnVtYmVyIH0+KClcclxubGV0IF9iYWRnZUZyYW1lRXBvY2ggPSAtMVxyXG5cclxuLyoqXHJcbiAqIDJEIG5vbWluYWwgc2NyZWVuIGRpc3BsYWNlbWVudCBhbmQgZXhwbG9zaW9uIG9mZnNldHMgZm9yIFN0YXRpb24gMSBob3RzcG90cy5cclxuICovXHJcbmNvbnN0IEhBTkRMRV9VTklUX09GRlNFVCA9IEVYUExPREVfT0ZGU0VUUy5oYW5kbGVcclxuY29uc3QgSE9UU1BPVF9DT05GSUc6IFJlY29yZDxzdHJpbmcsIHsgZHg6IG51bWJlcjsgZHk6IG51bWJlcjsgdW5pdE9mZnNldDogbnVtYmVyOyBvZmZzZXQ/OiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gfT4gPSB7XHJcbiAgcm90b3I6IHsgZHg6IDIyMCwgZHk6IC0xMDAsIHVuaXRPZmZzZXQ6IEhBTkRMRV9VTklUX09GRlNFVCwgb2Zmc2V0OiBbMCwgMCwgLTAuMDMxNV0gfSxcclxuICAnbW90b3ItaG91c2luZyc6IHsgZHg6IDIyMCwgZHk6IDcwLCB1bml0T2Zmc2V0OiBIQU5ETEVfVU5JVF9PRkZTRVQsIG9mZnNldDogWzAsIDAsIC0wLjAxOV0gfSxcclxuICBmbGFuZ2U6IHsgZHg6IDIyMCwgZHk6IC0xMzAsIHVuaXRPZmZzZXQ6IEhBTkRMRV9VTklUX09GRlNFVCwgb2Zmc2V0OiBbMCwgMC4wMjgsIDBdIH0sXHJcbiAgJ2dlYXJib3gtaG91c2luZyc6IHsgZHg6IDIyMCwgZHk6IDkwLCB1bml0T2Zmc2V0OiAwLCBvZmZzZXQ6IFswLCAwLjAzMiwgMF0gfSxcclxuICBtY3U6IHsgZHg6IC0yMjAsIGR5OiAtOTAsIHVuaXRPZmZzZXQ6IEhBTkRMRV9VTklUX09GRlNFVCwgb2Zmc2V0OiBbLTAuMDAzLCAwLCAwLjAwMl0gfSxcclxuICBsY2Q6IHsgZHg6IDIwMCwgZHk6IC0xMDAsIHVuaXRPZmZzZXQ6IEhBTkRMRV9VTklUX09GRlNFVCwgb2Zmc2V0OiBbLTAuMDAzLCAwLCAtMC4wMDZdIH0sXHJcbiAgbGlwbzogeyBkeDogLTIyMCwgZHk6IDkwLCB1bml0T2Zmc2V0OiBIQU5ETEVfVU5JVF9PRkZTRVQsIG9mZnNldDogWzAuMDAzLCAwLCAwLjAwNF0gfSxcclxufVxyXG5cclxuLyoqXHJcbiAqIFB1cmUgRE9NIGhvdHNwb3QgbWFya2VyIChleHBvcnRlZCBzZXBhcmF0ZWx5IGZvciB0ZXN0IGhhcm5lc3NlcyAvIE5vZGUgc21va2UgY2hlY2tzKS5cclxuICogQSByZWFsIDxidXR0b24+LCBzbyBFbnRlci9TcGFjZSBhY3RpdmF0ZSBuYXRpdmVseTsgYXJpYS1wcmVzc2VkIHJlZmxlY3RzIHRvZ2dsZTtcclxuICogY3lhbiBmb2N1cy12aXNpYmxlIHJpbmcgbWF0Y2hlcyBIVUQgY2hyb21lLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIEhvdHNwb3RCdXR0b24oe1xyXG4gIGRlZixcclxuICBzZWxlY3RlZCxcclxuICBzdHlsZSxcclxuICBvbk1vdXNlRW50ZXIsXHJcbiAgb25Nb3VzZUxlYXZlLFxyXG4gIHRvbmUgPSAnZnVsbCcsXHJcbn06IHtcclxuICBkZWY6IEhvdHNwb3REZWZcclxuICBzZWxlY3RlZDogYm9vbGVhblxyXG4gIHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllc1xyXG4gIG9uTW91c2VFbnRlcj86ICgpID0+IHZvaWRcclxuICBvbk1vdXNlTGVhdmU/OiAoKSA9PiB2b2lkXHJcbiAgLyoqICdkaW0nIHB1bGxzIHRoZSBiYWRnZSdzIG5lb24gY2hyb21lIGJhY2sgfjUwJSBhdCByZXN0IChKRy0wMjEgZ2xvd1xyXG4gICAqIGV4cGVyaW1lbnQgNjogdGhlIGJhZGdlIGdsb3cgd2FzIHRoZSBsYXN0IGNsaXBwZWQgcGl4ZWxzIGluIHRoZSBTdGF0aW9uLTJcclxuICAgKiBmcmFtZSkuIFNlbGVjdGVkL2hvdmVyZWQgc3RhdGVzIGtlZXAgZnVsbCBzdHJlbmd0aCDigJQgaW50ZXJhY3Rpb24gcG9wIGlzXHJcbiAgICogdW5jaGFuZ2VkLCBhbmQgU3RhdGlvbnMgMS8zIGRlZmF1bHQgdG8gJ2Z1bGwnLiAqL1xyXG4gIHRvbmU/OiAnZnVsbCcgfCAnZGltJ1xyXG59KSB7XHJcbiAgY29uc3QgZGF0dW1MZXR0ZXIgPSBkZWYuYW5ub3RhdGlvbj8uZGF0dW1cclxuICBjb25zdCBmcmFtZSA9IGRlZi5hbm5vdGF0aW9uPy5mcmFtZVxyXG4gIGNvbnN0IHByb2Nlc3NOb3RlID0gZGVmLmFubm90YXRpb24/LnByb2Nlc3NOb3RlXHJcbiAgY29uc3QgZGltID0gdG9uZSA9PT0gJ2RpbSdcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxidXR0b25cclxuICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgIGFyaWEtcHJlc3NlZD17c2VsZWN0ZWR9XHJcbiAgICAgIGFyaWEtbGFiZWw9e2Ake2RlZi5sYWJlbH0gwrcgJHtkZWYuZGV0YWlsfWB9XHJcbiAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNjcm9sbFN0YXRlKHsgaG90c3BvdElkOiBzZWxlY3RlZCA/IG51bGwgOiBkZWYuaWQgfSl9XHJcbiAgICAgIG9uTW91c2VFbnRlcj17b25Nb3VzZUVudGVyfVxyXG4gICAgICBvbk1vdXNlTGVhdmU9e29uTW91c2VMZWF2ZX1cclxuICAgICAgc3R5bGU9e3N0eWxlfVxyXG4gICAgICBjbGFzc05hbWU9e2Bncm91cCBwb2ludGVyLWV2ZW50cy1hdXRvIGN1cnNvci1wb2ludGVyIHNlbGVjdC1ub25lIG1heC13LVtjYWxjKDEwMHZ3LTMycHgpXSBtZDptYXgtdy1ub25lIGJvcmRlciBweC0yLjUgcHktMS41IGZvbnQtbW9ubyB0ZXh0LVsxMHB4XSB0cmFja2luZy13aWRlc3Qgb3V0bGluZS1ub25lIGJhY2tkcm9wLWJsdXItbWQgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIGZvY3VzLXZpc2libGU6cmluZy0yIGZvY3VzLXZpc2libGU6cmluZy1jeWFuLTMwMCBmb2N1cy12aXNpYmxlOnJpbmctb2Zmc2V0LTIgZm9jdXMtdmlzaWJsZTpyaW5nLW9mZnNldC1ibGFjayAke1xyXG4gICAgICAgIHNlbGVjdGVkXHJcbiAgICAgICAgICA/ICdib3JkZXItY3lhbi0zMDAgYmctY3lhbi05NTAvOTUgdGV4dC1jeWFuLTEwMCBzaGFkb3ctWzBfMF8yMHB4X3JnYmEoMCwyMjksMjU1LDAuNSldIHJpbmctMSByaW5nLWN5YW4tNDAwLzYwJ1xyXG4gICAgICAgICAgOiBkaW1cclxuICAgICAgICAgICAgPyAnYm9yZGVyLWN5YW4tNDAwLzM1IGJnLWJsYWNrLzcwIHRleHQtY3lhbi0zMDAvNzAgaG92ZXI6Ym9yZGVyLWN5YW4tMzAwIGhvdmVyOmJnLWJsYWNrLzk1IGhvdmVyOnRleHQtY3lhbi0xMDAnXHJcbiAgICAgICAgICAgIDogJ2JvcmRlci1jeWFuLTQwMC82MCBiZy1ibGFjay84NSB0ZXh0LWN5YW4tMzAwIGhvdmVyOmJvcmRlci1jeWFuLTMwMCBob3ZlcjpiZy1ibGFjay85NSBob3Zlcjp0ZXh0LWN5YW4tMTAwIGhvdmVyOnNoYWRvdy1bMF8wXzE1cHhfcmdiYSgwLDIyOSwyNTUsMC4zNSldJ1xyXG4gICAgICB9YH1cclxuICAgID5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBvdmVyZmxvdy1oaWRkZW5cIj5cclxuICAgICAgICA8c3BhblxyXG4gICAgICAgICAgY2xhc3NOYW1lPXtgaW5saW5lLWJsb2NrIGgtMS41IHctMS41IHNocmluay0wIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgJHtcclxuICAgICAgICAgICAgc2VsZWN0ZWRcclxuICAgICAgICAgICAgICA/ICdiZy1jeWFuLTMwMCBzaGFkb3ctWzBfMF84cHhfIzAwZTVmZl0gcmluZy0yIHJpbmctY3lhbi00MDAvNTAnXHJcbiAgICAgICAgICAgICAgOiBkaW1cclxuICAgICAgICAgICAgICAgID8gJ2JnLWN5YW4tNDAwLzQ1IGdyb3VwLWhvdmVyOmJnLWN5YW4tMzAwJ1xyXG4gICAgICAgICAgICAgICAgOiAnYmctY3lhbi00MDAvNzAgZ3JvdXAtaG92ZXI6YmctY3lhbi0zMDAnXHJcbiAgICAgICAgICB9YH1cclxuICAgICAgICAvPlxyXG5cclxuICAgICAgICB7LyogMS4gQVNNRSBZMTQuNSBCb3hlZCBEYXR1bSBGbGFnOiBbIC1BLSBdICovfVxyXG4gICAgICAgIHtkYXR1bUxldHRlciAmJiAoXHJcbiAgICAgICAgICA8c3BhblxyXG4gICAgICAgICAgICBjbGFzc05hbWU9e2BpbmxpbmUtZmxleCBoLTUgbWluLXctWzIycHhdIHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBib3JkZXIgcHgtMSBmb250LW1vbm8gdGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtY3lhbi0xMDAgJHtcclxuICAgICAgICAgICAgICBkaW0gPyAnYm9yZGVyLWN5YW4tMzAwLzYwIGJnLWN5YW4tOTUwLzYwJyA6ICdib3JkZXItY3lhbi0zMDAgYmctY3lhbi05NTAvODAgc2hhZG93LVswXzBfOHB4X3JnYmEoMCwyMjksMjU1LDAuNCldJ1xyXG4gICAgICAgICAgICB9YH1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgLXtkYXR1bUxldHRlcn0tXHJcbiAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgKX1cclxuXHJcbiAgICAgICAgey8qIDIuIEFTTUUgWTE0LjUgU2VnbWVudGVkIEZlYXR1cmUgQ29udHJvbCBGcmFtZSDigJQgdGhlIGxlYWRpbmdcclxuICAgICAgICAgICAgY29tcGFydG1lbnQgY2FycmllcyB0aGUgY2hhcmFjdGVyaXN0aWMgU1lNQk9MIChHZHRTeW1ib2wpLCBuZXZlclxyXG4gICAgICAgICAgICB0aGUgc3BlbGxlZC1vdXQgd29yZCAoSkctMDIxIHJlbWVkaWF0aW9uKTsgbm9uLVkxNC41IHNwZWMgZnJhbWVzXHJcbiAgICAgICAgICAgIChlLmcuICdBVFRFTlVBVElPTicpIGxlZ2l0aW1hdGVseSBzdGF5IGFzIHRleHQuICovfVxyXG4gICAgICAgIHtmcmFtZSA/IChcclxuICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgaW5saW5lLWZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGJvcmRlciB0ZXh0LWN5YW4tMTAwICR7XHJcbiAgICAgICAgICAgICAgZGltID8gJ2JvcmRlci1jeWFuLTMwMC80NSBiZy1jeWFuLTk1MC8yNScgOiAnYm9yZGVyLWN5YW4tMzAwLzkwIGJnLWN5YW4tOTUwLzQwJ1xyXG4gICAgICAgICAgICB9YH1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge2ZyYW1lLmNoYXJhY3RlcmlzdGljICYmIChcclxuICAgICAgICAgICAgICA8c3BhblxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBoLTUgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJvcmRlci1yIHB4LTEuNSBmb250LW1vbm8gdGV4dC1bMTBweF0gZm9udC1zZW1pYm9sZCAke1xyXG4gICAgICAgICAgICAgICAgICBkaW0gPyAnYm9yZGVyLWN5YW4tMzAwLzQwJyA6ICdib3JkZXItY3lhbi0zMDAvNzAnXHJcbiAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICAgIHRpdGxlPXtmcmFtZS5jaGFyYWN0ZXJpc3RpY31cclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICB7Y2hhcmFjdGVyaXN0aWNLZXkoZnJhbWUuY2hhcmFjdGVyaXN0aWMpID8gKFxyXG4gICAgICAgICAgICAgICAgICA8R2R0U3ltYm9sIG5hbWU9e2ZyYW1lLmNoYXJhY3RlcmlzdGljfSAvPlxyXG4gICAgICAgICAgICAgICAgKSA6IChcclxuICAgICAgICAgICAgICAgICAgZnJhbWUuY2hhcmFjdGVyaXN0aWNcclxuICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICApfVxyXG4gICAgICAgICAgICB7ZnJhbWUuY2VsbHMubWFwKChjZWxsLCBpZHgpID0+IChcclxuICAgICAgICAgICAgICA8c3BhblxyXG4gICAgICAgICAgICAgICAga2V5PXtgJHtjZWxsfS0ke2lkeH1gfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBoLTUgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJvcmRlci1yIHB4LTEuNSBmb250LW1vbm8gdGV4dC1bMTBweF0gZm9udC1zZW1pYm9sZCBsYXN0OmJvcmRlci1yLTAgJHtcclxuICAgICAgICAgICAgICAgICAgZGltID8gJ2JvcmRlci1jeWFuLTMwMC80MCcgOiAnYm9yZGVyLWN5YW4tMzAwLzcwJ1xyXG4gICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge2NlbGx9XHJcbiAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICApKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICkgOiBudWxsfVxyXG5cclxuICAgICAgICB7LyogMy4gTGFiZWwgLyBTdWJhc3NlbWJseSBUaXRsZSAqL31cclxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B0cnVuY2F0ZSBmb250LXNlbWlib2xkIHRyYWNraW5nLXdpZGVyICR7ZGltID8gJ3RleHQtY3lhbi0xMDAvNzAnIDogJ3RleHQtY3lhbi0xMDAvOTUnfWB9PlxyXG4gICAgICAgICAge2RlZi5sYWJlbH1cclxuICAgICAgICA8L3NwYW4+XHJcblxyXG4gICAgICAgIHsvKiA0LiBQcm9jZXNzIE5vdGUgKi99XHJcbiAgICAgICAge3Byb2Nlc3NOb3RlICYmICFmcmFtZSAmJiAhZGF0dW1MZXR0ZXIgJiYgKFxyXG4gICAgICAgICAgPD5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaGlkZGVuIHRleHQtY3lhbi00MDAvNDAgc206aW5saW5lXCI+wrc8L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGhpZGRlbiB0ZXh0LVs5cHhdIHNtOmlubGluZSAke2RpbSA/ICd0ZXh0LWN5YW4tMzAwLzQ1JyA6ICd0ZXh0LWN5YW4tMzAwLzcwJ31gfT5cclxuICAgICAgICAgICAgICB7cHJvY2Vzc05vdGV9XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgIDwvPlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9idXR0b24+XHJcbiAgKVxyXG59XHJcblxyXG4vKipcclxuICogU3RhdGljIFNWRyBsZWFkZXIgbGluZSBwcmVzZW50YXRpb24gZm9yIHN0YW5kYWxvbmUgLyBTU1IgLyBmYWxsYmFjayByZW5kZXJpbmcuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gU3BhdGlhbExlYWRlckxpbmUoe1xyXG4gIGR4LFxyXG4gIGR5LFxyXG4gIHNlbGVjdGVkLFxyXG4gIGhvdmVyZWQsXHJcbn06IHtcclxuICBkeDogbnVtYmVyXHJcbiAgZHk6IG51bWJlclxyXG4gIHNlbGVjdGVkOiBib29sZWFuXHJcbiAgaG92ZXJlZDogYm9vbGVhblxyXG59KSB7XHJcbiAgY29uc3QgaXNSaWdodCA9IGR4ID4gMFxyXG4gIGNvbnN0IGVsYm93WCA9IGR4ICogMC40NVxyXG4gIGNvbnN0IHNoZWxmTGVuZ3RoID0gNjBcclxuICBjb25zdCBzaGVsZkVuZFggPSBpc1JpZ2h0ID8gZHggKyBzaGVsZkxlbmd0aCA6IGR4IC0gc2hlbGZMZW5ndGhcclxuXHJcbiAgY29uc3QgYWN0aXZlID0gc2VsZWN0ZWQgfHwgaG92ZXJlZFxyXG4gIGNvbnN0IHN0cm9rZUNvbG9yID0gYWN0aXZlID8gJyMwMGU1ZmYnIDogJ3JnYmEoMzQsIDIxMSwgMjM4LCAwLjY1KSdcclxuICBjb25zdCBzdHJva2VXaWR0aCA9IGFjdGl2ZSA/IDEuNSA6IDEuMVxyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPHN2Z1xyXG4gICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxyXG4gICAgICBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lIGFic29sdXRlIGxlZnQtMCB0b3AtMCBvdmVyZmxvdy12aXNpYmxlXCJcclxuICAgICAgc3R5bGU9e3sgd2lkdGg6IDEsIGhlaWdodDogMSB9fVxyXG4gICAgPlxyXG4gICAgICA8ZGVmcz5cclxuICAgICAgICA8ZmlsdGVyIGlkPXtgZ2xvdy0ke2R4fS0ke2R5fWB9IHg9XCItMzAlXCIgeT1cIi0zMCVcIiB3aWR0aD1cIjE2MCVcIiBoZWlnaHQ9XCIxNjAlXCI+XHJcbiAgICAgICAgICA8ZmVEcm9wU2hhZG93IGR4PVwiMFwiIGR5PVwiMFwiIHN0ZERldmlhdGlvbj1cIjNcIiBmbG9vZENvbG9yPVwiIzAwZTVmZlwiIGZsb29kT3BhY2l0eT1cIjAuNzVcIiAvPlxyXG4gICAgICAgIDwvZmlsdGVyPlxyXG4gICAgICA8L2RlZnM+XHJcblxyXG4gICAgICA8Zz5cclxuICAgICAgICA8bGluZSB4MT1cIi04XCIgeTE9XCIwXCIgeDI9XCI4XCIgeTI9XCIwXCIgc3Ryb2tlPXtzdHJva2VDb2xvcn0gc3Ryb2tlV2lkdGg9XCIxXCIgLz5cclxuICAgICAgICA8bGluZSB4MT1cIjBcIiB5MT1cIi04XCIgeDI9XCIwXCIgeTI9XCI4XCIgc3Ryb2tlPXtzdHJva2VDb2xvcn0gc3Ryb2tlV2lkdGg9XCIxXCIgLz5cclxuICAgICAgICA8Y2lyY2xlIGN4PVwiMFwiIGN5PVwiMFwiIHI9XCIyXCIgZmlsbD17YWN0aXZlID8gJyMwMGU1ZmYnIDogJyMzOGJkZjgnfSAvPlxyXG4gICAgICA8L2c+XHJcblxyXG4gICAgICA8cGF0aFxyXG4gICAgICAgIGQ9e2BNIDAgMCBMICR7ZWxib3dYfSAke2R5fSBMICR7c2hlbGZFbmRYfSAke2R5fWB9XHJcbiAgICAgICAgZmlsbD1cIm5vbmVcIlxyXG4gICAgICAgIHN0cm9rZT17c3Ryb2tlQ29sb3J9XHJcbiAgICAgICAgc3Ryb2tlV2lkdGg9e3N0cm9rZVdpZHRofVxyXG4gICAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXHJcbiAgICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXHJcbiAgICAgICAgZmlsdGVyPXthY3RpdmUgPyBgdXJsKCNnbG93LSR7ZHh9LSR7ZHl9KWAgOiB1bmRlZmluZWR9XHJcbiAgICAgICAgY2xhc3NOYW1lPXthY3RpdmUgPyAnbGVhZGVyLWxpbmUtZmxvdycgOiB1bmRlZmluZWR9XHJcbiAgICAgIC8+XHJcblxyXG4gICAgICA8bGluZVxyXG4gICAgICAgIHgxPXtkeH1cclxuICAgICAgICB5MT17ZHkgLSA2fVxyXG4gICAgICAgIHgyPXtkeH1cclxuICAgICAgICB5Mj17ZHkgKyA2fVxyXG4gICAgICAgIHN0cm9rZT17c3Ryb2tlQ29sb3J9XHJcbiAgICAgICAgc3Ryb2tlV2lkdGg9e3N0cm9rZVdpZHRoICsgMC41fVxyXG4gICAgICAgIG9wYWNpdHk9e2FjdGl2ZSA/ICcxJyA6ICcwLjc1J31cclxuICAgICAgLz5cclxuICAgIDwvc3ZnPlxyXG4gIClcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTcGF0aWFsSG90c3BvdEFuY2hvclByb3BzIHtcclxuICBkZWY6IEhvdHNwb3REZWZcclxuICBzZWxlY3RlZDogYm9vbGVhblxyXG4gIHBvc2l0aW9uPzogW251bWJlciwgbnVtYmVyLCBudW1iZXJdXHJcbiAgYW5jaG9yT2Zmc2V0PzogW251bWJlciwgbnVtYmVyLCBudW1iZXJdXHJcbiAgdW5pdE9mZnNldD86IG51bWJlclxyXG4gIHZpc2libGU/OiBib29sZWFuXHJcbiAgbm9taW5hbER4PzogbnVtYmVyXHJcbiAgbm9taW5hbER5PzogbnVtYmVyXHJcbiAgLyoqICdkaW0nIHB1bGxzIHRoZSBiYWRnZSArIGxlYWRlci1saW5lIG5lb24gYmFjayBhdCByZXN0IChTdGF0aW9uIDIgZ2xvd1xyXG4gICAqIGZpeCk7IHNlbGVjdGVkL2hvdmVyZWQga2VlcCBmdWxsIHN0cmVuZ3RoLiBEZWZhdWx0ICdmdWxsJy4gKi9cclxuICB0b25lPzogJ2Z1bGwnIHwgJ2RpbSdcclxufVxyXG5cclxuLyoqXHJcbiAqIFVuaWZpZWQgU2FmZS1BcmVhIFNwYXRpYWwgSG90c3BvdCBBbmNob3IgKEpHLTAyMSBXUzQpLlxyXG4gKlxyXG4gKiBEeW5hbWljYWxseSBwcm9qZWN0cyAzRCBDQUQgb2NjdXJyZW5jZSBjb29yZGluYXRlcyBpbnRvIHNjcmVlbiBzcGFjZSBpbnNpZGUgdXNlRnJhbWUsXHJcbiAqIGNsYW1wcyBiYWRnZSBwb3NpdGlvbnMgaW50byByZXNwb25zaXZlIHNhZmUtYXJlYSBtYXJnaW5zIChkZXNrdG9wIGFuZCAzOTB4ODQ0IG1vYmlsZSksXHJcbiAqIGFkanVzdHMgbGVhZGVyIGxpbmUgZG9nbGVncywgYW5kIG11dGF0ZXMgRE9NIHRyYW5zZm9ybXMgZGlyZWN0bHkgb24gcmVmcyAoemVybyBSZWFjdCByZS1yZW5kZXJzKS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBTcGF0aWFsSG90c3BvdEFuY2hvcih7XHJcbiAgZGVmLFxyXG4gIHNlbGVjdGVkLFxyXG4gIHBvc2l0aW9uID0gWzAsIDAsIDBdLFxyXG4gIGFuY2hvck9mZnNldCA9IFswLCAwLCAwXSxcclxuICB1bml0T2Zmc2V0ID0gMCxcclxuICB2aXNpYmxlID0gdHJ1ZSxcclxuICBub21pbmFsRHgsXHJcbiAgbm9taW5hbER5LFxyXG4gIHRvbmUgPSAnZnVsbCcsXHJcbn06IFNwYXRpYWxIb3RzcG90QW5jaG9yUHJvcHMpIHtcclxuICBjb25zdCBncm91cFJlZiA9IHVzZVJlZjxHcm91cD4obnVsbClcclxuICBjb25zdCBjb250YWluZXJSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpXHJcbiAgY29uc3QgYmFkZ2VXcmFwcGVyUmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKVxyXG4gIGNvbnN0IGJ1dHRvbkNvbnRhaW5lclJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbClcclxuICBjb25zdCBwYXRoUmVmID0gdXNlUmVmPFNWR1BhdGhFbGVtZW50PihudWxsKVxyXG4gIGNvbnN0IHRpY2tSZWYgPSB1c2VSZWY8U1ZHTGluZUVsZW1lbnQ+KG51bGwpXHJcbiAgY29uc3QgW2hvdmVyZWQsIHNldEhvdmVyZWRdID0gdXNlU3RhdGUoZmFsc2UpXHJcbiAgY29uc3QgaG90c3BvdFBvcnRhbCA9IHVzZU1lbW8oKCkgPT4gZ2V0SG90c3BvdExheWVyUG9ydGFsKCksIFtdKVxyXG5cclxuICBjb25zdCB7IGNhbWVyYSwgc2l6ZSB9ID0gdXNlVGhyZWUoKVxyXG5cclxuICB1c2VGcmFtZSgoZnJhbWVTdGF0ZSkgPT4ge1xyXG4gICAgaWYgKCFncm91cFJlZi5jdXJyZW50IHx8ICFjb250YWluZXJSZWYuY3VycmVudCB8fCAhYmFkZ2VXcmFwcGVyUmVmLmN1cnJlbnQgfHwgIWJ1dHRvbkNvbnRhaW5lclJlZi5jdXJyZW50KSByZXR1cm5cclxuXHJcbiAgICAvLyBQZXItZnJhbWUgcmVnaXN0cnkgcmVzZXQgKGNsb2NrIGVwb2NoIGlzIHNoYXJlZCBieSBhbGwgdXNlRnJhbWUgY2FsbHNcclxuICAgIC8vIGluIG9uZSByZW5kZXIgcGFzcykg4oCUIHNlZSBfcGxhY2VkQmFkZ2VzIG5vdGUgYWJvdmUuXHJcbiAgICBpZiAoZnJhbWVTdGF0ZS5jbG9jay5lbGFwc2VkVGltZSAhPT0gX2JhZGdlRnJhbWVFcG9jaCkge1xyXG4gICAgICBfYmFkZ2VGcmFtZUVwb2NoID0gZnJhbWVTdGF0ZS5jbG9jay5lbGFwc2VkVGltZVxyXG4gICAgICBfcGxhY2VkQmFkZ2VzLmNsZWFyKClcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXZpc2libGUpIHtcclxuICAgICAgY29udGFpbmVyUmVmLmN1cnJlbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICAvLyBEeW5hbWljIGF4aWFsIGV4cGxvc2lvbiBvZmZzZXQgaWYgY29uZmlndXJlZCAoU3RhdGlvbiAxIGhhbmRsZSBleHRyYWN0aW9uKVxyXG4gICAgY29uc3QgZXhwbG9kZSA9IHRlbGVtZXRyeS5yaWcuZXhwbG9kZUZhY3RvclxyXG4gICAgY29uc3Qgb2Zmc2V0WiA9IHVuaXRPZmZzZXQgKiBleHBsb2RlXHJcbiAgICBncm91cFJlZi5jdXJyZW50LnBvc2l0aW9uLnNldChcclxuICAgICAgcG9zaXRpb25bMF0gKyBhbmNob3JPZmZzZXRbMF0sXHJcbiAgICAgIHBvc2l0aW9uWzFdICsgYW5jaG9yT2Zmc2V0WzFdLFxyXG4gICAgICBwb3NpdGlvblsyXSArIGFuY2hvck9mZnNldFsyXSArIG9mZnNldFosXHJcbiAgICApXHJcblxyXG4gICAgLy8gMS4gR2V0IDNEIHdvcmxkIHBvc2l0aW9uIG9mIGFuY2hvclxyXG4gICAgZ3JvdXBSZWYuY3VycmVudC5nZXRXb3JsZFBvc2l0aW9uKF93b3JsZFBvcylcclxuXHJcbiAgICAvLyAyLiBQcm9qZWN0IHRvIE5EQyAoLTEgdG8gKzEpXHJcbiAgICBfcHJvai5jb3B5KF93b3JsZFBvcykucHJvamVjdChjYW1lcmEpXHJcblxyXG4gICAgLy8gMy4gRnJ1c3R1bSAmIGRlcHRoIGN1bGxpbmc6IGhpZGUgaWYgYmVoaW5kIGNhbWVyYSBvciBvdXRzaWRlIHZpc2libGUgZnJ1c3R1bVxyXG4gICAgaWYgKF9wcm9qLnogPCAtMS4wIHx8IF9wcm9qLnogPiAxLjAgfHwgX3Byb2oueCA8IC0xLjMgfHwgX3Byb2oueCA+IDEuMyB8fCBfcHJvai55IDwgLTEuMyB8fCBfcHJvai55ID4gMS4zKSB7XHJcbiAgICAgIGNvbnRhaW5lclJlZi5jdXJyZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICBjb250YWluZXJSZWYuY3VycmVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG5cclxuICAgIC8vIDQuIENvbnZlcnQgTkRDIHRvIHZpZXdwb3J0IHBpeGVsIGNvb3JkaW5hdGVzXHJcbiAgICBjb25zdCBheCA9IChfcHJvai54ICogMC41ICsgMC41KSAqIHNpemUud2lkdGhcclxuICAgIGNvbnN0IGF5ID0gKC1fcHJvai55ICogMC41ICsgMC41KSAqIHNpemUuaGVpZ2h0XHJcblxyXG4gICAgLy8gNS4gU2FmZSBhcmVhIGJvdW5kcyAobW9iaWxlIHNhZmVUb3AgY2xlYXJzIHRoZSBzdGF0aW9uLW5hdiByb3cg4oCUIHRoZVxyXG4gICAgLy8gYmFkZ2UgcmVuZGVycyAxNCBweCBhYm92ZSBgYnlgLCBhbmQgdGhlIG5hdiBlbmRzIGF0IHkg4omIIDYxIG9uIDM5MMOXODQ0KS5cclxuICAgIGNvbnN0IGlzTW9iaWxlID0gc2l6ZS53aWR0aCA8PSA3NjhcclxuICAgIGNvbnN0IHNhZmVMZWZ0ID0gaXNNb2JpbGUgPyAxMiA6IDI0XHJcbiAgICBjb25zdCBzYWZlUmlnaHQgPSBzaXplLndpZHRoIC0gKGlzTW9iaWxlID8gMTIgOiAyNClcclxuICAgIGNvbnN0IHNhZmVUb3AgPSBpc01vYmlsZSA/IDgwIDogNjBcclxuICAgIGNvbnN0IHNhZmVCb3R0b20gPSBzaXplLmhlaWdodCAtIChpc01vYmlsZSA/IDcwIDogNjApXHJcblxyXG4gICAgLy8gRHluYW1pYyBtZWFzdXJlbWVudCBvZiBiYWRnZSB3aWR0aCBmcm9tIHJlYWwgRE9NXHJcbiAgICBjb25zdCBiYWRnZVcgPSBidXR0b25Db250YWluZXJSZWYuY3VycmVudD8ub2Zmc2V0V2lkdGggfHwgKGlzTW9iaWxlID8gMjIwIDogMzgwKVxyXG4gICAgY29uc3QgYmFkZ2VIID0gYnV0dG9uQ29udGFpbmVyUmVmLmN1cnJlbnQ/Lm9mZnNldEhlaWdodCB8fCAzMlxyXG5cclxuICAgIC8vIDYuIFJlc3BvbnNpdmUgc2lkZSBzZWxlY3Rpb246IHByZWZlciBub21pbmFsRHggb3Igc2NyZWVuIHNpZGVcclxuICAgIGxldCBpc1JpZ2h0ID0gbm9taW5hbER4ICE9PSB1bmRlZmluZWQgPyBub21pbmFsRHggPiAwIDogYXggPCBzaXplLndpZHRoICogMC41XHJcblxyXG4gICAgLy8gQXV0by1mbGlwIG9ubHkgd2hlbiBub21pbmFsRHggaXMgbm90IHNwZWNpZmllZCBhbmQgYmFkZ2UgY2xpcHMgb2Zmc2NyZWVuXHJcbiAgICBpZiAobm9taW5hbER4ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWYgKGlzUmlnaHQgJiYgYXggKyAyNSArIGJhZGdlVyA+IHNhZmVSaWdodCAmJiBheCAtIDI1IC0gYmFkZ2VXID49IHNhZmVMZWZ0KSB7XHJcbiAgICAgICAgaXNSaWdodCA9IGZhbHNlXHJcbiAgICAgIH0gZWxzZSBpZiAoIWlzUmlnaHQgJiYgYXggLSAyNSAtIGJhZGdlVyA8IHNhZmVMZWZ0ICYmIGF4ICsgMjUgKyBiYWRnZVcgPD0gc2FmZVJpZ2h0KSB7XHJcbiAgICAgICAgaXNSaWdodCA9IHRydWVcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIDcuIENsYW1wIGJhZGdlIGNvb3JkaW5hdGVzIHN0cmljdGx5IHdpdGhpbiBzYWZlIGFyZWFcclxuICAgIGNvbnN0IHNwYW5YID0gaXNNb2JpbGUgPyAyMCA6IChub21pbmFsRHggPyBNYXRoLmFicyhub21pbmFsRHgpIDogMTUwKVxyXG4gICAgbGV0IGJ4ID0gaXNSaWdodCA/IGF4ICsgc3BhblggOiBheCAtIHNwYW5YXHJcbiAgICBpZiAoaXNSaWdodCkge1xyXG4gICAgICBieCA9IE1hdGgubWF4KHNhZmVMZWZ0LCBNYXRoLm1pbihieCwgc2FmZVJpZ2h0IC0gYmFkZ2VXKSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJ4ID0gTWF0aC5taW4oc2FmZVJpZ2h0LCBNYXRoLm1heChieCwgc2FmZUxlZnQgKyBiYWRnZVcpKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNwYW5ZID0gbm9taW5hbER5ICE9PSB1bmRlZmluZWQgPyBub21pbmFsRHkgOiAoYXkgPiBzaXplLmhlaWdodCAqIDAuNSA/IC02MCA6IDYwKVxyXG4gICAgbGV0IGJ5ID0gYXkgKyBzcGFuWVxyXG4gICAgYnkgPSBNYXRoLm1heChzYWZlVG9wLCBNYXRoLm1pbihieSwgc2FmZUJvdHRvbSAtIGJhZGdlSCkpXHJcblxyXG4gICAgLy8gNy41IFZlcnRpY2FsIHN0YWNraW5nIGFnYWluc3QgYmFkZ2VzIHBsYWNlZCBlYXJsaWVyIHRoaXMgZnJhbWUgKEpHLTAyMVxyXG4gICAgLy8gcmVtZWRpYXRpb24pOiBjbGFtcGluZyBhbG9uZSBsZXRzIHNldmVyYWwgYmFkZ2VzIGxhbmQgb24gdGhlIHNhbWUgdG9wXHJcbiAgICAvLyByb3dzIHdoZW4gdGhlIHN1YmplY3QgY29tcG9zZXMgaGlnaDsgcHVzaCBlYWNoIHN1YnNlcXVlbnQgYmFkZ2UgYmVsb3dcclxuICAgIC8vIHRoZSBsaXZlIG9uZXMuIFRoZSByZWdpc3RyeSBzdG9yZXMgUkVOREVSRUQgcmVjdHMg4oCUIGxlZnQtc2lkZSBiYWRnZXNcclxuICAgIC8vIHBhaW50IGF0IGJ4IC0gYmFkZ2VXICh0cmFuc2xhdGVYKC0xMDAlKSkgYW5kIGV2ZXJ5IGJhZGdlIHBhaW50cyAxNCBweFxyXG4gICAgLy8gYWJvdmUgYGJ5YCwgc28gd3JhcHBlci1zcGFjZSBjb21wYXJpc29uIHdvdWxkIG1pc3MgcmVhbCBvdmVybGFwcy5cclxuICAgIGNvbnN0IHJlbmRlclggPSBpc1JpZ2h0ID8gYnggOiBieCAtIGJhZGdlV1xyXG4gICAgbGV0IHN0YWNraW5nID0gdHJ1ZVxyXG4gICAgbGV0IGd1YXJkID0gMFxyXG4gICAgd2hpbGUgKHN0YWNraW5nICYmIGd1YXJkKysgPCAxMikge1xyXG4gICAgICBzdGFja2luZyA9IGZhbHNlXHJcbiAgICAgIGZvciAoY29uc3QgW2tleSwgcmVjdF0gb2YgX3BsYWNlZEJhZGdlcykge1xyXG4gICAgICAgIGlmIChrZXkgPT09IGRlZi5pZCkgY29udGludWVcclxuICAgICAgICBjb25zdCBvdmVybGFwcyA9XHJcbiAgICAgICAgICByZW5kZXJYIDwgcmVjdC54ICsgcmVjdC53IC0gNCAmJlxyXG4gICAgICAgICAgcmVjdC54IDwgcmVuZGVyWCArIGJhZGdlVyAtIDQgJiZcclxuICAgICAgICAgIGJ5IC0gMTQgPCByZWN0LnkgKyByZWN0LmggKyA2ICYmXHJcbiAgICAgICAgICByZWN0LnkgPCBieSAtIDE0ICsgYmFkZ2VIICsgNlxyXG4gICAgICAgIGlmIChvdmVybGFwcykge1xyXG4gICAgICAgICAgYnkgPSByZWN0LnkgKyAxNCArIHJlY3QuaCArIDZcclxuICAgICAgICAgIHN0YWNraW5nID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBieSA9IE1hdGgubWluKGJ5LCBzYWZlQm90dG9tIC0gYmFkZ2VIKVxyXG4gICAgfVxyXG4gICAgX3BsYWNlZEJhZGdlcy5zZXQoZGVmLmlkLCB7IHg6IHJlbmRlclgsIHk6IGJ5IC0gMTQsIHc6IGJhZGdlVywgaDogYmFkZ2VIIH0pXHJcblxyXG4gICAgY29uc3QgZHggPSBieCAtIGF4XHJcbiAgICBjb25zdCBkeSA9IGJ5IC0gYXlcclxuXHJcbiAgICAvLyA4LiBEeW5hbWljIFNWRyBsZWFkZXIgbGluZSBwYXRoXHJcbiAgICBjb25zdCBlbGJvd1ggPSBkeCAqIDAuNDVcclxuICAgIGNvbnN0IHNoZWxmTGVuZ3RoID0gTWF0aC5taW4oNjAsIE1hdGgubWF4KDIwLCBNYXRoLmFicyhkeCkgKiAwLjM1KSlcclxuICAgIGNvbnN0IHNoZWxmRW5kWCA9IGlzUmlnaHQgPyBkeCArIHNoZWxmTGVuZ3RoIDogZHggLSBzaGVsZkxlbmd0aFxyXG5cclxuICAgIGlmIChwYXRoUmVmLmN1cnJlbnQpIHtcclxuICAgICAgcGF0aFJlZi5jdXJyZW50LnNldEF0dHJpYnV0ZSgnZCcsIGBNIDAgMCBMICR7ZWxib3dYfSAke2R5fSBMICR7c2hlbGZFbmRYfSAke2R5fWApXHJcbiAgICB9XHJcbiAgICBpZiAodGlja1JlZi5jdXJyZW50KSB7XHJcbiAgICAgIHRpY2tSZWYuY3VycmVudC5zZXRBdHRyaWJ1dGUoJ3gxJywgYCR7ZHh9YClcclxuICAgICAgdGlja1JlZi5jdXJyZW50LnNldEF0dHJpYnV0ZSgneDInLCBgJHtkeH1gKVxyXG4gICAgICB0aWNrUmVmLmN1cnJlbnQuc2V0QXR0cmlidXRlKCd5MScsIGAke2R5IC0gNn1gKVxyXG4gICAgICB0aWNrUmVmLmN1cnJlbnQuc2V0QXR0cmlidXRlKCd5MicsIGAke2R5ICsgNn1gKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIDkuIE11dGF0ZSBiYWRnZSBjb250YWluZXIgdHJhbnNmb3JtICh6ZXJvIFJlYWN0IHJlLXJlbmRlcilcclxuICAgIGJhZGdlV3JhcHBlclJlZi5jdXJyZW50LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgke2R4fXB4LCAke2R5IC0gMTR9cHgsIDApYFxyXG4gICAgYmFkZ2VXcmFwcGVyUmVmLmN1cnJlbnQuc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gaXNSaWdodCA/ICdsZWZ0IGNlbnRlcicgOiAncmlnaHQgY2VudGVyJ1xyXG4gICAgYnV0dG9uQ29udGFpbmVyUmVmLmN1cnJlbnQuc3R5bGUudHJhbnNmb3JtID0gaXNSaWdodCA/ICdub25lJyA6ICd0cmFuc2xhdGVYKC0xMDAlKSdcclxuICAgIGJ1dHRvbkNvbnRhaW5lclJlZi5jdXJyZW50LnN0eWxlLnRyYW5zZm9ybU9yaWdpbiA9IGlzUmlnaHQgPyAnbGVmdCBjZW50ZXInIDogJ3JpZ2h0IGNlbnRlcidcclxuICB9KVxyXG5cclxuICBjb25zdCBhY3RpdmUgPSBzZWxlY3RlZCB8fCBob3ZlcmVkXHJcbiAgY29uc3QgZGltID0gdG9uZSA9PT0gJ2RpbSdcclxuICBjb25zdCBzdHJva2VDb2xvciA9IGFjdGl2ZVxyXG4gICAgPyAnIzAwZTVmZidcclxuICAgIDogZGltXHJcbiAgICAgID8gJ3JnYmEoMzQsIDIxMSwgMjM4LCAwLjMyKSdcclxuICAgICAgOiAncmdiYSgzNCwgMjExLCAyMzgsIDAuNjUpJ1xyXG4gIGNvbnN0IHN0cm9rZVdpZHRoID0gYWN0aXZlID8gMS41IDogZGltID8gMC45IDogMS4xXHJcbiAgY29uc3QgcmVzdFRpY2tPcGFjaXR5ID0gZGltID8gJzAuNCcgOiAnMC43NSdcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxncm91cFxyXG4gICAgICByZWY9e2dyb3VwUmVmfVxyXG4gICAgICBwb3NpdGlvbj17W1xyXG4gICAgICAgIHBvc2l0aW9uWzBdICsgYW5jaG9yT2Zmc2V0WzBdLFxyXG4gICAgICAgIHBvc2l0aW9uWzFdICsgYW5jaG9yT2Zmc2V0WzFdLFxyXG4gICAgICAgIHBvc2l0aW9uWzJdICsgYW5jaG9yT2Zmc2V0WzJdLFxyXG4gICAgICBdfVxyXG4gICAgPlxyXG4gICAgICA8SHRtbFxyXG4gICAgICAgIGNlbnRlcj17ZmFsc2V9XHJcbiAgICAgICAgcG9ydGFsPXtob3RzcG90UG9ydGFsID8/IHVuZGVmaW5lZH1cclxuICAgICAgICB6SW5kZXhSYW5nZT17WzQwLCAwXX1cclxuICAgICAgICBzdHlsZT17eyBwb2ludGVyRXZlbnRzOiAnbm9uZScgfX1cclxuICAgICAgPlxyXG4gICAgICAgIDxkaXYgcmVmPXtjb250YWluZXJSZWZ9IGNsYXNzTmFtZT1cInJlbGF0aXZlXCI+XHJcbiAgICAgICAgICB7LyogRHluYW1pYyBTVkcgTGVhZGVyIExpbmUgKi99XHJcbiAgICAgICAgICA8c3ZnXHJcbiAgICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInBvaW50ZXItZXZlbnRzLW5vbmUgYWJzb2x1dGUgbGVmdC0wIHRvcC0wIG92ZXJmbG93LXZpc2libGVcIlxyXG4gICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogMSwgaGVpZ2h0OiAxIH19XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIDxnPlxyXG4gICAgICAgICAgICAgIDxsaW5lIHgxPVwiLThcIiB5MT1cIjBcIiB4Mj1cIjhcIiB5Mj1cIjBcIiBzdHJva2U9e3N0cm9rZUNvbG9yfSBzdHJva2VXaWR0aD1cIjFcIiAvPlxyXG4gICAgICAgICAgICAgIDxsaW5lIHgxPVwiMFwiIHkxPVwiLThcIiB4Mj1cIjBcIiB5Mj1cIjhcIiBzdHJva2U9e3N0cm9rZUNvbG9yfSBzdHJva2VXaWR0aD1cIjFcIiAvPlxyXG4gICAgICAgICAgICAgIDxjaXJjbGUgY3g9XCIwXCIgY3k9XCIwXCIgcj1cIjJcIiBmaWxsPXthY3RpdmUgPyAnIzAwZTVmZicgOiAnIzM4YmRmOCd9IC8+XHJcbiAgICAgICAgICAgIDwvZz5cclxuICAgICAgICAgICAgPHBhdGhcclxuICAgICAgICAgICAgICByZWY9e3BhdGhSZWZ9XHJcbiAgICAgICAgICAgICAgZD1cIk0gMCAwIEwgNjAgLTQwIEwgMTAwIC00MFwiXHJcbiAgICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxyXG4gICAgICAgICAgICAgIHN0cm9rZT17c3Ryb2tlQ29sb3J9XHJcbiAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg9e3N0cm9rZVdpZHRofVxyXG4gICAgICAgICAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXHJcbiAgICAgICAgICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXthY3RpdmUgPyAnbGVhZGVyLWxpbmUtZmxvdycgOiB1bmRlZmluZWR9XHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgIDxsaW5lXHJcbiAgICAgICAgICAgICAgcmVmPXt0aWNrUmVmfVxyXG4gICAgICAgICAgICAgIHgxPVwiMTAwXCJcclxuICAgICAgICAgICAgICB5MT1cIi00NlwiXHJcbiAgICAgICAgICAgICAgeDI9XCIxMDBcIlxyXG4gICAgICAgICAgICAgIHkyPVwiLTM0XCJcclxuICAgICAgICAgICAgICBzdHJva2U9e3N0cm9rZUNvbG9yfVxyXG4gICAgICAgICAgICAgIHN0cm9rZVdpZHRoPXtzdHJva2VXaWR0aCArIDAuNX1cclxuICAgICAgICAgICAgICBvcGFjaXR5PXthY3RpdmUgPyAnMScgOiByZXN0VGlja09wYWNpdHl9XHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICA8L3N2Zz5cclxuXHJcbiAgICAgICAgICB7LyogSW1wZXJhdGl2ZWx5IHBvc2l0aW9uZWQgYmFkZ2Ugd3JhcHBlciAqL31cclxuICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgcmVmPXtiYWRnZVdyYXBwZXJSZWZ9XHJcbiAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgICAgdG9wOiAnMHB4JyxcclxuICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgxMjBweCwgLTQwcHgsIDApJyxcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgPGRpdiByZWY9e2J1dHRvbkNvbnRhaW5lclJlZn0+XHJcbiAgICAgICAgICAgICAgPEhvdHNwb3RCdXR0b25cclxuICAgICAgICAgICAgICAgIGRlZj17ZGVmfVxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWQ9e3NlbGVjdGVkfVxyXG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiBzZXRIb3ZlcmVkKHRydWUpfVxyXG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoKSA9PiBzZXRIb3ZlcmVkKGZhbHNlKX1cclxuICAgICAgICAgICAgICAgIHRvbmU9e3RvbmV9XHJcbiAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9IdG1sPlxyXG4gICAgPC9ncm91cD5cclxuICApXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgNCDigJQgU3RhdGlvbiAxIGNsaWNrYWJsZSAzRCBzcGF0aWFsIGhvdHNwb3QgYW5ub3RhdGlvbnMgd2l0aCBkeW5hbWljIHNhZmUtYXJlYSBsZWFkZXIgbGluZXMuXHJcbiAqL1xyXG5jb25zdCBTVEFUSU9OX1JFUExBQ0VEID0gbmV3IFNldChbJ3JvdG9yJywgJ21vdG9yLWhvdXNpbmcnLCAnZmxhbmdlJywgJ2dlYXJib3gtaG91c2luZyddKVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEhvdHNwb3RzKCkge1xyXG4gIGNvbnN0IFtyb2xlTWFwLCBzZXRSb2xlTWFwXSA9IHVzZVN0YXRlPFJvbGVNYXBFbnRyeVtdPihbXSlcclxuICBjb25zdCBjaGFwdGVyID0gdXNlU2Nyb2xsVmFsdWUoJ2NoYXB0ZXInKVxyXG4gIGNvbnN0IHByb2dyZXNzID0gdXNlU2Nyb2xsVmFsdWUoJ3Byb2dyZXNzJylcclxuICBjb25zdCBzZWxlY3RlZCA9IHVzZVNjcm9sbFZhbHVlKCdob3RzcG90SWQnKVxyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgbGV0IGFsaXZlID0gdHJ1ZVxyXG4gICAgZmV0Y2goJy9tb2RlbHMvcm9sZS1tYXAuanNvbicpXHJcbiAgICAgIC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UuanNvbigpIGFzIFByb21pc2U8Um9sZU1hcEVudHJ5W10+KVxyXG4gICAgICAudGhlbigoZW50cmllcykgPT4ge1xyXG4gICAgICAgIGlmIChhbGl2ZSkgc2V0Um9sZU1hcChlbnRyaWVzKVxyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goKCkgPT4ge1xyXG4gICAgICAgIC8qIGhvdHNwb3RzIHNpbXBseSBkb24ndCByZW5kZXIgd2l0aG91dCB0aGUgcm9sZSBtYXAgKi9cclxuICAgICAgfSlcclxuICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgIGFsaXZlID0gZmFsc2VcclxuICAgIH1cclxuICB9LCBbXSlcclxuXHJcbiAgY29uc3Qgbm9ybWFsaXplT2NjdXJyZW5jZSA9IChuYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4gbmFtZS5yZXBsYWNlKC9eb2NjdXJyZW5jZSBvZiAvaSwgJycpXHJcblxyXG4gIGNvbnN0IGFuY2hvcnMgPSB1c2VNZW1vKCgpID0+IHtcclxuICAgIGNvbnN0IHJvd3NGb3IgPSAobmFtZTogc3RyaW5nKTogUm9sZU1hcEVudHJ5W10gPT4ge1xyXG4gICAgICBjb25zdCBleGFjdCA9IHJvbGVNYXAuZmlsdGVyKChlbnRyeSkgPT4gZW50cnkub2NjdXJyZW5jZSA9PT0gbmFtZSlcclxuICAgICAgaWYgKGV4YWN0Lmxlbmd0aCA+IDApIHJldHVybiBleGFjdFxyXG4gICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplT2NjdXJyZW5jZShuYW1lKVxyXG4gICAgICByZXR1cm4gcm9sZU1hcC5maWx0ZXIoKGVudHJ5KSA9PiBub3JtYWxpemVPY2N1cnJlbmNlKGVudHJ5Lm9jY3VycmVuY2UpID09PSBub3JtYWxpemVkKVxyXG4gICAgfVxyXG4gICAgLy8gSkctMDM1IGtlZXBzIHRoZSBkZWNvcmF0aXZlIHdyZW5jaCBmcmFtZXMgcmVwbGFjZWQgYnkgUzHigJNTNi4gSkctMDM2J3NcclxuICAgIC8vIG93bmVyIHJ1bGluZyBtYWtlcyB0aGUgcm90b3IgdGhlIG9uZSBkZWxpYmVyYXRlIGV4Y2VwdGlvbjsgdGhlIGVuY2xvc3VyZVxyXG4gICAgLy8gYW5kIE0yNDkga2VlcGVycyB3ZXJlIHByZXZpb3VzbHkgYmxvY2tlZCBvbmx5IGJ5IHRoZSBsZWdhY3kgY2hhcHRlciBnYXRlLlxyXG4gICAgLy8gQUNUSVZFX0hPVFNQT1RfSURTIGdhdGVzIG9ubHkgdGhpcyBTdGF0aW9uIDEgbGVnYWN5IGxheWVyLiBUaGUgU3RhdGlvbiAyXHJcbiAgICAvLyBlbmNsb3N1cmUgYW5kIFN0YXRpb24gMyBNMjQ5IHN0YWdlIHByb2R1Y2VycyBvd24gdGhlaXIgZXh0cmEgY2xpY2thYmxlXHJcbiAgICAvLyBjYWxsb3V0IGJhZGdlcyBpbmRlcGVuZGVudGx5OyBib3RoIHJlbWFpbiBhY3RpdmUgcGVyIG93bmVyIGNvbmZpcm1hdGlvblxyXG4gICAgLy8gMjAyNi0xMC0wOCBhbmQgYXJlIGludGVudGlvbmFsbHkgbm90IGZpbHRlcmVkIGhlcmUuXHJcbiAgICByZXR1cm4gSE9UU1BPVFMuZmlsdGVyKChoKSA9PiBBQ1RJVkVfSE9UU1BPVF9JRFMuaGFzKGguaWQpICYmICghU1RBVElPTl9SRVBMQUNFRC5oYXMoaC5pZCkgfHwgaC5pZCA9PT0gJ3JvdG9yJykpLmZsYXRNYXAoKGRlZikgPT4ge1xyXG4gICAgICBjb25zdCByb3dzID0gcm93c0ZvcihkZWYub2NjdXJyZW5jZSlcclxuICAgICAgaWYgKHJvd3MubGVuZ3RoID09PSAwKSByZXR1cm4gW11cclxuICAgICAgbGV0IGVudHJ5ID0gcm93c1swXVxyXG4gICAgICBpZiAocm93cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgaWYgKGRlZi5waWNrTmVhcikge1xyXG4gICAgICAgICAgY29uc3QgW3B4LCBweSwgcHpdID0gZGVmLnBpY2tOZWFyXHJcbiAgICAgICAgICBlbnRyeSA9IHJvd3MucmVkdWNlKChiZXN0LCByb3cpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZCA9IChyOiBSb2xlTWFwRW50cnkpOiBudW1iZXIgPT5cclxuICAgICAgICAgICAgICAoci5iYm94Q2VudGVyWzBdIC0gcHgpICoqIDIgKyAoci5iYm94Q2VudGVyWzFdIC0gcHkpICoqIDIgKyAoci5iYm94Q2VudGVyWzJdIC0gcHopICoqIDJcclxuICAgICAgICAgICAgcmV0dXJuIGQocm93KSA8IGQoYmVzdCkgPyByb3cgOiBiZXN0XHJcbiAgICAgICAgICB9LCByb3dzWzBdKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICAgIGBbSG90c3BvdHNdICR7ZGVmLm9jY3VycmVuY2V9IG1hdGNoZXMgJHtyb3dzLmxlbmd0aH0gcm9sZS1tYXAgcm93cyB3aXRoIG5vIHBpY2tOZWFyIOKAlCB1c2luZyB0aGUgZmlyc3RgLFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gW3sgZGVmLCBlbnRyeSB9XVxyXG4gICAgfSlcclxuICB9LCBbcm9sZU1hcF0pXHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8PlxyXG4gICAgICB7YW5jaG9yc1xyXG4gICAgICAgIC5maWx0ZXIoXHJcbiAgICAgICAgICAoeyBkZWYgfSkgPT5cclxuICAgICAgICAgICAgcHJvZ3Jlc3M+MC4xMiAmJiAoZGVmLndpbmRvd1xyXG4gICAgICAgICAgICAgID8gcHJvZ3Jlc3MgPj0gZGVmLndpbmRvd1swXSAmJiBwcm9ncmVzcyA8PSBkZWYud2luZG93WzFdXHJcbiAgICAgICAgICAgICAgOiBkZWYuY2hhcHRlcnMuaW5jbHVkZXMoY2hhcHRlciBhcyBDaGFwdGVySW5kZXgpKSxcclxuICAgICAgICApXHJcbiAgICAgICAgLm1hcCgoeyBkZWYsIGVudHJ5IH0pID0+IHtcclxuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEhPVFNQT1RfQ09ORklHW2RlZi5pZF0gPz8geyBkeDogMTgwLCBkeTogLTgwLCB1bml0T2Zmc2V0OiAwIH1cclxuICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxTcGF0aWFsSG90c3BvdEFuY2hvclxyXG4gICAgICAgICAgICAgIGtleT17ZGVmLmlkfVxyXG4gICAgICAgICAgICAgIGRlZj17ZGVmfVxyXG4gICAgICAgICAgICAgIHBvc2l0aW9uPXtlbnRyeS5iYm94Q2VudGVyfVxyXG4gICAgICAgICAgICAgIGFuY2hvck9mZnNldD17Y29uZmlnLm9mZnNldH1cclxuICAgICAgICAgICAgICB1bml0T2Zmc2V0PXtjb25maWcudW5pdE9mZnNldH1cclxuICAgICAgICAgICAgICBub21pbmFsRHg9e2NvbmZpZy5keH1cclxuICAgICAgICAgICAgICBub21pbmFsRHk9e2NvbmZpZy5keX1cclxuICAgICAgICAgICAgICBzZWxlY3RlZD17c2VsZWN0ZWQgPT09IGRlZi5pZH1cclxuICAgICAgICAgICAgLz5cclxuICAgICAgICAgIClcclxuICAgICAgICB9KX1cclxuICAgIDwvPlxyXG4gIClcclxufVxyXG5cclxuIl0sImZpbGUiOiJDOi9Vc2Vycy9NYXJraW11cy8uYnV6ei9SRVBPUy9qZ3VuLXBvcnRmb2xpby9zcmMvc2NlbmUvSG90c3BvdHMudHN4In0=