# Metrology asset source

Fourteen render-only tools for the torque-wrench drafting table. Dimensions are
metres; authoring uses +Z height and +X as the long/rolling axis. These are visual
interpretations of the owner's tool descriptions, not certified measuring tools
or manufacturing CAD.

The build exports named roots to `public/models/metrology-tools.glb` with Draco
geometry. Markings are mesh geometry; runtime finish and contact-shadow maps are
deterministic DataTextures. No external textures, KTX2, Basis, or remote decoder
is required. Repeated gauge blocks and pin bodies share mesh data.

Run from this repository with Blender 5.2.2 (tested) and Python with Pillow for
the contact sheet:

```powershell
$blender = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/metrology/build.py -- (Get-Location).Path
& $blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/metrology/roundtrip.py -- (Get-Location).Path
& $blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/metrology/render.py -- (Get-Location).Path
python scripts/metrology/contact_sheet.py (Get-Location).Path
```

The build checks the 120,000 triangle and 1,500,000 gzipped-byte budgets. The
round-trip script independently imports the GLB and compares all 14 roots within
0.1 mm. Generated blends, reports and 42 three-angle renders go only into
`.scratch/metrology-review/`. Do not commit that directory.

The runtime rotates the glTF Y-up roots by +PI/2 about X. Cylinder-axis pivots
are separate from sole support: an inner translation establishes each rolling
axis, and the convex YZ support profile keeps the lowest rotated vertex on the
table. Conservative oriented rectangles bound every asset vertex, including
the full rolling envelope; swept footprints reject unsafe translation/yaw.
Home positions differ from the rejected prototype where necessary to clear
the drawing, plate edge and neighbouring tools. The indicator is posed beside
the V-block shaft end rather than above the shaft.

Full and lite tiers share the asset; lite hides `detail-*` mesh groups. Main
bevels, markings and silhouettes remain. This reduces rendered triangles, not
download bytes. Triangle-projected blurred contact masks replace loading-time
capsule shadows after the asset is ready.

Verification:

```powershell
$env:NODE_OPTIONS='--preserve-symlinks --preserve-symlinks-main'
node ./node_modules/vitest/vitest.mjs run --maxWorkers=1 --testTimeout=60000
npm run build
node scripts/verify-launch-dist.mjs
node scripts/verify-metrology-workbench.mjs --url=http://localhost:5199/torque-wrench/
```

Start a fresh preview server after every build. The browser verifier records
real scene renderer counters with props visible, hidden by material, and
restored. Culled props contribute no calls; measured viewport deltas are not
the all-14 asset triangle total. Geometry counts and texture counts measure
resident GPU resources, so hiding materials does not free them.
