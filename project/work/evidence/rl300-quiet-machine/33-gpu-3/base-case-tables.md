## C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/33-gpu-3/base-1440x900/report.json  result=PASS viewport=1440x900 gateIncomplete=[] browser=154.0.8037.98
| case | status | key measurements | message |
|---|---|---|---|
| fade-out | PASS |  | click landed on an a[data-fade] link; data-fade="out" 1 ms after the click (limit 100); sessionStorage['jg:fade'] set with the attribute; html[data-fade="out"] with the flag observed from the test side; URL became / 432 ms after the click (limit 1450); exactly one shell-fade-out animationend on the root, 400 ms after the click ( |
| synthetic-arrival | PASS | timeToReleaseMs=2150; dclFade="in" | data-fade="in" was set by the head shell script; data-fade at DOMContentLoaded was "in" (want "in"); the attribute was removed; removed 2041.3 ms after mount (bound 3600 = cap 2500 + fade 600 + slack 500); released for reason "ready"; sessionStorage['jg:fade'] consumed on arrival |
| back | PASS | persisted=true; disableBackForwardCacheFlagStillOnCommandLine=false; judgedFrom="pageshow snapshot"; pageshowFadeAfterSettle=null | no data-fade after Back; 1 canvas present; __quietMachine.ready holds; no .qm-poster |
| reduced-motion-cut | PASS |  | click recorded; click navigated to /; no data-fade="out"; no storage key |
| legacy-redirect | PASS |  | ended at /quiet-machine/?quality=lite; history length 2 after the redirect vs 2 for a direct load (equal means the redirect added no entry) |
| no-white-frame | PASS | darkFraction=1; brightFraction=0 | bright fraction 0 (limit 0.2, luma > 0.85) with the stylesheets emptied and the cover up |
| reduced-motion-arrival | PASS |  | data-fade never took a value; sessionStorage['jg:fade'] absent after load; page rendered (poster) |
## C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/33-gpu-3/base-390x844/report.json  result=PASS viewport=390x844 gateIncomplete=[] browser=154.0.8037.98
| case | status | key measurements | message |
|---|---|---|---|
| fade-out | PASS |  | click landed on an a[data-fade] link; data-fade="out" 1.3 ms after the click (limit 100); sessionStorage['jg:fade'] set with the attribute; html[data-fade="out"] with the flag observed from the test side; URL became / 434 ms after the click (limit 1450); exactly one shell-fade-out animationend on the root, 400 ms after the click |
| synthetic-arrival | PASS | timeToReleaseMs=1926.6; dclFade="in" | data-fade="in" was set by the head shell script; data-fade at DOMContentLoaded was "in" (want "in"); the attribute was removed; removed 1831.2 ms after mount (bound 3600 = cap 2500 + fade 600 + slack 500); released for reason "ready"; sessionStorage['jg:fade'] consumed on arrival |
| back | PASS | persisted=true; disableBackForwardCacheFlagStillOnCommandLine=false; judgedFrom="pageshow snapshot"; pageshowFadeAfterSettle=null | no data-fade after Back; 1 canvas present; __quietMachine.ready holds; no .qm-poster |
| reduced-motion-cut | PASS |  | click recorded; click navigated to /; no data-fade="out"; no storage key |
| legacy-redirect | PASS |  | ended at /quiet-machine/?quality=lite; history length 2 after the redirect vs 2 for a direct load (equal means the redirect added no entry) |
| no-white-frame | PASS | darkFraction=1; brightFraction=0 | bright fraction 0 (limit 0.2, luma > 0.85) with the stylesheets emptied and the cover up |
| reduced-motion-arrival | PASS |  | data-fade never took a value; sessionStorage['jg:fade'] absent after load; page rendered (poster) |
