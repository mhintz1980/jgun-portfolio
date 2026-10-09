import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/Chapters.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=0ce3f7a6"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=0ce3f7a6"; const useState = __vite__cjsImport1_react["useState"];
import { ASSEMBLY_IDENTITY, CASE_STUDIES, CHAPTERS } from "/src/data/caseStudies.ts";
import { useQuality } from "/src/state/qualityStore.ts";
import { useScrollValue } from "/src/state/scrollStore.ts";
import { DRAWING_INTRO_WINDOW } from "/src/scene/drawing/introTimeline.ts";
import { SCROLL_TRACK_VH } from "/src/scene/drawing/scrollTracks.ts";
import { CHAPTER_RANGES, useNativeScrollChapter } from "/src/components/staticChapter.ts";
import { AuthorshipInline, AuthorshipNotes } from "/src/components/AuthorshipNotes.tsx";
const isShiftBeatOn = (progress) => progress >= 0.04 && progress <= 0.18;
const isExplodeBeatOn = (progress) => progress > 0.18 && progress <= 0.42;
const isLcdBeatOn = (progress) => progress > 0.44 && progress <= 0.51;
function BeatCaption({
  kicker,
  children
}) {
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed left-6 md:left-12 bottom-[9vh] z-10 pointer-events-none font-mono border-l-2 border-cyan-400 pl-3 [text-shadow:0_1px_8px_rgba(0,0,0,0.95)]", children: [
    /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] tracking-[0.25em] text-cyan-400 mb-1.5", children: kicker }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 57,
      columnNumber: 7
    }, this),
    children
  ] }, void 0, true, {
    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
    lineNumber: 56,
    columnNumber: 5
  }, this);
}
_c = BeatCaption;
function CaseStudyBody({ caseStudy }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "border-t border-slate-800/80 pt-4 mt-2", children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "text-sm md:text-base font-semibold text-slate-200 mb-1", children: caseStudy.headline }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 67,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 mb-3 leading-relaxed", children: caseStudy.oneLiner }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 70,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("ul", { className: "space-y-2 mb-4", children: caseStudy.bullets.map(
      (bullet) => /* @__PURE__ */ jsxDEV("li", { className: "flex items-start gap-2 text-xs text-slate-300 font-sans leading-normal", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-cyan-400 mt-0.5 shrink-0", children: "▸" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 74,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: bullet }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 75,
          columnNumber: 13
        }, this)
      ] }, bullet.slice(0, 32), true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
        lineNumber: 73,
        columnNumber: 9
      }, this)
    ) }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 71,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60", children: caseStudy.tags.map(
      (tag) => /* @__PURE__ */ jsxDEV(
        "span",
        {
          className: "text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2 py-0.5 rounded",
          children: tag
        },
        tag,
        false,
        {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 81,
          columnNumber: 9
        },
        this
      )
    ) }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 79,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
    lineNumber: 66,
    columnNumber: 5
  }, this);
}
_c2 = CaseStudyBody;
export function Chapters() {
  _s();
  const { tier, reducedMotion } = useQuality();
  const progress = useScrollValue("progress");
  const [openStudy, setOpenStudy] = useState(null);
  const isStaticMode = tier === "poster" || reducedMotion;
  const staticChapter = useNativeScrollChapter(isStaticMode);
  const gearboxStudy = CASE_STUDIES.find((cs) => cs.id === "gearbox");
  const shiftBeat = !isStaticMode && progress > DRAWING_INTRO_WINDOW.releaseEnd && isShiftBeatOn(progress);
  const explodeBeat = !isStaticMode && isExplodeBeatOn(progress);
  const lcdBeat = !isStaticMode && isLcdBeatOn(progress);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(AuthorshipNotes, {}, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 139,
      columnNumber: 7
    }, this),
    !isStaticMode ? /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 pointer-events-none z-10 grid grid-cols-12 p-6 md:p-12 items-center", children: CHAPTERS.map((chapterDef) => {
      const caseStudy = CASE_STUDIES.find((cs) => cs.chapter === chapterDef.index);
      const [start, end] = CHAPTER_RANGES[chapterDef.index] ?? [0, 1];
      const fadeIn = Math.min(Math.max((progress - start) / 0.035, 0), 1);
      const fadeOut = Math.min(Math.max((end - progress) / 0.035, 0), 1);
      const afterIntro = chapterDef.index === 0 ? Math.min(Math.max((progress - DRAWING_INTRO_WINDOW.releaseEnd) / 0.02, 0), 1) : 1;
      const opacity = Math.min(fadeIn, fadeOut) * afterIntro;
      if (opacity <= 1e-3) return null;
      const isMechanicalChapter = chapterDef.index === 0 || chapterDef.index === 1;
      if (isMechanicalChapter) {
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "col-span-12 md:col-span-4 max-w-[30vw] max-md:max-w-full self-start pt-[9vh] flex flex-col transition-opacity duration-150",
            style: { opacity },
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-none [text-shadow:0_1px_10px_rgba(0,0,0,0.9)]", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 font-mono text-xs text-cyan-400 mb-2", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "tracking-[0.2em]", children: chapterDef.label }, void 0, false, {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                    lineNumber: 173,
                    columnNumber: 23
                  }, this),
                  chapterDef.index === 0 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600", children: "//" }, void 0, false, {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                      lineNumber: 176,
                      columnNumber: 27
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-cyan-200 tracking-wider", children: ASSEMBLY_IDENTITY.machine }, void 0, false, {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                      lineNumber: 177,
                      columnNumber: 27
                    }, this)
                  ] }, void 0, true, {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                    lineNumber: 175,
                    columnNumber: 21
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                  lineNumber: 172,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("h2", { className: "text-xl md:text-2xl font-bold tracking-tight text-slate-100 mb-2 font-sans leading-tight", children: chapterDef.index === 0 ? "From drawing to machining" : chapterDef.title }, void 0, false, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                  lineNumber: 181,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-300 mb-3 leading-relaxed font-sans", children: chapterDef.subtitle }, void 0, false, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                  lineNumber: 184,
                  columnNumber: 21
                }, this),
                chapterDef.index === 0 && gearboxStudy && /* @__PURE__ */ jsxDEV("p", { className: "text-sm italic text-slate-200 mb-3 leading-relaxed font-sans", children: gearboxStudy.oneLiner }, void 0, false, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                  lineNumber: 188,
                  columnNumber: 19
                }, this),
                chapterDef.index === 0 && /* @__PURE__ */ jsxDEV("p", { className: "font-mono text-xs tracking-wider text-slate-400 border-l-2 border-cyan-500/40 pl-3", children: ASSEMBLY_IDENTITY.spec }, void 0, false, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                  lineNumber: 193,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 171,
                columnNumber: 19
              }, this),
              chapterDef.index === 1 && caseStudy && /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-auto mt-4", children: [
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    type: "button",
                    "aria-expanded": openStudy === caseStudy.id,
                    "aria-controls": "gearbox-case-study",
                    onClick: () => setOpenStudy(openStudy === caseStudy.id ? null : caseStudy.id),
                    className: "font-mono text-[10px] tracking-[0.2em] text-cyan-300 border border-cyan-400/50 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded transition-colors hover:border-cyan-300 hover:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none",
                    children: openStudy === caseStudy.id ? "[ − CLOSE CASE STUDY ]" : "[ + CASE STUDY ]"
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                    lineNumber: 204,
                    columnNumber: 23
                  },
                  this
                ),
                openStudy === caseStudy.id && /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    id: "gearbox-case-study",
                    className: "mt-3 max-w-[30rem] bg-slate-950/85 border border-slate-800/80 p-5 rounded-xl backdrop-blur-md shadow-2xl",
                    children: /* @__PURE__ */ jsxDEV(CaseStudyBody, { caseStudy }, void 0, false, {
                      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                      lineNumber: 218,
                      columnNumber: 27
                    }, this)
                  },
                  void 0,
                  false,
                  {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                    lineNumber: 214,
                    columnNumber: 19
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 203,
                columnNumber: 17
              }, this)
            ]
          },
          chapterDef.index,
          true,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
            lineNumber: 166,
            columnNumber: 15
          },
          this
        );
      }
      return /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "col-span-12 md:col-span-5 max-w-[42vw] max-md:max-w-full flex flex-col justify-center transition-opacity duration-150",
          style: { opacity },
          children: /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-auto border p-4 md:p-6 rounded-xl border-slate-800/80 bg-slate-950/80 backdrop-blur-md shadow-2xl", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 font-mono text-xs text-cyan-400 mb-2", children: /* @__PURE__ */ jsxDEV("span", { className: "tracking-[0.2em]", children: chapterDef.label }, void 0, false, {
              fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
              lineNumber: 236,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
              lineNumber: 235,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mb-3 font-sans leading-tight", children: chapterDef.title }, void 0, false, {
              fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
              lineNumber: 240,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-300 mb-4 leading-relaxed font-sans", children: chapterDef.subtitle }, void 0, false, {
              fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
              lineNumber: 245,
              columnNumber: 19
            }, this),
            caseStudy && /* @__PURE__ */ jsxDEV(CaseStudyBody, { caseStudy }, void 0, false, {
              fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
              lineNumber: 250,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
            lineNumber: 233,
            columnNumber: 17
          }, this)
        },
        chapterDef.index,
        false,
        {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 228,
          columnNumber: 13
        },
        this
      );
    }) }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 143,
      columnNumber: 7
    }, this) : (
      /* Reduced Motion / Poster Tier Static Fallback.
         JG-022: exactly one card at a time, held in a fixed pointer-events-none
         overlay so it stays visible through the whole native scroll track. In normal
         document flow the card sat at the document top and scrolled out of view —
         chapters 1–3 swapped content invisibly above the viewport (poster e2e,
         2026-09-28). The card's translucent panel reads over the static drawing
         frame behind it; its own scroll area keeps tall case studies reachable on
         small viewports. */
      /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-10 flex items-center p-6 md:p-12 pointer-events-none", children: CHAPTERS.map((chapterDef) => {
        const caseStudy = CASE_STUDIES.find((cs) => cs.chapter === chapterDef.index);
        if (staticChapter !== chapterDef.index) return null;
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "pointer-events-auto max-w-xl max-h-[calc(100vh-9rem)] overflow-y-auto bg-slate-950/85 border border-slate-800/80 p-6 md:p-8 rounded-xl",
            children: [
              chapterDef.index === 0 && /* @__PURE__ */ jsxDEV(AuthorshipInline, {}, void 0, false, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 276,
                columnNumber: 44
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "font-mono text-xs tracking-[0.2em] text-cyan-400 mb-2", children: chapterDef.label }, void 0, false, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 277,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mb-3 font-sans", children: chapterDef.index === 0 ? "From drawing to machining" : chapterDef.title }, void 0, false, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 278,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-300 mb-4 leading-relaxed font-sans", children: chapterDef.subtitle }, void 0, false, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 279,
                columnNumber: 17
              }, this),
              chapterDef.index === 0 && gearboxStudy && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-200 mb-4 leading-relaxed", children: gearboxStudy.oneLiner }, void 0, false, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                  lineNumber: 282,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("details", { className: "authorship-details", children: [
                  /* @__PURE__ */ jsxDEV("summary", { children: "Read my machining decisions" }, void 0, false, {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                    lineNumber: 284,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV(CaseStudyBody, { caseStudy: gearboxStudy }, void 0, false, {
                    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                    lineNumber: 285,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                  lineNumber: 283,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 281,
                columnNumber: 15
              }, this),
              caseStudy && /* @__PURE__ */ jsxDEV(CaseStudyBody, { caseStudy }, void 0, false, {
                fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
                lineNumber: 289,
                columnNumber: 31
              }, this)
            ]
          },
          chapterDef.index,
          true,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
            lineNumber: 272,
            columnNumber: 13
          },
          this
        );
      }) }, void 0, false, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
        lineNumber: 265,
        columnNumber: 7
      }, this)
    ),
    shiftBeat && /* @__PURE__ */ jsxDEV(BeatCaption, { kicker: "P000420 // 2-SPEED SHIFT MECHANISM", children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5 text-[11px]", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-cyan-200", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "inline-block h-2.5 w-2.5 rounded-sm bg-[#005DAA]" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 302,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "font-semibold", children: "LOWER GROOVE OSHA BLUE" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 303,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400", children: "· LOW SPEED" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 304,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
        lineNumber: 301,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-cyan-300/90 pl-4 text-[10px]", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-cyan-400", children: "▸" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 307,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: "3X @120° HELICAL CAM SLOTS" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 308,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
        lineNumber: 306,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-cyan-200", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "inline-block h-2.5 w-2.5 rounded-sm bg-[#C8102E]" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 311,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "font-semibold", children: "UPPER GROOVE OSHA RED" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 312,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400", children: "· HIGH SPEED" }, void 0, false, {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 313,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
        lineNumber: 310,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 300,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 299,
      columnNumber: 7
    }, this),
    explodeBeat && /* @__PURE__ */ jsxDEV(BeatCaption, { kicker: "REAR EXTRACTION — DRIVELINE ORDER", children: /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] tracking-wider text-slate-300", children: "P003047 → P003045 → P001849 → K000004 → P001837 → P001836" }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 321,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 320,
      columnNumber: 7
    }, this),
    lcdBeat && /* @__PURE__ */ jsxDEV(BeatCaption, { kicker: "DIGITAL TELEMETRY // REAR ENDCAP", children: [
      /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] text-slate-200 font-semibold mb-1", children: "Smart-Tool Instrument Interface" }, void 0, false, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
        lineNumber: 329,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] tracking-wide text-slate-400", children: "MANOMETER LCD (BK11356) · MSP430 MCU · 3.7V LiPo CELL" }, void 0, false, {
        fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
        lineNumber: 330,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 328,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "relative z-0 pointer-events-none [&_:is(button,a,[role='button'])]:pointer-events-auto", children: [
      /* @__PURE__ */ jsxDEV(
        "section",
        {
          "data-intro": "b1b2",
          className: "pointer-events-none",
          style: { minHeight: `${SCROLL_TRACK_VH.intro}vh` }
        },
        void 0,
        false,
        {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 343,
          columnNumber: 9
        },
        this
      ),
      CHAPTERS.map(
        (chapterDef) => /* @__PURE__ */ jsxDEV(
          "section",
          {
            "data-chapter": chapterDef.index,
            className: "pointer-events-none",
            style: { minHeight: `${SCROLL_TRACK_VH.chapters[chapterDef.index] ?? SCROLL_TRACK_VH.chapters[1]}vh` }
          },
          chapterDef.index,
          false,
          {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
            lineNumber: 349,
            columnNumber: 9
          },
          this
        )
      ),
      /* @__PURE__ */ jsxDEV(
        "footer",
        {
          className: "pointer-events-none flex items-end px-[8vw] pb-16",
          style: { height: `${SCROLL_TRACK_VH.footer}vh` },
          children: /* @__PURE__ */ jsxDEV("p", { className: "font-mono text-xs tracking-widest text-zinc-500", children: 'BUILT WITH REACT 19 · R3F · GSAP · LENIS — THE SAME HANDS THAT HOLD .001" TIR' }, void 0, false, {
            fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
            lineNumber: 361,
            columnNumber: 11
          }, this)
        },
        void 0,
        false,
        {
          fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
          lineNumber: 357,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
      lineNumber: 342,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx",
    lineNumber: 135,
    columnNumber: 5
  }, this);
}
_s(Chapters, "eegngLvsTOFovN/VNiSgkt95Fqs=", false, function() {
  return [useQuality, useScrollValue, useNativeScrollChapter];
});
_c3 = Chapters;
var _c, _c2, _c3;
$RefreshReg$(_c, "BeatCaption");
$RefreshReg$(_c2, "CaseStudyBody");
$RefreshReg$(_c3, "Chapters");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/components/Chapters.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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O0FBQUE7QUFBQSxVQUhoR3BCLFdBQVdFO0FBQUFBLFVBRGxCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFJeUc7QUFBQSxNQUUxRztBQUFBLE1BRUQ7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLFdBQVU7QUFBQSxVQUNWLE9BQU8sRUFBRW1CLFFBQVEsR0FBRzdELGdCQUFnQjhELE1BQU0sS0FBSztBQUFBLFVBRS9DLGlDQUFDLE9BQUUsV0FBVSxtREFBaUQsNkZBQTlEO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBRUE7QUFBQTtBQUFBLFFBTkY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BT0E7QUFBQSxTQXRCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBdUJBO0FBQUEsT0F0T0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQXVPQTtBQUVKO0FBQUNyQyxHQXRRZUQsVUFBUTtBQUFBLFVBQ1UzQixZQUNmQyxnQkFhS0ksc0JBQXNCO0FBQUE7QUFBQSxNQWY5QnNCO0FBQVEsSUFBQVosSUFBQVcsS0FBQXdDO0FBQUEsYUFBQW5ELElBQUE7QUFBQSxhQUFBVyxLQUFBO0FBQUEsYUFBQXdDLEtBQUEiLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsIkFTU0VNQkxZX0lERU5USVRZIiwiQ0FTRV9TVFVESUVTIiwiQ0hBUFRFUlMiLCJ1c2VRdWFsaXR5IiwidXNlU2Nyb2xsVmFsdWUiLCJEUkFXSU5HX0lOVFJPX1dJTkRPVyIsIlNDUk9MTF9UUkFDS19WSCIsIkNIQVBURVJfUkFOR0VTIiwidXNlTmF0aXZlU2Nyb2xsQ2hhcHRlciIsIkF1dGhvcnNoaXBJbmxpbmUiLCJBdXRob3JzaGlwTm90ZXMiLCJpc1NoaWZ0QmVhdE9uIiwicHJvZ3Jlc3MiLCJpc0V4cGxvZGVCZWF0T24iLCJpc0xjZEJlYXRPbiIsIkJlYXRDYXB0aW9uIiwia2lja2VyIiwiY2hpbGRyZW4iLCJfYyIsIkNhc2VTdHVkeUJvZHkiLCJjYXNlU3R1ZHkiLCJoZWFkbGluZSIsIm9uZUxpbmVyIiwiYnVsbGV0cyIsIm1hcCIsImJ1bGxldCIsInNsaWNlIiwidGFncyIsInRhZyIsIl9jMiIsIkNoYXB0ZXJzIiwiX3MiLCJ0aWVyIiwicmVkdWNlZE1vdGlvbiIsIm9wZW5TdHVkeSIsInNldE9wZW5TdHVkeSIsImlzU3RhdGljTW9kZSIsInN0YXRpY0NoYXB0ZXIiLCJnZWFyYm94U3R1ZHkiLCJmaW5kIiwiY3MiLCJpZCIsInNoaWZ0QmVhdCIsInJlbGVhc2VFbmQiLCJleHBsb2RlQmVhdCIsImxjZEJlYXQiLCJjaGFwdGVyRGVmIiwiY2hhcHRlciIsImluZGV4Iiwic3RhcnQiLCJlbmQiLCJmYWRlSW4iLCJNYXRoIiwibWluIiwibWF4IiwiZmFkZU91dCIsImFmdGVySW50cm8iLCJvcGFjaXR5IiwiaXNNZWNoYW5pY2FsQ2hhcHRlciIsImxhYmVsIiwibWFjaGluZSIsInRpdGxlIiwic3VidGl0bGUiLCJzcGVjIiwibWluSGVpZ2h0IiwiaW50cm8iLCJjaGFwdGVycyIsImhlaWdodCIsImZvb3RlciIsIl9jMyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDaGFwdGVycy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEFTU0VNQkxZX0lERU5USVRZLCBDQVNFX1NUVURJRVMsIENIQVBURVJTIH0gZnJvbSAnLi4vZGF0YS9jYXNlU3R1ZGllcydcbmltcG9ydCB0eXBlIHsgQ2FzZVN0dWR5IH0gZnJvbSAnLi4vdHlwZXMvcG9ydGZvbGlvJ1xuaW1wb3J0IHsgdXNlUXVhbGl0eSB9IGZyb20gJy4uL3N0YXRlL3F1YWxpdHlTdG9yZSdcbmltcG9ydCB7IHVzZVNjcm9sbFZhbHVlIH0gZnJvbSAnLi4vc3RhdGUvc2Nyb2xsU3RvcmUnXG5pbXBvcnQgeyBEUkFXSU5HX0lOVFJPX1dJTkRPVyB9IGZyb20gJy4uL3NjZW5lL2RyYXdpbmcvaW50cm9UaW1lbGluZSdcbmltcG9ydCB7IFNDUk9MTF9UUkFDS19WSCB9IGZyb20gJy4uL3NjZW5lL2RyYXdpbmcvc2Nyb2xsVHJhY2tzJ1xuaW1wb3J0IHsgQ0hBUFRFUl9SQU5HRVMsIHVzZU5hdGl2ZVNjcm9sbENoYXB0ZXIgfSBmcm9tICcuL3N0YXRpY0NoYXB0ZXInXG5pbXBvcnQgeyBBdXRob3JzaGlwSW5saW5lLCBBdXRob3JzaGlwTm90ZXMgfSBmcm9tICcuL0F1dGhvcnNoaXBOb3RlcydcblxuLyoqXG4gKiBTY3JvbGwtdHJhY2sgaGVpZ2h0cywgaW4gdmgsIGZvciB0aGUgZW1wdHkgc2VjdGlvbnMgdGhhdCBnaXZlIExlbmlzIGFuZCBTY3JvbGxUcmlnZ2VyIHRoZWlyXG4gKiBkaXN0YW5jZS4gVGhleSBhcmUgREVSSVZFRCwgbm90IGxpdGVyYWxzOiBgZGVyaXZlU2Nyb2xsVHJhY2tzKClgIGluXG4gKiBgc3JjL3NjZW5lL2RyYXdpbmcvc2Nyb2xsVHJhY2tzLnRzYCByZS1kZXJpdmVzIHRoZW0gZnJvbSBgSU5UUk9fU0NST0xMX1NIQVJFYCBhZ2FpbnN0IHRoZVxuICogMC4zMC1zaGFyZSBKRy0wMjYgYW5jaG9ycyAodGhlIGRlcml2YXRpb24gYW5kIGl0cyBjb250cmFjdCBsaXZlIGluIHRoYXQgbW9kdWxlLCBwaW5uZWQgYnlcbiAqIGBzY3JvbGxUcmFja3MudGVzdC50c2ApLlxuICpcbiAqIFRoZSBwcm9wZXJ0eSB0aGF0IG1hdHRlcnM6IGBpbnRyb2AgaXMgYSBkZWRpY2F0ZWQgdHJhY2sgc28gdGhlIGRyYXdpbmcgc2VxdWVuY2UgbmV2ZXIgaGFzIHRvXG4gKiBzaGFyZSBjaGFwdGVyIDAncyBzZWN0aW9uLCBhbmQgYFtkYXRhLWNoYXB0ZXI9XCIxXCJdYCDigJQgdGhlIGVsZW1lbnQgdGhlIGhlcm8gR1NBUCBTY3JvbGxUcmlnZ2VyXG4gKiBtZWFzdXJlcyDigJQgb3BlbnMgYW5kIGNsb3NlcyBpbnNpZGUgdGhlIHBhY2VkIHdpbmRvdyB0aGUgcmV0YWluZWQgQ0guMDIgdGltZWxpbmUgd2FzIGF1dGhvcmVkXG4gKiBhbmQgdmVyaWZpZWQgYWdhaW5zdCAoMC4xNzcwMjkg4oaSIDAuNDU4NDI5KSwgd2l0aCBpdHMgdHJhbnNpdCBvcGVuaW5nIGFmdGVyIHRoZSBpbnRybyByZWxlYXNlXG4gKiBzbyB0aGUgZmlyc3QgcG9zdC1oYW5kb2ZmIGZyYW1lIGNhcnJpZXMgbm8gcGFydGlhbGx5IHNjcnViYmVkIG1lY2hhbmlzbS5cbiAqXG4gKiBEb2N1bWVudCBoZWlnaHQgc3RheXMgMzEyMHZoIChzY3JvbGwgZGlzdGFuY2UgMzAyMHZoKSBhdCBldmVyeSBzaGFyZSwgdXAgZnJvbSAyMDIwdmggLyAxOTIwdmguXG4gKi9cblxuLyoqXG4gKiBDaGFwdGVyIGFjdGl2ZSBzY3JvbGwgcHJvZ3Jlc3MgcmFuZ2VzIFtzdGFydCwgZW5kXSBvbiB0aGUgZ2xvYmFsIDAuLjEgc2Nyb2xsIHRpbWVsaW5lLlxuICogT3BhY2l0eSBjbGFtcHMgc21vb3RobHkgaW5zaWRlIGFuZCBmYWRlcyBiZXR3ZWVuIGFkamFjZW50IGNoYXB0ZXIgYm91bmRhcmllcy5cbiAqIE5vdyBzaGFyZWQgd2l0aCB0aGUgc3RhdGljIGZhbGxiYWNrIOKAlCBzZWUgLi9zdGF0aWNDaGFwdGVyLnRzLlxuICovXG5cbi8qKlxuICogT3BlbmluZyBtZWNoYW5pY2FsIGJlYXRzIChKRy0wMTQpIOKAlCB0aGUgb25lLWFjdGl2ZS1hdC1hLXRpbWUgYW5ub3RhdGlvbnNcbiAqIHRoYXQgYWNjb21wYW55IHRoZSByaW5nLXNoaWZ0LCBleHRyYWN0aW9uLCBhbmQgcmVhci1MQ0QgZHdlbGwuIFdpbmRvd3MgYXJlXG4gKiBtZWFzdXJlZCBhZ2FpbnN0IHRoZSBsaXZlIHRpbWVsaW5lOiByaW5nIHN3aXRjaCB0cmF2ZWxzIDAuMDXihpIwLjE3LCB0aGVcbiAqIHJlYXIgZXh0cmFjdGlvbiBjb21wbGV0ZXMgYXQg4omIMC40MTYsIGFuZCB0aGUgTENEIG9yYml0IHJ1bnNcbiAqIExDRF9SRVZFQUxfV0lORE9XIDAuNDIw4oaSMC41MjUgKGNhc2VTdHVkaWVzLnRzKS4gS2VwdCBhcyB0cmFuc3BhcmVudFxuICogYm90dG9tLWxlZnQgZWRnZSBjYXB0aW9ucyDigJQgbmV2ZXIgYSBmaWxsZWQgcGFuZWwgb3ZlciB0aGUgbWVjaGFuaXNtXG4gKiAoZ2R0LWFubm90YXRpb24tc3R5bGUubWQ6IGFubm90YXRpb24gbWF5IGlkZW50aWZ5IHRoZSBwYXJ0IGJ1dCBub3QgY292ZXJcbiAqIHRoZSBmZWF0dXJlKS5cbiAqL1xuY29uc3QgaXNTaGlmdEJlYXRPbiA9IChwcm9ncmVzczogbnVtYmVyKTogYm9vbGVhbiA9PiBwcm9ncmVzcyA+PSAwLjA0ICYmIHByb2dyZXNzIDw9IDAuMThcbmNvbnN0IGlzRXhwbG9kZUJlYXRPbiA9IChwcm9ncmVzczogbnVtYmVyKTogYm9vbGVhbiA9PiBwcm9ncmVzcyA+IDAuMTggJiYgcHJvZ3Jlc3MgPD0gMC40MlxuY29uc3QgaXNMY2RCZWF0T24gPSAocHJvZ3Jlc3M6IG51bWJlcik6IGJvb2xlYW4gPT4gcHJvZ3Jlc3MgPiAwLjQ0ICYmIHByb2dyZXNzIDw9IDAuNTFcblxuLyoqIEJvdHRvbS1sZWZ0IGVkZ2UgY2FwdGlvbiBmb3IgdGhlIGFjdGl2ZSBtZWNoYW5pY2FsIGJlYXQuICovXG5mdW5jdGlvbiBCZWF0Q2FwdGlvbih7XG4gIGtpY2tlcixcbiAgY2hpbGRyZW4sXG59OiB7XG4gIGtpY2tlcjogc3RyaW5nXG4gIGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGVcbn0pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGxlZnQtNiBtZDpsZWZ0LTEyIGJvdHRvbS1bOXZoXSB6LTEwIHBvaW50ZXItZXZlbnRzLW5vbmUgZm9udC1tb25vIGJvcmRlci1sLTIgYm9yZGVyLWN5YW4tNDAwIHBsLTMgW3RleHQtc2hhZG93OjBfMXB4XzhweF9yZ2JhKDAsMCwwLDAuOTUpXVwiPlxuICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdHJhY2tpbmctWzAuMjVlbV0gdGV4dC1jeWFuLTQwMCBtYi0xLjVcIj57a2lja2VyfTwvcD5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG4vKiogQ2FzZS1zdHVkeSBib2R5IHNoYXJlZCBieSB0aGUgb24tZGVtYW5kIHN1cmZhY2UgYW5kIHRoZSBzdGF0aWMgZmFsbGJhY2suICovXG5mdW5jdGlvbiBDYXNlU3R1ZHlCb2R5KHsgY2FzZVN0dWR5IH06IHsgY2FzZVN0dWR5OiBDYXNlU3R1ZHkgfSkge1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiYm9yZGVyLXQgYm9yZGVyLXNsYXRlLTgwMC84MCBwdC00IG10LTJcIj5cbiAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXNtIG1kOnRleHQtYmFzZSBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtMjAwIG1iLTFcIj5cbiAgICAgICAge2Nhc2VTdHVkeS5oZWFkbGluZX1cbiAgICAgIDwvaDM+XG4gICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG1iLTMgbGVhZGluZy1yZWxheGVkXCI+e2Nhc2VTdHVkeS5vbmVMaW5lcn08L3A+XG4gICAgICA8dWwgY2xhc3NOYW1lPVwic3BhY2UteS0yIG1iLTRcIj5cbiAgICAgICAge2Nhc2VTdHVkeS5idWxsZXRzLm1hcCgoYnVsbGV0KSA9PiAoXG4gICAgICAgICAgPGxpIGtleT17YnVsbGV0LnNsaWNlKDAsIDMyKX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtMiB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGZvbnQtc2FucyBsZWFkaW5nLW5vcm1hbFwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1jeWFuLTQwMCBtdC0wLjUgc2hyaW5rLTBcIj7ilrg8L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj57YnVsbGV0fTwvc3Bhbj5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICApKX1cbiAgICAgIDwvdWw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0xLjUgcHQtMiBib3JkZXItdCBib3JkZXItc2xhdGUtODAwLzYwXCI+XG4gICAgICAgIHtjYXNlU3R1ZHkudGFncy5tYXAoKHRhZykgPT4gKFxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBrZXk9e3RhZ31cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtbW9ubyB0ZXh0LWN5YW4tNDAwIGJnLWN5YW4tOTUwLzUwIGJvcmRlciBib3JkZXItY3lhbi04MDAvNTAgcHgtMiBweS0wLjUgcm91bmRlZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3RhZ31cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICkpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuLyoqXG4gKiBMZWZ0LUNvbHVtbiBOYXJyYXRpdmUgR3JpZCAoTWlsZXN0b25lIDUpICsgb3BlbmluZyBiZWF0IGNhcHRpb25zIChKRy0wMTQpLlxuICpcbiAqIENILjAzL0NILjA0IGtlZXAgdGhlIDUtY29sdW1uIGdsYXNzIGNhcmRzLiBDSC4wMS9DSC4wMiDigJQgdGhlIGNoYXB0ZXJzIHdob3NlXG4gKiBzY3JvbGwgd2luZG93cyBjYXJyeSB0aGUgcmluZy1zd2l0Y2ggYW5kIGV4dHJhY3Rpb24gbWVjaGFuaWNzIOKAlCByZW5kZXIgYXNcbiAqIFRSQU5TUEFSRU5UIHRvcC1sZWZ0IGVkZ2UgY2FwdGlvbnMgKG5vIGZpbGwsIG5vIGJhY2tkcm9wIGJsdXIpIHNvIHRoZVxuICogbWVjaGFuaXNtIGlzIG5ldmVyIGNvdmVyZWQ7IHRoZSBnZWFyYm94IGNhc2Ugc3R1ZHkgbW92ZXMgYmVoaW5kIGFuXG4gKiBvbi1kZW1hbmQgYFsgKyBDQVNFIFNUVURZIF1gIGRpc2Nsb3N1cmUuIFRoZSBhY3RpdmUgbWVjaGFuaWNhbCBiZWF0IGdldHMgYVxuICogYm90dG9tLWxlZnQgZWRnZSBjYXB0aW9uLCBvbmUgYXQgYSB0aW1lLlxuICpcbiAqIFRoZSBiYWNrZ3JvdW5kIHNlY3Rpb25zIGJlbG93IHByb3ZpZGUgdGhlIGRvY3VtZW50J3MgZW50aXJlIHNjcm9sbCB0cmFjayBmb3IgTGVuaXMgYW5kIEdTQVBcbiAqIFNjcm9sbFRyaWdnZXI7IHRoZWlyIGhlaWdodHMgYXJlIGRlcml2ZWQgaW4gYHNjcm9sbFRyYWNrcy50c2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBDaGFwdGVycygpIHtcbiAgY29uc3QgeyB0aWVyLCByZWR1Y2VkTW90aW9uIH0gPSB1c2VRdWFsaXR5KClcbiAgY29uc3QgcHJvZ3Jlc3MgPSB1c2VTY3JvbGxWYWx1ZSgncHJvZ3Jlc3MnKVxuICBjb25zdCBbb3BlblN0dWR5LCBzZXRPcGVuU3R1ZHldID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcblxuICBjb25zdCBpc1N0YXRpY01vZGUgPSB0aWVyID09PSAncG9zdGVyJyB8fCByZWR1Y2VkTW90aW9uXG5cbiAgLy8gSkctMDIyOiB0aGUgc3RhdGljIHRpZXJzIChwb3N0ZXIgQU5EIHJlZHVjZWQgbW90aW9uKSB1bm1vdW50IFNjcm9sbFJpZ1xuICAvLyAoTGVuaXMvU2Nyb2xsVHJpZ2dlciksIHNvIGBjaGFwdGVyYCBpbiB0aGUgc2Nyb2xsIHN0b3JlIHN0YXlzIGxvY2tlZCBhdCAwXG4gIC8vIGFuZCB0aGUgc3RhdGljIGNhcmQgYmVsb3cgd291bGQgbmV2ZXIgYWR2YW5jZS4gVGhpcyB0aWVyLW9ubHkgbmF0aXZlLXNjcm9sbFxuICAvLyBob29rIGRlcml2ZXMgdGhlIGFjdGl2ZSBjaGFwdGVyIGZyb20gdGhlIHNhbWUgQ0hBUFRFUl9SQU5HRVMgdGhlIGZ1bGwtbW90aW9uXG4gIC8vIHBhdGggZ2F0ZXMgY2FyZHMgYnksIG1hcHBlZCB0aHJvdWdoIHBhY2VkUHJvZ3Jlc3MgbGlrZSBTY3JvbGxSaWcgZG9lc1xuICAvLyAoSkctMDI2KS4gRGVsaWJlcmF0ZWx5IGxvY2FsIHN0YXRlIOKAlCBubyBzdG9yZSB3cml0ZXMsIHNvIHRoZSAzRCB3b3JsZFxuICAvLyBzdGF5cyBwaW5uZWQgdG8gU3RhdGlvbiAxIGluIHRoZXNlIHRpZXJzIChwbGFuOiBzdGF0aWMgY2FyZHMgb25seSwgbm9cbiAgLy8gY2FudmFzIHNwaW4tdXApLCBhbmQgdGhlIGZ1bGwtbW90aW9uIHBhdGggaXMgdW50b3VjaGVkLlxuICBjb25zdCBzdGF0aWNDaGFwdGVyID0gdXNlTmF0aXZlU2Nyb2xsQ2hhcHRlcihpc1N0YXRpY01vZGUpXG5cbiAgLy8gVGhlIGdlYXJib3ggaXMgdGhlIG1haW4gSkd1biBuYXJyYXRpdmUuIEl0cyBvbmUtbGluZXIgY2FycmllcyB0aGUgY29uY2lzZSBmaXJzdC1wZXJzb25cbiAgLy8gZW5naW5lZXJpbmcgZGVjaXNpb24gKHNpbmdsZSBzZXR1cCBmb3IgYSBnZWFyIGFuZCBpdHMgYmVhcmluZyBsYW5kLCBmaW5pc2ggdGhlIGNsdXRjaCBob3VzaW5nXG4gIC8vIGFmdGVyIGhlYXQtdHJlYXQpOyB0aGUgZGVlcGVyIGV4cGxhbmF0b3J5IGJ1bGxldHMgc3RheSBpbiB0aGUgb24tZGVtYW5kIGNhc2Ugc3R1ZHkuXG4gIGNvbnN0IGdlYXJib3hTdHVkeSA9IENBU0VfU1RVRElFUy5maW5kKChjcykgPT4gY3MuaWQgPT09ICdnZWFyYm94JylcblxuICAvLyBUaGUgc2hpZnQgYmVhdCdzIHdpbmRvdyBvcGVucyBhdCAwLjA0LCBpbnNpZGUgdGhlIGludHJvIGJhbmQgdGhlIGRyYXdpbmcgb3ducy5cbiAgY29uc3Qgc2hpZnRCZWF0ID1cbiAgICAhaXNTdGF0aWNNb2RlICYmIHByb2dyZXNzID4gRFJBV0lOR19JTlRST19XSU5ET1cucmVsZWFzZUVuZCAmJiBpc1NoaWZ0QmVhdE9uKHByb2dyZXNzKVxuICBjb25zdCBleHBsb2RlQmVhdCA9ICFpc1N0YXRpY01vZGUgJiYgaXNFeHBsb2RlQmVhdE9uKHByb2dyZXNzKVxuICBjb25zdCBsY2RCZWF0ID0gIWlzU3RhdGljTW9kZSAmJiBpc0xjZEJlYXRPbihwcm9ncmVzcylcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICB7LyogMC4gQXV0aG9yc2hpcCBsYXllciDigJQgTWFyaydzIGlkZW50aXR5IGFuZCBwZXJzb25hbCBtYXJnaW4gbm90ZSwgaW1tZWRpYXRlIGluIGV2ZXJ5IHRpZXJcbiAgICAgICAgICAgICAobmV2ZXIgZ2F0ZWQgb24gdGhlIGNhbnZhcy9HTEIgb3IgdGhlIGRyYXdpbmcgYW5ub3RhdGlvbnMpIGFuZCB0aGUgc3RhdGljIGVxdWl2YWxlbnRcbiAgICAgICAgICAgICBmb3IgdGhlIHBvc3RlciAvIHJlZHVjZWQtbW90aW9uIHRpZXJzLiAqL31cbiAgICAgIDxBdXRob3JzaGlwTm90ZXMgLz5cblxuICAgICAgey8qIDEuIExlZnQtSGFuZCBOYXJyYXRpdmUgR3JpZCBPdmVybGF5IChGaXhlZCwgei0xMCkgKi99XG4gICAgICB7IWlzU3RhdGljTW9kZSA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHBvaW50ZXItZXZlbnRzLW5vbmUgei0xMCBncmlkIGdyaWQtY29scy0xMiBwLTYgbWQ6cC0xMiBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgICB7Q0hBUFRFUlMubWFwKChjaGFwdGVyRGVmKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYXNlU3R1ZHkgPSBDQVNFX1NUVURJRVMuZmluZCgoY3MpID0+IGNzLmNoYXB0ZXIgPT09IGNoYXB0ZXJEZWYuaW5kZXgpXG4gICAgICAgICAgICBjb25zdCBbc3RhcnQsIGVuZF0gPSBDSEFQVEVSX1JBTkdFU1tjaGFwdGVyRGVmLmluZGV4XSA/PyBbMCwgMV1cblxuICAgICAgICAgICAgY29uc3QgZmFkZUluID0gTWF0aC5taW4oTWF0aC5tYXgoKHByb2dyZXNzIC0gc3RhcnQpIC8gMC4wMzUsIDApLCAxKVxuICAgICAgICAgICAgY29uc3QgZmFkZU91dCA9IE1hdGgubWluKE1hdGgubWF4KChlbmQgLSBwcm9ncmVzcykgLyAwLjAzNSwgMCksIDEpXG4gICAgICAgICAgICAvLyBDSC4wMSdzIHJhbmdlIG9wZW5zIGF0IDAuMDAsIHdoaWNoIHRoZSBCMS9CMiBpbnRybyBub3cgb3ducyBvdXRyaWdodDpcbiAgICAgICAgICAgIC8vIGhvbGQgaXRzIGNhcmQgYmFjayB1bnRpbCB0aGUgZHJhd2luZyBoYXMgaGFuZGVkIG9mZi5cbiAgICAgICAgICAgIGNvbnN0IGFmdGVySW50cm8gPVxuICAgICAgICAgICAgICBjaGFwdGVyRGVmLmluZGV4ID09PSAwXG4gICAgICAgICAgICAgICAgPyBNYXRoLm1pbihNYXRoLm1heCgocHJvZ3Jlc3MgLSBEUkFXSU5HX0lOVFJPX1dJTkRPVy5yZWxlYXNlRW5kKSAvIDAuMDIsIDApLCAxKVxuICAgICAgICAgICAgICAgIDogMVxuICAgICAgICAgICAgY29uc3Qgb3BhY2l0eSA9IE1hdGgubWluKGZhZGVJbiwgZmFkZU91dCkgKiBhZnRlckludHJvXG5cbiAgICAgICAgICAgIGlmIChvcGFjaXR5IDw9IDAuMDAxKSByZXR1cm4gbnVsbFxuXG4gICAgICAgICAgICAvLyBDSC4wMS9DSC4wMiBvd24gdGhlIG1lY2hhbmljYWwgcmV2ZWFsIHdpbmRvd3Mg4oCUIHRyYW5zcGFyZW50IGVkZ2VcbiAgICAgICAgICAgIC8vIGNhcHRpb24gaW5zdGVhZCBvZiB0aGUgZ2xhc3MgY2FyZCAoSkctMDE0KS5cbiAgICAgICAgICAgIGNvbnN0IGlzTWVjaGFuaWNhbENoYXB0ZXIgPSBjaGFwdGVyRGVmLmluZGV4ID09PSAwIHx8IGNoYXB0ZXJEZWYuaW5kZXggPT09IDFcblxuICAgICAgICAgICAgaWYgKGlzTWVjaGFuaWNhbENoYXB0ZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBrZXk9e2NoYXB0ZXJEZWYuaW5kZXh9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJjb2wtc3Bhbi0xMiBtZDpjb2wtc3Bhbi00IG1heC13LVszMHZ3XSBtYXgtbWQ6bWF4LXctZnVsbCBzZWxmLXN0YXJ0IHB0LVs5dmhdIGZsZXggZmxleC1jb2wgdHJhbnNpdGlvbi1vcGFjaXR5IGR1cmF0aW9uLTE1MFwiXG4gICAgICAgICAgICAgICAgICBzdHlsZT17eyBvcGFjaXR5IH19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lIFt0ZXh0LXNoYWRvdzowXzFweF8xMHB4X3JnYmEoMCwwLDAsMC45KV1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmb250LW1vbm8gdGV4dC14cyB0ZXh0LWN5YW4tNDAwIG1iLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0cmFja2luZy1bMC4yZW1dXCI+e2NoYXB0ZXJEZWYubGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHtjaGFwdGVyRGVmLmluZGV4ID09PSAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwXCI+Ly88L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtY3lhbi0yMDAgdHJhY2tpbmctd2lkZXJcIj57QVNTRU1CTFlfSURFTlRJVFkubWFjaGluZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQteGwgbWQ6dGV4dC0yeGwgZm9udC1ib2xkIHRyYWNraW5nLXRpZ2h0IHRleHQtc2xhdGUtMTAwIG1iLTIgZm9udC1zYW5zIGxlYWRpbmctdGlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7Y2hhcHRlckRlZi5pbmRleCA9PT0gMCA/ICdGcm9tIGRyYXdpbmcgdG8gbWFjaGluaW5nJyA6IGNoYXB0ZXJEZWYudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvaDI+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1zbGF0ZS0zMDAgbWItMyBsZWFkaW5nLXJlbGF4ZWQgZm9udC1zYW5zXCI+XG4gICAgICAgICAgICAgICAgICAgICAge2NoYXB0ZXJEZWYuc3VidGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAge2NoYXB0ZXJEZWYuaW5kZXggPT09IDAgJiYgZ2VhcmJveFN0dWR5ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGl0YWxpYyB0ZXh0LXNsYXRlLTIwMCBtYi0zIGxlYWRpbmctcmVsYXhlZCBmb250LXNhbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtnZWFyYm94U3R1ZHkub25lTGluZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICB7Y2hhcHRlckRlZi5pbmRleCA9PT0gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHMgdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS00MDAgYm9yZGVyLWwtMiBib3JkZXItY3lhbi01MDAvNDAgcGwtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAge0FTU0VNQkxZX0lERU5USVRZLnNwZWN9XG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBPbi1kZW1hbmQgY2FzZS1zdHVkeSBzdXJmYWNlIOKAlCBjb2xsYXBzZWQgd2hpbGUgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgbWVjaGFuaXNtIG93bnMgdGhlIHZpZXdwb3J0OyBmaWxsZWQgY2FyZCBvbmx5IGFmdGVyIGFuXG4gICAgICAgICAgICAgICAgICAgICAgZXhwbGljaXQgdXNlciByZXF1ZXN0LiAqL31cbiAgICAgICAgICAgICAgICAgIHtjaGFwdGVyRGVmLmluZGV4ID09PSAxICYmIGNhc2VTdHVkeSAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtYXV0byBtdC00XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWV4cGFuZGVkPXtvcGVuU3R1ZHkgPT09IGNhc2VTdHVkeS5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtY29udHJvbHM9XCJnZWFyYm94LWNhc2Utc3R1ZHlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0T3BlblN0dWR5KG9wZW5TdHVkeSA9PT0gY2FzZVN0dWR5LmlkID8gbnVsbCA6IGNhc2VTdHVkeS5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmb250LW1vbm8gdGV4dC1bMTBweF0gdHJhY2tpbmctWzAuMmVtXSB0ZXh0LWN5YW4tMzAwIGJvcmRlciBib3JkZXItY3lhbi00MDAvNTAgcHgtMyBweS0xLjUgYmctYmxhY2svNzAgYmFja2Ryb3AtYmx1ci1zbSByb3VuZGVkIHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOmJvcmRlci1jeWFuLTMwMCBob3Zlcjp0ZXh0LWN5YW4tMTAwIGZvY3VzLXZpc2libGU6cmluZy0yIGZvY3VzLXZpc2libGU6cmluZy1jeWFuLTMwMCBmb2N1cy12aXNpYmxlOnJpbmctb2Zmc2V0LTIgZm9jdXMtdmlzaWJsZTpyaW5nLW9mZnNldC1ibGFjayBvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtvcGVuU3R1ZHkgPT09IGNhc2VTdHVkeS5pZCA/ICdbIOKIkiBDTE9TRSBDQVNFIFNUVURZIF0nIDogJ1sgKyBDQVNFIFNUVURZIF0nfVxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIHtvcGVuU3R1ZHkgPT09IGNhc2VTdHVkeS5pZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiZ2VhcmJveC1jYXNlLXN0dWR5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMyBtYXgtdy1bMzByZW1dIGJnLXNsYXRlLTk1MC84NSBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMC84MCBwLTUgcm91bmRlZC14bCBiYWNrZHJvcC1ibHVyLW1kIHNoYWRvdy0yeGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2FzZVN0dWR5Qm9keSBjYXNlU3R1ZHk9e2Nhc2VTdHVkeX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtjaGFwdGVyRGVmLmluZGV4fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNvbC1zcGFuLTEyIG1kOmNvbC1zcGFuLTUgbWF4LXctWzQydnddIG1heC1tZDptYXgtdy1mdWxsIGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgdHJhbnNpdGlvbi1vcGFjaXR5IGR1cmF0aW9uLTE1MFwiXG4gICAgICAgICAgICAgICAgc3R5bGU9e3sgb3BhY2l0eSB9fVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1hdXRvIGJvcmRlciBwLTQgbWQ6cC02IHJvdW5kZWQteGwgYm9yZGVyLXNsYXRlLTgwMC84MCBiZy1zbGF0ZS05NTAvODAgYmFja2Ryb3AtYmx1ci1tZCBzaGFkb3ctMnhsXCI+XG4gICAgICAgICAgICAgICAgICB7LyogQ2hhcHRlciBUYWcgJiBJZGVudGl0eSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgZm9udC1tb25vIHRleHQteHMgdGV4dC1jeWFuLTQwMCBtYi0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRyYWNraW5nLVswLjJlbV1cIj57Y2hhcHRlckRlZi5sYWJlbH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIFRpdGxlICovfVxuICAgICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtMnhsIG1kOnRleHQtM3hsIGZvbnQtYm9sZCB0cmFja2luZy10aWdodCB0ZXh0LXNsYXRlLTEwMCBtYi0zIGZvbnQtc2FucyBsZWFkaW5nLXRpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICAgIHtjaGFwdGVyRGVmLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgPC9oMj5cblxuICAgICAgICAgICAgICAgICAgey8qIFN1YnRpdGxlICovfVxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LXNsYXRlLTMwMCBtYi00IGxlYWRpbmctcmVsYXhlZCBmb250LXNhbnNcIj5cbiAgICAgICAgICAgICAgICAgICAge2NoYXB0ZXJEZWYuc3VidGl0bGV9XG4gICAgICAgICAgICAgICAgICA8L3A+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBDYXNlIFN0dWR5IERldGFpbHMgKi99XG4gICAgICAgICAgICAgICAgICB7Y2FzZVN0dWR5ICYmIDxDYXNlU3R1ZHlCb2R5IGNhc2VTdHVkeT17Y2FzZVN0dWR5fSAvPn1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApXG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgLyogUmVkdWNlZCBNb3Rpb24gLyBQb3N0ZXIgVGllciBTdGF0aWMgRmFsbGJhY2suXG4gICAgICAgICAgIEpHLTAyMjogZXhhY3RseSBvbmUgY2FyZCBhdCBhIHRpbWUsIGhlbGQgaW4gYSBmaXhlZCBwb2ludGVyLWV2ZW50cy1ub25lXG4gICAgICAgICAgIG92ZXJsYXkgc28gaXQgc3RheXMgdmlzaWJsZSB0aHJvdWdoIHRoZSB3aG9sZSBuYXRpdmUgc2Nyb2xsIHRyYWNrLiBJbiBub3JtYWxcbiAgICAgICAgICAgZG9jdW1lbnQgZmxvdyB0aGUgY2FyZCBzYXQgYXQgdGhlIGRvY3VtZW50IHRvcCBhbmQgc2Nyb2xsZWQgb3V0IG9mIHZpZXcg4oCUXG4gICAgICAgICAgIGNoYXB0ZXJzIDHigJMzIHN3YXBwZWQgY29udGVudCBpbnZpc2libHkgYWJvdmUgdGhlIHZpZXdwb3J0IChwb3N0ZXIgZTJlLFxuICAgICAgICAgICAyMDI2LTA5LTI4KS4gVGhlIGNhcmQncyB0cmFuc2x1Y2VudCBwYW5lbCByZWFkcyBvdmVyIHRoZSBzdGF0aWMgZHJhd2luZ1xuICAgICAgICAgICBmcmFtZSBiZWhpbmQgaXQ7IGl0cyBvd24gc2Nyb2xsIGFyZWEga2VlcHMgdGFsbCBjYXNlIHN0dWRpZXMgcmVhY2hhYmxlIG9uXG4gICAgICAgICAgIHNtYWxsIHZpZXdwb3J0cy4gKi9cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotMTAgZmxleCBpdGVtcy1jZW50ZXIgcC02IG1kOnAtMTIgcG9pbnRlci1ldmVudHMtbm9uZVwiPlxuICAgICAgICAgIHtDSEFQVEVSUy5tYXAoKGNoYXB0ZXJEZWYpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhc2VTdHVkeSA9IENBU0VfU1RVRElFUy5maW5kKChjcykgPT4gY3MuY2hhcHRlciA9PT0gY2hhcHRlckRlZi5pbmRleClcbiAgICAgICAgICAgIC8vIFBvc3RlciB0aWVyIGluY2x1ZGVkOiBvbmUgY2FyZCBhdCBhIHRpbWUgaXMgdGhlIHdob2xlIHBvaW50IG9mIEpHLTAyMi5cbiAgICAgICAgICAgIGlmIChzdGF0aWNDaGFwdGVyICE9PSBjaGFwdGVyRGVmLmluZGV4KSByZXR1cm4gbnVsbFxuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtjaGFwdGVyRGVmLmluZGV4fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInBvaW50ZXItZXZlbnRzLWF1dG8gbWF4LXcteGwgbWF4LWgtW2NhbGMoMTAwdmgtOXJlbSldIG92ZXJmbG93LXktYXV0byBiZy1zbGF0ZS05NTAvODUgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvODAgcC02IG1kOnAtOCByb3VuZGVkLXhsXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtjaGFwdGVyRGVmLmluZGV4ID09PSAwICYmIDxBdXRob3JzaGlwSW5saW5lIC8+fVxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbW9ubyB0ZXh0LXhzIHRyYWNraW5nLVswLjJlbV0gdGV4dC1jeWFuLTQwMCBtYi0yXCI+e2NoYXB0ZXJEZWYubGFiZWx9PC9wPlxuICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBtZDp0ZXh0LTN4bCBmb250LWJvbGQgdHJhY2tpbmctdGlnaHQgdGV4dC1zbGF0ZS0xMDAgbWItMyBmb250LXNhbnNcIj57Y2hhcHRlckRlZi5pbmRleCA9PT0gMCA/ICdGcm9tIGRyYXdpbmcgdG8gbWFjaGluaW5nJyA6IGNoYXB0ZXJEZWYudGl0bGV9PC9oMj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtc2xhdGUtMzAwIG1iLTQgbGVhZGluZy1yZWxheGVkIGZvbnQtc2Fuc1wiPntjaGFwdGVyRGVmLnN1YnRpdGxlfTwvcD5cbiAgICAgICAgICAgICAgICB7Y2hhcHRlckRlZi5pbmRleCA9PT0gMCAmJiBnZWFyYm94U3R1ZHkgJiYgKFxuICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LXNsYXRlLTIwMCBtYi00IGxlYWRpbmctcmVsYXhlZFwiPntnZWFyYm94U3R1ZHkub25lTGluZXJ9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8ZGV0YWlscyBjbGFzc05hbWU9XCJhdXRob3JzaGlwLWRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3VtbWFyeT5SZWFkIG15IG1hY2hpbmluZyBkZWNpc2lvbnM8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgICAgPENhc2VTdHVkeUJvZHkgY2FzZVN0dWR5PXtnZWFyYm94U3R1ZHl9IC8+XG4gICAgICAgICAgICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAge2Nhc2VTdHVkeSAmJiA8Q2FzZVN0dWR5Qm9keSBjYXNlU3R1ZHk9e2Nhc2VTdHVkeX0gLz59XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiAyLiBBY3RpdmUgbWVjaGFuaWNhbCBiZWF0IGFubm90YXRpb24g4oCUIGJvdHRvbS1sZWZ0IGVkZ2UgY2FwdGlvbixcbiAgICAgICAgICBvbmUgYXQgYSB0aW1lIChKRy0wMTQpLiAqL31cbiAgICAgIHtzaGlmdEJlYXQgJiYgKFxuICAgICAgICA8QmVhdENhcHRpb24ga2lja2VyPVwiUDAwMDQyMCAvLyAyLVNQRUVEIFNISUZUIE1FQ0hBTklTTVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjUgdGV4dC1bMTFweF1cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC1jeWFuLTIwMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgaC0yLjUgdy0yLjUgcm91bmRlZC1zbSBiZy1bIzAwNURBQV1cIiAvPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkXCI+TE9XRVIgR1JPT1ZFIE9TSEEgQkxVRTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDBcIj7CtyBMT1cgU1BFRUQ8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC1jeWFuLTMwMC85MCBwbC00IHRleHQtWzEwcHhdXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtY3lhbi00MDBcIj7ilrg8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPjNYIEAxMjDCsCBIRUxJQ0FMIENBTSBTTE9UUzwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LWN5YW4tMjAwXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImlubGluZS1ibG9jayBoLTIuNSB3LTIuNSByb3VuZGVkLXNtIGJnLVsjQzgxMDJFXVwiIC8+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtc2VtaWJvbGRcIj5VUFBFUiBHUk9PVkUgT1NIQSBSRUQ8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwXCI+wrcgSElHSCBTUEVFRDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0JlYXRDYXB0aW9uPlxuICAgICAgKX1cblxuICAgICAge2V4cGxvZGVCZWF0ICYmIChcbiAgICAgICAgPEJlYXRDYXB0aW9uIGtpY2tlcj1cIlJFQVIgRVhUUkFDVElPTiDigJQgRFJJVkVMSU5FIE9SREVSXCI+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdHJhY2tpbmctd2lkZXIgdGV4dC1zbGF0ZS0zMDBcIj5cbiAgICAgICAgICAgIFAwMDMwNDcg4oaSIFAwMDMwNDUg4oaSIFAwMDE4NDkg4oaSIEswMDAwMDQg4oaSIFAwMDE4Mzcg4oaSIFAwMDE4MzZcbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvQmVhdENhcHRpb24+XG4gICAgICApfVxuXG4gICAgICB7bGNkQmVhdCAmJiAoXG4gICAgICAgIDxCZWF0Q2FwdGlvbiBraWNrZXI9XCJESUdJVEFMIFRFTEVNRVRSWSAvLyBSRUFSIEVORENBUFwiPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtMjAwIGZvbnQtc2VtaWJvbGQgbWItMVwiPlNtYXJ0LVRvb2wgSW5zdHJ1bWVudCBJbnRlcmZhY2U8L3A+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdHJhY2tpbmctd2lkZSB0ZXh0LXNsYXRlLTQwMFwiPlxuICAgICAgICAgICAgTUFOT01FVEVSIExDRCAoQksxMTM1NikgwrcgTVNQNDMwIE1DVSDCtyAzLjdWIExpUG8gQ0VMTFxuICAgICAgICAgIDwvcD5cbiAgICAgICAgPC9CZWF0Q2FwdGlvbj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiAzLiBTY3JvbGwgU2VjdGlvbnM6IFByb3ZpZGVzIHRoZSBzY3JvbGwgaGVpZ2h0IGZvciBMZW5pcyArIFNjcm9sbFRyaWdnZXIuXG4gICAgICAgICAgICAgVGhlIGludHJvIHRyYWNrIGNhcnJpZXMgbm8gYGRhdGEtY2hhcHRlcmAsIHNvIFNjcm9sbFJpZydzIHBlci1jaGFwdGVyXG4gICAgICAgICAgICAgdHJpZ2dlcnMgYW5kIHRoZSBoZXJvIHRpbWVsaW5lJ3MgYFtkYXRhLWNoYXB0ZXI9XCIxXCJdYCBzZWxlY3RvciBhcmVcbiAgICAgICAgICAgICB1bmFmZmVjdGVkIGJ5IGl0cyBwcmVzZW5jZS4gKi99XG4gICAgICB7LyogVGhlIHRyYWNrIHN1cHBsaWVzIGhlaWdodCBvbmx5LiBLZWVwaW5nIGl0IHBvaW50ZXItaW5lcnQgbGV0cyBuYXRpdmVcbiAgICAgICAgICBoaXQgdGVzdGluZyByZWFjaCB0aGUgZml4ZWQgY2FudmFzIHdoZXJlIG5vIGNoYXB0ZXIgY29udHJvbCBleGlzdHMuICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB6LTAgcG9pbnRlci1ldmVudHMtbm9uZSBbJl86aXMoYnV0dG9uLGEsW3JvbGU9J2J1dHRvbiddKV06cG9pbnRlci1ldmVudHMtYXV0b1wiPlxuICAgICAgICA8c2VjdGlvblxuICAgICAgICAgIGRhdGEtaW50cm89XCJiMWIyXCJcbiAgICAgICAgICBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lXCJcbiAgICAgICAgICBzdHlsZT17eyBtaW5IZWlnaHQ6IGAke1NDUk9MTF9UUkFDS19WSC5pbnRyb312aGAgfX1cbiAgICAgICAgLz5cbiAgICAgICAge0NIQVBURVJTLm1hcCgoY2hhcHRlckRlZikgPT4gKFxuICAgICAgICAgIDxzZWN0aW9uXG4gICAgICAgICAgICBrZXk9e2NoYXB0ZXJEZWYuaW5kZXh9XG4gICAgICAgICAgICBkYXRhLWNoYXB0ZXI9e2NoYXB0ZXJEZWYuaW5kZXh9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lXCJcbiAgICAgICAgICAgIHN0eWxlPXt7IG1pbkhlaWdodDogYCR7U0NST0xMX1RSQUNLX1ZILmNoYXB0ZXJzW2NoYXB0ZXJEZWYuaW5kZXhdID8/IFNDUk9MTF9UUkFDS19WSC5jaGFwdGVyc1sxXX12aGAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICApKX1cblxuICAgICAgICA8Zm9vdGVyXG4gICAgICAgICAgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtbm9uZSBmbGV4IGl0ZW1zLWVuZCBweC1bOHZ3XSBwYi0xNlwiXG4gICAgICAgICAgc3R5bGU9e3sgaGVpZ2h0OiBgJHtTQ1JPTExfVFJBQ0tfVkguZm9vdGVyfXZoYCB9fVxuICAgICAgICA+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHMgdHJhY2tpbmctd2lkZXN0IHRleHQtemluYy01MDBcIj5cbiAgICAgICAgICAgIEJVSUxUIFdJVEggUkVBQ1QgMTkgwrcgUjNGIMK3IEdTQVAgwrcgTEVOSVMg4oCUIFRIRSBTQU1FIEhBTkRTIFRIQVQgSE9MRCAuMDAxXCIgVElSXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Zvb3Rlcj5cbiAgICAgIDwvZGl2PlxuICAgIDwvPlxuICApXG59XG4iXSwiZmlsZSI6IkM6L1VzZXJzL01hcmtpbXVzLy5idXp6L1JFUE9TL2pndW4tcG9ydGZvbGlvL3NyYy9jb21wb25lbnRzL0NoYXB0ZXJzLnRzeCJ9