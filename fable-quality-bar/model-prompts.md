# Per-model prompts for the seven motion reference sites

Order: GLM first (one site per run, in parallel), then Codex on GLM's output, then Gemini on the screen recordings, then Claude merges.
Each run writes into `research/<slug>/capture.md` using `capture-template.md`. Replace `<SLUG>` and `<URL>` before running.

Shared guardrails (paste at the end of every prompt)
> Only read the public page. Don't sign in, submit forms or accept anything beyond dismissing a cookie banner. Record techniques and settings, never paste asset files, full shader source or long code blocks (a few identifying lines at most). Mark every claim [seen] or [inferred]. Write `unknown` rather than guess.

---

## 1. GLM + REA (stack, assets, load sequence) — sections 0, 1, 2, 3, 8

```
You are reverse engineering the public website <URL> for motion and 3D technique research.
Use the REA (Reverse Engineer Anything) tools with a Chrome-family browser.

1. Load <URL> at 1440x900, then at 390x844. Capture the network log for each load.
2. Fingerprint the stack: three.js / R3F / other WebGL, GSAP version and every plugin registered, smooth-scroll library, framework, page-transition library, Rive/Lottie. Give the evidence (bundle file, global variable, version string).
3. Inventory every 3D, texture, video and audio asset: type, transferred size, compression, and whether it loads initially, lazily or on scroll. Note if mobile gets different files.
4. Write the load sequence as a timeline in ms from navigation start to interactive 3D.
5. Check: prefers-reduced-motion handling, text in DOM vs canvas, pinch zoom, no-WebGL fallback.
6. Record route transitions: click one internal link, note what animates out and in, and whether the WebGL canvas survives.
7. Record a 10 s Chrome Performance trace while scrolling top to bottom: FPS, long tasks, JS size. Fill section 8b.
8. List the source files and functions that drive scroll, animation and the 3D scene, with file names and line ranges, for the next model to read.

Fill sections 0, 1, 2, 3, 4b, 8 and 8b of capture-template.md and save to research/<SLUG>/capture.md.
Save the file list from step 8 to research/<SLUG>/hotspots.md.
```

## 2. Codex (effects as plain settings) — sections 4, 5, 6

```
Read research/<SLUG>/capture.md and research/<SLUG>/hotspots.md, then read the flagged source (deminified where needed).

For every animated effect, write one row in section 5 of the template:
trigger, what moves, property, from → to, duration or scroll span, easing (exact GSAP ease string or cubic-bezier), stagger.
Fill section 4c (hover, press and cursor effects), section 4 (smooth-scroll settings, pinned sections with start/end/scrub) and section 6 (camera path, lighting, materials, post-processing, shader tricks, pointer interaction, frame-rate safeguards).

Describe each shader in words and parameters (inputs, what it displaces or colors), not by copying it.
Update research/<SLUG>/capture.md in place. Don't touch sections written by other models except to add [seen] evidence.
```

## 3. Gemini (timing and feel from the recording) — sections 3, 5, 7

```
Watch the screen recording research/<SLUG>/recording.mp4 of <URL>, from first load to the bottom of the page.

1. Section 3: timestamp every visible load beat (preloader, first text, first 3D frame).
2. Section 5: for each motion beat, add the on-screen duration you measure and a three-word "feel" (for example: heavy, damped, snappy). Match rows Codex already wrote; add rows for anything it missed.
3. Section 7: typefaces (best guess, marked [inferred]), palette as hex, text-reveal style, cursor treatment.
4. Note any moment that stutters or drops frames.

Update research/<SLUG>/capture.md in place.
```

## 4. Claude (merge) — section 9 and the shortlist

Inputs: all seven capture.md files.
Output: a ranked shortlist of 6 to 8 techniques that suit Mark's assemblies (exploded view, section cut, assembly reveal), each with source site(s), settings to start from and rebuild cost, then the Fable prompt section built from it.

---

## One-agent version (if a single REA agent does sections 0 to 8b)

```
Reverse engineer the public site <URL> for motion and 3D technique research, using REA with a Chrome-family browser.
Fill every section 0 to 8b of fable-quality-bar/capture-template.md and save it to research/<SLUG>/capture.md.
Load at 1440x900 and 390x844 with network logs. Scroll top to bottom slowly, hover every interactive element, click one internal link.
For every animated effect write exact settings: trigger, property, from and to, duration or scroll span, GSAP ease string or cubic-bezier, stagger.
Describe shaders in words and parameters. Save the source files and line ranges that drive scroll, animation and 3D to research/<SLUG>/hotspots.md.
```
Then paste the shared guardrails above under it.

---

## Parallel workflow version (GLM orchestrator, one sub-agent per site)

```
You are the orchestrator for a motion and 3D technique research job. Spawn one sub-agent per site below, all in parallel. Each sub-agent works on its own site only.

| Slug | URL |
|---|---|
| oryzo | https://oryzo.ai/ |
| fragment | https://www.fragment.im/ |
| gq-extraordinary-lab | https://www.gq.com/sponsored/story/the-extraordinary-lab |
| dennypratama | https://dennypratama.com/ |
| webdrift | https://www.webdrift.be/en |
| rikoutaku | https://www.rikoutaku.work/ |
| vastworld | https://vastworld.ai/ |
| hanusek | https://www.hanusek.com/ |

Give each sub-agent the task below with <URL> and <SLUG> filled in from its row.

--- SUB-AGENT TASK ---
You are reverse engineering the public website <URL> for motion and 3D technique research.
Use the REA (Reverse Engineer Anything) tools with a Chrome-family browser.

1. Load <URL> at 1440x900, then at 390x844. Capture the network log for each load.
2. Fingerprint the stack: three.js / R3F / other WebGL, GSAP version and every plugin registered, smooth-scroll library, framework, page-transition library, Rive/Lottie. Give the evidence (bundle file, global variable, version string).
3. Inventory every 3D, texture, video and audio asset: type, transferred size, compression, and whether it loads initially, lazily or on scroll. Note if mobile gets different files.
4. Write the load sequence as a timeline in ms from navigation start to interactive 3D.
5. Check: prefers-reduced-motion handling, text in DOM vs canvas, pinch zoom, no-WebGL fallback.
6. Record route transitions: click one internal link, note what animates out and in, and whether the WebGL canvas survives.
7. Record a 10 s Chrome Performance trace while scrolling top to bottom: FPS, long tasks, JS size.
8. List the source files and functions that drive scroll, animation and the 3D scene, with file names and line ranges.

Fill sections 0, 1, 2, 3, 4b, 8 and 8b of fable-quality-bar/capture-template.md and save to research/<SLUG>/capture.md.
Save the file list from step 8 to research/<SLUG>/hotspots.md.
Write only inside research/<SLUG>/. Never edit another site's folder or the template.

Only read the public page. Don't sign in, submit forms or accept anything beyond dismissing a cookie banner. Record techniques and settings, never paste asset files, full shader source or long code blocks (a few identifying lines at most). Mark every claim [seen] or [inferred]. Write unknown rather than guess.
--- END SUB-AGENT TASK ---

When all sub-agents finish, write research/_status.md: one line per slug with done / partial / failed and the reason for anything not done (site wouldn't load, WebGL blocked, bot check). Don't retry a site that blocked the browser; just log it.
```

---

## Parallel workflow version, Codex (one sub-agent per site, after GLM)

```
You are the orchestrator for step 2 of a motion and 3D technique research job. Read research/_status.md. Spawn one sub-agent, in parallel, for every slug marked done or partial. Skip slugs marked failed and list them in your final message.

Slugs: oryzo, fragment, gq-extraordinary-lab, dennypratama, webdrift, rikoutaku, vastworld, hanusek

Give each sub-agent the task below with <SLUG> filled in.

--- SUB-AGENT TASK ---
Read research/<SLUG>/capture.md and research/<SLUG>/hotspots.md, then read the source files hotspots.md flags (from the REA download for this site), deminified where needed.

For every animated effect, write one row in section 5 of capture.md:
trigger, what moves, property, from -> to, duration or scroll span, easing (exact GSAP ease string or cubic-bezier), stagger.
Fill section 4 (smooth-scroll settings, pinned sections with start/end/scrub), section 4c (hover, press and cursor effects) and section 6 (camera path, lighting, materials, post-processing, shader tricks, pointer interaction, frame-rate safeguards).
Describe each shader in words and parameters (inputs, what it displaces or colors), not by copying it.

Update research/<SLUG>/capture.md in place. Don't rewrite sections GLM filled except to add [seen] evidence. Write only inside research/<SLUG>/.
Never paste asset files, full shader source or long code blocks (a few identifying lines at most). Mark every claim [seen] or [inferred]. Write unknown rather than guess.
--- END SUB-AGENT TASK ---

When all sub-agents finish, add a "Codex" column to research/_status.md: done / partial / skipped per slug, with the reason for anything not done.
```

---

## Parallel workflow version, Gemini (one sub-agent per site, after Codex)

```
You are the orchestrator for step 3 of a motion and 3D technique research job. Read research/_status.md. Spawn one sub-agent, in parallel, for every slug that has a screen recording at research/<SLUG>/recording.mp4 (or .mov/.webm). Skip slugs with no recording, and slugs marked failed, and list them in your final message.

| Slug | URL |
|---|---|
| oryzo | https://oryzo.ai/ |
| fragment | https://www.fragment.im/ |
| gq-extraordinary-lab | https://www.gq.com/sponsored/story/the-extraordinary-lab |
| dennypratama | https://dennypratama.com/ |
| webdrift | https://www.webdrift.be/en |
| rikoutaku | https://www.rikoutaku.work/ |
| vastworld | https://vastworld.ai/ |
| hanusek | https://www.hanusek.com/ |

Give each sub-agent the task below with <URL> and <SLUG> filled in from its row.

--- SUB-AGENT TASK ---
Watch the screen recording in research/<SLUG>/ of <URL>, from first load to the bottom of the page. Read research/<SLUG>/capture.md first so you know which effects GLM and Codex already found.

1. Section 3: timestamp every visible load beat (preloader start/end, first text, first 3D frame, page interactive), as mm:ss.ms from the start of the recording.
2. Section 5: for each motion beat, add the on-screen duration you measure and a three-word "feel" (for example: heavy, damped, snappy). Match the rows Codex already wrote; add new rows, marked [seen in video], for anything it missed.
3. Section 7: typefaces (best guess, marked [inferred]), palette as hex, text-reveal style, cursor treatment.
4. Note every moment that stutters, drops frames or pops in late, with its timestamp.
5. Where the video contradicts a Codex setting (for example a duration that looks twice as long), keep Codex's value and add your measurement beside it marked [video differs].

Update research/<SLUG>/capture.md in place. Don't delete or rewrite other models' entries. Write only inside research/<SLUG>/.
Mark every claim [seen] or [inferred]. Write unknown rather than guess.
--- END SUB-AGENT TASK ---

When all sub-agents finish, add a "Gemini" column to research/_status.md: done / partial / skipped per slug, with the reason for anything not done.
```
