# remotion/clips: modular film clips

Each clip is a self-contained, reusable render. The showreel may use all of them, but any one can be lifted into another page or site without the rest of the film.

## Layout
```
remotion/clips/
  README.md                this file (the clip contract)
  armament/
    manifest.json          models (provenance, label rule) + finished clips; local-paths.json (gitignored) holds the per-machine model paths
    blender/render_clip.py Blender 5.2.x: line pass (ink on white) + shade pass (clay on transparent)
    modal/launch.py        Modal launcher (dry run by default; --execute --max-usd to spend)
    <clip-id>/             FINISHED frames only, plus clip.json
      clip.json            id, model, fps, frame count, passes, loop, how to composite
      line/f0000.webp ...  ink linework, white fill (composite with mix-blend-mode: multiply)
      shade/f0000.webp ... clay shading, transparent
project/work/plans/JG-041-armament-act.md       the plan
project/work/evidence/JG-041-armament-act/      issues log, stills, test reports
```

## Rules
1. Models never enter the repo. `manifest.json` points at local files and records provenance (`mine` or `representative`).
2. Only finished frames are committed. Smoke tests and scratch renders live under `C:\Projects\CAD\Armament\renders\`.
3. Committed names are neutral (`ar15-pattern-...`). No third-party brand or model designations in filenames, `clip.json` or on screen.
4. Every clip declares its composite recipe in `clip.json`, so a consumer needs no knowledge of the film.
5. No wiring into `ArmamentAct.tsx` or the site from this folder; that is a separate, reviewed change on the film branch.

## Open
Where Remotion reads the frames from (`public/` is the site's and ships unless excluded). To be decided at wiring time.
